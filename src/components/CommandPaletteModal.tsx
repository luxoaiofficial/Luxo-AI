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
  GitBranch,
  Globe,
  HelpCircle,
  LayoutDashboard,
  Lock,
  MessageSquare,
  Mic,
  Moon,
  PenLine,
  Plus,
  Search,
  Sparkles,
  Star,
  Sun,
  Tag,
  Users,
  Video,
  Vote,
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
  extractAvailableTags,
  highlightMatchSegments,
  type SearchableItem,
  type SearchDateRange,
  type SearchItemCategory,
  type SearchSortBy,
} from '../utils/searchEngine';
import type { PublishedStudioArticle } from '../utils/contentStudioEngine';
import {
  BLOG_ARTICLES,
  type CommunityHubState,
  computeContentRatingSummary,
  createInitialCommunityState,
  hydrateCommunityState,
} from '../utils/seoPerfEngagementEngine';
import { createInitialSocialPlatformState } from '../utils/socialPlatformEngine';
import type { HubTabId } from './CommunitySeoHub';
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
  studioArticles?: PublishedStudioArticle[];
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
  onOpenHub?: (tab?: HubTabId) => void;
  onOpenContentStudio?: () => void;
  onOpenSocial?: () => void;
  onOpenGithubSettings?: () => void;
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

function HighlightedText({ text, query }: { text: string; query: string }) {
  const segments = highlightMatchSegments(text, query);
  return (
    <>
      {segments.map((seg, i) =>
        seg.matched ? (
          <mark
            key={i}
            className="bg-amber-200/80 dark:bg-indigo-500/40 text-inherit rounded-xs px-0.5"
          >
            {seg.text}
          </mark>
        ) : (
          <React.Fragment key={i}>{seg.text}</React.Fragment>
        )
      )}
    </>
  );
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  user,
  activeModelId,
  isDarkTheme,
  chats = [],
  libraryItems = [],
  projects = [],
  studioArticles = [],
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
  onOpenGithubSettings,
  onOpenCollab,
  onToggleTheme,
  onEnableCompareMode,
  onOpenAuthModal,
  onOpenUpgradeModal,
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchItemCategory | 'all'>('all');
  const [dateRange, setDateRange] = useState<SearchDateRange>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SearchSortBy>('relevance');
  const [liveCommunity, setLiveCommunity] = useState<CommunityHubState | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setCategory('all');
      setDateRange('all');
      setSelectedTag('all');
      setDateFrom('');
      setDateTo('');
      setMinRating(0);
      setSortBy('relevance');
      const t = setTimeout(() => inputRef.current?.focus(), 40);

      let cancelled = false;
      fetch('/api/community/state')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!cancelled && data?.state) {
            setLiveCommunity(hydrateCommunityState(data.state));
          }
        })
        .catch(() => {});

      return () => {
        cancelled = true;
        clearTimeout(t);
      };
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

    if (onOpenGithubSettings) {
      actions.push({
        id: 'github-settings',
        title: 'GitHub Depo Bağlantısı & CI/CD Yayınlama Bilgileri',
        subtitle: '.github/workflows/deploy-static.yml, GitHub Pages, repo URL ve push komutları',
        keywords: ['github', 'repo', 'workflow', 'actions', 'ci/cd', 'pages', 'deploy', 'netlify', 'git'],
        badge: 'GitHub',
      });
    }
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
        title: `${LUXO_MODEL_IDS.length} AI Modeli Performans, Gecikme & Maliyet Paneli`,
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
        keywords: ['içerik', 'seo', 'blog', 'makale', 'cms'],
        badge: 'Stüdyo',
      });
    }
    if (onOpenHub) {
      actions.push(
        {
          id: 'hub',
          title: 'SEO, Performans & Topluluk Merkezini Aç',
          subtitle: 'Teknik SEO denetimi, hız hesaplayıcısı, forum, blog, anket ve SSS',
          keywords: ['seo', 'topluluk', 'forum', 'performans'],
          badge: 'Keşfet',
        },
        {
          id: 'hub-polls-quiz',
          title: 'Canlı Topluluk Anketleri & Etkileşimli Bilgi Testi (Quiz)',
          subtitle: 'Yol haritasına oy ver, kendi anketini başlat ve 4 soruluk SEO & hız quizini çöz',
          keywords: ['anket', 'poll', 'oy', 'quiz', 'test', 'soru', 'topluluk'],
          badge: 'Anket & Quiz',
        },
        {
          id: 'hub-forum',
          title: 'AI Uzman Destekli Tartışma Forumu',
          subtitle: 'Teknik sorularını paylaş, topluluk yanıtları ve anında AI uzman sentezleri al',
          keywords: ['forum', 'tartışma', 'soru', 'yanıt', 'topluluk'],
          badge: 'Forum',
        }
      );
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

    const communitySnapshot = liveCommunity || createInitialCommunityState(nowSnapshot);
    const getRatingMeta = (contentKey: string) => {
      const summary = computeContentRatingSummary(
        communitySnapshot.contentRatings?.[contentKey]
      );
      return {
        ratingAvg: summary.average,
        ratingCount: summary.count,
      };
    };

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
        publishedIso: new Date(nowSnapshot - 3600 * 1000).toISOString().slice(0, 10),
        keywords: [m.category, m.badge, ...m.capabilities, m.id],
        tags: [m.category, ...m.capabilities.slice(0, 2)],
        badge: m.badge,
        modelId: mId,
        isLocked: !access.allowed,
        accentColor: m.accentColor,
      });
    }

    // 3. Chats
    for (const chat of chats) {
      const ts = chat.updatedAt || chat.createdAt || nowSnapshot;
      items.push({
        id: `chat-${chat.id}`,
        title: chat.title || 'Adsız Sohbet',
        subtitle: `${LUXO_MODELS[chat.modelId]?.name || chat.modelId} · ${chat.messages.length} mesaj`,
        category: 'chat',
        timestamp: ts,
        publishedIso: new Date(ts).toISOString().slice(0, 10),
        keywords: [
          'sohbet',
          chat.modelId,
          chat.messages[chat.messages.length - 1]?.content?.slice(0, 60) || '',
        ],
        tags: ['Sohbet', LUXO_MODELS[chat.modelId]?.category || 'AI'],
        badge: 'Sohbet',
        chatId: chat.id,
      });
    }

    // 4. Library items
    for (const lib of libraryItems) {
      const parsedTime = Date.parse(lib.createdAt);
      const ts = Number.isFinite(parsedTime) ? parsedTime : nowSnapshot - 2 * 86400 * 1000;
      const rMeta = getRatingMeta(`library:${lib.id}`);
      items.push({
        id: `lib-${lib.id}`,
        title: lib.title,
        subtitle: lib.summary,
        category: 'library',
        timestamp: ts,
        publishedIso: new Date(ts).toISOString().slice(0, 10),
        keywords: ['kitaplık', lib.type, lib.tab],
        tags: ['Kitaplık', lib.tab],
        ratingAvg: rMeta.ratingAvg,
        ratingCount: rMeta.ratingCount,
        badge: lib.tab,
        actionId: 'library',
      });
    }

    // 5. Projects
    for (const proj of projects) {
      const ts = proj.updatedAt || nowSnapshot - 86400 * 1000;
      items.push({
        id: `proj-${proj.id}`,
        title: proj.name,
        subtitle: `${proj.category} · ${proj.description}`,
        category: 'project',
        timestamp: ts,
        publishedIso: new Date(ts).toISOString().slice(0, 10),
        keywords: ['proje', proj.category],
        tags: ['Proje', proj.category],
        badge: proj.category,
        actionId: 'projects',
      });
    }

    // 6. Community Blog, CMS Articles, Polls & Forum
    for (const cmsArt of studioArticles) {
      if (cmsArt.status !== 'published') continue;
      const ts = cmsArt.createdAt || Date.parse(cmsArt.publishedIso) || nowSnapshot;
      const rMeta = getRatingMeta(`cms:${cmsArt.id}`);
      items.push({
        id: `cms-${cmsArt.id}`,
        title: cmsArt.title,
        subtitle: `${cmsArt.category} · ${cmsArt.authorName || 'Yazar'} · ${cmsArt.summary}`,
        category: 'community',
        timestamp: ts,
        publishedIso: cmsArt.publishedIso,
        keywords: ['cms', 'blog', 'makale', cmsArt.category, cmsArt.focusKeyword || 'seo'],
        tags: ['CMS Blog', cmsArt.category, cmsArt.focusKeyword || 'SEO'],
        ratingAvg: rMeta.ratingAvg,
        ratingCount: rMeta.ratingCount,
        badge: 'CMS Blog',
        actionId: 'hub-polls-quiz',
      });
    }

    for (const art of BLOG_ARTICLES) {
      const ts = Date.parse(art.publishedIso) || nowSnapshot - 3 * 86400 * 1000;
      const rMeta = getRatingMeta(`blog:${art.id}`);
      items.push({
        id: `blog-${art.id}`,
        title: art.title,
        subtitle: `${art.category} · ${art.summary}`,
        category: 'community',
        timestamp: ts,
        publishedIso: art.publishedIso,
        keywords: ['blog', 'makale', art.category, 'seo'],
        tags: ['Blog', art.category, 'SEO'],
        ratingAvg: rMeta.ratingAvg,
        ratingCount: rMeta.ratingCount,
        badge: 'Blog',
        actionId: 'hub-polls-quiz',
      });
    }

    for (const poll of communitySnapshot.polls) {
      const ts = communitySnapshot.updatedAt || nowSnapshot;
      items.push({
        id: `poll-${poll.id}`,
        title: poll.question,
        subtitle: `${poll.category} · ${poll.totalVotes} oy · ${poll.options.map((o) => o.label).join(' / ')}`,
        category: 'community',
        timestamp: ts,
        publishedIso: new Date(ts).toISOString().slice(0, 10),
        keywords: ['anket', 'poll', 'oylama', poll.category],
        tags: ['Anket', poll.category],
        badge: 'Anket',
        actionId: 'hub-polls-quiz',
      });
    }

    for (const th of communitySnapshot.threads) {
      const rMeta = getRatingMeta(`forum:${th.id}`);
      items.push({
        id: `forum-${th.id}`,
        title: th.title,
        subtitle: `${th.category} · ${th.replies.length} yanıt · ${th.upvotes} oy`,
        category: 'community',
        timestamp: th.createdAt,
        publishedIso: new Date(th.createdAt).toISOString().slice(0, 10),
        keywords: ['forum', 'tartışma', th.category, th.authorName],
        tags: ['Forum', th.category],
        ratingAvg: rMeta.ratingAvg,
        ratingCount: rMeta.ratingCount,
        badge: 'Forum',
        actionId: 'hub-forum',
      });
    }

    // 7. Social Events
    const seedSocial = createInitialSocialPlatformState();
    for (const ev of seedSocial.events) {
      const ts = ev.createdAt || nowSnapshot;
      const rMeta = getRatingMeta(`event:${ev.id}`);
      items.push({
        id: `event-${ev.id}`,
        title: ev.title,
        subtitle: `${ev.dateIso} ${ev.startTime} · ${ev.speakerName} · ${ev.location}`,
        category: 'event',
        timestamp: ts,
        publishedIso: ev.dateIso,
        keywords: ['etkinlik', ev.category, ev.speakerName],
        tags: ['Etkinlik', ev.category],
        ratingAvg: rMeta.ratingAvg,
        ratingCount: rMeta.ratingCount,
        badge: ev.category,
        actionId: 'social',
      });
    }

    return items;
  }, [
    chats,
    isDarkTheme,
    libraryItems,
    liveCommunity,
    nowSnapshot,
    onOpenContentStudio,
    onOpenDashboard,
    onOpenGithubSettings,
    onOpenHub,
    onOpenModelMetrics,
    onOpenSocial,
    onOpenVoiceCommands,
    projects,
    studioArticles,
    user,
  ]);

  const availableTags = useMemo(
    () => extractAvailableTags(searchableItems).slice(0, 12),
    [searchableItems]
  );

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
        tag: selectedTag,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        minRating: minRating > 0 ? minRating : undefined,
        sortBy,
        now: nowSnapshot,
      }).slice(0, 60),
    [
      category,
      dateFrom,
      dateRange,
      dateTo,
      minRating,
      nowSnapshot,
      query,
      searchableItems,
      selectedTag,
      sortBy,
    ]
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
      case 'hub-polls-quiz':
        onOpenHub?.('blog-polls');
        break;
      case 'hub-forum':
        onOpenHub?.('forum');
        break;
      case 'github-settings':
        onOpenGithubSettings?.();
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
      if (item.badge === 'Anket') return <Vote className="w-4 h-4 text-indigo-500" />;
      if (item.badge === 'Quiz') return <HelpCircle className="w-4 h-4 text-emerald-500" />;
      return <Globe className="w-4 h-4 text-sky-500" />;
    }
    if (item.category === 'event') {
      return <Calendar className="w-4 h-4 text-indigo-500" />;
    }
    if (item.actionId === 'github-settings') return <GitBranch className="w-4 h-4 text-neutral-900 dark:text-white" />;
    if (item.actionId === 'hub-polls-quiz') return <Vote className="w-4 h-4 text-indigo-500" />;
    if (item.actionId === 'hub-forum') return <MessageSquare className="w-4 h-4 text-sky-500" />;
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
      className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-16 px-2.5 sm:px-4 bg-black/55 backdrop-blur-xs select-none"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-[#1e1f23] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[84vh]">
        {/* Search Input Row */}
        <div className="flex items-center gap-2 sm:gap-3 px-3.5 sm:px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Modeller (${LUXO_MODEL_IDS.length}), GitHub, anket, forum ve makalelerde ara...`}
            aria-label="Gelişmiş arama kutusu"
            data-testid="enhanced-search-input"
            className="flex-1 min-w-0 bg-transparent text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden min-h-[44px] sm:min-h-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Aramayı temizle"
              className="min-h-[44px] sm:min-h-0 px-2 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-white cursor-pointer"
            >
              Temizle
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Aramayı Kapat"
            className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-2 sm:p-1.5 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Auto-Suggestions Bar */}
        {suggestions.length > 0 && (
          <div
            data-testid="search-autosuggestions"
            className="px-3.5 sm:px-4 py-2 bg-neutral-50 dark:bg-[#18181b] border-b border-neutral-200/70 dark:border-neutral-800 flex items-center gap-1.5 overflow-x-auto"
          >
            <span className="text-[11px] font-semibold text-neutral-400 shrink-0 mr-1">
              Öneriler:
            </span>
            {suggestions.map((sug) => (
              <button
                key={`${sug.category}-${sug.text}`}
                type="button"
                onClick={() => setQuery(sug.text)}
                className="min-h-[36px] sm:min-h-0 px-3 sm:px-2.5 py-1.5 sm:py-1 rounded-lg bg-white dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-neutral-200 dark:border-neutral-700 text-[11px] font-medium text-neutral-700 dark:text-neutral-200 transition cursor-pointer whitespace-nowrap shrink-0"
              >
                {sug.text}
              </button>
            ))}
          </div>
        )}

        {/* Advanced Filtering & Sorting Row */}
        <div className="px-3.5 sm:px-4 py-2.5 border-b border-neutral-200/80 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-0.5">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                data-testid={`search-cat-${tab.id}`}
                onClick={() => setCategory(tab.id)}
                className={`min-h-[38px] sm:min-h-0 px-3 sm:px-2.5 py-1.5 sm:py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
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
              className="min-h-[36px] sm:min-h-0 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[11px] font-semibold text-neutral-700 dark:text-neutral-200 cursor-pointer outline-none"
            >
              <option value="all">Tüm Zamanlar</option>
              <option value="24h">Son 24 Saat</option>
              <option value="7d">Son 7 Gün</option>
              <option value="30d">Son 30 Gün</option>
            </select>

            <div className="min-h-[36px] sm:min-h-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              <ArrowUpDown className="w-3 h-3 text-neutral-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SearchSortBy)}
                aria-label="Sıralama ölçütü"
                data-testid="search-sort-select"
                className="bg-transparent text-[11px] font-semibold text-neutral-700 dark:text-neutral-200 cursor-pointer outline-none"
              >
                <option value="relevance">En İlgili</option>
                <option value="rating_desc">En Yüksek Puan</option>
                <option value="date_desc">En Yeni</option>
                <option value="date_asc">En Eski</option>
                <option value="title_asc">Başlık (A–Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tags, Publish Date Range & Min Rating Filters */}
        <div
          data-testid="search-advanced-filters"
          className="px-3.5 sm:px-4 py-2 border-b border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#17181c] flex flex-wrap items-center justify-between gap-2"
        >
          <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-0.5">
            <Tag className="w-3.5 h-3.5 text-neutral-400 shrink-0 mr-0.5" />
            <button
              type="button"
              data-testid="search-tag-all"
              onClick={() => setSelectedTag('all')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                selectedTag === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              Tüm Etiketler
            </button>
            {availableTags.map((tg) => (
              <button
                key={tg}
                type="button"
                onClick={() => setSelectedTag(selectedTag === tg ? 'all' : tg)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedTag === tg
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-indigo-400'
                }`}
              >
                #{tg}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              aria-label="Başlangıç yayın tarihi"
              title="Başlangıç yayın tarihi"
              data-testid="search-date-from"
              className="px-2 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[11px] text-neutral-700 dark:text-neutral-200 outline-none"
            />
            <span className="text-[10px] text-neutral-400">–</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              aria-label="Bitiş yayın tarihi"
              title="Bitiş yayın tarihi"
              data-testid="search-date-to"
              className="px-2 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[11px] text-neutral-700 dark:text-neutral-200 outline-none"
            />
            <select
              value={String(minRating)}
              onChange={(e) => setMinRating(Number(e.target.value) || 0)}
              aria-label="Minimum yıldız puanı"
              data-testid="search-min-rating-filter"
              className="px-2 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[11px] font-semibold text-neutral-700 dark:text-neutral-200 cursor-pointer outline-none"
            >
              <option value="0">Tüm Puanlar</option>
              <option value="3">3+ Yıldız</option>
              <option value="4">4+ Yıldız</option>
              <option value="4.5">4.5+ Yıldız</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="px-4 py-1.5 bg-neutral-50/70 dark:bg-[#18181b] border-b border-neutral-100 dark:border-neutral-800/80 text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center justify-between tabular-nums">
          <span data-testid="search-results-count">
            {results.length} sonuç listeleniyor
          </span>
          <span className="hidden sm:inline">ESC ile kapat</span>
        </div>

        {/* Results Feed */}
        <div data-testid="search-results-list" className="overflow-y-auto p-2.5 sm:p-3 space-y-1">
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
                  className={`w-full min-h-[50px] flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl transition text-left cursor-pointer ${
                    isSelectedModel
                      ? 'bg-blue-50 dark:bg-blue-950/35 border border-blue-500/40'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/70 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {item.category === 'model' ? (
                      renderCategoryIcon(item)
                    ) : (
                      <div className="w-8 h-8 sm:w-7 sm:h-7 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                        {renderCategoryIcon(item)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        <HighlightedText text={item.title} query={query} />
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                        <HighlightedText text={item.subtitle} query={query} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {(item.ratingAvg ?? 0) > 0 && (item.ratingCount ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/12 text-amber-600 dark:text-amber-400 text-[10px] font-semibold tabular-nums">
                        <Star className="w-3 h-3 fill-current" />
                        {item.ratingAvg?.toFixed(1)}
                      </span>
                    )}
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
