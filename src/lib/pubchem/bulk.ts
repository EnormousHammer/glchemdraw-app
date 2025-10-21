/**
 * Bulk PubChem Lookup Utilities
 * Handles batch queries with progress tracking and cancellation
 */

import { getCIDByIdentifier, getCompoundProperties, getCompoundSummary } from './api';
import type { PubChemCompound } from '@/types/chemistry';

export interface BulkLookupProgress {
  current: number;
  total: number;
  percentage: number;
  currentItem?: string;
}

export interface BulkLookupResult {
  success: PubChemCompound[];
  failed: Array<{ identifier: string; error: string }>;
  totalProcessed: number;
}

export type ProgressCallback = (progress: BulkLookupProgress) => void;
export type CancellationToken = { cancelled: boolean };

/**
 * Perform bulk PubChem lookups with progress tracking
 * @param identifiers - Array of compound identifiers (names, CIDs, SMILES)
 * @param onProgress - Progress callback
 * @param cancellationToken - Token to cancel the operation
 * @param delayMs - Delay between requests (default: 200ms to respect rate limits)
 */
export async function bulkPubChemLookup(
  identifiers: string[],
  onProgress?: ProgressCallback,
  cancellationToken?: CancellationToken,
  delayMs: number = 200
): Promise<BulkLookupResult> {
  const success: PubChemCompound[] = [];
  const failed: Array<{ identifier: string; error: string }> = [];
  const total = identifiers.length;

  for (let i = 0; i < identifiers.length; i++) {
    // Check for cancellation
    if (cancellationToken?.cancelled) {
      console.log('[BulkLookup] Operation cancelled');
      break;
    }

    const identifier = identifiers[i];

    // Report progress
    if (onProgress) {
      onProgress({
        current: i + 1,
        total,
        percentage: Math.round(((i + 1) / total) * 100),
        currentItem: identifier,
      });
    }

    try {
      // Get CID
      const cid = await getCIDByIdentifier(identifier);
      if (!cid) {
        failed.push({ identifier, error: 'Compound not found' });
        continue;
      }

      // Get properties
      const properties = await getCompoundProperties(cid);
      if (!properties) {
        failed.push({ identifier, error: 'Failed to fetch properties' });
        continue;
      }

      // Get summary (optional, don't fail if unavailable)
      let summary;
      try {
        summary = await getCompoundSummary(cid);
      } catch (e) {
        // Silently ignore summary fetch failures
      }

      success.push({
        cid,
        properties,
        summary: summary || undefined,
      });

      // Delay to respect rate limits
      if (i < identifiers.length - 1 && delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.error(`[BulkLookup] Error processing ${identifier}:`, error);
      failed.push({
        identifier,
        error: (error as Error).message || 'Unknown error',
      });
    }
  }

  return {
    success,
    failed,
    totalProcessed: success.length + failed.length,
  };
}

/**
 * Lookup compounds by SMILES strings (from SDF structures)
 * @param smilesArray - Array of SMILES strings
 * @param onProgress - Progress callback
 * @param cancellationToken - Cancellation token
 */
export async function bulkSmilesLookup(
  smilesArray: Array<string | null>,
  onProgress?: ProgressCallback,
  cancellationToken?: CancellationToken
): Promise<BulkLookupResult> {
  // Filter out null values
  const validSmiles = smilesArray
    .map((smiles, index) => ({ smiles, originalIndex: index }))
    .filter(item => item.smiles !== null) as Array<{ smiles: string; originalIndex: number }>;

  const identifiers = validSmiles.map(item => item.smiles);
  
  return bulkPubChemLookup(identifiers, onProgress, cancellationToken);
}

/**
 * Create a cancellation token
 */
export function createCancellationToken(): CancellationToken {
  return { cancelled: false };
}

/**
 * Cancel an operation using a cancellation token
 */
export function cancelOperation(token: CancellationToken): void {
  token.cancelled = true;
}

/**
 * Batch lookup with automatic chunking (processes in groups)
 * @param identifiers - Array of identifiers
 * @param chunkSize - Number of items per chunk (default: 10)
 * @param onProgress - Progress callback
 * @param cancellationToken - Cancellation token
 */
export async function batchLookupChunked(
  identifiers: string[],
  chunkSize: number = 10,
  onProgress?: ProgressCallback,
  cancellationToken?: CancellationToken
): Promise<BulkLookupResult> {
  const allSuccess: PubChemCompound[] = [];
  const allFailed: Array<{ identifier: string; error: string }> = [];
  const totalItems = identifiers.length;
  let processedCount = 0;

  // Split into chunks
  const chunks: string[][] = [];
  for (let i = 0; i < identifiers.length; i += chunkSize) {
    chunks.push(identifiers.slice(i, i + chunkSize));
  }

  // Process each chunk
  for (const chunk of chunks) {
    if (cancellationToken?.cancelled) {
      break;
    }

    const result = await bulkPubChemLookup(
      chunk,
      (progress) => {
        const totalProgress = processedCount + progress.current;
        if (onProgress) {
          onProgress({
            current: totalProgress,
            total: totalItems,
            percentage: Math.round((totalProgress / totalItems) * 100),
            currentItem: progress.currentItem,
          });
        }
      },
      cancellationToken
    );

    allSuccess.push(...result.success);
    allFailed.push(...result.failed);
    processedCount += chunk.length;
  }

  return {
    success: allSuccess,
    failed: allFailed,
    totalProcessed: processedCount,
  };
}

