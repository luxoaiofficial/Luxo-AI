import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { BarChart3, CheckCircle2, Clock } from 'lucide-react';
import type { EvolutionModelMetric } from '../types/luxo';
import {
  buildPerformanceInsightsData,
  type PerformanceInsightBarDatum,
} from '../utils/performanceInsightsD3';

interface PerformanceInsightsCardProps {
  modelMetrics?: Record<string, EvolutionModelMetric>;
  onSelectModel?: (modelId: string) => void;
}

export const PerformanceInsightsCard: React.FC<
  PerformanceInsightsCardProps
> = ({ modelMetrics, onSelectModel }) => {
  const [metricMode, setMetricMode] = useState<'latencyMs' | 'successRate'>(
    'latencyMs'
  );
  const [hoveredDatum, setHoveredDatum] =
    useState<PerformanceInsightBarDatum | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState<number>(620);

  const data = useMemo(
    () =>
      buildPerformanceInsightsData(
        modelMetrics,
        metricMode === 'latencyMs' ? 'latency' : 'success',
        8
      ),
    [modelMetrics, metricMode]
  );

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const updateWidth = () => {
      const next = Math.max(320, Math.floor(el.clientWidth || 620));
      setChartWidth(next);
    };
    updateWidth();
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(updateWidth);
      ro.observe(el);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    const svgNode = svgRef.current;
    if (!svgNode || data.length === 0) return;

    const svg = d3.select(svgNode);
    svg.selectAll('*').remove();

    const height = 270;
    const margin = { top: 22, right: 20, bottom: 58, left: 52 };
    const innerWidth = Math.max(200, chartWidth - margin.left - margin.right);
    const innerHeight = height - margin.top - margin.bottom;

    svg
      .attr('viewBox', `0 0 ${chartWidth} ${height}`)
      .attr('width', chartWidth)
      .attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand<string>()
      .domain(data.map((d) => d.shortLabel))
      .range([0, innerWidth])
      .padding(0.28);

    const maxY =
      metricMode === 'latencyMs'
        ? Math.max(900, (d3.max(data, (d) => d.latencyMs) || 900) * 1.15)
        : 100;
    const minY = metricMode === 'latencyMs' ? 0 : 90;

    const y = d3
      .scaleLinear()
      .domain([minY, maxY])
      .nice()
      .range([innerHeight, 0]);

    // Horizontal grid lines
    const gridTicks = y.ticks(4);
    g.append('g')
      .attr('class', 'd3-grid')
      .selectAll('line')
      .data(gridTicks)
      .join('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => y(d))
      .attr('y2', (d) => y(d))
      .attr('stroke', 'currentColor')
      .attr('stroke-opacity', 0.1)
      .attr('stroke-dasharray', '3,3');

    // Y Axis
    const yAxis = d3
      .axisLeft(y)
      .ticks(4)
      .tickFormat((v) =>
        metricMode === 'latencyMs' ? `${v}ms` : `${v}%`
      );
    const yAxisG = g.append('g').call(yAxis);
    yAxisG.selectAll('path,line').attr('stroke', 'currentColor').attr('stroke-opacity', 0.18);
    yAxisG
      .selectAll('text')
      .attr('fill', 'currentColor')
      .attr('fill-opacity', 0.65)
      .style('font-size', '10px');

    // X Axis
    const xAxis = d3.axisBottom(x).tickSizeOuter(0);
    const xAxisG = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);
    xAxisG.selectAll('path,line').attr('stroke', 'currentColor').attr('stroke-opacity', 0.18);
    xAxisG
      .selectAll('text')
      .attr('fill', 'currentColor')
      .attr('fill-opacity', 0.78)
      .style('font-size', '10px')
      .style('font-weight', '600')
      .attr('transform', 'rotate(-16)')
      .style('text-anchor', 'end');

    // Bars
    const bars = g
      .selectAll<SVGRectElement, PerformanceInsightBarDatum>('rect.d3-bar')
      .data(data, (d) => d.modelId)
      .join('rect')
      .attr('class', 'd3-bar')
      .attr('x', (d) => x(d.shortLabel) ?? 0)
      .attr('width', Math.max(14, x.bandwidth()))
      .attr('rx', 7)
      .attr('ry', 7)
      .attr('fill', (d) => d.accentColor)
      .attr('fill-opacity', 0.88)
      .style('cursor', onSelectModel ? 'pointer' : 'default')
      .attr('y', innerHeight)
      .attr('height', 0)
      .on('mouseenter', (_event, d) => {
        setHoveredDatum(d);
      })
      .on('mouseleave', () => {
        setHoveredDatum(null);
      })
      .on('click', (_event, d) => {
        onSelectModel?.(d.modelId);
      });

    bars
      .transition()
      .duration(420)
      .attr('y', (d) =>
        y(metricMode === 'latencyMs' ? d.latencyMs : d.successRate)
      )
      .attr('height', (d) =>
        Math.max(
          4,
          innerHeight -
            y(metricMode === 'latencyMs' ? d.latencyMs : d.successRate)
        )
      );

    // Value labels above bars
    g.selectAll<SVGTextElement, PerformanceInsightBarDatum>('text.d3-val')
      .data(data, (d) => d.modelId)
      .join('text')
      .attr('class', 'd3-val')
      .attr('x', (d) => (x(d.shortLabel) ?? 0) + x.bandwidth() / 2)
      .attr(
        'y',
        (d) =>
          y(metricMode === 'latencyMs' ? d.latencyMs : d.successRate) - 6
      )
      .attr('text-anchor', 'middle')
      .attr('fill', 'currentColor')
      .attr('fill-opacity', 0.85)
      .style('font-size', '10px')
      .style('font-weight', '700')
      .text((d) =>
        metricMode === 'latencyMs'
          ? `${d.latencyMs}ms`
          : `%${d.successRate.toFixed(1)}`
      );
  }, [chartWidth, data, metricMode, onSelectModel]);

  return (
    <section
      data-testid="performance-insights-card"
      className="p-5 rounded-3xl bg-white dark:bg-[#202123] border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <span>Performance Insights</span>
          </h3>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            evolutionState.modelMetrics üzerinden D3.js ile canlı model gecikme ve başarı oranı analizi
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setMetricMode('latencyMs')}
            data-testid="d3-metric-latency"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer ${
              metricMode === 'latencyMs'
                ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Gecikme (ms)</span>
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('successRate')}
            data-testid="d3-metric-success"
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer ${
              metricMode === 'successRate'
                ? 'bg-white dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Başarı Oranı (%)</span>
          </button>
        </div>
      </div>

      <div
        ref={wrapperRef}
        className="relative w-full text-neutral-700 dark:text-neutral-300 overflow-x-auto"
      >
        <svg
          ref={svgRef}
          data-testid="performance-insights-d3-svg"
          className="w-full block"
          role="img"
          aria-label="Performance Insights D3 Bar Chart"
        />

        {hoveredDatum && (
          <div className="mt-2 px-3 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-950 text-white text-xs flex flex-wrap items-center justify-between gap-3 border border-neutral-700">
            <span className="font-bold">{hoveredDatum.label}</span>
            <div className="flex items-center gap-3 text-[11px] tabular-nums">
              <span>Gecikme: {hoveredDatum.latencyMs} ms</span>
              <span>Başarı: %{hoveredDatum.successRate.toFixed(1)}</span>
              <span>Çağrı: {hoveredDatum.callCount}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
