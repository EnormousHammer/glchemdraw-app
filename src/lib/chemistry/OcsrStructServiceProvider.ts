/**
 * Hybrid StructServiceProvider: Standalone + OCSR via our Vercel API.
 * Enables Ketcher's "Recognize" button without a separate backend.
 * Uses free naturalproducts.net API proxied through /api/ocsr.
 */

import { StandaloneStructServiceProvider } from 'ketcher-standalone';

const OCSR_API = '/api/ocsr';

function getOcsrBaseUrl(): string {
  if (typeof window === 'undefined') return OCSR_API;
  return window.location.origin + OCSR_API;
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.includes(',') ? result.split(',')[1]! : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const standalone = new StandaloneStructServiceProvider();

export class OcsrStructServiceProvider {
  mode = standalone.mode;

  createStructService(options?: unknown): unknown {
    // ketcher-react createApi expects createStructService to return the service SYNCHRONOUSLY
    // and immediately calls structService.info(). Returning a Promise causes "o.info is not a function".
    const create = (standalone as { createStructService: (o?: unknown) => Record<string, unknown> }).createStructService;
    const svc = create(options);
    // Mutate the original service so prototype methods (info, convert, etc.) are preserved.
    (svc as Record<string, unknown>).imagoVersions = ['1'];
    (svc as Record<string, unknown>).recognize = async (blob: Blob, _version: string): Promise<{ struct: string }> => {
      const base64 = await blobToBase64(blob);
      const res = await fetch(getOcsrBaseUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error((err as { error?: string; details?: string }).error || (err as { details?: string }).details || 'Recognition failed');
      }

      const data = (await res.json()) as { struct?: string; smiles?: string };
      const struct = data.struct || data.smiles;
      if (!struct || typeof struct !== 'string') {
        throw new Error('No structure recognized');
      }
      return { struct };
    };
    return svc;
  }
}
