import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowUpDown,
  BookOpen,
  Brain,
  Calendar,
  Check,
  Columns2,
  Folder,
  Globe,
  LayoutDashboard,
  Lock,
  MessageSquare,
  Mic,
  Moon,
  PenLine,
  Plus,
  Search,
  Sparkles,
  Sun,
  Users,
  Video,
  X,
} from 'lucide-react';
import type {
  ChatThread,
  LibraryItem,
  LuxoModelId,
  LuxoProject,
  LuxoUser,
} from '../types/luxo';
import { canAccessModel, LUXO_MODELS, LUXO_MODEL_IDS } from '../utils/luxoLogic';
import {
  buildSearchSuggestions,
  executeEnhancedSearch,
  type SearchableItem,
  type SearchDateRange,
  type SearchItemCategory,
  type SearchSortBy,
} from '../utils/searchEngine';
import { BLOG_ARTICLES, createInitialCommunityState } from '../utils/seoPerfEngagementEngine';
import { createInitialSocialPlatformState } from '../utils/socialPlatformEngine';
import { LuxoLogo } from './LuxoLogo';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: LuxoUser;
  activeModelId: LuxoModelId;
  isDarkTheme: boolean;
  chats?: ChatThread[];
  libraryItems?: LibraryItem[];
  projects?: LuxoProject[];
  onSelectModel: (modelId: LuxoModelId) => void;
  onSelectChat?: (chatId: string) => void;
  onOpenLibrary?: () => void;
  onOpenProjects?: () => void;
  onNewChat: () => void;
  onOpenImages: () => void;
  onOpenDashboard?: () => void;
  onOpenModelMetrics?: () => void;
  onOpenVoiceCommands?: () => void;
  onOpenEvolution: () => void;
  onOpenHub?: () => void;
  onOpenContentStudio?: () => void;
  onOpenSocial?: () => void;
  onOpenCollab: () => void;
  onToggleTheme: () => void;
  onEnableCompareMode: () => void;
  onOpenAuthModal: () => void;
  onOpenUpgradeModal: () => void;
}

const CATEGORY_TABS: { id: SearchItemCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  { id: 'action', label: 'İşlemler' },
  { id: 'model', label: 'Modeller' },
  { id: 'chat', label: 'Sohbetler' },
  { id: 'community', label: 'Topluluk & Blog' },
  { id: 'library', label: 'Kitaplık' },
  { id: 'project', label: 'Projeler' },
  { id: 'event', label: 'Etkinlikler' },
];

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  user,
  activeModelId,
  isDarkTheme,
  chats = [],
  libraryItems = [],
  projects = [],
  onSelectModel,
  onSelectChat,
  onOpenLibrary,
  onOpenProjects,
  onNewChat,
  onOpenImages,
  onOpenDashboard,
  onOpenModelMetrics,
  onOpenVoiceCommands,
  onOpenEvolution,
  onOpenHub,
  onOpenContentStudio,
  onOpenSocial,
  onOpenCollab,
  onToggleTheme,
  onEnableCompareMode,
  onOpenAuthModal,
  onOpenUpgradeModal,
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchItemCategory | 'all'>('all');
  const [dateRange, setDateRange] = useState<SearchDateRange>('all');
  const [sortBy, setSortBy] = useState<SearchSortBy>('relevance');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setCategory('all');
      setDateRange('all');
      setSortBy('relevance');
      const t = setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const nowSnapshot = useMemo(() => Date.now(), [isOpen]);

  const searchableItems = useMemo<SearchableItem[]>(() => {
    const items: SearchableItem[] = [];

    // 1. Actions
    const actions: {
      id: string;
      title: string;
      subtitle: string;
      keywords: string[];
      badge: string;
    }[] = [
      {
        id: 'new-chat',
        title: 'Yeni Sohbet Başlat',
        subtitle: 'Temiz bir konuşma ekranı aç',
        keywords: ['sohbet', 'yeni', 'mesaj'],
        badge: 'Eylem',
      },
      {
        id: 'compare',
        title: 'Yan Yana İki Modeli Karşılaştır',
        subtitle: 'Gemini 4 Hydrogen, Claude 4.6, ChatGPT-5o veya DeepSeek R2 eşzamanlı yanıt',
        keywords: ['karşılaştır', 'compare', 'iki model'],
        badge: 'Mod',
      },
      {
        id: 'media',
        title: 'Nano Banana 4K & Google Veo Video Stüdyosu',
        subtitle: '4K UHD görsel ve 60fps MP4 sinema üret',
        keywords: ['görsel', 'video', 'nano banana', 'veo', '4k'],
        badge: 'Stüdyo',
      },
      {
        id: 'evolution',
        title: 'Otonom Gelişim & Öz-Onarım Merkezi',
        subtitle: `${LUXO_MODEL_IDS.length} modelin kendi kendini geliştirmesi, dashboard ve performans grafiği`,
        keywords: ['evrim', 'otonom', 'gelişim', 'grafik', 'dashboard'],
        badge: 'Merkez',
      },
      {
        id: 'collab',
        title: 'Canlı Ortak Çalışma Odasını Aç',
        subtitle: 'Gerçek zamanlı çok kullanıcılı belge ve sohbet',
        keywords: ['ortak', 'collab', 'oda', 'ekip'],
        badge: 'Canlı',
      },
      {
        id: 'theme',
        title: isDarkTheme ? 'Açık Temaya Geç' : 'Koyu Temaya Geç',
        subtitle: 'Görünüm kontrastını anında değiştir',
        keywords: ['tema', 'koyu', 'açık', 'dark', 'light'],
        badge: 'Görünüm',
      },
    ];

    if (onOpenDashboard) {
      actions.push({
        id: 'dashboard',
        title: 'Kişisel Kontrol Paneli (Personal Dashboard)',
        subtitle: 'Proje istatistikleri, sabitlenmiş alanlar, model uyarıları ve son kitaplık öğeleri',
        keywords: ['dashboard', 'panel', 'özet', 'widget', 'sabitlenen'],
        badge: 'Panel',
      });
    }
    if (onOpenModelMetrics) {
      actions.push({
        id: 'model-metrics',
        title: '113 AI Modeli Performans, Gecikme & Maliyet Paneli',
        subtitle: 'Model hızı (ms), token maliyeti ve kullanım geçmişine göre en uygun modeli seçin',
        keywords: ['metrik', 'performans', 'gecikme', 'maliyet', 'latency', 'cost'],
        badge: 'Metrik',
      });
    }
    if (onOpenVoiceCommands) {
      actions.push({
        id: 'voice-cmd',
        title: 'Sesli Komut Modu (Voice Command Mode)',
        subtitle: 'Doğal dil komutlarıyla tema, yeni proje, kitaplık ve model kontrolü',
        keywords: ['ses', 'komut', 'mikrofon', 'voice', 'dark mode'],
        badge: 'Ses',
      });
    }
    if (onOpenSocial) {
      actions.push({
        id: 'social',
        title: 'Etkinlik Takvimi, Duyurular & Özel Sohbet Odaları',
        subtitle: 'Etkinlikleri favorile, arkadaş ekle, profil oluştur ve özel oda kur',
        keywords: ['takvim', 'sosyal', 'etkinlik', 'duyuru'],
        badge: 'Sosyal',
      });
    }
    if (onOpenContentStudio) {
      actions.push({
        id: 'content-studio',
        title: 'İçerik Stüdyosu: SEO Meta, Blog Başlığı & Doğrudan Yayın',
        subtitle: 'SEO uyumlu başlık ve meta açıklama üretip doğrudan siteye makale yayınla',
        keywords: ['içerik', 'seo', 'blog', 'makale'],
        badge: 'Stüdyo',
      });
    }
    if (onOpenHub) {
      actions.push({
        id: 'hub',
        title: 'SEO, Performans & Topluluk Merkezini Aç',
        subtitle: 'Teknik SEO denetimi, hız hesaplayıcısı, forum, blog, anket ve SSS',
        keywords: ['seo', 'topluluk', 'forum', 'performans'],
        badge: 'Keşfet',
      });
    }

    for (const act of actions) {
      items.push({
        id: `act-${act.id}`,
        title: act.title,
        subtitle: act.subtitle,
        category: 'action',
        timestamp: nowSnapshot,
        keywords: act.keywords,
        badge: act.badge,
        actionId: act.id,
      });
    }

    // 2. Models
    for (const mId of LUXO_MODEL_IDS) {
      const m = LUXO_MODELS[mId];
      const access = canAccessModel(mId, user);
      items.push({
        id: `model-${mId}`,
        title: m.name,
        subtitle: `${m.category} · ${m.contextWindow} · ${m.tagline}`,
        category: 'model',
        timestamp: nowSnapshot - 3600 * 1000,
        keywords: [m.category, m.badge, ...m.capabilities, m.id],
        badge: m.badge,
        modelId: mId,
        isLocked: !access.allowed,
        accentColor: m.accentColor,
      });
    }

    // 3. Chats
    for (const chat of chats) {
      items.push({
        id: `chat-${chat.id}`,
        title: chat.title || 'Adsız Sohbet',
        subtitle: `${LUXO_MODELS[chat.modelId]?.name || chat.modelId} · ${chat.messages.length} mesaj`,
        category: 'chat',
        timestamp: chat.updatedAt || chat.createdAt || nowSnapshot,
        keywords: [
          'sohbet',
          chat.modelId,
          chat.messages[chat.messages.length - 1]?.content?.slice(0, 60) || '',
        ],
        badge: 'Sohbet',
        chatId: chat.id,
      });
    }

    // 4. Library items
    for (const lib of libraryItems) {
      const parsedTime = Date.parse(lib.createdAt);
      items.push({
        id: `lib-${lib.id}`,
        title: lib.title,
        subtitle: lib.summary,
        category: 'library',
        timestamp: Number.isFinite(parsedTime) ? parsedTime : nowSnapshot - 2 * 86400 * 1000,
        keywords: ['kitaplık', lib.type, lib.tab],
        badge: lib.tab,
        actionId: 'library',
      });
    }

    // 5. Projects
    for (const proj of projects) {
      items.push({
        id: `proj-${proj.id}`,
        title: proj.name,
        subtitle: `${proj.category} · ${proj.description}`,
        category: 'project',
        timestamp: proj.updatedAt || nowSnapshot - 86400 * 1000,
        keywords: ['proje', proj.category],
        badge: proj.category,
        actionId: 'projects',
      });
    }

    // 6. Community Blog & Forum
    for (const art of BLOG_ARTICLES) {
      const ts = Date.parse(art.publishedIso) || nowSnapshot - 3 * 86400 * 1000;
      items.push({
        id: `blog-${art.id}`,
        title: art.title,
        subtitle: `${art.category} · ${art.summary}`,
        category: 'community',
        timestamp: ts,
        keywords: ['blog', 'makale', art.category, 'seo'],
        badge: 'Blog',
        actionId: 'hub',
      });
    }
    const seedHub = createInitialCommunityState(nowSnapshot);
    for (const th of seedHub.threads) {
      items.push({
        id: `forum-${th.id}`,
        title: th.title,
        subtitle: `${th.category} · ${th.replies.length} yanıt · ${th.upvotes} oy`,
        category: 'community',
        timestamp: th.createdAt,
        keywords: ['forum', th.category, th.authorName],
        badge: 'Forum',
        actionId: 'hub',
      });
    }

    // 7. Social Events
    const seedSocial = createInitialSocialPlatformState();
    for (const ev of seedSocial.events) {
      items.push({
        id: `event-${ev.id}`,
        title: ev.title,
        subtitle: `${ev.dateIso} ${ev.startTime} · ${ev.speakerName} · ${ev.location}`,
        category: 'event',
        timestamp: ev.createdAt || nowSnapshot,
        keywords: ['etkinlik', ev.category, ev.speakerName],
        badge: ev.category,
        actionId: 'social',
      });
    }

    return items;
  }, [
    chats,
    isDarkTheme,
    libraryItems,
    nowSnapshot,
    onOpenContentStudio,
    onOpenDashboard,
    onOpenHub,
    onOpenModelMetrics,
    onOpenSocial,
    onOpenVoiceCommands,
    projects,
    user,
  ]);

  const suggestions = useMemo(
    () => buildSearchSuggestions(searchableItems, query, 6),
    [query, searchableItems]
  );

  const results = useMemo(
    () =>
      executeEnhancedSearch(searchableItems, {
        query,
        category,
        dateRange,
        sortBy,
        now: nowSnapshot,
      }).slice(0, 60),
    [category, dateRange, nowSnapshot, query, searchableItems, sortBy]
  );

  if (!isOpen) return null;

  const runSearchItem = (item: SearchableItem) => {
    if (item.category === 'model' && item.modelId) {
      const access = canAccessModel(item.modelId, user);
      if (access.allowed) {
        onSelectModel(item.modelId);
        onClose();
      } else {
        onClose();
        if (access.reason === 'guest') {
          onOpenAuthModal();
        } else {
          onOpenUpgradeModal();
        }
      }
      return;
    }

    if (item.category === 'chat' && item.chatId && onSelectChat) {
      onSelectChat(item.chatId);
      onClose();
      return;
    }

    switch (item.actionId) {
      case 'new-chat':
        onNewChat();
        break;
      case 'compare':
        onEnableCompareMode();
        break;
      case 'media':
        onOpenImages();
        break;
      case 'evolution':
        onOpenEvolution();
        break;
      case 'dashboard':
        onOpenDashboard?.();
        break;
      case 'model-metrics':
        onOpenModelMetrics?.();
        break;
      case 'voice-cmd':
        onOpenVoiceCommands?.();
        break;
      case 'social':
        onOpenSocial?.();
        break;
      case 'content-studio':
        onOpenContentStudio?.();
        break;
      case 'hub':
        onOpenHub?.();
        break;
      case 'collab':
        onOpenCollab();
        break;
      case 'theme':
        onToggleTheme();
        break;
      case 'library':
        onOpenLibrary?.();
        break;
      case 'projects':
        onOpenProjects?.();
        break;
    }
    onClose();
  };

  const renderCategoryIcon = (item: SearchableItem) => {
    if (item.category === 'model') {
      return (
        <span
          className="w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0"
          style={{ backgroundColor: item.accentColor || '#4f46e5' }}
        >
          <LuxoLogo className="w-3.5 h-3.5 text-white" size={14} />
        </span>
      );
    }
    if (item.category === 'chat') {
      return <MessageSquare className="w-4 h-4 text-blue-500" />;
    }
    if (item.category === 'library') {
      return <BookOpen className="w-4 h-4 text-emerald-500" />;
    }
    if (item.category === 'project') {
      return <Folder className="w-4 h-4 text-amber-500" />;
    }
    if (item.category === 'community') {
      return <Globe className="w-4 h-4 text-sky-500" />;
    }
    if (item.category === 'event') {
      return <Calendar className="w-4 h-4 text-indigo-500" />;
    }
    if (item.actionId === 'dashboard') return <LayoutDashboard className="w-4 h-4 text-blue-600" />;
    if (item.actionId === 'model-metrics') return <Activity className="w-4 h-4 text-sky-600" />;
    if (item.actionId === 'voice-cmd') return <Mic className="w-4 h-4 text-emerald-500" />;
    if (item.actionId === 'new-chat') return <Plus className="w-4 h-4 text-blue-500" />;
    if (item.actionId === 'compare') return <Columns2 className="w-4 h-4 text-indigo-500" />;
    if (item.actionId === 'media') return <Video className="w-4 h-4 text-amber-500" />;
    if (item.actionId === 'evolution') return <Brain className="w-4 h-4 text-indigo-500" />;
    if (item.actionId === 'content-studio') return <PenLine className="w-4 h-4 text-indigo-500" />;
    if (item.actionId === 'collab') return <Users className="w-4 h-4 text-emerald-500" />;
    if (item.actionId === 'theme') {
      return isDarkTheme ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-4 h-4 text-slate-600" />
      );
    }
    return <Sparkles className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gelişmiş Arama ve Komut Merkezi"
      data-testid="enhanced-search-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-16 px-4 bg-black/55 backdrop-blur-xs select-none"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-[#1e1f23] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[84vh]">
        {/* Search Input Row */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-200 dark:border-neutral-800">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Modeller (${LUXO_MODEL_IDS.length}), sohbetler, topluluk, projeler ve işlemler içinde ara...`}
            aria-label="Gelişmiş arama kutusu"
            data-testid="enhanced-search-input"
            className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Aramayı temizle"
              className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
            >
              Temizle
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Aramayı Kapat"
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auto-Suggestions Bar */}
        {suggestions.length > 0 && (
          <div
            data-testid="search-autosuggestions"
            className="px-4 py-2 bg-neutral-50 dark:bg-[#18181b] border-b border-neutral-200/70 dark:border-neutral-800 flex items-center gap-1.5 overflow-x-auto"
          >
            <span className="text-[11px] font-semibold text-neutral-400 shrink-0 mr-1">
              Öneriler:
            </span>
            {suggestions.map((sug) => (
              <button
                key={`${sug.category}-${sug.text}`}
                type="button"
                onClick={() => setQuery(sug.text)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-neutral-200 dark:border-neutral-700 text-[11px] font-medium text-neutral-700 dark:text-neutral-200 transition cursor-pointer whitespace-nowrap shrink-0"
              >
                {sug.text}
              </button>
            ))}
          </div>
        )}

        {/* Advanced Filtering & Sorting Row */}
        <div className="px-4 py-2.5 border-b border-neutral-200/80 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto max-w-full">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                data-testid={`search-cat-${tab.id}`}
                onClick={() => setCategory(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                  category === tab.id
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as SearchDateRange)}
              aria-label="Tarih filtresi"
              data-testid="search-date-filter"
              className="px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[11px] font-semibold text-neutral-700 dark:text-neutral-200 cursor-pointer outline-none"
            >
              <option value="all">Tüm Zamanlar</option>
              <option value="24h">Son 24 Saat</option>
              <option value="7d">Son 7 Gün</option>
              <option value="30d">Son 30 Gün</option>
            </select>

            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              <ArrowUpDown className="w-3 h-3 text-neutral-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SearchSortBy)}
                aria-label="Sıralama ölçütü"
                data-testid="search-sort-select"
                className="bg-transparent text-[11px] font-semibold text-neutral-700 dark:text-neutral-200 cursor-pointer outline-none"
              >
                <option value="relevance">En İlgili</option>
                <option value="date_desc">En Yeni</option>
                <option value="date_asc">En Eski</option>
                <option value="title_asc">Başlık (A–Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="px-4 py-1.5 bg-neutral-50/70 dark:bg-[#18181b] border-b border-neutral-100 dark:border-neutral-800/80 text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center justify-between tabular-nums">
          <span data-testid="search-results-count">
            {results.length} sonuç listeleniyor
          </span>
          <span>ESC ile kapat</span>
        </div>

        {/* Results Feed */}
        <div data-testid="search-results-list" className="overflow-y-auto p-3 space-y-1">
          {results.length === 0 ? (
            <div className="py-10 text-center space-y-1.5">
              <Search className="w-7 h-7 text-neutral-300 dark:text-neutral-600 mx-auto" />
              <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                Filtrelerle eşleşen sonuç bulunamadı.
              </p>
              <p className="text-[11px] text-neutral-400">
                Farklı bir arama kelimesi yazın veya tarih/kategori filtresini genişletin.
              </p>
            </div>
          ) : (
            results.map(({ item }) => {
              const isSelectedModel =
                item.category === 'model' && item.modelId === activeModelId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => runSearchItem(item)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl transition text-left cursor-pointer ${
                    isSelectedModel
                      ? 'bg-blue-50 dark:bg-blue-950/35 border border-blue-500/40'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/70 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {item.category === 'model' ? (
                      renderCategoryIcon(item)
                    ) : (
                      <div className="w-7 h-7 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                        {renderCategoryIcon(item)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                        {item.badge}
                      </span>
                    )}
                    {item.isLocked && (
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    {isSelectedModel && (
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
