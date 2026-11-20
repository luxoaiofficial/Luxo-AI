import type { EvolutionModelMetric } from '../types/luxo.ts';
import { LUXO_MODELS } from './luxoLogic.ts';

export interface PerformanceInsightBarDatum {
  modelId: string;
  label: string;
  shortLabel: string;
  latencyMs: number;
  successRate: number;
  callCount: number;
  accentColor: string;
  category: string;
}

function shortenModelName(name: string): string {
  return name
    .replace('Google ', '')
    .replace('Anthropic ', '')
    .replace('Gemini 4 ', 'G4 ')
    .replace('Gemini ', 'Gem ')
    .replace('Claude ', 'Cl ')
    .replace('ChatGPT-', 'GPT-')
    .replace('DeepSeek ', 'DS ')
    .replace('Nano Banana ', 'NB ')
    .replace('Perplexity ', 'Pplx ')
    .slice(0, 14);
}

export function buildPerformanceInsightsData(
  modelMetrics: Record<string, EvolutionModelMetric> | undefined,
  sortBy: 'calls' | 'latency' | 'success' = 'calls',
  limit = 8
): PerformanceInsightBarDatum[] {
  const entries = Object.values(modelMetrics || {});
  if (entries.length === 0) return [];

  const mapped: PerformanceInsightBarDatum[] = entries
    .filter((m) => Number.isFinite(m.latencyMs) && Number.isFinite(m.successRate))
    .map((m) => {
      const cfg = LUXO_MODELS[m.modelId as keyof typeof LUXO_MODELS];
      const fullName = cfg?.name || m.modelId;
      return {
        modelId: m.modelId,
        label: fullName,
        shortLabel: shortenModelName(fullName),
        latencyMs: Math.max(40, Math.round(m.latencyMs)),
        successRate: Math.round(Math.min(100, Math.max(0, m.successRate)) * 10) / 10,
        callCount: Math.max(0, Math.round(m.callCount || 0)),
        accentColor: cfg?.accentColor || '#4f46e5',
        category: cfg?.category || 'AI Model',
      };
    });

  mapped.sort((a, b) => {
    if (sortBy === 'latency') {
      return a.latencyMs - b.latencyMs || b.successRate - a.successRate;
    }
    if (sortBy === 'success') {
      return b.successRate - a.successRate || a.latencyMs - b.latencyMs;
    }
    return b.callCount - a.callCount || b.successRate - a.successRate;
  });

  return mapped.slice(0, Math.max(1, limit));
}
