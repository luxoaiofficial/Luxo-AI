import type { AiProviderId } from '../types/luxo';

export interface LogoRegistryEntry {
  key: string;
  label: string;
  logoPath: string;
  alt: string;
  aspectRatio: '1:1';
  accentColor: string;
  darkSurfaceBg: string;
  lightSurfaceBg: string;
  fallbackGlyph: string;
}

export const LOGO_REGISTRY: Record<string, LogoRegistryEntry> = {
  luxo: {
    key: 'luxo',
    label: 'Luxo AI',
    logoPath: '/logos/luxo.svg',
    alt: 'Luxo AI workspace logo',
    aspectRatio: '1:1',
    accentColor: '#7c3aed',
    darkSurfaceBg: 'bg-[#171926]',
    lightSurfaceBg: 'bg-neutral-100',
    fallbackGlyph: 'LX',
  },
  google: {
    key: 'google',
    label: 'Google Gemini',
    logoPath: '/logos/gemini.svg',
    alt: 'Google Gemini logo',
    aspectRatio: '1:1',
    accentColor: '#3b82f6',
    darkSurfaceBg: 'bg-[#141e33]',
    lightSurfaceBg: 'bg-blue-50',
    fallbackGlyph: 'GM',
  },
  gemini: {
    key: 'gemini',
    label: 'Google Gemini',
    logoPath: '/logos/gemini.svg',
    alt: 'Google Gemini logo',
    aspectRatio: '1:1',
    accentColor: '#3b82f6',
    darkSurfaceBg: 'bg-[#141e33]',
    lightSurfaceBg: 'bg-blue-50',
    fallbackGlyph: 'GM',
  },
  openai: {
    key: 'openai',
    label: 'OpenAI',
    logoPath: '/logos/openai.svg',
    alt: 'OpenAI logo',
    aspectRatio: '1:1',
    accentColor: '#10a37f',
    darkSurfaceBg: 'bg-[#11241f]',
    lightSurfaceBg: 'bg-emerald-50',
    fallbackGlyph: 'OA',
  },
  anthropic: {
    key: 'anthropic',
    label: 'Anthropic Claude',
    logoPath: '/logos/anthropic.svg',
    alt: 'Anthropic logo',
    aspectRatio: '1:1',
    accentColor: '#d97757',
    darkSurfaceBg: 'bg-[#241914]',
    lightSurfaceBg: 'bg-orange-50',
    fallbackGlyph: 'CL',
  },
  claude: {
    key: 'claude',
    label: 'Claude',
    logoPath: '/logos/claude.svg',
    alt: 'Claude AI logo',
    aspectRatio: '1:1',
    accentColor: '#d97757',
    darkSurfaceBg: 'bg-[#241914]',
    lightSurfaceBg: 'bg-orange-50',
    fallbackGlyph: 'CL',
  },
  openrouter: {
    key: 'openrouter',
    label: 'OpenRouter',
    logoPath: '/logos/openrouter.svg',
    alt: 'OpenRouter logo',
    aspectRatio: '1:1',
    accentColor: '#8b5cf6',
    darkSurfaceBg: 'bg-[#1b1829]',
    lightSurfaceBg: 'bg-violet-50',
    fallbackGlyph: 'OR',
  },
  global: {
    key: 'global',
    label: 'OpenRouter / Global',
    logoPath: '/logos/openrouter.svg',
    alt: 'OpenRouter Global Gateway logo',
    aspectRatio: '1:1',
    accentColor: '#6366f1',
    darkSurfaceBg: 'bg-[#171b2e]',
    lightSurfaceBg: 'bg-indigo-50',
    fallbackGlyph: 'OR',
  },
  groq: {
    key: 'groq',
    label: 'Groq',
    logoPath: '/logos/groq.svg',
    alt: 'Groq LPU Inference logo',
    aspectRatio: '1:1',
    accentColor: '#f55036',
    darkSurfaceBg: 'bg-[#1f120e]',
    lightSurfaceBg: 'bg-orange-50',
    fallbackGlyph: 'GQ',
  },
  mistral: {
    key: 'mistral',
    label: 'Mistral AI',
    logoPath: '/logos/mistral.svg',
    alt: 'Mistral AI logo',
    aspectRatio: '1:1',
    accentColor: '#ea580c',
    darkSurfaceBg: 'bg-[#24160c]',
    lightSurfaceBg: 'bg-amber-50',
    fallbackGlyph: 'MS',
  },
  cerebras: {
    key: 'cerebras',
    label: 'Cerebras',
    logoPath: '/logos/cerebras.svg',
    alt: 'Cerebras AI logo',
    aspectRatio: '1:1',
    accentColor: '#f97316',
    darkSurfaceBg: 'bg-[#1c100b]',
    lightSurfaceBg: 'bg-orange-50',
    fallbackGlyph: 'CB',
  },
  nvidia: {
    key: 'nvidia',
    label: 'NVIDIA NIM',
    logoPath: '/logos/nvidia.svg',
    alt: 'NVIDIA NIM logo',
    aspectRatio: '1:1',
    accentColor: '#76b900',
    darkSurfaceBg: 'bg-[#122114]',
    lightSurfaceBg: 'bg-lime-50',
    fallbackGlyph: 'NV',
  },
  cloudflare: {
    key: 'cloudflare',
    label: 'Cloudflare Workers AI',
    logoPath: '/logos/cloudflare.svg',
    alt: 'Cloudflare Workers AI logo',
    aspectRatio: '1:1',
    accentColor: '#f38020',
    darkSurfaceBg: 'bg-[#1e140b]',
    lightSurfaceBg: 'bg-amber-50',
    fallbackGlyph: 'CF',
  },
  sambanova: {
    key: 'sambanova',
    label: 'SambaNova',
    logoPath: '/logos/sambanova.svg',
    alt: 'SambaNova Systems logo',
    aspectRatio: '1:1',
    accentColor: '#c026d3',
    darkSurfaceBg: 'bg-[#1e1029]',
    lightSurfaceBg: 'bg-fuchsia-50',
    fallbackGlyph: 'SN',
  },
  cohere: {
    key: 'cohere',
    label: 'Cohere',
    logoPath: '/logos/cohere.svg',
    alt: 'Cohere AI logo',
    aspectRatio: '1:1',
    accentColor: '#39594d',
    darkSurfaceBg: 'bg-[#12211d]',
    lightSurfaceBg: 'bg-emerald-50',
    fallbackGlyph: 'CO',
  },
  huggingface: {
    key: 'huggingface',
    label: 'Hugging Face',
    logoPath: '/logos/huggingface.svg',
    alt: 'Hugging Face logo',
    aspectRatio: '1:1',
    accentColor: '#ffd21e',
    darkSurfaceBg: 'bg-[#231d0b]',
    lightSurfaceBg: 'bg-yellow-50',
    fallbackGlyph: 'HF',
  },
  deepseek: {
    key: 'deepseek',
    label: 'DeepSeek',
    logoPath: '/logos/deepseek.svg',
    alt: 'DeepSeek AI logo',
    aspectRatio: '1:1',
    accentColor: '#4f46e5',
    darkSurfaceBg: 'bg-[#141731]',
    lightSurfaceBg: 'bg-indigo-50',
    fallbackGlyph: 'DS',
  },
  xai: {
    key: 'xai',
    label: 'xAI Grok',
    logoPath: '/logos/grok.svg',
    alt: 'xAI Grok logo',
    aspectRatio: '1:1',
    accentColor: '#71717a',
    darkSurfaceBg: 'bg-[#19191f]',
    lightSurfaceBg: 'bg-zinc-100',
    fallbackGlyph: 'XK',
  },
  grok: {
    key: 'grok',
    label: 'xAI Grok',
    logoPath: '/logos/grok.svg',
    alt: 'xAI Grok logo',
    aspectRatio: '1:1',
    accentColor: '#71717a',
    darkSurfaceBg: 'bg-[#19191f]',
    lightSurfaceBg: 'bg-zinc-100',
    fallbackGlyph: 'XK',
  },
  qwen: {
    key: 'qwen',
    label: 'Alibaba Qwen',
    logoPath: '/logos/qwen.svg',
    alt: 'Alibaba Qwen logo',
    aspectRatio: '1:1',
    accentColor: '#7c3aed',
    darkSurfaceBg: 'bg-[#1c1430]',
    lightSurfaceBg: 'bg-purple-50',
    fallbackGlyph: 'QW',
  },
  meta: {
    key: 'meta',
    label: 'Meta Llama',
    logoPath: '/logos/meta.svg',
    alt: 'Meta Llama logo',
    aspectRatio: '1:1',
    accentColor: '#0284c7',
    darkSurfaceBg: 'bg-[#111e2e]',
    lightSurfaceBg: 'bg-sky-50',
    fallbackGlyph: 'MT',
  },
  perplexity: {
    key: 'perplexity',
    label: 'Perplexity',
    logoPath: '/logos/perplexity.svg',
    alt: 'Perplexity Sonar logo',
    aspectRatio: '1:1',
    accentColor: '#0d9488',
    darkSurfaceBg: 'bg-[#112423]',
    lightSurfaceBg: 'bg-teal-50',
    fallbackGlyph: 'PX',
  },
  media: {
    key: 'media',
    label: 'Luxo Cinema & Studio',
    logoPath: '/logos/cinema.svg',
    alt: 'Luxo Visual & Cinema Studio logo',
    aspectRatio: '1:1',
    accentColor: '#db2777',
    darkSurfaceBg: 'bg-[#261221]',
    lightSurfaceBg: 'bg-pink-50',
    fallbackGlyph: 'VD',
  },
  luna: {
    key: 'luna',
    label: 'Luxo Luna',
    logoPath: '/logos/luna.svg',
    alt: 'Luxo Luna logo',
    aspectRatio: '1:1',
    accentColor: '#6366f1',
    darkSurfaceBg: 'bg-[#161730]',
    lightSurfaceBg: 'bg-indigo-50',
    fallbackGlyph: 'LN',
  },
  sol: {
    key: 'sol',
    label: 'Luxo Sol',
    logoPath: '/logos/sol.svg',
    alt: 'Luxo Sol logo',
    aspectRatio: '1:1',
    accentColor: '#f59e0b',
    darkSurfaceBg: 'bg-[#241b0c]',
    lightSurfaceBg: 'bg-amber-50',
    fallbackGlyph: 'SL',
  },
};

export function resolveLogoForEntity(input: {
  provider?: AiProviderId;
  modelId?: string;
  logoKey?: string;
}): LogoRegistryEntry {
  const keyRaw = String(input.logoKey || '').trim().toLowerCase();
  if (keyRaw && LOGO_REGISTRY[keyRaw]) {
    return LOGO_REGISTRY[keyRaw];
  }

  const mId = String(input.modelId || '').toLowerCase();
  if (mId.includes('llama') || mId.startsWith('meta-')) return LOGO_REGISTRY.meta;
  if (mId.includes('claude') || mId.startsWith('anthropic/')) return LOGO_REGISTRY.claude;
  if (mId.includes('gpt-') || mId.includes('chatgpt') || mId.startsWith('openai/') || mId.startsWith('o1') || mId.startsWith('o3') || mId.startsWith('o4')) {
    return LOGO_REGISTRY.openai;
  }
  if (mId.includes('gemini') || mId.includes('gemma') || mId.includes('antigravity') || mId.includes('deep-research')) {
    return LOGO_REGISTRY.gemini;
  }
  if (mId.includes('deepseek')) return LOGO_REGISTRY.deepseek;
  if (mId.includes('mistral') || mId.includes('codestral') || mId.includes('pixtral') || mId.includes('magistral')) {
    return LOGO_REGISTRY.mistral;
  }
  if (mId.includes('qwen') || mId.includes('qwq')) return LOGO_REGISTRY.qwen;
  if (mId.includes('grok')) return LOGO_REGISTRY.grok;
  if (mId.includes('nvidia') || mId.includes('nemotron')) return LOGO_REGISTRY.nvidia;
  if (mId.includes('cohere') || mId.includes('command-')) return LOGO_REGISTRY.cohere;
  if (mId.includes('perplexity') || mId.includes('sonar')) return LOGO_REGISTRY.perplexity;
  if (mId.includes('luna')) return LOGO_REGISTRY.luna;
  if (mId.includes('sol')) return LOGO_REGISTRY.sol;
  if (mId.includes('veo') || mId.includes('nano-banana') || mId.includes('imagen')) return LOGO_REGISTRY.media;
  if (mId.startsWith('groq:')) return LOGO_REGISTRY.groq;
  if (mId.startsWith('cerebras:')) return LOGO_REGISTRY.cerebras;
  if (mId.startsWith('nvidia:')) return LOGO_REGISTRY.nvidia;
  if (mId.startsWith('cloudflare:')) return LOGO_REGISTRY.cloudflare;
  if (mId.startsWith('sambanova:')) return LOGO_REGISTRY.sambanova;
  if (mId.startsWith('huggingface:')) return LOGO_REGISTRY.huggingface;

  const pKey = String(input.provider || '').trim().toLowerCase();
  if (pKey && LOGO_REGISTRY[pKey]) {
    return LOGO_REGISTRY[pKey];
  }

  return LOGO_REGISTRY.luxo;
}

export function listAllLogoEntries(): LogoRegistryEntry[] {
  const seen = new Set<string>();
  return Object.values(LOGO_REGISTRY).filter((entry) => {
    if (seen.has(entry.logoPath)) return false;
    seen.add(entry.logoPath);
    return true;
  });
}
