import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Pause,
  Play,
  RefreshCw,
} from 'lucide-react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { LuxoModelId } from '../types/luxo';
import type { ModelPerformanceMetric } from '../utils/modelMetricsEngine';
import {
  appendLiveTelemetryTick,
  availabilityKey,
  buildLastHourTelemetrySeries,
  latencyKey,
  type LiveTelemetryPoint,
  selectTopTrackedModels,
  type TopTrackedModelMeta,
} from '../utils/liveModelTelemetry';

interface LiveModelTelemetryChartProps {
  modelMetrics: ModelPerformanceMetric[];
  activeModelId: LuxoModelId;
  isDarkTheme: boolean;
  onSelectModel: (modelId: LuxoModelId) => void;
  recordedLatencies?: Partial<Record<LuxoModelId, number>>;
}

type TelemetryChartMode = 'latency' | 'availability' | 'combined';

interface TooltipPayloadEntry {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string;
}

const TelemetryCustomTooltip: React.FC<{
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  mode: TelemetryChartMode;
  topModels: TopTrackedModelMeta[];
}> = ({ active, payload, label, mode, topModels }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="p-3 rounded-xl bg-white dark:bg-[#141518] border border-neutral-200 dark:border-neutral-700 shadow-lg text-xs space-y-1.5 min-w-[210px]">
      <div className="font-mono font-bold text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-1 tabular-nums">
        Saat: {label}
      </div>
      <div className="space-y-1">
        {payload.map((entry, idx) => {
          const dk = String(entry.dataKey || '');
          let displayName = entry.name || dk;
          let suffix = '';
          if (dk === 'avgLatencyMs') {
            displayName = 'Top 5 Ort. Gecikme';
            suffix = ' ms';
          } else if (dk === 'avgAvailabilityPct') {
            displayName = 'Top 5 Ort. Erişilebilirlik';
            suffix = '%';
          } else if (dk.startsWith('lat_')) {
            const matched = topModels.find((m) => latencyKey(m.modelId) === dk);
            displayName = matched?.shortName || displayName;
            suffix = ' ms';
          } else if (dk.startsWith('avail_')) {
            const matched = topModels.find(
              (m) => availabilityKey(m.modelId) === dk
            );
            displayName = matched?.shortName || displayName;
            suffix = '%';
          } else {
            suffix = mode === 'availability' ? '%' : ' ms';
          }

          return (
            <div
              key={`${dk}-${idx}`}
              className="flex items-center justify-between gap-3 tabular-nums"
            >
              <span className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300 truncate max-w-[140px]">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color || '#2563eb' }}
                />
                <span className="truncate">{displayName}</span>
              </span>
              <span className="font-mono font-bold text-neutral-900 dark:text-white shrink-0">
                {entry.value}
                {suffix}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const LiveModelTelemetryChart: React.FC<
  LiveModelTelemetryChartProps
> = ({
  modelMetrics,
  activeModelId,
  isDarkTheme,
  onSelectModel,
  recordedLatencies,
}) => {
  const [chartMode, setChartMode] = useState<TelemetryChartMode>('latency');
  const [isLive, setIsLive] = useState(true);
  const [focusedModelId, setFocusedModelId] = useState<LuxoModelId | null>(
    null
  );
  const tickCounterRef = useRef(0);

  const topModels = useMemo(
    () => selectTopTrackedModels(modelMetrics, 5),
    [modelMetrics]
  );

  const topSignature = useMemo(
    () => topModels.map((m) => `${m.modelId}:${m.currentLatencyMs}`).join('|'),
    [topModels]
  );

  const [series, setSeries] = useState<LiveTelemetryPoint[]>(() =>
    buildLastHourTelemetrySeries(topModels, Date.now(), recordedLatencies)
  );

  useEffect(() => {
    setSeries(
      buildLastHourTelemetrySeries(topModels, Date.now(), recordedLatencies)
    );
  }, [topSignature, recordedLatencies]);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      tickCounterRef.current += 1;
      setSeries((prev) =>
        appendLiveTelemetryTick(
          prev,
          topModels,
          tickCounterRef.current,
          Date.now(),
          recordedLatencies
        )
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [isLive, topModels, recordedLatencies]);

  const handleManualRefresh = () => {
    tickCounterRef.current += 1;
    setSeries((prev) =>
      appendLiveTelemetryTick(
        prev,
        topModels,
        tickCounterRef.current,
        Date.now(),
        recordedLatencies
      )
    );
  };

  const latestPoint = series[series.length - 1];
  const gridColor = isDarkTheme ? '#27272a' : '#e5e7eb';
  const axisTickColor = isDarkTheme ? '#a1a1aa' : '#6b7280';

  return (
    <section
      data-testid="live-latency-availability-tracker"
      className="p-5 sm:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18191d] space-y-4"
    >
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Canlı Gecikme &amp; Erişilebilirlik Takibi (İlk 5 Model · Son 1 Saat)
            </span>
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 tabular-nums">
            Son 60 dakikalık gerçek zamanlı yanıt süresi (ms) ve çalışma yüzdesi (%) · Son ölçüm:{' '}
            <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
              {latestPoint?.timeLabel || '--:--'}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Chart Metric Switcher */}
          <div className="inline-flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-[#141518] border border-neutral-200 dark:border-neutral-800">
            {(
              [
                { id: 'latency', label: 'Gecikme (ms)' },
                { id: 'availability', label: 'Erişilebilirlik (%)' },
                { id: 'combined', label: 'Birleşik Özet' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                data-testid={`telemetry-mode-${tab.id}`}
                onClick={() => setChartMode(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                  chartMode === tab.id
                    ? 'bg-white dark:bg-[#23262e] text-neutral-900 dark:text-white shadow-2xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            data-testid="telemetry-live-toggle-btn"
            onClick={() => setIsLive((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              isLive
                ? 'bg-emerald-50 dark:bg-emerald-950/35 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-neutral-50 dark:bg-[#141518] border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
            }`}
          >
            {isLive ? (
              <>
                <Pause className="w-3.5 h-3.5 shrink-0" />
                <span>Canlı Akış Açık</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 shrink-0" />
                <span>Duraklatıldı</span>
              </>
            )}
          </button>

          <button
            type="button"
            data-testid="telemetry-refresh-btn"
            onClick={handleManualRefresh}
            className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 hover:bg-neutral-100 dark:bg-[#141518] dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            <span>Şimdi Ölç</span>
          </button>
        </div>
      </div>

      {/* Top 5 Tracked Models Live KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 tabular-nums">
        {topModels.map((model) => {
          const liveLat = Number(
            latestPoint?.[latencyKey(model.modelId)] ?? model.currentLatencyMs
          );
          const liveAvail = Number(
            latestPoint?.[availabilityKey(model.modelId)] ??
              model.currentAvailabilityPct
          );
          const isFocused = focusedModelId === model.modelId;
          const isActiveModel = activeModelId === model.modelId;

          return (
            <div
              key={model.modelId}
              data-testid={`telemetry-top-model-${model.modelId}`}
              className={`p-3 rounded-xl border transition flex flex-col justify-between gap-2 ${
                isFocused
                  ? 'bg-white dark:bg-[#1e2027] border-neutral-900 dark:border-white'
                  : 'bg-neutral-50 dark:bg-[#141518] border-neutral-200/80 dark:border-neutral-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFocusedModelId((prev) =>
                      prev === model.modelId ? null : model.modelId
                    )
                  }
                  className="flex items-center gap-1.5 min-w-0 text-left cursor-pointer"
                  title="Grafikte bu modeli vurgula"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: model.color }}
                  />
                  <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                    {model.shortName}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectModel(model.modelId)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                    isActiveModel
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-[#202227] border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {isActiveModel ? 'Aktif' : 'Seç'}
                </button>
              </div>

              <div className="flex items-baseline justify-between gap-2 text-xs font-mono">
                <span className="font-bold text-neutral-900 dark:text-white">
                  {liveLat} ms
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  %{liveAvail.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recharts Interactive Time-Series Chart */}
      <div
        data-testid="live-telemetry-recharts-container"
        className="w-full h-[280px] rounded-xl bg-neutral-50/70 dark:bg-[#141518] border border-neutral-200/80 dark:border-neutral-800 p-3 sm:p-4"
      >
        <ResponsiveContainer width="100%" height={250}>
          {chartMode === 'combined' ? (
            <ComposedChart
              data={series}
              margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridColor}
                vertical={false}
              />
              <XAxis
                dataKey="timeLabel"
                stroke={axisTickColor}
                tick={{ fontSize: 11, fill: axisTickColor }}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                width={64}
                stroke="#2563eb"
                tick={{ fontSize: 11, fill: axisTickColor }}
                tickLine={false}
                unit=" ms"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                width={58}
                domain={[97.5, 100]}
                stroke="#10b981"
                tick={{ fontSize: 11, fill: axisTickColor }}
                tickLine={false}
                unit="%"
              />
              <Tooltip
                content={
                  <TelemetryCustomTooltip
                    mode={chartMode}
                    topModels={topModels}
                  />
                }
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="avgLatencyMs"
                name="Top 5 Ort. Gecikme"
                stroke="#2563eb"
                fill="#2563eb"
                fillOpacity={isDarkTheme ? 0.2 : 0.12}
                strokeWidth={2.4}
                isAnimationActive={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avgAvailabilityPct"
                name="Top 5 Ort. Erişilebilirlik"
                stroke="#10b981"
                strokeWidth={2.4}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive={false}
              />
            </ComposedChart>
          ) : (
            <LineChart
              data={series}
              margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridColor}
                vertical={false}
              />
              <XAxis
                dataKey="timeLabel"
                stroke={axisTickColor}
                tick={{ fontSize: 11, fill: axisTickColor }}
                tickLine={false}
              />
              <YAxis
                width={64}
                domain={chartMode === 'availability' ? [97.5, 100] : ['auto', 'auto']}
                stroke={axisTickColor}
                tick={{ fontSize: 11, fill: axisTickColor }}
                tickLine={false}
                unit={chartMode === 'availability' ? '%' : ' ms'}
              />
              <Tooltip
                content={
                  <TelemetryCustomTooltip
                    mode={chartMode}
                    topModels={topModels}
                  />
                }
              />
              {topModels.map((model) => {
                const isDimmed =
                  focusedModelId !== null && focusedModelId !== model.modelId;
                return (
                  <Line
                    key={model.modelId}
                    type="monotone"
                    dataKey={
                      chartMode === 'availability'
                        ? availabilityKey(model.modelId)
                        : latencyKey(model.modelId)
                    }
                    name={model.shortName}
                    stroke={model.color}
                    strokeWidth={isDimmed ? 1.3 : 2.3}
                    strokeOpacity={isDimmed ? 0.28 : 1}
                    dot={false}
                    activeDot={{ r: 4 }}
                    isAnimationActive={false}
                  />
                );
              })}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  );
};
