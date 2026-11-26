import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyOpenRouterPricing,
  diffDiscoveredCandidates,
  normalizeGoogleGeminiModelsPayload,
  normalizeOpenRouterModelsPayload,
} from './discoveryEngine';
import { buildUnifiedCatalog, filterAndSortCatalog } from './providerRegistry';
import { LUXO_MODELS } from './luxoLogic';
import { DEFAULT_PROVIDER_STATUS } from './tokenLimitsEngine';

test('OpenRouter pricing classifier detects :free and $0 prompt/completion accurately', () => {
  assert.equal(classifyOpenRouterPricing(undefined, 'meta-llama/llama-3.3-70b-instruct:free').status, 'FREE');
  assert.equal(classifyOpenRouterPricing({ prompt: '0', completion: '0' }, 'custom/zero').status, 'FREE');
  assert.equal(classifyOpenRouterPricing({ prompt: '0.000001', completion: '0.000002' }, 'openai/gpt-4o').status, 'PAID');
  assert.equal(classifyOpenRouterPricing(undefined, 'unknown/model').status, 'UNKNOWN');
});

test('Discovery engine normalizes Google Gemini & OpenRouter payloads and diffs new/removed models', () => {
  const googleCands = normalizeGoogleGeminiModelsPayload({
    models: [
      {
        name: 'models/gemini-2.5-flash',
        displayName: 'Gemini 2.5 Flash',
        inputTokenLimit: 1000000,
        outputTokenLimit: 8192,
        supportedGenerationMethods: ['generateContent', 'streamGenerateContent'],
      },
      {
        name: 'models/gemini-9-experimental',
        displayName: 'Gemini 9 Experimental',
        inputTokenLimit: 2000000,
        outputTokenLimit: 16384,
        supportedGenerationMethods: ['generateContent'],
      },
    ],
  }, 1740000100000);
  assert.equal(googleCands.length, 2);

  const orCands = normalizeOpenRouterModelsPayload({
    data: [
      {
        id: 'mistralai/mistral-small-3.1-24b-instruct:free',
        name: 'Mistral Small 3.1 (Free)',
        context_length: 128000,
        pricing: { prompt: '0', completion: '0' },
      },
    ],
  }, 1740000100000);
  assert.equal(orCands.length, 1);
  assert.equal(orCands[0].pricingStatus, 'FREE');

  const catalog = buildUnifiedCatalog({
    legacyModels: LUXO_MODELS,
    providersStatus: { ...DEFAULT_PROVIDER_STATUS, google: true, openrouter: true },
  });

  const diff = diffDiscoveredCandidates({
    providerId: 'google',
    fetchedCandidates: googleCands,
    existingCatalog: catalog,
    existingQueue: [],
  });
  assert.equal(diff.newCandidates.length, 1);
  assert.equal(diff.newCandidates[0].upstreamModelId, 'gemini-9-experimental');
});

test('Unified catalog enforces Zero Cost Mode and filters by provider and pricing', () => {
  const catalog = buildUnifiedCatalog({
    legacyModels: LUXO_MODELS,
    providersStatus: { ...DEFAULT_PROVIDER_STATUS, google: true, groq: true, openai: true },
  });
  const gptPro = catalog.find((m) => m.id === 'gpt-5-pro');
  assert.ok(gptPro);
  assert.equal(gptPro.zeroCostAllowed, false);
  assert.equal(gptPro.executable, false);

  const groqFree = catalog.find((m) => m.id === 'groq:llama-3.3-70b-versatile');
  assert.ok(groqFree);
  assert.equal(groqFree.zeroCostAllowed, true);
  assert.equal(groqFree.executable, true);

  const onlyGroq = filterAndSortCatalog(catalog, { providerId: 'groq', pricingFilter: 'zero-cost' });
  assert.ok(onlyGroq.length >= 2);
  assert.ok(onlyGroq.every((m) => m.providerId === 'groq'));
});
