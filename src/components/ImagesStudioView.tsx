import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  Clapperboard,
  Download,
  Film,
  Gauge,
  Globe,
  Image as ImageIcon,
  LoaderCircle,
  Maximize2,
  Mic,
  Pause,
  Play,
  Plus,
  Send,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  Video,
  Volume2,
  VolumeX,
  WandSparkles,
  X,
} from 'lucide-react';
import {
  CinematicMotionParams,
  GeneratedVisual,
  ImageResolutionSize,
  NanoBananaModelId,
  NanoLensPresetId,
  VideoDurationOption,
  VideoResolutionSize,
  VisualAspectRatio,
} from '../types/luxo';
import {
  DEFAULT_CINEMATIC_MOTION,
  describeCinematicMotion,
  enhanceMediaPrompt,
  generateProceduralArtwork,
  isVideoIntentPrompt,
  NANO_BANANA_MODELS,
  NANO_LENS_PRESETS,
  normalizeCinematicMotion,
  sanitizeLuxoBrand,
} from '../utils/luxoLogic';
import { CinematicMotionController } from './CinematicMotionController';
import { SocialShareButton } from './SocialShareBar';
import { LuxoLogo } from './LuxoLogo';

interface ImagesStudioViewProps {
  onBack: () => void;
  visuals: GeneratedVisual[];
  onCreateVisual: (visual: GeneratedVisual) => void;
  onDeleteVisual: (id: string) => void;
  onSendToChat: (prompt: string, imageUrl?: string, videoUrl?: string) => void;
  initialTab?: 'image' | 'video';
}

const IMAGE_STYLES = [
  'Sinematik',
  'Fotogerçekçi',
  'Siberpunk',
  'Mimari Çizim',
  '3B İllüstrasyon',
  'Minimalist Vektör',
];

const CAMERA_MOTIONS = [
  'Sinematik Drone Akışı',
  'Yavaş Yakınlaşma (Dolly-In)',
  '360° Yörünge Çekimi',
  'Dinamik Takip',
  'Higgsfield Bullet-Time Yörünge',
  'Higgsfield FPV Sinema Akışı',
];

const IMAGE_PRESETS = [
  {
    id: 'bosphorus-4k',
    title: 'Altın Saat İstanbul Boğazı',
    category: 'Nano Banana 4K',
    prompt:
      'Altın saat ışığında İstanbul Boğazı üzerinde otonom deniz araçları ve mimari köprü silüeti, 35mm sinematik fotoğraf',
    bgGradient:
      'from-amber-100 to-orange-200 dark:from-amber-950/70 dark:to-orange-900/50',
  },
  {
    id: 'quantum-chip',
    title: 'Kuantum İşlemci Makro Çekim',
    category: 'Bilim & Donanım',
    prompt:
      'Kriyojenik soğutmalı altın ve silikon kuantum işlemci mimarisinin 8K stüdyo makro fotoğrafı, keskin ışık yansımaları',
    bgGradient:
      'from-indigo-100 to-blue-200 dark:from-indigo-950/70 dark:to-blue-900/50',
  },
  {
    id: 'bio-architecture',
    title: 'Biyofilik Gelecek Kütüphanesi',
    category: 'Mimari Render',
    prompt:
      'Doğal gün ışığı alan ahşap ve cam kubbeli biyofilik araştırma kütüphanesi, yüksek detay mimari görselleştirme',
    bgGradient:
      'from-emerald-100 to-teal-200 dark:from-emerald-950/70 dark:to-teal-900/50',
  },
];

const VIDEO_PRESETS = [
  {
    id: 'veo-drone-city',
    title: 'Bulut Üstü Otonom Metropol Uçuşu',
    category: 'Google Veo · 16:9',
    prompt:
      'Gün doğumunda sis bulutlarının arasından yükselen sürdürülebilir gelecek şehri üzerinde akıcı sinematik drone uçuşu',
    bgGradient:
      'from-sky-100 to-indigo-200 dark:from-sky-950/70 dark:to-indigo-900/50',
  },
  {
    id: 'higgsfield-reel',
    title: 'Higgsfield Bullet-Time Fütüristik Sahne',
    category: 'Higgsfield · Sinema',
    prompt:
      'Yağmurlu neon bulvarda zamanın yavaşladığı anamorfik bullet-time kamera yörüngesi, dinamik FPV ışık izleri',
    bgGradient:
      'from-rose-100 to-pink-200 dark:from-rose-950/70 dark:to-pink-900/50',
  },
  {
    id: 'veo-ocean-biolum',
    title: 'Biyolüminesan Okyanus Kıyısı',
    category: 'Google Veo · Sinema',
    prompt:
      'Gece yıldızlı gökyüzü altında kıyıya vuran mavi biyolüminesan dalgalar, ağır çekim 24fps sinema dokusu',
    bgGradient:
      'from-cyan-100 to-blue-200 dark:from-cyan-950/70 dark:to-blue-900/50',
  },
  {
    id: 'veo-robotics-lab',
    title: 'Hassas Robotik Laboratuvarı',
    category: 'Google Veo · Teknoloji',
    prompt:
      'Temiz oda araştırma laboratuvarında mikro optik lens monte eden hassas robotik kol, yakın plan yörünge kamera hareketi',
    bgGradient:
      'from-violet-100 to-purple-200 dark:from-violet-950/70 dark:to-purple-900/50',
  },
];

function extractBase64Payload(dataUrl: string): {
  mimeType: string;
  base64: string;
} | null {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

async function synthesizeProceduralVideoBlobUrl(
  promptText: string,
  style: string,
  aspectRatio: '16:9' | '9:16'
): Promise<string | undefined> {
  if (typeof document === 'undefined' || typeof MediaRecorder === 'undefined') {
    return undefined;
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = aspectRatio === '9:16' ? 540 : 960;
    canvas.height = aspectRatio === '9:16' ? 960 : 540;
    const ctx = canvas.getContext('2d');
    if (
      !ctx ||
      typeof (canvas as HTMLCanvasElement & { captureStream?: unknown })
        .captureStream !== 'function'
    ) {
      return undefined;
    }

    const mimeCandidates = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ];
    const selectedMime =
      mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || '';

    const stream = canvas.captureStream(30);
    const recorder = selectedMime
      ? new MediaRecorder(stream, { mimeType: selectedMime })
      : new MediaRecorder(stream);

    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) {
        chunks.push(ev.data);
      }
    };

    const donePromise = new Promise<string | undefined>((resolve) => {
      recorder.onstop = () => {
        if (chunks.length === 0) {
          resolve(undefined);
          return;
        }
        const blob = new Blob(chunks, {
          type: selectedMime || 'video/webm',
        });
        resolve(URL.createObjectURL(blob));
      };
      recorder.onerror = () => resolve(undefined);
    });

    const palette =
      style === 'Siberpunk'
        ? ['#090418', '#3b0764', '#06b6d4', '#f43f5e']
        : style === 'Mimari Çizim'
        ? ['#0f172a', '#1e293b', '#38bdf8', '#e2e8f0']
        : ['#070b14', '#172554', '#4f46e5', '#f59e0b'];

    const particles = Array.from({ length: 28 }, (_, i) => ({
      x: ((i * 73) % 100) / 100,
      y: ((i * 41) % 100) / 100,
      r: 2 + (i % 5) * 1.4,
      speed: 0.004 + (i % 4) * 0.002,
    }));

    recorder.start();
    const totalFrames = 54;
    for (let frame = 0; frame < totalFrames; frame++) {
      const t = frame / totalFrames;
      const w = canvas.width;
      const h = canvas.height;

      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, palette[0]);
      grad.addColorStop(0.55, palette[1]);
      grad.addColorStop(1, palette[0]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Animated cinematic light sweep
      const orbX = w * (0.28 + Math.sin(t * Math.PI * 2) * 0.22);
      const orbY = h * (0.42 + Math.cos(t * Math.PI * 2) * 0.14);
      const radial = ctx.createRadialGradient(
        orbX,
        orbY,
        10,
        orbX,
        orbY,
        Math.max(w, h) * 0.48
      );
      radial.addColorStop(0, `${palette[2]}88`);
      radial.addColorStop(0.5, `${palette[3]}33`);
      radial.addColorStop(1, 'transparent');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, w, h);

      // Horizon perspective waves
      for (let line = 0; line < 5; line++) {
        ctx.beginPath();
        const baseY = h * (0.56 + line * 0.075);
        for (let x = 0; x <= w; x += 24) {
          const y =
            baseY +
            Math.sin(x * 0.012 + t * Math.PI * 4 + line) * (10 + line * 3);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = line % 2 === 0 ? `${palette[2]}66` : `${palette[3]}55`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Floating cinema particles
      for (const p of particles) {
        const px = ((p.x + t * p.speed * 18) % 1) * w;
        const py = ((p.y - t * p.speed * 10 + 1) % 1) * h;
        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.fill();
      }

      // Subtle cinema caption bar
      ctx.fillStyle = 'rgba(7, 11, 20, 0.62)';
      ctx.fillRect(28, h - 86, w - 56, 58);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 13px monospace';
      ctx.fillText('GOOGLE VEO · LUXO SINEMA SENTEZI', 44, h - 60);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 16px system-ui, sans-serif';
      ctx.fillText(promptText.slice(0, 52), 44, h - 38);

      await new Promise((r) => setTimeout(r, 32));
    }

    recorder.stop();
    stream.getTracks().forEach((tr) => tr.stop());
    return await donePromise;
  } catch {
    return undefined;
  }
}

export const ImagesStudioView: React.FC<ImagesStudioViewProps> = ({
  onBack,
  visuals,
  onCreateVisual,
  onDeleteVisual,
  onSendToChat,
  initialTab = 'image',
}) => {
  const [studioTab, setStudioTab] = useState<'image' | 'video'>(initialTab);
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'image' | 'video'>(
    'all'
  );
  const [unmutedVideoIds, setUnmutedVideoIds] = useState<
    Record<string, boolean>
  >({});
  const [pausedVideoIds, setPausedVideoIds] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    setStudioTab(initialTab);
  }, [initialTab]);
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Sinematik');

  // Nano Banana Image Controls
  const [selectedImageModel, setSelectedImageModel] =
    useState<NanoBananaModelId>('gemini-nano-banana-2.1');
  const [imageAspectRatio, setImageAspectRatio] =
    useState<VisualAspectRatio>('1:1');
  const [imageResolution, setImageResolution] =
    useState<ImageResolutionSize>('4K');
  const [useGoogleSearch, setUseGoogleSearch] = useState(true);
  const [selectedLensPreset, setSelectedLensPreset] =
    useState<NanoLensPresetId>('35mm-cinema');
  const [negativePrompt, setNegativePrompt] = useState('');

  // Google Veo & Nano Banana Motion Video Controls (including High-Fidelity 4K + 60fps Frame Interpolation)
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>(
    '16:9'
  );
  const [videoDuration, setVideoDuration] =
    useState<VideoDurationOption>('5s');
  const [videoResolution, setVideoResolution] =
    useState<VideoResolutionSize>('1080p');
  const [highFidelityVideo, setHighFidelityVideo] = useState(false);
  const [cameraMotion, setCameraMotion] = useState(CAMERA_MOTIONS[0]);
  const [motionControl, setMotionControl] = useState<CinematicMotionParams>(
    () => ({ ...DEFAULT_CINEMATIC_MOTION })
  );
  const [extendingInteractionId, setExtendingInteractionId] = useState<
    string | undefined
  >(undefined);

  // Reference image(s) for Image-to-Image, Dual-Reference Fusion, or Start/End Keyframe Video Interpolation
  const [referenceImage, setReferenceImage] = useState<{
    name: string;
    dataUrl: string;
    base64: string;
    mimeType: string;
  } | null>(null);
  const [secondaryReferenceImage, setSecondaryReferenceImage] = useState<{
    name: string;
    dataUrl: string;
    base64: string;
    mimeType: string;
  } | null>(null);

  const [generatingTarget, setGeneratingTarget] = useState<
    'image' | 'video' | null
  >(null);
  const isGenerating = generatingTarget !== null;
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [previewVisual, setPreviewVisual] = useState<GeneratedVisual | null>(
    null
  );
  const [toast, setToast] = useState<string | null>(null);

  const refFileInput = useRef<HTMLInputElement | null>(null);
  const secondaryRefFileInput = useRef<HTMLInputElement | null>(null);

  const activeNanoModel =
    NANO_BANANA_MODELS.find((m) => m.id === selectedImageModel) ||
    NANO_BANANA_MODELS[0];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const handleToggleHighFidelity = () => {
    setHighFidelityVideo((prev) => {
      const next = !prev;
      if (next) {
        setVideoResolution('4k');
        showToast('Yüksek Sadakat Aktif: 4K UHD & 60fps Kare İnterpolasyonu açık.');
      } else {
        setVideoResolution('1080p');
        showToast('Standart Sinema Modu: 1080p · 24fps.');
      }
      return next;
    });
  };

  const handleUploadReference = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Lütfen geçerli bir görsel dosyası (PNG/JPG/WEBP) seçin.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const parsed = extractBase64Payload(result);
      if (parsed) {
        setReferenceImage({
          name: file.name,
          dataUrl: result,
          base64: parsed.base64,
          mimeType: parsed.mimeType,
        });
        showToast('Referans görsel stüdyoya eklendi.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSecondaryReference = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Lütfen geçerli bir görsel dosyası (PNG/JPG/WEBP) seçin.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const parsed = extractBase64Payload(result);
      if (parsed) {
        setSecondaryReferenceImage({
          name: file.name,
          dataUrl: result,
          base64: parsed.base64,
          mimeType: parsed.mimeType,
        });
        showToast(
          studioTab === 'video'
            ? 'Bitiş anahtar karesi (End-Frame) eklendi.'
            : '2. referans görsel birleştirme için eklendi.'
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEnhanceStudioPrompt = async () => {
    const clean = sanitizeLuxoBrand(prompt.trim());
    if (!clean || isEnhancing) {
      showToast('Önce kısa bir görsel veya video fikri yazın.');
      return;
    }
    setIsEnhancing(true);
    try {
      const resp = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: clean,
          mediaType: studioTab,
          style: selectedStyle,
          cameraMotion,
          highFidelity: highFidelityVideo,
          lensPreset: selectedLensPreset,
          negativePrompt: negativePrompt.trim(),
          motionControl: studioTab === 'video' ? motionControl : undefined,
        }),
      });
      const data = await resp.json();
      if (data.enhancedPrompt) {
        setPrompt(sanitizeLuxoBrand(data.enhancedPrompt));
        showToast('Sinematik istem güçlendirildi!');
        return;
      }
    } catch {
      // Fallback below
    } finally {
      setIsEnhancing(false);
    }
    setPrompt(
      enhanceMediaPrompt(clean, studioTab, selectedStyle, cameraMotion, {
        highFidelity: highFidelityVideo,
        lensPreset: selectedLensPreset,
        negativePrompt: negativePrompt.trim(),
        motionControl: studioTab === 'video' ? motionControl : undefined,
      })
    );
    showToast('Sinematik istem zenginleştirildi!');
  };

  const handleGenerateImage = async (customPrompt?: string) => {
    const targetPrompt = sanitizeLuxoBrand((customPrompt ?? prompt).trim());
    if (!targetPrompt || isGenerating) return;
    setGeneratingTarget('image');

    try {
      const response = await fetch('/api/image-gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: targetPrompt,
          style: selectedStyle,
          aspectRatio: imageAspectRatio,
          imageModel: selectedImageModel,
          imageSize: activeNanoModel.supports4K ? imageResolution : '1K',
          useGoogleSearch:
            activeNanoModel.supportsSearchGrounding && useGoogleSearch,
          enhancePrompt: true,
          lensPreset: selectedLensPreset,
          negativePrompt: negativePrompt.trim() || undefined,
          referenceImageBase64: referenceImage?.base64,
          referenceMimeType: referenceImage?.mimeType,
          secondaryReferenceImageBase64: secondaryReferenceImage?.base64,
          secondaryReferenceMimeType: secondaryReferenceImage?.mimeType,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      const created: GeneratedVisual = {
        id: data.id || `vis-${Date.now()}`,
        mediaType: 'image',
        title: sanitizeLuxoBrand(data.title || targetPrompt.slice(0, 42)),
        prompt: targetPrompt,
        style: selectedStyle,
        aspectRatio: data.aspectRatio || imageAspectRatio,
        dataUrl:
          data.dataUrl ||
          generateProceduralArtwork(
            targetPrompt,
            selectedStyle,
            imageAspectRatio
          ),
        engineLabel: data.engineLabel || activeNanoModel.name,
        modelUsed: data.modelUsed || selectedImageModel,
        resolution:
          data.resolution ||
          (activeNanoModel.supports4K ? imageResolution : '1K'),
        lensPreset: selectedLensPreset,
        negativePrompt: negativePrompt.trim() || undefined,
        createdAt: Date.now(),
      };
      onCreateVisual(created);
      if (!customPrompt) setPrompt('');
      showToast(`${created.engineLabel} ile görsel üretildi!`);
    } catch {
      const fallbackUrl = generateProceduralArtwork(
        targetPrompt,
        selectedStyle,
        imageAspectRatio
      );
      onCreateVisual({
        id: `vis-${Date.now()}`,
        mediaType: 'image',
        title: targetPrompt.slice(0, 42),
        prompt: targetPrompt,
        style: selectedStyle,
        aspectRatio: imageAspectRatio,
        dataUrl: fallbackUrl,
        engineLabel: activeNanoModel.name,
        resolution: activeNanoModel.supports4K ? imageResolution : '1K',
        createdAt: Date.now(),
      });
      if (!customPrompt) setPrompt('');
      showToast('Görsel sentezlendi ve galeriye eklendi!');
    } finally {
      setGeneratingTarget(null);
    }
  };

  const handleGenerateVideo = async (
    customPrompt?: string,
    overridePrevInteractionId?: string,
    useNanoBananaFrame?: boolean,
    overrideRefImage?: { base64: string; mimeType: string }
  ) => {
    const targetPrompt = sanitizeLuxoBrand((customPrompt ?? prompt).trim());
    if (!targetPrompt || isGenerating) return;
    setGeneratingTarget('video');

    const prevId = overridePrevInteractionId ?? extendingInteractionId;
    const activeRefBase64 = overrideRefImage?.base64 ?? referenceImage?.base64;
    const activeRefMime =
      overrideRefImage?.mimeType ?? referenceImage?.mimeType;
    const isHiFi = highFidelityVideo || videoResolution === '4k';
    const targetResolution: VideoResolutionSize = isHiFi
      ? '4k'
      : videoResolution;

    try {
      const normalizedMotion = normalizeCinematicMotion(motionControl);
      const motionInfo = describeCinematicMotion(normalizedMotion);
      const response = await fetch('/api/video-gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: targetPrompt,
          style: selectedStyle,
          cameraMotion: `${cameraMotion} (${motionInfo.summaryTr})`,
          aspectRatio: videoAspectRatio,
          duration: videoDuration,
          resolution: targetResolution,
          highFidelity: isHiFi,
          frameInterpolation: isHiFi,
          lensPreset: selectedLensPreset,
          negativePrompt: negativePrompt.trim() || undefined,
          enhancePrompt: true,
          referenceImageBase64: activeRefBase64,
          referenceMimeType: activeRefMime,
          endFrameImageBase64: secondaryReferenceImage?.base64,
          endFrameMimeType: secondaryReferenceImage?.mimeType,
          previousInteractionId: prevId,
          useNanoBananaFrame: Boolean(useNanoBananaFrame),
          nanoModel: selectedImageModel,
          motionControl: normalizedMotion,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      let playableVideoUrl: string | undefined = data.videoUrl;
      if (!playableVideoUrl) {
        playableVideoUrl = await synthesizeProceduralVideoBlobUrl(
          targetPrompt,
          selectedStyle,
          videoAspectRatio
        );
      }

      const poster =
        data.posterUrl ||
        data.dataUrl ||
        generateProceduralArtwork(targetPrompt, selectedStyle, videoAspectRatio);

      const resolvedHiFi = Boolean(data.highFidelity ?? isHiFi);
      const resolvedFps = data.fps || (resolvedHiFi ? 60 : 24);

      const created: GeneratedVisual = {
        id: data.id || `vid-${Date.now()}`,
        mediaType: 'video',
        title: sanitizeLuxoBrand(data.title || targetPrompt.slice(0, 42)),
        prompt: targetPrompt,
        style: `${selectedStyle} · ${cameraMotion}`,
        aspectRatio: videoAspectRatio,
        dataUrl: poster,
        posterUrl: poster,
        videoUrl: playableVideoUrl,
        engineLabel:
          data.engineLabel ||
          (useNanoBananaFrame
            ? resolvedHiFi
              ? 'Nano Banana 4K · 60fps MP4'
              : 'Nano Banana Motion · HD MP4'
            : resolvedHiFi
            ? 'Google Veo 4K · 60fps MP4'
            : 'Google Veo · HD Sinema MP4'),
        modelUsed: 'gemini-omni-1.1-flash',
        resolution: (
          data.resolution || (resolvedHiFi ? '4K UHD' : targetResolution)
        ).toUpperCase(),
        duration: data.duration || videoDuration,
        highFidelity: resolvedHiFi,
        fps: resolvedFps,
        frameInterpolation: resolvedHiFi ? 'optical-60fps' : 'standard-24fps',
        motionControl: normalizeCinematicMotion(motionControl),
        lensPreset: selectedLensPreset,
        negativePrompt: negativePrompt.trim() || undefined,
        interactionId: data.interactionId,
        createdAt: Date.now(),
      };

      onCreateVisual(created);
      if (galleryFilter === 'image') {
        setGalleryFilter('all');
      }
      setExtendingInteractionId(undefined);
      if (!customPrompt) setPrompt('');
      showToast(
        resolvedHiFi
          ? `${
              useNanoBananaFrame ? 'Nano Banana + Veo' : 'Google Veo'
            } 4K · 60fps kare interpolasyonlu MP4 video hazır!`
          : useNanoBananaFrame
          ? 'Nano Banana + Veo sesli MP4 video üretildi!'
          : 'Google Veo sesli MP4 sinema videosu hazır!'
      );
    } catch {
      const poster = generateProceduralArtwork(
        targetPrompt,
        selectedStyle,
        videoAspectRatio
      );
      const localWebm = await synthesizeProceduralVideoBlobUrl(
        targetPrompt,
        selectedStyle,
        videoAspectRatio
      );
      onCreateVisual({
        id: `vid-${Date.now()}`,
        mediaType: 'video',
        title: targetPrompt.slice(0, 42),
        prompt: targetPrompt,
        style: `${selectedStyle} · ${cameraMotion}`,
        aspectRatio: videoAspectRatio,
        dataUrl: poster,
        posterUrl: poster,
        videoUrl: localWebm,
        engineLabel: isHiFi
          ? 'Google Veo 4K · 60fps Motoru'
          : 'Google Veo · Sinema Motoru',
        resolution: isHiFi ? '4K UHD' : targetResolution.toUpperCase(),
        duration: videoDuration,
        highFidelity: isHiFi,
        fps: isHiFi ? 60 : 24,
        frameInterpolation: isHiFi ? 'optical-60fps' : 'standard-24fps',
        createdAt: Date.now(),
      });
      if (galleryFilter === 'image') {
        setGalleryFilter('all');
      }
      setExtendingInteractionId(undefined);
      if (!customPrompt) setPrompt('');
      showToast('Video sahnesi sentezlendi ve galeriye eklendi!');
    } finally {
      setGeneratingTarget(null);
    }
  };

  const handleAnimateExistingImage = (vis: GeneratedVisual) => {
    setStudioTab('video');
    const motionPrompt = `${vis.prompt} — sahneye doğal sinematik hareket, derinlik ve canlı ışık akışı ekle`;
    const parsed = extractBase64Payload(vis.dataUrl);
    if (parsed) {
      setReferenceImage({
        name: `${vis.title.slice(0, 20)}.png`,
        dataUrl: vis.dataUrl,
        base64: parsed.base64,
        mimeType: parsed.mimeType,
      });
      void handleGenerateVideo(motionPrompt, undefined, true, {
        base64: parsed.base64,
        mimeType: parsed.mimeType,
      });
    } else {
      void handleGenerateVideo(motionPrompt, undefined, true);
    }
  };

  const handleVoiceDictation = () => {
    const SpeechRec =
      (
        window as unknown as {
          SpeechRecognition?: unknown;
          webkitSpeechRecognition?: unknown;
        }
      ).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown })
        .webkitSpeechRecognition;

    if (!SpeechRec) {
      setPrompt(
        studioTab === 'video'
          ? 'Gece ışıklarında fütüristik İstanbul Boğazı üzerinde sinematik drone uçuşu'
          : 'Altın saat ışığında fütüristik otonom şehir köprüsü ve su yansımaları, 4K'
      );
      showToast('Sesli örnek istem aktarıldı.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const rec = new (SpeechRec as new () => {
      lang: string;
      onstart: () => void;
      onresult: (e: { results: { transcript: string }[][] }) => void;
      onend: () => void;
      onerror: () => void;
      start: () => void;
    })();
    rec.lang = 'tr-TR';
    rec.onstart = () => {
      setIsRecording(true);
      showToast('Dinleniyor... Sahneyi tarif edin.');
    };
    rec.onresult = (ev) => {
      const spoken = ev.results[0][0].transcript;
      setPrompt((prev) => (prev ? `${prev} ${spoken}` : spoken));
    };
    rec.onend = () => setIsRecording(false);
    rec.onerror = () => {
      setIsRecording(false);
      showToast('Ses algılanamadı.');
    };
    rec.start();
  };

  const filteredVisuals = visuals.filter((v) => {
    if (galleryFilter === 'all') return true;
    const type = v.mediaType || 'image';
    return type === galleryFilter;
  });

  return (
    <div className="flex flex-col h-full bg-[#fcfcfc] dark:bg-[#141418] text-neutral-900 dark:text-neutral-100 select-none relative">
      {toast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold rounded-full shadow-lg">
          {toast}
        </div>
      )}

      {/* Top Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-[#18181c] border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer shrink-0"
            aria-label="Geri Dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <LuxoLogo className="w-4 h-4 text-white" size={16} />
            </div>
            <h2 className="text-sm sm:text-base font-bold tracking-tight truncate">
              Nano Banana 4K & Google Veo Stüdyosu
            </h2>
          </div>
        </div>

        <div className="shrink-0">
          <SocialShareButton
            payload={{
              title: 'Luxo AI · Nano Banana 4K & Google Veo Video Stüdyosu',
              excerpt:
                'Nano Banana 2.1 4K fotogerçekçi görsel sentezi ve Google Veo sinematik video üretimi bir arada.',
              contentType: studioTab === 'video' ? 'video' : 'image',
              badge:
                studioTab === 'video'
                  ? 'GOOGLE VEO · VİDEO STÜDYOSU'
                  : 'NANO BANANA 2.1 · 4K GÖRSEL',
            }}
            label="Stüdyoyu Paylaş"
            onShared={(plat) => showToast(`${plat} paylaşımı hazır!`)}
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-5 pb-20 max-w-5xl mx-auto w-full space-y-6">
        {/* Primary Mode Segmented Control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200/80 dark:border-neutral-800">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {studioTab === 'image'
                ? 'Nano Banana 4K Görsel Sentezi'
                : 'Google Veo Sinematik Video Üretimi'}
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              {studioTab === 'image'
                ? 'Google Nano Banana 2.1 Ultra & Gemini 3 Pro Image motorlarıyla 1K/2K/4K stüdyo kalitesinde görseller üretin ve düzenleyin'
                : 'Metinden veya referans görselden 16:9 / 9:16 yüksek çözünürlüklü Google Veo (Omni 1.1) videolar oluşturun ve sahneyi uzatın'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-neutral-200/70 dark:bg-[#202127] rounded-2xl shrink-0">
            <button
              type="button"
              onClick={() => setStudioTab('image')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                studioTab === 'image'
                  ? 'bg-white dark:bg-indigo-600 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Görsel Üret (Nano Banana)</span>
            </button>
            <button
              type="button"
              onClick={() => setStudioTab('video')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                studioTab === 'video'
                  ? 'bg-white dark:bg-indigo-600 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Clapperboard className="w-3.5 h-3.5" />
              <span>Video Üret (Google Veo)</span>
            </button>
          </div>
        </div>

        {/* Engine & Parameter Controls */}
        {studioTab === 'image' ? (
          <div className="space-y-4">
            {/* Nano Banana Model Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {NANO_BANANA_MODELS.map((m) => {
                const active = m.id === selectedImageModel;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelectedImageModel(m.id);
                      if (!m.supports4K) setImageResolution('1K');
                      if (
                        !m.supportsPanoramic &&
                        ['4:1', '1:4', '8:1', '1:8'].includes(imageAspectRatio)
                      ) {
                        setImageAspectRatio('16:9');
                      }
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                      active
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-500'
                        : 'bg-white dark:bg-[#1c1d22] border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                        {m.name}
                      </span>
                      <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 shrink-0">
                        {m.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                      {m.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Resolution, Standard + Panoramic Aspect Ratio & Grounding Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#1c1d22] border border-neutral-200 dark:border-neutral-800">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    Oran:
                  </span>
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl">
                    {(
                      activeNanoModel.supportsPanoramic
                        ? ([
                            '1:1',
                            '16:9',
                            '9:16',
                            '3:4',
                            '4:3',
                            '4:1',
                            '1:4',
                            '8:1',
                            '1:8',
                          ] as const)
                        : (['1:1', '16:9', '9:16', '3:4', '4:3'] as const)
                    ).map((ratio) => (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setImageAspectRatio(ratio)}
                        className={`px-2 py-1 rounded-lg text-xs font-mono font-semibold transition cursor-pointer tabular-nums ${
                          imageAspectRatio === ratio
                            ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                            : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                {activeNanoModel.supports4K && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                      Çözünürlük:
                    </span>
                    <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl">
                      {(['1K', '2K', '4K'] as const).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setImageResolution(sz)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer tabular-nums ${
                            imageResolution === sz
                              ? 'bg-indigo-600 text-white'
                              : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {activeNanoModel.supportsSearchGrounding && (
                  <button
                    type="button"
                    onClick={() => setUseGoogleSearch(!useGoogleSearch)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                      useGoogleSearch
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Google Görsel Arama Bağlamı</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => refFileInput.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Referans Görsel Düzenle</span>
                </button>

                {activeNanoModel.supportsDualReference && (
                  <button
                    type="button"
                    onClick={() => secondaryRefFileInput.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>2. Referans Birleştir</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Google Veo Video Parameter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#1c1d22] border border-neutral-200 dark:border-neutral-800">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    Format:
                  </span>
                  <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl">
                    {(['16:9', '9:16'] as const).map((vr) => (
                      <button
                        key={vr}
                        type="button"
                        onClick={() => setVideoAspectRatio(vr)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition cursor-pointer tabular-nums ${
                          videoAspectRatio === vr
                            ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                            : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                      >
                        {vr === '16:9' ? '16:9 Yatay' : '9:16 Dikey'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    Süre:
                  </span>
                  <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl">
                    {(['5s', '10s'] as const).map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setVideoDuration(dur)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition cursor-pointer tabular-nums ${
                          videoDuration === dur
                            ? 'bg-indigo-600 text-white'
                            : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                      >
                        {dur}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                    Kalite:
                  </span>
                  <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-xl">
                    {(['720p', '1080p', '4k'] as const).map((resOpt) => (
                      <button
                        key={resOpt}
                        type="button"
                        onClick={() => {
                          setVideoResolution(resOpt);
                          setHighFidelityVideo(resOpt === '4k');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold uppercase transition cursor-pointer tabular-nums ${
                          videoResolution === resOpt
                            ? 'bg-indigo-600 text-white'
                            : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                      >
                        {resOpt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => refFileInput.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Başlangıç Karesi Yükle</span>
                </button>
                <button
                  type="button"
                  onClick={() => secondaryRefFileInput.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Bitiş Karesi (İnterpolasyon)</span>
                </button>
              </div>
            </div>

            {/* Camera Motion Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mr-1 shrink-0">
                Kamera Hareketi:
              </span>
              {CAMERA_MOTIONS.map((motion) => (
                <button
                  key={motion}
                  type="button"
                  onClick={() => setCameraMotion(motion)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                    cameraMotion === motion
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-[#1c1d22] border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {motion}
                </button>
              ))}
            </div>

            {/* Dynamic Cinematic Motion Controller (Speed, Pan, Tilt) */}
            <CinematicMotionController
              mode="inline"
              value={motionControl}
              onChange={setMotionControl}
            />
          </div>
        )}

        {/* High-Fidelity 4K & 60fps Frame Interpolation Video Toggle + Optical Lens & Negative Prompt Bar */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1c1d22] border border-neutral-200 dark:border-neutral-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition ${
                  highFidelityVideo
                    ? 'bg-emerald-500 text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                }`}
              >
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <span>Yüksek Sadakatli 4K & 60fps Kare İnterpolasyonu</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                      highFidelityVideo
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                    }`}
                  >
                    {highFidelityVideo ? 'AKTİF · 4K 60FPS' : 'KAPALI · 24FPS'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Nano Banana Video ve Google Veo API çağrısında 4K UHD çözünürlük ile pürüzsüz 60fps optik kare interpolasyonunu etkinleştirir.
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-pressed={highFidelityVideo}
              aria-label="Yüksek Sadakatli 4K ve 60fps Kare İnterpolasyonu"
              onClick={handleToggleHighFidelity}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shrink-0 whitespace-nowrap ${
                highFidelityVideo
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  highFidelityVideo ? 'bg-white' : 'bg-neutral-400'
                }`}
              />
              <span>
                {highFidelityVideo
                  ? '4K & 60fps İnterpolasyon Açık'
                  : '4K & 60fps İnterpolasyonu Aç'}
              </span>
            </button>
          </div>

          <div className="pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 flex items-center gap-1 shrink-0 mr-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Optik Lens:</span>
              </span>
              {NANO_LENS_PRESETS.map((lens) => (
                <button
                  key={lens.id}
                  type="button"
                  onClick={() => setSelectedLensPreset(lens.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedLensPreset === lens.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {lens.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 min-w-[230px] lg:w-72">
              <input
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="Negatif istem (Örn: bulanıklık, filigran)..."
                aria-label="Negatif İstem"
                className="w-full px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Shared Visual Style Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mr-1 shrink-0">
            Sanat Yönetimi:
          </span>
          {IMAGE_STYLES.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSelectedStyle(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                selectedStyle === st
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                  : 'bg-white dark:bg-[#1c1d22] border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Active Reference Frame(s) or Extension Notice */}
        {(referenceImage || secondaryReferenceImage || extendingInteractionId) && (
          <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/70 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {referenceImage && (
                <img
                  src={referenceImage.dataUrl}
                  alt="Başlangıç Referans Karesi"
                  className="w-12 h-12 rounded-xl object-cover border border-indigo-300 dark:border-indigo-700 shrink-0"
                />
              )}
              {secondaryReferenceImage && (
                <img
                  src={secondaryReferenceImage.dataUrl}
                  alt="İkincil / Bitiş Referans Karesi"
                  className="w-12 h-12 rounded-xl object-cover border border-emerald-400 dark:border-emerald-700 shrink-0"
                />
              )}
              <div className="text-xs min-w-0">
                <div className="font-bold text-indigo-950 dark:text-indigo-200 truncate">
                  {extendingInteractionId
                    ? 'Google Veo Sahne Uzatma Modu Aktif (+5 Saniye)'
                    : secondaryReferenceImage
                    ? `Çift Referans / Anahtar Kare İnterpolasyonu Aktif`
                    : `Referans Görsel Aktif: ${referenceImage?.name}`}
                </div>
                <div className="text-indigo-700 dark:text-indigo-300/80">
                  {extendingInteractionId
                    ? 'Sahnenin devamında ne olacağını yazıp Oluştur butonuna basın.'
                    : studioTab === 'video'
                    ? secondaryReferenceImage
                      ? 'Başlangıç ve bitiş kareleri arasında pürüzsüz kare interpolasyonu uygulanacak.'
                      : 'Bu görsel başlangıç karesi olarak canlandırılacak.'
                    : 'Nano Banana referans görselleri isteminize göre sentezleyecek.'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setReferenceImage(null);
                setSecondaryReferenceImage(null);
                setExtendingInteractionId(undefined);
              }}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-900 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-red-500 cursor-pointer"
            >
              Temizle
            </button>
          </div>
        )}

        <input
          ref={refFileInput}
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleUploadReference(e.target.files[0]);
              e.target.value = '';
            }
          }}
          className="hidden"
        />
        <input
          ref={secondaryRefFileInput}
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleUploadSecondaryReference(e.target.files[0]);
              e.target.value = '';
            }
          }}
          className="hidden"
        />

        {/* Quick Studio Templates */}
        <div>
          <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mb-3">
            {studioTab === 'image'
              ? 'Nano Banana 4K Hazır Sahne Şablonları'
              : 'Google Veo Sinematik Video Şablonları'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {(studioTab === 'image' ? IMAGE_PRESETS : VIDEO_PRESETS).map(
              (card) => (
                <button
                  key={card.id}
                  type="button"
                  disabled={isGenerating}
                  onClick={() =>
                    studioTab === 'image'
                      ? handleGenerateImage(card.prompt)
                      : handleGenerateVideo(card.prompt)
                  }
                  className={`p-4 rounded-2xl bg-gradient-to-br ${card.bgGradient} border border-neutral-200/80 dark:border-neutral-800 text-left transition hover:border-indigo-400 dark:hover:border-indigo-600 cursor-pointer flex flex-col justify-between gap-3 disabled:opacity-50`}
                >
                  <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-300">
                    <span>{card.category}</span>
                    {studioTab === 'video' ? (
                      <Video className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white mb-1">
                      {card.title}
                    </div>
                    <p className="text-[11px] text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-snug">
                      {card.prompt}
                    </p>
                  </div>
                </button>
              )
            )}
          </div>
        </div>

        {/* Generated Gallery */}
        {visuals.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 tabular-nums">
                Stüdyo Galerisi ({filteredVisuals.length})
              </h3>
              <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-[#1c1d22] rounded-xl">
                {(
                  [
                    { id: 'all', label: 'Tümü' },
                    { id: 'image', label: 'Görseller' },
                    { id: 'video', label: 'Videolar' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setGalleryFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      galleryFilter === tab.id
                        ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredVisuals.map((vis) => {
                const isVideo = vis.mediaType === 'video';
                const isMp4 = Boolean(
                  vis.videoUrl?.includes('.mp4') ||
                    vis.videoUrl?.startsWith('data:video/mp4')
                );
                const isUnmuted = Boolean(unmutedVideoIds[vis.id]);
                const isPaused = Boolean(pausedVideoIds[vis.id]);
                const downloadHref =
                  isVideo && vis.videoUrl ? vis.videoUrl : vis.dataUrl;
                const downloadExt = isVideo
                  ? isMp4
                    ? 'mp4'
                    : 'webm'
                  : vis.dataUrl.startsWith('data:image/jpeg') ||
                    vis.dataUrl.endsWith('.jpg') ||
                    vis.dataUrl.endsWith('.jpeg')
                  ? 'jpg'
                  : vis.dataUrl.startsWith('data:image/png') ||
                    vis.dataUrl.endsWith('.png')
                  ? 'png'
                  : 'svg';

                return (
                  <div
                    key={vis.id}
                    className="rounded-3xl overflow-hidden bg-white dark:bg-[#1c1d22] border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between group"
                  >
                    <div className="relative aspect-video bg-neutral-950 overflow-hidden">
                      {isVideo && vis.videoUrl ? (
                        <video
                          src={vis.videoUrl}
                          poster={vis.posterUrl || vis.dataUrl}
                          loop
                          muted={!isUnmuted}
                          autoPlay
                          playsInline
                          preload="auto"
                          onClick={(e) => {
                            const vidEl = e.currentTarget;
                            if (vidEl.paused) {
                              void vidEl.play();
                              setPausedVideoIds((prev) => ({
                                ...prev,
                                [vis.id]: false,
                              }));
                            } else {
                              vidEl.pause();
                              setPausedVideoIds((prev) => ({
                                ...prev,
                                [vis.id]: true,
                              }));
                            }
                          }}
                          className="w-full h-full object-cover cursor-pointer"
                        />
                      ) : (
                        <img
                          src={vis.dataUrl}
                          alt={vis.title}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      )}

                      {isVideo && (
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 text-white text-[10px] font-mono font-bold tracking-wider uppercase pointer-events-none flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>
                            {vis.highFidelity || vis.fps === 60
                              ? '4K UHD · 60FPS İNTERPOLASYON'
                              : isMp4
                              ? 'GERÇEK MP4 · SESLİ'
                              : 'VEO VİDEO'}
                          </span>
                        </div>
                      )}

                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        {isVideo && vis.videoUrl && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                const card = e.currentTarget.closest('.relative');
                                const vidEl = card?.querySelector('video');
                                if (vidEl) {
                                  if (vidEl.paused) {
                                    void vidEl.play();
                                    setPausedVideoIds((prev) => ({
                                      ...prev,
                                      [vis.id]: false,
                                    }));
                                  } else {
                                    vidEl.pause();
                                    setPausedVideoIds((prev) => ({
                                      ...prev,
                                      [vis.id]: true,
                                    }));
                                  }
                                }
                              }}
                              className="p-2 rounded-full bg-black/65 hover:bg-black/85 text-white transition cursor-pointer"
                              aria-label={
                                isPaused
                                  ? `Oynat: ${vis.title}`
                                  : `Duraklat: ${vis.title}`
                              }
                              title={isPaused ? 'Oynat' : 'Duraklat'}
                            >
                              {isPaused ? (
                                <Play className="w-3.5 h-3.5" />
                              ) : (
                                <Pause className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setUnmutedVideoIds((prev) => ({
                                  ...prev,
                                  [vis.id]: !prev[vis.id],
                                }))
                              }
                              className="p-2 rounded-full bg-black/65 hover:bg-black/85 text-white transition cursor-pointer"
                              aria-label={
                                isUnmuted
                                  ? `Sesi Kapat: ${vis.title}`
                                  : `Sesi Aç: ${vis.title}`
                              }
                              title={isUnmuted ? 'Sesi Kapat' : 'Sesi Aç'}
                            >
                              {isUnmuted ? (
                                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <VolumeX className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => setPreviewVisual(vis)}
                          className="p-2 rounded-full bg-black/65 hover:bg-black/85 text-white transition cursor-pointer"
                          aria-label={`Tam Ekran: ${vis.title}`}
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <div className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {vis.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 tabular-nums">
                          <span>
                            {vis.engineLabel ||
                              (isVideo ? 'Google Veo' : 'Nano Banana')}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{vis.aspectRatio}</span>
                          {vis.resolution && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{vis.resolution}</span>
                            </>
                          )}
                          {isVideo && vis.fps && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{vis.fps}fps</span>
                            </>
                          )}
                          {vis.duration && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{vis.duration}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={downloadHref}
                            download={`${vis.title
                              .slice(0, 24)
                              .replace(/\s+/g, '_')}.${downloadExt}`}
                            className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition"
                            aria-label={`İndir: ${vis.title}`}
                            title="İndir"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>

                          <SocialShareButton
                            compact
                            payload={{
                              title: vis.title,
                              excerpt: vis.prompt,
                              contentType: isVideo ? 'video' : 'image',
                              badge:
                                vis.engineLabel ||
                                (isVideo ? 'GOOGLE VEO' : 'NANO BANANA 4K'),
                            }}
                            onShared={(plat) =>
                              showToast(`${plat} üzerinde paylaşıldı!`)
                            }
                          />

                          <button
                            type="button"
                            onClick={() => {
                              onDeleteVisual(vis.id);
                              showToast('Öğe galeriden kaldırıldı.');
                            }}
                            className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-neutral-500 hover:text-rose-500 transition cursor-pointer"
                            aria-label={`Sil: ${vis.title}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {!isVideo ? (
                            <button
                              type="button"
                              onClick={() => handleAnimateExistingImage(vis)}
                              className="px-2.5 py-1.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
                            >
                              <Film className="w-3.5 h-3.5" />
                              <span>Veo Video Yap</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setStudioTab('video');
                                setExtendingInteractionId(vis.interactionId);
                                setPrompt(
                                  `${vis.prompt} — kamera ileri doğru süzülürken yeni detaylar ortaya çıkar`
                                );
                                showToast(
                                  'Sahne uzatma hazır: İstem çubuğundan +5sn üretin.'
                                );
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+5sn Uzat</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              onSendToChat(
                                `${
                                  isVideo ? 'Video sahnesi' : 'Görsel'
                                } analizi ve geliştirme: ${vis.prompt}`,
                                isVideo ? undefined : vis.dataUrl,
                                isVideo ? vis.videoUrl : undefined
                              )
                            }
                            className="px-3 py-1.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                          >
                            Sohbete Ekle
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Studio Prompt Composer */}
      <div className="p-4 bg-white dark:bg-[#18181c] border-t border-neutral-200 dark:border-neutral-800 shrink-0 space-y-2.5">
        {isGenerating && (
          <div className="max-w-4xl mx-auto px-4 py-2.5 rounded-2xl bg-indigo-500/10 dark:bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-indigo-800 dark:text-indigo-200 font-semibold">
              <LoaderCircle className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />
              <span>
                {generatingTarget === 'video'
                  ? 'Google Veo 3 & Nano Banana GPU motoru özel anahtar kareyi, optik kamera yörüngesini ve sesli MP4 akışını sentezliyor (~12-18 sn)...'
                  : 'Nano Banana 2.1 GPU Difüzyon motoru isteminize özel yüksek çözünürlüklü gerçek fotoğrafı sentezliyor (~10-15 sn)...'}
              </span>
            </div>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-600 text-white shrink-0">
              CANLI GPU SENTEZ
            </span>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (studioTab === 'image') {
              if (isVideoIntentPrompt(prompt)) {
                setStudioTab('video');
                void handleGenerateVideo(prompt, undefined, true);
              } else {
                void handleGenerateImage();
              }
            } else {
              void handleGenerateVideo();
            }
          }}
          className="max-w-4xl mx-auto flex flex-wrap sm:flex-nowrap items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-[#202127] rounded-3xl sm:rounded-full border border-neutral-200 dark:border-neutral-700 focus-within:border-indigo-500 transition"
        >
          {studioTab === 'video' ? (
            <Clapperboard className="w-5 h-5 text-indigo-500 shrink-0" />
          ) : (
            <ImageIcon className="w-5 h-5 text-indigo-500 shrink-0" />
          )}

          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
            placeholder={
              studioTab === 'video'
                ? 'Google Veo için video sahnesini tarif edin (Örn: Yağmurlu Tokyo sokaklarında sinematik takip çekimi)...'
                : 'Nano Banana 4K görsel veya MP4 video tarif edin (Örn: Mars yüzeyinde yürüyen kırmızı astronot)...'
            }
            className="flex-1 min-w-[180px] bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden py-1.5"
          />

          <button
            type="button"
            disabled={isGenerating}
            onClick={() => {
              const pool =
                studioTab === 'video'
                  ? [
                      'Altın saat ışığında İstanbul Boğazı köprüsü üzerinde süzülen sinematik drone çekimi',
                      'Mars gezegeni yüzeyinde yürüyen kırmızı uzay giysili astronot ve ufukta Dünya, sinematik takip çekimi',
                      'Gece yağmurlu neon Tokyo caddesinde ilerleyen kırmızı spor araba, 35mm sinematik kamera',
                      'Kuzey ışıkları altında karlı fiyort üzerinde süzülen yörünge kamera uçuşu',
                    ]
                  : [
                      'Mars yüzeyinde yürüyen kırmızı astronot ve yıldızlı gökyüzünde parlayan mavi Dünya, 8K DSLR fotoğraf',
                      'Güneşli ahşap pencere kenarında şapka takan sevimli turuncu kedi, 85mm portre fotoğrafı',
                      'Gün doğumunda Kapadokya peri bacaları üzerinde yükselen sıcak hava balonları, 35mm sinematik kare',
                      'Yağmurlu siberpunk sokakta neon yansımalar arasında duran fütüristik spor otomobil, 4K fotoğraf',
                    ];
              setPrompt(pool[Math.floor(Math.random() * pool.length)]);
            }}
            className="px-2.5 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer shrink-0 whitespace-nowrap"
            title="Rastgele Yaratıcı Sahne Öner"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Sürpriz Sahne</span>
          </button>

          <button
            type="button"
            onClick={handleEnhanceStudioPrompt}
            disabled={isEnhancing || isGenerating}
            className="px-2.5 py-1 rounded-full bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer shrink-0 whitespace-nowrap"
            title="Sinematik İstem Güçlendirici"
          >
            <WandSparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {isEnhancing ? 'Güçlendiriliyor...' : 'İstemi Güçlendir'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleVoiceDictation}
            className={`p-1.5 rounded-full transition cursor-pointer ${
              isRecording
                ? 'text-red-500 bg-red-100 dark:bg-red-900/30'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
            aria-label="Ses ile yaz"
          >
            <Mic className="w-4 h-4" />
          </button>

          {studioTab === 'image' && (
            <button
              type="button"
              disabled={!prompt.trim() || isGenerating}
              onClick={() => {
                void handleGenerateVideo(undefined, undefined, true);
              }}
              className="px-3.5 py-2 rounded-full bg-neutral-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-200 disabled:opacity-45 text-white dark:text-neutral-950 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shrink-0 cursor-pointer whitespace-nowrap"
              title="Nano Banana + Google Veo ile Gerçek Sesli MP4 Video Üret"
            >
              {generatingTarget === 'video' ? (
                <>
                  <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                  <span>MP4 Üretiliyor...</span>
                </>
              ) : (
                <>
                  <Film className="w-3.5 h-3.5" />
                  <span>Nano Banana Video (.MP4)</span>
                </>
              )}
            </button>
          )}

          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 text-white text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shrink-0 cursor-pointer whitespace-nowrap"
          >
            {(studioTab === 'video' && generatingTarget === 'video') ||
            (studioTab === 'image' && generatingTarget === 'image') ? (
              <>
                <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                <span>Üretiliyor...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>
                  {studioTab === 'video' ? 'Veo Video Üret (.MP4)' : '4K Görsel Üret'}
                </span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Fullscreen Media Lightbox */}
      {previewVisual && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewVisual(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs"
        >
          <div className="max-w-4xl w-full bg-white dark:bg-[#1c1d22] rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-2xl">
            <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800">
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                  {previewVisual.title}
                </h4>
                <div className="text-xs text-neutral-500 truncate">
                  {previewVisual.engineLabel || previewVisual.style} ·{' '}
                  {previewVisual.aspectRatio}
                  {previewVisual.resolution ? ` · ${previewVisual.resolution}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <SocialShareButton
                  payload={{
                    title: previewVisual.title,
                    excerpt: previewVisual.prompt,
                    contentType:
                      previewVisual.mediaType === 'video' ? 'video' : 'image',
                    badge: previewVisual.engineLabel,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setPreviewVisual(null)}
                  className="p-1.5 rounded-full text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer"
                  aria-label="Önizlemeyi Kapat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="bg-black flex items-center justify-center max-h-[74vh] overflow-hidden">
              {previewVisual.mediaType === 'video' && previewVisual.videoUrl ? (
                <video
                  src={previewVisual.videoUrl}
                  poster={previewVisual.posterUrl || previewVisual.dataUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="max-h-[74vh] w-auto object-contain"
                />
              ) : (
                <img
                  src={previewVisual.dataUrl}
                  alt={previewVisual.title}
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="max-h-[74vh] w-auto object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
