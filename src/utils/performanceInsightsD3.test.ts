import assert from 'node:assert/strict';
import test from 'node:test';
import { createInitialEvolutionState } from './selfEvolutionEngine.ts';
import { buildPerformanceInsightsData } from './performanceInsightsD3.ts';

test('buildPerformanceInsightsData extracts and sorts D3 bar metrics from evolutionState.modelMetrics', () => {
  const evo = createInitialEvolutionState(1_760_000_000_000);
  const byLatency = buildPerformanceInsightsData(evo.modelMetrics, 'latency', 8);

  assert.equal(byLatency.length, 8);
  assert.ok(byLatency[0].latencyMs <= byLatency[1].latencyMs);
  assert.ok(byLatency.every((d) => d.label.length > 0 && d.shortLabel.length > 0));
  assert.ok(byLatency.every((d) => d.successRate >= 0 && d.successRate <= 100));

  const bySuccess = buildPerformanceInsightsData(evo.modelMetrics, 'success', 6);
  assert.equal(bySuccess.length, 6);
  assert.ok(bySuccess[0].successRate >= bySuccess[1].successRate);

  const byCalls = buildPerformanceInsightsData(evo.modelMetrics, 'calls', 10);
  assert.ok(byCalls.some((d) => d.modelId === 'gemini-4-carbon' || d.modelId === 'gemini-4-neon' || d.callCount > 0));
  assert.deepEqual(buildPerformanceInsightsData(undefined), []);
});
