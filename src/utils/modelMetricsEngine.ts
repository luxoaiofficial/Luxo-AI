import type {
  LuxoModelCategory,
  LuxoModelConfig,
  LuxoModelId,
  SelfEvolutionState,
} from '../types/luxo.ts';
import { LUXO_MODEL_IDS, LUXO_MODELS } from './luxoLogic.ts';

export type ModelCostTier = 'Ekonomik' | 'Dengeli' | 'Amiral';
export type ModelAlertStatus = 'optimal' | 'high-load' | 'latency-spike';
export type ModelMetricsSortKey =
  | 'usage_desc'
  | 'latency_asc'
  | 'cost_asc'
  | 'accuracy_desc'
  | 'name_asc';
export type AdvisorTaskType =
  | 'coding'
  | 'math'
  | 'speed'
  | 'cinema'
  | 'general';

export interface ModelPerformanceMetric {
  modelId: LuxoModelId;
  name: string;
  category: LuxoModelCategory;
  badge: string;
  accentColor: string;
  contextWindow: string;
  tier: LuxoModelConfig['tier'];
  thinkingLevel: LuxoModelConfig['thinkingLevel'];
  capabilities: string[];
  enabled: boolean;
  latencyMs: number;
  costInputPer1M: number;
  costOutputPer1M: number;
  costTier: ModelCostTier;
  usageCount: number;
  usageHistory: number[];
  accuracyScore: number;
  alertStatus: ModelAlertStatus;
}

export interface ModelPerformanceAlert {
  id: string;
  modelId: LuxoModelId;
  modelName: string;
  severity: 'info' | 'warning';
  title: string;
  detail: string;
  metricBadge: string;
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function estimateBaseLatencyMs(model: LuxoModelConfig, seed: number): number {
  const speed = model.speed.toLowerCase();
  let base = 620;
  if (speed.includes('anlık') || speed.includes('1000+')) base = 260;
  else if (speed.includes('ultra hızlı') || speed.includes('ultra')) base = 340;
  else if (speed.includes('çok hızlı')) base = 420;
  else if (speed.includes('hızlı')) base = 510;
  else if (model.thinkingLevel === 'HIGH') base = 840;

  if (model.category === 'Sinema & Görsel AI') {
    base += 390;
  }
  return Math.max(190, base + (seed % 140) - 45);
}

function estimateCostsPer1M(
  model: LuxoModelConfig,
  seed: number
): { input: number; output: number; costTier: ModelCostTier } {
  const id = model.id;
  if (
    id.includes('nano') ||
    id.includes('flash-lite') ||
    id.includes('mini') ||
    id.includes('haiku') ||
    id.includes('gemma') ||
    id.includes('phi-4') ||
    id === 'luxo-flash'
  ) {
    const input = Number((0.08 + (seed % 12) * 0.01).toFixed(2));
    const output = Number((input * 3.5).toFixed(2));
    return { input, output, costTier: 'Ekonomik' };
  }

  if (
    id.includes('opus') ||
    id.includes('ultra') ||
    id.includes('heavy') ||
    id.includes('o4-pro') ||
    id.includes('o3-pro') ||
    id.includes('o1-pro') ||
    id.includes('behemoth') ||
    id.includes('hydrogen') ||
    id.includes('5-2-pro') ||
    id.includes('luxo-dev') ||
    model.category === 'Sinema & Görsel AI'
  ) {
    const input = Number((2.5 + (seed % 7) * 0.85).toFixed(2));
    const output = Number((input * 3.8).toFixed(2));
    return { input, output, costTier: 'Amiral' };
  }

  const input = Number((0.45 + (seed % 14) * 0.12).toFixed(2));
  const output = Number((input * 3.6).toFixed(2));
  return { input, output, costTier: 'Dengeli' };
}

export function buildAllModelPerformanceMetrics(
  evolutionState: SelfEvolutionState,
  disabledModelIds: LuxoModelId[] = []
): ModelPerformanceMetric[] {
  const disabledSet = new Set<LuxoModelId>(disabledModelIds);
  const ecosystemMap = new Map(
    (evolutionState.ecosystems || []).map((e) => [e.category, e])
  );
  const boosts = evolutionState.modelBoosts || {};
  const liveUsage = evolutionState.modelUsageCounts || {};

  return LUXO_MODEL_IDS.map((modelId) => {
    const model = LUXO_MODELS[modelId];
    const seed = hashSeed(modelId);
    const boost = boosts[modelId];
    const eco = ecosystemMap.get(model.category);

    const rawLatency = estimateBaseLatencyMs(model, seed);
    const latencySaved = boost?.latencySavedMs || 0;
    const latencyMs = Math.max(170, rawLatency - latencySaved);

    const costs = estimateCostsPer1M(model, seed);
    const baselineCalls =
      (modelId === 'luxo-auto-router'
        ? 42
        : modelId === 'gemini-4-hydrogen'
        ? 38
        : modelId === 'gemini-4-argon'
        ? 34
        : 8 + (seed % 26)) +
      (boost?.boostCount || 0) * 11;
    const usageCount =
      typeof liveUsage[modelId] === 'number'
        ? Math.max(liveUsage[modelId], baselineCalls)
        : baselineCalls;

    // 7-point deterministic trend history ending on current usage slice
    const usageHistory = Array.from({ length: 7 }, (_, idx) => {
      const wave = ((seed + idx * 17) % 9) - 3;
      const step = Math.max(
        2,
        Math.round((usageCount / 7) * (0.65 + idx * 0.08) + wave)
      );
      return step;
    });

    const ecoScore = eco?.accuracyScore ?? 98.4;
    const rawAcc =
      ecoScore -
      ((seed % 9) - 4) * 0.14 +
      (boost?.accuracyDelta || 0) +
      (model.id === 'gemini-4-hydrogen' || model.id === 'luxo-auto-router'
        ? 0.4
        : 0);
    const accuracyScore = Number(
      Math.min(99.9, Math.max(94.2, rawAcc)).toFixed(1)
    );

    let alertStatus: ModelAlertStatus = 'optimal';
    if (latencyMs >= 980 && model.category !== 'Sinema & Görsel AI') {
      alertStatus = 'latency-spike';
    } else if (usageCount >= 40) {
      alertStatus = 'high-load';
    }

    return {
      modelId,
      name: model.name,
      category: model.category,
      badge: model.badge,
      accentColor: model.accentColor,
      contextWindow: model.contextWindow,
      tier: model.tier,
      thinkingLevel: model.thinkingLevel,
      capabilities: model.capabilities,
      enabled: !disabledSet.has(modelId),
      latencyMs,
      costInputPer1M: costs.input,
      costOutputPer1M: costs.output,
      costTier: costs.costTier,
      usageCount,
      usageHistory,
      accuracyScore,
      alertStatus,
    };
  });
}

export function filterAndSortModelMetrics(
  metrics: ModelPerformanceMetric[],
  options: {
    query?: string;
    category?: 'Tümü' | LuxoModelCategory;
    enabledOnly?: boolean;
    sortBy?: ModelMetricsSortKey;
  }
): ModelPerformanceMetric[] {
  const q = (options.query || '').trim().toLowerCase();
  const category = options.category || 'Tümü';
  const enabledOnly = Boolean(options.enabledOnly);
  const sortBy = options.sortBy || 'usage_desc';

  const filtered = metrics.filter((m) => {
    if (enabledOnly && !m.enabled) return false;
    if (category !== 'Tümü' && m.category !== category) return false;
    if (!q) return true;
    return (
      m.name.toLowerCase().includes(q) ||
      m.modelId.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q) ||
      m.badge.toLowerCase().includes(q) ||
      m.capabilities.some((c) => c.toLowerCase().includes(q))
    );
  });

  return [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'latency_asc':
        return a.latencyMs - b.latencyMs;
      case 'cost_asc':
        return a.costInputPer1M - b.costInputPer1M;
      case 'accuracy_desc':
        return b.accuracyScore - a.accuracyScore;
      case 'name_asc':
        return a.name.localeCompare(b.name, 'tr');
      case 'usage_desc':
      default:
        return b.usageCount - a.usageCount;
    }
  });
}

export function recommendModelsForTask(
  metrics: ModelPerformanceMetric[],
  task: AdvisorTaskType
): { metric: ModelPerformanceMetric; reason: string }[] {
  const enabled = metrics.filter((m) => m.enabled);
  const pool = enabled.length > 0 ? enabled : metrics;

  const scored = pool.map((m) => {
    let score = m.accuracyScore * 2 - m.latencyMs / 220;
    let reason = `Yüksek doğruluk (%${m.accuracyScore}) ve dengeli yanıt süresi (${m.latencyMs} ms).`;

    if (task === 'coding') {
      const caps = m.capabilities.join(' ').toLowerCase();
      if (
        m.modelId.includes('code') ||
        m.modelId.includes('codex') ||
        m.modelId.includes('argon') ||
        m.modelId.includes('hydrogen') ||
        caps.includes('kod') ||
        caps.includes('svg')
      ) {
        score += 35;
      }
      if (m.modelId.includes('claude-4') || m.modelId.includes('gemini-4')) {
        score += 18;
      }
      reason = `Kod üretimi ve hata ayıklama isabeti %${m.accuracyScore} · ${m.latencyMs} ms.`;
    } else if (task === 'math') {
      if (
        m.thinkingLevel === 'HIGH' ||
        m.modelId.includes('math') ||
        m.modelId.includes('prover') ||
        m.modelId.includes('r2') ||
        m.modelId.includes('r1') ||
        m.modelId.includes('o4') ||
        m.modelId.includes('o3')
      ) {
        score += 40;
      }
      reason = `Derin muhakeme (${m.thinkingLevel}) · %${m.accuracyScore} analitik doğruluk.`;
    } else if (task === 'speed') {
      score =
        120 -
        m.latencyMs / 10 -
        m.costInputPer1M * 8 +
        (m.costTier === 'Ekonomik' ? 25 : 0);
      reason = `${m.latencyMs} ms ultra düşük gecikme · $${m.costInputPer1M}/1M giriş maliyeti.`;
    } else if (task === 'cinema') {
      if (
        m.category === 'Sinema & Görsel AI' ||
        m.modelId.includes('image') ||
        m.modelId.includes('veo') ||
        m.modelId.includes('nano-banana')
      ) {
        score += 60;
      }
      reason = `4K görsel & sinema üretimi (${m.badge}) · ${m.latencyMs} ms.`;
    } else {
      if (
        m.modelId === 'luxo-auto-router' ||
        m.modelId === 'gemini-4-hydrogen' ||
        m.modelId === 'gemini-4-argon'
      ) {
        score += 24;
      }
      reason = `${m.contextWindow} bağlam · $${m.costInputPer1M}/1M · ${m.latencyMs} ms.`;
    }

    return { metric: m, score, reason };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ metric, reason }) => ({ metric, reason }));
}

export function extractModelAlerts(
  metrics: ModelPerformanceMetric[]
): ModelPerformanceAlert[] {
  const alerts: ModelPerformanceAlert[] = [];

  const spikes = metrics.filter(
    (m) => m.enabled && m.alertStatus === 'latency-spike'
  );
  for (const s of spikes.slice(0, 2)) {
    alerts.push({
      id: `alert-lat-${s.modelId}`,
      modelId: s.modelId,
      modelName: s.name,
      severity: 'warning',
      title: `${s.name} yüksek yanıt gecikmesi izleniyor`,
      detail: `Ortalama yanıt süresi ${s.latencyMs} ms. Hız kritik görevler için Luxo Flash veya Gemini 4 Hydrogen tercih edilebilir.`,
      metricBadge: `${s.latencyMs} ms`,
    });
  }

  const hotModels = metrics
    .filter((m) => m.enabled && m.alertStatus === 'high-load')
    .sort((a, b) => b.usageCount - a.usageCount);
  for (const h of hotModels.slice(0, 2)) {
    alerts.push({
      id: `alert-load-${h.modelId}`,
      modelId: h.modelId,
      modelName: h.name,
      severity: 'info',
      title: `${h.name} en yoğun kullanılan model`,
      detail: `Son döngüde ${h.usageCount} çağrı ile %${h.accuracyScore} doğruluk oranında çalışıyor ($${h.costInputPer1M}/1M).`,
      metricBadge: `${h.usageCount} çağrı`,
    });
  }

  const hydrogen = metrics.find((m) => m.modelId === 'gemini-4-hydrogen');
  if (hydrogen && !alerts.some((a) => a.modelId === 'gemini-4-hydrogen')) {
    alerts.push({
      id: 'alert-hydrogen-ready',
      modelId: hydrogen.modelId,
      modelName: hydrogen.name,
      severity: 'info',
      title: `${hydrogen.name} kalibrasyonu optimum seviyede`,
      detail: `%${hydrogen.accuracyScore} doğruluk ve ${hydrogen.latencyMs} ms ortalama gecikme ile aktif.`,
      metricBadge: `%${hydrogen.accuracyScore}`,
    });
  }

  return alerts.slice(0, 4);
}
