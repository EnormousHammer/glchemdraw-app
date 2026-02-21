/**
 * OpenAI client - calls proxy to keep API key server-side
 * Local: npm run dev:proxy (localhost:3001)
 * Vercel: /api/openai/chat (serverless)
 */

function getOpenAIProxyUrl(): string {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3001/openai/chat';
  }
  return '/api/openai/chat';
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Ensure messages are valid for OpenAI API.
 */
function prepareMessages(messages: ChatMessage[]): ChatMessage[] {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('messages must be a non-empty array');
  }
  return messages.map((m) => ({
    role: m.role as 'system' | 'user' | 'assistant',
    content: String(m.content ?? '').trim() || '(no content)',
  }));
}

const PROXY_UNREACHABLE_MSG =
  'OpenAI proxy not reachable. Run "npm run dev:proxy" in a separate terminal to enable AI features.';

/**
 * Send messages to OpenAI via local proxy.
 * @throws Error if proxy unavailable or API key not configured
 */
export async function chatWithOpenAI(messages: ChatMessage[]): Promise<string> {
  const prepared = prepareMessages(messages);
  const url = getOpenAIProxyUrl();
  if (import.meta.env?.DEV) {
    const userMsg = prepared.find((m) => m.role === 'user');
    const content = userMsg?.content ?? '';
    console.log('[OpenAI] Sending to', url, '| user:', content.slice(0, 60) + (content.length > 60 ? '...' : ''));
  }
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: prepared }),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (fetchErr) {
    const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
    if (/failed to fetch|load failed|networkerror|connection refused|err_connection_refused|network request failed/i.test(msg)) {
      throw new Error(PROXY_UNREACHABLE_MSG);
    }
    throw fetchErr;
  }
  if (!res.ok) {
    const text = await res.text();
    let err: { error?: string; detail?: string; message?: string } = { error: res.statusText };
    try {
      err = JSON.parse(text);
    } catch {
      console.error('[OpenAI] FAILED', res.status, url, '| Non-JSON response:', text.slice(0, 200));
      throw new Error(`OpenAI failed (${res.status}): ${text.slice(0, 150)}`);
    }
    const msg = err.error ?? err.message ?? res.statusText;
    const detail = err.detail;
    const full = detail ? `${msg} | ${detail}` : msg;
    console.error('[OpenAI] FAILED', res.status, url, '|', full);
    throw new Error(full);
  }
  const text = await res.text();
  let data: { content?: string };
  try {
    data = JSON.parse(text);
  } catch {
    console.error('[OpenAI] Invalid JSON response:', text.slice(0, 200));
    throw new Error('OpenAI returned invalid response');
  }
  const content = (data as { content?: string }).content ?? '';
  if (import.meta.env?.DEV && content) {
    console.log('[OpenAI] Got', content.length, 'chars');
  }
  return content;
}
