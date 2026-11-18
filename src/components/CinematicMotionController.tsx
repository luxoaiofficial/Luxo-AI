import React from 'react';
import {
  Clapperboard,
  Gauge,
  MoveHorizontal,
  MoveVertical,
  Play,
  RotateCcw,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { CinematicMotionParams } from '../types/luxo';
import {
  DEFAULT_CINEMATIC_MOTION,
  describeCinematicMotion,
  normalizeCinematicMotion,
} from '../utils/luxoLogic';

export interface CinematicMotionPreset {
  id: string;
  label: string;
  params: CinematicMotionParams;
}

export const CINEMATIC_MOTION_PRESETS: CinematicMotionPreset[] = [
  {
    id: 'balanced-dolly',
    label: 'Dengeli Sinema (1.0x)',
    params: { cameraSpeed: 1.0, pan: 0, tilt: 0 },
  },
  {
    id: 'slow-crane-up',
    label: 'Ağır Çekim Vinç (+Tilt)',
    params: { cameraSpeed: 0.55, pan: 12, tilt: 38 },
  },
  {
    id: 'orbit-pan-right',
    label: 'Panoramik Sağ Pan',
    params: { cameraSpeed: 1.15, pan: 55, tilt: 8 },
  },
  {
    id: 'dramatic-pan-left',
    label: 'Geniş Sol Takip',
    params: { cameraSpeed: 1.25, pan: -50, tilt: -10 },
  },
  {
    id: 'fpv-dive',
    label: 'FPV Hızlı Dalış (2.0x)',
    params: { cameraSpeed: 2.0, pan: 20, tilt: -35 },
  },
];

interface CinematicMotionControllerProps {
  value: CinematicMotionParams;
  onChange: (next: CinematicMotionParams) => void;
  mode?: 'inline' | 'modal';
  prompt?: string;
  onChangePrompt?: (nextPrompt: string) => void;
  highFidelity?: boolean;
  onToggleHighFidelity?: (next: boolean) => void;
  onConfirmRender?: () => void;
  onCancel?: () => void;
  isRendering?: boolean;
}

export const CinematicMotionController: React.FC<
  CinematicMotionControllerProps
> = ({
  value,
  onChange,
  mode = 'inline',
  prompt = '',
  onChangePrompt,
  highFidelity = false,
  onToggleHighFidelity,
  onConfirmRender,
  onCancel,
  isRendering = false,
}) => {
  const safe = normalizeCinematicMotion(value);
  const { summaryTr } = describeCinematicMotion(safe);

  const reticleX = Math.max(-42, Math.min(42, (safe.pan / 100) * 42));
  const reticleY = Math.max(-34, Math.min(34, (-safe.tilt / 90) * 34));

  const handleReset = () => {
    onChange({ ...DEFAULT_CINEMATIC_MOTION });
  };

  const controllerBody = (
    <div
      className={
        mode === 'modal'
          ? 'w-full max-w-xl bg-white dark:bg-[#191a20] rounded-2xl p-5 sm:p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-5 text-neutral-900 dark:text-neutral-100'
          : 'p-4 rounded-2xl bg-white dark:bg-[#1c1d22] border border-neutral-200 dark:border-neutral-800 space-y-4'
      }
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white tracking-tight">
              Sinematik Hareket Kontrolcüsü (Google Veo 3)
            </h3>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Render başlamadan önce kamera hızını, yatay pan ve dikey tilt açısını ayarlayın ·{' '}
            <span className="font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
              {summaryTr}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
            aria-label="Kamera Hareketini Sıfırla"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sıfırla</span>
          </button>
          {mode === 'modal' && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              aria-label="Hareket Kontrolcüsünü Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Prompt Editor when opened as Pre-Render Modal in App.tsx */}
      {mode === 'modal' && onChangePrompt && (
        <div className="space-y-1.5">
          <label
            htmlFor="veo-motion-prompt-input"
            className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300"
          >
            Video Sahne İstemi
          </label>
          <textarea
            id="veo-motion-prompt-input"
            rows={2}
            value={prompt}
            onChange={(e) => onChangePrompt(e.target.value)}
            placeholder="Google Veo 3 için sahneyi tarif edin..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-[#131418] border border-neutral-200 dark:border-neutral-800 text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-hidden focus:border-indigo-500 resize-none"
          />
        </div>
      )}

      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-1.5">
        {CINEMATIC_MOTION_PRESETS.map((preset) => {
          const isSelected =
            Math.abs(safe.cameraSpeed - preset.params.cameraSpeed) < 0.04 &&
            safe.pan === preset.params.pan &&
            safe.tilt === preset.params.tilt;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange({ ...preset.params })}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white'
                  : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Main Grid: 3 Dynamic Sliders + Live Optical Trajectory Reticle */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-8 space-y-3.5">
          {/* Camera Speed */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor={`veo-speed-slider-${mode}`}
                className="font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5"
              >
                <Gauge className="w-3.5 h-3.5 text-indigo-500" />
                <span>Kamera Hızı (Camera Speed)</span>
              </label>
              <span className="font-mono font-semibold text-neutral-900 dark:text-white tabular-nums">
                {safe.cameraSpeed.toFixed(2)}x
              </span>
            </div>
            <input
              id={`veo-speed-slider-${mode}`}
              type="range"
              min={0.25}
              max={2.5}
              step={0.05}
              value={safe.cameraSpeed}
              onChange={(e) =>
                onChange(
                  normalizeCinematicMotion({
                    ...safe,
                    cameraSpeed: parseFloat(e.target.value),
                  })
                )
              }
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-neutral-400 font-mono tabular-nums">
              <span>0.25x Ağır Çekim</span>
              <span>1.00x Doğal</span>
              <span>2.50x Hiper-Akış</span>
            </div>
          </div>

          {/* Horizontal Pan */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor={`veo-pan-slider-${mode}`}
                className="font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5"
              >
                <MoveHorizontal className="w-3.5 h-3.5 text-sky-500" />
                <span>Yatay Pan (Sol / Sağ)</span>
              </label>
              <span className="font-mono font-semibold text-neutral-900 dark:text-white tabular-nums">
                {safe.pan > 0 ? `+${safe.pan}° Sağ` : safe.pan < 0 ? `${safe.pan}° Sol` : '0° Merkez'}
              </span>
            </div>
            <input
              id={`veo-pan-slider-${mode}`}
              type="range"
              min={-100}
              max={100}
              step={5}
              value={safe.pan}
              onChange={(e) =>
                onChange(
                  normalizeCinematicMotion({
                    ...safe,
                    pan: parseInt(e.target.value, 10),
                  })
                )
              }
              className="w-full accent-sky-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-neutral-400 font-mono tabular-nums">
              <span>-100° Sol</span>
              <span>0° Sabit</span>
              <span>+100° Sağ</span>
            </div>
          </div>

          {/* Vertical Tilt */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor={`veo-tilt-slider-${mode}`}
                className="font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5"
              >
                <MoveVertical className="w-3.5 h-3.5 text-emerald-500" />
                <span>Dikey Tilt (Aşağı / Yukarı)</span>
              </label>
              <span className="font-mono font-semibold text-neutral-900 dark:text-white tabular-nums">
                {safe.tilt > 0
                  ? `+${safe.tilt}° Yukarı`
                  : safe.tilt < 0
                  ? `${safe.tilt}° Aşağı`
                  : '0° Ufuk'}
              </span>
            </div>
            <input
              id={`veo-tilt-slider-${mode}`}
              type="range"
              min={-90}
              max={90}
              step={5}
              value={safe.tilt}
              onChange={(e) =>
                onChange(
                  normalizeCinematicMotion({
                    ...safe,
                    tilt: parseInt(e.target.value, 10),
                  })
                )
              }
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-neutral-400 font-mono tabular-nums">
              <span>-90° Aşağı</span>
              <span>0° Ufuk</span>
              <span>+90° Yukarı</span>
            </div>
          </div>
        </div>

        {/* Interactive Optical Frame Visualizer */}
        <div className="md:col-span-4">
          <div
            data-testid="cinematic-motion-reticle"
            className="aspect-video rounded-xl bg-neutral-950 border border-neutral-800 relative overflow-hidden flex items-center justify-center p-3"
          >
            {/* Rule of thirds hairlines */}
            <div className="absolute inset-x-0 top-1/3 border-t border-white/10 pointer-events-none" />
            <div className="absolute inset-x-0 top-2/3 border-t border-white/10 pointer-events-none" />
            <div className="absolute inset-y-0 left-1/3 border-l border-white/10 pointer-events-none" />
            <div className="absolute inset-y-0 left-2/3 border-l border-white/10 pointer-events-none" />

            {/* Vector Trajectory SVG */}
            <svg
              className="w-full h-full"
              viewBox="-60 -45 120 90"
              aria-hidden="true"
            >
              <circle
                cx="0"
                cy="0"
                r="3"
                className="fill-neutral-500"
              />
              <line
                x1="0"
                y1="0"
                x2={reticleX}
                y2={reticleY}
                stroke="#6366f1"
                strokeWidth={Math.max(1.5, Math.min(3.5, safe.cameraSpeed * 1.4))}
                strokeLinecap="round"
              />
              <rect
                x={reticleX - 14}
                y={reticleY - 9}
                width="28"
                height="18"
                rx="3"
                fill="rgba(99, 102, 241, 0.22)"
                stroke="#818cf8"
                strokeWidth="1.4"
              />
              <circle cx={reticleX} cy={reticleY} r="2.5" fill="#38bdf8" />
            </svg>

            <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-neutral-300 tabular-nums pointer-events-none">
              <span>VEO 3 OPTİK</span>
              <span>{safe.cameraSpeed.toFixed(2)}x</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Footer Actions */}
      {mode === 'modal' && (
        <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
          {onToggleHighFidelity ? (
            <label className="inline-flex items-center gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={highFidelity}
                onChange={(e) => onToggleHighFidelity(e.target.checked)}
                className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span>4K UHD · 60fps Optik İnterpolasyon</span>
            </label>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2 ml-auto">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition cursor-pointer"
              >
                Vazgeç
              </button>
            )}
            <button
              type="button"
              disabled={isRendering || !prompt.trim()}
              onClick={onConfirmRender}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Clapperboard className="w-3.5 h-3.5" />
              <span>Google Veo 3 ile Sentezle</span>
              <Play className="w-3 h-3 fill-current" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (mode === 'modal') {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sinematik Hareket Kontrolcüsü"
        onClick={(e) => {
          if (e.target === e.currentTarget && onCancel) {
            onCancel();
          }
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs"
      >
        {controllerBody}
      </div>
    );
  }

  return controllerBody;
};
