import type {
  CatalogModelEntry,
  LuxoModelConfig,
  ModelPricingTierStatus,
  PlatformProviderConfig,
  ProviderConnectionStatusMap,
} from '../types/luxo';
import { resolveLogoForEntity } from './logoRegistry';
import {
  DEFAULT_ZERO_COST_POLICY,
  evaluateZeroCostAccess,
  type ZeroCostPolicyState,
} from './zeroCostPolicy';

export const BUILTIN_PROVIDERS: Omit<PlatformProviderConfig, 'connected'>[] = [
  {
    id: 'google',
    name: 'Google Gemini',
    shortLabel: 'Google',
    adapter: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    secretEnvName: 'GEMINI_API_KEY',
    modelsEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    logoKey: 'gemini',
    accentColor: '#3b82f6',
    supportsStreaming: true,
    supportsVision: true,
    supportsDiscovery: true,
    isBuiltin: true,
    enabled: true,
    notes: 'Direct Google GenAI SDK with Flash/Pro/Gemma & multimodal vision.',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    shortLabel: 'OpenRouter',
    adapter: 'openai-compatible',
    baseUrl: 'https://openrouter.ai/api/v1',
    secretEnvName: 'OPENROUTER_API_KEY',
    modelsEndpoint: 'https://openrouter.ai/api/v1/models',
    logoKey: 'openrouter',
    accentColor: '#8b5cf6',
    supportsStreaming: true,
    supportsVision: true,
    supportsDiscovery: true,
    isBuiltin: true,
    enabled: true,
    notes: 'Unified gateway with verified :free models and multi-provider routing.',
  },
  {
    id: 'groq',
    name: 'Groq',
    shortLabel: 'Groq',
    adapter: 'openai-compatible',
    baseUrl: 'https://api.groq.com/openai/v1',
    secretEnvName: 'GROQ_API_KEY',
    modelsEndpoint: 'https://api.groq.com/openai/v1/models',
    logoKey: 'groq',
    accentColor: '#f55036',
    supportsStreaming: true,
    supportsVision: true,
    supportsDiscovery: true,
    isBuiltin: true,
    enabled: true,
    notes: 'Ultra-low latency LPU inference with generous developer free tier.',
  },
  {
    id: 'cerebras',
    name: 'Cerebras',
    shortLabel: 'Cerebras',
    adapter: 'openai-compatible',
    baseUrl: 'https://api.cerebras.ai/v1',
    secretEnvName: 'CEREBRAS_API_KEY',
    modelsEndpoint: 'https://api.cerebras.ai/v1/models',
    logoKey: 'cerebras',
    accentColor: '#f97316',
    supportsStreaming: true,
    supportsVision: false,
    supportsDiscovery: true,
    isBuiltin: true,
    enabled: true,
    notes: 'Wafer-scale high-speed inference with free API tier.',
  },
  {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    shortLabel: 'NVIDIA',
    adapter: 'openai-compatible',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    secretEnvName: 'NVIDIA_API_KEY',
    modelsEndpoint: 'https://integrate.api.nvidia.com/v1/models',
    logoKey: 'nvidia',
    accentColor: '#76b900',
    supportsStreaming: true,
    supportsVision: true,
    supportsDiscovery: true,
    isBuiltin: true,
    enabled: true,
    notes: 'NVIDIA hosted NIM microservices with developer trial credits.',
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare Workers AI',
    shortLabel: 'Cloudflare',
    adapter: 'openai-compatible',
    baseUrl: 'https://api.cloudflare.com/client/v4',
    secretEnvName: 'CLOUDFLARE_API_TOKEN',
    secondaryEnvName: 'CLOUDFLARE_ACCOUNT_ID',
    logoKey: 'cloudflare',
    accentColor: '#f38020',
    supportsStreaming: true,
    supportsVision: false,
    supportsDiscovery: false,
    isBuiltin: true,
    enabled: true,
    notes: 'Global edge inference with daily free neuron allowance.',
  },
  {
    id: 'sambanova',
    name: 'SambaNova Cloud',
    shortLabel: 'SambaNova',
    adapter: 'openai-compatible',
    baseUrl: 'https://api.sambanova.ai/v1',
    secretEnvName: 'SAMBANOVA_API_KEY',
    modelsEndpoint: 'https://api.sambanova.ai/v1/models',
    logoKey: 'sambanova',
    accentColor: '#c026d3',
    supportsStreaming: true,
    supportsVision: true,
    supportsDiscovery: true,
    isBuiltin: true,
    enabled: true,
    notes: 'RDU-accelerated Llama & DeepSeek hosting with free developer tier.',
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    shortLabel: 'Mistral',
    adapter: 'openai-compatible',
    baseUrl: 'https://api.mistral.ai/v1',
    secretEnvName: 'MISTRAL_API_KEY',
    modelsEndpoint: 'https://api.mistral.ai/v1/models',
    logoKey: 'mistral',
    accentColor: '#ea580c',
    supportsStreaming: true,
    supportsVision: true,
    supportsDiscovery: true,
    isBuiltin: true,
    enabled: true,
    notes: 'Mistral & Codestral models with Experiment free plan.',
  },
  {
    id: 'cohere',
    name: 'Cohere',
    shortLabel: 'Cohere',
    adapter: 'openai-compatible',
    baseUrl: 'https://api.cohere.ai/compatibility/v1',
    secretEnvName: 'COHERE_API_KEY',
    modelsEndpoint: 'https://api.cohere.ai/v1/models',
    logoKey: 'cohere',
    accentColor: '#39594d',
    supportsStreaming: true,
    supportsVision: false,
    supportsDiscovery: true,
    isBuiltin: true,
    enabled: true,
    notes: 'Command A / R+ enterprise reasoning with rate-limited trial key.',
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    shortLabel: 'Hugging Face',
    adapter: 'openai-compatible',
    baseUrl: 'https://router.huggingface.co/v1',
    secretEnvName: 'HUGGINGFACE_API_KEY',
    modelsEndpoint: 'https://router.huggingface.co/v1/models',
    logoKey: 'huggingface',
    accentColor: '#ffd21e',
    supportsStreaming: true,
    supportsVision: false,
    supportsDiscovery: true,
    isBuiltin: true,
    enabled: true,
    notes: 'Inference Providers router for open-weights models.',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    shortLabel: 'DeepSeek',
    adapter: 'openai-compatible',
    baseUrl: 'https://api.deepseek.com',
    secretEnvName: 'DEEPSEEK_API_KEY',
    modelsEndpoint: 'https://api.deepseek.com/models',
    logoKey: 'deepseek',
    accentColor: '#4f46e5',
    supportsStreaming: true,
    supportsVision: false,
    supportsDiscovery: true,
    isBuiltin: true,
    enabled: true,
    notes: 'Direct DeepSeek V3 & R1 endpoints (credits required on direct API).',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    shortLabel: 'OpenAI',
    adapter: 'openai-compatible',
    baseUrl: 'https://api.openai.com/v1',
    secretEnvName: 'OPENAI_API_KEY',
    modelsEndpoint: 'https://api.openai.com/v1/models',
    logoKey: 'openai',
    accentColor: '#10a37f',
    supportsStreaming: true,
    supportsVision: true,
    supportsDiscovery: true,
    isBuiltin: true,
    enabled: true,
    notes: 'Official OpenAI API for GPT-5 / GPT-4.1 / o3 / o4-mini.',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    shortLabel: 'Anthropic',
    adapter: 'anthropic-compatible',
    baseUrl: 'https://api.anthropic.com/v1',
    secretEnvName: 'ANTHROPIC_API_KEY',
    modelsEndpoint: 'https://api.anthropic.com/v1/models',
    logoKey: 'anthropic',
    accentColor: '#d97757',
    supportsStreaming: true,
    supportsVision: true,
    supportsDiscovery: true,
    isBuiltin: true,
    enabled: true,
    notes: 'Official Anthropic Messages API for Claude Sonnet, Opus & Haiku.',
  },
  {
    id: 'xai',
    name: 'xAI Grok',
    shortLabel: 'xAI',
    adapter: 'openai-compatible',
    baseUrl: 'https://api.x.ai/v1',
    secretEnvName: 'XAI_API_KEY',
    modelsEndpoint: 'https://api.x.ai/v1/models',
    logoKey: 'xai',
    accentColor: '#71717a',
    supportsStreaming: true,
    supportsVision: true,
    supportsDiscovery: true,
    isBuiltin: true,
    enabled: true,
    notes: 'Direct xAI Grok API.',
  },
  {
    id: 'qwen',
    name: 'Alibaba Qwen',
    shortLabel: 'Qwen',
    adapter: 'openai-compatible',
    baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    secretEnvName: 'DASHSCOPE_API_KEY',
    logoKey: 'qwen',
    accentColor: '#7c3aed',
    supportsStreaming: true,
    supportsVision: true,
    supportsDiscovery: false,
    isBuiltin: true,
    enabled: true,
    notes: 'Alibaba Cloud Model Studio DashScope OpenAI-compatible endpoint.',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    shortLabel: 'Perplexity',
    adapter: 'openai-compatible',
    baseUrl: 'https://api.perplexity.ai',
    secretEnvName: 'PERPLEXITY_API_KEY',
    logoKey: 'perplexity',
    accentColor: '#0d9488',
    supportsStreaming: true,
    supportsVision: false,
    supportsDiscovery: false,
    isBuiltin: true,
    enabled: true,
    notes: 'Web-grounded Sonar reasoning & deep research API.',
  },
];

// Additional V2 Zero-Cost & Multi-Provider Verified Models
export const EXTENDED_V2_MODELS: Omit<
  CatalogModelEntry,
  'executable' | 'zeroCostAllowed' | 'zeroCostReason'
>[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    providerId: 'google',
    providerLabel: 'Google Gemini',
    upstreamModelId: 'gemini-2.5-flash',
    adapter: 'gemini',
    pricingStatus: 'FREE_TIER',
    pricingNote: 'Google AI Studio Free Tier supported',
    contextLength: 1000000,
    maxOutputTokens: 8192,
    capabilities: ['Text', 'Code', 'Vision', 'Search Grounding', 'Streaming'],
    description: 'Balanced high-speed Gemini model with 1M context and multimodal reasoning.',
    logoPath: '/logos/gemini.svg',
    accentColor: '#3b82f6',
    enabled: true,
    category: 'Google Gemini',
    tier: 'free',
    addedAt: 1740000000000,
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash-Lite',
    providerId: 'google',
    providerLabel: 'Google Gemini',
    upstreamModelId: 'gemini-2.5-flash-lite',
    adapter: 'gemini',
    pricingStatus: 'FREE_TIER',
    pricingNote: 'Google AI Studio Free Tier supported',
    contextLength: 1000000,
    maxOutputTokens: 8192,
    capabilities: ['Fast Text', 'Code', 'Streaming'],
    description: 'Ultra-lightweight Gemini 2.5 variant built for sub-second interactive workspaces.',
    logoPath: '/logos/gemini.svg',
    accentColor: '#3b82f6',
    enabled: true,
    category: 'Google Gemini',
    tier: 'free',
    addedAt: 1740000000100,
  },
  {
    id: 'openrouter:llama-3.3-70b-free',
    name: 'Llama 3.3 70B Instruct (Free)',
    providerId: 'openrouter',
    providerLabel: 'OpenRouter',
    upstreamModelId: 'meta-llama/llama-3.3-70b-instruct:free',
    openRouterModelId: 'meta-llama/llama-3.3-70b-instruct:free',
    adapter: 'openai-compatible',
    pricingStatus: 'FREE',
    pricingNote: 'OpenRouter $0 :free route',
    contextLength: 131072,
    maxOutputTokens: 8192,
    capabilities: ['Text', 'Code', 'Reasoning', 'Streaming'],
    description: 'Meta Llama 3.3 70B hosted on OpenRouter zero-cost tier.',
    logoPath: '/logos/meta.svg',
    accentColor: '#0284c7',
    enabled: true,
    category: 'OpenRouter Free',
    tier: 'free',
    addedAt: 1740000000200,
  },
  {
    id: 'openrouter:deepseek-r1-free',
    name: 'DeepSeek R1 0528 (Free)',
    providerId: 'openrouter',
    providerLabel: 'OpenRouter',
    upstreamModelId: 'deepseek/deepseek-r1-0528:free',
    openRouterModelId: 'deepseek/deepseek-r1-0528:free',
    adapter: 'openai-compatible',
    pricingStatus: 'FREE',
    pricingNote: 'OpenRouter $0 :free route',
    contextLength: 163840,
    maxOutputTokens: 16384,
    capabilities: ['Deep Reasoning', 'Math', 'Code', 'Streaming'],
    description: 'Open-weights frontier reasoning model routed at zero token cost via OpenRouter.',
    logoPath: '/logos/deepseek.svg',
    accentColor: '#4f46e5',
    enabled: true,
    category: 'OpenRouter Free',
    tier: 'free',
    addedAt: 1740000000300,
  },
  {
    id: 'openrouter:qwen3-coder-free',
    name: 'Qwen3 Coder (Free)',
    providerId: 'openrouter',
    providerLabel: 'OpenRouter',
    upstreamModelId: 'qwen/qwen3-coder:free',
    openRouterModelId: 'qwen/qwen3-coder:free',
    adapter: 'openai-compatible',
    pricingStatus: 'FREE',
    pricingNote: 'OpenRouter $0 :free route',
    contextLength: 262144,
    maxOutputTokens: 16384,
    capabilities: ['Code', 'Architecture', 'Streaming'],
    description: 'High-precision Qwen3 software engineering model on OpenRouter :free.',
    logoPath: '/logos/qwen.svg',
    accentColor: '#7c3aed',
    enabled: true,
    category: 'OpenRouter Free',
    tier: 'free',
    addedAt: 1740000000400,
  },
  {
    id: 'groq:llama-3.3-70b-versatile',
    name: 'Groq · Llama 3.3 70B Versatile',
    providerId: 'groq',
    providerLabel: 'Groq',
    upstreamModelId: 'llama-3.3-70b-versatile',
    adapter: 'openai-compatible',
    pricingStatus: 'FREE_TIER',
    pricingNote: 'Groq free developer tier',
    contextLength: 128000,
    maxOutputTokens: 8192,
    capabilities: ['Ultra-Fast LPU', 'Code', 'Text', 'Streaming'],
    description: 'High-throughput Groq LPU deployment of Meta Llama 3.3 70B.',
    logoPath: '/logos/groq.svg',
    accentColor: '#f55036',
    enabled: true,
    category: 'Groq LPU',
    tier: 'free',
    addedAt: 1740000000500,
  },
  {
    id: 'groq:llama-3.1-8b-instant',
    name: 'Groq · Llama 3.1 8B Instant',
    providerId: 'groq',
    providerLabel: 'Groq',
    upstreamModelId: 'llama-3.1-8b-instant',
    adapter: 'openai-compatible',
    pricingStatus: 'FREE_TIER',
    pricingNote: 'Groq free developer tier',
    contextLength: 128000,
    maxOutputTokens: 8192,
    capabilities: ['Instant Response', 'Text', 'Streaming'],
    description: 'Sub-second Llama 3.1 8B inference running on Groq LPU hardware.',
    logoPath: '/logos/groq.svg',
    accentColor: '#f55036',
    enabled: true,
    category: 'Groq LPU',
    tier: 'free',
    addedAt: 1740000000600,
  },
  {
    id: 'cerebras:llama-3.3-70b',
    name: 'Cerebras · Llama 3.3 70B',
    providerId: 'cerebras',
    providerLabel: 'Cerebras',
    upstreamModelId: 'llama-3.3-70b',
    adapter: 'openai-compatible',
    pricingStatus: 'FREE_TIER',
    pricingNote: 'Cerebras free inference tier',
    contextLength: 128000,
    maxOutputTokens: 8192,
    capabilities: ['Wafer-Scale Speed', 'Text', 'Code', 'Streaming'],
    description: 'Cerebras Wafer-Scale Engine Llama 3.3 70B.',
    logoPath: '/logos/cerebras.svg',
    accentColor: '#f97316',
    enabled: true,
    category: 'Cerebras',
    tier: 'free',
    addedAt: 1740000000700,
  },
  {
    id: 'nvidia:nemotron-70b',
    name: 'NVIDIA · Llama 3.1 Nemotron 70B',
    providerId: 'nvidia',
    providerLabel: 'NVIDIA NIM',
    upstreamModelId: 'nvidia/llama-3.1-nemotron-70b-instruct',
    adapter: 'openai-compatible',
    pricingStatus: 'FREE_TIER',
    pricingNote: 'NVIDIA NIM developer trial tier',
    contextLength: 128000,
    maxOutputTokens: 4096,
    capabilities: ['Reasoning', 'Instruction Following', 'Streaming'],
    description: 'NVIDIA NIM Nemotron 70B tuned for helpful, accurate technical execution.',
    logoPath: '/logos/nvidia.svg',
    accentColor: '#76b900',
    enabled: true,
    category: 'NVIDIA NIM',
    tier: 'free',
    addedAt: 1740000000800,
  },
  {
    id: 'sambanova:llama-3.3-70b',
    name: 'SambaNova · Llama 3.3 70B',
    providerId: 'sambanova',
    providerLabel: 'SambaNova Cloud',
    upstreamModelId: 'Meta-Llama-3.3-70B-Instruct',
    adapter: 'openai-compatible',
    pricingStatus: 'FREE_TIER',
    pricingNote: 'SambaNova Cloud free developer tier',
    contextLength: 128000,
    maxOutputTokens: 4096,
    capabilities: ['Fast RDU', 'Code', 'Text', 'Streaming'],
    description: 'SambaNova RDU deployment of Meta Llama 3.3 70B Instruct.',
    logoPath: '/logos/sambanova.svg',
    accentColor: '#c026d3',
    enabled: true,
    category: 'SambaNova',
    tier: 'free',
    addedAt: 1740000000900,
  },
  {
    id: 'cloudflare:llama-3.3-70b-fp8',
    name: 'Cloudflare · Llama 3.3 70B FP8',
    providerId: 'cloudflare',
    providerLabel: 'Cloudflare Workers AI',
    upstreamModelId: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    adapter: 'openai-compatible',
    pricingStatus: 'FREE_TIER',
    pricingNote: 'Cloudflare daily free neurons tier',
    contextLength: 24000,
    maxOutputTokens: 4096,
    capabilities: ['Edge Inference', 'Text', 'Streaming'],
    description: 'Cloudflare Workers AI edge-distributed Llama 3.3 70B FP8.',
    logoPath: '/logos/cloudflare.svg',
    accentColor: '#f38020',
    enabled: true,
    category: 'Cloudflare Edge',
    tier: 'free',
    addedAt: 1740000001000,
  },
  {
    id: 'cohere:command-a-03-2025',
    name: 'Cohere · Command A (03-2025)',
    providerId: 'cohere',
    providerLabel: 'Cohere',
    upstreamModelId: 'command-a-03-2025',
    adapter: 'openai-compatible',
    pricingStatus: 'FREE_TIER',
    pricingNote: 'Cohere Trial API key rate-limited free tier',
    contextLength: 256000,
    maxOutputTokens: 8192,
    capabilities: ['Enterprise RAG', 'Multilingual', 'Streaming'],
    description: 'Cohere flagship Command A model optimized for grounded RAG and enterprise workflows.',
    logoPath: '/logos/cohere.svg',
    accentColor: '#39594d',
    enabled: true,
    category: 'Cohere',
    tier: 'free',
    addedAt: 1740000001100,
  },
  {
    id: 'huggingface:qwen-2.5-72b',
    name: 'Hugging Face · Qwen 2.5 72B',
    providerId: 'huggingface',
    providerLabel: 'Hugging Face',
    upstreamModelId: 'Qwen/Qwen2.5-72B-Instruct',
    adapter: 'openai-compatible',
    pricingStatus: 'FREE_TIER',
    pricingNote: 'Hugging Face Inference Router free tier credits',
    contextLength: 128000,
    maxOutputTokens: 4096,
    capabilities: ['Open Weights', 'Code', 'Streaming'],
    description: 'Open-weights Qwen 2.5 72B routed via Hugging Face Inference Providers.',
    logoPath: '/logos/huggingface.svg',
    accentColor: '#ffd21e',
    enabled: true,
    category: 'Hugging Face',
    tier: 'free',
    addedAt: 1740000001200,
  },
];

// Explicit known Google free-tier verified runtime backends in Luxo catalog
const GOOGLE_FREE_TIER_MODEL_IDS = new Set([
  'gemini-3-1-flash-lite',
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemma-open-27b',
  'gemma-3-12b',
  'luxo-flash',
  'luxo-auto-router',
]);

// Verified Google preview models that are currently runnable under the Gemini API free tier / AI Studio preview
const GOOGLE_PREVIEW_FREE_TIER_IDS = new Set([
  'gemini-4-hydrogen',
  'gemini-4-carbon',
  'gemini-3-8-flash',
  'gemini-3-8-live-think',
  'luxo-luna',
  'luxo-dev-helper',
  'luxo-dev',
]);

export function classifyLegacyModelPricing(model: LuxoModelConfig): {
  pricingStatus: ModelPricingTierStatus;
  pricingNote: string;
} {
  if (GOOGLE_FREE_TIER_MODEL_IDS.has(model.id)) {
    return {
      pricingStatus: 'FREE_TIER',
      pricingNote: 'Google AI Studio Free Tier eligible',
    };
  }
  if (GOOGLE_PREVIEW_FREE_TIER_IDS.has(model.id)) {
    return {
      pricingStatus: 'FREE_TIER',
      pricingNote: 'Google AI Studio Preview · Free Tier fallback supported',
    };
  }
  if (model.provider === 'google' || model.provider === 'luxo' || model.provider === 'media') {
    if (
      model.id.startsWith('veo-') ||
      model.id.startsWith('imagen-') ||
      model.id.startsWith('nano-banana') ||
      model.id.includes('deep-research') ||
      model.id.includes('antigravity') ||
      model.id.includes('ultra') ||
      model.id.includes('pro')
    ) {
      return {
        pricingStatus: 'PAID',
        pricingNote: 'Requires billed Google AI / Vertex / Veo quota',
      };
    }
    return {
      pricingStatus: 'FREE_TIER',
      pricingNote: 'Google AI Studio Free Tier eligible',
    };
  }

  if (model.provider === 'mistral') {
    return {
      pricingStatus: 'FREE_TIER',
      pricingNote: 'Mistral Experiment free tier (direct key) or OpenRouter paid',
    };
  }

  if (model.provider === 'cohere') {
    return {
      pricingStatus: 'FREE_TIER',
      pricingNote: 'Cohere trial key free tier',
    };
  }

  if (
    model.provider === 'openai' ||
    model.provider === 'anthropic' ||
    model.provider === 'deepseek' ||
    model.provider === 'xai' ||
    model.provider === 'perplexity' ||
    model.provider === 'qwen' ||
    model.provider === 'global'
  ) {
    return {
      pricingStatus: 'REQUIRES_CREDITS',
      pricingNote: 'Requires funded provider API balance or OpenRouter credits',
    };
  }

  return {
    pricingStatus: 'UNKNOWN',
    pricingNote: 'Pricing metadata unverified',
  };
}

export function buildUnifiedCatalog(params: {
  legacyModels: Record<string, LuxoModelConfig>;
  customProviders?: PlatformProviderConfig[];
  customModels?: CatalogModelEntry[];
  disabledModelIds?: Set<string>;
  providersStatus: ProviderConnectionStatusMap;
  zeroCostPolicy?: ZeroCostPolicyState;
  requestsToday?: number;
}): CatalogModelEntry[] {
  const policy = params.zeroCostPolicy || DEFAULT_ZERO_COST_POLICY;
  const entries = new Map<string, CatalogModelEntry>();

  const providerLabelMap = new Map<string, string>();
  for (const bp of BUILTIN_PROVIDERS) {
    providerLabelMap.set(bp.id, bp.name);
  }
  for (const cp of params.customProviders || []) {
    providerLabelMap.set(cp.id, cp.name);
  }

  // 1. Add Extended V2 verified entries first
  for (const ext of EXTENDED_V2_MODELS) {
    const providerConnected = Boolean(params.providersStatus[ext.providerId]);
    const disabled = params.disabledModelIds?.has(ext.id) || !ext.enabled;
    const effectivePricing: ModelPricingTierStatus = disabled
      ? 'UNAVAILABLE'
      : ext.pricingStatus;
    const zc = evaluateZeroCostAccess({
      modelId: ext.id,
      pricingStatus: effectivePricing,
      policy,
      requestsToday: params.requestsToday,
    });
    entries.set(ext.id, {
      ...ext,
      pricingStatus: effectivePricing,
      executable: !disabled && providerConnected && zc.allowed,
      zeroCostAllowed: zc.allowed,
      zeroCostReason: zc.allowed ? undefined : zc.message,
    });
  }

  // 2. Merge existing LUXO_MODELS preserving IDs & legacy views
  for (const model of Object.values(params.legacyModels)) {
    if (entries.has(model.id)) continue;
    const providerId =
      model.provider === 'luxo' || model.provider === 'media'
        ? 'google'
        : model.provider === 'global'
        ? 'openrouter'
        : model.provider;
    const logoEntry = resolveLogoForEntity({
      provider: model.provider,
      modelId: model.id,
    });
    const pricing = classifyLegacyModelPricing(model);
    const providerConnected =
      Boolean(params.providersStatus[providerId]) ||
      Boolean(params.providersStatus.openrouter && providerId !== 'google');
    const disabled = params.disabledModelIds?.has(model.id);
    const effectivePricing: ModelPricingTierStatus = disabled
      ? 'UNAVAILABLE'
      : pricing.pricingStatus;
    const zc = evaluateZeroCostAccess({
      modelId: model.id,
      pricingStatus: effectivePricing,
      policy,
      requestsToday: params.requestsToday,
    });

    entries.set(model.id, {
      id: model.id,
      name: model.name,
      providerId,
      providerLabel: providerLabelMap.get(providerId) || providerId.toUpperCase(),
      upstreamModelId: model.sdkBackend,
      adapter:
        providerId === 'google'
          ? 'gemini'
          : providerId === 'anthropic'
          ? 'anthropic-compatible'
          : 'openai-compatible',
      pricingStatus: effectivePricing,
      pricingNote: pricing.pricingNote,
      contextLength: model.maxInputTokens || 128000,
      maxOutputTokens: model.maxOutputTokens || 8192,
      capabilities: model.capabilities || [],
      description: model.description || model.tagline,
      logoPath: model.logoUrl || logoEntry.logoPath,
      accentColor: model.accentColor || logoEntry.accentColor,
      enabled: !disabled,
      category: model.category,
      tier: model.tier,
      executable: !disabled && providerConnected && zc.allowed,
      zeroCostAllowed: zc.allowed,
      zeroCostReason: zc.allowed ? undefined : zc.message,
      addedAt: 1738000000000,
    });
  }

  // 3. Merge approved discovered or admin custom models
  for (const cm of params.customModels || []) {
    const providerConnected = Boolean(params.providersStatus[cm.providerId]);
    const disabled = params.disabledModelIds?.has(cm.id) || !cm.enabled;
    const effectivePricing: ModelPricingTierStatus = disabled
      ? 'UNAVAILABLE'
      : cm.pricingStatus;
    const zc = evaluateZeroCostAccess({
      modelId: cm.id,
      pricingStatus: effectivePricing,
      policy,
      requestsToday: params.requestsToday,
    });
    entries.set(cm.id, {
      ...cm,
      pricingStatus: effectivePricing,
      executable: !disabled && providerConnected && zc.allowed,
      zeroCostAllowed: zc.allowed,
      zeroCostReason: zc.allowed ? undefined : zc.message,
    });
  }

  return Array.from(entries.values());
}

export type CatalogPricingFilter = 'all' | 'zero-cost' | 'free-only' | 'paid';
export type CatalogSortMode = 'recent' | 'context' | 'name';

export function filterAndSortCatalog(
  catalog: CatalogModelEntry[],
  filters: {
    search?: string;
    providerId?: string;
    pricingFilter?: CatalogPricingFilter;
    capability?: string;
    onlyAvailable?: boolean;
    sortBy?: CatalogSortMode;
  }
): CatalogModelEntry[] {
  const q = String(filters.search || '').trim().toLowerCase();
  const cap = String(filters.capability || '').trim().toLowerCase();

  const filtered = catalog.filter((m) => {
    if (filters.providerId && filters.providerId !== 'all' && m.providerId !== filters.providerId) {
      return false;
    }
    if (filters.pricingFilter === 'zero-cost') {
      if (m.pricingStatus !== 'FREE' && m.pricingStatus !== 'FREE_TIER') return false;
    } else if (filters.pricingFilter === 'free-only') {
      if (m.pricingStatus !== 'FREE') return false;
    } else if (filters.pricingFilter === 'paid') {
      if (m.pricingStatus !== 'PAID' && m.pricingStatus !== 'REQUIRES_CREDITS') return false;
    }
    if (filters.onlyAvailable && !m.executable) {
      return false;
    }
    if (cap && cap !== 'all') {
      const hasCap = m.capabilities.some((c) => c.toLowerCase().includes(cap));
      if (!hasCap) return false;
    }
    if (q) {
      const hay = `${m.name} ${m.id} ${m.providerLabel} ${m.description} ${m.capabilities.join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const sortBy = filters.sortBy || 'recent';
  return filtered.sort((a, b) => {
    if (sortBy === 'context') {
      return (b.contextLength || 0) - (a.contextLength || 0);
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    const aDisc = Number(Boolean(a.isDiscovered));
    const bDisc = Number(Boolean(b.isDiscovered));
    if (aDisc !== bDisc) return bDisc - aDisc;

    const aExec = Number(Boolean(a.executable));
    const bExec = Number(Boolean(b.executable));
    if (aExec !== bExec) return bExec - aExec;

    const aTime = a.discoveredAt || a.addedAt || 0;
    const bTime = b.discoveredAt || b.addedAt || 0;
    if (aTime !== bTime) return bTime - aTime;
    return a.name.localeCompare(b.name);
  });
}
