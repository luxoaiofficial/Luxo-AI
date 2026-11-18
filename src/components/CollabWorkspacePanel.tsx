import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Copy,
  FileText,
  Hash,
  Send,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import {
  buildCollabRoomUrl,
  CollabParticipant,
  CollabSharedDoc,
  sanitizeCollabRoomId,
} from '../utils/collabState';
import {
  isPrivateDevPreviewOrigin,
  LUXO_MODELS,
  resolvePublicAppUrl,
} from '../utils/luxoLogic';

interface CollabWorkspacePanelProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  isConnected: boolean;
  clientId: string;
  participants: CollabParticipant[];
  sharedDoc: CollabSharedDoc;
  onChangeRoom: (nextRoomId: string) => void;
  onUpdateSharedDoc: (delta: { title?: string; content?: string }) => void;
  onUpdateTyping: (isTyping: boolean) => void;
  onSendDocToChat: (promptText: string) => void;
}

export const CollabWorkspacePanel: React.FC<CollabWorkspacePanelProps> = ({
  isOpen,
  onClose,
  roomId,
  isConnected,
  clientId,
  participants,
  sharedDoc,
  onChangeRoom,
  onUpdateSharedDoc,
  onUpdateTyping,
  onSendDocToChat,
}) => {
  const [roomInput, setRoomInput] = useState(roomId);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRoomInput(roomId);
  }, [roomId]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const triggerTypingPulse = () => {
    onUpdateTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onUpdateTyping(false);
    }, 1200);
  };

  const rawOrigin =
    typeof window !== 'undefined' ? window.location.origin : undefined;
  const isDevPreview = isPrivateDevPreviewOrigin(rawOrigin);

  const handleCopyInvite = () => {
    const inviteUrl = buildCollabRoomUrl(
      resolvePublicAppUrl(rawOrigin),
      roomId
    );
    try {
      navigator.clipboard?.writeText(inviteUrl);
    } catch {
      // fallback
    }
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const handleSwitchRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = sanitizeCollabRoomId(roomInput);
    onChangeRoom(cleaned);
  };

  const activeCount = Math.max(1, participants.length);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Canlı Ortak Çalışma Stüdyosu"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs"
    >
      <div className="w-full max-w-xl h-full bg-white dark:bg-[#18181b] border-l border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white truncate">
                  Canlı Ortak Çalışma
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    isConnected
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {isConnected ? (
                    <Wifi className="w-3 h-3" />
                  ) : (
                    <WifiOff className="w-3 h-3" />
                  )}
                  <span>
                    {isConnected
                      ? `${activeCount} Aktif Katılımcı`
                      : 'Yeniden Bağlanıyor...'}
                  </span>
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                Gerçek zamanlı çok kullanıcılı belge, kod ve sohbet senkronizasyonu
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Ortak Çalışma Panelini Kapat"
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-3 bg-neutral-50 dark:bg-[#141417] border-b border-neutral-200 dark:border-neutral-800 space-y-2.5 shrink-0">
          <form
            onSubmit={handleSwitchRoom}
            className="flex flex-wrap items-center gap-2"
          >
            <div className="flex items-center gap-1.5 flex-1 min-w-[180px] px-3 py-1.5 rounded-xl bg-white dark:bg-[#202123] border border-neutral-200 dark:border-neutral-700">
              <Hash className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <input
                type="text"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                aria-label="Ortak Çalışma Odası Kodu"
                placeholder="oda-adi"
                className="w-full bg-transparent text-xs font-mono font-semibold text-neutral-900 dark:text-white focus:outline-hidden"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold cursor-pointer hover:opacity-90 transition shrink-0"
            >
              Odaya Geç
            </button>
            <button
              type="button"
              onClick={handleCopyInvite}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shrink-0"
            >
              {copiedInvite ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Bağlantı Kopyalandı</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Davet Bağlantısını Kopyala</span>
                </>
              )}
            </button>
          </form>
          {isDevPreview && (
            <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-snug">
              Not: Farklı telefonlardan davet bağlantısına sorunsuz girilebilmesi için sağ üstteki AI Studio <strong>Share / Deploy</strong> menüsünden uygulamayı herkese açık yayınlayın.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            {participants.length === 0 ? (
              <span className="text-[11px] text-neutral-400">
                Oda katılımcıları yükleniyor...
              </span>
            ) : (
              participants.map((p) => {
                const isSelf = p.clientId === clientId;
                const surfaceLabel =
                  p.activeSurface === 'code'
                    ? `Düzenleyici${p.activeTab ? ` (${p.activeTab})` : ''}`
                    : p.activeSurface === 'doc'
                    ? 'Ortak Belge'
                    : 'Sohbet';
                const modelLabel = p.activeModelId
                  ? LUXO_MODELS[p.activeModelId]?.name
                  : undefined;

                return (
                  <div
                    key={p.clientId}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#202123] border border-neutral-200 dark:border-neutral-800 text-[11px]"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="font-bold text-neutral-800 dark:text-neutral-100">
                      {p.name}
                      {isSelf ? ' (Sen)' : ''}
                    </span>
                    <span className="text-neutral-400">·</span>
                    <span className="text-neutral-500 dark:text-neutral-400">
                      {surfaceLabel}
                    </span>
                    {modelLabel && (
                      <span className="hidden sm:inline text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                        [{modelLabel}]
                      </span>
                    )}
                    {p.isTyping && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse">
                        yazıyor...
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col p-5 gap-3 min-h-0 overflow-y-auto">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-800 dark:text-neutral-200">
              <FileText className="w-4 h-4 text-blue-500" />
              <span>Canlı Ortak Belge & Not Tuvali</span>
            </div>
            <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 tabular-nums">
              v{sharedDoc.version} · Son düzenleyen: {sharedDoc.updatedBy}
            </span>
          </div>

          <input
            type="text"
            value={sharedDoc.title}
            onChange={(e) => {
              triggerTypingPulse();
              onUpdateSharedDoc({ title: e.target.value });
            }}
            aria-label="Ortak Belge Başlığı"
            placeholder="Ortak belge başlığı..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-[#202123] border border-neutral-200 dark:border-neutral-800 text-sm font-bold text-neutral-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
          />

          <textarea
            value={sharedDoc.content}
            onChange={(e) => {
              triggerTypingPulse();
              onUpdateSharedDoc({ content: e.target.value });
            }}
            aria-label="Ortak Belge İçeriği"
            placeholder="Ekibinizle aynı anda buradan not alın, istem tasarlayın veya mimari kararları düzenleyin..."
            className="flex-1 min-h-[240px] w-full p-4 rounded-2xl bg-neutral-50 dark:bg-[#141417] border border-neutral-200 dark:border-neutral-800 text-xs sm:text-sm font-mono leading-relaxed text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:border-emerald-500 resize-none"
          />
        </div>

        <div className="px-5 py-3.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#141417] flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              onSendDocToChat(
                `Ortak çalışma belgemizi ("${sharedDoc.title}") kısaca özetle ve en önemli adımları belirt:\n\n${sharedDoc.content}`
              );
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Belgeyi Sohbete Gönder</span>
          </button>
        </div>
      </div>
    </div>
  );
};
