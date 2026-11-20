import React, { useMemo, useState } from 'react';
import { Activity, BarChart3, Cpu, TrendingUp, Zap } from 'lucide-react';
import type { SelfEvolutionState } from '../types/luxo';
import { LUXO_MODELS } from '../utils/luxoLogic';
import { buildEvolutionDashboardSummary } from '../utils/selfEvolutionEngine';

interface EvolutionDashboardPanelProps {
  evolutionState: SelfEvolutionState;
  onOpenModelMetrics?: () => void;
}

const TRIGGER_LABELS: Record<string, string> = {
  manual: 'Manuel Evrim',
  'auto-site': 'Otonom Döngü',
  'chat-signal': 'Kullanıcı Sinyali',
  'full-audit': 'Tam Ekosistem Denetimi',
  'custom-train': 'Özel Eğitim',
  benchmark: 'Canlı Kıyaslama',
};

export const EvolutionDashboardPanel: React.FC<EvolutionDashboardPanelProps> = ({
  evolutionState,
  onOpenModelMetrics,
}) => {
  const summary = useMemo(
    () => buildEvolutionDashboardSummary(evolutionState, LUXO_MODELS),
    [evolutionState]
  );

  const [selectedCycleIdx, setSelectedCycleIdx] = useState<number | null>(null);

  const series = summary.cycleSeries;
  const activeIdx =
    selectedCycleIdx !== null && selectedCycleIdx < series.length
      ? selectedCycleIdx
      : Math.max(0, series.length - 1);
  const activePoint = series[activeIdx];

  // Compute SVG chart coordinates (viewBox 640x220)
  const chart = useMemo(() => {
    const width = 640;
    const height = 220;
    const padLeft = 46;
    const padRight = 24;
    const padTop = 22;
    const padBottom = 34;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    if (series.length === 0) {
      return {
        width,
        height,
        padLeft,
        padRight,
        padTop,
        padBottom,
        plotW,
        plotH,
        points: [],
        accuracyPath: '',
        areaPath: '',
        latencyPath: '',
        minAcc: 95,
        maxAcc: 100,
      };
    }

    const accValues = series.map((s) => s.avgAccuracy);
    const minAcc = Math.floor(Math.min(...accValues) - 0.8);
    const maxAcc = Math.min(100, Math.ceil(Math.max(...accValues) + 0.5));
    const accRange = Math.max(1, maxAcc - minAcc);

    const latValues = series.map((s) => s.avgLatencyMs);
    const minLat = Math.max(250, Math.min(...latValues) - 60);
    const maxLat = Math.max(minLat + 100, Math.max(...latValues) + 40);
    const latRange = Math.max(1, maxLat - minLat);

    const pts = series.map((pt, idx) => {
      const x =
        series.length === 1
          ? padLeft + plotW / 2
          : padLeft + (idx / (series.length - 1)) * plotW;
      const yAcc =
        padTop + plotH - ((pt.avgAccuracy - minAcc) / accRange) * plotH;
      const yLat =
        padTop + plotH - ((pt.avgLatencyMs - minLat) / latRange) * plotH;
      return {
        x: Math.round(x * 10) / 10,
        yAcc: Math.round(yAcc * 10) / 10,
        yLat: Math.round(yLat * 10) / 10,
        data: pt,
        idx,
      };
    });

    const accuracyPath = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yAcc}`)
      .join(' ');
    const areaPath =
      pts.length > 0
        ? `${accuracyPath} L ${pts[pts.length - 1].x} ${padTop + plotH} L ${pts[0].x} ${padTop + plotH} Z`
        : '';
    const latencyPath = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.yLat}`)
      .join(' ');

    return {
      width,
      height,
      padLeft,
      padRight,
      padTop,
      padBottom,
      plotW,
      plotH,
      points: pts,
      accuracyPath,
      areaPath,
      latencyPath,
      minAcc,
      maxAcc,
    };
  }, [series]);

  const maxModelCount = Math.max(
    1,
    ...summary.topModels.map((m) => m.count)
  );

  return (
    <div data-testid="evolution-dashboard-panel" className="space-y-5">
      {/* Top 3 Compact Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-[#202123] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Toplam Model Çağrısı
            </div>
            <div
              data-testid="dashboard-total-model-calls"
              className="text-xl font-bold text-neutral-900 dark:text-white mt-0.5 tabular-nums"
            >
              {summary.totalCalls.toLocaleString('tr-TR')}
            </div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 tabular-nums">
              {summary.activeUsedModelsCount} aktif kullanılan model
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#202123] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Eğitim Döngüsü İsabet Trendi
            </div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
              %{summary.avgAccuracy}
            </div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 tabular-nums">
              {series.length} kaydedilen evrim noktası
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#202123] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Ortalama Ekosistem Gecikmesi
            </div>
            <div className="text-xl font-bold text-neutral-900 dark:text-white mt-0.5 tabular-nums">
              {summary.avgLatencyMs} ms
            </div>
            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 tabular-nums">
              {evolutionState.totalBugsPatched} toplam doğrulama yaması
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Chart + Model Usage Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Training Cycle Performance History Chart */}
        <section className="lg:col-span-7 p-4 sm:p-5 rounded-xl bg-white dark:bg-[#202123] border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Eğitim Döngüsü Performans Geçmişi</span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Her evrim turunda doğruluk oranı (%) ve ortalama gecikme (ms) değişimi
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-neutral-600 dark:text-neutral-300">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-indigo-500 inline-block" />
                <span>İsabet (%)</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 border-t border-dashed border-emerald-500 inline-block" />
                <span>Gecikme (ms)</span>
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <svg
              data-testid="evolution-cycle-chart"
              viewBox={`0 0 ${chart.width} ${chart.height}`}
              role="img"
              aria-label="Eğitim döngüsü performans geçmişi grafiği"
              className="w-full h-52 sm:h-56 select-none"
            >
              <defs>
                <linearGradient id="evoAccFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.24" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
                const y = chart.padTop + chart.plotH * t;
                const val =
                  chart.maxAcc - (chart.maxAcc - chart.minAcc) * t;
                return (
                  <g key={idx}>
                    <line
                      x1={chart.padLeft}
                      x2={chart.width - chart.padRight}
                      y1={y}
                      y2={y}
                      stroke="currentColor"
                      className="text-neutral-200 dark:text-neutral-800"
                      strokeWidth="1"
                    />
                    <text
                      x={chart.padLeft - 8}
                      y={y + 3}
                      textAnchor="end"
                      className="fill-neutral-400 text-[10px] font-mono"
                    >
                      {val.toFixed(0)}%
                    </text>
                  </g>
                );
              })}

              {/* Area Fill */}
              {chart.areaPath && (
                <path d={chart.areaPath} fill="url(#evoAccFill)" />
              )}

              {/* Latency Dashed Line */}
              {chart.latencyPath && (
                <path
                  d={chart.latencyPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.75"
                  strokeDasharray="4 4"
                  opacity="0.75"
                />
              )}

              {/* Accuracy Main Line */}
              {chart.accuracyPath && (
                <path
                  d={chart.accuracyPath}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Data Points */}
              {chart.points.map((pt) => {
                const isSelected = pt.idx === activeIdx;
                return (
                  <g
                    key={pt.idx}
                    onClick={() => setSelectedCycleIdx(pt.idx)}
                    onMouseEnter={() => setSelectedCycleIdx(pt.idx)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.yAcc}
                      r={isSelected ? 6 : 4}
                      fill={isSelected ? '#4f46e5' : '#ffffff'}
                      stroke="#4f46e5"
                      strokeWidth="2.2"
                    />
                    <text
                      x={pt.x}
                      y={chart.height - 10}
                      textAnchor="middle"
                      className={`text-[10px] font-mono ${
                        isSelected
                          ? 'fill-indigo-600 dark:fill-indigo-400 font-bold'
                          : 'fill-neutral-400'
                      }`}
                    >
                      v{pt.data.generation}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {activePoint && (
            <div className="px-3.5 py-2.5 rounded-lg bg-neutral-50 dark:bg-[#18181b] border border-neutral-200/80 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums">
              <div className="font-semibold text-neutral-900 dark:text-white">
                Nesil v{activePoint.generation} ·{' '}
                <span className="text-neutral-500 dark:text-neutral-400 font-normal">
                  {TRIGGER_LABELS[activePoint.trigger] || activePoint.trigger}
                </span>
              </div>
              <div className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  %{activePoint.avgAccuracy} isabet
                </span>
                <span className="text-neutral-300 dark:text-neutral-700">|</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {activePoint.avgLatencyMs} ms
                </span>
                <span className="text-neutral-300 dark:text-neutral-700">|</span>
                <span>{activePoint.bugsPatched} yama</span>
              </div>
            </div>
          )}
        </section>

        {/* Model Usage Statistics Card */}
        <section className="lg:col-span-5 p-4 sm:p-5 rounded-xl bg-white dark:bg-[#202123] border border-neutral-200 dark:border-neutral-800 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Model Kullanım İstatistikleri</span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                En çok tercih edilen yapay zeka motorları ve payları
              </p>
            </div>
            {onOpenModelMetrics && (
              <button
                type="button"
                onClick={onOpenModelMetrics}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer whitespace-nowrap"
              >
                Tüm 115 Model →
              </button>
            )}
          </div>

          <div
            data-testid="dashboard-model-usage-list"
            className="space-y-3 flex-1"
          >
            {summary.topModels.map((item) => {
              const widthPct = Math.max(
                8,
                Math.round((item.count / maxModelCount) * 100)
              );
              return (
                <div key={item.modelId} className="space-y-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.accentColor }}
                      />
                      <span className="font-semibold text-neutral-900 dark:text-white truncate">
                        {item.modelName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300 shrink-0 tabular-nums font-mono text-[11px]">
                      <span>{item.count}</span>
                      <span className="text-neutral-400">
                        (%{item.sharePct})
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: item.accentColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-neutral-200/80 dark:border-neutral-800 grid grid-cols-2 gap-2 text-[11px] tabular-nums">
            {summary.categoryUsage.slice(0, 4).map((cat) => (
              <div
                key={cat.category}
                className="px-2.5 py-2 rounded-lg bg-neutral-50 dark:bg-[#18181b] border border-neutral-200/70 dark:border-neutral-800 flex items-center justify-between gap-1"
              >
                <span className="text-neutral-600 dark:text-neutral-300 truncate">
                  {cat.category}
                </span>
                <span className="font-mono font-semibold text-neutral-900 dark:text-white shrink-0">
                  {cat.count}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
