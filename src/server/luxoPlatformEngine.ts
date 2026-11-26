import crypto from 'node:crypto';
import fs from 'node:fs';
import type express from 'express';
import type { GoogleGenAI } from '@google/genai';
import { extractText } from 'unpdf';
import firebaseConfig from '../../firebase-applet-config.json';
import type {
  AdminAuditEntry,
  CatalogModelEntry,
  DiscoveredModelCandidate,
  DiscoveryRunLog,
  ModelPricingTierStatus,
  PlatformProviderConfig,
  ProviderConnectionStatusMap,
} from '../types/luxo.ts';
import { LUXO_MODELS } from '../utils/luxoLogic.ts';
import {
  BUILTIN_PROVIDERS,
  buildUnifiedCatalog,
} from '../utils/providerRegistry.ts';
import {
  DEFAULT_ZERO_COST_POLICY,
  evaluateZeroCostAccess,
  type ZeroCostPolicyState,
} from '../utils/zeroCostPolicy.ts';
import {
  isValidSecretEnvVarName,
  validateCustomProviderUrl,
} from '../utils/ssrfGuard.ts';
import {
  diffDiscoveredCandidates,
  normalizeGoogleGeminiModelsPayload,
  normalizeOpenAiCompatibleModelsPayload,
  normalizeOpenRouterModelsPayload,
  promoteCandidateToCatalogEntry,
} from '../utils/discoveryEngine.ts';
import {
  chunkTextWithOverlap,
  formatRagContextBlock,
  type KnowledgeChunkRecord,
  type KnowledgeSearchResult,
  normalizeDocumentText,
  searchKnowledgeChunks,
} from '../utils/ragEngine.ts';
import { estimateTextTokens } from '../utils/tokenLimitsEngine.ts';
import { resolveLogoForEntity } from '../utils/logoRegistry.ts';

const PLATFORM_STATE_FILE = '/tmp/luxo_v2_platform_state.json';
const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export const BOOTSTRAPPED_ADMIN_EMAIL = 'luxoaiofficial@gmail.com';

export interface KnowledgeDocStored {
  id: string;
  title: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  chunkCount: number;
  embeddingMode: 'gemini-embedding-2' | 'lexical-fallback';
  projectId?: string;
  previewText: string;
  createdAt: number;
}

export interface ServerPlatformState {
  zeroCostPolicy: ZeroCostPolicyState;
  dailyZeroCostRequests: { date: string; count: number };
  customProviders: Omit<PlatformProviderConfig, 'connected'>[];
  customModels: CatalogModelEntry[];
  disabledModelIds: string[];
  discoveryQueue: DiscoveredModelCandidate[];
  discoveryLogs: DiscoveryRunLog[];
  autoDiscoveryIntervalHours: number;
  lastDiscoveryAt: number | null;
  knowledgeDocs: KnowledgeDocStored[];
  knowledgeChunks: KnowledgeChunkRecord[];
  auditLogs: AdminAuditEntry[];
  usageStats: {
    totalRequests: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    byProvider: Record<string, { requests: number; tokens: number }>;
  };
}

function createInitialPlatformState(): ServerPlatformState {
  return {
    zeroCostPolicy: { ...DEFAULT_ZERO_COST_POLICY },
    dailyZeroCostRequests: {
      date: new Date().toISOString().slice(0, 10),
      count: 0,
    },
    customProviders: [],
    customModels: [],
    disabledModelIds: [],
    discoveryQueue: [],
    discoveryLogs: [],
    autoDiscoveryIntervalHours: 0,
    lastDiscoveryAt: null,
    knowledgeDocs: [],
    knowledgeChunks: [],
    auditLogs: [],
    usageStats: {
      totalRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      byProvider: {},
    },
  };
}

function loadPlatformState(): ServerPlatformState {
  const base = createInitialPlatformState();
  try {
    if (fs.existsSync(PLATFORM_STATE_FILE)) {
      const raw = JSON.parse(
        fs.readFileSync(PLATFORM_STATE_FILE, 'utf-8')
      ) as Partial<ServerPlatformState>;
      return {
        ...base,
        ...raw,
        zeroCostPolicy: {
          ...DEFAULT_ZERO_COST_POLICY,
          ...(raw.zeroCostPolicy || {}),
        },
        customProviders: Array.isArray(raw.customProviders)
          ? raw.customProviders
          : [],
        customModels: Array.isArray(raw.customModels) ? raw.customModels : [],
        disabledModelIds: Array.isArray(raw.disabledModelIds)
          ? raw.disabledModelIds
          : [],
        discoveryQueue: Array.isArray(raw.discoveryQueue)
          ? raw.discoveryQueue
          : [],
        discoveryLogs: Array.isArray(raw.discoveryLogs)
          ? raw.discoveryLogs
          : [],
        knowledgeDocs: Array.isArray(raw.knowledgeDocs)
          ? raw.knowledgeDocs
          : [],
        knowledgeChunks: Array.isArray(raw.knowledgeChunks)
          ? raw.knowledgeChunks
          : [],
        auditLogs: Array.isArray(raw.auditLogs) ? raw.auditLogs : [],
        usageStats: raw.usageStats || base.usageStats,
      };
    }
  } catch {
    // fallback to clean initial state
  }
  return base;
}

export let platformState: ServerPlatformState = loadPlatformState();

export function persistPlatformState(): void {
  try {
    fs.writeFileSync(PLATFORM_STATE_FILE, JSON.stringify(platformState), 'utf-8');
  } catch {
    // ignore disk persistence error in constrained environments
  }
}

export function hasConfiguredEnvSecret(envName?: string): boolean {
  if (!envName) return false;
  const val = String(process.env[envName] || '').trim();
  return Boolean(
    val &&
      !val.startsWith('MY_') &&
      !val.startsWith('YOUR_') &&
      val !== 'undefined' &&
      val !== 'null'
  );
}

export function getExpandedProviderConnectionStatus(): ProviderConnectionStatusMap {
  const map: ProviderConnectionStatusMap = {
    google: hasConfiguredEnvSecret('GEMINI_API_KEY'),
    openai: hasConfiguredEnvSecret('OPENAI_API_KEY'),
    anthropic: hasConfiguredEnvSecret('ANTHROPIC_API_KEY'),
    deepseek: hasConfiguredEnvSecret('DEEPSEEK_API_KEY'),
    xai:
      hasConfiguredEnvSecret('XAI_API_KEY') ||
      hasConfiguredEnvSecret('GROK_API_KEY'),
    mistral: hasConfiguredEnvSecret('MISTRAL_API_KEY'),
    perplexity: hasConfiguredEnvSecret('PERPLEXITY_API_KEY'),
    qwen:
      hasConfiguredEnvSecret('DASHSCOPE_API_KEY') ||
      hasConfiguredEnvSecret('QWEN_API_KEY'),
    openrouter: hasConfiguredEnvSecret('OPENROUTER_API_KEY'),
    groq: hasConfiguredEnvSecret('GROQ_API_KEY'),
    cerebras: hasConfiguredEnvSecret('CEREBRAS_API_KEY'),
    nvidia: hasConfiguredEnvSecret('NVIDIA_API_KEY'),
    cloudflare:
      hasConfiguredEnvSecret('CLOUDFLARE_API_TOKEN') &&
      hasConfiguredEnvSecret('CLOUDFLARE_ACCOUNT_ID'),
    sambanova: hasConfiguredEnvSecret('SAMBANOVA_API_KEY'),
    cohere: hasConfiguredEnvSecret('COHERE_API_KEY'),
    huggingface: hasConfiguredEnvSecret('HUGGINGFACE_API_KEY'),
  };
  for (const cp of platformState.customProviders) {
    if (!cp.enabled) {
      map[cp.id] = false;
    } else {
      map[cp.id] = hasConfiguredEnvSecret(cp.secretEnvName);
    }
  }
  return map;
}

export function getAllPlatformProviders(): PlatformProviderConfig[] {
  const statusMap = getExpandedProviderConnectionStatus();
  const combined = [...BUILTIN_PROVIDERS, ...platformState.customProviders];
  return combined.map((p) => ({
    ...p,
    connected: Boolean(statusMap[p.id]) && p.enabled,
  }));
}

export function getTodayZeroCostRequestCount(): number {
  const today = new Date().toISOString().slice(0, 10);
  if (platformState.dailyZeroCostRequests.date !== today) {
    platformState.dailyZeroCostRequests = { date: today, count: 0 };
  }
  return platformState.dailyZeroCostRequests.count;
}

export function incrementPlatformUsageStats(params: {
  providerId: string;
  inputTokens: number;
  outputTokens: number;
}): void {
  const today = new Date().toISOString().slice(0, 10);
  if (platformState.dailyZeroCostRequests.date !== today) {
    platformState.dailyZeroCostRequests = { date: today, count: 0 };
  }
  platformState.dailyZeroCostRequests.count += 1;

  const safeIn = Math.max(0, Math.round(params.inputTokens || 0));
  const safeOut = Math.max(0, Math.round(params.outputTokens || 0));
  platformState.usageStats.totalRequests += 1;
  platformState.usageStats.totalInputTokens += safeIn;
  platformState.usageStats.totalOutputTokens += safeOut;

  const cur = platformState.usageStats.byProvider[params.providerId] || {
    requests: 0,
    tokens: 0,
  };
  platformState.usageStats.byProvider[params.providerId] = {
    requests: cur.requests + 1,
    tokens: cur.tokens + safeIn + safeOut,
  };
  persistPlatformState();
}

export function appendAdminAuditLog(params: {
  actorUid: string;
  actorEmail: string;
  action: string;
  target: string;
  detail: string;
}): void {
  platformState.auditLogs.unshift({
    id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    actorUid: params.actorUid,
    actorEmail: params.actorEmail,
    action: params.action,
    target: params.target,
    detail: params.detail.slice(0, 280),
  });
  platformState.auditLogs = platformState.auditLogs.slice(0, 120);
  persistPlatformState();
}

export function getServerUnifiedCatalog(): CatalogModelEntry[] {
  const providersStatus = getExpandedProviderConnectionStatus();
  return buildUnifiedCatalog({
    legacyModels: LUXO_MODELS,
    customProviders: getAllPlatformProviders(),
    customModels: platformState.customModels,
    disabledModelIds: new Set(platformState.disabledModelIds),
    providersStatus,
    zeroCostPolicy: platformState.zeroCostPolicy,
    requestsToday: getTodayZeroCostRequestCount(),
  });
}

export function checkModelServerExecutionPolicy(modelId: string): {
  allowed: boolean;
  httpStatus: number;
  errorCode?: string;
  message: string;
  catalogEntry?: CatalogModelEntry;
} {
  const catalog = getServerUnifiedCatalog();
  const entry = catalog.find((m) => m.id === modelId);
  if (!entry) {
    return {
      allowed: false,
      httpStatus: 404,
      errorCode: 'MODEL_NOT_FOUND',
      message: `Model "${modelId}" was not found in the active catalog.`,
    };
  }
  if (!entry.enabled) {
    return {
      allowed: false,
      httpStatus: 403,
      errorCode: 'MODEL_DISABLED',
      message: `Model "${entry.name}" is disabled by the administrator.`,
      catalogEntry: entry,
    };
  }

  const zc = evaluateZeroCostAccess({
    modelId: entry.id,
    pricingStatus: entry.pricingStatus,
    policy: platformState.zeroCostPolicy,
    requestsToday: getTodayZeroCostRequestCount(),
  });
  if (!zc.allowed) {
    return {
      allowed: false,
      httpStatus: 403,
      errorCode: zc.reasonCode || 'ZERO_COST_MODE_BLOCKED',
      message: zc.message,
      catalogEntry: entry,
    };
  }

  const providersStatus = getExpandedProviderConnectionStatus();
  const hasDirectKey = Boolean(providersStatus[entry.providerId]);
  const canUseOpenRouterFallback =
    entry.providerId !== 'google' &&
    !platformState.zeroCostPolicy.enabled &&
    Boolean(providersStatus.openrouter && entry.openRouterModelId);

  if (!hasDirectKey && !canUseOpenRouterFallback) {
    return {
      allowed: false,
      httpStatus: 403,
      errorCode: 'PROVIDER_KEY_MISSING',
      message: `${entry.name} is locked: ${entry.providerLabel} server credential is not configured.`,
      catalogEntry: entry,
    };
  }

  return {
    allowed: true,
    httpStatus: 200,
    message: 'Allowed',
    catalogEntry: entry,
  };
}

// ---------- Firebase RS256 ID Token Verification ----------
interface CachedCertStore {
  certs: Record<string, string>;
  expiresAt: number;
}
let cachedGoogleCerts: CachedCertStore | null = null;

async function fetchGoogleSecureTokenCerts(): Promise<Record<string, string>> {
  if (cachedGoogleCerts && Date.now() < cachedGoogleCerts.expiresAt) {
    return cachedGoogleCerts.certs;
  }
  const resp = await fetch(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com',
    { signal: AbortSignal.timeout(8000) }
  );
  if (!resp.ok) {
    throw new Error(`Failed to fetch Firebase public certificates (${resp.status})`);
  }
  const certs = (await resp.json()) as Record<string, string>;
  const cacheControl = resp.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeSec = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;
  cachedGoogleCerts = {
    certs,
    expiresAt: Date.now() + Math.max(300, maxAgeSec) * 1000,
  };
  return certs;
}

function decodeBase64Url(input: string): Buffer {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(normalized + '='.repeat(padLen), 'base64');
}

export interface VerifiedFirebaseClaims {
  uid: string;
  email: string;
  emailVerified: boolean;
}

export async function verifyFirebaseIdToken(
  token: string
): Promise<VerifiedFirebaseClaims | null> {
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;

    const header = JSON.parse(decodeBase64Url(headerB64).toString('utf-8')) as {
      alg?: string;
      kid?: string;
    };
    if (header.alg !== 'RS256' || !header.kid) return null;

    const certs = await fetchGoogleSecureTokenCerts();
    const pem = certs[header.kid];
    if (!pem) return null;

    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${headerB64}.${payloadB64}`);
    verifier.end();
    const sigBuf = decodeBase64Url(sigB64);
    if (!verifier.verify(pem, sigBuf)) return null;

    const payload = JSON.parse(decodeBase64Url(payloadB64).toString('utf-8')) as {
      aud?: string;
      iss?: string;
      sub?: string;
      exp?: number;
      iat?: number;
      email?: string;
      email_verified?: boolean;
    };

    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.aud !== FIREBASE_PROJECT_ID) return null;
    if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) {
      return null;
    }
    if (!payload.sub || typeof payload.sub !== 'string') return null;
    if (typeof payload.exp !== 'number' || payload.exp <= nowSec) return null;
    if (typeof payload.iat !== 'number' || payload.iat > nowSec + 300) return null;

    return {
      uid: payload.sub,
      email: String(payload.email || ''),
      emailVerified: payload.email_verified === true,
    };
  } catch {
    return null;
  }
}

export async function requireVerifiedAdminRequest(
  req: express.Request,
  res: express.Response
): Promise<VerifiedFirebaseClaims | null> {
  const authHeader = String(req.headers.authorization || '').trim();
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      ok: false,
      error: 'Authentication required (Bearer Firebase ID token missing).',
    });
    return null;
  }
  const token = authHeader.slice(7).trim();
  const claims = await verifyFirebaseIdToken(token);
  if (!claims) {
    res.status(401).json({
      ok: false,
      error: 'Invalid or expired authentication token.',
    });
    return null;
  }
  if (!claims.emailVerified || claims.email.toLowerCase() !== BOOTSTRAPPED_ADMIN_EMAIL) {
    res.status(403).json({
      ok: false,
      error: 'Administrator privileges required.',
    });
    return null;
  }
  return claims;
}

// ---------- Per-IP Sliding Window Rate Limiter ----------
const rateBucketMap = new Map<string, number[]>();

export function checkRateLimit(
  req: express.Request,
  res: express.Response,
  bucketName: string,
  maxPerMinute: number
): boolean {
  const ip =
    String(req.headers['x-forwarded-for'] || req.ip || 'unknown')
      .split(',')[0]
      .trim();
  const key = `${bucketName}:${ip}`;
  const now = Date.now();
  const windowStart = now - 60_000;
  const recent = (rateBucketMap.get(key) || []).filter((t) => t > windowStart);
  if (recent.length >= maxPerMinute) {
    res.status(429).json({
      ok: false,
      errorCode: 'RATE_LIMITED',
      error: 'Too many requests. Please wait a moment before retrying.',
    });
    return false;
  }
  recent.push(now);
  rateBucketMap.set(key, recent);
  return true;
}

// ---------- Real Multi-Provider Chat Adapter with True SSE Streaming + AbortController ----------
export interface ProviderExecutionInput {
  catalogEntry: CatalogModelEntry;
  systemInstruction: string;
  messages: { role: string; content: string }[];
  maxOutputTokens: number;
  temperature?: number;
  abortSignal?: AbortSignal;
  stream?: boolean;
  onDelta?: (textChunk: string) => void;
}

export interface ProviderExecutionOutput {
  text: string;
  resolvedModel: string;
  inputTokens: number;
  outputTokens: number;
  estimated: boolean;
  providerId: string;
}

function resolveUpstreamEndpointAndSecret(entry: CatalogModelEntry): {
  endpoint: string;
  secretKey: string;
  targetUpstreamModel: string;
  adapter: CatalogModelEntry['adapter'];
  extraHeaders: Record<string, string>;
} {
  const providerList = getAllPlatformProviders();
  const providerCfg = providerList.find((p) => p.id === entry.providerId);
  if (!providerCfg) {
    throw new Error(`Unknown provider: ${entry.providerId}`);
  }
  if (!providerCfg.enabled) {
    throw new Error(`Provider "${providerCfg.name}" is disabled.`);
  }

  let secretKey = String(process.env[providerCfg.secretEnvName] || '').trim();
  if (!secretKey && entry.providerId === 'xai') {
    secretKey = String(process.env.GROK_API_KEY || '').trim();
  } else if (!secretKey && entry.providerId === 'qwen') {
    secretKey = String(process.env.QWEN_API_KEY || '').trim();
  }

  if (!hasConfiguredEnvSecret(providerCfg.secretEnvName) && !secretKey) {
    throw new Error(`Server secret ${providerCfg.secretEnvName} is not configured.`);
  }

  const extraHeaders: Record<string, string> = {};
  let endpoint = '';

  if (providerCfg.id === 'cloudflare') {
    const accountId = String(process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
    if (!hasConfiguredEnvSecret('CLOUDFLARE_ACCOUNT_ID')) {
      throw new Error('CLOUDFLARE_ACCOUNT_ID is not configured.');
    }
    endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(
      accountId
    )}/ai/v1/chat/completions`;
  } else if (providerCfg.adapter === 'anthropic-compatible') {
    endpoint = `${providerCfg.baseUrl.replace(/\/+$/, '')}/messages`;
  } else if (providerCfg.baseUrl.endsWith('/chat/completions')) {
    endpoint = providerCfg.baseUrl;
  } else {
    endpoint = `${providerCfg.baseUrl.replace(/\/+$/, '')}/chat/completions`;
  }

  if (providerCfg.id === 'openrouter') {
    extraHeaders['HTTP-Referer'] = process.env.APP_URL || 'https://luxo.ai';
    extraHeaders['X-Title'] = 'Luxo AI';
  }

  return {
    endpoint,
    secretKey,
    targetUpstreamModel: entry.upstreamModelId,
    adapter: providerCfg.adapter,
    extraHeaders,
  };
}

export async function executeMultiProviderChat(
  params: ProviderExecutionInput
): Promise<ProviderExecutionOutput> {
  const {
    catalogEntry,
    systemInstruction,
    messages,
    maxOutputTokens,
    temperature,
    abortSignal,
    stream = true,
    onDelta,
  } = params;

  const { endpoint, secretKey, targetUpstreamModel, adapter, extraHeaders } =
    resolveUpstreamEndpointAndSecret(catalogEntry);

  const promptTotalText =
    systemInstruction + '\n' + messages.map((m) => m.content).join('\n');

  const combinedAbort = abortSignal
    ? AbortSignal.any([abortSignal, AbortSignal.timeout(45000)])
    : AbortSignal.timeout(45000);

  if (adapter === 'anthropic-compatible') {
    const anthropicMsgs = messages
      .filter((m) => m.content.trim().length > 0)
      .map((m) => ({
        role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: m.content,
      }));

    const resp = await fetch(endpoint, {
      method: 'POST',
      signal: combinedAbort,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': secretKey,
        'anthropic-version': '2023-06-01',
        ...extraHeaders,
      },
      body: JSON.stringify({
        model: targetUpstreamModel,
        max_tokens: maxOutputTokens,
        system: systemInstruction,
        stream,
        ...(typeof temperature === 'number' ? { temperature } : {}),
        messages:
          anthropicMsgs.length > 0
            ? anthropicMsgs
            : [{ role: 'user', content: 'Hello' }],
      }),
    });

    if (!resp.ok) {
      const errJson = (await resp.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      throw new Error(errJson?.error?.message || `Anthropic HTTP ${resp.status}`);
    }

    if (stream && resp.body) {
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let fullText = '';
      let inTokens = 0;
      let outTokens = 0;
      let resolvedModel = targetUpstreamModel;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line.startsWith('data:')) continue;
          const raw = line.slice(5).trim();
          if (!raw || raw === '[DONE]') continue;
          try {
            const ev = JSON.parse(raw) as {
              type?: string;
              message?: { model?: string; usage?: { input_tokens?: number } };
              usage?: { output_tokens?: number };
              delta?: { type?: string; text?: string };
            };
            if (ev.type === 'message_start' && ev.message) {
              if (ev.message.model) resolvedModel = ev.message.model;
              if (ev.message.usage?.input_tokens) {
                inTokens = ev.message.usage.input_tokens;
              }
            } else if (ev.type === 'content_block_delta' && ev.delta?.text) {
              fullText += ev.delta.text;
              onDelta?.(ev.delta.text);
            } else if (ev.type === 'message_delta' && ev.usage?.output_tokens) {
              outTokens = ev.usage.output_tokens;
            }
          } catch {
            // ignore partial SSE event
          }
        }
      }

      return {
        text: fullText.trim(),
        resolvedModel,
        inputTokens: inTokens || estimateTextTokens(promptTotalText),
        outputTokens: outTokens || estimateTextTokens(fullText),
        estimated: !outTokens,
        providerId: catalogEntry.providerId,
      };
    }

    const payload = (await resp.json().catch(() => ({}))) as {
      content?: { type?: string; text?: string }[];
      usage?: { input_tokens?: number; output_tokens?: number };
      model?: string;
    };
    const text = (payload.content || [])
      .filter((c) => c.type === 'text' && typeof c.text === 'string')
      .map((c) => c.text)
      .join('\n')
      .trim();
    return {
      text,
      resolvedModel: payload.model || targetUpstreamModel,
      inputTokens:
        Number(payload.usage?.input_tokens) || estimateTextTokens(promptTotalText),
      outputTokens:
        Number(payload.usage?.output_tokens) || estimateTextTokens(text),
      estimated: !payload.usage?.output_tokens,
      providerId: catalogEntry.providerId,
    };
  }

  // OpenAI-compatible path (OpenRouter, Groq, Cerebras, NVIDIA, Cloudflare, SambaNova, Mistral, Cohere, HuggingFace, DeepSeek, OpenAI, xAI, Qwen, Perplexity, Custom)
  const isReasoningOpenAi =
    catalogEntry.providerId === 'openai' &&
    (/^(o1|o3|o4)/.test(targetUpstreamModel) ||
      targetUpstreamModel.startsWith('gpt-5'));

  const chatMessages = [
    { role: 'system', content: systemInstruction },
    ...messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
  ];

  const reqBody: Record<string, unknown> = {
    model: targetUpstreamModel,
    messages: chatMessages,
    stream,
    ...(isReasoningOpenAi
      ? { max_completion_tokens: maxOutputTokens }
      : { max_tokens: maxOutputTokens }),
    ...(!isReasoningOpenAi && typeof temperature === 'number'
      ? { temperature }
      : {}),
    ...(stream && catalogEntry.providerId !== 'perplexity'
      ? { stream_options: { include_usage: true } }
      : {}),
  };

  const resp = await fetch(endpoint, {
    method: 'POST',
    signal: combinedAbort,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secretKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify(reqBody),
  });

  if (!resp.ok) {
    const errJson = (await resp.json().catch(() => ({}))) as {
      error?: { message?: string };
      message?: string;
    };
    throw new Error(
      errJson?.error?.message ||
        errJson?.message ||
        `Provider API HTTP ${resp.status}`
    );
  }

  const contentType = resp.headers.get('content-type') || '';
  if (stream && resp.body && contentType.includes('text/event-stream')) {
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let fullText = '';
    let inTokens = 0;
    let outTokens = 0;
    let resolvedModel = targetUpstreamModel;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith('data:')) continue;
        const dataStr = line.slice(5).trim();
        if (!dataStr || dataStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(dataStr) as {
            model?: string;
            choices?: { delta?: { content?: string } }[];
            usage?: { prompt_tokens?: number; completion_tokens?: number };
          };
          if (parsed.model) resolvedModel = parsed.model;
          const delta = parsed.choices?.[0]?.delta?.content;
          if (typeof delta === 'string' && delta.length > 0) {
            fullText += delta;
            onDelta?.(delta);
          }
          if (parsed.usage?.prompt_tokens) inTokens = parsed.usage.prompt_tokens;
          if (parsed.usage?.completion_tokens) {
            outTokens = parsed.usage.completion_tokens;
          }
        } catch {
          // ignore partial SSE line
        }
      }
    }

    return {
      text: fullText.trim(),
      resolvedModel,
      inputTokens: inTokens || estimateTextTokens(promptTotalText),
      outputTokens: outTokens || estimateTextTokens(fullText),
      estimated: !outTokens,
      providerId: catalogEntry.providerId,
    };
  }

  const payload = (await resp.json().catch(() => ({}))) as {
    choices?: { message?: { content?: string } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
    model?: string;
  };
  const text = String(payload.choices?.[0]?.message?.content || '').trim();
  if (text && onDelta) {
    onDelta(text);
  }
  return {
    text,
    resolvedModel: payload.model || targetUpstreamModel,
    inputTokens:
      Number(payload.usage?.prompt_tokens) || estimateTextTokens(promptTotalText),
    outputTokens:
      Number(payload.usage?.completion_tokens) || estimateTextTokens(text),
    estimated: !payload.usage?.completion_tokens,
    providerId: catalogEntry.providerId,
  };
}

// ---------- Automatic AI Discovery Engine Runner ----------
export async function runLiveModelDiscovery(params?: {
  providerIds?: string[];
  actorUid?: string;
  actorEmail?: string;
}): Promise<{
  logs: DiscoveryRunLog[];
  newQueueCount: number;
  totalQueueCount: number;
}> {
  const providers = getAllPlatformProviders().filter((p) => {
    if (!p.enabled || !p.supportsDiscovery) return false;
    if (params?.providerIds && params.providerIds.length > 0) {
      return params.providerIds.includes(p.id);
    }
    return true;
  });

  const existingCatalog = getServerUnifiedCatalog();
  const runLogs: DiscoveryRunLog[] = [];
  let newCandidatesAdded = 0;

  for (const prov of providers) {
    const nowMs = Date.now();
    const secretVal = String(process.env[prov.secretEnvName] || '').trim();
    const hasSecret = hasConfiguredEnvSecret(prov.secretEnvName);

    // OpenRouter public models list works even without key; others require configured env key
    if (!hasSecret && prov.id !== 'openrouter') {
      const skippedLog: DiscoveryRunLog = {
        id: `disc_${prov.id}_${nowMs}`,
        timestamp: nowMs,
        providerId: prov.id,
        scannedCount: 0,
        newCandidatesCount: 0,
        removedCount: 0,
        status: 'skipped',
        message: `${prov.name}: ${prov.secretEnvName} not configured`,
      };
      runLogs.push(skippedLog);
      continue;
    }

    try {
      let candidates: DiscoveredModelCandidate[] = [];
      if (prov.id === 'google') {
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(
            secretVal
          )}`,
          { signal: AbortSignal.timeout(10000) }
        );
        if (!resp.ok) throw new Error(`Gemini models HTTP ${resp.status}`);
        const json = await resp.json();
        candidates = normalizeGoogleGeminiModelsPayload(json, nowMs);
      } else if (prov.id === 'openrouter') {
        const resp = await fetch('https://openrouter.ai/api/v1/models', {
          signal: AbortSignal.timeout(12000),
          headers: hasSecret
            ? { Authorization: `Bearer ${secretVal}` }
            : undefined,
        });
        if (!resp.ok) throw new Error(`OpenRouter models HTTP ${resp.status}`);
        const json = await resp.json();
        candidates = normalizeOpenRouterModelsPayload(json, nowMs);
      } else if (prov.modelsEndpoint) {
        const ssrf = validateCustomProviderUrl(prov.modelsEndpoint);
        if (!ssrf.valid) {
          throw new Error(`Blocked discovery endpoint: ${ssrf.reason}`);
        }
        const headers: Record<string, string> = {};
        if (prov.adapter === 'anthropic-compatible') {
          headers['x-api-key'] = secretVal;
          headers['anthropic-version'] = '2023-06-01';
        } else {
          headers['Authorization'] = `Bearer ${secretVal}`;
        }
        const resp = await fetch(ssrf.normalizedUrl!, {
          signal: AbortSignal.timeout(10000),
          headers,
        });
        if (!resp.ok) throw new Error(`${prov.name} models HTTP ${resp.status}`);
        const json = await resp.json();
        const defaultPricing: ModelPricingTierStatus =
          prov.id === 'groq' ||
          prov.id === 'cerebras' ||
          prov.id === 'nvidia' ||
          prov.id === 'sambanova' ||
          prov.id === 'mistral' ||
          prov.id === 'cohere' ||
          prov.id === 'huggingface'
            ? 'FREE_TIER'
            : 'REQUIRES_CREDITS';
        candidates = normalizeOpenAiCompatibleModelsPayload(
          {
            providerId: prov.id,
            providerLabel: prov.name,
            defaultPricingStatus: defaultPricing,
            defaultPricingDetail: `${prov.name} discovered endpoint`,
            logoKey: prov.logoKey,
            payload: json,
          },
          nowMs
        );
      }

      const diff = diffDiscoveredCandidates({
        providerId: prov.id,
        fetchedCandidates: candidates,
        existingCatalog,
        existingQueue: platformState.discoveryQueue,
        nowMs,
      });

      if (diff.newCandidates.length > 0) {
        // Keep bounded discovery queue prioritizing zero-cost models first
        const sortedNew = [...diff.newCandidates].sort(
          (a, b) =>
            Number(b.pricingStatus === 'FREE' || b.pricingStatus === 'FREE_TIER') -
            Number(a.pricingStatus === 'FREE' || a.pricingStatus === 'FREE_TIER')
        );
        platformState.discoveryQueue = [
          ...sortedNew.slice(0, 80),
          ...platformState.discoveryQueue,
        ].slice(0, 250);
        newCandidatesAdded += diff.newCandidates.length;
      }

      if (diff.removedModelIds.length > 0) {
        const disabledSet = new Set(platformState.disabledModelIds);
        diff.removedModelIds.forEach((id) => disabledSet.add(id));
        platformState.disabledModelIds = Array.from(disabledSet);
      }

      runLogs.push(diff.logEntry);
    } catch (err) {
      runLogs.push({
        id: `disc_${prov.id}_${nowMs}`,
        timestamp: nowMs,
        providerId: prov.id,
        scannedCount: 0,
        newCandidatesCount: 0,
        removedCount: 0,
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  platformState.lastDiscoveryAt = Date.now();
  platformState.discoveryLogs = [...runLogs, ...platformState.discoveryLogs].slice(
    0,
    80
  );
  if (params?.actorUid) {
    appendAdminAuditLog({
      actorUid: params.actorUid,
      actorEmail: params.actorEmail || BOOTSTRAPPED_ADMIN_EMAIL,
      action: 'DISCOVERY_REFRESH',
      target: 'ai_discovery',
      detail: `Scanned ${runLogs.length} providers · ${newCandidatesAdded} new candidates queued`,
    });
  } else {
    persistPlatformState();
  }

  return {
    logs: runLogs,
    newQueueCount: newCandidatesAdded,
    totalQueueCount: platformState.discoveryQueue.filter(
      (q) => q.status === 'pending'
    ).length,
  };
}

// ---------- Knowledge Base Ingestion & Vector Embeddings ----------
export async function embedTextsWithGemini(
  texts: string[],
  ai: GoogleGenAI | null
): Promise<{ vectors: (number[] | undefined)[]; mode: 'gemini-embedding-2' | 'lexical-fallback' }> {
  if (!ai || texts.length === 0) {
    return { vectors: texts.map(() => undefined), mode: 'lexical-fallback' };
  }
  const embeddingModels = ['gemini-embedding-001', 'text-embedding-004'];
  for (const modelName of embeddingModels) {
    try {
      const vectors: (number[] | undefined)[] = [];
      for (const chunk of texts.slice(0, 24)) {
        const resp = await ai.models.embedContent({
          model: modelName,
          contents: chunk,
        });
        const vals = resp.embeddings?.[0]?.values;
        vectors.push(Array.isArray(vals) && vals.length > 0 ? vals : undefined);
      }
      if (vectors.some((v) => Array.isArray(v) && v.length > 0)) {
        return { vectors, mode: 'gemini-embedding-2' };
      }
    } catch {
      // try next embedding model or lexical fallback
    }
  }
  return { vectors: texts.map(() => undefined), mode: 'lexical-fallback' };
}

export async function ingestKnowledgeDocument(params: {
  title: string;
  fileName: string;
  mimeType: string;
  contentBase64?: string;
  rawText?: string;
  projectId?: string;
  ai: GoogleGenAI | null;
}): Promise<KnowledgeDocStored> {
  let extractedText = '';
  const lowerName = params.fileName.toLowerCase();
  const isPdf =
    params.mimeType === 'application/pdf' || lowerName.endsWith('.pdf');

  let byteSize = 0;
  if (params.contentBase64) {
    const buf = Buffer.from(params.contentBase64, 'base64');
    byteSize = buf.length;
    if (byteSize > 8 * 1024 * 1024) {
      throw new Error('File exceeds 8 MB Knowledge Base limit.');
    }
    if (isPdf) {
      const parsed = await extractText(new Uint8Array(buf), { mergePages: true });
      extractedText = normalizeDocumentText(
        Array.isArray(parsed.text) ? parsed.text.join('\n\n') : String(parsed.text || '')
      );
    } else {
      extractedText = normalizeDocumentText(buf.toString('utf-8'));
    }
  } else if (params.rawText) {
    byteSize = Buffer.byteLength(params.rawText, 'utf-8');
    extractedText = normalizeDocumentText(params.rawText);
  }

  if (!extractedText || extractedText.length < 10) {
    throw new Error('No readable text could be extracted from the uploaded file.');
  }

  const chunkStrings = chunkTextWithOverlap(extractedText, {
    maxChars: 900,
    overlapChars: 160,
  }).slice(0, 40);

  const { vectors, mode } = await embedTextsWithGemini(chunkStrings, params.ai);
  const docId = `kb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const cleanTitle = params.title.trim().slice(0, 120) || params.fileName;

  const newChunks: KnowledgeChunkRecord[] = chunkStrings.map((text, idx) => ({
    id: `${docId}_c${idx}`,
    docId,
    docTitle: cleanTitle,
    chunkIndex: idx,
    text,
    embedding: vectors[idx],
    tokenEstimate: estimateTextTokens(text),
  }));

  const docSummary: KnowledgeDocStored = {
    id: docId,
    title: cleanTitle,
    fileName: params.fileName.slice(0, 140),
    mimeType: params.mimeType || 'text/plain',
    sizeBytes: byteSize,
    chunkCount: newChunks.length,
    embeddingMode: mode,
    ...(params.projectId ? { projectId: params.projectId } : {}),
    previewText: extractedText.slice(0, 320),
    createdAt: Date.now(),
  };

  platformState.knowledgeDocs.unshift(docSummary);
  platformState.knowledgeDocs = platformState.knowledgeDocs.slice(0, 50);
  platformState.knowledgeChunks = [
    ...newChunks,
    ...platformState.knowledgeChunks,
  ].slice(0, 800);
  persistPlatformState();

  return docSummary;
}

export async function queryKnowledgeBaseRag(params: {
  queryText: string;
  docIds?: string[];
  topK?: number;
  ai: GoogleGenAI | null;
}): Promise<{
  results: KnowledgeSearchResult[];
  ragContextBlock: string;
}> {
  let queryEmbedding: number[] | undefined;
  const hasVectorChunks = platformState.knowledgeChunks.some(
    (c) => Array.isArray(c.embedding) && c.embedding.length > 0
  );
  if (hasVectorChunks && params.ai) {
    const { vectors } = await embedTextsWithGemini([params.queryText], params.ai);
    queryEmbedding = vectors[0];
  }
  const results = searchKnowledgeChunks({
    queryText: params.queryText,
    queryEmbedding,
    chunks: platformState.knowledgeChunks,
    docIdsFilter: params.docIds,
    topK: params.topK ?? 4,
  });
  return {
    results,
    ragContextBlock: formatRagContextBlock(results),
  };
}

// ---------- Admin CRUD Helpers ----------
export function upsertCustomProvider(params: {
  id?: string;
  name: string;
  adapter: 'openai-compatible' | 'anthropic-compatible';
  baseUrl: string;
  secretEnvName: string;
  modelsEndpoint?: string;
  logoKey?: string;
  accentColor?: string;
  enabled?: boolean;
  notes?: string;
}): Omit<PlatformProviderConfig, 'connected'> {
  const urlValidation = validateCustomProviderUrl(params.baseUrl);
  if (!urlValidation.valid || !urlValidation.normalizedUrl) {
    throw new Error(urlValidation.reason || 'Invalid provider base URL.');
  }
  if (!isValidSecretEnvVarName(params.secretEnvName)) {
    throw new Error(
      'Secret reference must be a valid environment variable name (e.g., TOGETHER_API_KEY). Raw API keys are forbidden.'
    );
  }
  let normalizedModelsEndpoint: string | undefined;
  if (params.modelsEndpoint && params.modelsEndpoint.trim()) {
    const mVal = validateCustomProviderUrl(params.modelsEndpoint);
    if (!mVal.valid || !mVal.normalizedUrl) {
      throw new Error(`Invalid models endpoint URL: ${mVal.reason}`);
    }
    normalizedModelsEndpoint = mVal.normalizedUrl;
  }

  const cleanId = (
    params.id ||
    params.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  ).slice(0, 48);

  if (!cleanId) throw new Error('Valid provider ID or name is required.');

  const logo = resolveLogoForEntity({
    provider: cleanId,
    logoKey: params.logoKey || 'openrouter',
  });

  const entry: Omit<PlatformProviderConfig, 'connected'> = {
    id: cleanId,
    name: params.name.trim().slice(0, 64),
    shortLabel: params.name.trim().slice(0, 20),
    adapter: params.adapter,
    baseUrl: urlValidation.normalizedUrl,
    secretEnvName: params.secretEnvName.trim(),
    modelsEndpoint: normalizedModelsEndpoint || `${urlValidation.normalizedUrl}/models`,
    logoKey: logo.key,
    accentColor: params.accentColor || '#6366f1',
    supportsStreaming: true,
    supportsVision: true,
    supportsDiscovery: true,
    isBuiltin: false,
    enabled: params.enabled !== false,
    notes: params.notes?.slice(0, 200),
  };

  const idx = platformState.customProviders.findIndex((p) => p.id === cleanId);
  if (idx >= 0) {
    platformState.customProviders[idx] = entry;
  } else {
    platformState.customProviders.push(entry);
  }
  persistPlatformState();
  return entry;
}

export function upsertCustomModel(params: {
  id?: string;
  name: string;
  providerId: string;
  upstreamModelId: string;
  pricingStatus: ModelPricingTierStatus;
  contextLength: number;
  maxOutputTokens: number;
  capabilities: string[];
  description?: string;
  logoKey?: string;
  enabled?: boolean;
}): CatalogModelEntry {
  const providerList = getAllPlatformProviders();
  const provider = providerList.find((p) => p.id === params.providerId);
  if (!provider) {
    throw new Error(`Provider "${params.providerId}" not found.`);
  }
  const cleanId = (
    params.id ||
    `${params.providerId}:${params.upstreamModelId}`
      .toLowerCase()
      .replace(/[^a-z0-9._:-]+/g, '-')
  ).slice(0, 120);

  const logo = resolveLogoForEntity({
    provider: params.providerId,
    modelId: params.upstreamModelId,
    logoKey: params.logoKey || provider.logoKey,
  });

  const entry: CatalogModelEntry = {
    id: cleanId,
    name: params.name.trim().slice(0, 96),
    providerId: provider.id,
    providerLabel: provider.name,
    upstreamModelId: params.upstreamModelId.trim().slice(0, 120),
    adapter: provider.adapter,
    pricingStatus: params.pricingStatus,
    pricingNote: `Configured in Admin (${params.pricingStatus})`,
    contextLength: Math.max(2048, Math.min(2000000, Number(params.contextLength) || 128000)),
    maxOutputTokens: Math.max(256, Math.min(65536, Number(params.maxOutputTokens) || 8192)),
    capabilities: params.capabilities.slice(0, 8),
    description: (params.description || `${provider.name} custom model`).slice(0, 240),
    logoPath: logo.logoPath,
    accentColor: logo.accentColor,
    enabled: params.enabled !== false,
    isCustom: true,
    addedAt: Date.now(),
    category: provider.name,
    tier:
      params.pricingStatus === 'FREE' || params.pricingStatus === 'FREE_TIER'
        ? 'free'
        : 'plus',
    executable: false,
    zeroCostAllowed:
      params.pricingStatus === 'FREE' || params.pricingStatus === 'FREE_TIER',
  };

  const idx = platformState.customModels.findIndex((m) => m.id === cleanId);
  if (idx >= 0) {
    platformState.customModels[idx] = entry;
  } else {
    platformState.customModels.unshift(entry);
  }
  persistPlatformState();
  return entry;
}

export function approveDiscoveredCandidate(candidateId: string): CatalogModelEntry {
  const idx = platformState.discoveryQueue.findIndex((c) => c.id === candidateId);
  if (idx < 0) {
    throw new Error(`Discovery candidate "${candidateId}" not found.`);
  }
  const cand = platformState.discoveryQueue[idx];
  const provider = getAllPlatformProviders().find((p) => p.id === cand.providerId);
  const entry = promoteCandidateToCatalogEntry(
    cand,
    provider?.name || cand.providerLabel,
    provider?.adapter || 'openai-compatible'
  );
  platformState.discoveryQueue[idx] = { ...cand, status: 'approved' };
  const existingIdx = platformState.customModels.findIndex((m) => m.id === entry.id);
  if (existingIdx >= 0) {
    platformState.customModels[existingIdx] = entry;
  } else {
    platformState.customModels.unshift(entry);
  }
  persistPlatformState();
  return entry;
}

export function deleteCustomProvider(providerId: string): boolean {
  const before = platformState.customProviders.length;
  platformState.customProviders = platformState.customProviders.filter(
    (p) => p.id !== providerId
  );
  if (platformState.customProviders.length === before) return false;
  platformState.customModels = platformState.customModels.filter(
    (m) => m.providerId !== providerId
  );
  persistPlatformState();
  return true;
}

export function setPlatformModelEnabled(modelId: string, enabled: boolean): boolean {
  const customIdx = platformState.customModels.findIndex((m) => m.id === modelId);
  if (customIdx >= 0) {
    platformState.customModels[customIdx] = {
      ...platformState.customModels[customIdx],
      enabled,
    };
  }
  const disabledSet = new Set(platformState.disabledModelIds);
  if (enabled) {
    disabledSet.delete(modelId);
  } else {
    disabledSet.add(modelId);
  }
  platformState.disabledModelIds = Array.from(disabledSet);
  persistPlatformState();
  return true;
}

export function deleteCustomModel(modelId: string): boolean {
  const before = platformState.customModels.length;
  platformState.customModels = platformState.customModels.filter((m) => m.id !== modelId);
  if (platformState.customModels.length === before) return false;
  platformState.disabledModelIds = platformState.disabledModelIds.filter((id) => id !== modelId);
  persistPlatformState();
  return true;
}

export function rejectDiscoveredCandidate(candidateId: string): boolean {
  const idx = platformState.discoveryQueue.findIndex((c) => c.id === candidateId);
  if (idx < 0) return false;
  platformState.discoveryQueue[idx] = {
    ...platformState.discoveryQueue[idx],
    status: 'rejected',
  };
  persistPlatformState();
  return true;
}
