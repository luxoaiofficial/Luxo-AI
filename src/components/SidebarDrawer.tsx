import React, { useRef, useState } from 'react';
import {
  Bell,
  BookOpen,
  Brain,
  Calendar,
  Clock,
  ExternalLink,
  Folder,
  Globe,
  Image as ImageIcon,
  KeyRound,
  Keyboard,
  Laptop,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquarePlus,
  Mic,
  Moon,
  Play,
  Plus,
  Search,
  Settings,
  SquarePen,
  Sun,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from 'lucide-react';
import {
  ChatThread,
  LuxoModelId,
  LuxoUser,
  ScheduledRoutine,
} from '../types/luxo';
import {
  LUXO_MODELS,
  PUBLIC_CHAT_MODEL_IDS,
  sanitizeLuxoBrand,
} from '../utils/luxoLogic';
import { searchSidebarChats } from '../utils/sidebarChatSearch';
import { LuxoLogo, ModelBrandAvatar } from './LuxoLogo';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chats: ChatThread[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onOpenImages: () => void;
  onOpenDashboard?: () => void;
  onOpenVoiceCommands?: () => void;
  onSignOut?: () => void;
  onOpenEvolution: () => void;
  onOpenHub?: () => void;
  onOpenContentStudio?: () => void;
  onOpenSocial?: () => void;
  onOpenGmail?: () => void;
  onOpenLibrary: () => void;
  onOpenProjects: () => void;
  onOpenStudio: () => void;
  onOpenSettings: (subModal?: string) => void;
  onOpenKeyboardShortcuts?: () => void;
  onOpenFeedback?: () => void;
  unreadNotificationCount?: number;
  onOpenNotifications?: () => void;
  onSelectModel: (modelId: LuxoModelId) => void;
  onOpenAuthModal: () => void;
  routines: ScheduledRoutine[];
  onToggleRoutine: (id: string) => void;
  onAddRoutine: (routine: Omit<ScheduledRoutine, 'id'>) => void;
  onRunRoutineNow: (routine: ScheduledRoutine) => void;
  user: LuxoUser;
  isDarkTheme?: boolean;
  onToggleTheme?: () => void;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onOpenImages,
  onOpenDashboard,
  onOpenVoiceCommands,
  onSignOut,
  onOpenEvolution,
  onOpenHub,
  onOpenContentStudio,
  onOpenSocial,
  onOpenGmail,
  onOpenLibrary,
  onOpenProjects,
  onOpenStudio,
  onOpenSettings,
  onOpenKeyboardShortcuts,
  onOpenFeedback,
  unreadNotificationCount = 0,
  onOpenNotifications,
  onSelectModel,
  onOpenAuthModal,
  routines,
  onToggleRoutine,
  onAddRoutine,
  onRunRoutineNow,
  user,
  isDarkTheme,
  onToggleTheme,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [showAllChats, setShowAllChats] = useState(false);
  const [showScheduledModal, setShowScheduledModal] = useState(false);
  const [showNewRoutineForm, setShowNewRoutineForm] = useState(false);
  const [newRoutineTitle, setNewRoutineTitle] = useState('');
  const [newRoutineTime, setNewRoutineTime] = useState('Her gün 09:00');
  const [newRoutinePrompt, setNewRoutinePrompt] = useState('');
  const [newRoutineModel, setNewRoutineModel] =
    useState<LuxoModelId>('luxo-flash');

  const isSearching = searchQuery.trim().length > 0;
  const searchResults = searchSidebarChats(chats, searchQuery);
  const totalMatchCount = isSearching
    ? searchResults.reduce((acc, item) => acc + item.matchCount, 0)
    : 0;
  const visibleResults =
    isSearching || showAllChats ? searchResults : searchResults.slice(0, 8);

  const handleCreateRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineTitle.trim() || !newRoutinePrompt.trim()) return;
    onAddRoutine({
      title: sanitizeLuxoBrand(newRoutineTitle.trim()),
      time: newRoutineTime.trim() || 'Her gün 09:00',
      modelId: newRoutineModel,
      prompt: sanitizeLuxoBrand(newRoutinePrompt.trim()),
      active: true,
      lastRun: 'Yeni oluşturuldu',
    });
    setNewRoutineTitle('');
    setNewRoutinePrompt('');
    setShowNewRoutineForm(false);
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      <aside
        aria-hidden={!isOpen}
        className={`fixed top-0 left-0 bottom-0 h-[100dvh] max-h-[100dvh] w-[310px] max-w-[88vw] bg-white dark:bg-[#18181b] z-50 flex flex-col justify-between shadow-2xl transition-all duration-300 ease-in-out border-r border-neutral-200 dark:border-neutral-800 overflow-hidden ${
          isOpen
            ? 'translate-x-0 visible'
            : '-translate-x-full invisible pointer-events-none'
        }`}
      >
        <div className="p-4 pb-2 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <LuxoLogo
                className="w-6 h-6 text-black dark:text-white"
                size={24}
              />
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
                Luxo AI
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  onNewChat();
                  onClose();
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                aria-label="Yeni Sohbet"
                title="Yeni Sohbet"
              >
                <SquarePen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenSettings();
                  onClose();
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                aria-label="Ayarlar"
                title="Ayarlar"
              >
                <Settings className="w-4 h-4" />
              </button>
              {onOpenKeyboardShortcuts && (
                <button
                  type="button"
                  data-testid="sidebar-shortcuts-btn"
                  onClick={() => {
                    onOpenKeyboardShortcuts();
                    onClose();
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                  aria-label="Klavye Kısayolları"
                  title="Klavye Kısayolları (Ctrl+/)"
                >
                  <Keyboard className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                data-testid="sidebar-focus-search-btn"
                onClick={() => searchInputRef.current?.focus()}
                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                aria-label="Sohbet İçeriklerinde Ara"
                title="Sohbet İçeriklerinde Ara"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                aria-label="Menüyü Kapat"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Prominent Primary New Chat Button */}
          <button
            type="button"
            data-testid="sidebar-main-new-chat-btn"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 mb-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold text-xs shadow-md transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <SquarePen className="w-4 h-4" />
              <span>Yeni Sohbet Başlat</span>
            </div>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {PUBLIC_CHAT_MODEL_IDS.length} AI
            </span>
          </button>

          {/* Persistent Global Search Across Past Chat Threads & Messages */}
          <div className="mb-2 space-y-1">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                data-testid="sidebar-chat-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Geçmiş sohbet ve mesajlarda ara..."
                aria-label="Geçmiş sohbet ve mesajlarda ara"
                className="w-full pl-8 pr-8 py-2 bg-neutral-100 dark:bg-neutral-800/90 border border-neutral-200/70 dark:border-neutral-700/70 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/40"
              />
              {isSearching && (
                <button
                  type="button"
                  data-testid="sidebar-chat-search-clear"
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  aria-label="Aramayı temizle"
                  className="w-6 h-6 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-white absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {isSearching && (
              <div
                data-testid="sidebar-chat-search-summary"
                className="flex items-center justify-between px-1 text-[10px] font-medium text-neutral-500 dark:text-neutral-400"
              >
                <span>
                  {searchResults.length} sohbet · {totalMatchCount} eşleşme
                </span>
                <span>Başlık + tüm mesajlar</span>
              </div>
            )}
          </div>

        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2.5 min-h-0">
          {isSearching && (
            <div className="space-y-1" data-testid="sidebar-chat-list">
              {visibleResults.map((result) => {
                const { chat, matchedIn, matchCount, snippet } = result;
                return (
                  <div
                    key={chat.id}
                    data-testid={`sidebar-chat-item-${chat.id}`}
                    onClick={() => {
                      onSelectChat(chat.id);
                      onClose();
                    }}
                    className={`group px-3 py-2.5 rounded-2xl text-sm font-normal transition cursor-pointer ${
                      activeChatId === chat.id
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate pr-1 font-medium text-xs sm:text-sm">
                        {sanitizeLuxoBrand(chat.title)}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="px-1.5 py-0.5 rounded-md bg-blue-500/12 text-blue-600 dark:text-blue-400 text-[10px] font-bold tabular-nums">
                          {matchCount}×
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(chat.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-500 transition cursor-pointer shrink-0"
                          aria-label={`Sohbeti Sil: ${chat.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {snippet && (
                      <div
                        data-testid={`sidebar-chat-snippet-${chat.id}`}
                        className="mt-1 text-[11px] leading-snug text-neutral-500 dark:text-neutral-400 line-clamp-2"
                      >
                        <span className="font-semibold text-neutral-600 dark:text-neutral-300 mr-1">
                          {snippet.role === 'user'
                            ? 'Siz:'
                            : matchedIn === 'message'
                            ? 'Yanıt:'
                            : 'İçerik:'}
                        </span>
                        <span>{snippet.before}</span>
                        <mark className="bg-amber-200/80 dark:bg-amber-500/30 text-neutral-900 dark:text-amber-200 px-0.5 rounded-xs font-semibold">
                          {snippet.match}
                        </mark>
                        <span>{snippet.after}</span>
                      </div>
                    )}
                  </div>
                );
              })}
              {chats.length > 0 && searchResults.length === 0 && (
                <p
                  data-testid="sidebar-chat-search-empty"
                  className="text-xs text-neutral-500 dark:text-neutral-400 px-3 py-4 text-center"
                >
                  &ldquo;{searchQuery.trim()}&rdquo; ile eşleşen sohbet veya mesaj içeriği bulunamadı.
                </p>
              )}
            </div>
          )}

          {isSearching && (
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-2">
              <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Hızlı Menü
              </p>
            </div>
          )}

          <nav className="space-y-0.5">
            {onOpenDashboard && (
              <button
                type="button"
                data-testid="sidebar-nav-dashboard-btn"
                onClick={() => {
                  onOpenDashboard();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sm font-semibold text-neutral-900 dark:text-white bg-neutral-100/75 dark:bg-neutral-800/75 hover:bg-neutral-200/80 dark:hover:bg-neutral-800 transition cursor-pointer text-left"
              >
                <LayoutDashboard className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">Kişisel Kontrol Paneli (Dashboard)</span>
              </button>
            )}

            {onOpenVoiceCommands && (
              <button
                type="button"
                data-testid="sidebar-nav-voice-cmd-btn"
                onClick={() => {
                  onOpenVoiceCommands();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition cursor-pointer text-left"
              >
                <Mic className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="truncate">Sesli Komut Modu</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onOpenImages();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition cursor-pointer text-left"
            >
              <ImageIcon className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="truncate">Nano Banana & Veo Stüdyo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenEvolution();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition cursor-pointer text-left"
            >
              <Brain className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="truncate">Otonom Gelişim & AI Evrim</span>
            </button>

            {onOpenNotifications && (
              <button
                type="button"
                data-testid="sidebar-notifications-btn"
                onClick={() => {
                  onOpenNotifications();
                  onClose();
                }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-2xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Bell className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="truncate">Bildirim Merkezi</span>
                </div>
                {unreadNotificationCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold tabular-nums shrink-0">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>
            )}

            {onOpenSocial && (
              <button
                type="button"
                onClick={() => {
                  onOpenSocial();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition cursor-pointer text-left"
              >
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">Etkinlik Takvimi & Sosyal Ağ</span>
              </button>
            )}

            {onOpenContentStudio && (
              <button
                type="button"
                onClick={() => {
                  onOpenContentStudio();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition cursor-pointer text-left"
              >
                <SquarePen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="truncate">İçerik Stüdyosu (SEO & Blog)</span>
              </button>
            )}

            {onOpenHub && (
              <button
                type="button"
                onClick={() => {
                  onOpenHub();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition cursor-pointer text-left"
              >
                <Globe className="w-4 h-4 text-sky-500 shrink-0" />
                <span className="truncate">Topluluk, SEO & Performans</span>
              </button>
            )}

            {onOpenGmail && (
              <button
                type="button"
                data-testid="sidebar-nav-gmail-btn"
                onClick={() => {
                  onOpenGmail();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-2xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Mail className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="truncate">Gmail Çalışma Alanı</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  Google
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onOpenLibrary();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition cursor-pointer text-left"
            >
              <BookOpen className="w-4 h-4 text-neutral-600 dark:text-neutral-400 shrink-0" />
              <span className="truncate">Kitaplık</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenProjects();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition cursor-pointer text-left"
            >
              <Folder className="w-4 h-4 text-neutral-600 dark:text-neutral-400 shrink-0" />
              <span className="truncate">Projeler</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectModel('gemini-4-argon');
                onOpenStudio();
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-2xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Laptop className="w-4 h-4 text-emerald-500 group-hover:scale-105 transition shrink-0" />
                <span className="truncate">Argon Kod Stüdyosu</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold shrink-0 ml-1">
                MIT
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowScheduledModal(true)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition cursor-pointer text-left"
            >
              <Clock className="w-4 h-4 text-neutral-600 dark:text-neutral-400 shrink-0" />
              <span className="truncate">Zamanlandı</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenSettings('plugins');
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition cursor-pointer text-left"
            >
              <Settings className="w-4 h-4 text-neutral-600 dark:text-neutral-400 shrink-0" />
              <span className="truncate">Eklentiler</span>
            </button>

            {/* Direct Settings Access in Main Nav List */}
            <button
              type="button"
              data-testid="sidebar-nav-settings-btn"
              onClick={() => {
                onOpenSettings();
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-2xl text-sm font-semibold text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition cursor-pointer text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Settings className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="truncate">Ayarlar & Profil</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                Gelişmiş
              </span>
            </button>

            {/* Direct Feedback Access in Main Nav List */}
            <button
              type="button"
              data-testid="sidebar-nav-feedback-btn"
              onClick={() => {
                if (onOpenFeedback) {
                  onOpenFeedback();
                } else {
                  onOpenSettings('feedback');
                }
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-2xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition cursor-pointer text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <MessageSquarePlus className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="truncate">Geri Bildirim & Hata Bildir</span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                Destek
              </span>
            </button>

            {/* Direct Standalone Live Site Link */}
            <a
              href="https://ais-pre-fudupxh6ld5rvvbfz5qwt4-705459740809.europe-west2.run.app/"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="sidebar-nav-direct-link-btn"
              className="w-full flex items-center justify-between px-3 py-2 rounded-2xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition cursor-pointer text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="truncate">Doğrudan Canlı Siteye Gir</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            </a>

            {onToggleTheme && (
              <button
                type="button"
                data-testid="sidebar-nav-theme-toggle"
                onClick={onToggleTheme}
                className="w-full flex items-center justify-between px-3 py-2 rounded-2xl text-sm font-medium text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition cursor-pointer text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {isDarkTheme ? (
                    <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : (
                    <Moon className="w-4 h-4 text-neutral-600 dark:text-neutral-400 shrink-0" />
                  )}
                  <span className="truncate">
                    {isDarkTheme ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
                  </span>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neutral-200/60 dark:bg-neutral-700/60 text-neutral-600 dark:text-neutral-300">
                  {isDarkTheme ? 'Koyu' : 'Açık'}
                </span>
              </button>
            )}
          </nav>

          {!isSearching && (
            <>
              <div className="border-t border-neutral-200 dark:border-neutral-800 mx-1 pt-2">
                <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Geçmiş Sohbetler
                </p>
              </div>
              <div className="space-y-1" data-testid="sidebar-chat-list">
                {visibleResults.map((result) => {
                  const { chat } = result;
                  return (
                    <div
                      key={chat.id}
                      data-testid={`sidebar-chat-item-${chat.id}`}
                      onClick={() => {
                        onSelectChat(chat.id);
                        onClose();
                      }}
                      className={`group px-3 py-2.5 rounded-2xl text-sm font-normal transition cursor-pointer ${
                        activeChatId === chat.id
                          ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate pr-1 font-medium text-xs sm:text-sm">
                          {sanitizeLuxoBrand(chat.title)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(chat.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-500 transition cursor-pointer shrink-0"
                          aria-label={`Sohbeti Sil: ${chat.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {chats.length === 0 && (
                  <p className="text-xs text-neutral-400 px-3 py-4 text-center">
                    Henüz sohbet geçmişi yok.
                  </p>
                )}
                {searchResults.length > 8 && !showAllChats && (
                  <button
                    type="button"
                    onClick={() => setShowAllChats(true)}
                    className="w-full text-left px-3 py-2 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium transition cursor-pointer"
                  >
                    Tümünü gör ({searchResults.length})...
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="p-3 pb-8 sm:pb-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-1.5 shrink-0 bg-white dark:bg-[#18181b] z-20 shadow-lg">
          <button
            type="button"
            data-testid="sidebar-footer-new-chat-btn"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold rounded-full text-xs transition shadow-sm cursor-pointer whitespace-nowrap"
          >
            <SquarePen className="w-3.5 h-3.5" />
            <span>Sohbet</span>
          </button>

          <div className="flex items-center gap-1">
            {onToggleTheme && (
              <button
                type="button"
                data-testid="sidebar-theme-toggle-btn"
                onClick={onToggleTheme}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center transition active:scale-95 cursor-pointer border border-neutral-200 dark:border-neutral-700 shrink-0"
                aria-label={isDarkTheme ? 'Açık temaya geç' : 'Koyu temaya geç'}
                title={isDarkTheme ? 'Açık temaya geç' : 'Koyu temaya geç'}
              >
                {isDarkTheme ? (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-neutral-600" />
                )}
              </button>
            )}

            <button
              type="button"
              data-testid="sidebar-footer-feedback-btn"
              onClick={() => {
                if (onOpenFeedback) {
                  onOpenFeedback();
                } else {
                  onOpenSettings('feedback');
                }
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center transition active:scale-95 cursor-pointer border border-rose-200/60 dark:border-rose-800/40 shrink-0"
              aria-label="Geri Bildirim & Destek"
              title="Geri Bildirim & Hata Bildir"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
            </button>

            {user.isGuest ? (
              <button
                type="button"
                data-testid="sidebar-footer-auth-btn"
                onClick={() => {
                  onClose();
                  onOpenAuthModal();
                }}
                className="px-2 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-[10px] font-semibold text-neutral-800 dark:text-neutral-200 transition cursor-pointer whitespace-nowrap"
              >
                Giriş
              </button>
            ) : (
              onSignOut && (
                <button
                  type="button"
                  data-testid="sidebar-footer-signout-btn"
                  onClick={() => {
                    onClose();
                    onSignOut();
                  }}
                  aria-label="Oturumdan çıkış yap"
                  title="Çıkış Yap"
                  className="px-2 py-1.5 rounded-full bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-[10px] font-semibold flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Çıkış</span>
                </button>
              )
            )}

            <button
              type="button"
              data-testid="sidebar-footer-settings-btn"
              onClick={() => {
                onOpenSettings();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 text-xs font-bold flex items-center justify-center transition active:scale-95 cursor-pointer border border-neutral-300 dark:border-neutral-600 shrink-0 overflow-hidden"
              aria-label="Ayarlar ve Profil"
              title="Ayarlar ve Profil"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                user.avatarText || 'LX'
              )}
            </button>
          </div>
        </div>
      </aside>

      {showScheduledModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowScheduledModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg bg-white dark:bg-[#202123] rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Zamanlanmış Otomasyonlar & Görevler
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduledModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer"
                aria-label="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              Luxo AI&apos;ın belirlediğiniz saatlerde çalıştıracağı otomatik özet, kod inceleme ve araştırma rutinleri.
            </p>

            <div className="space-y-2.5 mb-4">
              {routines.map((routine) => {
                const rModel =
                  LUXO_MODELS[routine.modelId] || LUXO_MODELS['luxo-flash'];
                return (
                  <div
                    key={routine.id}
                    className="p-3.5 bg-neutral-50 dark:bg-[#2d2f34] rounded-2xl border border-neutral-200/70 dark:border-neutral-700/70 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <ModelBrandAvatar
                        name={rModel.name}
                        logoUrl={rModel.logoUrl}
                        accentColor={rModel.accentColor}
                        sizeClass="w-8 h-8 rounded-xl"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {routine.title}
                        </h4>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                          {routine.time} · {rModel.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setShowScheduledModal(false);
                          onClose();
                          onRunRoutineNow(routine);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
                      >
                        <Play className="w-3 h-3" />
                        <span>Şimdi Çalıştır</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleRoutine(routine.id)}
                        className="p-1 cursor-pointer text-blue-500 hover:scale-105 transition"
                        aria-label={`${routine.title} durumunu değiştir`}
                      >
                        {routine.active ? (
                          <ToggleRight className="w-6 h-6 text-blue-500" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-neutral-400" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {showNewRoutineForm ? (
              <form
                onSubmit={handleCreateRoutine}
                className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 space-y-3 mb-4"
              >
                <input
                  type="text"
                  value={newRoutineTitle}
                  onChange={(e) => setNewRoutineTitle(e.target.value)}
                  placeholder="Görev adı (Örn: Günlük Yazılım & Mimari Özeti)"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#18181b] text-xs text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newRoutineTime}
                    onChange={(e) => setNewRoutineTime(e.target.value)}
                    placeholder="Zaman (Örn: Her gün 09:00)"
                    className="px-3 py-2 rounded-xl bg-white dark:bg-[#18181b] text-xs text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 outline-none"
                  />
                  <select
                    value={newRoutineModel}
                    onChange={(e) =>
                      setNewRoutineModel(e.target.value as LuxoModelId)
                    }
                    className="px-3 py-2 rounded-xl bg-white dark:bg-[#18181b] text-xs text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 outline-none"
                  >
                    {Object.values(LUXO_MODELS).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={newRoutinePrompt}
                  onChange={(e) => setNewRoutinePrompt(e.target.value)}
                  placeholder="Çalıştırılacak Luxo AI komutu..."
                  rows={2}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#18181b] text-xs text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 outline-none resize-none"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Görevi Kaydet
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewRoutineForm(false)}
                    className="px-3 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    Vazgeç
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewRoutineForm(true)}
                className="w-full py-2.5 mb-3 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Zamanlanmış Görev Ekle</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowScheduledModal(false)}
              className="w-full py-2.5 text-xs font-semibold bg-neutral-900 dark:bg-white text-white dark:text-black rounded-full hover:opacity-90 transition cursor-pointer"
            >
              Tamam
            </button>
          </div>
        </div>
      )}
    </>
  );
};
