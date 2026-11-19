export const DEFAULT_WAVE_BAR_COUNT = 24;

/**
 * Generates idle resting amplitudes in [0.14, 0.22] for symmetrical waveform bars.
 */
export function getIdleWaveLevels(
  barCount: number = DEFAULT_WAVE_BAR_COUNT
): number[] {
  const safeCount = Math.max(4, Math.min(64, Math.round(barCount)));
  const center = (safeCount - 1) / 2;
  return Array.from({ length: safeCount }, (_, i) => {
    const dist = Math.abs(i - center) / Math.max(1, center);
    const level = 0.22 - dist * 0.08;
    return Number(level.toFixed(3));
  });
}

/**
 * Maps Web Audio AnalyserNode byte frequency bins [0..255] into symmetric,
 * center-weighted normalized bar heights in [0.14, 1.0].
 */
export function normalizeFrequencyLevels(
  bins: ArrayLike<number>,
  barCount: number = DEFAULT_WAVE_BAR_COUNT
): number[] {
  const safeCount = Math.max(4, Math.min(64, Math.round(barCount)));
  const binLen = bins?.length || 0;
  if (binLen === 0) {
    return getIdleWaveLevels(safeCount);
  }

  const half = Math.ceil(safeCount / 2);
  const usableBins = Math.max(1, Math.floor(binLen * 0.72));
  const levels = new Array<number>(safeCount);

  for (let offset = 0; offset < half; offset++) {
    const binStart = Math.floor((offset / half) * usableBins);
    const binEnd = Math.max(
      binStart + 1,
      Math.floor(((offset + 1) / half) * usableBins)
    );
    let sum = 0;
    let count = 0;
    for (let b = binStart; b < binEnd && b < binLen; b++) {
      sum += Math.max(0, Math.min(255, Number(bins[b]) || 0));
      count++;
    }
    const avgNorm = count > 0 ? sum / (count * 255) : 0;
    // Slight vocal-band emphasis toward the center of the spectrum
    const centerEnvelope = 1 - (offset / Math.max(1, half)) * 0.35;
    const scaled = Math.min(
      1,
      Math.max(0.14, 0.14 + Math.pow(avgNorm, 0.78) * 0.92 * centerEnvelope)
    );
    const rounded = Number(scaled.toFixed(3));

    const leftIdx = Math.floor((safeCount - 1) / 2) - offset;
    const rightIdx = Math.ceil((safeCount - 1) / 2) + offset;
    if (leftIdx >= 0) levels[leftIdx] = rounded;
    if (rightIdx < safeCount) levels[rightIdx] = rounded;
  }

  return levels;
}

/**
 * Deterministic multi-harmonic vocal envelope fallback for environments where
 * microphone hardware or AnalyserNode frequency bytes are unavailable (e.g. Web Speech only).
 */
export function synthesizeSpeakingWaveLevels(
  phase: number,
  barCount: number = DEFAULT_WAVE_BAR_COUNT,
  intensity: number = 0.78
): number[] {
  const safeCount = Math.max(4, Math.min(64, Math.round(barCount)));
  const clampedIntensity = Math.min(1, Math.max(0.2, intensity));
  const center = (safeCount - 1) / 2;

  return Array.from({ length: safeCount }, (_, i) => {
    const dist = Math.abs(i - center) / Math.max(1, center);
    const envelope = Math.max(0.25, 1 - dist * 0.62);
    const h1 = Math.sin(phase * 1.9 + i * 0.55);
    const h2 = Math.cos(phase * 3.1 - i * 0.38) * 0.5;
    const h3 = Math.sin(phase * 0.85 + i * 0.22) * 0.35;
    const energy = Math.abs(h1 + h2 + h3) / 1.85;
    const height = Math.min(
      1,
      Math.max(0.16, 0.16 + energy * envelope * clampedIntensity * 0.84)
    );
    return Number(height.toFixed(3));
  });
}
