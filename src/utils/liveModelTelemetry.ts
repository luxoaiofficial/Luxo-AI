import type { LuxoModelId } from '../types/luxo.ts';
import type { ModelPerformanceMetric } from './modelMetricsEngine.ts';

export const TOP_TRACKED_COLORS = [
  '#2563eb', // Cobalt Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Rose Pink
] as const;

export interface TopTrackedModelMeta {
  modelId: LuxoModelId;
  name: string;
  shortName: string;
  badge: string;
  color: string;
  currentLatencyMs: number;
  currentAvailabilityPct: number;
  usageCount: number;
}

export interface LiveTelemetryPoint {
  timestampMs: number;
  timeLabel: string;
  minuteLabel: string;
  avgLatencyMs: number;
  avgAvailabilityPct: number;
  [metricKey: string]: number | string;
}

function hashKey(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function formatTimeHHMM(timestampMs: number): string {
  const d = new Date(timestampMs);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatTimeHHMMSS(timestampMs: number): string {
  const d = new Date(timestampMs);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function latencyKey(modelId: LuxoModelId): string {
  return `lat_${modelId}`;
}

export function availabilityKey(modelId: LuxoModelId): string {
  return `avail_${modelId}`;
}

function shortenModelName(name: string): string {
  return name.replace(/\s*\(.*?\)\s*/g, '').trim().slice(0, 22);
}

export function selectTopTrackedModels(
  metrics: ModelPerformanceMetric[],
  limit = 5
): TopTrackedModelMeta[] {
  const safeLimit = Math.max(1, Math.min(8, Math.round(limit)));
  const enabledPool = metrics.filter((m) => m.enabled);
  const pool = enabledPool.length >= safeLimit ? enabledPool : metrics;

  const sorted = [...pool].sort((a, b) => {
    if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount;
    return b.accuracyScore - a.accuracyScore;
  });

  return sorted.slice(0, safeLimit).map((m, idx) => {
    const seed = hashKey(m.modelId);
    const baseAvail =
      m.alertStatus === 'latency-spike'
        ? 98.9 + (seed % 7) * 0.1
        : 99.65 + (seed % 34) * 0.01;
    return {
      modelId: m.modelId,
      name: m.name,
      shortName: shortenModelName(m.name),
      badge: m.badge,
      color: TOP_TRACKED_COLORS[idx % TOP_TRACKED_COLORS.length],
      currentLatencyMs: m.latencyMs,
      currentAvailabilityPct: Number(Math.min(99.99, baseAvail).toFixed(2)),
      usageCount: m.usageCount,
    };
  });
}

function computePointValues(
  topModels: TopTrackedModelMeta[],
  bucketIndex: number,
  minuteOffset: number,
  timestampMs: number,
  isLatest: boolean,
  recordedLatencyOverrides?: Partial<Record<LuxoModelId, number>>,
  useSecondsLabel = false
): LiveTelemetryPoint {
  const point: LiveTelemetryPoint = {
    timestampMs,
    timeLabel: useSecondsLabel
      ? formatTimeHHMMSS(timestampMs)
      : formatTimeHHMM(timestampMs),
    minuteLabel: minuteOffset === 0 ? 'Şimdi' : `-${minuteOffset}dk`,
    avgLatencyMs: 0,
    avgAvailabilityPct: 0,
  };

  let latSum = 0;
  let availSum = 0;

  for (const model of topModels) {
    const seed = hashKey(model.modelId);
    const waveA = Math.sin((bucketIndex + (seed % 11)) * 0.55);
    const waveB = Math.cos((bucketIndex + (seed % 7)) * 0.35);
    const overrideLat =
      isLatest && recordedLatencyOverrides
        ? recordedLatencyOverrides[model.modelId]
        : undefined;

    const jitterMs = Math.round(waveA * 28 + waveB * 16);
    const lat =
      typeof overrideLat === 'number' && Number.isFinite(overrideLat)
        ? Math.max(120, Math.round(overrideLat))
        : Math.max(150, model.currentLatencyMs + jitterMs);

    const availRipple =
      (Math.sin((bucketIndex + (seed % 13)) * 0.7) * 0.14 +
        (bucketIndex % 9 === seed % 9 ? -0.18 : 0.04)) *
      1;
    const avail = Number(
      Math.min(
        100,
        Math.max(97.5, model.currentAvailabilityPct + availRipple)
      ).toFixed(2)
    );

    point[latencyKey(model.modelId)] = lat;
    point[availabilityKey(model.modelId)] = avail;
    latSum += lat;
    availSum += avail;
  }

  const count = Math.max(1, topModels.length);
  point.avgLatencyMs = Math.round(latSum / count);
  point.avgAvailabilityPct = Number((availSum / count).toFixed(2));

  return point;
}

/**
 * Generates a 13-point (60-minute, 5-minute resolution) rolling dataset
 * for the top 5 AI models for live Recharts latency & availability visualization.
 */
export function buildLastHourTelemetrySeries(
  topModels: TopTrackedModelMeta[],
  nowMs: number = Date.now(),
  recordedLatencyOverrides?: Partial<Record<LuxoModelId, number>>
): LiveTelemetryPoint[] {
  const intervalMin = 5;
  const pointCount = 13; // 0 to 60 minutes (12 intervals of 5m = 60m)
  const points: LiveTelemetryPoint[] = [];

  for (let i = 0; i < pointCount; i++) {
    const minutesAgo = (pointCount - 1 - i) * intervalMin;
    const ts = nowMs - minutesAgo * 60_000;
    points.push(
      computePointValues(
        topModels,
        i,
        minutesAgo,
        ts,
        i === pointCount - 1,
        recordedLatencyOverrides
      )
    );
  }

  return points;
}

/**
 * Appends a live sample tick and shifts the 60-minute rolling series forward.
 */
export function appendLiveTelemetryTick(
  previousSeries: LiveTelemetryPoint[],
  topModels: TopTrackedModelMeta[],
  tickIndex: number,
  nowMs: number = Date.now(),
  recordedLatencyOverrides?: Partial<Record<LuxoModelId, number>>
): LiveTelemetryPoint[] {
  if (previousSeries.length === 0) {
    return buildLastHourTelemetrySeries(
      topModels,
      nowMs,
      recordedLatencyOverrides
    );
  }

  const lastLabel = previousSeries[previousSeries.length - 1]?.timeLabel || '';
  const candidateLabel = formatTimeHHMM(nowMs);
  const useSeconds = candidateLabel === lastLabel || lastLabel.length > 5;

  const nextPoint = computePointValues(
    topModels,
    13 + tickIndex,
    0,
    nowMs,
    true,
    recordedLatencyOverrides,
    useSeconds
  );

  return [...previousSeries.slice(1), nextPoint];
}
