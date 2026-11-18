import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialEvolutionState } from './selfEvolutionEngine';
import { LUXO_MODEL_IDS } from './luxoLogic';
import {
  buildAllModelPerformanceMetrics,
  extractModelAlerts,
  filterAndSortModelMetrics,
  recommendModelsForTask,
} from './modelMetricsEngine';

test('buildAllModelPerformanceMetrics returns telemetry for all 113 AI models', () => {
  const evo = createInitialEvolutionState(1_760_000_000_000);
  const metrics = buildAllModelPerformanceMetrics(evo, ['gpt-4o-mini']);

  assert.equal(metrics.length, LUXO_MODEL_IDS.length);
  assert.equal(metrics.length, 113);

  const disabled = metrics.find((m) => m.modelId === 'gpt-4o-mini');
  assert.equal(disabled?.enabled, false);

  const hydrogen = metrics.find((m) => m.modelId === 'gemini-4-hydrogen');
  assert.ok(hydrogen);
  assert.equal(hydrogen.enabled, true);
  assert.ok(hydrogen.latencyMs > 0);
  assert.ok(hydrogen.costInputPer1M > 0);
  assert.ok(hydrogen.costOutputPer1M > hydrogen.costInputPer1M);
  assert.equal(hydrogen.usageHistory.length, 7);
});

test('filterAndSortModelMetrics and recommendModelsForTask sort and filter accurately', () => {
  const evo = createInitialEvolutionState(1_760_000_000_000);
  const metrics = buildAllModelPerformanceMetrics(evo);

  const fastest = filterAndSortModelMetrics(metrics, { sortBy: 'latency_asc' });
  assert.ok(fastest[0].latencyMs <= fastest[1].latencyMs);

  const cheapest = filterAndSortModelMetrics(metrics, { sortBy: 'cost_asc' });
  assert.ok(cheapest[0].costInputPer1M <= cheapest[1].costInputPer1M);

  const codingPicks = recommendModelsForTask(metrics, 'coding');
  assert.equal(codingPicks.length, 3);
  assert.ok(codingPicks[0].reason.length > 10);

  const alerts = extractModelAlerts(metrics);
  assert.ok(alerts.length >= 1);
});
