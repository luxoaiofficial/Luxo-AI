import type { ChatMessage, LuxoModelId } from '../types/luxo.ts';
import { resolvePublicAppUrl, sanitizeLuxoBrand } from './luxoLogic.ts';


export type CollabSurface = 'chat' | 'doc' | 'code';

export interface CollabParticipant {
  clientId: string;
  name: string;
  color: string;
  activeSurface: CollabSurface;
  activeTab?: 'html' | 'css' | 'js';
  activeModelId?: LuxoModelId;
  cursorOffset?: number;
  isTyping?: boolean;
  joinedAt: number;
  updatedAt: number;
}

export interface CollabSharedDoc {
  title: string;
  content: string;
  version: number;
  updatedAt: number;
  updatedBy: string;
  updatedByClientId: string;
}

export interface CollabSharedCode {
  mode: 'web' | 'js-console';
  html: string;
  css: string;
  js: string;
  version: number;
  updatedAt: number;
  updatedBy: string;
  updatedByClientId: string;
}

export interface CollabRoomSnapshot {
  roomId: string;
  participants: CollabParticipant[];
  sharedDoc: CollabSharedDoc;
  sharedCode: CollabSharedCode;
  sharedMessages: ChatMessage[];
}

export const COLLAB_AVATAR_COLORS = [
  '#2563eb',
  '#10b981',
  '#d97706',
  '#db2777',
  '#7c3aed',
  '#0891b2',
  '#e11d48',
  '#4f46e5',
];

export const DEFAULT_COLLAB_ROOM_ID = 'genel-studyo';

export function sanitizeCollabRoomId(raw?: string | null): string {
  if (!raw) return DEFAULT_COLLAB_ROOM_ID;
  const normalized = raw
    .trim()
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return normalized.length >= 2 ? normalized : DEFAULT_COLLAB_ROOM_ID;
}

export function parseRoomIdFromSearch(searchString: string): string | null {
  if (!searchString) return null;
  const params = new URLSearchParams(
    searchString.startsWith('?') ? searchString : `?${searchString}`
  );
  const rawRoom = params.get('room');
  if (!rawRoom || !rawRoom.trim()) return null;
  return sanitizeCollabRoomId(rawRoom);
}

export function buildCollabRoomUrl(baseUrl: string, roomId: string): string {
  const safeBase = resolvePublicAppUrl(baseUrl);
  const safeRoom = sanitizeCollabRoomId(roomId);
  const params = new URLSearchParams();
  params.set('autostart', '1');
  params.set('room', safeRoom);
  return `${safeBase}/?${params.toString()}`;
}

export function pickParticipantColor(clientId: string): string {
  let hash = 0;
  for (let i = 0; i < clientId.length; i++) {
    hash = (hash << 5) - hash + clientId.charCodeAt(i);
    hash |= 0;
  }
  return COLLAB_AVATAR_COLORS[Math.abs(hash) % COLLAB_AVATAR_COLORS.length];
}

export function createInitialSharedDoc(roomId: string): CollabSharedDoc {
  return {
    title: `Ortak Çalışma Belgesi · #${sanitizeCollabRoomId(roomId)}`,
    content:
      '## Canlı Ortak Çalışma Notları & Kararlar\n\n- Bu belge odadaki tüm katılımcılarla WebSocket üzerinden **anlık (gerçek zamanlı)** senkronize edilir.\n- Birden fazla kullanıcı aynı anda metni ve kodu düzenleyebilir, değişiklikler milisaniyeler içinde tüm ekranlara yansır.\n- Sohbet istemlerini ve yan yana model karşılaştırma çıktılarını ekipçe buradan koordine edebilirsiniz.',
    version: 1,
    updatedAt: Date.now(),
    updatedBy: 'Sistem',
    updatedByClientId: 'system',
  };
}

export function createInitialSharedCode(): CollabSharedCode {
  return {
    mode: 'web',
    html: `<div class="collab-card">
  <span class="tag">CANLI ORTAK KOD · WEBSOCKET</span>
  <h2>Eşzamanlı Ekip Prototipi</h2>
  <p id="status">Tüm bağlı geliştiriciler bu bileşeni aynı anda düzenleyebilir.</p>
  <button id="pingBtn">Canlı Sinyal Gönder</button>
</div>`,
    css: `body {
  margin: 0;
  padding: 24px;
  font-family: system-ui, -apple-system, sans-serif;
  background: #090d16;
  color: #f8fafc;
}
.collab-card {
  max-width: 500px;
  margin: 0 auto;
  padding: 22px;
  border-radius: 18px;
  background: #111827;
  border: 1px solid #1f2937;
}
.tag {
  display: inline-block;
  font-size: 10px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 99px;
  background: rgba(16, 185, 129, 0.16);
  color: #34d399;
}
button {
  margin-top: 10px;
  padding: 9px 16px;
  border-radius: 10px;
  border: none;
  background: #2563eb;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}`,
    js: `let count = 0;
document.getElementById('pingBtn')?.addEventListener('click', () => {
  count++;
  const el = document.getElementById('status');
  if (el) el.textContent = 'Canlı etkileşim sayacı: ' + count;
  console.log('Ortak stüdyo sinyali #' + count);
});`,
    version: 1,
    updatedAt: Date.now(),
    updatedBy: 'Sistem',
    updatedByClientId: 'system',
  };
}

export function applySharedDocDelta(
  current: CollabSharedDoc,
  delta: {
    title?: string;
    content?: string;
    updatedBy?: string;
    updatedByClientId?: string;
    updatedAt?: number;
  }
): CollabSharedDoc {
  const nextTitle =
    typeof delta.title === 'string'
      ? sanitizeLuxoBrand(delta.title).slice(0, 140)
      : current.title;
  const nextContent =
    typeof delta.content === 'string'
      ? sanitizeLuxoBrand(delta.content).slice(0, 24000)
      : current.content;

  if (nextTitle === current.title && nextContent === current.content) {
    return current;
  }

  return {
    title: nextTitle,
    content: nextContent,
    version: current.version + 1,
    updatedAt: delta.updatedAt ?? Date.now(),
    updatedBy: sanitizeLuxoBrand(delta.updatedBy || 'Katılımcı').slice(0, 60),
    updatedByClientId: String(delta.updatedByClientId || 'unknown').slice(0, 64),
  };
}

export function applySharedCodeDelta(
  current: CollabSharedCode,
  delta: {
    mode?: 'web' | 'js-console';
    html?: string;
    css?: string;
    js?: string;
    updatedBy?: string;
    updatedByClientId?: string;
    updatedAt?: number;
  }
): CollabSharedCode {
  const nextMode =
    delta.mode === 'web' || delta.mode === 'js-console'
      ? delta.mode
      : current.mode;
  const nextHtml =
    typeof delta.html === 'string' ? delta.html.slice(0, 32000) : current.html;
  const nextCss =
    typeof delta.css === 'string' ? delta.css.slice(0, 32000) : current.css;
  const nextJs =
    typeof delta.js === 'string' ? delta.js.slice(0, 32000) : current.js;

  if (
    nextMode === current.mode &&
    nextHtml === current.html &&
    nextCss === current.css &&
    nextJs === current.js
  ) {
    return current;
  }

  return {
    mode: nextMode,
    html: nextHtml,
    css: nextCss,
    js: nextJs,
    version: current.version + 1,
    updatedAt: delta.updatedAt ?? Date.now(),
    updatedBy: sanitizeLuxoBrand(delta.updatedBy || 'Geliştirici').slice(0, 60),
    updatedByClientId: String(delta.updatedByClientId || 'unknown').slice(0, 64),
  };
}

/**
 * Idempotent message upsert: prevents duplicate messages on reconnect or broadcast races.
 */
export function upsertSharedMessage(
  messages: ChatMessage[],
  incoming: ChatMessage,
  maxMessages = 60
): ChatMessage[] {
  if (!incoming || !incoming.id) return messages;
  const sanitizedIncoming: ChatMessage = {
    ...incoming,
    content: sanitizeLuxoBrand(incoming.content || '').slice(0, 20000),
    inlineAttachment: undefined, // Never broadcast heavy base64 blobs over room state
  };

  const idx = messages.findIndex((m) => m.id === sanitizedIncoming.id);
  if (idx >= 0) {
    const updated = [...messages];
    updated[idx] = {
      ...updated[idx],
      ...sanitizedIncoming,
    };
    return updated;
  }

  const appended = [...messages, sanitizedIncoming];
  return appended.length > maxMessages
    ? appended.slice(appended.length - maxMessages)
    : appended;
}
