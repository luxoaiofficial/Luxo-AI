import React, { useMemo, useState } from 'react';
import {
  Activity,
  Check,
  Cpu,
  DollarSign,
  Search,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Zap,
} from 'lucide-react';
import type {
  LuxoModelCategory,
  LuxoModelId,
  SelfEvolutionState,
} from '../types/luxo';
import { LUXO_MODEL_CATEGORIES } from '../utils/luxoLogic';
import {
  type AdvisorTaskType,
  buildAllModelPerformanceMetrics,
  filterAndSortModelMetrics,
  type ModelMetricsSortKey,
  recommendModelsForTask,
} from '../utils/modelMetricsEngine';

interface ModelPerformanceMetricsPanelProps {
  evolutionState: SelfEvolutionState;
  activeModelId: LuxoModelId;
  disabledModelIds?: LuxoModelId[];
  onToggleModelEnabled: (modelId: LuxoModelId) => void;
  onSelectModel: (modelId: LuxoModelId) => void;
}

const ADVISOR_TASKS: { id: AdvisorTaskType; label: string }[] = [
  { id: 'general', label: 'Genel Amaçlı' },
  { id: 'coding', label: 'Kod & Mimari' },
  { id: 'math', label: 'Matematik & Mantık' },
  { id: 'speed', label: 'Hız & Düşük Maliyet' },
  { id: 'cinema', label: '4K Görsel & Sinema' },
];

export const ModelPerformanceMetricsPanel: React.FC<
  ModelPerformanceMetricsPanelProps
> = ({
  evolutionState,
  activeModelId,
  disabledModelIds = [],
  onToggleModelEnabled,
  onSelectModel,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<
    'Tümü' | LuxoModelCategory
  >('Tümü');
  const [enabledOnly, setEnabledOnly] = useState(false);
  const [sortBy, setSortBy] = useState<ModelMetricsSortKey>('usage_desc');
  const [advisorTask, setAdvisorTask] = useState<AdvisorTaskType>('general');
  const [showAllModels, setShowAllModels] = useState(false);

  const allMetrics = useMemo(
    () => buildAllModelPerformanceMetrics(evolutionState, disabledModelIds),
    [disabledModelIds, evolutionState]
  );

  const filteredMetrics = useMemo(
    () =>
      filterAndSortModelMetrics(allMetrics, {
        query: searchQuery,
        category: selectedCategory,
        enabledOnly,
        sortBy,
      }),
    [allMetrics, enabledOnly, searchQuery, selectedCategory, sortBy]
  );

  const isFilterActive =
    searchQuery.trim().length > 0 ||
    selectedCategory !== 'Tümü' ||
    enabledOnly;

  const visibleMetrics = useMemo(
    () =>
      showAllModels || isFilterActive
        ? filteredMetrics
        : filteredMetrics.slice(0, 20),
    [filteredMetrics, isFilterActive, showAllModels]
  );

  const advisorRecommendations = useMemo(
    () => recommendModelsForTask(allMetrics, advisorTask),
    [advisorTask, allMetrics]
  );

  const summaryStats = useMemo(() => {
    const enabledList = allMetrics.filter((m) => m.enabled);
    const basePool = enabledList.length > 0 ? enabledList : allMetrics;
    const avgLatency = Math.round(
      basePool.reduce((s, m) => s + m.latencyMs, 0) / basePool.length
    );
    const avgAcc = (
      basePool.reduce((s, m) => s + m.accuracyScore, 0) / basePool.length
    ).toFixed(1);
    const totalCalls = allMetrics.reduce((s, m) => s + m.usageCount, 0);
    const minCost = Math.min(...allMetrics.map((m) => m.costInputPer1M));
    return {
      enabledCount: enabledList.length,
      totalCount: allMetrics.length,
      avgLatency,
      avgAcc,
      totalCalls,
      minCost,
    };
  }, [allMetrics]);

  return (
    <section
      id="model-performance-metrics-panel"
      data-testid="model-performance-metrics-panel"
      className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] space-y-5"
    >
      {/* Header & Summary Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              AI Model Performans, Gecikme &amp; Maliyet Metrikleri ({summaryStats.enabledCount}/{summaryStats.totalCount})
            </span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Tüm yapay zeka modellerinin ortalama yanıt gecikmesi (ms), 1M token maliyeti ve 7 döngülük kullanım geçmişi.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs tabular-nums shrink-0">
          <div className="px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#202227] border border-neutral-200/80 dark:border-neutral-800">
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Etkin Model
            </div>
            <div className="font-bold text-neutral-900 dark:text-white font-mono">
              {summaryStats.enabledCount}/{summaryStats.totalCount}
            </div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#202227] border border-neutral-200/80 dark:border-neutral-800">
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Ort. Gecikme
            </div>
            <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {summaryStats.avgLatency} ms
            </div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#202227] border border-neutral-200/80 dark:border-neutral-800">
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
              En Düşük Giriş
            </div>
            <div className="font-bold text-neutral-900 dark:text-white font-mono">
              ${summaryStats.minCost.toFixed(2)}/1M
            </div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#202227] border border-neutral-200/80 dark:border-neutral-800">
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Ort. Doğruluk
            </div>
            <div className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
              %{summaryStats.avgAcc}
            </div>
          </div>
        </div>
      </div>

      {/* Best-Fit Advisor Strip */}
      <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-white">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>İsteğinize En Uygun Model Önerisi (Karar Destek)</span>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {ADVISOR_TASKS.map((t) => (
              <button
                key={t.id}
                type="button"
                data-testid={`advisor-task-${t.id}`}
                onClick={() => setAdvisorTask(t.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                  advisorTask === t.id
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                    : 'bg-white dark:bg-[#202227] border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {advisorRecommendations.map(({ metric, reason }) => {
            const isActive = metric.modelId === activeModelId;
            return (
              <div
                key={metric.modelId}
                className="p-3 rounded-xl bg-white dark:bg-[#18191d] border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between gap-2.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: metric.accentColor }}
                      />
                      <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        {metric.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 shrink-0 tabular-nums">
                      {metric.latencyMs} ms
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-1.5 leading-snug">
                    {reason}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px] tabular-nums">
                  <span className="font-mono text-neutral-500 dark:text-neutral-400">
                    ${metric.costInputPer1M.toFixed(2)} / ${metric.costOutputPer1M.toFixed(2)} 1M
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectModel(metric.modelId)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isActive ? 'Aktif Model' : 'Bu Modeli Seç'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters & Sorting Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              data-testid="model-metrics-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="115 model içinde ad, ID veya yetenek ara..."
              aria-label="Model metriklerinde ara"
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(e.target.value as 'Tümü' | LuxoModelCategory)
            }
            aria-label="Model kategori filtresi"
            className="px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-800 dark:text-neutral-200 outline-none cursor-pointer"
          >
            <option value="Tümü">Tüm Ekosistemler (115 Model)</option>
            {LUXO_MODEL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <label className="inline-flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer select-none px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-[#141518]">
            <input
              type="checkbox"
              checked={enabledOnly}
              onChange={(e) => setEnabledOnly(e.target.checked)}
              className="accent-blue-600 cursor-pointer"
            />
            <span>Yalnızca Etkin</span>
          </label>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as ModelMetricsSortKey)}
            aria-label="Model sıralama ölçütü"
            data-testid="model-metrics-sort"
            className="px-3 py-2 rounded-xl bg-neutral-50 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 outline-none cursor-pointer"
          >
            <option value="usage_desc">Sırala: En Çok Kullanılan</option>
            <option value="latency_asc">Sırala: En Düşük Gecikme (ms)</option>
            <option value="cost_asc">Sırala: En Düşük Maliyet ($)</option>
            <option value="accuracy_desc">Sırala: En Yüksek Doğruluk (%)</option>
            <option value="name_asc">Sırala: Model Adı (A–Z)</option>
          </select>
        </div>
      </div>

      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 tabular-nums flex flex-wrap items-center justify-between gap-2">
        <span data-testid="model-metrics-count">
          Gösterilen model sayısı: {visibleMetrics.length} / {filteredMetrics.length} (Toplam {allMetrics.length} aktif katalog)
        </span>
        <span>Aktif seçim: {activeModelId}</span>
      </div>

      {/* Desktop Data Table (md+) */}
      <div className="hidden md:block overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-neutral-50 dark:bg-[#141518] border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400">
              <th className="py-2.5 px-3 font-semibold">Model &amp; Kategori</th>
              <th className="py-2.5 px-3 font-semibold">
                <span className="inline-flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Gecikme
                </span>
              </th>
              <th className="py-2.5 px-3 font-semibold">
                <span className="inline-flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Maliyet (1M)
                </span>
              </th>
              <th className="py-2.5 px-3 font-semibold">
                <span className="inline-flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-indigo-500" /> Kullanım Geçmişi
                </span>
              </th>
              <th className="py-2.5 px-3 font-semibold">İsabet</th>
              <th className="py-2.5 px-3 font-semibold text-right">Durum &amp; Seçim</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {visibleMetrics.map((m) => {
              const maxHist = Math.max(1, ...m.usageHistory);
              const isSelected = m.modelId === activeModelId;
              return (
                <tr
                  key={m.modelId}
                  data-testid={`metric-row-${m.modelId}`}
                  className={`transition ${
                    m.enabled
                      ? 'hover:bg-neutral-50/70 dark:hover:bg-neutral-800/30'
                      : 'opacity-55 bg-neutral-50/40 dark:bg-neutral-900/20'
                  }`}
                >
                  <td className="py-2.5 px-3 max-w-[260px]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: m.accentColor }}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-neutral-900 dark:text-white truncate">
                          {m.name}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                          {m.category} · {m.contextWindow} · {m.badge}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 font-mono tabular-nums whitespace-nowrap">
                    <span
                      className={`font-semibold ${
                        m.latencyMs < 460
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : m.latencyMs < 820
                          ? 'text-neutral-900 dark:text-white'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {m.latencyMs} ms
                    </span>
                  </td>

                  <td className="py-2.5 px-3 font-mono tabular-nums whitespace-nowrap">
                    <div className="text-neutral-900 dark:text-white font-semibold">
                      ${m.costInputPer1M.toFixed(2)} / ${m.costOutputPer1M.toFixed(2)}
                    </div>
                    <div className="text-[10px] font-sans text-neutral-500 dark:text-neutral-400">
                      {m.costTier}
                    </div>
                  </td>

                  <td className="py-2.5 px-3 tabular-nums">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex items-end gap-0.5 h-5 w-16 shrink-0"
                        aria-label={`7 döngü kullanım trendi: ${m.usageHistory.join(', ')}`}
                      >
                        {m.usageHistory.map((val, idx) => (
                          <span
                            key={idx}
                            className="flex-1 rounded-xs transition-all"
                            style={{
                              height: `${Math.max(18, Math.round((val / maxHist) * 100))}%`,
                              backgroundColor: m.accentColor,
                              opacity: 0.45 + idx * 0.08,
                            }}
                          />
                        ))}
                      </div>
                      <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200 whitespace-nowrap">
                        {m.usageCount}
                      </span>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 font-mono font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums whitespace-nowrap">
                    %{m.accuracyScore}
                  </td>

                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleModelEnabled(m.modelId)}
                        aria-label={`${m.name} modelini ${m.enabled ? 'devre dışı bırak' : 'etkinleştir'}`}
                        className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                      >
                        {m.enabled ? (
                          <ToggleRight className="w-6 h-6 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-neutral-400" />
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={!m.enabled}
                        onClick={() => onSelectModel(m.modelId)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer disabled:opacity-40 ${
                          isSelected
                            ? 'bg-emerald-600 text-white inline-flex items-center gap-1'
                            : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{isSelected ? 'Aktif' : 'Seç'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Compact Cards (< md) */}
      <div className="md:hidden divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl">
        {visibleMetrics.map((m) => {
          const isSelected = m.modelId === activeModelId;
          return (
            <div
              key={m.modelId}
              className={`p-3.5 space-y-2 ${!m.enabled ? 'opacity-55' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: m.accentColor }}
                    />
                    <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                      {m.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {m.category} · {m.contextWindow}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleModelEnabled(m.modelId)}
                  aria-label={`${m.name} etkinleştir/kapat`}
                  className="shrink-0 cursor-pointer"
                >
                  {m.enabled ? (
                    <ToggleRight className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-neutral-400" />
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono tabular-nums text-neutral-700 dark:text-neutral-300">
                <span>{m.latencyMs} ms</span>
                <span>
                  ${m.costInputPer1M.toFixed(2)}/${m.costOutputPer1M.toFixed(2)} 1M
                </span>
                <span>{m.usageCount} çağrı</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                  %{m.accuracyScore}
                </span>
                <button
                  type="button"
                  disabled={!m.enabled}
                  onClick={() => onSelectModel(m.modelId)}
                  className={`px-2.5 py-1 rounded-lg font-sans font-semibold cursor-pointer disabled:opacity-40 ${
                    isSelected
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                  }`}
                >
                  {isSelected ? 'Aktif' : 'Seç'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!isFilterActive && filteredMetrics.length > 20 && (
        <div className="flex items-center justify-center pt-1">
          <button
            type="button"
            data-testid="toggle-all-models-btn"
            onClick={() => setShowAllModels((prev) => !prev)}
            className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 hover:bg-neutral-100 dark:bg-[#202227] dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition cursor-pointer"
          >
            {showAllModels
              ? 'İlk 20 Modeli Göster (Daralt)'
              : `Tüm ${filteredMetrics.length} Modeli Göster`}
          </button>
        </div>
      )}
    </section>
  );
};
