import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Inbox,
  LogOut,
  Mail,
  PenSquare,
  RefreshCw,
  Search,
  Send,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import {
  clearGmailAccessToken,
  getGmailAccessToken,
  getGmailUserEmail,
  signInWithGmailOAuth,
} from '../firebase';
import {
  getGmailMessageDetail,
  type GmailMessageDetail,
  type GmailMessageSummary,
  listGmailMessages,
  modifyGmailMessageLabels,
  sendGmailMessage,
  trashGmailMessage,
} from '../utils/gmailWorkspace';

interface GmailWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type GmailTab = 'inbox' | 'starred' | 'compose';

interface PendingGmailAction {
  type: 'send' | 'trash' | 'toggleStar';
  title: string;
  description: string;
  targetMessageId?: string;
  shouldStar?: boolean;
}

export const GmailWorkspaceModal: React.FC<GmailWorkspaceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [token, setToken] = useState<string | null>(() => getGmailAccessToken());
  const [userEmail, setUserEmail] = useState<string | null>(() =>
    getGmailUserEmail()
  );
  const [activeTab, setActiveTab] = useState<GmailTab>('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] =
    useState<GmailMessageDetail | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [busyAction, setBusyAction] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Compose state
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  // Mandatory Custom Confirmation Dialog state
  const [pendingAction, setPendingAction] =
    useState<PendingGmailAction | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setToken(getGmailAccessToken());
    setUserEmail(getGmailUserEmail());
  }, [isOpen]);

  const loadInbox = async (authToken: string, queryOverride?: string) => {
    setLoadingList(true);
    setErrorMsg(null);
    try {
      const qParts: string[] = [];
      if (activeTab === 'starred') qParts.push('is:starred');
      const qStr = (queryOverride ?? searchQuery).trim();
      if (qStr) qParts.push(qStr);
      const list = await listGmailMessages(authToken, {
        query: qParts.join(' '),
        maxResults: 15,
      });
      setMessages(list);
      if (list.length > 0 && !list.some((m) => m.id === selectedId)) {
        setSelectedId(list[0].id);
      } else if (list.length === 0) {
        setSelectedId(null);
        setSelectedDetail(null);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gmail iletileri yüklenemedi.'
      );
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !token || activeTab === 'compose') return;
    void loadInbox(token);
  }, [isOpen, token, activeTab]);

  useEffect(() => {
    if (!isOpen || !token || !selectedId || activeTab === 'compose') return;
    let cancelled = false;
    setLoadingDetail(true);
    getGmailMessageDetail(token, selectedId)
      .then((detail) => {
        if (!cancelled) setSelectedDetail(detail);
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMsg(
            err instanceof Error ? err.message : 'E-posta içeriği okunamadı.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, token, selectedId, activeTab]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setConnecting(true);
    setErrorMsg(null);
    setStatusBanner(null);
    try {
      const res = await signInWithGmailOAuth();
      setToken(res.accessToken);
      setUserEmail(res.user.email || null);
      setStatusBanner('Gmail Workspace bağlantısı kuruldu.');
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Google Workspace ile oturum açılamadı.'
      );
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    clearGmailAccessToken();
    setToken(null);
    setMessages([]);
    setSelectedDetail(null);
    setSelectedId(null);
    setStatusBanner('Gmail oturumu kapatıldı.');
  };

  const executeConfirmedAction = async () => {
    if (!pendingAction || !token) {
      setPendingAction(null);
      return;
    }
    const action = pendingAction;
    setPendingAction(null);
    setBusyAction(true);
    setErrorMsg(null);
    setStatusBanner(null);

    try {
      if (action.type === 'send') {
        await sendGmailMessage(token, {
          to: composeTo.trim(),
          subject: composeSubject.trim(),
          body: composeBody,
        });
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
        setActiveTab('inbox');
        setStatusBanner('E-posta başarıyla gönderildi.');
        await loadInbox(token);
      } else if (action.type === 'trash' && action.targetMessageId) {
        await trashGmailMessage(token, action.targetMessageId);
        setStatusBanner('E-posta çöp kutusuna taşındı.');
        setSelectedDetail(null);
        setSelectedId(null);
        await loadInbox(token);
      } else if (action.type === 'toggleStar' && action.targetMessageId) {
        await modifyGmailMessageLabels(token, action.targetMessageId, {
          addLabelIds: action.shouldStar ? ['STARRED'] : undefined,
          removeLabelIds: action.shouldStar ? undefined : ['STARRED'],
        });
        setStatusBanner(
          action.shouldStar ? 'Yıldız eklendi.' : 'Yıldız kaldırıldı.'
        );
        await loadInbox(token);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gmail işlemi tamamlanamadı.'
      );
    } finally {
      setBusyAction(false);
    }
  };

  const handleRequestSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim() || !composeSubject.trim()) return;
    setPendingAction({
      type: 'send',
      title: 'E-posta Gönderimini Onayla',
      description: `Alıcı: ${composeTo.trim()} · Konu: "${composeSubject.trim()}". Bu e-posta gerçek Gmail hesabınızdan gönderilecektir.`,
    });
  };

  const activeSummary = messages.find((m) => m.id === selectedId);
  const isSelectedStarred = Boolean(
    activeSummary?.labelIds?.includes('STARRED')
  );

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !pendingAction) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs"
      data-testid="gmail-workspace-modal"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#1f2024] rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white truncate">
                Google Workspace · Gmail
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                {userEmail || 'Gelen kutusu, arama ve güvenli e-posta gönderimi'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {token && (
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bağlantıyı Kes</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Gmail Penceresini Kapat"
              className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Body */}
        {!token ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Mail className="w-8 h-8" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                Gmail Hesabınızı Bağlayın
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Gelen kutunuzu görüntülemek, iletilerde arama yapmak ve doğrudan e-posta göndermek için Google Workspace hesabınızla oturum açın. Erişim jetonu yalnızca bellekte tutulur.
              </p>
            </div>

            {errorMsg && (
              <div className="px-4 py-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 max-w-md">
                {errorMsg}
              </div>
            )}

            {/* Official Google Sign-In Button Styling */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={connecting}
              data-testid="gmail-google-signin-btn"
              className="inline-flex items-center justify-center gap-3 px-6 py-3 rounded-full bg-white hover:bg-[#f8f9fa] text-[#1f1f1f] border border-[#747775] shadow-xs text-sm font-medium transition cursor-pointer disabled:opacity-60 min-h-[44px]"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              <span>
                {connecting ? 'Bağlanıyor...' : 'Sign in with Google'}
              </span>
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Toolbar */}
            <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2 bg-neutral-50/70 dark:bg-neutral-900/40 shrink-0">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('inbox')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === 'inbox'
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  <Inbox className="w-3.5 h-3.5" />
                  <span>Gelen Kutusu</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('starred')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === 'starred'
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                      : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  <Star className="w-3.5 h-3.5" />
                  <span>Yıldızlılar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('compose')}
                  data-testid="gmail-compose-tab-btn"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer ${
                    activeTab === 'compose'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                  }`}
                >
                  <PenSquare className="w-3.5 h-3.5" />
                  <span>Yeni E-posta</span>
                </button>
              </div>

              {activeTab !== 'compose' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void loadInbox(token, searchQuery);
                  }}
                  className="flex items-center gap-1.5 flex-1 max-w-xs"
                >
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Gmail içinde ara..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadInbox(token, searchQuery)}
                    disabled={loadingList}
                    aria-label="Yenile"
                    className="p-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        loadingList ? 'animate-spin' : ''
                      }`}
                    />
                  </button>
                </form>
              )}
            </div>

            {statusBanner && (
              <div className="mx-4 mt-3 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2 shrink-0">
                <Check className="w-3.5 h-3.5" />
                <span>{statusBanner}</span>
              </div>
            )}
            {errorMsg && (
              <div className="mx-4 mt-3 px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-600 dark:text-red-400 shrink-0">
                {errorMsg}
              </div>
            )}

            {/* Main Workspace Area */}
            {activeTab === 'compose' ? (
              <form
                onSubmit={handleRequestSend}
                className="flex-1 overflow-y-auto p-5 space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                    Alıcı E-posta
                  </label>
                  <input
                    type="email"
                    required
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    placeholder="ornek@alanadi.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                    Konu
                  </label>
                  <input
                    type="text"
                    required
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    placeholder="E-posta konusu..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                    İleti İçeriği
                  </label>
                  <textarea
                    rows={7}
                    required
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    placeholder="Mesajınızı buraya yazın..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm outline-none focus:border-indigo-500 resize-y"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('inbox')}
                    className="px-4 py-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={busyAction}
                    data-testid="gmail-send-submit-btn"
                    className="px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gönder</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
                {/* List */}
                <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-neutral-200 dark:border-neutral-800 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/70 max-h-64 md:max-h-none">
                  {loadingList ? (
                    <div className="p-6 text-center text-xs text-neutral-400">
                      İletiler yükleniyor...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="p-6 text-center text-xs text-neutral-400">
                      Görüntülenecek ileti bulunamadı.
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const active = msg.id === selectedId;
                      const starred = msg.labelIds.includes('STARRED');
                      return (
                        <button
                          key={msg.id}
                          type="button"
                          onClick={() => setSelectedId(msg.id)}
                          className={`w-full text-left p-3.5 transition cursor-pointer ${
                            active
                              ? 'bg-indigo-50/70 dark:bg-indigo-500/10'
                              : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span
                              className={`text-xs truncate ${
                                msg.unread
                                  ? 'font-bold text-neutral-900 dark:text-white'
                                  : 'font-medium text-neutral-700 dark:text-neutral-300'
                              }`}
                            >
                              {msg.from || 'Gönderen'}
                            </span>
                            {starred && (
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                            )}
                          </div>
                          <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                            {msg.subject}
                          </div>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                            {msg.snippet}
                          </p>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Reader */}
                <div className="md:col-span-7 overflow-y-auto p-5">
                  {loadingDetail ? (
                    <div className="text-xs text-neutral-400">
                      İleti açılıyor...
                    </div>
                  ) : selectedDetail ? (
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <h3 className="text-base font-bold text-neutral-900 dark:text-white leading-snug">
                            {selectedDetail.subject}
                          </h3>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 break-all">
                            <strong>Kimden:</strong> {selectedDetail.from}
                          </p>
                          <p className="text-[11px] text-neutral-400">
                            {selectedDetail.date}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            disabled={busyAction}
                            onClick={() =>
                              setPendingAction({
                                type: 'toggleStar',
                                targetMessageId: selectedDetail.id,
                                shouldStar: !isSelectedStarred,
                                title: isSelectedStarred
                                  ? 'Yıldızı Kaldırmayı Onayla'
                                  : 'Yıldız Eklemeyi Onayla',
                                description: `"${selectedDetail.subject}" iletisinin yıldız durumunu güncellemek istiyor musunuz?`,
                              })
                            }
                            aria-label="Yıldızla"
                            className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition cursor-pointer"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                isSelectedStarred
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-neutral-500'
                              }`}
                            />
                          </button>
                          <button
                            type="button"
                            disabled={busyAction}
                            onClick={() =>
                              setPendingAction({
                                type: 'trash',
                                targetMessageId: selectedDetail.id,
                                title: 'Çöp Kutusuna Taşımayı Onayla',
                                description: `"${selectedDetail.subject}" iletisi çöp kutusuna taşınacaktır.`,
                              })
                            }
                            aria-label="Çöp Kutusuna Taşı"
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200/70 dark:border-neutral-800 text-xs text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
                        {selectedDetail.bodyText || selectedDetail.snippet}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-neutral-400">
                      Okumak için sol listeden bir e-posta seçin.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mandatory Custom React Confirmation Modal */}
        {pendingAction && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs"
            data-testid="gmail-confirm-dialog"
          >
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#242529] border border-neutral-200 dark:border-neutral-700 p-6 shadow-2xl space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                    {pendingAction.title}
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    {pendingAction.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingAction(null)}
                  className="px-4 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={() => void executeConfirmedAction()}
                  data-testid="gmail-confirm-proceed-btn"
                  className="px-5 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Onayla ve Uygula
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
