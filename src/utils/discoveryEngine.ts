import type {
  CatalogModelEntry,
  DiscoveredModelCandidate,
  DiscoveryRunLog,
  ModelPricingTierStatus,
} from '../types/luxo';
import { resolveLogoForEntity } from './logoRegistry';

export interface DiscoveryDiffResult {
  newCandidates: DiscoveredModelCandidate[];
  removedModelIds: string[];
  unchangedCount: number;
  logEntry: DiscoveryRunLog;
}

export function classifyOpenRouterPricing(rawPricing?: {
  prompt?: string | number;
  completion?: string | number;
}, modelId?: string): { status: ModelPricingTierStatus; detail: string } {
  if (modelId && modelId.endsWith(':free')) {
    return { status: 'FREE', detail: 'OpenRouter :free endpoint ($0)' };
  }
  const promptNum = Number(rawPricing?.prompt);
  const compNum = Number(rawPricing?.completion);
  if (
    rawPricing &&
    rawPricing.prompt !== undefined &&
    rawPricing.completion !== undefined &&
    Number.isFinite(promptNum) &&
    Number.isFinite(compNum)
  ) {
    if (promptNum === 0 && compNum === 0) {
      return { status: 'FREE', detail: 'Verified $0 prompt & completion' };
    }
    if (promptNum > 0 || compNum > 0) {
      return {
        status: 'PAID',
        detail: `Prompt $${promptNum}/tok · Completion $${compNum}/tok`,
      };
    }
  }
  return { status: 'UNKNOWN', detail: 'Pricing metadata incomplete' };
}

export function normalizeGoogleGeminiModelsPayload(
  payload: { models?: Array<{ name?: string; displayName?: string; description?: string; inputTokenLimit?: number; outputTokenLimit?: number; supportedGenerationMethods?: string[] }> },
  nowMs: number = Date.now()
): DiscoveredModelCandidate[] {
  const list = Array.isArray(payload?.models) ? payload.models : [];
  const results: DiscoveredModelCandidate[] = [];

  for (const m of list) {
    const rawName = String(m.name || '').replace(/^models\//, '').trim();
    if (!rawName) continue;
    const methods = Array.isArray(m.supportedGenerationMethods)
      ? m.supportedGenerationMethods
      : [];
    if (!methods.includes('generateContent') && !methods.includes('streamGenerateContent')) {
      continue;
    }

    const lower = rawName.toLowerCase();
    const isFreeTier =
      lower.includes('flash') ||
      lower.includes('gemma') ||
      lower.includes('lite');
    const pricingStatus: ModelPricingTierStatus = isFreeTier ? 'FREE_TIER' : 'PAID';

    const caps = ['Text', 'Streaming'];
    if (lower.includes('flash') || lower.includes('pro') || lower.includes('gemini-2') || lower.includes('gemini-3')) {
      caps.push('Vision', 'Code');
    }

    results.push({
      id: `google:${rawName}`,
      upstreamModelId: rawName,
      providerId: 'google',
      providerLabel: 'Google Gemini',
      displayName: String(m.displayName || rawName),
      contextLength: Number(m.inputTokenLimit) || 128000,
      maxOutputTokens: Number(m.outputTokenLimit) || 8192,
      capabilities: caps,
      pricingStatus,
      pricingDetail: isFreeTier
        ? 'Google AI Studio Free Tier eligible'
        : 'Requires billed quota or Pro tier',
      logoKey: 'gemini',
      discoveredAt: nowMs,
      status: 'pending',
    });
  }

  return results;
}

export function normalizeOpenRouterModelsPayload(
  payload: {
    data?: Array<{
      id?: string;
      name?: string;
      context_length?: number;
      top_provider?: { max_completion_tokens?: number };
      pricing?: { prompt?: string | number; completion?: string | number };
      architecture?: { modality?: string };
    }>;
  },
  nowMs: number = Date.now()
): DiscoveredModelCandidate[] {
  const list = Array.isArray(payload?.data) ? payload.data : [];
  const results: DiscoveredModelCandidate[] = [];

  for (const m of list) {
    const rawId = String(m.id || '').trim();
    if (!rawId) continue;
    const pricing = classifyOpenRouterPricing(m.pricing, rawId);
    const modality = String(m.architecture?.modality || 'text->text').toLowerCase();
    const caps = ['Text', 'Streaming'];
    if (modality.includes('image')) caps.push('Vision');
    if (rawId.toLowerCase().includes('coder') || rawId.toLowerCase().includes('code')) {
      caps.push('Code');
    }
    if (rawId.toLowerCase().includes('r1') || rawId.toLowerCase().includes('thinking') || rawId.toLowerCase().includes('reason')) {
      caps.push('Reasoning');
    }
    const logo = resolveLogoForEntity({ provider: 'openrouter', modelId: rawId });

    results.push({
      id: `openrouter:${rawId.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
      upstreamModelId: rawId,
      providerId: 'openrouter',
      providerLabel: 'OpenRouter',
      displayName: String(m.name || rawId),
      contextLength: Number(m.context_length) || 32768,
      maxOutputTokens: Number(m.top_provider?.max_completion_tokens) || 4096,
      capabilities: caps,
      pricingStatus: pricing.status,
      pricingDetail: pricing.detail,
      logoKey: logo.key,
      discoveredAt: nowMs,
      status: 'pending',
    });
  }

  return results;
}

export function normalizeOpenAiCompatibleModelsPayload(
  params: {
    providerId: string;
    providerLabel: string;
    defaultPricingStatus: ModelPricingTierStatus;
    defaultPricingDetail: string;
    logoKey: string;
    payload: { data?: Array<{ id?: string; context_window?: number; max_tokens?: number }> };
  },
  nowMs: number = Date.now()
): DiscoveredModelCandidate[] {
  const list = Array.isArray(params.payload?.data) ? params.payload.data : [];
  const results: DiscoveredModelCandidate[] = [];

  for (const m of list) {
    const rawId = String(m.id || '').trim();
    if (!rawId) continue;
    if (/whisper|tts|embedding|moderation/i.test(rawId)) continue;
    const logo = resolveLogoForEntity({ provider: params.providerId, modelId: rawId, logoKey: params.logoKey });

    results.push({
      id: `${params.providerId}:${rawId.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
      upstreamModelId: rawId,
      providerId: params.providerId,
      providerLabel: params.providerLabel,
      displayName: `${params.providerLabel} · ${rawId}`,
      contextLength: Number(m.context_window) || 128000,
      maxOutputTokens: Number(m.max_tokens) || 8192,
      capabilities: ['Text', 'Streaming'],
      pricingStatus: params.defaultPricingStatus,
      pricingDetail: params.defaultPricingDetail,
      logoKey: logo.key,
      discoveredAt: nowMs,
      status: 'pending',
    });
  }

  return results;
}

export function diffDiscoveredCandidates(params: {
  providerId: string;
  fetchedCandidates: DiscoveredModelCandidate[];
  existingCatalog: CatalogModelEntry[];
  existingQueue: DiscoveredModelCandidate[];
  nowMs?: number;
}): DiscoveryDiffResult {
  const nowMs = params.nowMs ?? Date.now();
  const knownUpstreamIds = new Set<string>();

  for (const item of params.existingCatalog) {
    if (item.providerId === params.providerId) {
      knownUpstreamIds.add(item.upstreamModelId);
      if (item.openRouterModelId) knownUpstreamIds.add(item.openRouterModelId);
    }
  }

  const queueKeys = new Set<string>();
  for (const q of params.existingQueue) {
    if (q.providerId === params.providerId) {
      queueKeys.add(q.upstreamModelId);
    }
  }

  const fetchedUpstreamSet = new Set<string>();
  const newCandidates: DiscoveredModelCandidate[] = [];
  let unchangedCount = 0;

  for (const cand of params.fetchedCandidates) {
    fetchedUpstreamSet.add(cand.upstreamModelId);
    if (knownUpstreamIds.has(cand.upstreamModelId) || queueKeys.has(cand.upstreamModelId)) {
      unchangedCount += 1;
    } else {
      newCandidates.push(cand);
    }
  }

  // Detect models previously discovered from this provider that vanished upstream
  const removedModelIds = params.existingCatalog
    .filter(
      (m) =>
        m.providerId === params.providerId &&
        m.isDiscovered &&
        m.enabled &&
        !fetchedUpstreamSet.has(m.upstreamModelId)
    )
    .map((m) => m.id);

  return {
    newCandidates,
    removedModelIds,
    unchangedCount,
    logEntry: {
      id: `disc_${params.providerId}_${nowMs}`,
      timestamp: nowMs,
      providerId: params.providerId,
      scannedCount: params.fetchedCandidates.length,
      newCandidatesCount: newCandidates.length,
      removedCount: removedModelIds.length,
      status: 'ok',
      message: `Scanned ${params.fetchedCandidates.length} models · ${newCandidates.length} new · ${removedModelIds.length} removed`,
    },
  };
}

export function promoteCandidateToCatalogEntry(
  candidate: DiscoveredModelCandidate,
  providerLabel: string,
  adapter: CatalogModelEntry['adapter']
): CatalogModelEntry {
  const logo = resolveLogoForEntity({
    provider: candidate.providerId,
    modelId: candidate.upstreamModelId,
    logoKey: candidate.logoKey,
  });
  return {
    id: candidate.id,
    name: candidate.displayName,
    providerId: candidate.providerId,
    providerLabel,
    upstreamModelId: candidate.upstreamModelId,
    ...(candidate.providerId === 'openrouter'
      ? { openRouterModelId: candidate.upstreamModelId }
      : {}),
    adapter,
    pricingStatus: candidate.pricingStatus,
    pricingNote: candidate.pricingDetail,
    contextLength: candidate.contextLength,
    maxOutputTokens: candidate.maxOutputTokens,
    capabilities: candidate.capabilities,
    description: `Auto-discovered ${providerLabel} model (${candidate.upstreamModelId}).`,
    logoPath: logo.logoPath,
    accentColor: logo.accentColor,
    enabled: true,
    isDiscovered: true,
    discoveredAt: candidate.discoveredAt,
    addedAt: Date.now(),
    category: providerLabel,
    tier:
      candidate.pricingStatus === 'FREE' || candidate.pricingStatus === 'FREE_TIER'
        ? 'free'
        : 'plus',
    executable: false,
    zeroCostAllowed:
      candidate.pricingStatus === 'FREE' || candidate.pricingStatus === 'FREE_TIER',
  };
}
