import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialEvolutionState } from './selfEvolutionEngine.ts';
import { buildAllModelPerformanceMetrics } from './modelMetricsEngine.ts';
import {
  appendLiveTelemetryTick,
  availabilityKey,
  buildLastHourTelemetrySeries,
  latencyKey,
  selectTopTrackedModels,
} from './liveModelTelemetry.ts';

test('selectTopTrackedModels selects top 5 distinct enabled models sorted by usage', () => {
  const evo = createInitialEvolutionState(1_760_000_000_000);
  const all = buildAllModelPerformanceMetrics(evo, []);
  const top5 = selectTopTrackedModels(all, 5);

  assert.equal(top5.length, 5);
  const uniqueIds = new Set(top5.map((m) => m.modelId));
  assert.equal(uniqueIds.size, 5);
  assert.ok(top5[0].usageCount >= top5[4].usageCount);
  assert.ok(
    top5.every(
      (m) =>
        m.currentLatencyMs > 0 &&
        m.currentAvailabilityPct >= 97.5 &&
        m.currentAvailabilityPct <= 100
    )
  );
});

test('buildLastHourTelemetrySeries builds 60-minute window and appendLiveTelemetryTick slides cleanly', () => {
  const evo = createInitialEvolutionState(1_760_000_000_000);
  const all = buildAllModelPerformanceMetrics(evo, []);
  const top5 = selectTopTrackedModels(all, 5);
  const now = 1_760_003_600_000;

  const series = buildLastHourTelemetrySeries(top5, now, {
    [top5[0].modelId]: 215,
  });

  assert.equal(series.length, 13);
  assert.equal(series[0].minuteLabel, '-60dk');
  assert.equal(series[series.length - 1].minuteLabel, 'Şimdi');
  assert.equal(series[series.length - 1][latencyKey(top5[0].modelId)], 215);

  for (const pt of series) {
    assert.ok(pt.avgLatencyMs > 0);
    assert.ok(pt.avgAvailabilityPct >= 97 && pt.avgAvailabilityPct <= 100);
    for (const m of top5) {
      assert.equal(typeof pt[latencyKey(m.modelId)], 'number');
      assert.equal(typeof pt[availabilityKey(m.modelId)], 'number');
    }
  }

  const ticked = appendLiveTelemetryTick(series, top5, 1, now + 5000);
  assert.equal(ticked.length, 13);
  assert.equal(ticked[0].timestampMs, series[1].timestampMs);
  assert.equal(ticked[ticked.length - 1].minuteLabel, 'Şimdi');
  assert.notEqual(
    ticked[ticked.length - 1].timeLabel,
    series[series.length - 1].timeLabel
  );
});
