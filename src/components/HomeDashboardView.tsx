import React, { useRef, useState } from 'react';
import {
  ArrowRight,
  Bot,
  Brain,
  Code2,
  Compass,
  Database,
  FileSearch,
  FolderKanban,
  Globe,
  Image as ImageIcon,
  Layers,
  MessageSquare,
  PanelLeft,
  PanelRight,
  Paperclip,
  PenLine,
  Send,
  Sparkles,
  Swords,
  X,
} from 'lucide-react';
import type {
  AppView,
  AssistantPersona,
  CatalogModelEntry,
  ChatThread,
  KnowledgeDocSummary,
  LuxoModelId,
  LuxoProject,
  LuxoUser,
  PlatformProviderConfig,
  PromptTemplateRecord,
  ProviderConnectionStatusMap,
} from '../types/luxo';
import { formatTokenCount } from '../utils/tokenLimitsEngine';
import { LuxoLogo, ModelBrandAvatar } from './LuxoLogo';
import { ModelSelectorDropdown } from './ModelSelectorDropdown';

interface HomeDashboardViewProps {
  user: LuxoUser;
  activeModelId: LuxoModelId;
  onSelectModel: (modelId: LuxoModelId) => void;
  catalogModels: CatalogModelEntry[];
  providers: PlatformProviderConfig[];
  providerStatus: ProviderConnectionStatusMap;
  zeroCostEnabled: boolean;
  favoriteModelIds: string[];
  recentModelIds: string[];
  assistants: AssistantPersona[];
  chats: ChatThread[];
  prompts: PromptTemplateRecord[];
  projects: LuxoProject[];
  knowledgeDocs: KnowledgeDocSummary[];
  attachedKnowledgeDocIds: string[];
  onStartChat: (
    prompt: string,
    attachment?: File,
    options?: {
      webSearch?: boolean;
      deepReasoning?: boolean;
      assistantId?: string;
    }
  ) => void;
  onSelectChat: (chatId: string) => void;
  onSelectAssistantForChat: (assistant: AssistantPersona) => void;
  onSelectPromptForChat: (prompt: PromptTemplateRecord) => void;
  onSelectProject: (projectId: string) => void;
  onNavigateView: (view: AppView) => void;
  onOpenSidebar: () => void;
  onToggleRightPanel: () => void;
  isRightPanelOpen: boolean;
  onOpenAuthModal: () => void;
  onOpenSettings: () => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  user,
  activeModelId,
  onSelectModel,
  catalogModels,
  providers,
  providerStatus,
  zeroCostEnabled,
  favoriteModelIds,
  recentModelIds,
  assistants,
  chats,
  prompts,
  projects,
  attachedKnowledgeDocIds,
  onStartChat,
  onSelectChat,
  onSelectAssistantForChat,
  onSelectPromptForChat,
  onSelectProject,
  onNavigateView,
  onOpenSidebar,
  onToggleRightPanel,
  isRightPanelOpen,
  onOpenAuthModal,
  onOpenSettings,
}) => {
  const [composerText, setComposerText] = useState('');
  const [webSearch, setWebSearch] = useState(false);
  const [deepReasoning, setDeepReasoning] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const composerInputRef = useRef<HTMLTextAreaElement | null>(null);

  const highlightModels = React.useMemo(() => {
    const priorityIds = new Set([...favoriteModelIds, ...recentModelIds]);
    const prioritized = catalogModels.filter(
      (m) => priorityIds.has(m.id) && m.enabled
    );
    if (prioritized.length >= 4) return prioritized.slice(0, 6);
    const executableFallback = catalogModels.filter(
      (m) =>
        m.enabled &&
        !priorityIds.has(m.id) &&
        (!zeroCostEnabled || m.zeroCostAllowed)
    );
    return [...prioritized, ...executableFallback].slice(0, 6);
  }, [catalogModels, favoriteModelIds, recentModelIds, zeroCostEnabled]);

  const connectedProviders = providers.filter((p) => p.connected);

  const handleSubmitComposer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerText.trim() && !attachedFile) return;
    onStartChat(composerText.trim(), attachedFile || undefined, {
      webSearch,
      deepReasoning,
    });
    setComposerText('');
    setAttachedFile(null);
  };

  const quickActions = [
    {
      id: 'ask',
      title: 'Ask Anything',
      subtitle: 'Fast answers, synthesis, and multi-model reasoning',
      icon: Sparkles,
      onClick: () => {
        setComposerText(
          'Summarize the key architectural trade-offs between REST, GraphQL, and gRPC for a SaaS platform.'
        );
        composerInputRef.current?.focus();
      },
    },
    {
      id: 'write',
      title: 'Write & Create',
      subtitle: 'Draft specs, product copy, technical memos, and emails',
      icon: PenLine,
      onClick: () => {
        setComposerText(
          'Write a crisp product launch announcement for a new multi-model developer workspace.'
        );
        composerInputRef.current?.focus();
      },
    },
    {
      id: 'code',
      title: 'Code & Build',
      subtitle: 'Architect TypeScript APIs, debug issues, and ship tests',
      icon: Code2,
      onClick: () => {
        setComposerText(
          'Design a resilient TypeScript rate limiter with sliding-window counters and unit tests.'
        );
        composerInputRef.current?.focus();
      },
    },
    {
      id: 'research',
      title: 'Research & Explore',
      subtitle: 'Deep research with web grounding and verifiable citations',
      icon: Globe,
      onClick: () => {
        setWebSearch(true);
        setDeepReasoning(true);
        setComposerText(
          'Compare open-weight reasoning models released recently for latency, context size, and coding accuracy.'
        );
        composerInputRef.current?.focus();
      },
    },
    {
      id: 'docs',
      title: 'Analyze Documents',
      subtitle: 'Index PDF, TXT, or Markdown into the Knowledge Base',
      icon: FileSearch,
      onClick: () => onNavigateView('knowledge'),
    },
    {
      id: 'images',
      title: 'Understand Images',
      subtitle: 'Inspect screenshots, diagrams, or open Visual Studio',
      icon: ImageIcon,
      onClick: () => {
        fileInputRef.current?.click();
      },
    },
  ];

  return (
    <div
      data-testid="home-dashboard-view"
      className="flex flex-col h-full bg-[#f8fafc] dark:bg-[#0b0d14] text-slate-900 dark:text-slate-100 overflow-hidden"
    >
      <header className="h-13 px-3 sm:px-5 flex items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-[#0b0d14]/90 backdrop-blur-xs shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            data-testid="home-sidebar-toggle-btn"
            onClick={onOpenSidebar}
            aria-label="Toggle navigation sidebar"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#181c2b] transition cursor-pointer shrink-0"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0">
            Workspace Home
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateView('models')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111420] hover:bg-slate-50 dark:hover:bg-[#181c2b] text-xs font-medium text-slate-700 dark:text-slate-200 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <Compass className="w-3.5 h-3.5 text-violet-500 shrink-0" />
            <span>Explore Models</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateView('arena')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111420] hover:bg-slate-50 dark:hover:bg-[#181c2b] text-xs font-medium text-slate-700 dark:text-slate-200 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <Swords className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>Model Arena</span>
          </button>
          <button
            type="button"
            data-testid="home-right-panel-toggle-btn"
            onClick={onToggleRightPanel}
            aria-label="Toggle context panel"
            aria-expanded={isRightPanelOpen}
            className={`w-9 h-9 rounded-lg flex items-center justify-center border transition cursor-pointer shrink-0 ${
              isRightPanelOpen
                ? 'border-violet-500/50 bg-violet-600/10 text-violet-600 dark:text-violet-300'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#181c2b]'
            }`}
          >
            <PanelRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto luxo-ambient-glow">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
          {/* Hero + Unified Composer */}
          <section className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-violet-600/10 dark:bg-violet-500/15 border border-violet-500/25 mb-1">
                <LuxoLogo className="w-6 h-6 text-violet-600 dark:text-violet-400" size={24} />
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white text-balance">
                Hello, welcome to Luxo AI
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Your intelligent workspace for every AI model.
              </p>
              <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums pt-1">
                <span>
                  {connectedProviders.length} connected provider
                  {connectedProviders.length === 1 ? '' : 's'}
                </span>
                <span aria-hidden="true" className="mx-1.5">
                  ·
                </span>
                <span>
                  {catalogModels.filter((m) => m.executable).length} ready models
                </span>
                <span aria-hidden="true" className="mx-1.5">
                  ·
                </span>
                <span>
                  Zero Cost Mode: {zeroCostEnabled ? 'Active' : 'Off'}
                </span>
              </div>
            </div>

            <form
              onSubmit={handleSubmitComposer}
              className="max-w-3xl mx-auto rounded-2xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800 shadow-xs focus-within:border-violet-500/70 transition p-3 sm:p-4 space-y-3"
            >
              {attachedFile && (
                <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#181c2b] text-xs">
                  <span className="flex items-center gap-1.5 truncate">
                    <Paperclip className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate font-medium">{attachedFile.name}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    aria-label="Remove attached file"
                    className="text-slate-400 hover:text-red-500 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <textarea
                ref={composerInputRef}
                data-testid="home-composer-input"
                rows={2}
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComposer(e);
                  }
                }}
                placeholder="Ask anything, attach a file, or pick a model to begin..."
                aria-label="Ask Luxo AI"
                className="w-full resize-none bg-transparent text-sm sm:text-[15px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden leading-relaxed"
              />

              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800/70">
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 min-w-0">
                  <ModelSelectorDropdown
                    activeModelId={activeModelId}
                    onSelectModel={onSelectModel}
                    user={user}
                    providerStatus={providerStatus}
                    catalogModels={catalogModels}
                    zeroCostEnabled={zeroCostEnabled}
                    favoriteModelIds={favoriteModelIds}
                    recentModelIds={recentModelIds}
                    onOpenExtendedCatalog={() => onNavigateView('models')}
                    onOpenProviderSettings={onOpenSettings}
                    onOpenUpgradeModal={onOpenAuthModal}
                    compact
                    testIdPrefix="home-model-selector"
                  />

                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setAttachedFile(e.target.files[0]);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#181c2b] hover:bg-slate-100 dark:hover:bg-[#1f2437] text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="hidden md:inline">Attach</span>
                  </button>

                  <button
                    type="button"
                    aria-pressed={webSearch}
                    onClick={() => setWebSearch((v) => !v)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                      webSearch
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#181c2b] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1f2437]'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden md:inline">Web Search</span>
                  </button>

                  <button
                    type="button"
                    aria-pressed={deepReasoning}
                    onClick={() => setDeepReasoning((v) => !v)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0 ${
                      deepReasoning
                        ? 'bg-violet-600 border-violet-600 text-white'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#181c2b] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1f2437]'
                    }`}
                  >
                    <Brain className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden md:inline">Deep Think</span>
                  </button>

                  {attachedKnowledgeDocIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onNavigateView('knowledge')}
                      className="px-2.5 py-1.5 rounded-lg border border-violet-500/40 bg-violet-600/10 text-xs font-medium text-violet-600 dark:text-violet-300 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 tabular-nums"
                    >
                      <Database className="w-3.5 h-3.5 shrink-0" />
                      <span>{attachedKnowledgeDocIds.length} RAG Docs</span>
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  data-testid="home-composer-submit-btn"
                  disabled={!composerText.trim() && !attachedFile}
                  className="ml-auto px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-45 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>Start Chat</span>
                  <Send className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            </form>
          </section>

          {/* 6 Quick Action Cards */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Quick Actions
              </h2>
              <button
                type="button"
                onClick={() => onNavigateView('workflows')}
                className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline cursor-pointer whitespace-nowrap"
              >
                Open Workflows →
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {quickActions.map((qa) => {
                const Icon = qa.icon;
                return (
                  <button
                    key={qa.id}
                    type="button"
                    data-testid={`home-quick-action-${qa.id}`}
                    onClick={qa.onClick}
                    className="p-4 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 hover:border-violet-500/50 text-left transition flex items-start gap-3 cursor-pointer"
                  >
                    <span className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-[#181c2b] border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {qa.title}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {qa.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Recent & Favorite Models + Connected Providers */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Recent &amp; Favorite Models
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigateView('models')}
                  className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline cursor-pointer whitespace-nowrap"
                >
                  View Model Center →
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {highlightModels.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onSelectModel(m.id as LuxoModelId);
                      onNavigateView('chat');
                    }}
                    className="p-3.5 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 hover:border-violet-500/50 transition text-left flex items-center gap-3 cursor-pointer"
                  >
                    <ModelBrandAvatar
                      name={m.name}
                      logoUrl={m.logoPath}
                      provider={m.providerId}
                      modelId={m.id}
                      accentColor={m.accentColor}
                      sizeClass="w-8 h-8 rounded-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {m.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate tabular-nums mt-0.5">
                        {m.providerLabel} · {formatTokenCount(m.contextLength)} ctx
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Connected Providers
                </h2>
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer whitespace-nowrap"
                >
                  Configure
                </button>
              </div>
              <div className="rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 divide-y divide-slate-200/80 dark:divide-slate-800/80">
                {providers.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="px-3.5 py-2.5 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ModelBrandAvatar
                        name={p.name}
                        provider={p.id}
                        logoKey={p.logoKey}
                        accentColor={p.accentColor}
                        sizeClass="w-6 h-6 rounded-md"
                      />
                      <span className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                        {p.name}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-medium whitespace-nowrap shrink-0 ${
                        p.connected
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {p.connected ? 'Ready' : 'Unconfigured'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Featured Assistants, Recent Chats, Popular Prompts, Projects */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-violet-500 shrink-0" />
                  <span>Featured Assistants</span>
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigateView('assistants')}
                  className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline cursor-pointer whitespace-nowrap"
                >
                  All Assistants →
                </button>
              </div>
              <div className="space-y-2">
                {assistants.slice(0, 3).map((ast) => (
                  <button
                    key={ast.id}
                    type="button"
                    onClick={() => onSelectAssistantForChat(ast)}
                    className="w-full p-3.5 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 hover:border-violet-500/50 transition text-left flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {ast.name} ·{' '}
                        <span className="font-normal text-slate-500 dark:text-slate-400">
                          {ast.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {ast.description}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Recent Conversations</span>
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigateView('chat')}
                  className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline cursor-pointer whitespace-nowrap"
                >
                  Open Chat →
                </button>
              </div>
              <div className="space-y-2">
                {chats.slice(0, 3).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelectChat(c.id)}
                    className="w-full p-3.5 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 hover:border-violet-500/50 transition text-left flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {c.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate tabular-nums mt-0.5">
                        {c.messages.length} messages · {c.modelId}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-violet-500 shrink-0" />
                  <span>Popular Prompts</span>
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigateView('prompts')}
                  className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline cursor-pointer whitespace-nowrap"
                >
                  Prompt Library →
                </button>
              </div>
              <div className="space-y-2">
                {prompts.slice(0, 3).map((pr) => (
                  <button
                    key={pr.id}
                    type="button"
                    onClick={() => onSelectPromptForChat(pr)}
                    className="w-full p-3.5 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 hover:border-violet-500/50 transition text-left flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {pr.title} ·{' '}
                        <span className="font-normal text-slate-500 dark:text-slate-400">
                          {pr.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {pr.description}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FolderKanban className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Projects</span>
                </h2>
                <button
                  type="button"
                  onClick={() => onNavigateView('knowledge')}
                  className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline cursor-pointer whitespace-nowrap"
                >
                  Manage Projects →
                </button>
              </div>
              <div className="space-y-2">
                {projects.slice(0, 3).map((proj) => (
                  <button
                    key={proj.id}
                    type="button"
                    onClick={() => onSelectProject(proj.id)}
                    className="w-full p-3.5 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 hover:border-violet-500/50 transition text-left flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {proj.name} ·{' '}
                        <span className="font-normal text-slate-500 dark:text-slate-400">
                          {proj.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {proj.description}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Discover AI CTA */}
          <section className="rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Discover every model across your connected providers
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Filter by pricing safety, context window, vision, reasoning, or launch two to four models side by side in the Arena.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onNavigateView('models')}
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
              >
                Explore Models
              </button>
              <button
                type="button"
                onClick={() => onNavigateView('arena')}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#181c2b] hover:bg-slate-100 dark:hover:bg-[#1f2437] text-xs font-semibold text-slate-800 dark:text-slate-100 transition cursor-pointer whitespace-nowrap shrink-0"
              >
                Model Arena
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
