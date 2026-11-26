import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ZERO_COST_POLICY,
  evaluateZeroCostAccess,
  isPricingZeroCostEligible,
} from './zeroCostPolicy';

test('Zero Cost Mode allows FREE and FREE_TIER models when enabled', () => {
  assert.equal(isPricingZeroCostEligible('FREE', DEFAULT_ZERO_COST_POLICY), true);
  assert.equal(isPricingZeroCostEligible('FREE_TIER', DEFAULT_ZERO_COST_POLICY), true);

  const freeCheck = evaluateZeroCostAccess({
    modelId: 'openrouter:llama-3.3-70b-free',
    pricingStatus: 'FREE',
  });
  assert.equal(freeCheck.allowed, true);
});

test('Zero Cost Mode strictly blocks PAID, REQUIRES_CREDITS, UNKNOWN, and UNAVAILABLE models', () => {
  for (const status of ['PAID', 'REQUIRES_CREDITS', 'UNKNOWN', 'UNAVAILABLE'] as const) {
    const res = evaluateZeroCostAccess({
      modelId: `model-${status}`,
      pricingStatus: status,
    });
    assert.equal(res.allowed, false, `Expected ${status} to be blocked`);
  }
});

test('Zero Cost Mode allows PAID models only when explicitly disabled by admin', () => {
  const res = evaluateZeroCostAccess({
    modelId: 'openai/gpt-5-pro',
    pricingStatus: 'PAID',
    policy: {
      enabled: false,
      allowFreeTierModels: true,
      blockUnknownPricing: true,
      dailyFreeRequestCap: 500,
    },
  });
  assert.equal(res.allowed, true);
});

test('Zero Cost Mode enforces daily free request cap', () => {
  const res = evaluateZeroCostAccess({
    modelId: 'gemini-2.5-flash',
    pricingStatus: 'FREE_TIER',
    requestsToday: 500,
  });
  assert.equal(res.allowed, false);
  assert.equal(res.reasonCode, 'FREE_QUOTA_EXCEEDED');
});
