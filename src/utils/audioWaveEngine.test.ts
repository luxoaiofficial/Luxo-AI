import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_WAVE_BAR_COUNT,
  getIdleWaveLevels,
  normalizeFrequencyLevels,
  synthesizeSpeakingWaveLevels,
} from './audioWaveEngine.ts';

test('getIdleWaveLevels returns symmetric resting bar amplitudes', () => {
  const levels = getIdleWaveLevels(24);
  assert.equal(levels.length, 24);
  assert.equal(levels[0], levels[levels.length - 1]);
  assert.ok(levels.every((v) => v >= 0.12 && v <= 0.3));
  assert.ok(levels[11] > levels[0]);
});

test('normalizeFrequencyLevels maps silent and active FFT bins to bounded symmetric bars', () => {
  const silent = normalizeFrequencyLevels(new Uint8Array(32), 20);
  assert.equal(silent.length, 20);
  assert.ok(silent.every((v) => v >= 0.14 && v <= 0.2));

  const loudBins = new Uint8Array(32).fill(220);
  const loud = normalizeFrequencyLevels(loudBins, 20);
  assert.equal(loud.length, 20);
  assert.equal(loud[0], loud[loud.length - 1]);
  assert.ok(loud[9] > 0.75);
  assert.ok(loud.every((v) => v >= 0.14 && v <= 1.0));
});

test('synthesizeSpeakingWaveLevels produces animated variation across phases', () => {
  const frameA = synthesizeSpeakingWaveLevels(0.5, DEFAULT_WAVE_BAR_COUNT, 0.85);
  const frameB = synthesizeSpeakingWaveLevels(2.1, DEFAULT_WAVE_BAR_COUNT, 0.85);

  assert.equal(frameA.length, DEFAULT_WAVE_BAR_COUNT);
  assert.equal(frameB.length, DEFAULT_WAVE_BAR_COUNT);
  assert.ok(frameA.every((v) => v >= 0.14 && v <= 1.0));

  const diffSum = frameA.reduce(
    (sum, val, idx) => sum + Math.abs(val - frameB[idx]),
    0
  );
  assert.ok(diffSum > 1.2, 'Expected distinct animation frames over time');
});
