import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { GoogleGenAI } from '@google/genai';
import { sanitizeLuxoBrand } from './luxoLogic.ts';
import {
  parseVisualPrompt,
  renderBackdropSvgLayer,
  renderHeroSubjectSvgLayer,
  renderMidgroundSvgLayer,
} from './visualSceneComposer.ts';

const execFileAsync = promisify(execFile);

export const VIDEO_STORAGE_DIR = path.join(os.tmpdir(), 'luxo-videos');

export type SceneArchetype =
  | 'bosphorus'
  | 'metropolis'
  | 'ocean'
  | 'cosmos'
  | 'robotics'
  | 'nature';

export interface DirectedSceneSpec {
  archetype: SceneArchetype;
  skyTop: string;
  skyBottom: string;
  accentPrimary: string;
  accentSecondary: string;
  horizonGlow: string;
  narrationText: string;
  shotCaption: string;
}

function ensureVideoDir(): void {
  if (!fs.existsSync(VIDEO_STORAGE_DIR)) {
    fs.mkdirSync(VIDEO_STORAGE_DIR, { recursive: true });
  }
}

function escapeSvgText(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function detectSceneArchetype(prompt: string, style: string): SceneArchetype {
  const lower = `${prompt} ${style}`.toLowerCase();
  if (/(boğaz|istanbul|köprü|vapur|deniz aracı|sahil|yalı|bosphorus)/.test(lower)) {
    return 'bosphorus';
  }
  if (/(okyanus|dalga|su altı|mercan|biyolüminesan|deniz|göl|ocean|beach)/.test(lower)) {
    return 'ocean';
  }
  if (/(robot|laboratuvar|çip|işlemci|yapay zeka|mekanik|lazer|teknoloji|fabrika)/.test(lower)) {
    return 'robotics';
  }
  if (/(uzay|galaksi|gezegen|yörünge|nebula|yıldız|astronot|mars|kuantum|cosmos|space)/.test(lower)) {
    return 'cosmos';
  }
  if (/(orman|dağ|doğa|şelale|vadi|ağaç|kütüphane|biyofilik|bahçe|çiçek)/.test(lower)) {
    return 'nature';
  }
  return 'metropolis';
}

export function buildDefaultSceneSpec(
  prompt: string,
  style: string
): DirectedSceneSpec {
  const cleanPrompt = sanitizeLuxoBrand(prompt.trim() || 'Sinematik gelecek vizyonu');
  const archetype = detectSceneArchetype(cleanPrompt, style);

  if (style === 'Siberpunk') {
    return {
      archetype,
      skyTop: '#070312',
      skyBottom: '#2e1065',
      accentPrimary: '#06b6d4',
      accentSecondary: '#f43f5e',
      horizonGlow: '#a855f7',
      narrationText: `${cleanPrompt.slice(0, 110)}.`,
      shotCaption: cleanPrompt.slice(0, 56),
    };
  }

  switch (archetype) {
    case 'bosphorus':
      return {
        archetype,
        skyTop: '#0c192c',
        skyBottom: '#7c2d12',
        accentPrimary: '#f59e0b',
        accentSecondary: '#38bdf8',
        horizonGlow: '#fb923c',
        narrationText: `${cleanPrompt.slice(0, 110)}.`,
        shotCaption: cleanPrompt.slice(0, 56),
      };
    case 'ocean':
      return {
        archetype,
        skyTop: '#030712',
        skyBottom: '#0c4a6e',
        accentPrimary: '#22d3ee',
        accentSecondary: '#38bdf8',
        horizonGlow: '#0284c7',
        narrationText: `${cleanPrompt.slice(0, 110)}.`,
        shotCaption: cleanPrompt.slice(0, 56),
      };
    case 'cosmos':
      return {
        archetype,
        skyTop: '#03030b',
        skyBottom: '#1e1b4b',
        accentPrimary: '#818cf8',
        accentSecondary: '#f472b6',
        horizonGlow: '#6366f1',
        narrationText: `${cleanPrompt.slice(0, 110)}.`,
        shotCaption: cleanPrompt.slice(0, 56),
      };
    case 'robotics':
      return {
        archetype,
        skyTop: '#090d16',
        skyBottom: '#1e293b',
        accentPrimary: '#38bdf8',
        accentSecondary: '#a78bfa',
        horizonGlow: '#0ea5e9',
        narrationText: `${cleanPrompt.slice(0, 110)}.`,
        shotCaption: cleanPrompt.slice(0, 56),
      };
    case 'nature':
      return {
        archetype,
        skyTop: '#052e16',
        skyBottom: '#115e59',
        accentPrimary: '#34d399',
        accentSecondary: '#fbbf24',
        horizonGlow: '#10b981',
        narrationText: `${cleanPrompt.slice(0, 110)}.`,
        shotCaption: cleanPrompt.slice(0, 56),
      };
    default:
      return {
        archetype: 'metropolis',
        skyTop: '#080d1a',
        skyBottom: '#1e3a8a',
        accentPrimary: '#60a5fa',
        accentSecondary: '#f59e0b',
        horizonGlow: '#3b82f6',
        narrationText: `${cleanPrompt.slice(0, 110)}.`,
        shotCaption: cleanPrompt.slice(0, 56),
      };
  }
}

function isValidHexColor(val: unknown): val is string {
  return typeof val === 'string' && /^#[0-9a-fA-F]{6}$/.test(val.trim());
}

async function directSceneWithGemini(
  ai: GoogleGenAI | null,
  prompt: string,
  style: string
): Promise<DirectedSceneSpec> {
  const fallback = buildDefaultSceneSpec(prompt, style);
  if (!ai) return fallback;

  try {
    const resp = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `Sahne istemi: "${prompt}" (Stil: ${style}). Bu video sahnesi için JSON döndür: {"skyTop":"#RRGGBB","skyBottom":"#RRGGBB","accentPrimary":"#RRGGBB","accentSecondary":"#RRGGBB","horizonGlow":"#RRGGBB","narrationText":"Sahneyi betimleyen tek cümlelik etkileyici Türkçe dış ses metni (en fazla 14 kelime)"}. Sadece JSON döndür.`,
    });
    const raw = resp.text || '';
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]) as Record<string, unknown>;
      return {
        archetype: fallback.archetype,
        skyTop: isValidHexColor(parsed.skyTop) ? parsed.skyTop : fallback.skyTop,
        skyBottom: isValidHexColor(parsed.skyBottom)
          ? parsed.skyBottom
          : fallback.skyBottom,
        accentPrimary: isValidHexColor(parsed.accentPrimary)
          ? parsed.accentPrimary
          : fallback.accentPrimary,
        accentSecondary: isValidHexColor(parsed.accentSecondary)
          ? parsed.accentSecondary
          : fallback.accentSecondary,
        horizonGlow: isValidHexColor(parsed.horizonGlow)
          ? parsed.horizonGlow
          : fallback.horizonGlow,
        narrationText:
          typeof parsed.narrationText === 'string' &&
          parsed.narrationText.trim().length > 4
            ? sanitizeLuxoBrand(parsed.narrationText.trim()).slice(0, 140)
            : fallback.narrationText,
        shotCaption: fallback.shotCaption,
      };
    }
  } catch {
    // Use deterministic scene spec
  }
  return fallback;
}

function buildBackgroundLayerSvg(
  spec: DirectedSceneSpec,
  width: number,
  height: number,
  promptText = '',
  style = 'Sinematik'
): string {
  const parsed = parseVisualPrompt(promptText || spec.shotCaption, style);
  return renderBackdropSvgLayer(
    {
      ...parsed,
      skyTop: spec.skyTop || parsed.skyTop,
      skyBottom: spec.skyBottom || parsed.skyBottom,
      primaryColor: spec.accentPrimary || parsed.primaryColor,
      secondaryColor: spec.accentSecondary || parsed.secondaryColor,
    },
    width,
    height
  );
}

function buildMidgroundLayerSvg(
  spec: DirectedSceneSpec,
  width: number,
  height: number,
  promptText = '',
  style = 'Sinematik'
): string {
  const parsed = parseVisualPrompt(promptText || spec.shotCaption, style);
  return renderMidgroundSvgLayer(
    {
      ...parsed,
      primaryColor: spec.accentPrimary || parsed.primaryColor,
      secondaryColor: spec.accentSecondary || parsed.secondaryColor,
    },
    width,
    height
  );
}

function buildForegroundMovingSvg(
  spec: DirectedSceneSpec,
  promptText = '',
  style = 'Sinematik',
  heroWidthPx = 440
): string {
  const parsed = parseVisualPrompt(promptText || spec.shotCaption, style);
  const heroHeightPx = Math.round(heroWidthPx * 0.75);
  return renderHeroSubjectSvgLayer(parsed, heroWidthPx, heroHeightPx);
}

export function synthesizeAmbientScoreWav(durationSec: number): Buffer {
  const sampleRate = 24000;
  const totalSamples = Math.max(1, Math.floor(sampleRate * durationSec));
  const dataBytes = totalSamples * 2;
  const buf = Buffer.alloc(44 + dataBytes);

  // Standard 44-byte RIFF WAV header (24kHz, 16-bit mono PCM)
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataBytes, 40);

  // Warm cinematic A-minor9 ambient pad chord (110Hz, 164.81Hz, 220Hz, 261.63Hz, 329.63Hz)
  const freqs = [110.0, 164.81, 220.0, 261.63, 329.63];
  const weights = [0.34, 0.24, 0.2, 0.12, 0.1];

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const fadeIn = Math.min(1, t / 0.65);
    const fadeOut = Math.min(1, (durationSec - t) / 0.85);
    const envelope = Math.max(0, fadeIn * fadeOut);
    const lfo = 0.82 + 0.18 * Math.sin(2 * Math.PI * 0.35 * t);

    let sample = 0;
    for (let f = 0; f < freqs.length; f++) {
      sample += weights[f] * Math.sin(2 * Math.PI * freqs[f] * t);
    }

    const pcmVal = Math.max(
      -32767,
      Math.min(32767, Math.round(sample * envelope * lfo * 9500))
    );
    buf.writeInt16LE(pcmVal, 44 + i * 2);
  }

  return buf;
}

async function generateSceneAudioWav(
  ai: GoogleGenAI | null,
  narrationText: string,
  durationSec: number
): Promise<Buffer> {
  if (ai && narrationText.trim()) {
    try {
      const ttsResp = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: narrationText,
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Charon',
              },
            },
          },
        },
      });
      const b64 =
        ttsResp.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (b64) {
        const rawWav = Buffer.from(b64, 'base64');
        if (rawWav.length > 100) {
          return rawWav;
        }
      }
    } catch {
      // Fall back to ambient score below
    }
  }
  return synthesizeAmbientScoreWav(durationSec);
}

export interface RenderCinematicMp4Options {
  videoId: string;
  prompt: string;
  style: string;
  cameraMotion: string;
  aspectRatio: '16:9' | '9:16';
  durationSec: number;
  highFidelity?: boolean;
  frameInterpolation?: boolean;
  referenceImageBase64?: string;
  referenceMimeType?: string;
  endFrameImageBase64?: string;
  endFrameMimeType?: string;
  ai: GoogleGenAI | null;
}

export function resolveVideoRenderMetrics(opts: {
  aspectRatio: '16:9' | '9:16';
  highFidelity?: boolean;
  frameInterpolation?: boolean;
}): {
  width: number;
  height: number;
  fps: number;
  crf: string;
  audioBitrate: string;
  interpolated: boolean;
} {
  const hiFi = Boolean(opts.highFidelity);
  const interp = Boolean(opts.highFidelity || opts.frameInterpolation);
  const width =
    opts.aspectRatio === '9:16' ? (hiFi ? 1080 : 720) : hiFi ? 1920 : 1280;
  const height =
    opts.aspectRatio === '9:16' ? (hiFi ? 1920 : 1280) : hiFi ? 1080 : 720;
  return {
    width,
    height,
    fps: interp ? 60 : 24,
    crf: hiFi ? '18' : '21',
    audioBitrate: hiFi ? '192k' : '128k',
    interpolated: interp,
  };
}

function withBoundedTimeout<T>(
  promise: Promise<T>,
  ms: number,
  onTimeout: () => T
): Promise<T> {
  return new Promise<T>((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(onTimeout());
      }
    }, ms);
    promise
      .then((val) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(val);
        }
      })
      .catch(() => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(onTimeout());
        }
      });
  });
}

export async function renderCinematicMp4Video(
  opts: RenderCinematicMp4Options
): Promise<{
  filePath: string;
  publicUrl: string;
  narrationText: string;
  fps: number;
  width: number;
  height: number;
  interpolated: boolean;
}> {
  ensureVideoDir();
  const safeId = opts.videoId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const metrics = resolveVideoRenderMetrics({
    aspectRatio: opts.aspectRatio,
    highFidelity: opts.highFidelity,
    frameInterpolation: opts.frameInterpolation,
  });
  const outW = metrics.width;
  const outH = metrics.height;
  const canvasW = Math.round(outW * 1.24);
  const canvasH = Math.round(outH * 1.24);
  const dur = opts.durationSec === 10 ? 10 : 5;
  const narrationLine = `${sanitizeLuxoBrand(opts.prompt).slice(0, 95)}.`;

  const [spec, audioWavBuffer] = await Promise.all([
    withBoundedTimeout(
      directSceneWithGemini(opts.ai, opts.prompt, opts.style),
      5500,
      () => buildDefaultSceneSpec(opts.prompt, opts.style)
    ),
    withBoundedTimeout(
      generateSceneAudioWav(opts.ai, narrationLine, dur),
      5500,
      () => synthesizeAmbientScoreWav(dur)
    ),
  ]);

  const workPrefix = path.join(VIDEO_STORAGE_DIR, `tmp_${safeId}_${Date.now()}`);
  const bgSvgPath = `${workPrefix}_bg.svg`;
  const midSvgPath = `${workPrefix}_mid.svg`;
  const fgSvgPath = `${workPrefix}_fg.svg`;
  const audioWavPath = `${workPrefix}_voice.wav`;
  const ambientWavPath = `${workPrefix}_amb.wav`;
  const refImgPath = `${workPrefix}_ref.${
    opts.referenceMimeType?.includes('jpeg') ||
    opts.referenceMimeType?.includes('jpg')
      ? 'jpg'
      : 'png'
  }`;
  const endImgPath = `${workPrefix}_end.${
    opts.endFrameMimeType?.includes('jpeg') ||
    opts.endFrameMimeType?.includes('jpg')
      ? 'jpg'
      : 'png'
  }`;
  const outputMp4Path = path.join(VIDEO_STORAGE_DIR, `${safeId}.mp4`);

  const parsedScene = parseVisualPrompt(opts.prompt, opts.style);
  const heroWidthPx = Math.round(Math.min(outW, outH) * 0.56);
  const heroHeightPx = Math.round(heroWidthPx * 0.75);
  const isAerialSubject =
    parsedScene.subject === 'aircraft' ||
    parsedScene.subject === 'bird' ||
    parsedScene.subject === 'dragon' ||
    parsedScene.subject === 'astronaut' ||
    parsedScene.subject === 'bridge' ||
    parsedScene.subject === 'mountain' ||
    parsedScene.subject === 'forest' ||
    parsedScene.subject === 'city';
  const isStaticHero =
    parsedScene.subject === 'coffee' ||
    parsedScene.subject === 'flower' ||
    parsedScene.subject === 'castle' ||
    parsedScene.subject === 'person';

  fs.writeFileSync(audioWavPath, audioWavBuffer);
  fs.writeFileSync(ambientWavPath, synthesizeAmbientScoreWav(dur));
  fs.writeFileSync(
    fgSvgPath,
    buildForegroundMovingSvg(spec, opts.prompt, opts.style, heroWidthPx),
    'utf-8'
  );

  const cleanupFiles = [
    bgSvgPath,
    midSvgPath,
    fgSvgPath,
    audioWavPath,
    ambientWavPath,
    refImgPath,
    endImgPath,
  ];

  const isOrbit =
    opts.cameraMotion.includes('360') || opts.cameraMotion.includes('Yörünge');
  const isDolly =
    opts.cameraMotion.includes('Yakınlaşma') ||
    opts.cameraMotion.includes('Dolly');

  const heroXExpr = isStaticHero
    ? `'${Math.round((outW - heroWidthPx) / 2)}+sin(t*1.1)*18'`
    : isAerialSubject
    ? `'-${Math.round(heroWidthPx * 0.6)}+t*${Math.round((outW + heroWidthPx * 0.9) / dur)}'`
    : `'${Math.round(outW * 0.14)}+t*${Math.round((outW * 0.42) / dur)}'`;

  const heroYExpr = isStaticHero
    ? `'${Math.round(outH * 0.74 - heroHeightPx * 0.85)}+cos(t*1.2)*6'`
    : isAerialSubject
    ? `'${Math.round(outH * 0.24)}+sin(t*2.1)*28'`
    : `'${Math.round(outH * 0.74 - heroHeightPx * 0.82)}+abs(sin(t*4.2))*6'`;

  // FFmpeg temporal frame interpolation stage (25fps key motion -> smooth 60fps optical blend)
  const interpStage = metrics.interpolated
    ? ',framerate=fps=60:interp_start=15:interp_end=240:scene=100,format=yuv420p[vout]'
    : ',format=yuv420p[vout]';

  try {
    if (opts.referenceImageBase64 && opts.referenceImageBase64.length > 64) {
      fs.writeFileSync(
        refImgPath,
        Buffer.from(opts.referenceImageBase64, 'base64')
      );

      const hasEndFrame = Boolean(
        opts.endFrameImageBase64 && opts.endFrameImageBase64.length > 64
      );
      if (hasEndFrame && opts.endFrameImageBase64) {
        fs.writeFileSync(
          endImgPath,
          Buffer.from(opts.endFrameImageBase64, 'base64')
        );
      }

      const cropExprStart = isDolly
        ? `scale=${canvasW}:${canvasH}:force_original_aspect_ratio=increase:flags=lanczos,crop=${outW}:${outH}:'(iw-ow)/2+sin(t*0.7)*28':'(ih-oh)/2-t*14'`
        : `scale=${canvasW}:${canvasH}:force_original_aspect_ratio=increase:flags=lanczos,crop=${outW}:${outH}:'(iw-ow)/2+(t/${dur}-0.5)*110':'(ih-oh)/2+cos(t*0.9)*24'`;

      if (hasEndFrame) {
        const cropExprEnd = `scale=${canvasW}:${canvasH}:force_original_aspect_ratio=increase:flags=lanczos,crop=${outW}:${outH}:'(iw-ow)/2-(t/${dur}-0.5)*90':'(ih-oh)/2+sin(t*0.8)*20'`;
        const fadeDur = 1.6;
        const fadeOffset = Math.max(1.2, dur - fadeDur - 0.6);
        const filterComplex = [
          `[0:v]${cropExprStart},trim=duration=${dur},setpts=PTS-STARTPTS[startv]`,
          `[1:v]${cropExprEnd},trim=duration=${dur},setpts=PTS-STARTPTS[endv]`,
          `[startv][endv]xfade=transition=smoothleft:duration=${fadeDur}:offset=${fadeOffset},unsharp=3:3:0.45:3:3:0.0${interpStage}`,
          `[2:a]apad=whole_dur=${dur}[voicepad]`,
          `[voicepad][3:a]amix=inputs=2:duration=longest:weights='1.2 0.35',atrim=0:${dur}[aout]`,
        ].join(';');

        await execFileAsync(
          'ffmpeg',
          [
            '-y',
            '-loop',
            '1',
            '-i',
            refImgPath,
            '-loop',
            '1',
            '-i',
            endImgPath,
            '-i',
            audioWavPath,
            '-i',
            ambientWavPath,
            '-filter_complex',
            filterComplex,
            '-map',
            '[vout]',
            '-map',
            '[aout]',
            '-t',
            String(dur),
            '-r',
            String(metrics.fps),
            '-c:v',
            'libx264',
            '-preset',
            'ultrafast',
            '-crf',
            metrics.crf,
            '-c:a',
            'aac',
            '-b:a',
            metrics.audioBitrate,
            '-movflags',
            '+faststart',
            outputMp4Path,
          ],
          { timeout: 55000 }
        );
      } else {
        const filterComplex = [
          `[0:v]${cropExprStart},unsharp=3:3:0.45:3:3:0.0${interpStage}`,
          `[1:a]apad=whole_dur=${dur}[voicepad]`,
          `[voicepad][2:a]amix=inputs=2:duration=longest:weights='1.2 0.35',atrim=0:${dur}[aout]`,
        ].join(';');

        await execFileAsync(
          'ffmpeg',
          [
            '-y',
            '-loop',
            '1',
            '-i',
            refImgPath,
            '-i',
            audioWavPath,
            '-i',
            ambientWavPath,
            '-filter_complex',
            filterComplex,
            '-map',
            '[vout]',
            '-map',
            '[aout]',
            '-t',
            String(dur),
            '-r',
            String(metrics.fps),
            '-c:v',
            'libx264',
            '-preset',
            'ultrafast',
            '-crf',
            metrics.crf,
            '-c:a',
            'aac',
            '-b:a',
            metrics.audioBitrate,
            '-movflags',
            '+faststart',
            outputMp4Path,
          ],
          { timeout: 55000 }
        );
      }
    } else {
      // Multi-layer 3-plane parallax cinema render (Background + Midground Architecture + Prompt-Faithful Hero Motion)
      fs.writeFileSync(
        bgSvgPath,
        buildBackgroundLayerSvg(spec, canvasW, canvasH, opts.prompt, opts.style),
        'utf-8'
      );
      fs.writeFileSync(
        midSvgPath,
        buildMidgroundLayerSvg(spec, canvasW, canvasH, opts.prompt, opts.style),
        'utf-8'
      );

      const bgCropX = isOrbit
        ? `'(iw-ow)/2+sin(t*0.8)*75'`
        : `'(iw-ow)/2-(t/${dur}-0.5)*95'`;
      const midCropX = isOrbit
        ? `'(iw-ow)/2+cos(t*0.9)*155'`
        : `'(iw-ow)/2+(t/${dur}-0.5)*210'`;
      const midCropY = isDolly
        ? `'(ih-oh)/2+(1-t/${dur})*70'`
        : `'(ih-oh)/2+sin(t*0.7)*28'`;

      const filterComplex = [
        `[0:v]crop=${outW}:${outH}:${bgCropX}:'(ih-oh)/2'[bg]`,
        `[1:v]crop=${outW}:${outH}:${midCropX}:${midCropY}[mid]`,
        `[bg][mid]overlay=0:0[scene]`,
        `[scene][2:v]overlay=x=${heroXExpr}:y=${heroYExpr}${interpStage}`,
        `[3:a]apad=whole_dur=${dur}[voicepad]`,
        `[voicepad][4:a]amix=inputs=2:duration=longest:weights='1.25 0.42',atrim=0:${dur}[aout]`,
      ].join(';');

      await execFileAsync(
        'ffmpeg',
        [
          '-y',
          '-loop',
          '1',
          '-i',
          bgSvgPath,
          '-loop',
          '1',
          '-i',
          midSvgPath,
          '-loop',
          '1',
          '-i',
          fgSvgPath,
          '-i',
          audioWavPath,
          '-i',
          ambientWavPath,
          '-filter_complex',
          filterComplex,
          '-map',
          '[vout]',
          '-map',
          '[aout]',
          '-t',
          String(dur),
          '-r',
          String(metrics.fps),
          '-c:v',
          'libx264',
          '-preset',
          'ultrafast',
          '-crf',
          metrics.crf,
          '-c:a',
          'aac',
          '-b:a',
          metrics.audioBitrate,
          '-movflags',
          '+faststart',
          outputMp4Path,
        ],
        { timeout: 55000 }
      );
    }

    return {
      filePath: outputMp4Path,
      publicUrl: `/api/videos/${safeId}.mp4`,
      narrationText: escapeSvgText(spec.narrationText),
      fps: metrics.fps,
      width: outW,
      height: outH,
      interpolated: metrics.interpolated,
    };
  } finally {
    for (const f of cleanupFiles) {
      try {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      } catch {
        // ignore cleanup error
      }
    }
  }
}

export function saveBase64VideoFile(videoId: string, base64Data: string): string {
  ensureVideoDir();
  const safeId = videoId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const outputMp4Path = path.join(VIDEO_STORAGE_DIR, `${safeId}.mp4`);
  fs.writeFileSync(outputMp4Path, Buffer.from(base64Data, 'base64'));
  return `/api/videos/${safeId}.mp4`;
}
