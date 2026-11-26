import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  Lock,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react';
import {
  CatalogModelEntry,
  DailyModelTokenUsage,
  LuxoModelCategory,
  LuxoModelConfig,
  LuxoModelId,
  LuxoUser,
  ModelTokenLimitOverride,
  ProviderConnectionStatusMap,
} from '../types/luxo';
import {
  EXTENDED_CATALOG_MODEL_IDS,
  getSelectableChatModelIds,
  LUXO_MODEL_CATEGORIES,
  LUXO_MODELS,
  PUBLIC_CHAT_MODEL_IDS,
} from '../utils/luxoLogic';
import {
  DEFAULT_PROVIDER_STATUS,
  DEFAULT_WORKING_MODEL_ID,
  formatTokenCount,
  getEffectiveModelTokenLimits,
  isModelExecutableWithProviders,
  PROVIDER_META,
} from '../utils/tokenLimitsEngine';
import { ModelBrandAvatar } from './LuxoLogo';

interface ModelSelectorDropdownProps {
  activeModelId: LuxoModelId;
  onSelectModel: (modelId: LuxoModelId) => void;
  user: LuxoUser;
  providerStatus?: ProviderConnectionStatusMap;
  tokenOverrides?: Partial<Record<string, ModelTokenLimitOverride>>;
  dailyTokenUsage?: Record<string, DailyModelTokenUsage>;
  catalogModels?: CatalogModelEntry[];
  zeroCostEnabled?: boolean;
  favoriteModelIds?: string[];
  recentModelIds?: string[];
  onOpenUpgradeModal?: () => void;
  onOpenExtendedCatalog?: () => void;
  onOpenProviderSettings?: () => void;
  showExtendedCatalog?: boolean;
  isCatalogUnlocked?: boolean;
  compact?: boolean;
  labelPrefix?: string;
  testIdPrefix?: string;
}

const FLAGSHIP_QUICK_IDS: LuxoModelId[] = [
  DEFAULT_WORKING_MODEL_ID,
  'gemini-4-hydrogen',
  'gemini-4-carbon',
  'luxo-auto-router',
  'luxo-flash',
  'chatgpt-5-2-pro',
  'claude-5-5-opus',
  'claude-5-5-sonnet',
  'deepseek-r2',
];

type AvailabilityFilter = 'all' | 'active' | 'locked';

function catalogEntryToModelConfig(entry: CatalogModelEntry): LuxoModelConfig {
  const providerCategoryMap: Record<string, LuxoModelCategory> = {
    google: 'Google Gemini',
    openai: 'OpenAI & ChatGPT',
    anthropic: 'Anthropic Claude',
    openrouter: 'Perplexity & Küresel AI',
    groq: 'Perplexity & Küresel AI',
    deepseek: 'DeepSeek',
    mistral: 'Mistral & Qwen',
    qwen: 'Mistral & Qwen',
    xai: 'Grok & Meta Llama',
    cohere: 'Perplexity & Küresel AI',
    nvidia: 'Perplexity & Küresel AI',
    perplexity: 'Perplexity & Küresel AI',
  };
  const isFree =
    entry.pricingStatus === 'FREE' || entry.pricingStatus === 'FREE_TIER';
  return {
    id: entry.id as LuxoModelId,
    name: entry.name || entry.id,
    badge: isFree ? 'Free' : entry.pricingStatus === 'PAID' ? 'Paid' : 'Catalog',
    category: providerCategoryMap[entry.providerId] || 'Perplexity & Küresel AI',
    provider: entry.providerId as LuxoModelConfig['provider'],
    sdkBackend: entry.adapter || 'openai-compatible',
    tagline: entry.description || `${entry.providerLabel || entry.providerId} · ${entry.id}`,
    description: entry.description || '',
    speed: 'Hızlı',
    isLocked: !entry.executable,
    accentColor: entry.accentColor || '#7c3aed',
    thinkingLevel: 'MEDIUM',
    tier: entry.tier || 'free',
    contextWindow: `${Math.round((entry.contextLength || 128000) / 1000)}K`,
    logoUrl: entry.logoPath,
    allowGuest: true,
    capabilities: entry.capabilities?.length ? entry.capabilities : ['chat'],
    maxInputTokens: entry.contextLength || 128000,
    maxOutputTokens: entry.maxOutputTokens || 8192,
    defaultDailyTokenLimit: 400000,
    systemInstruction: '',
  };
}

export const ModelSelectorDropdown: React.FC<ModelSelectorDropdownProps> = ({
  activeModelId,
  onSelectModel,
  user,
  providerStatus = DEFAULT_PROVIDER_STATUS,
  tokenOverrides,
  catalogModels,
  zeroCostEnabled = false,
  favoriteModelIds = [],
  recentModelIds = [],
  onOpenUpgradeModal,
  onOpenExtendedCatalog,
  onOpenProviderSettings,
  showExtendedCatalog = false,
  compact = false,
  labelPrefix,
  testIdPrefix = 'top-model-selector',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] =
    useState<AvailabilityFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<'Tümü' | LuxoModelCategory>('Tümü');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const catalogMap = useMemo(() => {
    const map = new Map<string, CatalogModelEntry>();
    if (catalogModels) {
      for (const c of catalogModels) {
        map.set(c.id, c);
      }
    }
    return map;
  }, [catalogModels]);

  const { allModelIds, modelMap } = useMemo(() => {
    const baseIds = getSelectableChatModelIds(activeModelId, showExtendedCatalog);
    const mergedMap: Record<string, LuxoModelConfig> = { ...LUXO_MODELS };
    const idSet = new Set<string>(baseIds);

    if (catalogModels) {
      for (const c of catalogModels) {
        if (c.enabled === false) continue;
        if (!mergedMap[c.id]) {
          mergedMap[c.id] = catalogEntryToModelConfig(c);
        }
        if (c.executable || c.id === activeModelId || showExtendedCatalog) {
          idSet.add(c.id);
        }
      }
    }

    if (activeModelId && mergedMap[activeModelId]) {
      idSet.add(activeModelId);
    }

    return {
      allModelIds: Array.from(idSet) as LuxoModelId[],
      modelMap: mergedMap,
    };
  }, [activeModelId, catalogModels, showExtendedCatalog]);

  const effectiveActiveId =
    allModelIds.includes(activeModelId)
      ? activeModelId
      : allModelIds[0] || PUBLIC_CHAT_MODEL_IDS[0];

  const currentModel =
    modelMap[effectiveActiveId] || LUXO_MODELS[DEFAULT_WORKING_MODEL_ID];

  const evaluateAvailability = (modelId: LuxoModelId) => {
    const m = modelMap[modelId];
    const cat = catalogMap.get(modelId);
    if (cat) {
      if (zeroCostEnabled && !cat.zeroCostAllowed) {
        return {
          unlocked: false,
          provider: m?.provider || (cat.providerId as LuxoModelConfig['provider']),
          reason: 'zero_cost_blocked' as const,
          reasonLabelTr: cat.zeroCostReason || 'Zero-Cost Politikası',
        };
      }
      if (!cat.executable) {
        return {
          unlocked: false,
          provider: m?.provider || (cat.providerId as LuxoModelConfig['provider']),
          reason: 'provider_unconfigured' as const,
          reasonLabelTr: 'API Anahtarı Gerekli',
        };
      }
      return {
        unlocked: true,
        provider: m?.provider || (cat.providerId as LuxoModelConfig['provider']),
        reason: 'ok' as const,
        reasonLabelTr:
          cat.pricingStatus === 'FREE' || cat.pricingStatus === 'FREE_TIER'
            ? 'Free · Hazır'
            : 'API Hazır',
      };
    }
    const baseAvail = isModelExecutableWithProviders(
      modelId,
      providerStatus,
      user,
      m?.allowGuest !== false
    );
    if (baseAvail.unlocked && zeroCostEnabled && m) {
      const isFreeProvider = m.provider === 'google' || m.provider === 'luxo' || m.provider === 'local' || m.id.endsWith(':free');
      if (!isFreeProvider) {
        return {
          ...baseAvail,
          unlocked: false,
          reason: 'zero_cost_blocked' as const,
          reasonLabelTr: 'Zero-Cost Politikası',
        };
      }
    }
    return baseAvail;
  };

  const currentAvailability = evaluateAvailability(currentModel.id);

  const visibleCategories = useMemo(() => {
    const presentCats = new Set(
      allModelIds.map((id) => modelMap[id]?.category).filter(Boolean)
    );
    return LUXO_MODEL_CATEGORIES.filter(
      (cat) => cat === 'Tümü' || presentCats.has(cat as LuxoModelCategory)
    );
  }, [allModelIds, modelMap]);

  const { activeModels, lockedModels, totalUnlockedCount } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const active: { model: LuxoModelConfig; reasonLabelTr: string }[] = [];
    const locked: {
      model: LuxoModelConfig;
      reasonLabelTr: string;
      reason?: string;
    }[] = [];
    let unlockedCounter = 0;

    for (const id of allModelIds) {
      const m = modelMap[id];
      if (!m) continue;
      const avail = evaluateAvailability(m.id);
      if (avail.unlocked) unlockedCounter += 1;

      if (categoryFilter !== 'Tümü' && m.category !== categoryFilter) {
        continue;
      }
      if (availabilityFilter === 'active' && !avail.unlocked) continue;
      if (availabilityFilter === 'locked' && avail.unlocked) continue;

      if (q) {
        const providerLabel = PROVIDER_META[avail.provider]?.label || m.provider || '';
        const matches =
          m.name.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          m.tagline.toLowerCase().includes(q) ||
          providerLabel.toLowerCase().includes(q) ||
          m.capabilities.some((c) => c.toLowerCase().includes(q));
        if (!matches) continue;
      }

      if (avail.unlocked) {
        active.push({ model: m, reasonLabelTr: avail.reasonLabelTr });
      } else {
        locked.push({
          model: m,
          reasonLabelTr: avail.reasonLabelTr,
          reason: avail.reason,
        });
      }
    }

    const favSet = new Set(favoriteModelIds);
    const recentIndex = new Map(recentModelIds.map((id, idx) => [id, idx]));
    active.sort((a, b) => {
      const aFav = favSet.has(a.model.id) ? 0 : 1;
      const bFav = favSet.has(b.model.id) ? 0 : 1;
      if (aFav !== bFav) return aFav - bFav;
      const aRec = recentIndex.get(a.model.id) ?? 999;
      const bRec = recentIndex.get(b.model.id) ?? 999;
      if (aRec !== bRec) return aRec - bRec;
      return 0;
    });

    return {
      activeModels: active,
      lockedModels: locked,
      totalUnlockedCount: unlockedCounter,
    };
  }, [
    allModelIds,
    availabilityFilter,
    categoryFilter,
    favoriteModelIds,
    modelMap,
    providerStatus,
    recentModelIds,
    searchQuery,
    user,
    zeroCostEnabled,
    catalogMap,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 30);

    const handlePointerDown = (ev: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(ev.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleChoose = (modelId: LuxoModelId) => {
    const avail = evaluateAvailability(modelId);
    if (!avail.unlocked) {
      setIsOpen(false);
      if (avail.reason === 'tier_locked' || avail.reason === 'guest_restricted') {
        onOpenUpgradeModal?.();
      } else if (onOpenProviderSettings) {
        onOpenProviderSettings();
      } else {
        onOpenExtendedCatalog?.();
      }
      return;
    }
    onSelectModel(modelId);
    setIsOpen(false);
  };

  const renderModelRow = (
    model: LuxoModelConfig,
    unlocked: boolean,
    reasonLabelTr: string
  ) => {
    const isSelected = effectiveActiveId === model.id;
    const isFav = favoriteModelIds.includes(model.id);
    const limits = getEffectiveModelTokenLimits(model.id, tokenOverrides);
    const providerMeta = PROVIDER_META[model.provider];

    return (
      <button
        key={model.id}
        type="button"
        role="option"
        aria-selected={isSelected}
        aria-disabled={!unlocked}
        data-testid={`${testIdPrefix}-option-${model.id}`}
        onClick={() => handleChoose(model.id)}
        className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between gap-2.5 text-left transition cursor-pointer ${
          isSelected
            ? 'bg-violet-600/10 dark:bg-violet-500/15 border border-violet-500/40'
            : unlocked
            ? 'hover:bg-slate-100/80 dark:hover:bg-[#1e2334] border border-transparent'
            : 'opacity-70 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-[#171b29] border border-transparent'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <ModelBrandAvatar
            name={model.name}
            logoUrl={model.logoUrl}
            provider={model.provider}
            modelId={model.id}
            accentColor={model.accentColor}
            sizeClass="w-7 h-7 rounded-lg"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {model.name}
              </span>
              {isFav && (
                <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
              )}
              {!unlocked && (
                <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 shrink-0 truncate">
                  · {reasonLabelTr}
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate tabular-nums">
              {providerMeta?.shortLabel || model.provider || model.category} ·{' '}
              {formatTokenCount(limits.maxInputTokens)} bağlam ·{' '}
              {formatTokenCount(limits.maxOutputTokens)} çıktı
            </div>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-1.5">
          {!unlocked ? (
            <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          ) : isSelected ? (
            <Check className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          ) : null}
        </div>
      </button>
    );
  };

  return (
    <div ref={containerRef} className="relative min-w-0 max-w-full">
      <button
        type="button"
        data-testid={`${testIdPrefix}-btn`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Model Seçici: ${currentModel.name}. Aktif ve kilitli modelleri listelemek için tıklayın`}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`min-h-[40px] sm:min-h-[38px] w-full flex items-center gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800/90 hover:border-violet-500/40 bg-white/80 dark:bg-[#111420] hover:bg-slate-50 dark:hover:bg-[#181c2b] transition cursor-pointer min-w-0 overflow-hidden ${
          compact
            ? 'px-2.5 py-1 text-xs sm:text-sm max-w-[225px] sm:max-w-[320px]'
            : 'px-3 py-1.5 text-sm max-w-[260px] sm:max-w-[340px]'
        } text-slate-900 dark:text-slate-100 font-semibold`}
      >
        <ModelBrandAvatar
          name={currentModel.name}
          logoUrl={currentModel.logoUrl}
          provider={currentModel.provider}
          modelId={currentModel.id}
          accentColor={currentModel.accentColor}
          sizeClass="w-5 h-5 rounded-md"
        />
        <span className="truncate">
          {labelPrefix ? `${labelPrefix} ` : ''}
          {currentModel.name}
        </span>
        {!currentAvailability.unlocked ? (
          <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        ) : (
          <span className="hidden md:inline text-[11px] font-normal text-slate-500 dark:text-slate-400 shrink-0 tabular-nums">
            {totalUnlockedCount} Hazır
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Seçilebilir ve Kilitli Yapay Zeka Modelleri"
          data-testid={`${testIdPrefix}-menu`}
          className="fixed sm:absolute left-2 right-2 sm:left-0 sm:right-auto top-14 sm:top-full sm:mt-1.5 z-50 sm:w-[460px] bg-white dark:bg-[#111420] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[78vh] overflow-hidden"
        >
          <div className="p-3 border-b border-slate-100 dark:border-slate-800/90 space-y-2.5 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                Model Seçimi ·{' '}
                <span className="text-emerald-600 dark:text-emerald-400">
                  {totalUnlockedCount} Aktif
                </span>{' '}
                <span className="text-slate-400">/ {allModelIds.length} Katalog</span>
                {zeroCostEnabled && (
                  <span className="text-violet-600 dark:text-violet-400"> · Zero-Cost</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Model seçiciyi kapat"
                className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                data-testid={`${testIdPrefix}-search`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Model, sağlayıcı veya özellik ara..."
                aria-label="Model listesinde ara"
                className="w-full pl-8 pr-8 py-1.5 rounded-xl bg-slate-100 dark:bg-[#0b0d14] border border-slate-200/80 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-violet-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Model aramasını temizle"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {!searchQuery && categoryFilter === 'Tümü' && (
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                {FLAGSHIP_QUICK_IDS.map((fId) => {
                  const fm = modelMap[fId];
                  if (!fm) return null;
                  const avail = evaluateAvailability(fId);
                  const active = effectiveActiveId === fId;
                  return (
                    <button
                      key={fId}
                      type="button"
                      onClick={() => handleChoose(fId)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition ${
                        active
                          ? 'bg-violet-600 text-white'
                          : avail.unlocked
                          ? 'bg-slate-100 dark:bg-[#181c2b] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#21263a]'
                          : 'bg-slate-100/60 dark:bg-[#141825] text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      <ModelBrandAvatar
                        name={fm.name}
                        logoUrl={fm.logoUrl}
                        provider={fm.provider}
                        modelId={fm.id}
                        accentColor={fm.accentColor}
                        sizeClass="w-3.5 h-3.5 rounded-sm"
                      />
                      <span>
                        {fm.name
                          .replace('Google ', '')
                          .replace('OpenAI ', '')
                          .replace('Anthropic ', '')}
                      </span>
                      {!avail.unlocked && <Lock className="w-2.5 h-2.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {(
                  [
                    { id: 'all', label: 'Tümü' },
                    { id: 'active', label: 'Aktif (API Hazır)' },
                    { id: 'locked', label: 'Kilitli' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    data-testid={`${testIdPrefix}-filter-${tab.id}`}
                    onClick={() => setAvailabilityFilter(tab.id)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap cursor-pointer transition ${
                      availabilityFilter === tab.id
                        ? 'bg-violet-600 text-white'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#181c2b]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <select
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value as 'Tümü' | LuxoModelCategory)
                }
                aria-label="Sağlayıcı Kategorisi Filtresi"
                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-[#181c2b] text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-800 focus:outline-hidden cursor-pointer max-w-[140px] truncate"
              >
                {visibleCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-3">
            {activeModels.length > 0 && (
              <div data-testid={`${testIdPrefix}-active-group`} className="space-y-0.5">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                  <span>Aktif Modeller (API Hazır)</span>
                  <span className="tabular-nums">{activeModels.length}</span>
                </div>
                {activeModels.map((entry) =>
                  renderModelRow(entry.model, true, entry.reasonLabelTr)
                )}
              </div>
            )}

            {lockedModels.length > 0 && (
              <div data-testid={`${testIdPrefix}-locked-group`} className="space-y-0.5">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                  <span>Kilitli Modeller (API / Politika Kilidi)</span>
                  <span className="tabular-nums">{lockedModels.length}</span>
                </div>
                {lockedModels.map((entry) =>
                  renderModelRow(entry.model, false, entry.reasonLabelTr)
                )}
              </div>
            )}

            {activeModels.length === 0 && lockedModels.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-6">
                &ldquo;{searchQuery}&rdquo; ile eşleşen model bulunamadı.
              </p>
            )}
          </div>

          {(onOpenProviderSettings || onOpenExtendedCatalog) && (
            <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-[#0b0d14] shrink-0 flex items-center gap-2">
              <button
                type="button"
                data-testid={`${testIdPrefix}-extended-settings-btn`}
                onClick={() => {
                  setIsOpen(false);
                  if (onOpenProviderSettings) {
                    onOpenProviderSettings();
                  } else {
                    onOpenExtendedCatalog?.();
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#181c2b] hover:bg-slate-100 dark:hover:bg-[#1e2334] border border-slate-200/80 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center justify-between gap-2 transition cursor-pointer"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">
                    API Durumu, Token Limitleri &amp; Katalog ({EXTENDED_CATALOG_MODEL_IDS.length} Ek Model)
                  </span>
                </span>
                <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 shrink-0">
                  Ayarlar →
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

