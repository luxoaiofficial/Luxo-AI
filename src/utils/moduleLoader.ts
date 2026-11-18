/**
 * Resilient ESM / Vite chunk loading & stale-deployment recovery utilities.
 * Decoupled from browser globals so all state transitions are deterministic and unit-testable.
 */

export const CHUNK_RELOAD_GUARD_KEY = 'luxo_chunk_reload_guard_ts_v1';
export const CHUNK_RELOAD_COOLDOWN_MS = 20_000;

const DYNAMIC_IMPORT_ERROR_PATTERNS: readonly RegExp[] = [
  /failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /importing a module script failed/i,
  /unable to preload css/i,
  /chunkloaderror/i,
  /loading chunk [\w-]+ failed/i,
  /loading css chunk [\w-]+ failed/i,
  /outdated optimize dep/i,
];

export function extractErrorMessage(error: unknown): string {
  if (!error) return '';
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  if (typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message || '');
  }
  return String(error);
}

export function isDynamicImportFailure(error: unknown): boolean {
  const message = extractErrorMessage(error);
  if (!message) return false;
  return DYNAMIC_IMPORT_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

export interface RetryImportOptions {
  retries?: number;
  baseDelayMs?: number;
  sleepFn?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export async function retryDynamicImport<T>(
  importer: (attempt: number) => Promise<T>,
  options: RetryImportOptions = {}
): Promise<T> {
  const maxRetries = Math.max(0, Math.min(5, options.retries ?? 3));
  const baseDelayMs = Math.max(0, options.baseDelayMs ?? 250);
  const sleepFn = options.sleepFn ?? defaultSleep;

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await importer(attempt);
    } catch (err) {
      lastError = err;
      if (!isDynamicImportFailure(err) || attempt === maxRetries) {
        throw err;
      }
      const backoffMs = baseDelayMs * Math.pow(2, attempt);
      if (backoffMs > 0) {
        await sleepFn(backoffMs);
      }
    }
  }

  throw lastError;
}

export interface MinimalStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * Computes a cache-busted reload URL at most once within CHUNK_RELOAD_COOLDOWN_MS,
 * preserving the user's current pathname, query parameters (e.g. ?view=social), and hash.
 * Returns null if a reload was already attempted within the cooldown window.
 */
export function planSafeChunkReloadUrl(
  storage: MinimalStorage | null | undefined,
  currentHref: string,
  now = Date.now()
): string | null {
  try {
    if (storage) {
      const prevRaw = storage.getItem(CHUNK_RELOAD_GUARD_KEY);
      const prevTs = prevRaw ? Number(prevRaw) : 0;
      if (Number.isFinite(prevTs) && prevTs > 0 && now - prevTs < CHUNK_RELOAD_COOLDOWN_MS) {
        return null;
      }
      storage.setItem(CHUNK_RELOAD_GUARD_KEY, String(now));
    }

    const parsed = new URL(currentHref, 'http://localhost:3000');
    parsed.searchParams.set('_r', String(now));
    return parsed.toString();
  } catch {
    return null;
  }
}

export function installVitePreloadRecovery(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('vite:preloadError', (event: Event) => {
    event.preventDefault();
    let storage: MinimalStorage | null = null;
    try {
      storage = window.sessionStorage;
    } catch {
      storage = null;
    }
    const targetUrl = planSafeChunkReloadUrl(storage, window.location.href);
    if (targetUrl) {
      window.location.replace(targetUrl);
    }
  });
}
