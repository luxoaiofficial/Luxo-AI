export type LuxoModelId =
  // Google Gemini & DeepMind (19)
  | 'gemini-4-argon'
  | 'gemini-4-hydrogen'
  | 'gemini-4-carbon'
  | 'gemini-4-neon'
  | 'gemini-4-ultra'
  | 'gemini-4-pro-code'
  | 'gemini-3-8-pro'
  | 'gemini-3-8-flash'
  | 'gemini-3-8-live-think'
  | 'gemini-3-1-pro'
  | 'gemini-3-1-flash-lite'
  | 'gemini-flash-latest'
  | 'gemini-omni-flash'
  | 'antigravity-agent'
  | 'deep-research-agent'
  | 'deep-research-max'
  | 'gemini-transcribe'
  | 'gemma-open-27b'
  | 'gemma-3-12b'
  // OpenAI & ChatGPT (17)
  | 'chatgpt-5-2-pro'
  | 'gpt-image-2-ultra'
  | 'chatgpt-5-omni'
  | 'gpt-5-pro'
  | 'chatgpt-5-mini'
  | 'gpt-4-5-orion'
  | 'gpt-4-1'
  | 'gpt-4-1-mini'
  | 'gpt-4-1-nano'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'openai-o4-pro'
  | 'chatgpt-o3-pro'
  | 'openai-o3'
  | 'openai-o4-mini'
  | 'openai-o1-pro'
  | 'openai-codex-agent'
  | 'gpt-astra'
  // Anthropic Claude (13)
  | 'claude-5-2-fable'
  | 'claude-5-5-opus'
  | 'claude-5-5-sonnet'
  | 'claude-5-5-haiku'
  | 'claude-4-6-opus'
  | 'claude-4-5-sonnet'
  | 'claude-4-opus'
  | 'claude-4-sonnet'
  | 'claude-4-haiku'
  | 'claude-3-7-sonnet'
  | 'claude-3-5-sonnet'
  | 'claude-3-5-haiku'
  | 'claude-3-opus'
  // DeepSeek (9)
  | 'deepseek-v3-2-exp'
  | 'deepseek-r2'
  | 'deepseek-v3-1'
  | 'deepseek-r1'
  | 'deepseek-r1-zero'
  | 'deepseek-v3-turbo'
  | 'deepseek-coder-v3'
  | 'deepseek-math-v2'
  | 'deepseek-prover-v2'
  // xAI Grok & Meta Llama (10)
  | 'grok-4-heavy'
  | 'grok-3-ultra'
  | 'grok-3-thinking'
  | 'grok-3-mini'
  | 'grok-2-vision'
  | 'llama-4-behemoth'
  | 'llama-4-reasoning'
  | 'llama-4-maverick'
  | 'llama-4-scout'
  | 'llama-3-3-70b'
  // Mistral & Alibaba Qwen (12)
  | 'mistral-large-2'
  | 'mistral-medium-3'
  | 'mistral-saba'
  | 'codestral-25'
  | 'pixtral-large'
  | 'magistral-reasoning'
  | 'qwen-3-max'
  | 'qwen-3-coder-plus'
  | 'qwen-3-thinking'
  | 'qwen-2-5-coder'
  | 'qwq-32b'
  | 'qwen-vl-max'
  | 'qwen-image-edit-pro'
  // Sinema, Görsel & Ses AI (18)
  | 'nano-banana-2-1-ultra'
  | 'nano-banana-pro-4k'
  | 'imagen-4-ultra'
  | 'flux-1-1-pro-ultra'
  | 'veo-3-1-ultra-cinema'
  | 'veo-3-cinema-pro'
  | 'wan-2-2-cinema-ultra'
  | 'kling-2-5-turbo'
  | 'higgsfield-cinema'
  | 'higgsfield-dop-turbo'
  | 'sora-veo-director'
  | 'runway-gen-4'
  | 'kling-2-master'
  | 'seedance-1-pro'
  | 'hailuo-minimax-video'
  | 'luma-ray-2'
  | 'pika-2-2-studio'
  | 'midjourney-v7-art'
  // Perplexity & Küresel AI (13)
  | 'perplexity-sonar-pro'
  | 'perplexity-reasoning'
  | 'perplexity-research'
  | 'kimi-k2-thinking'
  | 'kimi-k1-5'
  | 'cohere-command-a'
  | 'cohere-command-r-plus'
  | 'microsoft-phi-4'
  | 'amazon-nova-premier'
  | 'nvidia-nemotron-ultra'
  | 'glm-4-plus'
  | 'minimax-01'
  | 'yi-lightning'
  // Luxo Özel (9)
  | 'luxo-auto-router'
  | 'luxo-flash'
  | 'luxo-ultra'
  | 'luxo-argon'
  | 'luxo-quantum-math'
  | 'luxo-sol'
  | 'luxo-luna'
  | 'luxo-dev-helper'
  | 'luxo-dev';

export type LuxoModelCategory =
  | 'Google Gemini'
  | 'OpenAI & ChatGPT'
  | 'Anthropic Claude'
  | 'DeepSeek'
  | 'Grok & Meta Llama'
  | 'Mistral & Qwen'
  | 'Sinema & Görsel AI'
  | 'Perplexity & Küresel AI'
  | 'Luxo Özel';

export type SynthesisMode =
  | 'standart'
  | 'uzman-mimari'
  | 'akademik-kanit'
  | 'yaratici-vizyon';

export type ChatCreationMode = 'auto' | 'image' | 'video';

export type PrebuiltGeminiVoice =
  | 'Puck'
  | 'Charon'
  | 'Kore'
  | 'Fenrir'
  | 'Zephyr';

export type NanoBananaModelId =
  | 'gemini-nano-banana-2.1'
  | 'gemini-3-pro-image'
  | 'gemini-3.1-flash-lite-image';

export type NanoLensPresetId =
  | '35mm-cinema'
  | '85mm-portrait'
  | 'imax-anamorphic'
  | 'macro-crystal'
  | 'studio-product';

export type FrameInterpolationMode = 'standard-24fps' | 'optical-60fps';

export type VisualAspectRatio =
  | '1:1'
  | '16:9'
  | '9:16'
  | '3:4'
  | '4:3'
  | '4:1'
  | '1:4'
  | '8:1'
  | '1:8';
export type ImageResolutionSize = '1K' | '2K' | '4K';
export type VideoResolutionSize = '720p' | '1080p' | '4k';
export type VideoDurationOption = '5s' | '10s';

export interface CinematicMotionParams {
  cameraSpeed: number; // 0.25x to 2.5x
  pan: number; // -100 to +100 degrees
  tilt: number; // -90 to +90 degrees
}

export interface LuxoModelConfig {
  id: LuxoModelId;
  name: string;
  category: LuxoModelCategory;
  sdkBackend: string;
  allowGuest?: boolean;
  tagline: string;
  description: string;
  badge: string;
  speed: string;
  isLocked: boolean;
  accentColor: string;
  thinkingLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  tier: 'free' | 'go' | 'plus';
  contextWindow: string;
  capabilities: string[];
  systemInstruction: string;
  logoUrl?: string;
}

export interface LuxoVoiceOption {
  name: string;
  desc: string;
  sample: string;
  pitch: number;
  rate: number;
  accentColor: string;
  geminiVoice: PrebuiltGeminiVoice;
  acousticStyle: string;
  isNew?: boolean;
}

export interface LuxoUser {
  id: string;
  name: string;
  avatarText: string;
  avatarUrl?: string;
  isGuest: boolean;
  emailVerified?: boolean;
  isUnlockedDev: boolean;
  isUnlockedDevHelper: boolean;
  ageGroup: string;
  theme: 'system' | 'light' | 'dark';
  accentColor: string;
  customInstructions: string;
  customTone?: string;
  customWarmth?: string;
  customEnthusiasm?: string;
  customFormatting?: string;
  customEmoji?: string;
  workspaceType?: string;
  voiceName?: string;
  voiceRate?: number;
  guestMessageCount: number;
  fontSize?: 'sm' | 'base' | 'lg';
  codeTheme?: 'dark' | 'dracula' | 'light';
  defaultModelId?: LuxoModelId;
  reasoningLevel?: 'fast' | 'balanced' | 'deep';
  showThinkingSteps?: boolean;
  temperature?: number;
  compactLayout?: boolean;
  streamSpeed?: 'normal' | 'turbo' | 'instant';
  responseConciseness?: 'concise' | 'balanced' | 'detailed';
  codeStrictness?: 'production' | 'explained';
  autoVerifyOutputs?: boolean;
  pinnedWorkspaces?: PinnedWorkspaceId[];
  disabledModelIds?: LuxoModelId[];
}

export interface CitationItem {
  title: string;
  domain: string;
  url: string;
  snippet: string;
}

export interface InlineAttachmentPayload {
  mimeType: string;
  data: string;
  name?: string;
}

export interface ComparisonModelResponse {
  modelId: LuxoModelId;
  content: string;
  thinkingSteps?: string[];
  citations?: CitationItem[];
  latencyMs?: number;
  isStreaming?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  modelId?: LuxoModelId;
  authorName?: string;
  authorColor?: string;
  thinkingSteps?: string[];
  citations?: CitationItem[];
  followUpSuggestions?: string[];
  comparisonResponses?: ComparisonModelResponse[];
  preferredComparisonModelId?: LuxoModelId;
  imageUrl?: string;
  videoUrl?: string;
  posterUrl?: string;
  attachmentName?: string;
  inlineAttachment?: InlineAttachmentPayload;
  isPinned?: boolean;
  liked?: boolean;
  disliked?: boolean;
}

export interface ChatThread {
  id: string;
  userId?: string;
  projectId?: string;
  title: string;
  modelId: LuxoModelId;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface LuxoProject {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  category: 'Yazılım' | 'Araştırma' | 'Tasarım' | 'İş & Strateji';
  updatedAt: number;
  filesCount: number;
  color: string;
}

export interface LibraryItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  type: 'web' | 'image' | 'document' | 'folder' | 'code';
  tab: 'Önerilenler' | 'Favoriler' | 'Klasörler' | 'Kaydedilenler';
  createdAt: string;
  isFavorite?: boolean;
}

export interface ScheduledRoutine {
  id: string;
  title: string;
  time: string;
  modelId: LuxoModelId;
  prompt: string;
  active: boolean;
  lastRun?: string;
}

export interface LuxoPlugin {
  id: string;
  name: string;
  category: string;
  description: string;
  enabled: boolean;
  color: string;
}

export interface GeneratedVisual {
  id: string;
  mediaType?: 'image' | 'video';
  title: string;
  prompt: string;
  style: string;
  aspectRatio: VisualAspectRatio;
  dataUrl: string;
  videoUrl?: string;
  posterUrl?: string;
  engineLabel?: string;
  modelUsed?: string;
  resolution?: string;
  duration?: string;
  highFidelity?: boolean;
  fps?: number;
  frameInterpolation?: FrameInterpolationMode;
  lensPreset?: string;
  negativePrompt?: string;
  motionControl?: CinematicMotionParams;
  interactionId?: string;
  createdAt: number;
}

export interface SharedContentPayload {
  title: string;
  excerpt: string;
  contentType: 'chat' | 'code' | 'image' | 'video' | 'library' | 'blog' | 'forum';
  badge?: string;
  shareUrl?: string;
  ogImage?: string;
}

export interface SocialShareLinks {
  shareUrl: string;
  twitter: string;
  facebook: string;
  linkedin: string;
  whatsapp: string;
  reddit: string;
  telegram: string;
}

export type TrainingConsentStatus = 'unset' | 'granted' | 'denied';

export interface EvolutionLearnedRule {
  id: string;
  title: string;
  directive: string;
  category: LuxoModelCategory | 'Tüm Modeller';
  targetModelId?: LuxoModelId;
  source:
    | 'autonomous-critic'
    | 'chat-feedback'
    | 'auto-repair'
    | 'custom-training'
    | 'benchmark-gate';
  confidenceGain: number;
  enabled: boolean;
  createdAt: number;
  testPrompt: string;
}

export interface ModelCalibrationBoost {
  modelId: LuxoModelId;
  boostCount: number;
  accuracyDelta: number;
  latencySavedMs: number;
  customFocusDirective?: string;
  lastBoostedAt: number;
}

export interface EvolutionBenchmarkCase {
  id: string;
  domain: string;
  category: LuxoModelCategory;
  modelId: LuxoModelId;
  prompt: string;
  expectedInvariant: string;
  passed: boolean;
  score: number;
  latencyMs: number;
  verifiedExcerpt: string;
  evaluatedAt: number;
}

export interface EcosystemCalibration {
  category: LuxoModelCategory;
  modelCount: number;
  accuracyScore: number;
  avgLatencyMs: number;
  patchesApplied: number;
  routingBoost: number;
  keyUpgradeNote: string;
  lastCalibratedAt: number;
}

export interface EvolutionCycleLog {
  id: string;
  generation: number;
  timestamp: number;
  trigger:
    | 'manual'
    | 'auto-site'
    | 'chat-signal'
    | 'full-audit'
    | 'custom-train'
    | 'benchmark';
  targetCategory: LuxoModelCategory | 'Tüm Modeller';
  challengerFinding: string;
  appliedPatch: string;
  verifiedGain: string;
}

export interface AdaptiveSiteSuggestion {
  id: string;
  title: string;
  subtitle: string;
  prompt: string;
  recommendedModelId: LuxoModelId;
}

export interface EvolutionCycleMetric {
  generation: number;
  timestamp: number;
  avgAccuracy: number;
  avgLatencyMs: number;
  bugsPatched: number;
  trigger: EvolutionCycleLog['trigger'];
}

export interface EvolutionModelMetric {
  modelId: string;
  latencyMs: number;
  successRate: number; // 0..100
  callCount: number;
  lastUsedAt: number;
}

export interface SelfEvolutionState {
  generation: number;
  autoEvolutionEnabled: boolean;
  totalCyclesRun: number;
  totalBugsPatched: number;
  consentedSignalsProcessed: number;
  learnedRules: EvolutionLearnedRule[];
  ecosystems: EcosystemCalibration[];
  modelBoosts?: Record<string, ModelCalibrationBoost>;
  modelUsageCounts?: Record<string, number>;
  modelMetrics?: Record<string, EvolutionModelMetric>;
  cycleHistory?: EvolutionCycleMetric[];
  benchmarkResults?: EvolutionBenchmarkCase[];
  recentLogs: EvolutionCycleLog[];
  adaptiveSuggestions: AdaptiveSiteSuggestion[];
  lastUpdatedAt: number;
}

export type NotificationCategory =
  | 'message'
  | 'post_activity'
  | 'system_update';

export interface NotificationPreferences {
  messagesEnabled: boolean;
  postActivityEnabled: boolean;
  systemUpdatesEnabled: boolean;
  soundEnabled: boolean;
  digestMode: 'instant' | 'daily';
}

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  targetView?: AppView;
}

export interface CodeSnapshot {
  id: string;
  label: string;
  mode: 'web' | 'js-console';
  html: string;
  css: string;
  js: string;
  createdAt: number;
  source: 'template' | 'manual' | 'ai-generated';
}

export type PinnedWorkspaceId =
  | 'chat'
  | 'studio'
  | 'images'
  | 'projects'
  | 'library'
  | 'cms'
  | 'model-metrics'
  | 'evolution'
  | 'social'
  | 'settings';

export type AppView =
  | 'welcome'
  | 'dashboard'
  | 'chat'
  | 'studio'
  | 'images'
  | 'evolution'
  | 'hub'
  | 'social'
  | 'library'
  | 'projects'
  | 'settings';
