import React, { useMemo, useRef, useState } from 'react';
import {
  Bell,
  BookOpen,
  Bot,
  Brain,
  Calendar,
  Clock,
  Columns2,
  Compass,
  Database,
  Folder,
  Globe,
  Home,
  Image as ImageIcon,
  Keyboard,
  Laptop,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  MessageSquarePlus,
  Mic,
  Moon,
  PanelLeftClose,
  Play,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  SquarePen,
  Sun,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Workflow,
  X,
} from 'lucide-react';
import {
  AppView,
  ChatThread,
  LuxoModelId,
  LuxoUser,
  ProviderConnectionStatusMap,
  ScheduledRoutine,
} from '../types/luxo';
import {
  LUXO_MODELS,
  PUBLIC_CHAT_MODEL_IDS,
  sanitizeLuxoBrand,
} from '../utils/luxoLogic';
import {
  DEFAULT_PROVIDER_STATUS,
  isModelExecutableWithProviders,
} from '../utils/tokenLimitsEngine';
import {
  searchSidebarChats,
  type SidebarChatSearchResult,
} from '../utils/sidebarChatSearch';
import { LuxoLogo, ModelBrandAvatar } from './LuxoLogo';

interface SidebarDrawerProps {
  isOpen: boolean;
  isDesktopOpen?: boolean;
  onToggleDesktop?: () => void;
  onClose: () => void;
  currentView?: AppView;
  chats: ChatThread[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onOpenHome?: () => void;
  onOpenModels?: () => void;
  onOpenArena?: () => void;
  onOpenAssistants?: () => void;
  onOpenKnowledge?: () => void;
  onOpenPrompts?: () => void;
  onOpenWorkflows?: () => void;
  onOpenAdmin?: () => void;
  isAdminUser?: boolean;
  zeroCostEnabled?: boolean;
  connectedProviderCount?: number;
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
  providerStatus?: ProviderConnectionStatusMap;
  isDarkTheme?: boolean;
  onToggleTheme?: () => void;
}

type ChronologicalBucketLabel = 'Bugün' | 'Dün' | 'Önceki Günler';

function groupChatsChronologically(
  results: SidebarChatSearchResult[]
): { label: ChronologicalBucketLabel; items: SidebarChatSearchResult[] }[] {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

  const today: SidebarChatSearchResult[] = [];
  const yesterday: SidebarChatSearchResult[] = [];
  const older: SidebarChatSearchResult[] = [];

  for (const item of results) {
    const ts = item.chat.updatedAt || item.chat.createdAt || 0;
    if (ts >= startOfToday) {
      today.push(item);
    } else if (ts >= startOfYesterday) {
      yesterday.push(item);
    } else {
      older.push(item);
    }
  }

  const buckets: {
    label: ChronologicalBucketLabel;
    items: SidebarChatSearchResult[];
  }[] = [];
  if (today.length > 0) buckets.push({ label: 'Bugün', items: today });
  if (yesterday.length > 0) buckets.push({ label: 'Dün', items: yesterday });
  if (older.length > 0) buckets.push({ label: 'Önceki Günler', items: older });
  return buckets;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  isDesktopOpen = true,
  onToggleDesktop,
  onClose,
  currentView,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onOpenHome,
  onOpenModels,
  onOpenArena,
  onOpenAssistants,
  onOpenKnowledge,
  onOpenPrompts,
  onOpenWorkflows,
  onOpenAdmin,
  isAdminUser = false,
  zeroCostEnabled = false,
  connectedProviderCount,
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
  providerStatus = DEFAULT_PROVIDER_STATUS,
  isDarkTheme,
  onToggleTheme,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<'chats' | 'routines'>('chats');
  const [showAllChats, setShowAllChats] = useState(false);
  const [showScheduledModal, setShowScheduledModal] = useState(false);
  const [showNewRoutineForm, setShowNewRoutineForm] = useState(false);
  const [newRoutineTitle, setNewRoutineTitle] = useState('');
  const [newRoutineTime, setNewRoutineTime] = useState('Her gün 09:00');
  const [newRoutinePrompt, setNewRoutinePrompt] = useState('');
  const [newRoutineModel, setNewRoutineModel] =
    useState<LuxoModelId>('luxo-flash');
  const activeRoutinesCount = routines.filter((r) => r.active).length;

  const isSearching = searchQuery.trim().length > 0;
  const searchResults = useMemo(
    () => searchSidebarChats(chats, searchQuery),
    [chats, searchQuery]
  );
  const totalMatchCount = isSearching
    ? searchResults.reduce((acc, item) => acc + item.matchCount, 0)
    : 0;
  const visibleResults =
    isSearching || showAllChats ? searchResults : searchResults.slice(0, 12);

  const groupedChats = useMemo(
    () => (isSearching ? [] : groupChatsChronologically(visibleResults)),
    [isSearching, visibleResults]
  );

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
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      <aside
        data-testid="workspace-sidebar-rail"
        className={`fixed lg:static top-0 left-0 bottom-0 h-[100dvh] lg:h-full max-h-[100dvh] bg-[#f8fafc] dark:bg-[#111420] z-50 lg:z-20 flex flex-col justify-between border-r border-slate-200/80 dark:border-slate-800/80 overflow-hidden transition-all duration-200 ease-out shrink-0 ${
          isOpen
            ? 'translate-x-0 w-[290px] max-w-[85vw] visible shadow-2xl lg:shadow-none'
            : '-translate-x-full invisible pointer-events-none w-[290px]'
        } ${
          isDesktopOpen
            ? 'lg:translate-x-0 lg:w-[264px] lg:visible lg:pointer-events-auto'
            : 'lg:w-0 lg:border-r-0 lg:-translate-x-full lg:invisible lg:pointer-events-none'
        }`}
      >
        {/* Top Brand + New Chat + Search */}
        <div className="p-3 pb-2 shrink-0 space-y-2">
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => {
                if (onOpenHome) {
                  onOpenHome();
                  onClose();
                }
              }}
              className="flex items-center gap-2 min-w-0 cursor-pointer text-left"
            >
              <LuxoLogo
                className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0"
                size={20}
              />
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                Luxo AI
              </span>
            </button>

            <div className="flex items-center gap-0.5 shrink-0">
              {onToggleDesktop && (
                <button
                  type="button"
                  data-testid="sidebar-collapse-desktop-btn"
                  onClick={onToggleDesktop}
                  className="hidden lg:flex w-8 h-8 rounded-lg items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition cursor-pointer"
                  aria-label="Kenar Çubuğunu Daralt"
                  title="Kenar Çubuğunu Daralt"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Menüyü Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            type="button"
            data-testid="sidebar-main-new-chat-btn"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
          >
            <span className="flex items-center gap-2">
              <SquarePen className="w-3.5 h-3.5" />
              <span>Yeni Sohbet</span>
            </span>
            <span className="text-[10px] opacity-75 font-mono">⌘N</span>
          </button>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              data-testid="sidebar-chat-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sohbetlerde ara..."
              aria-label="Geçmiş sohbet ve mesajlarda ara"
              className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-[#0b0d14] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-violet-500"
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
                className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white absolute right-1 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {isSearching && (
            <div
              data-testid="sidebar-chat-search-summary"
              className="flex items-center justify-between px-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 tabular-nums"
            >
              <span>
                {searchResults.length} sohbet · {totalMatchCount} eşleşme
              </span>
            </div>
          )}

          <div
            role="tablist"
            aria-label="Kenar çubuğu sekmeleri"
            className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-[#0b0d14] border border-slate-200/60 dark:border-slate-800/80"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'chats'}
              data-testid="sidebar-tab-chats"
              onClick={() => setActiveTab('chats')}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                activeTab === 'chats'
                  ? 'bg-white dark:bg-[#181c2b] text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Sohbetler
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'routines'}
              data-testid="sidebar-tab-routines"
              onClick={() => setActiveTab('routines')}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition cursor-pointer tabular-nums ${
                activeTab === 'routines'
                  ? 'bg-white dark:bg-[#181c2b] text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Rutinler ({activeRoutinesCount})
            </button>
          </div>
        </div>

        {/* Scrollable Workspace Links & Chronological Chats */}
        <div className="flex-1 overflow-y-auto px-2.5 py-1.5 space-y-4 min-h-0">
          {activeTab === 'routines' ? (
            <div className="space-y-2" data-testid="sidebar-routines-list">
              {routines.map((routine) => {
                const rModel =
                  LUXO_MODELS[routine.modelId] || LUXO_MODELS['luxo-flash'];
                return (
                  <div
                    key={routine.id}
                    className="p-2.5 rounded-xl bg-white dark:bg-[#1c1d22] border border-neutral-200/80 dark:border-neutral-800 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                          {routine.title}
                        </div>
                        <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                          {routine.time} · {rModel.name}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleRoutine(routine.id)}
                        className="cursor-pointer shrink-0"
                        aria-label={`${routine.title} durumunu değiştir`}
                      >
                        {routine.active ? (
                          <ToggleRight className="w-5 h-5 text-blue-500" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-neutral-400" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-neutral-400 truncate">
                        {routine.lastRun || 'Hazır'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onRunRoutineNow(routine);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] font-semibold cursor-pointer shrink-0"
                      >
                        <Play className="w-2.5 h-2.5" />
                        <span>Çalıştır</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => setShowScheduledModal(true)}
                className="w-full py-2 px-2.5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:border-neutral-500 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Rutin Yönet &amp; Ekle</span>
              </button>
            </div>
          ) : !isSearching ? (
            <div className="space-y-3" data-testid="sidebar-chat-list">
              {groupedChats.map((bucket) => (
                <div key={bucket.label} className="space-y-0.5">
                  <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    {bucket.label}
                  </div>
                  {bucket.items.map(({ chat }) => (
                    <div
                      key={chat.id}
                      className={`group px-1.5 py-0.5 rounded-xl text-xs transition flex items-center justify-between gap-1 ${
                        activeChatId === chat.id
                          ? 'bg-violet-600/12 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 font-semibold border border-violet-500/25'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-[#181c2b] font-normal border border-transparent'
                      }`}
                    >
                      <button
                        type="button"
                        data-testid={`sidebar-chat-item-${chat.id}`}
                        onClick={() => {
                          onSelectChat(chat.id);
                          onClose();
                        }}
                        className="flex-1 min-w-0 text-left px-1.5 py-1.5 truncate cursor-pointer"
                      >
                        {sanitizeLuxoBrand(chat.title)}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteChat(chat.id)}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer shrink-0"
                        aria-label={`Sohbeti Sil: ${chat.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ))}

              {chats.length === 0 && (
                <p className="text-xs text-slate-400 px-2.5 py-3 text-center">
                  Henüz sohbet geçmişi yok.
                </p>
              )}

              {searchResults.length > 12 && !showAllChats && (
                <button
                  type="button"
                  onClick={() => setShowAllChats(true)}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition cursor-pointer"
                >
                  Tümünü gör ({searchResults.length})
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1" data-testid="sidebar-chat-list">
              {visibleResults.map((result) => {
                const { chat, matchedIn, matchCount, snippet } = result;
                return (
                  <button
                    key={chat.id}
                    type="button"
                    data-testid={`sidebar-chat-item-${chat.id}`}
                    onClick={() => {
                      onSelectChat(chat.id);
                      onClose();
                    }}
                    className={`w-full text-left group px-2.5 py-2 rounded-xl text-xs transition cursor-pointer ${
                      activeChatId === chat.id
                        ? 'bg-violet-600/12 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 font-semibold border border-violet-500/25'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-[#181c2b] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate pr-1 font-medium">
                        {sanitizeLuxoBrand(chat.title)}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0 tabular-nums">
                        {matchCount}×
                      </span>
                    </div>
                    {snippet && (
                      <div
                        data-testid={`sidebar-chat-snippet-${chat.id}`}
                        className="mt-1 text-[11px] leading-snug text-slate-500 dark:text-slate-400 line-clamp-2"
                      >
                        <span className="font-semibold text-slate-600 dark:text-slate-300 mr-1">
                          {snippet.role === 'user'
                            ? 'Siz:'
                            : matchedIn === 'message'
                            ? 'Yanıt:'
                            : 'İçerik:'}
                        </span>
                        <span>{snippet.before}</span>
                        <mark className="bg-amber-200/80 dark:bg-amber-500/30 text-slate-900 dark:text-amber-200 px-0.5 rounded-xs font-semibold">
                          {snippet.match}
                        </mark>
                        <span>{snippet.after}</span>
                      </div>
                    )}
                  </button>
                );
              })}
              {chats.length > 0 && searchResults.length === 0 && (
                <p
                  data-testid="sidebar-chat-search-empty"
                  className="text-xs text-slate-500 dark:text-slate-400 px-2.5 py-4 text-center"
                >
                  Eşleşen sohbet bulunamadı.
                </p>
              )}
            </div>
          )}

          {/* Luxo V2 Primary Platform Navigation */}
          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-0.5">
            <div className="px-2 pb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <span>Platform</span>
              {zeroCostEnabled && (
                <span className="text-emerald-600 dark:text-emerald-400">Zero-Cost</span>
              )}
            </div>

            {onOpenHome && (
              <button
                type="button"
                data-testid="sidebar-nav-home-btn"
                onClick={() => {
                  onOpenHome();
                  onClose();
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                  currentView === 'home'
                    ? 'bg-violet-600/12 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#181c2b]'
                }`}
              >
                <Home className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Ana Panel</span>
              </button>
            )}

            {onOpenModels && (
              <button
                type="button"
                data-testid="sidebar-nav-models-btn"
                onClick={() => {
                  onOpenModels();
                  onClose();
                }}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                  currentView === 'models'
                    ? 'bg-violet-600/12 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#181c2b]'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Compass className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Model Merkezi</span>
                </span>
                {typeof connectedProviderCount === 'number' && (
                  <span className="text-[10px] font-mono text-slate-400 tabular-nums shrink-0">
                    {connectedProviderCount}
                  </span>
                )}
              </button>
            )}

            {onOpenArena && (
              <button
                type="button"
                data-testid="sidebar-nav-arena-btn"
                onClick={() => {
                  onOpenArena();
                  onClose();
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                  currentView === 'arena'
                    ? 'bg-violet-600/12 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#181c2b]'
                }`}
              >
                <Columns2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Model Arena</span>
              </button>
            )}

            {onOpenAssistants && (
              <button
                type="button"
                data-testid="sidebar-nav-assistants-btn"
                onClick={() => {
                  onOpenAssistants();
                  onClose();
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                  currentView === 'assistants'
                    ? 'bg-violet-600/12 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#181c2b]'
                }`}
              >
                <Bot className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">AI Asistanlar</span>
              </button>
            )}

            {onOpenKnowledge && (
              <button
                type="button"
                data-testid="sidebar-nav-knowledge-btn"
                onClick={() => {
                  onOpenKnowledge();
                  onClose();
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                  currentView === 'knowledge'
                    ? 'bg-violet-600/12 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#181c2b]'
                }`}
              >
                <Database className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Bilgi Tabanı &amp; RAG</span>
              </button>
            )}

            {onOpenPrompts && (
              <button
                type="button"
                data-testid="sidebar-nav-prompts-btn"
                onClick={() => {
                  onOpenPrompts();
                  onClose();
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                  currentView === 'prompts'
                    ? 'bg-violet-600/12 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#181c2b]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">İstem Kitaplığı</span>
              </button>
            )}

            {onOpenWorkflows && (
              <button
                type="button"
                data-testid="sidebar-nav-workflows-btn"
                onClick={() => {
                  onOpenWorkflows();
                  onClose();
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                  currentView === 'workflows'
                    ? 'bg-violet-600/12 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#181c2b]'
                }`}
              >
                <Workflow className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">İş Akışları</span>
              </button>
            )}

            {onOpenAdmin && (
              <button
                type="button"
                data-testid="sidebar-nav-admin-btn"
                onClick={() => {
                  onOpenAdmin();
                  onClose();
                }}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer text-left ${
                  currentView === 'admin'
                    ? 'bg-violet-600/12 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#181c2b]'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                  <span className="truncate">Yönetim Merkezi</span>
                </span>
                {!isAdminUser && <Lock className="w-3 h-3 text-slate-400 shrink-0" />}
              </button>
            )}
          </div>

          {/* Clean Langdock Workspace Navigation */}
          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-0.5">
            <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Stüdyolar &amp; Araçlar
            </div>

            {onOpenDashboard && (
              <button
                type="button"
                data-testid="sidebar-nav-dashboard-btn"
                onClick={() => {
                  onOpenDashboard();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#181c2b] transition cursor-pointer text-left"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">Kontrol Paneli</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onOpenImages();
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#181c2b] transition cursor-pointer text-left"
            >
              <ImageIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">Görsel &amp; Video Stüdyosu</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenProjects();
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#181c2b] transition cursor-pointer text-left"
            >
              <Folder className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">Projeler</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenStudio();
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#181c2b] transition cursor-pointer text-left"
            >
              <Laptop className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">Kod Stüdyosu</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenEvolution();
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#181c2b] transition cursor-pointer text-left"
            >
              <Brain className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">AI Gelişim &amp; Benchmark</span>
            </button>

            <button
              type="button"
              data-testid="sidebar-nav-settings-btn"
              onClick={() => {
                onOpenSettings();
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#181c2b] transition cursor-pointer text-left"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">Ayarlar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenLibrary();
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/70 transition cursor-pointer text-left"
            >
              <BookOpen className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <span className="truncate">Kitaplık</span>
            </button>

            {onOpenVoiceCommands && (
              <button
                type="button"
                data-testid="sidebar-nav-voice-cmd-btn"
                onClick={() => {
                  onOpenVoiceCommands();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/70 transition cursor-pointer text-left"
              >
                <Mic className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="truncate">Sesli Komut Modu</span>
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
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/70 transition cursor-pointer text-left"
              >
                <Mail className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="truncate">Gmail Çalışma Alanı</span>
              </button>
            )}

            {onOpenSocial && (
              <button
                type="button"
                onClick={() => {
                  onOpenSocial();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/70 transition cursor-pointer text-left"
              >
                <Calendar className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="truncate">Etkinlik &amp; Sosyal Ağ</span>
              </button>
            )}

            {onOpenContentStudio && (
              <button
                type="button"
                onClick={() => {
                  onOpenContentStudio();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/70 transition cursor-pointer text-left"
              >
                <SquarePen className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="truncate">İçerik &amp; SEO Stüdyosu</span>
              </button>
            )}

            {onOpenHub && (
              <button
                type="button"
                onClick={() => {
                  onOpenHub();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/70 transition cursor-pointer text-left"
              >
                <Globe className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="truncate">Topluluk &amp; Performans</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowScheduledModal(true)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/70 transition cursor-pointer text-left"
            >
              <Clock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <span className="truncate">Zamanlanmış Görevler</span>
            </button>

            {onOpenNotifications && (
              <button
                type="button"
                data-testid="sidebar-notifications-btn"
                onClick={() => {
                  onOpenNotifications();
                  onClose();
                }}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/70 transition cursor-pointer text-left"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Bell className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span className="truncate">Bildirimler</span>
                </span>
                {unreadNotificationCount > 0 && (
                  <span className="text-[11px] font-semibold text-rose-500 tabular-nums shrink-0">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>
            )}

            {onOpenKeyboardShortcuts && (
              <button
                type="button"
                data-testid="sidebar-shortcuts-btn"
                onClick={() => {
                  onOpenKeyboardShortcuts();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/70 transition cursor-pointer text-left"
              >
                <Keyboard className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="truncate">Kısayollar</span>
              </button>
            )}

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
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/70 transition cursor-pointer text-left"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <span className="truncate">Geri Bildirim</span>
            </button>
          </div>

          {/* Hızlı Model Değiştir */}
          <div className="pt-2 border-t border-neutral-200/80 dark:border-neutral-800/80 space-y-1">
            <div className="px-2 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              Hızlı Model Değiştir
            </div>
            <div className="grid grid-cols-1 gap-0.5">
              {PUBLIC_CHAT_MODEL_IDS.slice(0, 6).map((mId) => {
                const m = LUXO_MODELS[mId];
                if (!m) return null;
                const avail = isModelExecutableWithProviders(
                  mId,
                  providerStatus,
                  user,
                  m.allowGuest !== false
                );
                return (
                  <button
                    key={mId}
                    type="button"
                    data-testid={`sidebar-quick-model-${mId}`}
                    onClick={() => {
                      if (avail.unlocked) {
                        onSelectModel(mId);
                        onClose();
                      } else if (avail.reason === 'guest_restricted') {
                        onClose();
                        onOpenAuthModal();
                      } else {
                        onOpenSettings('ai_tuning');
                        onClose();
                      }
                    }}
                    title={avail.unlocked ? m.name : `${m.name} (${avail.reasonLabelTr})`}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer text-left ${
                      avail.unlocked
                        ? 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/70 font-medium'
                        : 'text-neutral-400 dark:text-neutral-500 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <ModelBrandAvatar
                        name={m.name}
                        logoUrl={m.logoUrl}
                        provider={m.provider}
                        modelId={m.id}
                        accentColor={m.accentColor}
                        sizeClass="w-4 h-4 rounded-sm"
                      />
                      <span className="truncate">{m.name}</span>
                    </span>
                    {!avail.unlocked && (
                      <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="p-2.5 pb-6 sm:pb-2.5 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2 shrink-0 bg-[#f8fafc] dark:bg-[#111420]">
          <button
            type="button"
            data-testid="sidebar-footer-settings-btn"
            onClick={() => {
              onOpenSettings();
              onClose();
            }}
            className="flex items-center gap-2 min-w-0 flex-1 p-1.5 rounded-xl hover:bg-neutral-200/60 dark:hover:bg-neutral-800/70 transition cursor-pointer text-left"
            title="Ayarlar ve Profil"
          >
            <span className="w-7 h-7 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 text-[11px] font-bold flex items-center justify-center shrink-0 overflow-hidden">
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
            </span>
            <span className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate block">
                {user.name}
              </span>
              <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block truncate">
                {user.isGuest ? 'Misafir Oturumu' : user.workspaceType || 'Kişisel'}
              </span>
            </span>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            {onToggleTheme && (
              <button
                type="button"
                data-testid="sidebar-theme-toggle-btn"
                onClick={onToggleTheme}
                className="w-8 h-8 rounded-lg hover:bg-neutral-200/70 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 flex items-center justify-center transition cursor-pointer"
                aria-label={isDarkTheme ? 'Açık temaya geç' : 'Koyu temaya geç'}
                title={isDarkTheme ? 'Açık temaya geç' : 'Koyu temaya geç'}
              >
                {isDarkTheme ? (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                ) : (
                  <Moon className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            {user.isGuest ? (
              <button
                type="button"
                data-testid="sidebar-footer-auth-btn"
                onClick={() => {
                  onClose();
                  onOpenAuthModal();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[11px] font-semibold transition cursor-pointer whitespace-nowrap"
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
                  className="w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-neutral-500 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )
            )}
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
                  Zamanlanmış Otomasyonlar &amp; Görevler
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
                        <span>Çalıştır</span>
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
                  placeholder="Görev adı (Örn: Günlük Yazılım Özeti)"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#18181b] text-xs text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newRoutineTime}
                    onChange={(e) => setNewRoutineTime(e.target.value)}
                    placeholder="Zaman (Her gün 09:00)"
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
                className="w-full py-2.5 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:border-blue-500 hover:text-blue-500 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yeni Otomatik Görev Oluştur</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
