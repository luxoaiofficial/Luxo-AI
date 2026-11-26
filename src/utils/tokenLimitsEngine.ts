import type {
  AiProviderId,
  DailyModelTokenUsage,
  LuxoModelId,
  LuxoUser,
  ModelTokenLimitOverride,
  ProviderConnectionStatusMap,
} from '../types/luxo';

export const TOKEN_OVERRIDES_STORAGE_KEY = 'luxo_model_token_overrides_v1';
export const DAILY_USAGE_STORAGE_KEY = 'luxo_daily_token_usage_v1';
export const DESKTOP_SIDEBAR_STORAGE_KEY = 'luxo_desktop_sidebar_open_v1';

export const DEFAULT_WORKING_MODEL_ID: LuxoModelId = 'gemini-3-1-flash-lite';

export interface ModelTokenSpec {
  provider: AiProviderId;
  upstreamModelId: string;
  openRouterModelId?: string;
  maxInputTokens: number;
  maxOutputTokens: number;
  defaultDailyTokenLimit: number;
  isLiveVerifiedGoogle?: boolean;
  supportsDirectMedia?: boolean;
}

export const DEFAULT_PROVIDER_STATUS: ProviderConnectionStatusMap = {
  google: false,
  openai: false,
  anthropic: false,
  deepseek: false,
  xai: false,
  mistral: false,
  perplexity: false,
  qwen: false,
  openrouter: false,
  groq: false,
  cerebras: false,
  nvidia: false,
  cloudflare: false,
  sambanova: false,
  cohere: false,
  huggingface: false,
};

export const PROVIDER_META: Record<
  string,
  {
    label: string;
    shortLabel: string;
    envKeyHint: string;
    accentColor: string;
  }
> = {
  google: {
    label: 'Google Gemini',
    shortLabel: 'Google',
    envKeyHint: 'GEMINI_API_KEY',
    accentColor: '#3b82f6',
  },
  openrouter: {
    label: 'OpenRouter',
    shortLabel: 'OpenRouter',
    envKeyHint: 'OPENROUTER_API_KEY',
    accentColor: '#8b5cf6',
  },
  groq: {
    label: 'Groq',
    shortLabel: 'Groq',
    envKeyHint: 'GROQ_API_KEY',
    accentColor: '#f55036',
  },
  cerebras: {
    label: 'Cerebras',
    shortLabel: 'Cerebras',
    envKeyHint: 'CEREBRAS_API_KEY',
    accentColor: '#f97316',
  },
  nvidia: {
    label: 'NVIDIA NIM',
    shortLabel: 'NVIDIA',
    envKeyHint: 'NVIDIA_API_KEY',
    accentColor: '#76b900',
  },
  cloudflare: {
    label: 'Cloudflare Workers AI',
    shortLabel: 'Cloudflare',
    envKeyHint: 'CLOUDFLARE_API_TOKEN',
    accentColor: '#f38020',
  },
  sambanova: {
    label: 'SambaNova Cloud',
    shortLabel: 'SambaNova',
    envKeyHint: 'SAMBANOVA_API_KEY',
    accentColor: '#c026d3',
  },
  cohere: {
    label: 'Cohere',
    shortLabel: 'Cohere',
    envKeyHint: 'COHERE_API_KEY',
    accentColor: '#39594d',
  },
  huggingface: {
    label: 'Hugging Face',
    shortLabel: 'Hugging Face',
    envKeyHint: 'HUGGINGFACE_API_KEY',
    accentColor: '#ffd21e',
  },
  openai: {
    label: 'OpenAI ChatGPT',
    shortLabel: 'OpenAI',
    envKeyHint: 'OPENAI_API_KEY',
    accentColor: '#10a37f',
  },
  anthropic: {
    label: 'Anthropic Claude',
    shortLabel: 'Anthropic',
    envKeyHint: 'ANTHROPIC_API_KEY',
    accentColor: '#d97757',
  },
  deepseek: {
    label: 'DeepSeek AI',
    shortLabel: 'DeepSeek',
    envKeyHint: 'DEEPSEEK_API_KEY',
    accentColor: '#4f46e5',
  },
  xai: {
    label: 'xAI Grok',
    shortLabel: 'xAI',
    envKeyHint: 'XAI_API_KEY',
    accentColor: '#18181b',
  },
  mistral: {
    label: 'Mistral AI',
    shortLabel: 'Mistral',
    envKeyHint: 'MISTRAL_API_KEY',
    accentColor: '#ea580c',
  },
  perplexity: {
    label: 'Perplexity Sonar',
    shortLabel: 'Perplexity',
    envKeyHint: 'PERPLEXITY_API_KEY',
    accentColor: '#0d9488',
  },
  qwen: {
    label: 'Alibaba Qwen',
    shortLabel: 'Qwen',
    envKeyHint: 'DASHSCOPE_API_KEY',
    accentColor: '#7c3aed',
  },
  global: {
    label: 'OpenRouter / Global',
    shortLabel: 'Global',
    envKeyHint: 'OPENROUTER_API_KEY',
    accentColor: '#334155',
  },
  media: {
    label: 'Görsel & Video Motoru',
    shortLabel: 'Medya',
    envKeyHint: 'GEMINI_API_KEY',
    accentColor: '#db2777',
  },
  luxo: {
    label: 'Luxo Akıllı Yönlendirme',
    shortLabel: 'Luxo',
    envKeyHint: 'GEMINI_API_KEY',
    accentColor: '#0284c7',
  },
};

export const LIVE_VERIFIED_GOOGLE_MODELS = new Set<LuxoModelId>([
  'gemini-4-hydrogen',
  'gemini-4-carbon',
  'gemini-3-1-flash-lite',
  'gemini-flash-latest',
  'gemini-3-8-flash',
  'gemini-3-8-live-think',
  'gemma-open-27b',
  'gemma-3-12b',
  'luxo-auto-router',
  'luxo-flash',
  'luxo-luna',
  'luxo-dev-helper',
  'luxo-dev',
  'nano-banana-2-1-ultra',
  'nano-banana-pro-4k',
  'imagen-4-ultra',
  'veo-3-1-ultra-cinema',
  'veo-3-cinema-pro',
]);

const OPENAI_SPEC_MAP: Record<
  string,
  { upstream: string; orId: string; maxIn: number; maxOut: number; daily: number }
> = {
  'chatgpt-5-2-pro': { upstream: 'gpt-5-pro', orId: 'openai/gpt-5-pro', maxIn: 256000, maxOut: 16384, daily: 250000 },
  'gpt-image-2-ultra': { upstream: 'gpt-4o', orId: 'openai/gpt-4o', maxIn: 128000, maxOut: 8192, daily: 150000 },
  'chatgpt-5-omni': { upstream: 'gpt-5', orId: 'openai/gpt-5', maxIn: 256000, maxOut: 16384, daily: 300000 },
  'gpt-5-pro': { upstream: 'gpt-5-pro', orId: 'openai/gpt-5-pro', maxIn: 256000, maxOut: 16384, daily: 250000 },
  'chatgpt-5-mini': { upstream: 'gpt-5-mini', orId: 'openai/gpt-5-mini', maxIn: 200000, maxOut: 16384, daily: 500000 },
  'gpt-4-5-orion': { upstream: 'gpt-4.5-preview', orId: 'openai/gpt-4.5-preview', maxIn: 128000, maxOut: 16384, daily: 200000 },
  'gpt-4-1': { upstream: 'gpt-4.1', orId: 'openai/gpt-4.1', maxIn: 1000000, maxOut: 32768, daily: 350000 },
  'gpt-4-1-mini': { upstream: 'gpt-4.1-mini', orId: 'openai/gpt-4.1-mini', maxIn: 1000000, maxOut: 32768, daily: 600000 },
  'gpt-4-1-nano': { upstream: 'gpt-4.1-nano', orId: 'openai/gpt-4.1-nano', maxIn: 1000000, maxOut: 16384, daily: 900000 },
  'gpt-4o': { upstream: 'gpt-4o', orId: 'openai/gpt-4o', maxIn: 128000, maxOut: 16384, daily: 350000 },
  'gpt-4o-mini': { upstream: 'gpt-4o-mini', orId: 'openai/gpt-4o-mini', maxIn: 128000, maxOut: 16384, daily: 750000 },
  'openai-o4-pro': { upstream: 'o4-mini', orId: 'openai/o4-mini', maxIn: 200000, maxOut: 32768, daily: 220000 },
  'chatgpt-o3-pro': { upstream: 'o3-pro', orId: 'openai/o3-pro', maxIn: 200000, maxOut: 32768, daily: 180000 },
  'openai-o3': { upstream: 'o3', orId: 'openai/o3', maxIn: 200000, maxOut: 32768, daily: 250000 },
  'openai-o4-mini': { upstream: 'o4-mini', orId: 'openai/o4-mini', maxIn: 200000, maxOut: 32768, daily: 450000 },
  'openai-o1-pro': { upstream: 'o1-pro', orId: 'openai/o1-pro', maxIn: 200000, maxOut: 32768, daily: 160000 },
  'openai-codex-agent': { upstream: 'codex-mini-latest', orId: 'openai/gpt-4.1', maxIn: 200000, maxOut: 16384, daily: 300000 },
  'gpt-astra': { upstream: 'gpt-4.1', orId: 'openai/gpt-4.1', maxIn: 256000, maxOut: 16384, daily: 350000 },
};

const ANTHROPIC_SPEC_MAP: Record<
  string,
  { upstream: string; orId: string; maxIn: number; maxOut: number; daily: number }
> = {
  'claude-5-2-fable': { upstream: 'claude-sonnet-4-5', orId: 'anthropic/claude-sonnet-4.5', maxIn: 200000, maxOut: 16384, daily: 280000 },
  'claude-5-5-opus': { upstream: 'claude-opus-4-6', orId: 'anthropic/claude-opus-4.6', maxIn: 200000, maxOut: 16384, daily: 200000 },
  'claude-5-5-sonnet': { upstream: 'claude-sonnet-4-5', orId: 'anthropic/claude-sonnet-4.5', maxIn: 200000, maxOut: 16384, daily: 320000 },
  'claude-5-5-haiku': { upstream: 'claude-3-5-haiku-latest', orId: 'anthropic/claude-3.5-haiku', maxIn: 200000, maxOut: 8192, daily: 600000 },
  'claude-4-6-opus': { upstream: 'claude-opus-4-6', orId: 'anthropic/claude-opus-4.6', maxIn: 200000, maxOut: 16384, daily: 200000 },
  'claude-4-5-sonnet': { upstream: 'claude-sonnet-4-5', orId: 'anthropic/claude-sonnet-4.5', maxIn: 200000, maxOut: 16384, daily: 320000 },
  'claude-4-opus': { upstream: 'claude-opus-4-0', orId: 'anthropic/claude-opus-4', maxIn: 200000, maxOut: 16384, daily: 200000 },
  'claude-4-sonnet': { upstream: 'claude-sonnet-4-0', orId: 'anthropic/claude-sonnet-4', maxIn: 200000, maxOut: 16384, daily: 350000 },
  'claude-4-haiku': { upstream: 'claude-3-5-haiku-latest', orId: 'anthropic/claude-3.5-haiku', maxIn: 200000, maxOut: 8192, daily: 550000 },
  'claude-3-7-sonnet': { upstream: 'claude-3-7-sonnet-latest', orId: 'anthropic/claude-3.7-sonnet', maxIn: 200000, maxOut: 16384, daily: 320000 },
  'claude-3-5-sonnet': { upstream: 'claude-3-5-sonnet-latest', orId: 'anthropic/claude-3.5-sonnet', maxIn: 200000, maxOut: 8192, daily: 400000 },
  'claude-3-5-haiku': { upstream: 'claude-3-5-haiku-latest', orId: 'anthropic/claude-3.5-haiku', maxIn: 200000, maxOut: 8192, daily: 600000 },
  'claude-3-opus': { upstream: 'claude-3-opus-latest', orId: 'anthropic/claude-3-opus', maxIn: 200000, maxOut: 4096, daily: 180000 },
};

const DEEPSEEK_SPEC_MAP: Record<
  string,
  { upstream: string; orId: string; maxIn: number; maxOut: number; daily: number }
> = {
  'deepseek-v3-2-exp': { upstream: 'deepseek-chat', orId: 'deepseek/deepseek-chat', maxIn: 128000, maxOut: 8192, daily: 500000 },
  'deepseek-r2': { upstream: 'deepseek-reasoner', orId: 'deepseek/deepseek-r1', maxIn: 128000, maxOut: 16384, daily: 350000 },
  'deepseek-v3-1': { upstream: 'deepseek-chat', orId: 'deepseek/deepseek-chat', maxIn: 128000, maxOut: 8192, daily: 500000 },
  'deepseek-r1': { upstream: 'deepseek-reasoner', orId: 'deepseek/deepseek-r1', maxIn: 128000, maxOut: 16384, daily: 350000 },
  'deepseek-r1-zero': { upstream: 'deepseek-reasoner', orId: 'deepseek/deepseek-r1-zero', maxIn: 128000, maxOut: 16384, daily: 350000 },
  'deepseek-v3-turbo': { upstream: 'deepseek-chat', orId: 'deepseek/deepseek-chat', maxIn: 128000, maxOut: 8192, daily: 650000 },
  'deepseek-coder-v3': { upstream: 'deepseek-chat', orId: 'deepseek/deepseek-chat', maxIn: 128000, maxOut: 8192, daily: 500000 },
  'deepseek-math-v2': { upstream: 'deepseek-reasoner', orId: 'deepseek/deepseek-r1', maxIn: 128000, maxOut: 16384, daily: 400000 },
  'deepseek-prover-v2': { upstream: 'deepseek-reasoner', orId: 'deepseek/deepseek-r1', maxIn: 128000, maxOut: 16384, daily: 350000 },
};

const GOOGLE_SPEC_MAP: Record<
  string,
  { upstream: string; maxIn: number; maxOut: number; daily: number }
> = {
  'gemini-4-argon': { upstream: 'gemini-4-argon', maxIn: 2000000, maxOut: 16384, daily: 250000 },
  'gemini-4-hydrogen': { upstream: 'gemini-4-hydrogen', maxIn: 2000000, maxOut: 16384, daily: 400000 },
  'gemini-4-carbon': { upstream: 'gemini-4-hydrogen', maxIn: 2000000, maxOut: 16384, daily: 400000 },
  'gemini-4-neon': { upstream: 'gemini-4-neon', maxIn: 1000000, maxOut: 16384, daily: 350000 },
  'gemini-4-ultra': { upstream: 'gemini-4-argon', maxIn: 2000000, maxOut: 16384, daily: 250000 },
  'gemini-4-pro-code': { upstream: 'gemini-4-argon', maxIn: 2000000, maxOut: 16384, daily: 300000 },
  'gemini-3-8-pro': { upstream: 'gemini-2.5-pro', maxIn: 2000000, maxOut: 16384, daily: 300000 },
  'gemini-3-8-flash': { upstream: 'gemini-4-hydrogen', maxIn: 1000000, maxOut: 8192, daily: 600000 },
  'gemini-3-8-live-think': { upstream: 'gemini-4-hydrogen', maxIn: 1000000, maxOut: 8192, daily: 500000 },
  'gemini-3-1-pro': { upstream: 'gemini-2.5-pro', maxIn: 2000000, maxOut: 16384, daily: 300000 },
  'gemini-3-1-flash-lite': { upstream: 'gemini-3.1-flash-lite', maxIn: 1000000, maxOut: 8192, daily: 1000000 },
  'gemini-flash-latest': { upstream: 'gemini-flash-latest', maxIn: 1000000, maxOut: 8192, daily: 800000 },
  'gemini-omni-flash': { upstream: 'gemini-omni-1.2-flash', maxIn: 1000000, maxOut: 8192, daily: 350000 },
  'antigravity-agent': { upstream: 'antigravity-preview-09-2026', maxIn: 250000, maxOut: 16384, daily: 200000 },
  'deep-research-agent': { upstream: 'deep-research-preview-04-2026', maxIn: 1000000, maxOut: 16384, daily: 200000 },
  'deep-research-max': { upstream: 'deep-research-max-preview-04-2026', maxIn: 2000000, maxOut: 16384, daily: 150000 },
  'gemini-transcribe': { upstream: 'gemini-3.5-transcribe', maxIn: 1000000, maxOut: 8192, daily: 500000 },
  'gemma-open-27b': { upstream: 'gemini-3.1-flash-lite', maxIn: 128000, maxOut: 8192, daily: 800000 },
  'gemma-3-12b': { upstream: 'gemini-3.1-flash-lite', maxIn: 128000, maxOut: 8192, daily: 1000000 },
};

export function getModelTokenSpec(modelId: LuxoModelId): ModelTokenSpec {
  if (modelId in GOOGLE_SPEC_MAP) {
    const s = GOOGLE_SPEC_MAP[modelId];
    return {
      provider: 'google',
      upstreamModelId: s.upstream,
      maxInputTokens: s.maxIn,
      maxOutputTokens: s.maxOut,
      defaultDailyTokenLimit: s.daily,
      isLiveVerifiedGoogle: LIVE_VERIFIED_GOOGLE_MODELS.has(modelId),
    };
  }
  if (modelId in OPENAI_SPEC_MAP) {
    const s = OPENAI_SPEC_MAP[modelId];
    return {
      provider: 'openai',
      upstreamModelId: s.upstream,
      openRouterModelId: s.orId,
      maxInputTokens: s.maxIn,
      maxOutputTokens: s.maxOut,
      defaultDailyTokenLimit: s.daily,
    };
  }
  if (modelId in ANTHROPIC_SPEC_MAP) {
    const s = ANTHROPIC_SPEC_MAP[modelId];
    return {
      provider: 'anthropic',
      upstreamModelId: s.upstream,
      openRouterModelId: s.orId,
      maxInputTokens: s.maxIn,
      maxOutputTokens: s.maxOut,
      defaultDailyTokenLimit: s.daily,
    };
  }
  if (modelId in DEEPSEEK_SPEC_MAP) {
    const s = DEEPSEEK_SPEC_MAP[modelId];
    return {
      provider: 'deepseek',
      upstreamModelId: s.upstream,
      openRouterModelId: s.orId,
      maxInputTokens: s.maxIn,
      maxOutputTokens: s.maxOut,
      defaultDailyTokenLimit: s.daily,
    };
  }

  // xAI Grok & Meta Llama
  if (modelId.startsWith('grok-')) {
    const map: Record<string, string> = {
      'grok-4-heavy': 'grok-3',
      'grok-3-ultra': 'grok-3',
      'grok-3-thinking': 'grok-3-mini',
      'grok-3-mini': 'grok-3-mini',
      'grok-2-vision': 'grok-2-vision-1212',
    };
    const upstream = map[modelId] || 'grok-3';
    return {
      provider: 'xai',
      upstreamModelId: upstream,
      openRouterModelId: `x-ai/${upstream}`,
      maxInputTokens: 131072,
      maxOutputTokens: modelId === 'grok-3-mini' ? 8192 : 16384,
      defaultDailyTokenLimit: 350000,
    };
  }

  if (modelId.startsWith('llama-')) {
    const orMap: Record<string, string> = {
      'llama-4-behemoth': 'meta-llama/llama-4-maverick',
      'llama-4-reasoning': 'meta-llama/llama-4-maverick',
      'llama-4-maverick': 'meta-llama/llama-4-maverick',
      'llama-4-scout': 'meta-llama/llama-4-scout',
      'llama-3-3-70b': 'meta-llama/llama-3.3-70b-instruct',
    };
    return {
      provider: 'global',
      upstreamModelId: orMap[modelId] || 'meta-llama/llama-3.3-70b-instruct',
      openRouterModelId: orMap[modelId] || 'meta-llama/llama-3.3-70b-instruct',
      maxInputTokens: modelId === 'llama-4-scout' ? 1000000 : 256000,
      maxOutputTokens: 8192,
      defaultDailyTokenLimit: 500000,
    };
  }

  // Mistral
  if (
    modelId.startsWith('mistral-') ||
    modelId === 'codestral-25' ||
    modelId === 'pixtral-large' ||
    modelId === 'magistral-reasoning'
  ) {
    const map: Record<string, string> = {
      'mistral-large-2': 'mistral-large-latest',
      'mistral-medium-3': 'mistral-medium-latest',
      'mistral-saba': 'mistral-small-latest',
      'codestral-25': 'codestral-latest',
      'pixtral-large': 'pixtral-large-latest',
      'magistral-reasoning': 'magistral-medium-latest',
    };
    const upstream = map[modelId] || 'mistral-large-latest';
    return {
      provider: 'mistral',
      upstreamModelId: upstream,
      openRouterModelId: `mistralai/${upstream}`,
      maxInputTokens: modelId === 'codestral-25' ? 256000 : 128000,
      maxOutputTokens: 8192,
      defaultDailyTokenLimit: 450000,
    };
  }

  // Alibaba Qwen
  if (modelId.startsWith('qwen-') || modelId === 'qwq-32b') {
    const map: Record<string, string> = {
      'qwen-3-max': 'qwen-max',
      'qwen-3-coder-plus': 'qwen-coder-plus',
      'qwen-3-thinking': 'qwq-32b',
      'qwen-2-5-coder': 'qwen-coder-plus',
      'qwq-32b': 'qwq-32b',
      'qwen-vl-max': 'qwen-vl-max',
      'qwen-image-edit-pro': 'qwen-vl-max',
    };
    const upstream = map[modelId] || 'qwen-max';
    return {
      provider: 'qwen',
      upstreamModelId: upstream,
      openRouterModelId: `qwen/${upstream}`,
      maxInputTokens: 128000,
      maxOutputTokens: 8192,
      defaultDailyTokenLimit: 450000,
    };
  }

  // Perplexity Sonar
  if (modelId.startsWith('perplexity-')) {
    const map: Record<string, string> = {
      'perplexity-sonar-pro': 'sonar-pro',
      'perplexity-reasoning': 'sonar-reasoning-pro',
      'perplexity-research': 'sonar-deep-research',
    };
    const upstream = map[modelId] || 'sonar-pro';
    return {
      provider: 'perplexity',
      upstreamModelId: upstream,
      openRouterModelId: `perplexity/${upstream}`,
      maxInputTokens: 200000,
      maxOutputTokens: 8192,
      defaultDailyTokenLimit: 300000,
    };
  }

  // Global OpenRouter Models
  if (
    modelId.startsWith('kimi-') ||
    modelId.startsWith('cohere-') ||
    modelId === 'microsoft-phi-4' ||
    modelId === 'amazon-nova-premier' ||
    modelId === 'nvidia-nemotron-ultra' ||
    modelId === 'glm-4-plus' ||
    modelId === 'minimax-01' ||
    modelId === 'yi-lightning'
  ) {
    const orMap: Record<string, string> = {
      'kimi-k2-thinking': 'moonshotai/kimi-k2',
      'kimi-k1-5': 'moonshotai/kimi-vl-a3b-thinking',
      'cohere-command-a': 'cohere/command-a',
      'cohere-command-r-plus': 'cohere/command-r-plus-08-2024',
      'microsoft-phi-4': 'microsoft/phi-4',
      'amazon-nova-premier': 'amazon/nova-pro-v1',
      'nvidia-nemotron-ultra': 'nvidia/llama-3.1-nemotron-ultra-253b-v1',
      'glm-4-plus': 'thudm/glm-4-32b',
      'minimax-01': 'minimax/minimax-01',
      'yi-lightning': '01-ai/yi-large',
    };
    const upstream = orMap[modelId] || 'microsoft/phi-4';
    return {
      provider: 'global',
      upstreamModelId: upstream,
      openRouterModelId: upstream,
      maxInputTokens: 128000,
      maxOutputTokens: 8192,
      defaultDailyTokenLimit: 400000,
    };
  }

  // Luxo Specialized Models
  if (modelId.startsWith('luxo-')) {
    const upstream =
      modelId === 'luxo-flash'
        ? 'gemini-3.1-flash-lite'
        : modelId === 'luxo-auto-router' || modelId === 'luxo-luna'
        ? 'gemini-4-hydrogen'
        : 'gemini-4-hydrogen';
    return {
      provider: 'luxo',
      upstreamModelId: upstream,
      maxInputTokens: modelId === 'luxo-flash' ? 1000000 : 2000000,
      maxOutputTokens: modelId === 'luxo-flash' ? 8192 : 16384,
      defaultDailyTokenLimit: modelId === 'luxo-dev' ? 1000000 : 500000,
      isLiveVerifiedGoogle: LIVE_VERIFIED_GOOGLE_MODELS.has(modelId),
    };
  }

  // Cinema / Image / Video Models
  const isGoogleMedia =
    modelId.startsWith('nano-banana') ||
    modelId.startsWith('imagen-') ||
    modelId.startsWith('veo-');
  return {
    provider: 'media',
    upstreamModelId: modelId,
    maxInputTokens: 128000,
    maxOutputTokens: 8192,
    defaultDailyTokenLimit: 180000,
    isLiveVerifiedGoogle: isGoogleMedia,
    supportsDirectMedia: isGoogleMedia,
  };
}

export function estimateTextTokens(text: string): number {
  const clean = String(text || '').trim();
  if (!clean) return 0;
  // Balanced cross-lingual (Turkish + English + code) ~3.6 chars/token estimate
  return Math.max(1, Math.ceil(clean.length / 3.6));
}

export function clampMaxOutputTokens(
  modelId: LuxoModelId,
  requestedMaxOutput?: number,
  override?: ModelTokenLimitOverride
): number {
  const spec = getModelTokenSpec(modelId);
  const hardCeiling = Math.max(256, spec.maxOutputTokens);
  const effectiveCeiling =
    typeof override?.maxOutputTokens === 'number' &&
    Number.isFinite(override.maxOutputTokens)
      ? Math.max(256, Math.min(hardCeiling, Math.round(override.maxOutputTokens)))
      : hardCeiling;

  if (
    typeof requestedMaxOutput === 'number' &&
    Number.isFinite(requestedMaxOutput)
  ) {
    return Math.max(
      256,
      Math.min(effectiveCeiling, Math.round(requestedMaxOutput))
    );
  }
  return effectiveCeiling;
}

export function getEffectiveModelTokenLimits(
  modelId: LuxoModelId,
  overrides?: Partial<Record<string, ModelTokenLimitOverride>>
): {
  maxInputTokens: number;
  maxOutputTokens: number;
  dailyTokenLimit: number;
  hardMaxOutputTokens: number;
} {
  const spec = getModelTokenSpec(modelId);
  const ov = overrides?.[modelId];
  const hardMaxOutputTokens = spec.maxOutputTokens;
  const maxOutputTokens = clampMaxOutputTokens(modelId, undefined, ov);
  const dailyTokenLimit =
    typeof ov?.dailyTokenLimit === 'number' && Number.isFinite(ov.dailyTokenLimit)
      ? Math.max(5000, Math.min(5000000, Math.round(ov.dailyTokenLimit)))
      : spec.defaultDailyTokenLimit;

  return {
    maxInputTokens: spec.maxInputTokens,
    maxOutputTokens,
    dailyTokenLimit,
    hardMaxOutputTokens,
  };
}

export function formatTokenCount(count: number): string {
  if (!Number.isFinite(count) || count <= 0) return '0';
  if (count >= 1000000) {
    const val = count / 1000000;
    return `${Number.isInteger(val) ? val : val.toFixed(1)}M`;
  }
  if (count >= 1000) {
    const val = count / 1000;
    return `${val >= 100 || Number.isInteger(val) ? Math.round(val) : val.toFixed(1)}K`;
  }
  return String(Math.round(count));
}

export function getTodayDateKey(nowMs: number = Date.now()): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

export function getModelDailyUsage(
  usageMap: Record<string, DailyModelTokenUsage> | undefined,
  modelId: LuxoModelId,
  nowMs: number = Date.now()
): DailyModelTokenUsage {
  const today = getTodayDateKey(nowMs);
  const existing = usageMap?.[modelId];
  if (existing && existing.date === today) {
    return existing;
  }
  return {
    date: today,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    requestCount: 0,
  };
}

export interface TokenQuotaCheckResult {
  allowed: boolean;
  reason?: 'daily_quota_exceeded' | 'input_too_large';
  estimatedInputTokens: number;
  usedTodayTokens: number;
  dailyLimitTokens: number;
  remainingDailyTokens: number;
  maxInputTokens: number;
  maxOutputTokens: number;
}

export function checkTokenQuotaForRequest(
  modelId: LuxoModelId,
  promptText: string,
  overrides?: Partial<Record<string, ModelTokenLimitOverride>>,
  usageMap?: Record<string, DailyModelTokenUsage>,
  nowMs: number = Date.now()
): TokenQuotaCheckResult {
  const limits = getEffectiveModelTokenLimits(modelId, overrides);
  const usage = getModelDailyUsage(usageMap, modelId, nowMs);
  const estimatedInputTokens = estimateTextTokens(promptText);
  const remainingDailyTokens = Math.max(
    0,
    limits.dailyTokenLimit - usage.totalTokens
  );

  if (estimatedInputTokens > limits.maxInputTokens) {
    return {
      allowed: false,
      reason: 'input_too_large',
      estimatedInputTokens,
      usedTodayTokens: usage.totalTokens,
      dailyLimitTokens: limits.dailyTokenLimit,
      remainingDailyTokens,
      maxInputTokens: limits.maxInputTokens,
      maxOutputTokens: limits.maxOutputTokens,
    };
  }

  if (usage.totalTokens >= limits.dailyTokenLimit) {
    return {
      allowed: false,
      reason: 'daily_quota_exceeded',
      estimatedInputTokens,
      usedTodayTokens: usage.totalTokens,
      dailyLimitTokens: limits.dailyTokenLimit,
      remainingDailyTokens: 0,
      maxInputTokens: limits.maxInputTokens,
      maxOutputTokens: limits.maxOutputTokens,
    };
  }

  return {
    allowed: true,
    estimatedInputTokens,
    usedTodayTokens: usage.totalTokens,
    dailyLimitTokens: limits.dailyTokenLimit,
    remainingDailyTokens,
    maxInputTokens: limits.maxInputTokens,
    maxOutputTokens: limits.maxOutputTokens,
  };
}

export function recordModelTokenUsage(
  usageMap: Record<string, DailyModelTokenUsage> | undefined,
  modelId: LuxoModelId,
  inputTokens: number,
  outputTokens: number,
  nowMs: number = Date.now()
): Record<string, DailyModelTokenUsage> {
  const today = getTodayDateKey(nowMs);
  const prev = getModelDailyUsage(usageMap, modelId, nowMs);
  const safeIn = Math.max(0, Math.round(inputTokens || 0));
  const safeOut = Math.max(0, Math.round(outputTokens || 0));
  return {
    ...(usageMap || {}),
    [modelId]: {
      date: today,
      inputTokens: prev.inputTokens + safeIn,
      outputTokens: prev.outputTokens + safeOut,
      totalTokens: prev.totalTokens + safeIn + safeOut,
      requestCount: prev.requestCount + 1,
    },
  };
}

export interface ModelAvailabilityStatus {
  unlocked: boolean;
  provider: AiProviderId;
  providerConfigured: boolean;
  reason?:
    | 'missing_api_key'
    | 'experimental_locked'
    | 'tier_locked'
    | 'guest_restricted';
  reasonLabelTr: string;
}

export function isModelExecutableWithProviders(
  modelId: LuxoModelId,
  providers: ProviderConnectionStatusMap,
  user?: Pick<LuxoUser, 'isGuest' | 'isUnlockedDev' | 'isUnlockedDevHelper'>,
  modelAllowGuest = true
): ModelAvailabilityStatus {
  const spec = getModelTokenSpec(modelId);

  if (modelId === 'luxo-dev' && !user?.isUnlockedDev) {
    return {
      unlocked: false,
      provider: spec.provider,
      providerConfigured: providers.google,
      reason: 'tier_locked',
      reasonLabelTr: 'Plus VIP Erişim Kilidi',
    };
  }
  if (
    modelId === 'luxo-dev-helper' &&
    !user?.isUnlockedDevHelper &&
    !user?.isUnlockedDev
  ) {
    return {
      unlocked: false,
      provider: spec.provider,
      providerConfigured: providers.google,
      reason: 'tier_locked',
      reasonLabelTr: 'Go Geliştirici Kilidi',
    };
  }
  if (user?.isGuest && !modelAllowGuest) {
    return {
      unlocked: false,
      provider: spec.provider,
      providerConfigured: providers.google,
      reason: 'guest_restricted',
      reasonLabelTr: 'Üyelik Gerekli',
    };
  }

  if (spec.provider === 'google' || spec.provider === 'luxo') {
    if (!providers.google) {
      return {
        unlocked: false,
        provider: spec.provider,
        providerConfigured: false,
        reason: 'missing_api_key',
        reasonLabelTr: 'GEMINI_API_KEY Gerekli',
      };
    }
    if (!spec.isLiveVerifiedGoogle) {
      return {
        unlocked: false,
        provider: spec.provider,
        providerConfigured: true,
        reason: 'experimental_locked',
        reasonLabelTr: 'Deneysel · Kilitli',
      };
    }
    return {
      unlocked: true,
      provider: spec.provider,
      providerConfigured: true,
      reasonLabelTr: 'Canlı API Hazır',
    };
  }

  if (spec.provider === 'media') {
    if (spec.supportsDirectMedia && providers.google) {
      return {
        unlocked: true,
        provider: 'media',
        providerConfigured: true,
        reasonLabelTr: 'Canlı Stüdyo Hazır',
      };
    }
    return {
      unlocked: false,
      provider: 'media',
      providerConfigured: false,
      reason: 'missing_api_key',
      reasonLabelTr: 'Harici Video/Görsel API Yok',
    };
  }

  if (spec.provider === 'global') {
    if (providers.openrouter) {
      return {
        unlocked: true,
        provider: 'global',
        providerConfigured: true,
        reasonLabelTr: 'OpenRouter Hazır',
      };
    }
    return {
      unlocked: false,
      provider: 'global',
      providerConfigured: false,
      reason: 'missing_api_key',
      reasonLabelTr: 'OPENROUTER_API_KEY Gerekli',
    };
  }

  const directConnected = Boolean(providers[spec.provider]);
  const viaOpenRouter = Boolean(providers.openrouter && spec.openRouterModelId);
  if (directConnected || viaOpenRouter) {
    return {
      unlocked: true,
      provider: spec.provider,
      providerConfigured: true,
      reasonLabelTr: directConnected ? 'Canlı API Hazır' : 'OpenRouter Hazır',
    };
  }

  const hint = PROVIDER_META[spec.provider]?.envKeyHint || 'API_KEY';
  return {
    unlocked: false,
    provider: spec.provider,
    providerConfigured: false,
    reason: 'missing_api_key',
    reasonLabelTr: `${hint} Gerekli`,
  };
}

export function loadModelTokenOverrides(): Partial<
  Record<LuxoModelId, ModelTokenLimitOverride>
> {
  try {
    const raw = localStorage.getItem(TOKEN_OVERRIDES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveModelTokenOverrides(
  overrides: Partial<Record<LuxoModelId, ModelTokenLimitOverride>>
): void {
  try {
    localStorage.setItem(TOKEN_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // ignore quota errors
  }
}

export function loadDailyTokenUsage(): Record<string, DailyModelTokenUsage> {
  try {
    const raw = localStorage.getItem(DAILY_USAGE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveDailyTokenUsage(
  usage: Record<string, DailyModelTokenUsage>
): void {
  try {
    localStorage.setItem(DAILY_USAGE_STORAGE_KEY, JSON.stringify(usage));
  } catch {
    // ignore quota errors
  }
}
