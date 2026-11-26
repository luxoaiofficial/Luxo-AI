import assert from 'node:assert/strict';
import test from 'node:test';
import { LUXO_MODEL_IDS } from './luxoLogic';
import {
  checkTokenQuotaForRequest,
  clampMaxOutputTokens,
  DEFAULT_PROVIDER_STATUS,
  estimateTextTokens,
  formatTokenCount,
  getEffectiveModelTokenLimits,
  getModelTokenSpec,
  isModelExecutableWithProviders,
  recordModelTokenUsage,
} from './tokenLimitsEngine';

test('Every one of the 122 models has complete token limit metadata and valid provider mapping', () => {
  assert.equal(LUXO_MODEL_IDS.length, 122);
  for (const id of LUXO_MODEL_IDS) {
    const spec = getModelTokenSpec(id);
    assert.ok(spec.provider.length > 0, `Missing provider for ${id}`);
    assert.ok(spec.upstreamModelId.length > 0, `Missing upstream model id for ${id}`);
    assert.ok(spec.maxInputTokens >= 128000, `Unexpected small maxInputTokens for ${id}`);
    assert.ok(spec.maxOutputTokens >= 4096, `Unexpected small maxOutputTokens for ${id}`);
    assert.ok(spec.defaultDailyTokenLimit >= 100000, `Missing daily quota for ${id}`);
  }
});

test('isModelExecutableWithProviders locks all unconfigured providers and only activates verified keys', () => {
  const noneProviders = { ...DEFAULT_PROVIDER_STATUS };
  assert.equal(
    isModelExecutableWithProviders('gemini-3-1-flash-lite', noneProviders).unlocked,
    false
  );
  assert.equal(
    isModelExecutableWithProviders('chatgpt-5-2-pro', noneProviders).unlocked,
    false
  );
  assert.equal(
    isModelExecutableWithProviders('claude-5-5-sonnet', noneProviders).unlocked,
    false
  );

  const googleOnly = { ...DEFAULT_PROVIDER_STATUS, google: true };
  assert.equal(
    isModelExecutableWithProviders('gemini-3-1-flash-lite', googleOnly).unlocked,
    true
  );
  assert.equal(
    isModelExecutableWithProviders('gemini-4-hydrogen', googleOnly).unlocked,
    true
  );
  // Broken/experimental google aliases stay locked
  assert.equal(
    isModelExecutableWithProviders('gemini-4-neon', googleOnly).unlocked,
    false
  );
  assert.equal(
    isModelExecutableWithProviders('gemini-4-argon', googleOnly).unlocked,
    false
  );
  // Non-Google vendors stay locked when only GEMINI_API_KEY is configured
  assert.equal(
    isModelExecutableWithProviders('chatgpt-5-2-pro', googleOnly).unlocked,
    false
  );
  assert.equal(
    isModelExecutableWithProviders('claude-5-5-opus', googleOnly).unlocked,
    false
  );
  assert.equal(
    isModelExecutableWithProviders('deepseek-r2', googleOnly).unlocked,
    false
  );

  // Direct OpenAI or Anthropic keys unlock their families
  const withOpenAi = { ...googleOnly, openai: true };
  assert.equal(
    isModelExecutableWithProviders('chatgpt-5-2-pro', withOpenAi).unlocked,
    true
  );
  assert.equal(
    isModelExecutableWithProviders('claude-5-5-opus', withOpenAi).unlocked,
    false
  );

  // OpenRouter unlocks third-party models dynamically
  const withOpenRouter = { ...googleOnly, openrouter: true };
  assert.equal(
    isModelExecutableWithProviders('claude-5-5-opus', withOpenRouter).unlocked,
    true
  );
  assert.equal(
    isModelExecutableWithProviders('deepseek-r2', withOpenRouter).unlocked,
    true
  );
  assert.equal(
    isModelExecutableWithProviders('llama-4-maverick', withOpenRouter).unlocked,
    true
  );
});

test('clampMaxOutputTokens, daily token accounting, and quota enforcement behave deterministically', () => {
  const now = new Date('2026-11-26T10:00:00.000Z').getTime();

  // Clamping respects model hard cap and user override
  assert.equal(clampMaxOutputTokens('claude-3-opus', 32000), 4096);
  assert.equal(
    clampMaxOutputTokens('gemini-3-1-flash-lite', 16000, { maxOutputTokens: 2048 }),
    2048
  );

  const limits = getEffectiveModelTokenLimits('gemini-3-1-flash-lite', {
    'gemini-3-1-flash-lite': { maxOutputTokens: 4096, dailyTokenLimit: 10000 },
  });
  assert.equal(limits.maxOutputTokens, 4096);
  assert.equal(limits.dailyTokenLimit, 10000);

  let usage = recordModelTokenUsage({}, 'gemini-3-1-flash-lite', 3500, 2500, now);
  usage = recordModelTokenUsage(usage, 'gemini-3-1-flash-lite', 2000, 2500, now);

  const checkExceeded = checkTokenQuotaForRequest(
    'gemini-3-1-flash-lite',
    'Kısa bir özet yaz',
    { 'gemini-3-1-flash-lite': { dailyTokenLimit: 10000 } },
    usage,
    now
  );
  assert.equal(checkExceeded.allowed, false);
  assert.equal(checkExceeded.reason, 'daily_quota_exceeded');
  assert.equal(checkExceeded.usedTodayTokens, 10500);
  assert.equal(checkExceeded.remainingDailyTokens, 0);

  // Next day resets usage automatically
  const nextDay = new Date('2026-11-27T08:00:00.000Z').getTime();
  const checkNextDay = checkTokenQuotaForRequest(
    'gemini-3-1-flash-lite',
    'Kısa bir özet yaz',
    { 'gemini-3-1-flash-lite': { dailyTokenLimit: 10000 } },
    usage,
    nextDay
  );
  assert.equal(checkNextDay.allowed, true);
  assert.equal(checkNextDay.usedTodayTokens, 0);
  assert.equal(checkNextDay.remainingDailyTokens, 10000);

  assert.ok(estimateTextTokens('Merhaba dünya') >= 3);
  assert.equal(formatTokenCount(2000000), '2M');
  assert.equal(formatTokenCount(16384), '16.4K');
});
