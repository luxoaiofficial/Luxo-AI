import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  Lock,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import {
  LuxoModelCategory,
  LuxoModelId,
  LuxoUser,
} from '../types/luxo';
import {
  canAccessModel,
  EXTENDED_CATALOG_MODEL_IDS,
  getSelectableChatModelIds,
  LUXO_MODEL_CATEGORIES,
  LUXO_MODELS,
  PUBLIC_CHAT_MODEL_IDS,
} from '../utils/luxoLogic';
import { ModelBrandAvatar } from './LuxoLogo';

interface ModelSelectorDropdownProps {
  activeModelId: LuxoModelId;
  onSelectModel: (modelId: LuxoModelId) => void;
  user: LuxoUser;
  onOpenUpgradeModal?: () => void;
  onOpenExtendedCatalog?: () => void;
  showExtendedCatalog?: boolean;
  isCatalogUnlocked?: boolean;
  compact?: boolean;
  labelPrefix?: string;
  testIdPrefix?: string;
}

const FLAGSHIP_QUICK_IDS: LuxoModelId[] = [
  'gemini-4-carbon',
  'gemini-4-argon',
  'gemini-4-neon',
  'gemini-4-hydrogen',
  'claude-5-5-opus',
  'claude-5-5-sonnet',
  'gpt-astra',
  'chatgpt-5-2-pro',
  'luxo-sol',
  'luxo-luna',
];

export const ModelSelectorDropdown: React.FC<ModelSelectorDropdownProps> = ({
  activeModelId,
  onSelectModel,
  user,
  onOpenUpgradeModal,
  onOpenExtendedCatalog,
  showExtendedCatalog = false,
  isCatalogUnlocked = false,
  compact = false,
  labelPrefix,
  testIdPrefix = 'top-model-selector',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'Tümü' | LuxoModelCategory>('Tümü');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const allModelIds = useMemo(
    () => getSelectableChatModelIds(activeModelId, showExtendedCatalog),
    [activeModelId, showExtendedCatalog]
  );

  const effectiveActiveId =
    allModelIds.includes(activeModelId)
      ? activeModelId
      : allModelIds[0] || PUBLIC_CHAT_MODEL_IDS[0];

  const currentModel =
    LUXO_MODELS[effectiveActiveId] || LUXO_MODELS['gemini-4-carbon'];

  const visibleCategories = useMemo(() => {
    const presentCats = new Set(
      allModelIds.map((id) => LUXO_MODELS[id]?.category).filter(Boolean)
    );
    return LUXO_MODEL_CATEGORIES.filter(
      (cat) => cat === 'Tümü' || presentCats.has(cat as LuxoModelCategory)
    );
  }, [allModelIds]);

  const filteredModels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allModelIds
      .map((id) => LUXO_MODELS[id])
      .filter((m) => {
        if (!m) return false;
        if (categoryFilter !== 'Tümü' && m.category !== categoryFilter) {
          return false;
        }
        if (!q) return true;
        return (
          m.name.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          m.tagline.toLowerCase().includes(q) ||
          m.capabilities.some((c) => c.toLowerCase().includes(q))
        );
      });
  }, [allModelIds, categoryFilter, searchQuery]);

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
    const access = canAccessModel(modelId, user);
    if (!access.allowed) {
      setIsOpen(false);
      onOpenUpgradeModal?.();
      return;
    }
    onSelectModel(modelId);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative min-w-0 max-w-full">
      <button
        type="button"
        data-testid={`${testIdPrefix}-btn`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Model Seçici: ${currentModel.name}. Açık modelleri listelemek için tıklayın`}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`min-h-[44px] sm:min-h-[40px] w-full flex items-center gap-1.5 sm:gap-2 rounded-xl border transition cursor-pointer shadow-xs min-w-0 overflow-hidden ${
          compact
            ? 'px-2 sm:px-2.5 py-1.5 text-xs max-w-[190px] sm:max-w-[300px]'
            : 'px-3 py-1.5 text-xs sm:text-sm max-w-[230px] sm:max-w-[320px]'
        } bg-white dark:bg-[#202123] border-neutral-200/90 dark:border-neutral-700/80 hover:border-neutral-300 dark:hover:border-neutral-600 text-neutral-900 dark:text-white font-semibold`}
      >
        <ModelBrandAvatar
          name={currentModel.name}
          logoUrl={currentModel.logoUrl}
          accentColor={currentModel.accentColor}
          sizeClass="w-5 h-5 rounded-md"
        />
        <span className="truncate">
          {labelPrefix ? `${labelPrefix} ` : ''}
          {currentModel.name}
        </span>
        <span className="hidden md:inline-block px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[10px] font-medium text-neutral-500 dark:text-neutral-400 shrink-0 tabular-nums">
          {allModelIds.length} Model
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-neutral-500 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Seçilebilir Yapay Zeka Modelleri"
          data-testid={`${testIdPrefix}-menu`}
          className="fixed sm:absolute left-2 right-2 sm:left-0 sm:right-auto top-14 sm:top-full sm:mt-2 z-50 sm:w-[440px] bg-white dark:bg-[#1b1c20] border border-neutral-200 dark:border-neutral-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[75vh] overflow-hidden"
        >
          <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 space-y-2.5 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-white">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>
                  {showExtendedCatalog
                    ? `Tüm Modeller (${allModelIds.length} Yapay Zeka)`
                    : `Açık Amiral Gemisi Modeller (${allModelIds.length} AI)`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Model seçiciyi kapat"
                className="w-6 h-6 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-800 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                data-testid={`${testIdPrefix}-search`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Model ara (Claude 5.5, Fable, Gemini 4, GPT-Astra, Sol, Luna)..."
                aria-label="Model listesinde ara"
                className="w-full pl-8 pr-8 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#131418] border border-neutral-200/80 dark:border-neutral-700/80 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Model aramasını temizle"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {!searchQuery && categoryFilter === 'Tümü' && (
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                {FLAGSHIP_QUICK_IDS.map((fId) => {
                  const fm = LUXO_MODELS[fId];
                  if (!fm) return null;
                  const active = activeModelId === fId;
                  return (
                    <button
                      key={fId}
                      type="button"
                      onClick={() => handleChoose(fId)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer transition ${
                        active
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <ModelBrandAvatar
                        name={fm.name}
                        logoUrl={fm.logoUrl}
                        accentColor={fm.accentColor}
                        sizeClass="w-4 h-4 rounded-sm"
                      />
                      <span>
                        {fm.name
                          .replace('Google ', '')
                          .replace('OpenAI ', '')
                          .replace('Anthropic ', '')}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {visibleCategories.map((cat) => {
                const isSelected = categoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {filteredModels.map((model) => {
              const access = canAccessModel(model.id, user);
              const isSelected = effectiveActiveId === model.id;
              return (
                <button
                  key={model.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-testid={`${testIdPrefix}-option-${model.id}`}
                  onClick={() => handleChoose(model.id)}
                  className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between gap-2.5 text-left transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-700/60'
                      : 'hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <ModelBrandAvatar
                      name={model.name}
                      logoUrl={model.logoUrl}
                      accentColor={model.accentColor}
                      sizeClass="w-7 h-7 rounded-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {model.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium shrink-0">
                          {model.contextWindow}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                        {model.tagline}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {!access.allowed ? (
                      <Lock className="w-3.5 h-3.5 text-amber-500" />
                    ) : isSelected ? (
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    ) : null}
                  </div>
                </button>
              );
            })}
            {filteredModels.length === 0 && (
              <p className="text-xs text-neutral-500 text-center py-6">
                &ldquo;{searchQuery}&rdquo; ile eşleşen model bulunamadı.
              </p>
            )}
          </div>

          {onOpenExtendedCatalog && (
            <div className="p-2 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/90 dark:bg-[#141519] shrink-0">
              <button
                type="button"
                data-testid={`${testIdPrefix}-extended-settings-btn`}
                onClick={() => {
                  setIsOpen(false);
                  onOpenExtendedCatalog();
                }}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1e2026] hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center justify-between gap-2 transition cursor-pointer"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">
                    Diğer Modeller ({EXTENDED_CATALOG_MODEL_IDS.length} Model · Ayarlar)
                  </span>
                </span>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                  {isCatalogUnlocked ? 'Açık →' : 'Şifreli →'}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
