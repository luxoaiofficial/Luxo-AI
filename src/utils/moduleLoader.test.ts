import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHUNK_RELOAD_COOLDOWN_MS,
  isDynamicImportFailure,
  type MinimalStorage,
  planSafeChunkReloadUrl,
  retryDynamicImport,
} from './moduleLoader';

function createMemoryStorage(): MinimalStorage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

test('isDynamicImportFailure detects Chromium, Firefox, Safari, and Vite preload module errors', () => {
  assert.equal(
    isDynamicImportFailure(
      new TypeError(
        'Failed to fetch dynamically imported module: https://ais-dev-example.run.app/src/components/SocialCalendarWorkspace.tsx'
      )
    ),
    true
  );
  assert.equal(
    isDynamicImportFailure(new Error('Importing a module script failed.')),
    true
  );
  assert.equal(
    isDynamicImportFailure(new Error('error loading dynamically imported module')),
    true
  );
  assert.equal(
    isDynamicImportFailure(new Error('Loading chunk 412 failed.')),
    true
  );
  assert.equal(
    isDynamicImportFailure(new Error('Regular validation error on form input')),
    false
  );
});

test('retryDynamicImport recovers when transient module fetch succeeds on retry', async () => {
  let calls = 0;
  const delays: number[] = [];

  const result = await retryDynamicImport(
    async (attempt) => {
      calls += 1;
      if (attempt < 2) {
        throw new TypeError(
          'Failed to fetch dynamically imported module: https://example.com/chunk.js'
        );
      }
      return { loaded: true, attempt };
    },
    {
      retries: 3,
      baseDelayMs: 50,
      sleepFn: async (ms) => {
        delays.push(ms);
      },
    }
  );

  assert.equal(calls, 3);
  assert.deepEqual(delays, [50, 100]);
  assert.deepEqual(result, { loaded: true, attempt: 2 });
});

test('retryDynamicImport does not retry non-network synchronous logic errors', async () => {
  let calls = 0;
  await assert.rejects(
    () =>
      retryDynamicImport(
        async () => {
          calls += 1;
          throw new ReferenceError('foo is not defined');
        },
        { retries: 3, baseDelayMs: 10, sleepFn: async () => {} }
      ),
    /foo is not defined/
  );
  assert.equal(calls, 1);
});

test('planSafeChunkReloadUrl preserves view query params and blocks infinite reload loops', () => {
  const storage = createMemoryStorage();
  const baseHref =
    'https://ais-dev-fudupxh6ld5rvvbfz5qwt4-705459740809.europe-west2.run.app/?view=social&tab=messages';

  const firstUrl = planSafeChunkReloadUrl(storage, baseHref, 100_000);
  assert.ok(firstUrl);
  const parsed = new URL(firstUrl);
  assert.equal(parsed.searchParams.get('view'), 'social');
  assert.equal(parsed.searchParams.get('tab'), 'messages');
  assert.equal(parsed.searchParams.get('_r'), '100000');

  // Immediate second failure within cooldown returns null to prevent reload loop
  const blockedSecond = planSafeChunkReloadUrl(storage, baseHref, 105_000);
  assert.equal(blockedSecond, null);

  // After cooldown window expires, recovery reload is allowed again
  const allowedAfterCooldown = planSafeChunkReloadUrl(
    storage,
    baseHref,
    100_000 + CHUNK_RELOAD_COOLDOWN_MS + 1
  );
  assert.ok(allowedAfterCooldown);
});

test('all server-imported src/utils modules use explicit .ts/type-only imports compatible with native Node 22 ESM', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const serverImportedUtils = [
    'luxoLogic.ts',
    'aiPersonaEngine.ts',
    'collabState.ts',
    'videoEngine.ts',
    'photorealisticMediaEngine.ts',
    'selfEvolutionEngine.ts',
    'seoPerfEngagementEngine.ts',
    'contentStudioEngine.ts',
    'socialPlatformEngine.ts',
    'visualSceneComposer.ts',
  ];

  for (const fileName of serverImportedUtils) {
    const filePath = path.resolve(process.cwd(), 'src/utils', fileName);
    const source = fs.readFileSync(filePath, 'utf8');
    // Match non-type relative value imports lacking a file extension
    const lines = source.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('import type ')) continue;
      const relMatch = trimmed.match(/from\s+['"](\.[^'"]+)['"]/);
      if (relMatch) {
        const spec = relMatch[1];
        assert.match(
          spec,
          /\.(ts|js|json)$/,
          `${fileName} has extensionless value import "${spec}" which crashes native node server.ts`
        );
      }
    }
  }
});

