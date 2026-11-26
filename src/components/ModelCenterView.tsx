import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Lock,
  MessageSquare,
  PanelLeft,
  Search,
  ShieldCheck,
  Star,
  Swords,
} from 'lucide-react';
import type {
  CatalogModelEntry,
  LuxoModelId,
  PlatformProviderConfig,
} from '../types/luxo';
import {
  filterAndSortCatalog,
  type CatalogPricingFilter,
  type CatalogSortMode,
} from '../utils/providerRegistry';
import { formatTokenCount } from '../utils/tokenLimitsEngine';
import { ModelBrandAvatar } from './LuxoLogo';

interface ModelCenterViewProps {
  catalogModels: CatalogModelEntry[];
  providers: PlatformProviderConfig[];
  zeroCostEnabled: boolean;
  favoriteModelIds: string[];
  onToggleFavorite: (modelId: string) => void;
  onLaunchChat: (modelId: LuxoModelId) => void;
  onLaunchArenaWithModel: (modelId: string) => void;
  onOpenSidebar: () => void;
  onBackHome: () => void;
}

function formatPricingLabel(status: string): string {
  switch (status) {
    case 'FREE':
      return 'Free';
    case 'FREE_TIER':
      return 'Free Tier';
    case 'PAID':
      return 'Paid';
    case 'REQUIRES_CREDITS':
      return 'Credits Required';
    case 'UNAVAILABLE':
      return 'Unavailable';
    default:
      return 'Unknown';
  }
}

export const ModelCenterView: React.FC<ModelCenterViewProps> = ({
  catalogModels,
  providers,
  zeroCostEnabled,
  favoriteModelIds,
  onToggleFavorite,
  onLaunchChat,
  onLaunchArenaWithModel,
  onOpenSidebar,
  onBackHome,
}) => {
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  const [pricingFilter, setPricingFilter] =
    useState<CatalogPricingFilter>('all');
  const [capabilityFilter, setCapabilityFilter] = useState('all');
  const [onlyExecutable, setOnlyExecutable] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<CatalogSortMode>('recent');

  const allCapabilities = useMemo(() => {
    const caps = new Set<string>();
    for (const m of catalogModels) {
      for (const c of m.capabilities) caps.add(c);
    }
    return Array.from(caps).sort();
  }, [catalogModels]);

  const filteredModels = useMemo(() => {
    const base = filterAndSortCatalog(catalogModels, {
      search,
      providerId: providerFilter,
      pricingFilter,
      capability: capabilityFilter,
      onlyAvailable: onlyExecutable,
      sortBy,
    });
    if (!favoritesOnly) return base;
    const favSet = new Set(favoriteModelIds);
    return base.filter((m) => favSet.has(m.id));
  }, [
    catalogModels,
    search,
    providerFilter,
    pricingFilter,
    capabilityFilter,
    onlyExecutable,
    sortBy,
    favoritesOnly,
    favoriteModelIds,
  ]);

  const executableCount = catalogModels.filter(
    (m) => m.executable && (!zeroCostEnabled || m.zeroCostAllowed)
  ).length;

  return (
    <div
      data-testid="model-center-view"
      className="flex flex-col h-full bg-[#f8fafc] dark:bg-[#0b0d14] text-slate-900 dark:text-slate-100 overflow-hidden"
    >
      <header className="h-13 px-3 sm:px-5 flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 bg-white/85 dark:bg-[#0b0d14]/90 backdrop-blur-xs shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Toggle navigation sidebar"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#181c2b] transition cursor-pointer shrink-0"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onBackHome}
            aria-label="Back to Home Dashboard"
            className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#181c2b] transition cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white truncate">
            Explore Models
          </h1>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap shrink-0">
          {executableCount} ready / {catalogModels.length} total
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Zero Cost Mode Banner */}
          <div
            data-testid="zero-cost-banner"
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              zeroCostEnabled
                ? 'bg-emerald-500/8 border-emerald-500/30 text-slate-900 dark:text-slate-100'
                : 'bg-amber-500/8 border-amber-500/30 text-slate-900 dark:text-slate-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <ShieldCheck
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  zeroCostEnabled ? 'text-emerald-500' : 'text-amber-500'
                }`}
              />
              <div className="space-y-0.5">
                <div className="text-xs font-semibold">
                  {zeroCostEnabled
                    ? 'Zero Cost Mode Enabled'
                    : 'Zero Cost Mode Disabled'}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {zeroCostEnabled
                    ? 'Paid, credit-required, unavailable, and unknown-pricing models are strictly blocked by server policy. Only verified Free and Free-Tier models can execute.'
                    : 'All connected provider models are eligible to run based on provider credentials.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPricingFilter('zero-cost')}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111420] text-xs font-medium hover:bg-slate-50 dark:hover:bg-[#181c2b] transition cursor-pointer whitespace-nowrap shrink-0"
            >
              Show Zero-Cost Safe
            </button>
          </div>

          {/* Search & Filters */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  data-testid="model-center-search-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search models, providers, or capabilities..."
                  aria-label="Search models"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-violet-500"
                />
              </div>

              <div className="md:col-span-2">
                <select
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                  aria-label="Filter by provider"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">All Providers</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <select
                  value={capabilityFilter}
                  onChange={(e) => setCapabilityFilter(e.target.value)}
                  aria-label="Filter by capability"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">All Capabilities</option>
                  {allCapabilities.map((cap) => (
                    <option key={cap} value={cap}>
                      {cap}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as CatalogSortMode)}
                  aria-label="Sort models"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#181c2b] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden cursor-pointer"
                >
                  <option value="recent">Recently Added</option>
                  <option value="context">Largest Context</option>
                  <option value="name">Name (A–Z)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'zero-cost', label: 'Zero-Cost Safe' },
                    { id: 'free-only', label: 'Free Only' },
                    { id: 'paid', label: 'Paid / Credits' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    data-testid={`model-center-pricing-${tab.id}`}
                    onClick={() => setPricingFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                      pricingFilter === tab.id
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-100 dark:bg-[#181c2b] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4 text-xs">
                <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={onlyExecutable}
                    onChange={(e) => setOnlyExecutable(e.target.checked)}
                    className="accent-violet-600 rounded"
                  />
                  <span>Ready to Run Only</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={favoritesOnly}
                    onChange={(e) => setFavoritesOnly(e.target.checked)}
                    className="accent-violet-600 rounded"
                  />
                  <span>Favorites Only</span>
                </label>
              </div>
            </div>
          </div>

          {/* Model Grid */}
          {filteredModels.length === 0 ? (
            <div className="p-10 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 text-center space-y-2">
              <div className="text-sm font-semibold">No models match your filters</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Try clearing the search query or switching pricing and provider filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setProviderFilter('all');
                  setPricingFilter('all');
                  setCapabilityFilter('all');
                  setOnlyExecutable(false);
                  setFavoritesOnly(false);
                }}
                className="mt-2 px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredModels.map((model) => {
                const isFav = favoriteModelIds.includes(model.id);
                const blockedByZeroCost =
                  zeroCostEnabled && !model.zeroCostAllowed;
                const canRun = model.executable && !blockedByZeroCost;

                return (
                  <article
                    key={model.id}
                    data-testid={`model-card-${model.id}`}
                    className="p-4 rounded-xl bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3 min-w-0">
                          <ModelBrandAvatar
                            name={model.name}
                            logoUrl={model.logoPath}
                            provider={model.providerId}
                            modelId={model.id}
                            accentColor={model.accentColor}
                            sizeClass="w-9 h-9 rounded-lg"
                          />
                          <div className="min-w-0">
                            <h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {model.name}
                            </h2>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 tabular-nums">
                              {model.providerLabel} ·{' '}
                              {formatPricingLabel(model.pricingStatus)} ·{' '}
                              {formatTokenCount(model.contextLength)} ctx
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onToggleFavorite(model.id)}
                          aria-label={
                            isFav
                              ? `Remove ${model.name} from favorites`
                              : `Favorite ${model.name}`
                          }
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer shrink-0 ${
                            isFav
                              ? 'text-amber-500 bg-amber-500/10'
                              : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#181c2b]'
                          }`}
                        >
                          <Star
                            className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`}
                          />
                        </button>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                        {model.description}
                      </p>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {model.capabilities.join(' · ')}
                      </div>

                      {!canRun && (
                        <div className="text-[11px] font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">
                            {blockedByZeroCost
                              ? model.zeroCostReason ||
                                'Blocked by Zero Cost Mode'
                              : 'Provider API key not configured'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
                      <button
                        type="button"
                        data-testid={`model-card-chat-${model.id}`}
                        disabled={!canRun}
                        onClick={() => onLaunchChat(model.id as LuxoModelId)}
                        className="flex-1 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-slate-200 dark:disabled:bg-[#181c2b] disabled:text-slate-400 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                      >
                        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                        <span>{canRun ? 'Launch Chat' : 'Locked'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onLaunchArenaWithModel(model.id)}
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#181c2b] hover:bg-slate-100 dark:hover:bg-[#1f2437] text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Swords className="w-3.5 h-3.5 shrink-0" />
                        <span>Arena</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
