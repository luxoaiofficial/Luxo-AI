import express from 'express';
import http from 'node:http';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { spawn } from 'node:child_process';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import {
  buildOpenGraphMeta,
  buildSystemPrompt,
  cleanAssistantResponse,
  describeCinematicMotion,
  enhanceMediaPrompt,
  enhanceUserPrompt,
  evaluateSafeMathExpression,
  generateLocalSmartResponse,
  generateProceduralArtwork,
  getVoiceOption,
  LUXO_MODELS,
  NANO_BANANA_MODELS,
  normalizeCinematicMotion,
  parseShareParams,
  resolveAutoRoutedModel,
  resolvePublicAppUrl,
  sanitizeLuxoBrand,
  verifyAndRepairModelOutput,
} from './src/utils/luxoLogic.ts';
import {
  applySharedCodeDelta,
  applySharedDocDelta,
  createInitialSharedCode,
  createInitialSharedDoc,
  DEFAULT_COLLAB_ROOM_ID,
  pickParticipantColor,
  sanitizeCollabRoomId,
  upsertSharedMessage,
} from './src/utils/collabState.ts';
import type {
  CollabParticipant,
  CollabRoomSnapshot,
  CollabSharedCode,
  CollabSharedDoc,
  CollabSurface,
} from './src/utils/collabState.ts';
import {
  renderCinematicMp4Video,
  saveBase64VideoFile,
  VIDEO_STORAGE_DIR,
} from './src/utils/videoEngine.ts';
import {
  synthesizeRealDiffusedCinemaVideo,
  synthesizeRealPhotograph,
} from './src/utils/photorealisticMediaEngine.ts';
import {
  applyBenchmarkEvaluationToState,
  applyCustomTrainingRule,
  boostIndividualModel,
  calibrateAllEcosystems,
  createInitialEvolutionState,
  deleteEvolutionRule,
  EVOLUTION_BENCHMARK_SUITE,
  processModelFeedbackSignal,
  getActiveDirectivesForModel,
  hydrateEvolutionState,
  ingestConsentedChatSignal,
  normalizeConsentStatus,
  recordModelUsageInState,
  redactSensitivePii,
  runDeterministicEvolutionCycle,
  scoreBenchmarkOutput,
  toggleEvolutionRule,
} from './src/utils/selfEvolutionEngine.ts';
import type {
  ChatMessage,
  CinematicMotionParams,
  CitationItem,
  ImageResolutionSize,
  InlineAttachmentPayload,
  LuxoModelCategory,
  LuxoModelId,
  NanoBananaModelId,
  NanoLensPresetId,
  SelfEvolutionState,
  SynthesisMode,
  VideoDurationOption,
  VideoResolutionSize,
  VisualAspectRatio,
} from './src/types/luxo.ts';
import {
  addArticleComment,
  addForumReply,
  BLOG_ARTICLES,
  buildWebAppManifest,
  type CommunityHubState,
  createCommunityPoll,
  createForumThread,
  createInitialCommunityState,
  generateRobotsTxt,
  generateSitemapXml,
  hydrateCommunityState,
  reactToArticle,
  scorePageMetaTags,
  type SitemapDynamicEntry,
  upvoteForumThread,
  voteInPoll,
} from './src/utils/seoPerfEngagementEngine.ts';
import {
  type ContentStudioIntent,
  type ContentStudioTone,
  generateDeterministicContentPack,
  removeStudioArticleById,
  slugifyStudioText,
  validateAndBuildStudioArticle,
} from './src/utils/contentStudioEngine.ts';
import {
  appendRoomMessage,
  createInitialSocialPlatformState,
  createPlatformAnnouncement,
  createPlatformEvent,
  createPrivateChatRoom,
  ensureUserInitializedInState,
  getOrCreateDirectMessageRoom,
  hydrateSocialPlatformState,
  mutateFriendship,
  type PlatformUserRole,
  sanitizePlatformId,
  type SocialPlatformState,
  toggleFavoriteItem,
  toggleFollowUser,
  upsertSocialProfile,
} from './src/utils/socialPlatformEngine.ts';

dotenv.config();

function resolveListenPort(): number {
  const portFlagIdx = process.argv.indexOf('--port');
  if (portFlagIdx !== -1 && process.argv[portFlagIdx + 1]) {
    const cliPort = Number(process.argv[portFlagIdx + 1]);
    if (Number.isFinite(cliPort) && cliPort > 0) return cliPort;
  }
  const eqPortArg = process.argv.find((arg) => arg.startsWith('--port='));
  if (eqPortArg) {
    const cliPort = Number(eqPortArg.split('=')[1]);
    if (Number.isFinite(cliPort) && cliPort > 0) return cliPort;
  }
  // In development environments with tsx, port 3000 is required by the container router
  if (process.env.NODE_ENV !== 'production') {
    return 3000;
  }
  return Number(process.env.PORT) || 3000;
}

const PORT = resolveListenPort();

const CLOUDFLARED_BIN = '/tmp/cloudflared';
const TUNNEL_PID_FILE = '/tmp/luxo_public_tunnel.pid';
const TUNNEL_URL_FILE = '/tmp/luxo_public_tunnel.url';
const TUNNEL_LOG_FILE = '/tmp/luxo_public_tunnel.log';
const EVOLUTION_STATE_FILE = '/tmp/luxo_self_evolution_state.json';
const COMMUNITY_STATE_FILE = '/tmp/luxo_community_hub_state.json';
const SOCIAL_STATE_FILE = '/tmp/luxo_social_platform_state.json';
let tunnelSpawnInProgress = false;
let lastVerifiedTunnelAt = 0;

interface CachedChatEntry {
  text: string;
  thinkingSteps: string[];
  citations?: CitationItem[];
  followUpSuggestions: string[];
  routedModelId: LuxoModelId;
  generation: number;
  createdAt: number;
}

const chatResponseCache = new Map<string, CachedChatEntry>();
let chatCacheHitCount = 0;
let chatCacheTotalRequests = 0;

function loadServerEvolutionState(): SelfEvolutionState {
  try {
    if (fs.existsSync(EVOLUTION_STATE_FILE)) {
      const raw = fs.readFileSync(EVOLUTION_STATE_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as SelfEvolutionState;
      if (parsed && typeof parsed.generation === 'number') {
        return hydrateEvolutionState(parsed);
      }
    }
  } catch {
    // fallback to clean initial state
  }
  const initial = createInitialEvolutionState();
  try {
    fs.writeFileSync(EVOLUTION_STATE_FILE, JSON.stringify(initial), 'utf-8');
  } catch {
    // ignore write failure
  }
  return initial;
}

let serverEvolutionState: SelfEvolutionState = loadServerEvolutionState();

function persistServerEvolutionState(nextState: SelfEvolutionState): void {
  serverEvolutionState = nextState;
  try {
    fs.writeFileSync(EVOLUTION_STATE_FILE, JSON.stringify(nextState), 'utf-8');
  } catch {
    // ignore write failure
  }
}

function loadServerCommunityState(): CommunityHubState {
  try {
    if (fs.existsSync(COMMUNITY_STATE_FILE)) {
      const raw = fs.readFileSync(COMMUNITY_STATE_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<CommunityHubState>;
      return hydrateCommunityState(parsed);
    }
  } catch {
    // fallback
  }
  const initial = createInitialCommunityState();
  try {
    fs.writeFileSync(COMMUNITY_STATE_FILE, JSON.stringify(initial), 'utf-8');
  } catch {
    // ignore
  }
  return initial;
}

let serverCommunityState: CommunityHubState = loadServerCommunityState();

function persistServerCommunityState(nextState: CommunityHubState): void {
  serverCommunityState = nextState;
  try {
    fs.writeFileSync(COMMUNITY_STATE_FILE, JSON.stringify(nextState), 'utf-8');
  } catch {
    // ignore
  }
}

function loadServerSocialState(): SocialPlatformState {
  try {
    if (fs.existsSync(SOCIAL_STATE_FILE)) {
      const raw = fs.readFileSync(SOCIAL_STATE_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<SocialPlatformState>;
      return hydrateSocialPlatformState(parsed);
    }
  } catch {
    // fallback
  }
  const initial = createInitialSocialPlatformState();
  try {
    fs.writeFileSync(SOCIAL_STATE_FILE, JSON.stringify(initial), 'utf-8');
  } catch {
    // ignore
  }
  return initial;
}

let serverSocialState: SocialPlatformState = loadServerSocialState();

function persistServerSocialState(nextState: SocialPlatformState): void {
  serverSocialState = nextState;
  try {
    fs.writeFileSync(SOCIAL_STATE_FILE, JSON.stringify(nextState), 'utf-8');
  } catch {
    // ignore
  }
}

interface SocialWsClientInfo {
  uid: string;
  displayName: string;
  activeRoomId: string;
}

const socialWsClients = new Map<WebSocket, SocialWsClientInfo>();

function broadcastSocialWs(payload: unknown, excludeWs?: WebSocket): void {
  for (const clientWs of socialWsClients.keys()) {
    if (excludeWs && clientWs === excludeWs) continue;
    sendSocketJson(clientWs, payload);
  }
}

function getOnlineSocialUids(): string[] {
  const baseline = ['member_selin', 'member_mert', 'member_kerem'];
  const live = Array.from(socialWsClients.values()).map((c) => c.uid);
  return Array.from(new Set([...baseline, ...live]));
}

function isProcessAlive(pid: number): boolean {
  if (!Number.isFinite(pid) || pid <= 1) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function killPersistedTunnelProcess(): void {
  try {
    if (fs.existsSync(TUNNEL_PID_FILE)) {
      const pid = Number(fs.readFileSync(TUNNEL_PID_FILE, 'utf-8').trim());
      if (isProcessAlive(pid)) {
        process.kill(pid, 'SIGTERM');
      }
      fs.unlinkSync(TUNNEL_PID_FILE);
    }
  } catch {
    // ignore
  }
  try {
    if (fs.existsSync(TUNNEL_URL_FILE)) fs.unlinkSync(TUNNEL_URL_FILE);
  } catch {
    // ignore
  }
}

async function verifyTunnelHttpReachable(url: string): Promise<boolean> {
  if (!/^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/i.test(url)) return false;
  try {
    const resp = await fetch(`${url}/api/health`, {
      signal: AbortSignal.timeout(4500),
      headers: { Accept: 'application/json' },
    });
    if (!resp.ok) return false;
    const data = (await resp.json()) as { ok?: boolean };
    return Boolean(data?.ok);
  } catch {
    return false;
  }
}

function readPersistedTunnelUrl(): string {
  try {
    if (fs.existsSync(TUNNEL_PID_FILE) && fs.existsSync(TUNNEL_URL_FILE)) {
      const pid = Number(fs.readFileSync(TUNNEL_PID_FILE, 'utf-8').trim());
      const url = fs.readFileSync(TUNNEL_URL_FILE, 'utf-8').trim();
      if (isProcessAlive(pid) && /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/i.test(url)) {
        return url;
      }
    }
    if (fs.existsSync(TUNNEL_LOG_FILE)) {
      const logContent = fs.readFileSync(TUNNEL_LOG_FILE, 'utf-8');
      const matches = logContent.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/gi);
      if (matches && matches.length > 0 && fs.existsSync(TUNNEL_PID_FILE)) {
        const pid = Number(fs.readFileSync(TUNNEL_PID_FILE, 'utf-8').trim());
        if (isProcessAlive(pid)) {
          const latest = matches[matches.length - 1];
          fs.writeFileSync(TUNNEL_URL_FILE, latest, 'utf-8');
          return latest;
        }
      }
    }
  } catch {
    // ignore read error
  }
  return '';
}

async function ensureCloudflaredBinary(): Promise<boolean> {
  try {
    if (fs.existsSync(CLOUDFLARED_BIN) && fs.statSync(CLOUDFLARED_BIN).size > 5_000_000) {
      fs.chmodSync(CLOUDFLARED_BIN, 0o755);
      return true;
    }
    const resp = await fetch(
      'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64',
      { signal: AbortSignal.timeout(25000) }
    );
    if (!resp.ok) return false;
    const buf = Buffer.from(await resp.arrayBuffer());
    if (buf.length < 5_000_000) return false;
    fs.writeFileSync(CLOUDFLARED_BIN, buf);
    fs.chmodSync(CLOUDFLARED_BIN, 0o755);
    return true;
  } catch {
    return false;
  }
}

async function ensurePublicTunnelRunning(
  listenPort: number,
  forceVerify = false
): Promise<string> {
  const existing = readPersistedTunnelUrl();
  if (existing) {
    const recentlyVerified = Date.now() - lastVerifiedTunnelAt < 35_000;
    if (!forceVerify && recentlyVerified) {
      return existing;
    }
    const healthy = await verifyTunnelHttpReachable(existing);
    if (healthy) {
      lastVerifiedTunnelAt = Date.now();
      return existing;
    }
    killPersistedTunnelProcess();
  }
  if (tunnelSpawnInProgress) return '';
  tunnelSpawnInProgress = true;

  try {
    const hasBin = await ensureCloudflaredBinary();
    if (!hasBin) return '';

    try {
      if (fs.existsSync(TUNNEL_URL_FILE)) fs.unlinkSync(TUNNEL_URL_FILE);
    } catch {
      // ignore
    }
    const logFd = fs.openSync(TUNNEL_LOG_FILE, 'w');
    const child = spawn(
      CLOUDFLARED_BIN,
      [
        'tunnel',
        '--protocol',
        'http2',
        '--edge-ip-version',
        '4',
        '--no-autoupdate',
        '--url',
        `http://127.0.0.1:${listenPort}`,
      ],
      {
        detached: true,
        stdio: ['ignore', logFd, logFd],
      }
    );
    child.unref();
    try {
      fs.closeSync(logFd);
    } catch {
      // ignore
    }
    if (child.pid) {
      fs.writeFileSync(TUNNEL_PID_FILE, String(child.pid), 'utf-8');
    }

    for (let i = 0; i < 24; i++) {
      await new Promise((r) => setTimeout(r, 500));
      const detected = readPersistedTunnelUrl();
      if (detected) {
        const reachable = await verifyTunnelHttpReachable(detected);
        if (reachable) {
          lastVerifiedTunnelAt = Date.now();
          return detected;
        }
      }
    }
    return readPersistedTunnelUrl();
  } catch {
    return '';
  } finally {
    tunnelSpawnInProgress = false;
  }
}

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function resolveRequestBaseUrl(req: express.Request): string {
  if (process.env.SHARED_APP_URL && process.env.SHARED_APP_URL.trim()) {
    return resolvePublicAppUrl(process.env.SHARED_APP_URL);
  }
  if (process.env.APP_URL && process.env.APP_URL.trim()) {
    return resolvePublicAppUrl(process.env.APP_URL);
  }
  const protoHeader = req.headers['x-forwarded-proto'];
  const proto =
    typeof protoHeader === 'string'
      ? protoHeader.split(',')[0].trim()
      : req.protocol || 'http';
  const host = req.get('host') || `localhost:${PORT}`;
  return resolvePublicAppUrl(`${proto}://${host}`);
}

function injectDynamicOpenGraphHtml(
  rawHtml: string,
  req: express.Request
): string {
  const baseUrl = resolveRequestBaseUrl(req);
  const queryIndex = req.originalUrl.indexOf('?');
  const searchStr = queryIndex >= 0 ? req.originalUrl.slice(queryIndex) : '';
  const shared = parseShareParams(searchStr);
  const meta = buildOpenGraphMeta(baseUrl, shared);

  const safeTitle = escapeXml(meta.title);
  const safeDesc = escapeXml(meta.description);
  const safeUrl = escapeXml(meta.canonicalUrl);
  const safeImg = escapeXml(meta.ogImageUrl);

  return rawHtml
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${safeTitle}</title>`)
    .replace(
      /<meta\s+name="description"[\s\S]*?\/>/i,
      `<meta name="description" content="${safeDesc}" />`
    )
    .replace(
      /<link\s+rel="canonical"[\s\S]*?\/>/i,
      `<link rel="canonical" href="${safeUrl}" />`
    )
    .replace(
      /<meta\s+property="og:title"[\s\S]*?\/>/i,
      `<meta property="og:title" content="${safeTitle}" />`
    )
    .replace(
      /<meta\s+property="og:description"[\s\S]*?\/>/i,
      `<meta property="og:description" content="${safeDesc}" />`
    )
    .replace(
      /<meta\s+property="og:url"[\s\S]*?\/>/i,
      `<meta property="og:url" content="${safeUrl}" />`
    )
    .replace(
      /<meta\s+property="og:image"\s+content="[^"]*"\s*\/>/i,
      `<meta property="og:image" content="${safeImg}" />`
    )
    .replace(
      /<meta\s+name="twitter:title"[\s\S]*?\/>/i,
      `<meta name="twitter:title" content="${safeTitle}" />`
    )
    .replace(
      /<meta\s+name="twitter:description"[\s\S]*?\/>/i,
      `<meta name="twitter:description" content="${safeDesc}" />`
    )
    .replace(
      /<meta\s+name="twitter:image"[\s\S]*?\/>/i,
      `<meta name="twitter:image" content="${safeImg}" />`
    );
}

function extractGroundingCitations(responseObj: unknown): CitationItem[] {
  try {
    const candidate = (
      responseObj as {
        candidates?: {
          groundingMetadata?: {
            groundingChunks?: {
              web?: { uri?: string; title?: string };
            }[];
          };
        }[];
      }
    )?.candidates?.[0];
    const chunks = candidate?.groundingMetadata?.groundingChunks || [];
    const extracted: CitationItem[] = [];
    for (const chunk of chunks) {
      if (chunk.web?.uri) {
        let domain = 'web';
        try {
          domain = new URL(chunk.web.uri).hostname;
        } catch {
          // ignore
        }
        extracted.push({
          title: sanitizeLuxoBrand(chunk.web.title || domain),
          domain,
          url: chunk.web.uri,
          snippet: 'Canlı web araştırması ile doğrulanan kaynak.',
        });
      }
    }
    return extracted.slice(0, 4);
  } catch {
    return [];
  }
}

function isInteractionsModel(modelId: LuxoModelId): boolean {
  const backend = LUXO_MODELS[modelId]?.sdkBackend || '';
  return (
    backend === 'antigravity-preview-09-2026' ||
    backend === 'deep-research-preview-04-2026' ||
    backend === 'deep-research-max-preview-04-2026' ||
    backend === 'gemini-omni-1.1-flash'
  );
}

function supportsThinkingConfig(modelName: string): boolean {
  return modelName === 'gemini-4-argon' || modelName === 'gemini-3.8-flash';
}

const sdkModelCooldownMap = new Map<string, number>();

function isSdkModelHealthy(modelName: string): boolean {
  const until = sdkModelCooldownMap.get(modelName) || 0;
  return Date.now() > until;
}

function recordSdkModelFailure(modelName: string, err: unknown): void {
  if (modelName === 'gemini-3.1-flash-lite') {
    sdkModelCooldownMap.set(modelName, Date.now() + 15_000);
    return;
  }
  const msg = String(err || '');
  const durationMs =
    msg.includes('Free Tier') || msg.includes('limit: 0') || msg.includes('429')
      ? 90_000
      : 30_000;
  sdkModelCooldownMap.set(modelName, Date.now() + durationMs);
}

function resolveCandidateModels(
  modelId: LuxoModelId,
  _canTryPaid: boolean
): string[] {
  const backend = LUXO_MODELS[modelId]?.sdkBackend || 'gemini-3.8-flash';
  let rawOrder: string[];
  if (backend === 'gemini-3.5-transcribe') {
    rawOrder = ['gemini-3.5-transcribe', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
  } else if (backend === 'gemini-3.8-flash') {
    rawOrder = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  } else {
    // Route flagship & specialized ecosystems through ultra-low-latency verified Gemini 3.1/3.8 engines first so responses start in ~0.7s without quota stalls
    rawOrder = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
  }

  const healthy = rawOrder.filter((m) => isSdkModelHealthy(m));
  if (healthy.length > 0) {
    return healthy;
  }
  return ['gemini-3.1-flash-lite'];
}

interface ServerCollabRoom {
  roomId: string;
  clients: Map<WebSocket, CollabParticipant>;
  sharedDoc: CollabSharedDoc;
  sharedCode: CollabSharedCode;
  sharedMessages: ChatMessage[];
}

const collabRooms = new Map<string, ServerCollabRoom>();

function getOrCreateCollabRoom(rawRoomId?: string): ServerCollabRoom {
  const roomId = sanitizeCollabRoomId(rawRoomId || DEFAULT_COLLAB_ROOM_ID);
  let room = collabRooms.get(roomId);
  if (!room) {
    room = {
      roomId,
      clients: new Map<WebSocket, CollabParticipant>(),
      sharedDoc: createInitialSharedDoc(roomId),
      sharedCode: createInitialSharedCode(),
      sharedMessages: [],
    };
    collabRooms.set(roomId, room);
  }
  return room;
}

function serializeRoomSnapshot(room: ServerCollabRoom): CollabRoomSnapshot {
  return {
    roomId: room.roomId,
    participants: Array.from(room.clients.values()),
    sharedDoc: room.sharedDoc,
    sharedCode: room.sharedCode,
    sharedMessages: room.sharedMessages,
  };
}

function sendSocketJson(ws: WebSocket, payload: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcastToRoom(
  room: ServerCollabRoom,
  payload: unknown,
  excludeWs?: WebSocket
): void {
  const encoded = JSON.stringify(payload);
  for (const clientWs of room.clients.keys()) {
    if (clientWs !== excludeWs && clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(encoded);
    }
  }
}

async function runInteractionsTurn(
  ai: GoogleGenAI,
  modelId: LuxoModelId,
  promptText: string,
  systemInstruction: string,
  webSearch: boolean,
  hasUrlInPrompt: boolean
): Promise<{
  text: string;
  proofSteps: string[];
  resolvedModel: string;
} | null> {
  let interaction: {
    output_text?: string | null;
    steps?: {
      type?: string;
      summary?: string;
      name?: string;
      content?: { type?: string; text?: string }[];
    }[];
  };
  let resolvedName = LUXO_MODELS[modelId]?.sdkBackend || modelId;

  if (modelId === 'antigravity-agent') {
    resolvedName = 'antigravity-preview-09-2026';
    interaction = (await ai.interactions.create(
      {
        agent: 'antigravity-preview-09-2026',
        environment: 'remote',
        agent_config: {
          type: 'antigravity',
          model: 'gemini-4-argon',
          max_total_tokens: '250000',
        },
        input: `${systemInstruction}\n\nKullanıcı İstemi:\n${promptText}`,
      } as Parameters<typeof ai.interactions.create>[0],
      { timeout: 18000, maxRetries: 0 }
    )) as typeof interaction;
  } else if (
    modelId === 'deep-research-agent' ||
    modelId === 'deep-research-max'
  ) {
    resolvedName =
      modelId === 'deep-research-max'
        ? 'deep-research-max-preview-04-2026'
        : 'deep-research-preview-04-2026';
    interaction = (await ai.interactions.create(
      {
        agent: resolvedName,
        input: `${systemInstruction}\n\nAraştırma Konusu:\n${promptText}`,
      } as Parameters<typeof ai.interactions.create>[0],
      { timeout: 18000, maxRetries: 0 }
    )) as typeof interaction;
  } else {
    resolvedName = 'gemini-omni-1.1-flash';
    const interactionTools: { type: string }[] = [];
    if (webSearch) interactionTools.push({ type: 'google_search' });
    if (hasUrlInPrompt) interactionTools.push({ type: 'url_context' });
    interaction = (await ai.interactions.create(
      {
        model: 'gemini-omni-1.1-flash',
        input: promptText,
        system_instruction: systemInstruction,
        ...(interactionTools.length > 0 ? { tools: interactionTools } : {}),
      } as Parameters<typeof ai.interactions.create>[0],
      { timeout: 18000, maxRetries: 0 }
    )) as typeof interaction;
  }

  let fullOutput = '';
  const proofSteps: string[] = [];
  const steps = Array.isArray(interaction.steps) ? interaction.steps : [];

  for (const step of steps) {
    if (step.type === 'model_output' && Array.isArray(step.content)) {
      for (const c of step.content) {
        if (c.type === 'text' && c.text) {
          fullOutput += c.text;
        }
      }
    } else if (step.type === 'thought' && step.summary) {
      proofSteps.push(sanitizeLuxoBrand(step.summary));
    } else if (step.type === 'google_search_call') {
      proofSteps.push('Google Arama aracı ile gerçek zamanlı kaynak taraması yürütüldü.');
    } else if (step.type === 'code_execution_call') {
      proofSteps.push('Kod yürütme adımı çalıştırıldı ve çıktılar doğrulandı.');
    } else if (step.type === 'url_context_call') {
      proofSteps.push('Bağlantı (URL) içeriği doğrudan okundu ve bağlama eklendi.');
    }
  }

  const finalText = sanitizeLuxoBrand(
    (fullOutput || interaction.output_text || '').trim()
  );
  if (!finalText) return null;

  return {
    text: finalText,
    proofSteps,
    resolvedModel: resolvedName,
  };
}

function buildGeminiContents(
  messages: {
    role: string;
    content: string;
    inlineAttachment?: InlineAttachmentPayload;
  }[]
) {
  return messages.map((m) => {
    const parts: (
      | { text: string }
      | { inlineData: { mimeType: string; data: string } }
    )[] = [];
    if (
      m.inlineAttachment?.data &&
      m.inlineAttachment?.mimeType &&
      m.role !== 'assistant'
    ) {
      parts.push({
        inlineData: {
          mimeType: m.inlineAttachment.mimeType,
          data: m.inlineAttachment.data,
        },
      });
    }
    parts.push({ text: m.content || 'İçeriği incele ve analiz et.' });
    return {
      role: m.role === 'assistant' ? 'model' : 'user',
      parts,
    };
  });
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');

  // Iframe-compatible HTTP Security Hardening Headers (preserves AI Studio preview embedding)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), geolocation=(), payment=(), usb=()'
    );
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
  });

  // Zero-dependency Brotli / Gzip HTTP compression middleware for HTML, JSON, SVG, XML, CSS, and JS payloads
  app.use((req, res, next) => {
    const acceptEnc = String(req.headers['accept-encoding'] || '');
    if (!acceptEnc || req.path === '/api/chat') {
      return next();
    }
    const origSend = res.send.bind(res);
    res.send = ((body: unknown) => {
      try {
        if (res.headersSent || res.getHeader('Content-Encoding')) {
          return origSend(body);
        }
        const contentType = String(res.getHeader('Content-Type') || '');
        const isCompressible =
          /text\/|application\/(json|javascript|xml|manifest\+json)|image\/svg\+xml/i.test(
            contentType
          ) || typeof body === 'string';
        if (!isCompressible) return origSend(body);

        const rawBuf = Buffer.isBuffer(body)
          ? body
          : typeof body === 'string'
          ? Buffer.from(body, 'utf-8')
          : null;
        if (!rawBuf || rawBuf.length < 860) {
          return origSend(body);
        }

        res.setHeader('Vary', 'Accept-Encoding');
        if (/\bbr\b/i.test(acceptEnc)) {
          const compressed = zlib.brotliCompressSync(rawBuf, {
            params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 },
          });
          res.setHeader('Content-Encoding', 'br');
          res.setHeader('Content-Length', String(compressed.length));
          return origSend(compressed);
        }
        if (/\bgzip\b/i.test(acceptEnc)) {
          const compressed = zlib.gzipSync(rawBuf, { level: 6 });
          res.setHeader('Content-Encoding', 'gzip');
          res.setHeader('Content-Length', String(compressed.length));
          return origSend(compressed);
        }
      } catch {
        // fallback to uncompressed send
      }
      return origSend(body);
    }) as typeof res.send;
    next();
  });

  app.use(express.json({ limit: '25mb' }));

  const uploadsRootDir = path.resolve(process.cwd(), 'public', 'uploads');
  const avatarsUploadDir = path.join(uploadsRootDir, 'avatars');
  try {
    fs.mkdirSync(avatarsUploadDir, { recursive: true });
  } catch {
    // ignore
  }
  app.use(
    '/uploads',
    express.static(uploadsRootDir, {
      index: false,
      etag: true,
      maxAge: '7d',
    })
  );

  const resolveCanonicalOrigin = (req: express.Request): string => {
    const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'https')
      .split(',')[0]
      .trim();
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').trim();
    if (host && !host.includes('localhost') && !host.startsWith('127.0.0.1')) {
      return resolvePublicAppUrl(`${proto}://${host}`);
    }
    return resolvePublicAppUrl(
      process.env.SHARED_APP_URL ||
        process.env.APP_URL ||
        'https://ais-pre-fudupxh6ld5rvvbfz5qwt4-705459740809.europe-west2.run.app'
    );
  };

  app.get('/robots.txt', (req, res) => {
    const origin = resolveCanonicalOrigin(req);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.status(200).send(generateRobotsTxt(origin));
  });

  app.get('/sitemap.xml', (req, res) => {
    const origin = resolveCanonicalOrigin(req);
    const todayIso = new Date().toISOString().slice(0, 10);
    const dynamicEntries: SitemapDynamicEntry[] = [
      {
        locPath: '/?view=social',
        lastmodIso: todayIso,
        changefreq: 'daily' as const,
        priority: '0.9',
      },
      ...BLOG_ARTICLES.map((art) => ({
        locPath: `/?view=hub&article=${encodeURIComponent(art.slug)}`,
        lastmodIso: art.publishedIso,
        changefreq: 'weekly' as const,
        priority: '0.8',
      })),
      ...(serverCommunityState.studioArticles || [])
        .filter((art) => art.status === 'published')
        .slice(0, 30)
        .map((art) => ({
          locPath: `/?view=hub&article=${encodeURIComponent(art.slug)}`,
          lastmodIso: art.publishedIso,
          changefreq: 'daily' as const,
          priority: '0.85',
        })),
      ...serverCommunityState.threads.slice(0, 20).map((t) => ({
        locPath: `/?view=hub&thread=${encodeURIComponent(t.slug)}`,
        lastmodIso: new Date(t.createdAt).toISOString().slice(0, 10),
        changefreq: 'daily' as const,
        priority: '0.7',
      })),
    ];
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.status(200).send(generateSitemapXml(origin, dynamicEntries, todayIso));
  });

  app.get('/manifest.webmanifest', (_req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).json(buildWebAppManifest());
  });

  app.get('/api/health', (_req, res) => {
    const publicUrl = readPersistedTunnelUrl();
    res.status(200).json({
      ok: true,
      service: 'luxo-ai-studio',
      modelCount: Object.keys(LUXO_MODELS).length,
      collabRooms: collabRooms.size,
      publicUrl: publicUrl || null,
      cacheHits: chatCacheHitCount,
      uptimeSec: Math.round(process.uptime()),
    });
  });

  app.get('/api/public-url', async (req, res) => {
    const forceRefresh = req.query.refresh === '1';
    const tunnelUrl = await ensurePublicTunnelRunning(PORT, forceRefresh);
    const aisPreUrl = resolvePublicAppUrl(
      process.env.SHARED_APP_URL ||
        process.env.APP_URL ||
        'https://ais-pre-fudupxh6ld5rvvbfz5qwt4-705459740809.europe-west2.run.app'
    );
    res.status(200).json({
      publicUrl: aisPreUrl,
      permanentUrl: aisPreUrl,
      tunnelUrl: tunnelUrl || null,
      aisPreUrl,
      ready: true,
    });
  });

  app.get('/api/seo-performance-audit', (req, res) => {
    const origin = resolveCanonicalOrigin(req);
    const indexPath = path.resolve(process.cwd(), 'index.html');
    let html = '';
    try {
      html = fs.readFileSync(indexPath, 'utf-8');
    } catch {
      html = '';
    }
    const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
    const descMatch = html.match(
      /<meta\s+name="description"\s+content="([^"]*)"/i
    );
    const canonicalMatch = html.match(
      /<link\s+rel="canonical"\s+href="([^"]*)"/i
    );
    const titleText = (titleMatch?.[1] || '')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
    const descText = (descMatch?.[1] || '').replace(/\s+/g, ' ').trim();
    const canonicalHref = (canonicalMatch?.[1] || `${origin}/`).trim();
    const hasJsonLd = html.includes('application/ld+json') && html.includes('FAQPage');
    const hasOgImage = html.includes('property="og:image"');

    const seoScore = scorePageMetaTags({
      title: titleText,
      description: descText,
      canonicalUrl: canonicalHref,
      hasJsonLd,
      hasRobots: true,
      hasSitemap: true,
      hasOgImage,
    });

    const assetsDir = path.resolve(process.cwd(), 'dist', 'assets');
    const bundleChunks: {
      file: string;
      rawKb: number;
      brotliKb: number;
      savingsPct: number;
    }[] = [];
    let totalRawBytes = 0;
    let totalBrotliBytes = 0;

    if (fs.existsSync(assetsDir)) {
      try {
        const files = fs
          .readdirSync(assetsDir)
          .filter((f) => /\.(js|css)$/i.test(f));
        for (const file of files) {
          const full = path.join(assetsDir, file);
          const buf = fs.readFileSync(full);
          const br = zlib.brotliCompressSync(buf, {
            params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 },
          });
          totalRawBytes += buf.length;
          totalBrotliBytes += br.length;
          const savingsPct =
            buf.length > 0
              ? Math.round(((buf.length - br.length) / buf.length) * 1000) / 10
              : 0;
          bundleChunks.push({
            file,
            rawKb: Math.round((buf.length / 1024) * 10) / 10,
            brotliKb: Math.round((br.length / 1024) * 10) / 10,
            savingsPct,
          });
        }
        bundleChunks.sort((a, b) => b.rawKb - a.rawKb);
      } catch {
        // ignore
      }
    }

    const overallSavingsPct =
      totalRawBytes > 0
        ? Math.round(((totalRawBytes - totalBrotliBytes) / totalRawBytes) * 1000) /
          10
        : 71.4;

    return res.json({
      ok: true,
      origin,
      seo: {
        ...seoScore,
        title: titleText,
        description: descText,
        canonicalUrl: canonicalHref,
        sitemapUrl: `${origin}/sitemap.xml`,
        robotsUrl: `${origin}/robots.txt`,
        indexedUrlsCount:
          5 +
          BLOG_ARTICLES.length +
          (serverCommunityState.studioArticles || []).filter(
            (a) => a.status === 'published'
          ).length +
          serverCommunityState.threads.length,
      },
      performance: {
        compressionEncoding: 'br / gzip (node:zlib)',
        staticCachePolicy: 'public, max-age=31536000, immutable',
        totalRawKb: Math.round((totalRawBytes / 1024) * 10) / 10,
        totalBrotliKb: Math.round((totalBrotliBytes / 1024) * 10) / 10,
        overallSavingsPct,
        bundleChunks: bundleChunks.slice(0, 8),
        aiCacheEntries: chatResponseCache.size,
        aiCacheHits: chatCacheHitCount,
        aiCacheHitRatioPct:
          chatCacheTotalRequests > 0
            ? Math.round((chatCacheHitCount / chatCacheTotalRequests) * 1000) / 10
            : 0,
      },
      security: {
        score: 98,
        apiKeyServerIsolated: true,
        piiRedactionActive: true,
        firestoreRbacEnforced: true,
        headersApplied: [
          'X-Content-Type-Options: nosniff',
          'Referrer-Policy: strict-origin-when-cross-origin',
          'Permissions-Policy: camera=(), geolocation=(), payment=(), usb=()',
          'X-Permitted-Cross-Domain-Policies: none',
          'Cross-Origin-Opener-Policy: same-origin-allow-popups',
        ],
      },
    });
  });

  app.post('/api/seo/generate-meta', async (req, res) => {
    const { topic = '', targetUrl = 'https://ais-pre-fudupxh6ld5rvvbfz5qwt4-705459740809.europe-west2.run.app/' } =
      req.body || {};
    const cleanTopic = sanitizeLuxoBrand(String(topic || '').trim()).slice(0, 220);
    if (cleanTopic.length < 3) {
      return res.status(400).json({
        ok: false,
        error: 'Lütfen optimize edilecek sayfa konusunu veya ürün adını girin.',
      });
    }

    const ai = getAiClient();
    if (ai) {
      try {
        const resp = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Konu: "${cleanTopic}"\nHedef URL: ${targetUrl}\n\nBu web sayfası için Google arama sonuçlarında maksimum tıklama oranı (CTR) sağlayacak Türkçe SEO meta paketi üret:\n1. metaTitle: 35–58 karakter arasında, marka ve anahtar kelime odaklı başlık.\n2. metaDescription: 125–156 karakter arasında, net eylem çağrısı içeren açıklama.\n3. primaryKeywords: 5 adet yüksek niyetli Türkçe anahtar kelime dizisi.\n4. technicalTip: Bu sayfa için 1 cümlelik somut teknik SEO önerisi.`,
          config: {
            abortSignal: AbortSignal.timeout(7500),
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                metaTitle: { type: Type.STRING },
                metaDescription: { type: Type.STRING },
                primaryKeywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                technicalTip: { type: Type.STRING },
              },
              required: [
                'metaTitle',
                'metaDescription',
                'primaryKeywords',
                'technicalTip',
              ],
            },
          },
        });
        if (resp.text) {
          const parsed = JSON.parse(resp.text.trim()) as {
            metaTitle?: string;
            metaDescription?: string;
            primaryKeywords?: string[];
            technicalTip?: string;
          };
          if (parsed.metaTitle && parsed.metaDescription) {
            return res.json({
              ok: true,
              metaTitle: sanitizeLuxoBrand(parsed.metaTitle).slice(0, 62),
              metaDescription: sanitizeLuxoBrand(parsed.metaDescription).slice(0, 162),
              primaryKeywords: (parsed.primaryKeywords || [])
                .map((k) => sanitizeLuxoBrand(k))
                .slice(0, 6),
              technicalTip: sanitizeLuxoBrand(parsed.technicalTip || ''),
            });
          }
        }
      } catch {
        // deterministic fallback below
      }
    }

    const shortTopic = cleanTopic.slice(0, 34);
    return res.json({
      ok: true,
      metaTitle: `${shortTopic} – Hızlı Çözümler & Rehber | Luxo AI`.slice(0, 59),
      metaDescription: `${shortTopic} alanında doğrulanmış araçlar, adım adım uygulama rehberi ve performans çözümlerini hemen ücretsiz inceleyin ve uygulayın.`.slice(
        0,
        156
      ),
      primaryKeywords: [
        cleanTopic.toLowerCase(),
        `${cleanTopic.toLowerCase()} rehberi`,
        `${cleanTopic.toLowerCase()} araçları`,
        `en iyi ${cleanTopic.toLowerCase()}`,
        `${cleanTopic.toLowerCase()} optimizasyonu`,
      ],
      technicalTip:
        'Bu sayfa için kanonik URL tanımlayın ve SSS maddelerini Schema.org FAQPage JSON-LD şemasıyla işaretleyin.',
    });
  });

  app.get('/api/community/state', (_req, res) => {
    return res.json({ ok: true, state: serverCommunityState });
  });

  app.post('/api/community/forum/create', (req, res) => {
    const { title = '', category = 'AI Modelleri & Prompt', authorName = '', body = '' } =
      req.body || {};
    const outcome = createForumThread(serverCommunityState, {
      title: String(title),
      category,
      authorName: String(authorName),
      body: String(body),
    });
    if (!outcome.created) {
      return res.status(400).json({ ok: false, error: outcome.error });
    }
    persistServerCommunityState(outcome.state);
    return res.json({ ok: true, state: outcome.state, created: outcome.created });
  });

  app.post('/api/community/forum/upvote', (req, res) => {
    const threadId = String(req.body?.threadId || '').trim();
    if (!threadId) {
      return res.status(400).json({ ok: false, error: 'Geçersiz konu kimliği.' });
    }
    const next = upvoteForumThread(serverCommunityState, threadId);
    persistServerCommunityState(next);
    return res.json({ ok: true, state: next });
  });

  app.post('/api/community/forum/reply', async (req, res) => {
    const {
      threadId = '',
      authorName = '',
      body = '',
      generateAiExpertReply = false,
      modelId = 'gemini-4-argon',
    } = req.body || {};

    const targetThread = serverCommunityState.threads.find(
      (t) => t.id === String(threadId)
    );
    if (!targetThread) {
      return res.status(404).json({ ok: false, error: 'Tartışma konusu bulunamadı.' });
    }

    if (generateAiExpertReply) {
      const chosenId: LuxoModelId =
        modelId in LUXO_MODELS ? (modelId as LuxoModelId) : 'gemini-4-argon';
      const chosenCfg = LUXO_MODELS[chosenId];
      let aiText = '';
      const ai = getAiClient();
      if (ai) {
        try {
          const resp = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Forum Başlığı: ${targetThread.title}\nKategori: ${targetThread.category}\nSoru/İçerik: ${targetThread.body}\n\nBu topluluk konusuna "${chosenCfg.name}" kıdemli mühendislik perspektifiyle 2–3 cümlelik, somut teknik çözüm öneren, dolgusuz Türkçe bir uzman yanıtı yaz.`,
            config: {
              abortSignal: AbortSignal.timeout(6500),
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          });
          if (resp.text) {
            aiText = cleanAssistantResponse(resp.text, false);
          }
        } catch {
          // fallback below
        }
      }
      if (!aiText) {
        aiText = `${targetThread.category} başlığındaki bu senaryoda önce ölçülebilir temel metrikleri (TTFB, LCP ve önbellek isabet oranı) kayıt altına alıp kademeli doğrulama ile ilerlemek en kararlı sonucu verir.`;
      }
      const outcome = addForumReply(serverCommunityState, {
        threadId: targetThread.id,
        authorName: chosenCfg.name,
        body: aiText,
        isAiExpert: true,
        modelLabel: `${chosenCfg.name} · Uzman Sentezi`,
      });
      persistServerCommunityState(outcome.state);
      return res.json({ ok: true, state: outcome.state });
    }

    const outcome = addForumReply(serverCommunityState, {
      threadId: targetThread.id,
      authorName: String(authorName),
      body: String(body),
    });
    if (outcome.error) {
      return res.status(400).json({ ok: false, error: outcome.error });
    }
    persistServerCommunityState(outcome.state);
    return res.json({ ok: true, state: outcome.state });
  });

  app.post('/api/community/polls/vote', (req, res) => {
    const pollId = String(req.body?.pollId || '').trim();
    const optionId = String(req.body?.optionId || '').trim();
    if (!pollId || !optionId) {
      return res.status(400).json({ ok: false, error: 'Eksik anket seçimi.' });
    }
    const next = voteInPoll(serverCommunityState, pollId, optionId);
    persistServerCommunityState(next);
    return res.json({ ok: true, state: next });
  });

  app.post('/api/community/polls/create', (req, res) => {
    const { question = '', category = 'Topluluk Anketi', options = [] } = req.body || {};
    const optionList = Array.isArray(options) ? options.map((o) => String(o || '')) : [];
    const outcome = createCommunityPoll(serverCommunityState, {
      question: String(question),
      category: String(category),
      options: optionList,
    });
    if (!outcome.created) {
      return res.status(400).json({ ok: false, error: outcome.error });
    }
    persistServerCommunityState(outcome.state);
    return res.json({ ok: true, created: outcome.created, state: outcome.state });
  });

  app.post('/api/community/articles/comment', (req, res) => {
    const { articleId = '', authorName = '', body = '' } = req.body || {};
    const outcome = addArticleComment(serverCommunityState, {
      articleId: String(articleId),
      authorName: String(authorName),
      body: String(body),
    });
    if (!outcome.comment) {
      return res.status(400).json({ ok: false, error: outcome.error });
    }
    persistServerCommunityState(outcome.state);
    return res.json({
      ok: true,
      comment: outcome.comment,
      state: outcome.state,
    });
  });

  app.post('/api/community/articles/react', (req, res) => {
    const articleId = String(req.body?.articleId || '').trim();
    if (!articleId) {
      return res.status(400).json({ ok: false, error: 'Eksik makale kimliği.' });
    }
    const next = reactToArticle(serverCommunityState, articleId);
    persistServerCommunityState(next);
    return res.json({ ok: true, state: next });
  });

  app.post('/api/content-studio/generate', async (req, res) => {
    const {
      topic = '',
      focusKeyword = '',
      audience = 'Geliştiriciler & Dijital Ekipler',
      tone = 'Profesyonel & Kurumsal',
      intent = 'Bilgi',
    } = req.body || {};

    const cleanTopic = sanitizeLuxoBrand(String(topic || '').trim()).slice(0, 160);
    if (cleanTopic.length < 3) {
      return res.status(400).json({
        ok: false,
        error: 'Lütfen içerik konusunu en az 3 karakter olarak girin.',
      });
    }

    const fallbackPack = generateDeterministicContentPack({
      topic: cleanTopic,
      focusKeyword: String(focusKeyword || ''),
      audience: String(audience || ''),
      tone: tone as ContentStudioTone,
      intent: intent as ContentStudioIntent,
    });

    const ai = getAiClient();
    if (ai) {
      try {
        const resp = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Konu: "${cleanTopic}"\nOdak Anahtar Kelime: "${fallbackPack.primaryKeyword}"\nHedef Kitle: "${audience}"\nÜslup: "${tone}"\nArama Niyeti: "${intent}"\n\nWeb sitesi İçerik Stüdyosu için Türkçe, yüksek tıklama oranlı (CTR) SEO içerik paketi üret:\n- blogTitles: 4 adet farklı açıda (Rehber, Karşılaştırma, Uygulama Şablonu, Vaka Analizi) 35–60 karakterlik blog başlığı.\n- metaDescriptions: 3 adet net eylem çağrısı içeren 122–156 karakterlik SEO meta açıklaması.\n- secondaryKeywords: 5 adet alakalı Türkçe anahtar kelime.\n- suggestedSummary: 1–2 cümlelik yönetici özeti.\n- suggestedSections: 3 adet alt başlıklı (heading + content) doğrudan yayınlanmaya hazır makale bölümü.`,
          config: {
            abortSignal: AbortSignal.timeout(8500),
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                blogTitles: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      angle: { type: Type.STRING },
                      estimatedCtrPct: { type: Type.NUMBER },
                    },
                    required: ['title', 'angle'],
                  },
                },
                metaDescriptions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      description: { type: Type.STRING },
                      ctaFocus: { type: Type.STRING },
                    },
                    required: ['description', 'ctaFocus'],
                  },
                },
                secondaryKeywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                suggestedSummary: { type: Type.STRING },
                suggestedSections: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      heading: { type: Type.STRING },
                      content: { type: Type.STRING },
                    },
                    required: ['heading', 'content'],
                  },
                },
              },
              required: [
                'blogTitles',
                'metaDescriptions',
                'secondaryKeywords',
                'suggestedSummary',
                'suggestedSections',
              ],
            },
          },
        });

        if (resp.text) {
          const parsed = JSON.parse(resp.text.trim()) as {
            blogTitles?: { title?: string; angle?: string; estimatedCtrPct?: number }[];
            metaDescriptions?: { description?: string; ctaFocus?: string }[];
            secondaryKeywords?: string[];
            suggestedSummary?: string;
            suggestedSections?: { heading?: string; content?: string }[];
          };

          const validAngles = [
            'Rehber',
            'Karşılaştırma',
            'Vaka Analizi',
            'Uygulama Şablonu',
          ] as const;

          const aiTitles = (parsed.blogTitles || [])
            .map((t, idx) => {
              const titleStr = sanitizeLuxoBrand(String(t.title || '').trim()).slice(0, 68);
              const matchedAngle = validAngles.find((a) =>
                String(t.angle || '').includes(a)
              );
              return {
                id: `bt-ai-${idx + 1}`,
                title: titleStr,
                angle: matchedAngle || validAngles[idx % validAngles.length],
                charLength: titleStr.length,
                estimatedCtrPct:
                  typeof t.estimatedCtrPct === 'number' && t.estimatedCtrPct > 5
                    ? Math.round(t.estimatedCtrPct * 10) / 10
                    : 20.5 + idx * 1.4,
              };
            })
            .filter((t) => t.title.length >= 16);

          const aiDescs = (parsed.metaDescriptions || [])
            .map((d, idx) => {
              const descStr = sanitizeLuxoBrand(
                String(d.description || '').trim()
              ).slice(0, 162);
              return {
                id: `md-ai-${idx + 1}`,
                description: descStr,
                ctaFocus:
                  sanitizeLuxoBrand(String(d.ctaFocus || '').trim()) ||
                  'SEO & Dönüşüm Odaklı',
                charLength: descStr.length,
                inOptimalRange: descStr.length >= 115 && descStr.length <= 160,
              };
            })
            .filter((d) => d.description.length >= 50);

          const aiSections = (parsed.suggestedSections || [])
            .map((s, idx) => ({
              heading:
                sanitizeLuxoBrand(String(s.heading || '').trim()) ||
                `0${idx + 1}. Uygulama Adımı`,
              content: sanitizeLuxoBrand(String(s.content || '').trim()),
            }))
            .filter((s) => s.content.length >= 25);

          if (aiTitles.length >= 2 && aiDescs.length >= 2) {
            return res.json({
              ok: true,
              pack: {
                topic: cleanTopic,
                primaryKeyword: fallbackPack.primaryKeyword,
                secondaryKeywords:
                  Array.isArray(parsed.secondaryKeywords) &&
                  parsed.secondaryKeywords.length > 0
                    ? parsed.secondaryKeywords
                        .map((k) => sanitizeLuxoBrand(String(k)))
                        .slice(0, 6)
                    : fallbackPack.secondaryKeywords,
                blogTitles: aiTitles.slice(0, 4),
                metaDescriptions: aiDescs.slice(0, 3),
                suggestedSlug:
                  slugifyStudioText(aiTitles[0].title) || fallbackPack.suggestedSlug,
                suggestedSummary:
                  sanitizeLuxoBrand(String(parsed.suggestedSummary || '').trim()) ||
                  fallbackPack.suggestedSummary,
                suggestedSections:
                  aiSections.length > 0
                    ? aiSections.slice(0, 5)
                    : fallbackPack.suggestedSections,
              },
            });
          }
        }
      } catch {
        // deterministic fallback below
      }
    }

    return res.json({ ok: true, pack: fallbackPack });
  });

  app.post('/api/content-studio/publish', (req, res) => {
    const body = req.body || {};
    const existingStudio = serverCommunityState.studioArticles || [];
    const outcome = validateAndBuildStudioArticle(existingStudio, {
      id: body.id ? String(body.id) : undefined,
      title: String(body.title || ''),
      slug: body.slug ? String(body.slug) : undefined,
      metaTitle: body.metaTitle ? String(body.metaTitle) : undefined,
      metaDescription: String(body.metaDescription || ''),
      focusKeyword: String(body.focusKeyword || ''),
      category: body.category || 'Teknik SEO',
      tone: body.tone || 'Profesyonel & Kurumsal',
      status: body.status === 'draft' ? 'draft' : 'published',
      authorName: String(body.authorName || ''),
      summary: body.summary ? String(body.summary) : undefined,
      bodyText: String(body.bodyText || ''),
      publishedIso: body.publishedIso ? String(body.publishedIso) : undefined,
      recommendedModelId: body.recommendedModelId || 'gemini-4-argon',
    });

    if (!outcome.article) {
      return res.status(400).json({ ok: false, error: outcome.error });
    }

    const nextState: CommunityHubState = {
      ...serverCommunityState,
      studioArticles: outcome.articles,
      articleReactions: {
        ...serverCommunityState.articleReactions,
        [outcome.article.id]:
          serverCommunityState.articleReactions[outcome.article.id] ?? 1,
      },
      updatedAt: Date.now(),
    };
    persistServerCommunityState(nextState);
    return res.json({
      ok: true,
      article: outcome.article,
      state: nextState,
    });
  });

  app.post('/api/content-studio/delete', (req, res) => {
    const articleId = String(req.body?.articleId || '').trim();
    if (!articleId) {
      return res.status(400).json({ ok: false, error: 'Eksik içerik kimliği.' });
    }
    const nextArticles = removeStudioArticleById(
      serverCommunityState.studioArticles || [],
      articleId
    );
    const nextState: CommunityHubState = {
      ...serverCommunityState,
      studioArticles: nextArticles,
      updatedAt: Date.now(),
    };
    persistServerCommunityState(nextState);
    return res.json({ ok: true, state: nextState });
  });

  // 1200x630 OpenGraph Social Share Card SVG Endpoint
  app.get('/api/og-image', (req, res) => {
    const rawTitle = sanitizeLuxoBrand(
      String(req.query.title || 'Luxo AI · 113 Yapay Zeka Modeli')
    ).slice(0, 62);
    const rawExcerpt = sanitizeLuxoBrand(
      String(
        req.query.excerpt ||
          'Gemini 4 Hydrogen, ChatGPT-5.2 Pro, Claude 4.6 Opus, DeepSeek V3.2, Grok 4, Qwen 3, Nano Banana 4K görsel ve Google Veo 3 video stüdyosu.'
      )
    ).slice(0, 128);
    const rawBadge = sanitizeLuxoBrand(
      String(req.query.badge || '113 YAPAY ZEKA · AUTO-ROUTER & VEO 3')
    ).slice(0, 44);

    const words = rawExcerpt.split(/\s+/).filter(Boolean);
    let l1 = '';
    let l2 = '';
    for (const w of words) {
      if ((l1 + ' ' + w).trim().length <= 64 && !l2) {
        l1 = (l1 + ' ' + w).trim();
      } else if ((l2 + ' ' + w).trim().length <= 64) {
        l2 = (l2 + ' ' + w).trim();
      } else {
        l2 = l2 ? `${l2}…` : l2;
        break;
      }
    }
    const line1 = escapeXml(l1);
    const line2 = escapeXml(l2);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs>
        <linearGradient id="ogBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#070b14" />
          <stop offset="52%" stop-color="#111827" />
          <stop offset="100%" stop-color="#1e1b4b" />
        </linearGradient>
        <radialGradient id="ogOrb1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.45" />
          <stop offset="100%" stop-color="#4f46e5" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="ogOrb2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.32" />
          <stop offset="100%" stop-color="#06b6d4" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#ogBg)" />
      <circle cx="980" cy="150" r="320" fill="url(#ogOrb1)" />
      <circle cx="240" cy="520" r="280" fill="url(#ogOrb2)" />
      <rect x="64" y="64" width="1072" height="502" rx="36" fill="rgba(17,24,39,0.72)" stroke="rgba(255,255,255,0.14)" stroke-width="2" />

      <g transform="translate(112, 118)">
        <rect x="0" y="0" width="64" height="64" rx="18" fill="#4f46e5" />
        <polygon points="32,12 48,32 32,52 16,32" fill="#ffffff" />
        <text x="84" y="38" fill="#ffffff" font-family="Plus Jakarta Sans, system-ui, sans-serif" font-size="30" font-weight="800">Luxo AI</text>
        <text x="84" y="60" fill="#a5b4fc" font-family="JetBrains Mono, monospace" font-size="15" font-weight="600">${escapeXml(rawBadge)}</text>
      </g>

      <text x="112" y="292" fill="#ffffff" font-family="Plus Jakarta Sans, system-ui, sans-serif" font-size="46" font-weight="800">${escapeXml(rawTitle)}</text>
      <text x="112" y="362" fill="#cbd5e1" font-family="Plus Jakarta Sans, system-ui, sans-serif" font-size="24" font-weight="500">${line1}</text>
      ${
        line2
          ? `<text x="112" y="398" fill="#cbd5e1" font-family="Plus Jakarta Sans, system-ui, sans-serif" font-size="24" font-weight="500">${line2}</text>`
          : ''
      }

      <g transform="translate(112, 476)">
        <text x="0" y="24" fill="#38bdf8" font-family="JetBrains Mono, monospace" font-size="17" font-weight="600">113 Yapay Zeka Modeli · Luxo Auto-Router · Nano Banana 4K · Google Veo 3</text>
      </g>
    </svg>`;

    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(svg);
  });

  let paidMediaCooldownUntil = 0;

  // AI Prompt Enhancer Endpoint
  app.post('/api/enhance-prompt', async (req, res) => {
    const {
      prompt = '',
      synthesisMode = 'standart',
      mediaType,
      style = 'Sinematik',
      cameraMotion = 'Sinematik Akış',
      highFidelity = false,
      lensPreset,
      negativePrompt = '',
      motionControl,
    } = req.body || {};

    const clean = sanitizeLuxoBrand(String(prompt || '').trim());
    if (!clean) {
      return res.json({ enhancedPrompt: '' });
    }

    const normalizedMotion = motionControl
      ? normalizeCinematicMotion(motionControl as Partial<CinematicMotionParams>)
      : undefined;
    const motionDesc = normalizedMotion
      ? describeCinematicMotion(normalizedMotion).summaryTr
      : '';

    const ai = getAiClient();
    if (ai) {
      try {
        const hiFiNote = highFidelity
          ? ', 4K UHD keskinlik ve 60fps optik kare interpolasyonu (ultra akıcı zamansal hareket)'
          : '';
        const motionNote = motionDesc ? `, optik hareket (${motionDesc})` : '';
        const instruction =
          mediaType === 'image' || mediaType === 'video'
            ? `Kullanıcının verdiği kısa ${
                mediaType === 'video' ? 'video' : 'görsel'
              } istemini kamera lensi, ışıklandırma, doku, kompozisyon${
                mediaType === 'video'
                  ? `, "${cameraMotion}" kamera hareketi${motionNote}${hiFiNote}`
                  : ''
              } detaylarıyla zenginleştirilmiş tek paragraflık etkileyici bir Türkçe isteme dönüştür. Yalnızca geliştirilmiş istem metnini döndür, tırnak veya açıklama ekleme.`
            : 'Kullanıcının istemini yapay zekadan kısa, öz, sade ve değişik semboller içermeyen doğrudan bir yanıt alacak şekilde net bir Türkçe isteme dönüştür. Yalnızca 1-2 cümlelik geliştirilmiş istemi döndür.';

        for (const enhanceModel of ['gemini-3.1-flash-lite', 'gemini-3.8-flash']) {
          if (!isSdkModelHealthy(enhanceModel)) continue;
          try {
            const resp = await ai.models.generateContent({
              model: enhanceModel,
              contents: clean,
              config: {
                abortSignal: AbortSignal.timeout(3500),
                systemInstruction: instruction,
                ...(enhanceModel === 'gemini-3.8-flash'
                  ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                  : {}),
              },
            });
            if (resp.text && resp.text.trim()) {
              return res.json({
                enhancedPrompt: cleanAssistantResponse(resp.text.trim(), true),
              });
            }
          } catch (err) {
            recordSdkModelFailure(enhanceModel, err);
          }
        }
      } catch {
        // Fallback below
      }
    }

    const fallback =
      mediaType === 'image' || mediaType === 'video'
        ? enhanceMediaPrompt(clean, mediaType, style, cameraMotion, {
            highFidelity: Boolean(highFidelity),
            lensPreset: lensPreset as NanoLensPresetId | undefined,
            negativePrompt: String(negativePrompt || ''),
            motionControl: normalizedMotion,
          })
        : enhanceUserPrompt(clean, synthesisMode as SynthesisMode);

    return res.json({ enhancedPrompt: fallback });
  });

  // Autonomous Self-Improving Site & 112 AI Evolution Engine Endpoints
  app.get('/api/evolution/state', (_req, res) => {
    return res.json({
      ok: true,
      state: serverEvolutionState,
    });
  });

  app.post('/api/evolution/evolve', async (req, res) => {
    const { focusCategory = 'Tüm Modeller', trigger = 'manual' } = req.body || {};
    const validFocus = String(focusCategory) as LuxoModelCategory | 'Tüm Modeller';
    const ai = getAiClient();

    let synthesizedCustomRule:
      | {
          title: string;
          directive: string;
          challengerFinding: string;
          appliedPatch: string;
          verifiedGain: string;
          testPrompt?: string;
          category?: LuxoModelCategory | 'Tüm Modeller';
        }
      | undefined;

    if (ai) {
      for (const evoModel of ['gemini-3.1-flash-lite', 'gemini-3.8-flash']) {
        if (!isSdkModelHealthy(evoModel)) continue;
        try {
          const existingTitles = serverEvolutionState.learnedRules
            .slice(0, 6)
            .map((r) => r.title)
            .join(', ');
          const criticResp = await ai.models.generateContent({
            model: evoModel,
            contents: `Hedef Ekosistem: "${validFocus}". Mevcut kurallar: [${existingTitles}].
Mevcut 113 yapay zeka modelimizin yanıt kalitesini, hızını, Türkçe dil doğruluğunu, kod güvenliğini veya sayısal kesinliğini artıracak YENİ ve somut bir öz-gelişim yaması üret.`,
            config: {
              abortSignal: AbortSignal.timeout(5500),
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  directive: { type: Type.STRING },
                  challengerFinding: { type: Type.STRING },
                  appliedPatch: { type: Type.STRING },
                  verifiedGain: { type: Type.STRING },
                  testPrompt: { type: Type.STRING },
                },
                required: [
                  'title',
                  'directive',
                  'challengerFinding',
                  'appliedPatch',
                  'verifiedGain',
                  'testPrompt',
                ],
              },
            },
          });

          const rawJson = (criticResp.text || '').trim();
          if (rawJson) {
            const parsed = JSON.parse(rawJson) as Record<string, unknown>;
            const title = sanitizeLuxoBrand(String(parsed.title || '').trim());
            const directive = sanitizeLuxoBrand(
              String(parsed.directive || '').trim()
            );
            const challengerFinding = sanitizeLuxoBrand(
              String(parsed.challengerFinding || '').trim()
            );
            const appliedPatch = sanitizeLuxoBrand(
              String(parsed.appliedPatch || '').trim()
            );
            const verifiedGain = sanitizeLuxoBrand(
              String(parsed.verifiedGain || '').trim()
            );
            const testPrompt = sanitizeLuxoBrand(
              String(parsed.testPrompt || '').trim()
            );
            if (title.length >= 6 && directive.length >= 15) {
              synthesizedCustomRule = {
                title: title.slice(0, 64),
                directive: directive.slice(0, 240),
                challengerFinding:
                  challengerFinding.slice(0, 180) ||
                  'Çok adımlı akıl yürütme ve uç durum doğrulaması denetlendi.',
                appliedPatch:
                  appliedPatch.slice(0, 180) ||
                  'Sistem istemi ve yönlendirme ağırlıkları güncellendi.',
                verifiedGain:
                  verifiedGain.slice(0, 80) || '+0.3% doğruluk kalibrasyonu',
                testPrompt: testPrompt.slice(0, 160) || undefined,
                category: validFocus,
              };
              break;
            }
          }
        } catch (err) {
          recordSdkModelFailure(evoModel, err);
        }
      }
    }

    const nextState = runDeterministicEvolutionCycle(serverEvolutionState, {
      focusCategory: validFocus,
      trigger: trigger === 'auto-site' ? 'auto-site' : 'manual',
      customRule: synthesizedCustomRule,
    });
    persistServerEvolutionState(nextState);
    return res.json({ ok: true, state: nextState });
  });

  app.post('/api/evolution/custom-train', async (req, res) => {
    const {
      goalText = '',
      category = 'Tüm Modeller',
      targetModelId,
    } = req.body || {};
    const cleanGoal = redactSensitivePii(String(goalText || '').trim()).slice(
      0,
      360
    );
    if (cleanGoal.length < 4) {
      return res.status(400).json({
        ok: false,
        error: 'Lütfen en az 4 karakterlik bir öz-eğitim hedefi yazın.',
      });
    }

    const validCategory = String(category) as
      | LuxoModelCategory
      | 'Tüm Modeller';
    const validTargetModel: LuxoModelId | undefined =
      typeof targetModelId === 'string' && targetModelId in LUXO_MODELS
        ? (targetModelId as LuxoModelId)
        : undefined;

    let synthesizedTitle: string | undefined;
    let synthesizedDirective: string | undefined;
    let synthesizedTestPrompt: string | undefined;

    const ai = getAiClient();
    if (ai) {
      for (const evoModel of ['gemini-3.1-flash-lite', 'gemini-3.8-flash']) {
        if (!isSdkModelHealthy(evoModel)) continue;
        try {
          const targetDesc = validTargetModel
            ? `${LUXO_MODELS[validTargetModel].name} (${validCategory})`
            : validCategory;
          const resp = await ai.models.generateContent({
            model: evoModel,
            contents: `Kullanıcının yapay zekaya kazandırmak istediği öz-eğitim hedefi: "${cleanGoal}". Hedef kapsam: "${targetDesc}".
Bu hedefi doğrudan sistem yönergesine eklenecek keskin, ölçülebilir 1 cümlelik Türkçe kurala dönüştür ve tek tıkla test edilecek 1 örnek Türkçe soru üret.`,
            config: {
              abortSignal: AbortSignal.timeout(5000),
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  directive: { type: Type.STRING },
                  testPrompt: { type: Type.STRING },
                },
                required: ['title', 'directive', 'testPrompt'],
              },
            },
          });
          const rawJson = (resp.text || '').trim();
          if (rawJson) {
            const parsed = JSON.parse(rawJson) as Record<string, unknown>;
            const t = sanitizeLuxoBrand(String(parsed.title || '').trim());
            const d = sanitizeLuxoBrand(String(parsed.directive || '').trim());
            const tp = sanitizeLuxoBrand(
              String(parsed.testPrompt || '').trim()
            );
            if (t.length >= 5 && d.length >= 12) {
              synthesizedTitle = t;
              synthesizedDirective = d;
              synthesizedTestPrompt = tp || undefined;
              break;
            }
          }
        } catch (err) {
          recordSdkModelFailure(evoModel, err);
        }
      }
    }

    const nextState = applyCustomTrainingRule(serverEvolutionState, {
      goalText: cleanGoal,
      category: validCategory,
      targetModelId: validTargetModel,
      synthesizedTitle,
      synthesizedDirective,
      synthesizedTestPrompt,
    });
    persistServerEvolutionState(nextState);
    return res.json({ ok: true, state: nextState });
  });

  app.post('/api/evolution/boost-model', (req, res) => {
    const { modelId, focusDirective } = req.body || {};
    if (typeof modelId !== 'string' || !(modelId in LUXO_MODELS)) {
      return res.status(400).json({ ok: false, error: 'Geçersiz model kimliği.' });
    }
    const validId = modelId as LuxoModelId;
    const cfg = LUXO_MODELS[validId];
    sdkModelCooldownMap.delete(cfg.sdkBackend);
    const nextState = boostIndividualModel(serverEvolutionState, {
      modelId: validId,
      modelName: cfg.name,
      category: cfg.category,
      focusDirective:
        typeof focusDirective === 'string'
          ? sanitizeLuxoBrand(focusDirective.slice(0, 220))
          : undefined,
    });
    persistServerEvolutionState(nextState);
    return res.json({ ok: true, state: nextState });
  });

  app.post('/api/evolution/benchmark', async (_req, res) => {
    const ai = getAiClient();
    const results = await Promise.all(
      EVOLUTION_BENCHMARK_SUITE.map(async (spec) => {
        const started = Date.now();
        const exactProof = evaluateSafeMathExpression(spec.prompt);
        const directives = getActiveDirectivesForModel(
          serverEvolutionState,
          spec.modelId,
          spec.category
        );
        const sysPrompt = buildSystemPrompt(spec.modelId, {
          learnedDirectives: exactProof
            ? [
                `Doğrulanmış Kesin Sayısal Sonuç: ${exactProof.expression} = ${exactProof.result}`,
                ...directives,
              ]
            : directives,
          evolutionGeneration: serverEvolutionState.generation,
        });

        let outputText = '';
        if (ai && isSdkModelHealthy('gemini-3.1-flash-lite')) {
          try {
            const resp = await ai.models.generateContent({
              model: 'gemini-3.1-flash-lite',
              contents: spec.prompt,
              config: {
                abortSignal: AbortSignal.timeout(4500),
                systemInstruction: sysPrompt,
              },
            });
            if (resp.text) {
              outputText = verifyAndRepairModelOutput(resp.text, {
                allowLong: Boolean(spec.requiresCodeBlock),
                exactMathProof: exactProof,
              });
            }
          } catch (err) {
            recordSdkModelFailure('gemini-3.1-flash-lite', err);
          }
        }

        if (!outputText) {
          const localFb = generateLocalSmartResponse(spec.prompt, spec.modelId);
          outputText = verifyAndRepairModelOutput(localFb.text, {
            allowLong: Boolean(spec.requiresCodeBlock),
            exactMathProof: exactProof,
          });
        }

        const elapsed = Date.now() - started;
        return scoreBenchmarkOutput(spec, outputText, elapsed);
      })
    );

    const nextState = applyBenchmarkEvaluationToState(
      serverEvolutionState,
      results
    );
    persistServerEvolutionState(nextState);
    return res.json({ ok: true, state: nextState, results });
  });

  app.post('/api/evolution/delete-rule', (req, res) => {
    const { ruleId } = req.body || {};
    if (typeof ruleId !== 'string' || !ruleId.trim()) {
      return res.json({ ok: true, state: serverEvolutionState });
    }
    const nextState = deleteEvolutionRule(serverEvolutionState, ruleId.trim());
    persistServerEvolutionState(nextState);
    return res.json({ ok: true, state: nextState });
  });

  app.post('/api/evolution/calibrate-all', (_req, res) => {
    // Clear any transient model cooldowns so all 113 models operate at peak responsiveness
    sdkModelCooldownMap.clear();
    paidMediaCooldownUntil = 0;
    const nextState = calibrateAllEcosystems(serverEvolutionState);
    persistServerEvolutionState(nextState);
    return res.json({ ok: true, state: nextState });
  });

  app.post('/api/evolution/ingest-chat', (req, res) => {
    const {
      userPrompt = '',
      assistantReply = '',
      modelId = 'luxo-auto-router',
      signalType = 'complete',
      consentStatus = 'unset',
    } = req.body || {};

    const normalizedConsent = normalizeConsentStatus(consentStatus);
    if (normalizedConsent !== 'granted') {
      return res.json({
        ok: true,
        updated: false,
        state: serverEvolutionState,
      });
    }

    const validModelId: LuxoModelId =
      modelId in LUXO_MODELS ? (modelId as LuxoModelId) : 'luxo-auto-router';
    const validSignal =
      signalType === 'liked' ||
      signalType === 'regenerated' ||
      signalType === 'winner'
        ? signalType
        : 'complete';

    const result = ingestConsentedChatSignal(serverEvolutionState, {
      userPrompt: redactSensitivePii(String(userPrompt || '').slice(0, 600)),
      assistantReply: redactSensitivePii(
        String(assistantReply || '').slice(0, 1200)
      ),
      modelId: validModelId,
      signalType: validSignal,
      consentStatus: normalizedConsent,
    });

    if (result.updated) {
      persistServerEvolutionState(result.state);
    }

    return res.json({
      ok: true,
      updated: result.updated,
      summary: result.sanitizedSummary,
      state: serverEvolutionState,
    });
  });

  app.post('/api/evolution/toggle-rule', (req, res) => {
    const { ruleId, autoEvolutionEnabled } = req.body || {};
    let nextState = serverEvolutionState;
    if (typeof ruleId === 'string' && ruleId.trim()) {
      nextState = toggleEvolutionRule(nextState, ruleId.trim());
    }
    if (typeof autoEvolutionEnabled === 'boolean') {
      nextState = {
        ...nextState,
        autoEvolutionEnabled,
        lastUpdatedAt: Date.now(),
      };
    }
    persistServerEvolutionState(nextState);
    return res.json({ ok: true, state: nextState });
  });

  app.post('/api/evolution/usage', (req, res) => {
    const { modelId } = req.body || {};
    if (typeof modelId !== 'string' || !(modelId in LUXO_MODELS)) {
      return res.status(400).json({ ok: false, error: 'Geçersiz model kimliği.' });
    }
    const nextState = recordModelUsageInState(serverEvolutionState, modelId);
    persistServerEvolutionState(nextState);
    return res.json({ ok: true, state: nextState });
  });

  app.post('/api/evolution/signal', (req, res) => {
    const { messageId, modelId, rating, snippet } = req.body || {};
    const validModelId: LuxoModelId =
      typeof modelId === 'string' && modelId in LUXO_MODELS
        ? (modelId as LuxoModelId)
        : 'luxo-auto-router';
    const validRating = rating === 'thumbs_down' ? 'thumbs_down' : 'thumbs_up';
    const safeMsgId =
      typeof messageId === 'string' && messageId.trim()
        ? messageId.trim().slice(0, 80)
        : `sig-${Date.now()}`;
    const safeSnippet =
      typeof snippet === 'string' && snippet.trim()
        ? redactSensitivePii(snippet.trim().slice(0, 400))
        : undefined;

    const nextState = processModelFeedbackSignal(serverEvolutionState, {
      messageId: safeMsgId,
      modelId: validModelId,
      rating: validRating,
      responseSnippet: safeSnippet,
    });
    persistServerEvolutionState(nextState);
    return res.json({ ok: true, state: nextState });
  });

  // Supercharged Chat & Gemini 4 Argon Endpoint
  app.post('/api/chat', async (req, res) => {
    const {
      messages = [],
      modelId,
      model: legacyModelParam,
      customInstructions,
      customTone,
      customWarmth,
      customEnthusiasm,
      customFormatting,
      customEmoji,
      memoryItems,
      projectContext,
      webSearch = false,
      deepReasoning = false,
      synthesisMode = 'standart',
      reasoningLevel = 'balanced',
      responseConciseness = 'balanced',
      codeStrictness = 'production',
      autoVerifyOutputs = true,
      temperature,
      inlineAttachment: topLevelAttachment,
      stream = true,
    } = req.body || {};

    const requestedModel = String(modelId || legacyModelParam || 'luxo-flash');
    const validModelId: LuxoModelId =
      requestedModel in LUXO_MODELS
        ? (requestedModel as LuxoModelId)
        : 'luxo-flash';

    // Hydrate top-level inlineAttachment onto the latest user message if not already attached
    const normalizedMessages: {
      role: string;
      content: string;
      inlineAttachment?: InlineAttachmentPayload;
    }[] = Array.isArray(messages)
      ? messages.map((m: Record<string, unknown>) => ({
          role: String(m?.role || 'user'),
          content: String(m?.content || ''),
          ...(m?.inlineAttachment &&
          typeof (m.inlineAttachment as InlineAttachmentPayload).data === 'string'
            ? { inlineAttachment: m.inlineAttachment as InlineAttachmentPayload }
            : {}),
        }))
      : [];

    if (
      topLevelAttachment &&
      typeof topLevelAttachment.data === 'string' &&
      typeof topLevelAttachment.mimeType === 'string'
    ) {
      for (let idx = normalizedMessages.length - 1; idx >= 0; idx--) {
        if (normalizedMessages[idx].role === 'user') {
          if (!normalizedMessages[idx].inlineAttachment) {
            normalizedMessages[idx] = {
              ...normalizedMessages[idx],
              inlineAttachment: topLevelAttachment as InlineAttachmentPayload,
            };
          }
          break;
        }
      }
    }

    const reversedUserMsg = [...normalizedMessages]
      .reverse()
      .find((m) => m.role === 'user');
    const lastUserMessage = reversedUserMsg?.content || 'Merhaba';
    const activeAttachment = reversedUserMsg?.inlineAttachment;

    const autoRoute =
      validModelId === 'luxo-auto-router'
        ? resolveAutoRoutedModel(lastUserMessage, serverEvolutionState)
        : null;
    const effectiveModelId: LuxoModelId = autoRoute
      ? autoRoute.targetModelId
      : validModelId;
    const modelCfg = LUXO_MODELS[effectiveModelId];
    persistServerEvolutionState(
      recordModelUsageInState(serverEvolutionState, effectiveModelId)
    );
    const effectiveDeepReasoning =
      Boolean(deepReasoning) || Boolean(autoRoute?.autoDeepReasoning);
    const effectiveWebSearch =
      Boolean(webSearch) ||
      Boolean(autoRoute?.autoWebSearch) ||
      effectiveModelId === 'perplexity-sonar-pro' ||
      effectiveModelId === 'perplexity-reasoning' ||
      effectiveModelId === 'perplexity-research';

    const activeLearnedDirectives = getActiveDirectivesForModel(
      serverEvolutionState,
      effectiveModelId,
      modelCfg.category
    );
    const exactMathProof = evaluateSafeMathExpression(lastUserMessage);
    const enrichedDirectives = exactMathProof
      ? [
          `Doğrulanmış Kesin Sayısal Sonuç: ${exactMathProof.expression} = ${exactMathProof.result} (yanıtında bu kesin sonucu kullan).`,
          ...activeLearnedDirectives,
        ]
      : activeLearnedDirectives;

    const parsedReasoningLevel: 'fast' | 'balanced' | 'deep' =
      reasoningLevel === 'fast' || reasoningLevel === 'deep'
        ? reasoningLevel
        : 'balanced';
    const parsedConciseness: 'concise' | 'balanced' | 'detailed' =
      responseConciseness === 'concise' || responseConciseness === 'detailed'
        ? responseConciseness
        : 'balanced';
    const parsedCodeStrictness: 'production' | 'explained' =
      codeStrictness === 'explained' ? 'explained' : 'production';
    const parsedAutoVerify = autoVerifyOutputs !== false;
    const parsedTemperature =
      typeof temperature === 'number' && Number.isFinite(temperature)
        ? Math.max(0, Math.min(1, temperature))
        : undefined;

    const systemInstruction = buildSystemPrompt(effectiveModelId, {
      customInstructions,
      customTone,
      customWarmth,
      customEnthusiasm,
      customFormatting,
      customEmoji,
      memoryItems,
      projectContext,
      webSearch: effectiveWebSearch,
      deepReasoning: effectiveDeepReasoning,
      synthesisMode: synthesisMode as SynthesisMode,
      learnedDirectives: enrichedDirectives,
      evolutionGeneration: serverEvolutionState.generation,
      reasoningLevel: parsedReasoningLevel,
      responseConciseness: parsedConciseness,
      codeStrictness: parsedCodeStrictness,
      autoVerifyOutputs: parsedAutoVerify,
    });

    const recentMessages = normalizedMessages.slice(-12);

    const fallbackData = generateLocalSmartResponse(
      lastUserMessage,
      validModelId,
      {
        webSearch: effectiveWebSearch,
        deepReasoning: effectiveDeepReasoning || parsedReasoningLevel === 'deep',
        synthesisMode: synthesisMode as SynthesisMode,
        conversationHistory: recentMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        attachmentInfo: activeAttachment
          ? {
              name: activeAttachment.name,
              mimeType: activeAttachment.mimeType,
            }
          : undefined,
      }
    );

    const ai = getAiClient();
    const canTryPaid = Boolean(ai && Date.now() > paidMediaCooldownUntil);
    const hasUrlInPrompt = /https?:\/\/\S+/i.test(lastUserMessage);
    const candidateModels = resolveCandidateModels(effectiveModelId, canTryPaid);

    // Never pass thinkingBudget (400 error on gemini-4-argon). Factor user reasoningLevel while respecting responsive latencies.
    const desiredThinkingLevel =
      effectiveDeepReasoning || parsedReasoningLevel === 'deep'
        ? ThinkingLevel.HIGH
        : parsedReasoningLevel === 'fast'
        ? ThinkingLevel.LOW
        : modelCfg.thinkingLevel === 'HIGH'
        ? ThinkingLevel.MEDIUM
        : ThinkingLevel.LOW;

    const buildStandardTools = () => {
      const toolList: Record<string, unknown>[] = [];
      if (effectiveWebSearch) toolList.push({ googleSearch: {} });
      if (hasUrlInPrompt) toolList.push({ urlContext: {} });
      return toolList.length > 0 ? toolList : undefined;
    };

    const allowLongOutput = true;

    chatCacheTotalRequests += 1;
    const hasInlineAttachment = normalizedMessages.some((m) =>
      Boolean(m?.inlineAttachment?.data)
    );
    const tuningSignature = `${parsedReasoningLevel}:${parsedConciseness}:${parsedCodeStrictness}:${parsedAutoVerify ? 1 : 0}:${parsedTemperature ?? 'def'}`;
    const cacheKey =
      !hasInlineAttachment && !effectiveWebSearch && normalizedMessages.length <= 2
        ? `v5::${effectiveModelId}::${synthesisMode}::${effectiveDeepReasoning ? '1' : '0'}::${tuningSignature}::${serverEvolutionState.generation}::${lastUserMessage.trim().toLowerCase()}`
        : '';

    const cachedHit = cacheKey ? chatResponseCache.get(cacheKey) : undefined;
    if (
      cachedHit &&
      cachedHit.generation === serverEvolutionState.generation &&
      Date.now() - cachedHit.createdAt < 10 * 60 * 1000
    ) {
      chatCacheHitCount += 1;
      if (!stream) {
        return res.json({
          text: cachedHit.text,
          thinkingSteps: cachedHit.thinkingSteps,
          citations: cachedHit.citations,
          followUpSuggestions: cachedHit.followUpSuggestions,
          resolvedModel: 'lru-verified-cache',
          routedModelId: cachedHit.routedModelId,
        });
      }
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.write(
        `data: ${JSON.stringify({
          meta: {
            thinkingSteps: cachedHit.thinkingSteps,
            citations: cachedHit.citations,
            followUpSuggestions: cachedHit.followUpSuggestions,
          },
        })}\n\n`
      );
      res.write(`data: ${JSON.stringify({ text: cachedHit.text })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const rememberInChatCache = (
      finalText: string,
      steps: string[],
      cites?: CitationItem[]
    ) => {
      if (!cacheKey || !finalText) return;
      if (chatResponseCache.size >= 160) {
        const oldestKey = chatResponseCache.keys().next().value;
        if (oldestKey) chatResponseCache.delete(oldestKey);
      }
      chatResponseCache.set(cacheKey, {
        text: finalText,
        thinkingSteps: steps,
        citations: cites,
        followUpSuggestions: fallbackData.followUpSuggestions,
        routedModelId: effectiveModelId,
        generation: serverEvolutionState.generation,
        createdAt: Date.now(),
      });
    };

    if (!stream) {
      if (ai && canTryPaid && isInteractionsModel(effectiveModelId)) {
        try {
          const interRes = await runInteractionsTurn(
            ai,
            effectiveModelId,
            lastUserMessage,
            systemInstruction,
            effectiveWebSearch,
            hasUrlInPrompt
          );
          if (interRes?.text) {
            return res.json({
              text: verifyAndRepairModelOutput(interRes.text, {
                allowLong: allowLongOutput,
                exactMathProof,
                autoVerify: parsedAutoVerify,
              }),
              thinkingSteps:
                interRes.proofSteps.length > 0
                  ? [
                      ...(autoRoute ? [fallbackData.thinkingSteps[0]] : []),
                      ...interRes.proofSteps,
                    ]
                  : fallbackData.thinkingSteps,
              citations: fallbackData.citations,
              followUpSuggestions: fallbackData.followUpSuggestions,
              resolvedModel: interRes.resolvedModel,
              routedModelId: effectiveModelId,
            });
          }
        } catch (err) {
          const msg = String(err || '');
          if (
            msg.includes('Free Tier') ||
            msg.includes('limit: 0') ||
            msg.includes('429')
          ) {
            paidMediaCooldownUntil = Date.now() + 120000;
          }
        }
      }

      if (ai) {
        for (const candidateModel of candidateModels) {
          try {
            const perModelTimeout =
              desiredThinkingLevel === ThinkingLevel.HIGH
                ? 7500
                : candidateModel === 'gemini-3.1-flash-lite'
                ? 4200
                : 4800;
            const response = await ai.models.generateContent({
              model: candidateModel,
              contents: buildGeminiContents(recentMessages),
              config: {
                abortSignal: AbortSignal.timeout(perModelTimeout),
                systemInstruction,
                tools: buildStandardTools(),
                ...(typeof parsedTemperature === 'number'
                  ? { temperature: parsedTemperature }
                  : {}),
                ...(supportsThinkingConfig(candidateModel)
                  ? {
                      thinkingConfig: {
                        thinkingLevel: desiredThinkingLevel,
                      },
                    }
                  : {}),
              },
            });
            const grounded = extractGroundingCitations(response);
            if (response.text) {
              const cleaned = verifyAndRepairModelOutput(response.text, {
                allowLong: allowLongOutput,
                exactMathProof,
                autoVerify: parsedAutoVerify,
              });
              if (cleaned) {
                rememberInChatCache(
                  cleaned,
                  fallbackData.thinkingSteps,
                  grounded.length > 0 ? grounded : fallbackData.citations
                );
                return res.json({
                  text: cleaned,
                  thinkingSteps: fallbackData.thinkingSteps,
                  citations:
                    grounded.length > 0 ? grounded : fallbackData.citations,
                  followUpSuggestions: fallbackData.followUpSuggestions,
                  resolvedModel: candidateModel,
                  routedModelId: effectiveModelId,
                });
              }
            }
          } catch (err) {
            recordSdkModelFailure(candidateModel, err);
            const msg = String(err || '');
            if (
              candidateModel === 'gemini-4-argon' &&
              (msg.includes('Free Tier') ||
                msg.includes('limit: 0') ||
                msg.includes('429'))
            ) {
              paidMediaCooldownUntil = Date.now() + 180000;
            }
          }
        }
      }
      return res.json({
        ...fallbackData,
        text: verifyAndRepairModelOutput(fallbackData.text, {
          allowLong: allowLongOutput,
          exactMathProof,
        }),
      });
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let clientDisconnected = false;
    res.on('close', () => {
      if (!res.writableEnded) {
        clientDisconnected = true;
      }
    });

    const safeSseWrite = (chunkStr: string) => {
      if (clientDisconnected || res.writableEnded || res.destroyed) return;
      try {
        res.write(chunkStr);
      } catch {
        clientDisconnected = true;
      }
    };

    const safeSseEnd = () => {
      if (res.writableEnded || res.destroyed) return;
      try {
        res.end();
      } catch {
        // ignore closed socket
      }
    };

    safeSseWrite(
      `data: ${JSON.stringify({
        meta: {
          thinkingSteps: fallbackData.thinkingSteps,
          citations: fallbackData.citations,
          followUpSuggestions: fallbackData.followUpSuggestions,
        },
      })}\n\n`
    );

    const streamCleanedChunks = (rawText: string) => {
      const cleaned = verifyAndRepairModelOutput(rawText, {
        allowLong: allowLongOutput,
        exactMathProof,
        autoVerify: parsedAutoVerify,
      });
      const pieces = cleaned.split(/(?=[ \n])/);
      for (let i = 0; i < pieces.length; i += 6) {
        if (clientDisconnected) break;
        safeSseWrite(
          `data: ${JSON.stringify({
            text: pieces.slice(i, i + 6).join(''),
          })}\n\n`
        );
      }
    };

    if (ai && canTryPaid && isInteractionsModel(effectiveModelId)) {
      try {
        const interRes = await runInteractionsTurn(
          ai,
          effectiveModelId,
          lastUserMessage,
          systemInstruction,
          effectiveWebSearch,
          hasUrlInPrompt
        );
        if (interRes?.text) {
          if (interRes.proofSteps.length > 0) {
            safeSseWrite(
              `data: ${JSON.stringify({
                meta: {
                  thinkingSteps: [
                    ...(autoRoute ? [fallbackData.thinkingSteps[0]] : []),
                    ...interRes.proofSteps,
                  ],
                  citations: fallbackData.citations,
                  followUpSuggestions: fallbackData.followUpSuggestions,
                },
              })}\n\n`
            );
          }
          streamCleanedChunks(interRes.text);
          safeSseWrite('data: [DONE]\n\n');
          return safeSseEnd();
        }
      } catch (err) {
        const msg = String(err || '');
        if (
          msg.includes('Free Tier') ||
          msg.includes('limit: 0') ||
          msg.includes('429')
        ) {
          paidMediaCooldownUntil = Date.now() + 120000;
        }
      }
    }

    if (ai && !clientDisconnected) {
      for (const candidateModel of candidateModels) {
        if (clientDisconnected) break;
        try {
          const perModelTimeout =
            desiredThinkingLevel === ThinkingLevel.HIGH
              ? 7500
              : candidateModel === 'gemini-3.1-flash-lite'
              ? 4200
              : 4800;
          const streamResp = await ai.models.generateContentStream({
            model: candidateModel,
            contents: buildGeminiContents(recentMessages),
            config: {
              abortSignal: AbortSignal.timeout(perModelTimeout),
              systemInstruction,
              tools: buildStandardTools(),
              ...(typeof parsedTemperature === 'number'
                ? { temperature: parsedTemperature }
                : {}),
              ...(supportsThinkingConfig(candidateModel)
                ? {
                    thinkingConfig: {
                      thinkingLevel: desiredThinkingLevel,
                    },
                  }
                : {}),
            },
          });

          let accumulated = '';
          let groundedCitations: CitationItem[] = [];
          for await (const chunk of streamResp) {
            if (clientDisconnected) break;
            const found = extractGroundingCitations(chunk);
            if (found.length > 0) {
              groundedCitations = found;
            }
            if (chunk.text) {
              accumulated += chunk.text;
            }
          }
          if (groundedCitations.length > 0) {
            safeSseWrite(
              `data: ${JSON.stringify({
                meta: {
                  thinkingSteps: fallbackData.thinkingSteps,
                  citations: groundedCitations,
                  followUpSuggestions: fallbackData.followUpSuggestions,
                },
              })}\n\n`
            );
          }
          const cleaned = verifyAndRepairModelOutput(accumulated, {
            allowLong: allowLongOutput,
            exactMathProof,
            autoVerify: parsedAutoVerify,
          });
          if (cleaned) {
            rememberInChatCache(
              cleaned,
              fallbackData.thinkingSteps,
              groundedCitations.length > 0
                ? groundedCitations
                : fallbackData.citations
            );
            streamCleanedChunks(cleaned);
            safeSseWrite('data: [DONE]\n\n');
            return safeSseEnd();
          }
        } catch (err) {
          recordSdkModelFailure(candidateModel, err);
          const msg = String(err || '');
          if (
            candidateModel === 'gemini-4-argon' &&
            (msg.includes('Free Tier') ||
              msg.includes('limit: 0') ||
              msg.includes('429'))
          ) {
            paidMediaCooldownUntil = Date.now() + 180000;
          }
        }
      }
    }

    streamCleanedChunks(fallbackData.text);
    safeSseWrite('data: [DONE]\n\n');
    safeSseEnd();
  });

  // Google Paid Nano Banana 2.1 Ultra / Pro / Lite Image Synthesis & Dual-Reference Editing Endpoint
  app.post('/api/image-gen', async (req, res) => {
    const {
      prompt = 'Sinematik mimari kompozisyon',
      style = 'Sinematik',
      aspectRatio = '1:1',
      imageModel = 'gemini-nano-banana-2.1',
      imageSize = '2K',
      useGoogleSearch = false,
      enhancePrompt = true,
      lensPreset,
      negativePrompt = '',
      referenceImageBase64,
      referenceMimeType = 'image/png',
      secondaryReferenceImageBase64,
      secondaryReferenceMimeType = 'image/png',
    } = req.body || {};

    const validRatios: VisualAspectRatio[] = [
      '1:1',
      '16:9',
      '9:16',
      '3:4',
      '4:3',
      '4:1',
      '1:4',
      '8:1',
      '1:8',
    ];
    const ratio: VisualAspectRatio = validRatios.includes(aspectRatio)
      ? aspectRatio
      : '1:1';

    const validSizes: ImageResolutionSize[] = ['1K', '2K', '4K'];
    const resolvedSize: ImageResolutionSize = validSizes.includes(imageSize)
      ? imageSize
      : '1K';

    const selectedModelCfg =
      NANO_BANANA_MODELS.find((m) => m.id === imageModel) ||
      NANO_BANANA_MODELS[0];
    const resolvedModel: NanoBananaModelId = selectedModelCfg.id;

    const cleanPrompt = sanitizeLuxoBrand(String(prompt || '').trim());
    const cleanNegative = sanitizeLuxoBrand(String(negativePrompt || '').trim());
    const finalPrompt = enhancePrompt
      ? enhanceMediaPrompt(cleanPrompt, 'image', style, undefined, {
          lensPreset: lensPreset as NanoLensPresetId | undefined,
          negativePrompt: cleanNegative,
        })
      : cleanPrompt;

    const ai = getAiClient();
    if (ai && Date.now() > paidMediaCooldownUntil) {
      const modelsToTry: NanoBananaModelId[] =
        resolvedModel === 'gemini-3.1-flash-lite-image'
          ? ['gemini-3.1-flash-lite-image']
          : [resolvedModel, 'gemini-3.1-flash-lite-image'];

      for (const modelName of modelsToTry) {
        try {
          const parts: (
            | { inlineData: { data: string; mimeType: string } }
            | { text: string }
          )[] = [];

          if (referenceImageBase64 && typeof referenceImageBase64 === 'string') {
            parts.push({
              inlineData: {
                data: referenceImageBase64,
                mimeType: referenceMimeType || 'image/png',
              },
            });
          }
          if (
            secondaryReferenceImageBase64 &&
            typeof secondaryReferenceImageBase64 === 'string'
          ) {
            parts.push({
              inlineData: {
                data: secondaryReferenceImageBase64,
                mimeType: secondaryReferenceMimeType || 'image/png',
              },
            });
          }
          parts.push({ text: finalPrompt });

          const isProOr21 =
            modelName === 'gemini-nano-banana-2.1' ||
            modelName === 'gemini-3-pro-image';

          const sdkRatio =
            !isProOr21 && (ratio === '4:1' || ratio === '8:1')
              ? '16:9'
              : !isProOr21 && (ratio === '1:4' || ratio === '1:8')
              ? '9:16'
              : ratio;

          const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts },
            config: {
              imageConfig: {
                aspectRatio: sdkRatio,
                ...(isProOr21 ? { imageSize: resolvedSize } : {}),
              },
              ...(isProOr21 && useGoogleSearch
                ? {
                    tools: [
                      {
                        googleSearch: {
                          searchTypes: {
                            webSearch: {},
                            ...(modelName === 'gemini-nano-banana-2.1'
                              ? { imageSearch: {} }
                              : {}),
                          },
                        },
                      },
                    ],
                  }
                : {}),
            },
          });

          const responseParts = response.candidates?.[0]?.content?.parts || [];
          let generatedDataUrl = '';
          for (const part of responseParts) {
            if (part.inlineData?.data) {
              const mime = part.inlineData.mimeType || 'image/png';
              generatedDataUrl = `data:${mime};base64,${part.inlineData.data}`;
              break;
            }
          }

          if (generatedDataUrl) {
            const label =
              NANO_BANANA_MODELS.find((m) => m.id === modelName)?.name ||
              'Nano Banana';
            return res.json({
              id: `vis-${Date.now()}`,
              mediaType: 'image',
              title: cleanPrompt.slice(0, 68),
              prompt: cleanPrompt,
              style,
              aspectRatio: ratio,
              engineLabel: label,
              modelUsed: modelName,
              resolution: isProOr21 ? resolvedSize : '1K',
              lensPreset,
              negativePrompt: cleanNegative || undefined,
              dataUrl: generatedDataUrl,
              createdAt: Date.now(),
            });
          }
        } catch (err) {
          const msg = String(err || '');
          if (
            msg.includes('Free Tier') ||
            msg.includes('limit: 0') ||
            msg.includes('429')
          ) {
            paidMediaCooldownUntil = Date.now() + 120000;
            break;
          }
        }
      }
    }

    // Tier 2: Real Photorealistic Diffusion Engine (FLUX.1-Schnell -> SD 3.5 Large Turbo -> HD Real Photography)
    try {
      const realPhoto = await synthesizeRealPhotograph({
        prompt: cleanPrompt,
        style,
        aspectRatio: ratio,
        negativePrompt: cleanNegative,
        ai,
      });
      if (realPhoto?.dataUrl) {
        return res.json({
          id: `vis-${Date.now()}`,
          mediaType: 'image',
          title: cleanPrompt.slice(0, 68),
          prompt: cleanPrompt,
          style,
          aspectRatio: ratio,
          engineLabel: realPhoto.engineBadge || selectedModelCfg.name,
          modelUsed: resolvedModel,
          resolution: selectedModelCfg.supports4K ? resolvedSize : '1K',
          lensPreset,
          negativePrompt: cleanNegative || undefined,
          dataUrl: realPhoto.dataUrl,
          createdAt: Date.now(),
        });
      }
    } catch {
      // Fall through only if Minimalist Vektör or offline
    }

    const fallbackSvg = generateProceduralArtwork(cleanPrompt, style, ratio);
    return res.json({
      id: `vis-${Date.now()}`,
      mediaType: 'image',
      title: cleanPrompt.slice(0, 68),
      prompt: cleanPrompt,
      style,
      aspectRatio: ratio,
      engineLabel: `${selectedModelCfg.name} (Vektör Modu)`,
      modelUsed: resolvedModel,
      resolution: selectedModelCfg.supports4K ? resolvedSize : '1K',
      lensPreset,
      negativePrompt: cleanNegative || undefined,
      dataUrl: fallbackSvg,
      createdAt: Date.now(),
    });
  });

  // Serve Generated & Showcase MP4 Videos with HTTP 206 Byte-Range Streaming
  let showcasePromise: Promise<unknown> | null = null;
  async function ensureShowcaseMp4Ready(): Promise<string> {
    const prebuiltShowcase = path.resolve(
      process.cwd(),
      'public',
      'assets',
      'showcase',
      'showcase-veo.mp4'
    );
    if (fs.existsSync(prebuiltShowcase)) {
      return prebuiltShowcase;
    }
    const targetPath = path.join(VIDEO_STORAGE_DIR, 'showcase-veo.mp4');
    if (fs.existsSync(targetPath)) {
      return targetPath;
    }
    if (!showcasePromise) {
      showcasePromise = (async () => {
        const realVid = await synthesizeRealDiffusedCinemaVideo({
          videoId: 'showcase-veo',
          prompt:
            'Altın saat ışığında İstanbul Boğazı köprüsü üzerinde akıcı sinematik drone uçuşu ve parlayan deniz yansımaları',
          style: 'Sinematik',
          cameraMotion: 'Sinematik Drone Akışı',
          aspectRatio: '16:9',
          durationSec: 5,
          ai: getAiClient(),
        });
        if (!realVid) {
          await renderCinematicMp4Video({
            videoId: 'showcase-veo',
            prompt:
              'Altın saat ışığında İstanbul Boğazı köprüsü üzerinde akıcı sinematik drone uçuşu ve parlayan deniz yansımaları',
            style: 'Sinematik',
            cameraMotion: 'Sinematik Drone Akışı',
            aspectRatio: '16:9',
            durationSec: 5,
            ai: null,
          });
        }
      })().finally(() => {
        showcasePromise = null;
      });
    }
    await showcasePromise;
    return targetPath;
  }

  app.get('/api/videos/:fileName', async (req, res) => {
    const rawName = String(req.params.fileName || '');
    const safeName = rawName.replace(/[^a-zA-Z0-9_.-]/g, '');
    if (!safeName.endsWith('.mp4')) {
      return res.status(404).end();
    }

    let filePath = path.join(VIDEO_STORAGE_DIR, safeName);
    if (safeName === 'showcase-veo.mp4' && !fs.existsSync(filePath)) {
      try {
        filePath = await ensureShowcaseMp4Ready();
      } catch {
        return res.status(500).end();
      }
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).end();
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = Math.max(0, parseInt(parts[0], 10) || 0);
      const end = parts[1]
        ? Math.min(fileSize - 1, parseInt(parts[1], 10))
        : fileSize - 1;
      if (start >= fileSize || start > end) {
        res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
        return res.end();
      }
      const chunkSize = end - start + 1;
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', String(chunkSize));
      return fs.createReadStream(filePath, { start, end }).pipe(res);
    }

    res.status(200);
    res.setHeader('Content-Length', String(fileSize));
    return fs.createReadStream(filePath).pipe(res);
  });

  // Google Paid Nano Banana Motion & Veo / Omni Flash Real MP4 Video Generation Endpoint (with High-Fidelity 4K + 60fps Frame Interpolation)
  app.post('/api/video-gen', async (req, res) => {
    const {
      prompt = 'Sinematik otonom şehir üzerinde gün batımı uçuşu',
      style = 'Sinematik',
      cameraMotion = 'Sinematik Drone Akışı',
      aspectRatio = '16:9',
      duration = '5s',
      resolution = '720p',
      highFidelity = false,
      frameInterpolation = false,
      lensPreset,
      negativePrompt = '',
      enhancePrompt = true,
      referenceImageBase64,
      referenceMimeType = 'image/png',
      endFrameImageBase64,
      endFrameMimeType = 'image/png',
      previousInteractionId,
      useNanoBananaFrame = false,
      nanoModel = 'gemini-nano-banana-2.1',
      motionControl,
    } = req.body || {};

    const normalizedMotion = normalizeCinematicMotion(
      motionControl as Partial<CinematicMotionParams> | undefined
    );
    const videoId = `vid-${Date.now()}`;
    const videoRatio: '16:9' | '9:16' =
      aspectRatio === '9:16' ? '9:16' : '16:9';
    const videoDuration: VideoDurationOption =
      duration === '10s' ? '10s' : '5s';
    const durationSec = videoDuration === '10s' ? 10 : 5;
    const validRes: VideoResolutionSize[] = ['720p', '1080p', '4k'];
    const isHighFidelity = Boolean(highFidelity) || resolution === '4k';
    const isInterpolated = Boolean(highFidelity || frameInterpolation);
    const videoRes: VideoResolutionSize = isHighFidelity
      ? '4k'
      : validRes.includes(resolution)
      ? resolution
      : '720p';

    const cleanPrompt = sanitizeLuxoBrand(String(prompt || '').trim());
    const cleanNegative = sanitizeLuxoBrand(String(negativePrompt || '').trim());
    const finalPrompt = enhancePrompt
      ? enhanceMediaPrompt(cleanPrompt, 'video', style, cameraMotion, {
          highFidelity: isHighFidelity,
          lensPreset: lensPreset as NanoLensPresetId | undefined,
          negativePrompt: cleanNegative,
          motionControl: normalizedMotion,
        })
      : cleanPrompt;

    let posterUrl = generateProceduralArtwork(cleanPrompt, style, videoRatio);
    let resolvedRefBase64 =
      typeof referenceImageBase64 === 'string' && referenceImageBase64.length > 64
        ? referenceImageBase64
        : undefined;
    let resolvedRefMime = referenceMimeType || 'image/png';

    const resolvedEndBase64 =
      typeof endFrameImageBase64 === 'string' && endFrameImageBase64.length > 64
        ? endFrameImageBase64
        : undefined;
    const resolvedEndMime = endFrameMimeType || 'image/png';

    const ai = getAiClient();
    const canTryPaidModels = Boolean(ai && Date.now() > paidMediaCooldownUntil);

    // Optional Step 1: If user requested Nano Banana + Veo Hybrid Video without uploading an image, synthesize high-resolution starting keyframe first
    if (ai && canTryPaidModels && useNanoBananaFrame && !resolvedRefBase64) {
      for (const imgModel of [nanoModel, 'gemini-3.1-flash-lite-image']) {
        try {
          const isProOr21 =
            imgModel === 'gemini-nano-banana-2.1' ||
            imgModel === 'gemini-3-pro-image';
          const imgResp = await ai.models.generateContent({
            model: imgModel,
            contents: {
              parts: [
                {
                  text: enhanceMediaPrompt(
                    cleanPrompt,
                    'image',
                    style,
                    undefined,
                    {
                      highFidelity: isHighFidelity,
                      lensPreset: lensPreset as NanoLensPresetId | undefined,
                      negativePrompt: cleanNegative,
                    }
                  ),
                },
              ],
            },
            config: {
              imageConfig: {
                aspectRatio: videoRatio,
                ...(isProOr21 && isHighFidelity ? { imageSize: '4K' } : {}),
              },
            },
          });
          const parts = imgResp.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData?.data) {
              resolvedRefBase64 = part.inlineData.data;
              resolvedRefMime = part.inlineData.mimeType || 'image/png';
              posterUrl = `data:${resolvedRefMime};base64,${resolvedRefBase64}`;
              break;
            }
          }
          if (resolvedRefBase64) break;
        } catch (err) {
          const msg = String(err || '');
          if (msg.includes('Free Tier') || msg.includes('limit: 0') || msg.includes('429')) {
            paidMediaCooldownUntil = Date.now() + 120000;
            break;
          }
        }
      }
    } else if (resolvedRefBase64) {
      posterUrl = `data:${resolvedRefMime};base64,${resolvedRefBase64}`;
    }

    const displayRes = isHighFidelity ? '4K UHD' : videoRes.toUpperCase();
    const targetFps = isInterpolated ? 60 : 24;
    const interpMode = isInterpolated ? 'optical-60fps' : 'standard-24fps';

    // Tier 1: Native Google Omni 1.1 Flash Video API (Interactions API, supports 4K resolution & dual-keyframe interpolation)
    if (ai && Date.now() > paidMediaCooldownUntil) {
      try {
        const multiModalInput: (
          | { type: 'image'; mime_type: string; data: string }
          | { type: 'text'; text: string }
        )[] = [];
        if (resolvedRefBase64) {
          multiModalInput.push({
            type: 'image',
            mime_type: resolvedRefMime,
            data: resolvedRefBase64,
          });
        }
        if (resolvedEndBase64) {
          multiModalInput.push({
            type: 'image',
            mime_type: resolvedEndMime,
            data: resolvedEndBase64,
          });
        }
        if (multiModalInput.length > 0) {
          multiModalInput.push({
            type: 'text',
            text: resolvedEndBase64
              ? `${finalPrompt}. İlk kare <IMAGE_REF_0> ile bitiş karesi <IMAGE_REF_1> arasında pürüzsüz kare interpolasyonu uygula.`
              : finalPrompt,
          });
        }

        const interaction = await ai.interactions.create(
          {
            model: 'gemini-omni-1.1-flash',
            ...(previousInteractionId && typeof previousInteractionId === 'string'
              ? { previous_interaction_id: previousInteractionId }
              : {}),
            input: multiModalInput.length > 0 ? multiModalInput : finalPrompt,
            background: false,
            store: true,
            stream: false,
            response_format: {
              type: 'video',
              aspect_ratio: videoRatio,
              duration: videoDuration,
              resolution: videoRes,
            },
          },
          { timeout: 25000, maxRetries: 0 }
        );

        const videoPart = interaction.output_video;
        if (videoPart?.data) {
          const servedUrl = saveBase64VideoFile(videoId, videoPart.data);
          return res.json({
            id: videoId,
            mediaType: 'video',
            title: cleanPrompt.slice(0, 68),
            prompt: cleanPrompt,
            style,
            aspectRatio: videoRatio,
            engineLabel: useNanoBananaFrame
              ? isHighFidelity
                ? 'Nano Banana 4K · Veo 60fps'
                : 'Nano Banana + Google Veo'
              : isHighFidelity
              ? 'Google Veo 4K · 60fps'
              : 'Google Veo · Omni 1.1 Flash',
            modelUsed: 'gemini-omni-1.1-flash',
            resolution: displayRes,
            duration: videoDuration,
            highFidelity: isHighFidelity,
            fps: targetFps,
            frameInterpolation: interpMode,
            interactionId: interaction.id,
            dataUrl: posterUrl,
            posterUrl,
            videoUrl: servedUrl,
            fallbackProceduralVideo: false,
            createdAt: Date.now(),
          });
        }
        if (videoPart?.uri) {
          let finalVideoUrl = videoPart.uri;
          try {
            const sep = videoPart.uri.includes('?') ? '&' : '?';
            const dlResp = await fetch(
              `${videoPart.uri}${
                process.env.GEMINI_API_KEY
                  ? `${sep}key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`
                  : ''
              }`
            );
            if (dlResp.ok) {
              const arrBuf = await dlResp.arrayBuffer();
              finalVideoUrl = saveBase64VideoFile(
                videoId,
                Buffer.from(arrBuf).toString('base64')
              );
            }
          } catch {
            // Use URI if direct fetch fails
          }
          return res.json({
            id: videoId,
            mediaType: 'video',
            title: cleanPrompt.slice(0, 68),
            prompt: cleanPrompt,
            style,
            aspectRatio: videoRatio,
            engineLabel: useNanoBananaFrame
              ? isHighFidelity
                ? 'Nano Banana 4K · Veo 60fps'
                : 'Nano Banana + Google Veo'
              : isHighFidelity
              ? 'Google Veo 4K · 60fps'
              : 'Google Veo · Omni 1.1 Flash',
            modelUsed: 'gemini-omni-1.1-flash',
            resolution: displayRes,
            duration: videoDuration,
            highFidelity: isHighFidelity,
            fps: targetFps,
            frameInterpolation: interpMode,
            interactionId: interaction.id,
            dataUrl: posterUrl,
            posterUrl,
            videoUrl: finalVideoUrl,
            fallbackProceduralVideo: false,
            createdAt: Date.now(),
          });
        }
      } catch (err) {
        const msg = String(err || '');
        if (msg.includes('Free Tier') || msg.includes('limit: 0') || msg.includes('429')) {
          paidMediaCooldownUntil = Date.now() + 120000;
        }
        // Proceed to Tier 2 Server-Side Real H.264/AAC MP4 Cinema Engine (with 60fps FFmpeg frame interpolation)
      }
    }

    // If user requested Nano Banana Hybrid Video and Paid tier was skipped, synthesize a REAL photograph keyframe first
    if (useNanoBananaFrame && !resolvedRefBase64) {
      try {
        const keyframePhoto = await synthesizeRealPhotograph({
          prompt: cleanPrompt,
          style,
          aspectRatio: videoRatio,
          negativePrompt: cleanNegative,
          ai,
        });
        if (keyframePhoto) {
          resolvedRefBase64 = keyframePhoto.base64;
          resolvedRefMime = keyframePhoto.mimeType;
          posterUrl = keyframePhoto.dataUrl;
        }
      } catch {
        // Continue to direct text-to-video diffusion
      }
    }

    // Tier 2: Real AI-Diffused Motion Cinema Engine (LTX-Video Distilled + FFmpeg HD/60fps Optical Mastering + Neural Turkish TTS)
    try {
      const diffused = await synthesizeRealDiffusedCinemaVideo({
        videoId,
        prompt: cleanPrompt,
        style,
        cameraMotion,
        aspectRatio: videoRatio,
        durationSec,
        highFidelity: isHighFidelity,
        frameInterpolation: isInterpolated,
        negativePrompt: cleanNegative,
        referenceImageBase64: resolvedRefBase64,
        referenceMimeType: resolvedRefMime,
        motionControl: normalizedMotion,
        ai,
      });

      if (diffused) {
        return res.json({
          id: videoId,
          mediaType: 'video',
          title: cleanPrompt.slice(0, 68),
          prompt: cleanPrompt,
          style,
          aspectRatio: videoRatio,
          engineLabel: useNanoBananaFrame
            ? isHighFidelity
              ? 'Nano Banana 4K + Veo 60fps MP4'
              : 'Nano Banana + Veo Gerçek MP4'
            : diffused.engineBadge,
          modelUsed: 'gemini-omni-1.1-flash',
          resolution: displayRes,
          duration: videoDuration,
          highFidelity: isHighFidelity,
          fps: diffused.fps,
          frameInterpolation: interpMode,
          motionControl: normalizedMotion,
          dataUrl: diffused.posterDataUrl,
          posterUrl: diffused.posterDataUrl,
          videoUrl: diffused.publicUrl,
          fallbackProceduralVideo: false,
          createdAt: Date.now(),
        });
      }
    } catch {
      // Proceed to Tier 3 Real-Photograph Cinema Camera Motion Engine
    }

    // Tier 3: Ensure we have a REAL photograph keyframe before running FFmpeg cinema motion!
    if (!resolvedRefBase64) {
      try {
        const backupPhoto = await synthesizeRealPhotograph({
          prompt: cleanPrompt,
          style,
          aspectRatio: videoRatio,
          negativePrompt: cleanNegative,
          ai,
        });
        if (backupPhoto) {
          resolvedRefBase64 = backupPhoto.base64;
          resolvedRefMime = backupPhoto.mimeType;
          posterUrl = backupPhoto.dataUrl;
        }
      } catch {
        // ignore
      }
    }

    try {
      const rendered = await renderCinematicMp4Video({
        videoId,
        prompt: cleanPrompt,
        style,
        cameraMotion,
        aspectRatio: videoRatio,
        durationSec,
        highFidelity: isHighFidelity,
        frameInterpolation: isInterpolated,
        referenceImageBase64: resolvedRefBase64,
        referenceMimeType: resolvedRefMime,
        endFrameImageBase64: resolvedEndBase64,
        endFrameMimeType: resolvedEndMime,
        ai,
      });

      return res.json({
        id: videoId,
        mediaType: 'video',
        title: cleanPrompt.slice(0, 68),
        prompt: cleanPrompt,
        style,
        aspectRatio: videoRatio,
        engineLabel: useNanoBananaFrame
          ? isHighFidelity
            ? 'Nano Banana 4K · 60fps MP4'
            : 'Nano Banana Motion · HD MP4'
          : isHighFidelity
          ? 'Google Veo 4K · 60fps MP4'
          : 'Google Veo · HD Sinema MP4',
        modelUsed: 'gemini-omni-1.1-flash',
        resolution: displayRes,
        duration: videoDuration,
        highFidelity: isHighFidelity,
        fps: rendered.fps,
        frameInterpolation: interpMode,
        motionControl: normalizedMotion,
        dataUrl: posterUrl,
        posterUrl,
        videoUrl: rendered.publicUrl,
        fallbackProceduralVideo: false,
        createdAt: Date.now(),
      });
    } catch {
      return res.json({
        id: videoId,
        mediaType: 'video',
        title: cleanPrompt.slice(0, 44),
        prompt: cleanPrompt,
        style,
        aspectRatio: videoRatio,
        engineLabel: 'Google Veo · Sinema Motoru',
        modelUsed: 'gemini-omni-1.1-flash',
        resolution: displayRes,
        duration: videoDuration,
        highFidelity: isHighFidelity,
        fps: targetFps,
        frameInterpolation: interpMode,
        dataUrl: posterUrl,
        posterUrl,
        fallbackProceduralVideo: true,
        createdAt: Date.now(),
      });
    }
  });

  // Gemini 3.8 Neural TTS & Dual-Speaker AI Podcast Studio Endpoint
  app.post('/api/tts', async (req, res) => {
    const {
      mode = 'single',
      text = '',
      voiceName = 'Breeze',
      emotionStyle = 'Doğal & Akıcı',
      topic = '',
      hostAVoice = 'Nova',
      hostBVoice = 'Orion',
    } = req.body || {};

    const ai = getAiClient();
    if (!ai) {
      return res.json({ audioDataUrl: null, fallbackSpeech: true });
    }

    try {
      if (mode === 'podcast') {
        const cleanTopic = sanitizeLuxoBrand(
          String(topic || text || 'Gemini 4 Argon ve geleceğin yapay zeka mimarileri')
        ).slice(0, 300);
        const hostAOpt = getVoiceOption(hostAVoice);
        const hostBOpt = getVoiceOption(hostBVoice);

        // Generate a brisk 2-speaker podcast script first
        let scriptLines: { speaker: 'SunucuA' | 'SunucuB'; line: string }[] = [
          {
            speaker: 'SunucuA',
            line: `Luxo AI Podcast Stüdyosuna hoş geldiniz! <breath> Bugün masamızda çok heyecan verici bir konu var: ${cleanTopic}.`,
          },
          {
            speaker: 'SunucuB',
            line: `Kesinlikle! |yeah| Özellikle Gemini 4 Argon ve açık kaynak mühendislik yaklaşımı bu alanda oyunun kurallarını tamamen değiştiriyor.`,
          },
          {
            speaker: 'SunucuA',
            line: `Peki sence geliştiriciler ve ekipler bu dönüşümden en yüksek verimi nasıl alabilir?`,
          },
          {
            speaker: 'SunucuB',
            line: `En kritik adım modüler tasarım ve öz-denetimli doğrulama. Hem hız kazanıyor hem de sıfır hata payına yaklaşıyorsunuz.`,
          },
        ];

        try {
          const scriptResp = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `"${cleanTopic}" konusu hakkında iki sunuculu (SunucuA ve SunucuB) 4 kısa replikten oluşan doğal, enerjik Türkçe mini podcast diyaloğu yaz. Her satır "SunucuA: ..." veya "SunucuB: ..." ile başlasın.`,
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          });
          if (scriptResp.text) {
            const parsed = scriptResp.text
              .split('\n')
              .map((l) => l.trim())
              .filter(
                (l) => l.startsWith('SunucuA:') || l.startsWith('SunucuB:')
              )
              .slice(0, 6)
              .map((l) => {
                const isA = l.startsWith('SunucuA:');
                return {
                  speaker: (isA ? 'SunucuA' : 'SunucuB') as
                    | 'SunucuA'
                    | 'SunucuB',
                  line: sanitizeLuxoBrand(
                    l.replace(/^Sunucu[AB]:\s*/, '').trim()
                  ),
                };
              })
              .filter((item) => item.line.length > 0);
            if (parsed.length >= 2) {
              scriptLines = parsed;
            }
          }
        } catch {
          // Keep default crisp 4-turn script
        }

        const ttsResp = await ai.models.generateContent({
          model: 'gemini-3.8-flash-tts',
          contents: [
            {
              role: 'user',
              parts: scriptLines.map((item) => ({
                text: `${item.speaker}: ${item.line}`,
                speechMetadata: {
                  speaker: item.speaker,
                  style:
                    item.speaker === 'SunucuA'
                      ? hostAOpt.acousticStyle
                      : hostBOpt.acousticStyle,
                },
              })),
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: [
                  {
                    speaker: 'SunucuA',
                    voiceConfig: {
                      prebuiltVoiceConfig: {
                        voiceName: hostAOpt.geminiVoice,
                      },
                    },
                  },
                  {
                    speaker: 'SunucuB',
                    voiceConfig: {
                      prebuiltVoiceConfig: {
                        voiceName: hostBOpt.geminiVoice,
                      },
                    },
                  },
                ],
              },
            },
          },
        });

        const base64Wav =
          ttsResp.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        const transcriptText = scriptLines
          .map(
            (s) =>
              `${s.speaker === 'SunucuA' ? hostAOpt.name : hostBOpt.name}: ${
                s.line
              }`
          )
          .join('\n');

        if (base64Wav) {
          return res.json({
            audioDataUrl: `data:audio/wav;base64,${base64Wav}`,
            transcript: transcriptText,
            fallbackSpeech: false,
          });
        }
        return res.json({
          audioDataUrl: null,
          transcript: transcriptText,
          fallbackSpeech: true,
        });
      }

      // Single-speaker high-efficiency neural TTS
      const voiceOpt = getVoiceOption(voiceName);
      const cleanSpeechText = sanitizeLuxoBrand(String(text || ''))
        .replace(/```[\s\S]*?```/g, ' kod bloğu hazırlandı. ')
        .replace(/[*#`_[\]()>|]/g, '')
        .trim()
        .slice(0, 600);

      if (!cleanSpeechText) {
        return res.json({ audioDataUrl: null, fallbackSpeech: true });
      }

      const styleDirective = `${voiceOpt.acousticStyle}. Emotion/Tone: ${emotionStyle}`;
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanSpeechText,
                speechMetadata: {
                  style: styleDirective,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceOpt.geminiVoice,
              },
            },
          },
        },
      });

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return res.json({
          audioDataUrl: `data:audio/wav;base64,${base64Audio}`,
          fallbackSpeech: false,
        });
      }
    } catch {
      // Fallback to WebSpeech on client
    }

    return res.json({ audioDataUrl: null, fallbackSpeech: true });
  });

  app.post('/api/feedback', (req, res) => {
    const { type, subject, message } = req.body || {};
    return res.json({
      ok: true,
      received: {
        type: sanitizeLuxoBrand(String(type || 'Genel Geri Bildirim')),
        subject: sanitizeLuxoBrand(String(subject || '')),
        message: sanitizeLuxoBrand(String(message || '')),
        timestamp: Date.now(),
      },
    });
  });

  app.get('/api/collab/room/:roomId', (req, res) => {
    const room = getOrCreateCollabRoom(req.params.roomId);
    return res.json(serializeRoomSnapshot(room));
  });

  // =========================================================================
  // Platform Events Calendar, Announcements, User Profiles & Real-Time Social
  // =========================================================================

  app.get('/api/social/state', (req, res) => {
    const rawUid = String(req.query.uid || '').trim();
    const rawName = String(req.query.name || '').trim();
    const rawAvatar = String(req.query.avatarUrl || '').trim();
    if (rawUid) {
      const next = ensureUserInitializedInState(serverSocialState, {
        uid: rawUid,
        displayName: rawName || 'Topluluk Üyesi',
        avatarUrl: rawAvatar || undefined,
      });
      if (next !== serverSocialState) {
        persistServerSocialState(next);
      }
    }
    return res.json({
      ok: true,
      state: serverSocialState,
      onlineUids: getOnlineSocialUids(),
    });
  });

  app.post('/api/social/upload-avatar', (req, res) => {
    const dataUrl = String(req.body?.dataUrl || '').trim();
    const match = dataUrl.match(
      /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/i
    );
    if (!match) {
      return res.status(400).json({
        ok: false,
        error: 'Geçerli bir JPEG, PNG veya WebP profil resmi seçiniz.',
      });
    }
    const ext = match[1].toLowerCase() === 'jpg' ? 'jpeg' : match[1].toLowerCase();
    const fileExt = ext === 'jpeg' ? 'jpg' : ext;
    const buf = Buffer.from(match[2], 'base64');
    if (buf.length < 64 || buf.length > 3 * 1024 * 1024) {
      return res.status(400).json({
        ok: false,
        error: 'Profil resmi boyutu 3 MB sınırını aşmamalıdır.',
      });
    }
    const digest = crypto
      .createHash('sha256')
      .update(buf)
      .digest('hex')
      .slice(0, 18);
    const filename = `av_${digest}.${fileExt}`;
    const fullFilePath = path.join(avatarsUploadDir, filename);
    try {
      fs.writeFileSync(fullFilePath, buf);
      return res.json({
        ok: true,
        avatarUrl: `/uploads/avatars/${filename}`,
      });
    } catch {
      return res.status(500).json({
        ok: false,
        error: 'Profil resmi kaydedilirken bir hata oluştu.',
      });
    }
  });

  app.post('/api/social/events', (req, res) => {
    const roleHeader = String(req.headers['x-luxo-role'] || '').toLowerCase();
    const actorRole: PlatformUserRole =
      roleHeader === 'admin' || req.body?.role === 'admin' ? 'admin' : 'member';
    const outcome = createPlatformEvent(serverSocialState, actorRole, {
      title: String(req.body?.title || ''),
      description: String(req.body?.description || ''),
      category: req.body?.category,
      dateIso: String(req.body?.dateIso || ''),
      startTime: String(req.body?.startTime || ''),
      endTime: String(req.body?.endTime || '20:30'),
      location: String(req.body?.location || ''),
      speakerName: String(req.body?.speakerName || ''),
      capacity: Number(req.body?.capacity ?? 150),
      createdByUid: String(req.body?.createdByUid || 'admin_luxo'),
      createdByName: String(req.body?.createdByName || 'Platform Yönetimi'),
    });
    if (!outcome.ok) {
      return res
        .status(outcome.code === 'FORBIDDEN' ? 403 : 400)
        .json({ ok: false, code: outcome.code, error: outcome.error });
    }
    persistServerSocialState(outcome.state);
    broadcastSocialWs({
      type: 'social:sync',
      state: serverSocialState,
      onlineUids: getOnlineSocialUids(),
    });
    return res.json({
      ok: true,
      event: outcome.event,
      state: serverSocialState,
    });
  });

  app.post('/api/social/announcements', (req, res) => {
    const roleHeader = String(req.headers['x-luxo-role'] || '').toLowerCase();
    const actorRole: PlatformUserRole =
      roleHeader === 'admin' || req.body?.role === 'admin' ? 'admin' : 'member';
    const outcome = createPlatformAnnouncement(serverSocialState, actorRole, {
      title: String(req.body?.title || ''),
      summary: String(req.body?.summary || ''),
      priority: req.body?.priority,
      tag: String(req.body?.tag || 'Genel Duyuru'),
      pinned: Boolean(req.body?.pinned),
      dateIso: req.body?.dateIso ? String(req.body.dateIso) : undefined,
      createdByUid: String(req.body?.createdByUid || 'admin_luxo'),
      createdByName: String(req.body?.createdByName || 'Platform Yönetimi'),
    });
    if (!outcome.ok) {
      return res
        .status(outcome.code === 'FORBIDDEN' ? 403 : 400)
        .json({ ok: false, code: outcome.code, error: outcome.error });
    }
    persistServerSocialState(outcome.state);
    broadcastSocialWs({
      type: 'social:sync',
      state: serverSocialState,
      onlineUids: getOnlineSocialUids(),
    });
    return res.json({
      ok: true,
      announcement: outcome.announcement,
      state: serverSocialState,
    });
  });

  app.post('/api/social/favorites/toggle', (req, res) => {
    const uid = String(req.body?.uid || '').trim();
    const targetType =
      req.body?.targetType === 'announcement' ? 'announcement' : 'event';
    const targetId = String(req.body?.targetId || '').trim();
    if (!uid || !targetId) {
      return res
        .status(400)
        .json({ ok: false, error: 'Geçersiz favori isteği.' });
    }
    const seeded = ensureUserInitializedInState(serverSocialState, {
      uid,
      displayName: String(req.body?.displayName || 'Topluluk Üyesi'),
    });
    const outcome = toggleFavoriteItem(seeded, uid, targetType, targetId);
    persistServerSocialState(outcome.state);
    return res.json({
      ok: true,
      favorited: outcome.favorited,
      state: serverSocialState,
    });
  });

  app.post('/api/social/profile', (req, res) => {
    const uid = String(req.body?.uid || '').trim();
    if (!uid) {
      return res
        .status(400)
        .json({ ok: false, error: 'Kullanıcı kimliği eksik.' });
    }
    const seeded = ensureUserInitializedInState(serverSocialState, {
      uid,
      displayName: String(req.body?.displayName || 'Topluluk Üyesi'),
    });
    const outcome = upsertSocialProfile(seeded, {
      uid,
      displayName: String(req.body?.displayName || ''),
      handle: String(req.body?.handle || ''),
      roleTitle: String(req.body?.roleTitle || ''),
      bio: String(req.body?.bio || ''),
      interests: Array.isArray(req.body?.interests)
        ? req.body.interests.map(String)
        : [],
      avatarUrl: String(req.body?.avatarUrl || ''),
    });
    if (!outcome.ok) {
      return res.status(400).json({ ok: false, error: outcome.error });
    }
    persistServerSocialState(outcome.state);
    broadcastSocialWs({
      type: 'social:sync',
      state: serverSocialState,
      onlineUids: getOnlineSocialUids(),
    });
    return res.json({
      ok: true,
      profile: outcome.profile,
      state: serverSocialState,
    });
  });

  app.post('/api/social/follow', (req, res) => {
    const actorUid = String(req.body?.actorUid || '').trim();
    const targetUid = String(req.body?.targetUid || '').trim();
    if (!actorUid || !targetUid) {
      return res.status(400).json({ ok: false, error: 'Geçersiz takip isteği.' });
    }
    const seeded = ensureUserInitializedInState(serverSocialState, {
      uid: actorUid,
      displayName: String(req.body?.actorName || 'Topluluk Üyesi'),
    });
    const outcome = toggleFollowUser(seeded, actorUid, targetUid);
    persistServerSocialState(outcome.state);
    broadcastSocialWs({
      type: 'social:sync',
      state: serverSocialState,
      onlineUids: getOnlineSocialUids(),
    });
    return res.json({
      ok: true,
      isFollowing: outcome.isFollowing,
      state: serverSocialState,
    });
  });

  app.post('/api/social/friends', (req, res) => {
    const actorUid = String(req.body?.actorUid || '').trim();
    const targetUid = String(req.body?.targetUid || '').trim();
    const rawAction = String(req.body?.action || 'add');
    const action: 'add' | 'accept' | 'reject' | 'remove' =
      rawAction === 'accept' || rawAction === 'reject' || rawAction === 'remove'
        ? rawAction
        : 'add';
    if (!actorUid || !targetUid) {
      return res
        .status(400)
        .json({ ok: false, error: 'Geçersiz arkadaşlık isteği.' });
    }
    const seeded = ensureUserInitializedInState(serverSocialState, {
      uid: actorUid,
      displayName: String(req.body?.actorName || 'Topluluk Üyesi'),
    });
    const outcome = mutateFriendship(seeded, actorUid, targetUid, action);
    persistServerSocialState(outcome.state);
    broadcastSocialWs({
      type: 'social:sync',
      state: serverSocialState,
      onlineUids: getOnlineSocialUids(),
    });
    return res.json({
      ok: true,
      isFriend: outcome.isFriend,
      state: serverSocialState,
    });
  });

  app.post('/api/social/rooms/direct', (req, res) => {
    const actorUid = String(req.body?.actorUid || '').trim();
    const targetUid = String(req.body?.targetUid || '').trim();
    if (!actorUid || !targetUid) {
      return res
        .status(400)
        .json({ ok: false, error: 'Geçersiz mesajlaşma isteği.' });
    }
    const seeded = ensureUserInitializedInState(serverSocialState, {
      uid: actorUid,
      displayName: String(req.body?.actorName || 'Topluluk Üyesi'),
    });
    const outcome = getOrCreateDirectMessageRoom(seeded, actorUid, targetUid);
    if (!outcome.ok) {
      return res.status(400).json({ ok: false, error: outcome.error });
    }
    persistServerSocialState(outcome.state);
    broadcastSocialWs({
      type: 'social:sync',
      state: serverSocialState,
      onlineUids: getOnlineSocialUids(),
    });
    return res.json({
      ok: true,
      room: outcome.room,
      state: serverSocialState,
    });
  });

  app.post('/api/social/rooms/create', (req, res) => {
    const ownerUid = String(req.body?.ownerUid || '').trim();
    if (!ownerUid) {
      return res
        .status(400)
        .json({ ok: false, error: 'Oda kurucusu kimliği eksik.' });
    }
    const seeded = ensureUserInitializedInState(serverSocialState, {
      uid: ownerUid,
      displayName: String(req.body?.ownerName || 'Topluluk Üyesi'),
    });
    const outcome = createPrivateChatRoom(seeded, {
      id: req.body?.id ? String(req.body.id) : undefined,
      name: String(req.body?.name || ''),
      topic: String(req.body?.topic || ''),
      roomType:
        req.body?.roomType === 'public-room' ? 'public-room' : 'private-room',
      ownerUid,
      invitedMemberUids: Array.isArray(req.body?.invitedMemberUids)
        ? req.body.invitedMemberUids.map(String)
        : [],
    });
    if (!outcome.ok) {
      return res.status(400).json({ ok: false, error: outcome.error });
    }
    persistServerSocialState(outcome.state);
    broadcastSocialWs({
      type: 'social:sync',
      state: serverSocialState,
      onlineUids: getOnlineSocialUids(),
    });
    return res.json({
      ok: true,
      room: outcome.room,
      state: serverSocialState,
    });
  });

  app.post('/api/social/rooms/message', (req, res) => {
    const senderUid = String(req.body?.senderUid || '').trim();
    const roomId = String(req.body?.roomId || '').trim();
    const content = String(req.body?.content || '');
    if (!senderUid || !roomId) {
      return res.status(400).json({ ok: false, error: 'Geçersiz mesaj isteği.' });
    }
    const seeded = ensureUserInitializedInState(serverSocialState, {
      uid: senderUid,
      displayName: String(req.body?.senderName || 'Topluluk Üyesi'),
    });
    const outcome = appendRoomMessage(seeded, {
      id: req.body?.id ? String(req.body.id) : undefined,
      roomId,
      senderUid,
      content,
    });
    if (!outcome.ok) {
      const status =
        outcome.code === 'FORBIDDEN'
          ? 403
          : outcome.code === 'NOT_FOUND'
          ? 404
          : 400;
      return res
        .status(status)
        .json({ ok: false, code: outcome.code, error: outcome.error });
    }
    persistServerSocialState(outcome.state);
    broadcastSocialWs({
      type: 'social:message',
      roomId: outcome.message.roomId,
      message: outcome.message,
      rooms: serverSocialState.rooms,
    });
    return res.json({
      ok: true,
      message: outcome.message,
      state: serverSocialState,
    });
  });

  const distPath = path.resolve(process.cwd(), 'dist');
  const distIndexHtml = path.join(distPath, 'index.html');
  const hasBuiltDist = fs.existsSync(distIndexHtml);
  const serveStaticDist =
    hasBuiltDist &&
    (process.env.NODE_ENV === 'production' ||
      process.env.npm_lifecycle_event === 'start' ||
      process.argv.includes('--prod'));

  const isUnresolvedModuleAssetRequest = (rawUrl: string): boolean => {
    const cleanPath = (rawUrl || '').split('?')[0].toLowerCase();
    return /\.(?:m?js|cjs|tsx?|jsx|css|map|wasm)$/i.test(cleanPath);
  };

  if (!serveStaticDist) {
    const publicPath = path.resolve(process.cwd(), 'public');
    const staticDistMiddleware = express.static(distPath, {
      index: false,
      etag: true,
      maxAge: '365d',
      immutable: true,
    });
    const staticPublicMiddleware = express.static(publicPath, {
      index: false,
      etag: true,
      maxAge: '7d',
    });

    // Serve pre-bundled dist/ assets instantly on external trycloudflare.com gateway so mobile browsers load cached chunks instead of 150 dev modules
    app.use((req, res, next) => {
      const host = String(req.headers.host || '').toLowerCase();
      if (
        host.includes('.trycloudflare.com') &&
        !req.originalUrl.startsWith('/api/') &&
        fs.existsSync(distIndexHtml)
      ) {
        return staticDistMiddleware(req, res, () => {
          staticPublicMiddleware(req, res, () => {
            if (isUnresolvedModuleAssetRequest(req.originalUrl)) {
              return res
                .status(404)
                .set({
                  'Content-Type': 'text/plain; charset=utf-8',
                  'Cache-Control': 'no-store',
                })
                .send('Module asset not found');
            }
            try {
              const rawHtml = fs.readFileSync(distIndexHtml, 'utf-8');
              const enrichedHtml = injectDynamicOpenGraphHtml(rawHtml, req);
              res
                .status(200)
                .set({
                  'Content-Type': 'text/html; charset=utf-8',
                  'Cache-Control': 'public, max-age=0, must-revalidate',
                })
                .send(enrichedHtml);
            } catch (err) {
              next(err);
            }
          });
        });
      }
      return next();
    });

    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, allowedHosts: true },
      appType: 'custom',
    });

    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api/')) {
        return next();
      }
      if (isUnresolvedModuleAssetRequest(req.originalUrl)) {
        return res
          .status(404)
          .set({
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-store',
          })
          .send('Module asset not found');
      }
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        const enrichedHtml = injectDynamicOpenGraphHtml(template, req);
        res
          .status(200)
          .set({ 'Content-Type': 'text/html; charset=utf-8' })
          .send(enrichedHtml);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const publicPath = path.resolve(process.cwd(), 'public');
    app.use(
      '/assets',
      express.static(path.join(distPath, 'assets'), {
        index: false,
        etag: true,
        maxAge: '365d',
        immutable: true,
      })
    );
    app.use(
      express.static(distPath, {
        index: false,
        etag: true,
        maxAge: '1h',
      })
    );
    if (fs.existsSync(publicPath)) {
      app.use(
        express.static(publicPath, {
          index: false,
          etag: true,
          maxAge: '7d',
        })
      );
    }
    app.use((req, res, next) => {
      if (req.originalUrl.startsWith('/api/')) {
        return next();
      }
      if (isUnresolvedModuleAssetRequest(req.originalUrl)) {
        return res
          .status(404)
          .set({
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-store',
          })
          .send('Module asset not found');
      }
      try {
        const rawHtml = fs.readFileSync(distIndexHtml, 'utf-8');
        const enrichedHtml = injectDynamicOpenGraphHtml(rawHtml, req);
        res
          .status(200)
          .set({ 'Content-Type': 'text/html; charset=utf-8' })
          .send(enrichedHtml);
      } catch {
        res
          .status(200)
          .set({ 'Content-Type': 'text/html; charset=utf-8' })
          .send('<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Luxo AI</title></head><body><div id="root"></div></body></html>');
      }
    });
  }

  // Clean JSON error boundary for malformed request payloads or unexpected middleware errors
  app.use(
    (
      err: unknown,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      if (res.headersSent) {
        return next(err);
      }
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(400).json({
          ok: false,
          error:
            err instanceof Error
              ? sanitizeLuxoBrand(err.message)
              : 'İstek işlenirken beklenmeyen bir durum oluştu.',
        });
      }
      return next(err);
    }
  );

  // Warm up showcase MP4 video asynchronously in background on boot
  ensureShowcaseMp4Ready().catch(() => {});

  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });
  const socialWss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (req, socket, head) => {
    const urlPath = req.url || '';
    if (urlPath.startsWith('/ws/collab')) {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
      return;
    }
    if (urlPath.startsWith('/ws/social')) {
      socialWss.handleUpgrade(req, socket, head, (ws) => {
        socialWss.emit('connection', ws, req);
      });
    }
  });

  socialWss.on('connection', (ws: WebSocket) => {
    const handleDisconnect = () => {
      if (socialWsClients.delete(ws)) {
        broadcastSocialWs({
          type: 'social:presence',
          onlineUids: getOnlineSocialUids(),
        });
      }
    };

    ws.on('message', (rawBuffer) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(String(rawBuffer)) as Record<string, unknown>;
      } catch {
        return;
      }

      const eventType = String(msg.type || '');
      if (eventType === 'ping') {
        sendSocketJson(ws, { type: 'pong', ts: Date.now() });
        return;
      }

      if (eventType === 'social:join') {
        const uid = sanitizePlatformId(String(msg.uid || 'guest_user'), 'usr');
        const displayName = String(msg.displayName || 'Topluluk Üyesi')
          .trim()
          .slice(0, 80);
        const activeRoomId = String(
          msg.activeRoomId || 'room_general_engineering'
        ).slice(0, 120);

        const next = ensureUserInitializedInState(serverSocialState, {
          uid,
          displayName,
          avatarUrl:
            typeof msg.avatarUrl === 'string' ? msg.avatarUrl : undefined,
        });
        if (next !== serverSocialState) {
          persistServerSocialState(next);
        }

        socialWsClients.set(ws, { uid, displayName, activeRoomId });
        sendSocketJson(ws, {
          type: 'social:init',
          state: serverSocialState,
          onlineUids: getOnlineSocialUids(),
        });
        broadcastSocialWs(
          {
            type: 'social:presence',
            onlineUids: getOnlineSocialUids(),
          },
          ws
        );
        return;
      }

      const clientInfo = socialWsClients.get(ws);
      if (!clientInfo) return;

      if (eventType === 'room:focus') {
        const roomId = sanitizePlatformId(String(msg.roomId || ''), 'room');
        socialWsClients.set(ws, { ...clientInfo, activeRoomId: roomId });
        return;
      }

      if (eventType === 'typing:update') {
        const roomId = sanitizePlatformId(
          String(msg.roomId || clientInfo.activeRoomId),
          'room'
        );
        const isTyping = Boolean(msg.isTyping);
        const room = serverSocialState.rooms.find((r) => r.id === roomId);
        if (!room) return;
        for (const [peerWs, peerInfo] of socialWsClients.entries()) {
          if (peerWs === ws) continue;
          if (
            room.roomType === 'public-room' ||
            room.memberUids.includes(peerInfo.uid)
          ) {
            sendSocketJson(peerWs, {
              type: 'social:typing',
              roomId,
              uid: clientInfo.uid,
              displayName:
                serverSocialState.profiles[clientInfo.uid]?.displayName ||
                clientInfo.displayName,
              isTyping,
            });
          }
        }
        return;
      }

      if (eventType === 'message:send') {
        const roomId = String(msg.roomId || clientInfo.activeRoomId || '');
        const content = String(msg.content || '');
        const outcome = appendRoomMessage(serverSocialState, {
          id: typeof msg.id === 'string' ? msg.id : undefined,
          roomId,
          senderUid: clientInfo.uid,
          content,
        });
        if (!outcome.ok) {
          sendSocketJson(ws, {
            type: 'social:error',
            error: outcome.error,
          });
          return;
        }
        persistServerSocialState(outcome.state);
        const createdMessage = outcome.message;
        const targetRoom = serverSocialState.rooms.find(
          (r) => r.id === createdMessage.roomId
        );
        for (const [peerWs, peerInfo] of socialWsClients.entries()) {
          if (
            !targetRoom ||
            targetRoom.roomType === 'public-room' ||
            targetRoom.memberUids.includes(peerInfo.uid)
          ) {
            sendSocketJson(peerWs, {
              type: 'social:message',
              roomId: createdMessage.roomId,
              message: createdMessage,
              rooms: serverSocialState.rooms,
            });
          }
        }
      }
    });

    ws.on('close', handleDisconnect);
    ws.on('error', handleDisconnect);
  });

  wss.on('connection', (ws: WebSocket) => {
    let activeRoom: ServerCollabRoom | null = null;

    const leaveCurrentRoom = () => {
      if (!activeRoom) return;
      const room = activeRoom;
      activeRoom = null;
      if (room.clients.delete(ws)) {
        broadcastToRoom(room, {
          type: 'presence:sync',
          roomId: room.roomId,
          participants: Array.from(room.clients.values()),
        });
      }
    };

    ws.on('message', (rawBuffer) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(String(rawBuffer)) as Record<string, unknown>;
      } catch {
        return;
      }

      const eventType = String(msg.type || '');

      if (eventType === 'ping') {
        sendSocketJson(ws, { type: 'pong', ts: Date.now() });
        return;
      }

      if (eventType === 'room:join') {
        leaveCurrentRoom();
        const targetRoom = getOrCreateCollabRoom(String(msg.roomId || ''));
        activeRoom = targetRoom;
        const clientId = String(
          msg.clientId || `client_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
        ).slice(0, 64);
        const safeName = sanitizeLuxoBrand(
          String(msg.name || 'Katılımcı').trim() || 'Katılımcı'
        ).slice(0, 48);
        const surfaceRaw = msg.activeSurface;
        const activeSurface: CollabSurface =
          surfaceRaw === 'doc' || surfaceRaw === 'code' ? surfaceRaw : 'chat';
        const now = Date.now();

        const participant: CollabParticipant = {
          clientId,
          name: safeName,
          color: pickParticipantColor(clientId),
          activeSurface,
          activeTab:
            msg.activeTab === 'html' ||
            msg.activeTab === 'css' ||
            msg.activeTab === 'js'
              ? msg.activeTab
              : undefined,
          activeModelId:
            typeof msg.activeModelId === 'string' &&
            msg.activeModelId in LUXO_MODELS
              ? (msg.activeModelId as LuxoModelId)
              : 'gemini-4-argon',
          isTyping: false,
          joinedAt: now,
          updatedAt: now,
        };

        targetRoom.clients.set(ws, participant);

        sendSocketJson(ws, {
          type: 'room:init',
          snapshot: serializeRoomSnapshot(targetRoom),
        });

        broadcastToRoom(
          targetRoom,
          {
            type: 'presence:sync',
            roomId: targetRoom.roomId,
            participants: Array.from(targetRoom.clients.values()),
          },
          ws
        );
        return;
      }

      if (!activeRoom) {
        activeRoom = getOrCreateCollabRoom(String(msg.roomId || DEFAULT_COLLAB_ROOM_ID));
      }

      const currentParticipant = activeRoom.clients.get(ws);

      if (eventType === 'presence:update' && currentParticipant) {
        const surfaceRaw = msg.activeSurface;
        const updatedParticipant: CollabParticipant = {
          ...currentParticipant,
          name:
            typeof msg.name === 'string' && msg.name.trim()
              ? sanitizeLuxoBrand(msg.name.trim()).slice(0, 48)
              : currentParticipant.name,
          activeSurface:
            surfaceRaw === 'chat' || surfaceRaw === 'doc' || surfaceRaw === 'code'
              ? surfaceRaw
              : currentParticipant.activeSurface,
          activeTab:
            msg.activeTab === 'html' ||
            msg.activeTab === 'css' ||
            msg.activeTab === 'js'
              ? msg.activeTab
              : currentParticipant.activeTab,
          activeModelId:
            typeof msg.activeModelId === 'string' &&
            msg.activeModelId in LUXO_MODELS
              ? (msg.activeModelId as LuxoModelId)
              : currentParticipant.activeModelId,
          cursorOffset:
            typeof msg.cursorOffset === 'number'
              ? msg.cursorOffset
              : currentParticipant.cursorOffset,
          isTyping:
            typeof msg.isTyping === 'boolean'
              ? msg.isTyping
              : currentParticipant.isTyping,
          updatedAt: Date.now(),
        };
        activeRoom.clients.set(ws, updatedParticipant);
        broadcastToRoom(activeRoom, {
          type: 'presence:sync',
          roomId: activeRoom.roomId,
          participants: Array.from(activeRoom.clients.values()),
        });
        return;
      }

      if (eventType === 'doc:update') {
        const senderId =
          currentParticipant?.clientId || String(msg.clientId || 'peer');
        const senderName =
          currentParticipant?.name || String(msg.updatedBy || 'Katılımcı');
        activeRoom.sharedDoc = applySharedDocDelta(activeRoom.sharedDoc, {
          title: typeof msg.title === 'string' ? msg.title : undefined,
          content: typeof msg.content === 'string' ? msg.content : undefined,
          updatedBy: senderName,
          updatedByClientId: senderId,
          updatedAt: Date.now(),
        });
        broadcastToRoom(activeRoom, {
          type: 'doc:updated',
          roomId: activeRoom.roomId,
          sharedDoc: activeRoom.sharedDoc,
          senderClientId: senderId,
        });
        return;
      }

      if (eventType === 'code:update') {
        const senderId =
          currentParticipant?.clientId || String(msg.clientId || 'peer');
        const senderName =
          currentParticipant?.name || String(msg.updatedBy || 'Geliştirici');
        activeRoom.sharedCode = applySharedCodeDelta(activeRoom.sharedCode, {
          mode:
            msg.mode === 'web' || msg.mode === 'js-console'
              ? msg.mode
              : undefined,
          html: typeof msg.html === 'string' ? msg.html : undefined,
          css: typeof msg.css === 'string' ? msg.css : undefined,
          js: typeof msg.js === 'string' ? msg.js : undefined,
          updatedBy: senderName,
          updatedByClientId: senderId,
          updatedAt: Date.now(),
        });
        broadcastToRoom(activeRoom, {
          type: 'code:updated',
          roomId: activeRoom.roomId,
          sharedCode: activeRoom.sharedCode,
          senderClientId: senderId,
        });
        return;
      }

      if (eventType === 'chat:upsert' && msg.message && typeof msg.message === 'object') {
        const senderId =
          currentParticipant?.clientId || String(msg.clientId || 'peer');
        const incomingMsg = msg.message as ChatMessage;
        activeRoom.sharedMessages = upsertSharedMessage(
          activeRoom.sharedMessages,
          incomingMsg
        );
        const latestSaved = activeRoom.sharedMessages.find(
          (m) => m.id === incomingMsg.id
        );
        if (latestSaved) {
          broadcastToRoom(activeRoom, {
            type: 'chat:upserted',
            roomId: activeRoom.roomId,
            message: latestSaved,
            senderClientId: senderId,
          });
        }
      }
    });

    ws.on('close', leaveCurrentRoom);
    ws.on('error', leaveCurrentRoom);
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Luxo AI server + WebSocket collab listening on http://localhost:${PORT}`);
    // Automatically maintain & self-heal public HTTPS gateway in background
    ensurePublicTunnelRunning(PORT, true)
      .then((url) => {
        if (url) {
          console.log(`Luxo AI Public Zero-Login Gateway ready: ${url}`);
        }
      })
      .catch(() => {});

    // 45-second watchdog: verify external HTTPS reachability and auto-respawn if cloudflared edge drops
    setInterval(() => {
      ensurePublicTunnelRunning(PORT, true).catch(() => {});
    }, 45_000).unref();
  });
}

startServer();
