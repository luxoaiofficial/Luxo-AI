import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  FileCode2,
  Folder,
  FolderPlus,
  Image as ImageIcon,
  LayoutDashboard,
  LogIn,
  LogOut,
  MessageSquare,
  Mic,
  Moon,
  PenLine,
  Pin,
  PinOff,
  Settings,
  Sparkles,
  Star,
  Sun,
} from 'lucide-react';
import type {
  AppView,
  ChatThread,
  GeneratedVisual,
  LibraryItem,
  LuxoModelId,
  LuxoProject,
  LuxoUser,
  PinnedWorkspaceId,
  SelfEvolutionState,
} from '../types/luxo';
import {
  aggregatePersonalDashboardData,
  AVAILABLE_WORKSPACES,
} from '../utils/dashboardEngine';
import type { PublishedStudioArticle } from '../utils/contentStudioEngine';
import { ModelPerformanceMetricsPanel } from './ModelPerformanceMetricsPanel';

interface PersonalDashboardViewProps {
  onBack: () => void;
  user: LuxoUser;
  activeModelId: LuxoModelId;
  chats: ChatThread[];
  projects: LuxoProject[];
  libraryItems: LibraryItem[];
  visuals: GeneratedVisual[];
  studioArticles: PublishedStudioArticle[];
  evolutionState: SelfEvolutionState;
  isDarkTheme: boolean;
  initialFocusSection?: 'overview' | 'model-metrics';
  onToggleTheme: () => void;
  onNavigateView: (
    view: AppView,
    options?: { hubTab?: 'content-studio' | 'seo' | 'blog-polls' }
  ) => void;
  onTogglePinWorkspace: (workspaceId: PinnedWorkspaceId) => void;
  onToggleModelEnabled: (modelId: LuxoModelId) => void;
  onSelectModel: (modelId: LuxoModelId) => void;
  onCreateQuickProject: (name: string, category: LuxoProject['category']) => void;
  onOpenLibraryItemInChat: (title: string, content: string) => void;
  onOpenVoiceCommands: () => void;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
}

function getWorkspaceIcon(id: PinnedWorkspaceId) {
  switch (id) {
    case 'chat':
      return <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    case 'studio':
      return <FileCode2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    case 'cms':
      return <PenLine className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    case 'model-metrics':
      return <Activity className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
    case 'projects':
      return <Folder className="w-4 h-4 text-amber-500" />;
    case 'library':
      return <BookOpen className="w-4 h-4 text-violet-500" />;
    case 'images':
      return <ImageIcon className="w-4 h-4 text-pink-500" />;
    case 'evolution':
      return <Sparkles className="w-4 h-4 text-indigo-500" />;
    case 'social':
      return <Calendar className="w-4 h-4 text-blue-500" />;
    case 'settings':
      return <Settings className="w-4 h-4 text-neutral-500" />;
  }
}

export const PersonalDashboardView: React.FC<PersonalDashboardViewProps> = ({
  onBack,
  user,
  activeModelId,
  chats,
  projects,
  libraryItems,
  visuals,
  studioArticles,
  evolutionState,
  isDarkTheme,
  initialFocusSection = 'overview',
  onToggleTheme,
  onNavigateView,
  onTogglePinWorkspace,
  onToggleModelEnabled,
  onSelectModel,
  onCreateQuickProject,
  onOpenLibraryItemInChat,
  onOpenVoiceCommands,
  onOpenAuthModal,
  onSignOut,
}) => {
  const [showPinCustomizer, setShowPinCustomizer] = useState(false);
  const [showQuickProjectForm, setShowQuickProjectForm] = useState(false);
  const [quickProjectName, setQuickProjectName] = useState('');
  const [quickProjectCategory, setQuickProjectCategory] =
    useState<LuxoProject['category']>('Yazılım');

  const snapshot = useMemo(
    () =>
      aggregatePersonalDashboardData({
        chats,
        projects,
        libraryItems,
        visuals,
        studioArticles,
        evolutionState,
        pinnedWorkspaces: user.pinnedWorkspaces,
        disabledModelIds: user.disabledModelIds,
      }),
    [
      chats,
      evolutionState,
      libraryItems,
      projects,
      studioArticles,
      user.disabledModelIds,
      user.pinnedWorkspaces,
      visuals,
    ]
  );

  useEffect(() => {
    if (initialFocusSection === 'model-metrics') {
      const el = document.getElementById('model-performance-metrics-panel');
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [initialFocusSection]);

  const launchWorkspace = (id: PinnedWorkspaceId) => {
    switch (id) {
      case 'chat':
        onNavigateView('chat');
        break;
      case 'studio':
        onNavigateView('studio');
        break;
      case 'cms':
        onNavigateView('hub', { hubTab: 'content-studio' });
        break;
      case 'model-metrics': {
        const el = document.getElementById('model-performance-metrics-panel');
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      }
      case 'projects':
        onNavigateView('projects');
        break;
      case 'library':
        onNavigateView('library');
        break;
      case 'images':
        onNavigateView('images');
        break;
      case 'evolution':
        onNavigateView('evolution');
        break;
      case 'social':
        onNavigateView('social');
        break;
      case 'settings':
        onNavigateView('settings');
        break;
    }
  };

  const handleQuickProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickProjectName.trim();
    if (!clean) return;
    onCreateQuickProject(clean, quickProjectCategory);
    setQuickProjectName('');
    setShowQuickProjectForm(false);
  };

  return (
    <div
      data-testid="personal-dashboard-view"
      className="flex flex-col h-full bg-[#fcfcfc] dark:bg-[#141518] text-neutral-900 dark:text-neutral-100 overflow-hidden"
    >
      {/* Top Bar */}
      <header className="flex items-center justify-between gap-2 sm:gap-3 px-4 sm:px-6 py-3.5 bg-white dark:bg-[#18191d] border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sohbete Dön</span>
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <LayoutDashboard className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-neutral-900 dark:text-white truncate">
              Kişisel Kontrol Paneli
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="dashboard-voice-cmd-btn"
            onClick={onOpenVoiceCommands}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
          >
            <Mic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sesli Komut</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDarkTheme ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
            className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center justify-center transition cursor-pointer shrink-0"
          >
            {isDarkTheme ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-700" />
            )}
          </button>

          {user.isGuest ? (
            <button
              type="button"
              data-testid="dashboard-auth-btn"
              onClick={onOpenAuthModal}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Giriş / Kayıt</span>
            </button>
          ) : (
            <button
              type="button"
              data-testid="dashboard-signout-btn"
              onClick={onSignOut}
              className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Çıkış Yap</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Dashboard Body */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Welcome & Key Project Stats Widget */}
          <section className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                  Hoş geldiniz, {user.name}
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Projeleriniz, son kitaplık kayıtlarınız, model performans uyarıları ve sabitlenmiş çalışma alanlarınız tek bakışta.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  data-testid="dashboard-new-project-btn"
                  onClick={() => setShowQuickProjectForm((v) => !v)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Yeni Proje Başlat</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateView('hub', { hubTab: 'content-studio' })}
                  className="px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                >
                  <PenLine className="w-3.5 h-3.5 text-indigo-500" />
                  <span>CMS &amp; Blog Ekle</span>
                </button>
              </div>
            </div>

            {showQuickProjectForm && (
              <form
                onSubmit={handleQuickProjectSubmit}
                data-testid="dashboard-quick-project-form"
                className="p-4 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
              >
                <input
                  type="text"
                  value={quickProjectName}
                  onChange={(e) => setQuickProjectName(e.target.value)}
                  placeholder="Proje çalışma alanı adı (Örn: E-Ticaret AI Asistanı)"
                  required
                  className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-[#18191d] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-hidden"
                />
                <select
                  value={quickProjectCategory}
                  onChange={(e) =>
                    setQuickProjectCategory(e.target.value as LuxoProject['category'])
                  }
                  className="px-3 py-2 rounded-lg bg-white dark:bg-[#18191d] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white"
                >
                  <option value="Yazılım">Yazılım</option>
                  <option value="Araştırma">Araştırma</option>
                  <option value="Tasarım">Tasarım</option>
                  <option value="İş & Strateji">İş &amp; Strateji</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  Oluştur ve Aç
                </button>
              </form>
            )}

            {/* 4 Key Statistics Tiles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 tabular-nums">
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  Aktif Projeler
                </div>
                <div
                  data-testid="stat-total-projects"
                  className="text-2xl font-bold text-neutral-900 dark:text-white mt-1 font-mono"
                >
                  {snapshot.stats.totalProjects}
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {snapshot.stats.totalChats} sohbet · {snapshot.stats.totalMessages} mesaj
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  Kitaplık &amp; Medya
                </div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-white mt-1 font-mono">
                  {snapshot.stats.totalLibraryItems}
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {snapshot.stats.favoriteLibraryCount} favori · {snapshot.stats.totalVisuals} görsel/video
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  CMS Blog Yazıları
                </div>
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
                  {snapshot.stats.publishedArticlesCount}
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {snapshot.stats.draftArticlesCount} taslak bekliyor
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800">
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  Etkin AI Modelleri
                </div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                  {snapshot.stats.enabledModelsCount}/{snapshot.stats.totalModelsCount}
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Ort. {snapshot.stats.avgLatencyMs} ms · %{snapshot.stats.avgAccuracyPct}
                </div>
              </div>
            </div>
          </section>

          {/* Pinned Workspaces Widget */}
          <section
            data-testid="pinned-workspaces-widget"
            className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Pin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Sabitlenmiş Çalışma Alanları ({snapshot.pinnedWorkspaceDefs.length})</span>
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  En sık kullandığınız çalışma alanlarını sabitleyin ve tek tıkla başlatın.
                </p>
              </div>
              <button
                type="button"
                data-testid="customize-pins-btn"
                onClick={() => setShowPinCustomizer((v) => !v)}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 cursor-pointer whitespace-nowrap"
              >
                {showPinCustomizer ? 'Özelleştirmeyi Kapat' : 'Çalışma Alanlarını Özelleştir'}
              </button>
            </div>

            {showPinCustomizer && (
              <div
                data-testid="pin-customizer-grid"
                className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2"
              >
                {AVAILABLE_WORKSPACES.map((ws) => {
                  const isPinned = snapshot.pinnedWorkspaceDefs.some(
                    (p) => p.id === ws.id
                  );
                  return (
                    <button
                      key={ws.id}
                      type="button"
                      data-testid={`toggle-pin-${ws.id}`}
                      onClick={() => onTogglePinWorkspace(ws.id)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2 ${
                        isPinned
                          ? 'bg-white dark:bg-[#18191d] border-indigo-500 text-neutral-900 dark:text-white'
                          : 'bg-transparent border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-white/60 dark:hover:bg-[#18191d]/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {getWorkspaceIcon(ws.id)}
                        <span className="text-xs font-semibold truncate">
                          {ws.title}
                        </span>
                      </div>
                      {isPinned ? (
                        <Pin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      ) : (
                        <PinOff className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {snapshot.pinnedWorkspaceDefs.map((ws) => (
                <div
                  key={ws.id}
                  data-testid={`pinned-card-${ws.id}`}
                  className="p-4 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition flex items-center justify-between gap-3"
                >
                  <button
                    type="button"
                    onClick={() => launchWorkspace(ws.id)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#18191d] border border-neutral-200 dark:border-neutral-800 flex items-center justify-center shrink-0">
                      {getWorkspaceIcon(ws.id)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        {ws.title}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                        {ws.subtitle}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onTogglePinWorkspace(ws.id)}
                    aria-label={`${ws.title} sabitlemesini kaldır`}
                    title="Sabitlemeyi Kaldır"
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-neutral-800 transition cursor-pointer shrink-0"
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Two-Column Middle Widgets: Recent Library Items & Model Performance Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Widget 3: Recent Library Items */}
            <section
              data-testid="recent-library-widget"
              className="lg:col-span-6 p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-violet-500" />
                    <span>Son Kitaplık Öğeleri</span>
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Kaydedilen dokümanlar, kod parçaları ve favori bilgi notlarınız.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateView('library')}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <span>Tümünü Gör</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border-t border-neutral-100 dark:border-neutral-800">
                {snapshot.recentLibraryItems.map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {item.isFavorite && (
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-current shrink-0" />
                        )}
                        <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {item.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                        {item.tab} · {item.createdAt} · {item.summary}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenLibraryItemInChat(item.title, item.content)
                      }
                      className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Aç
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Widget 4: Model Performance Alerts */}
            <section
              data-testid="model-alerts-widget"
              className="lg:col-span-6 p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] space-y-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Model Performans Uyarıları</span>
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Canlı gecikme sıçramaları, yoğunluk uyarıları ve optimum kalibrasyon sinyalleri.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigateView('evolution')}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <span>Evrim Merkezi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border-t border-neutral-100 dark:border-neutral-800">
                {snapshot.modelAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="py-3 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-white">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            alert.severity === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <span className="truncate">{alert.title}</span>
                      </div>
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-snug">
                        {alert.detail}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono font-semibold text-neutral-500 dark:text-neutral-400 tabular-nums">
                        {alert.metricBadge}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectModel(alert.modelId)}
                        className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer whitespace-nowrap"
                      >
                        Seç
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Dedicated All-113 Model Performance Metrics Panel */}
          <ModelPerformanceMetricsPanel
            evolutionState={evolutionState}
            activeModelId={activeModelId}
            disabledModelIds={user.disabledModelIds}
            onToggleModelEnabled={onToggleModelEnabled}
            onSelectModel={onSelectModel}
          />
        </div>
      </main>
    </div>
  );
};

export default PersonalDashboardView;
