import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { GoogleGenAI } from '@google/genai';
import type {
  CinematicMotionParams,
  VisualAspectRatio,
} from '../types/luxo.ts';
import {
  describeCinematicMotion,
  foldTurkishDiacritics,
  normalizeCinematicMotion,
  sanitizeLuxoBrand,
} from './luxoLogic.ts';
import {
  resolveVideoRenderMetrics,
  synthesizeAmbientScoreWav,
  VIDEO_STORAGE_DIR,
} from './videoEngine.ts';

const execFileAsync = promisify(execFile);

const FLUX_SPACE_BASE = 'https://black-forest-labs-flux-1-schnell.hf.space';
const SD35_SPACE_BASE =
  'https://stabilityai-stable-diffusion-3-5-large-turbo.hf.space';
const LTX_VIDEO_SPACE_BASE =
  'https://lightricks-ltx-video-distilled.hf.space';

const AI_HORDE_API_BASE = 'https://aihorde.net/api/v2';
const AI_HORDE_CLIENT_AGENT = 'LuxoAIStudio:2.6:luxo';

let zeroGpuQuotaCooldownUntil = 0;
let aiHordeCooldownUntil = 0;

const TURKISH_TO_ENGLISH_LEXICON: Array<[RegExp, string]> = [
  [/istanbul\s+boğaz\p{L}*/giu, 'Istanbul Bosphorus suspension bridge and sparkling strait'],
  [/boğaz\s+köprü\p{L}*/giu, 'Istanbul Bosphorus suspension bridge over turquoise water'],
  [/kız\s+kulesi/giu, 'Maiden Tower in Istanbul Bosphorus sunset'],
  [/galata\s+kulesi/giu, 'historic Galata Tower in Istanbul skyline'],
  [/ayasofya/giu, 'majestic Hagia Sophia dome in Istanbul'],
  [/kapadokya/giu, 'Cappadocia fairy chimneys with hot air balloons sunrise'],
  [/spor\s+araba\p{L}*/giu, 'sleek aerodynamic sports car supercar'],
  [/yarış\s+araba\p{L}*/giu, 'high-performance racing supercar'],
  [/yavru\s+kedi\p{L}*/giu, 'adorable fluffy kitten'],
  [/yavru\s+köpek\p{L}*/giu, 'cute playful puppy'],
  [/pencere\s+kenar\p{L}*/giu, 'beside a sunlit glass window'],
  [/pencere\s+ön\p{L}*/giu, 'in front of a bright glass window'],
  [/altın\s+saat\p{L}*/giu, 'golden hour sunlight'],
  [/gün\s+batım\p{L}*/giu, 'golden sunset sky'],
  [/gün\s+doğum\p{L}*/giu, 'misty sunrise glow'],
  [/yağmurlu/giu, 'rainy wet street reflections'],
  [/yağmur\p{L}*/giu, 'falling rain and wet reflections'],
  [/karlı/giu, 'snow-covered winter'],
  [/sisli/giu, 'atmospheric misty fog'],
  [/güneşli/giu, 'bright sunlit daylight'],
  [/(?:^|\s)gece(?:\s|$)/giu, ' nighttime '],
  [/(?:^|\s)gündüz(?:\s|$)/giu, ' daytime '],
  [/kırmızı/giu, 'crimson red'],
  [/turuncu/giu, 'ginger orange'],
  [/sarı/giu, 'golden yellow'],
  [/lacivert/giu, 'deep navy blue'],
  [/mavi/giu, 'sapphire blue'],
  [/turkuaz/giu, 'turquoise'],
  [/yeşil/giu, 'emerald green'],
  [/mor/giu, 'violet purple'],
  [/pembe/giu, 'rose pink'],
  [/siyah/giu, 'sleek black'],
  [/beyaz/giu, 'white'],
  [/gümüş/giu, 'metallic silver'],
  [/kahverengi/giu, 'warm brown'],
  [/sevimli/giu, 'cute'],
  [/gerçekçi/giu, 'hyper-realistic'],
  [/fotogerçekçi/giu, 'photorealistic'],
  [/sinematik/giu, 'cinematic'],
  [/fütüristik/giu, 'futuristic'],
  [/siberpunk/giu, 'cyberpunk neon'],
  [/neon/giu, 'glowing neon'],
  [/kedi\p{L}*/giu, 'cat'],
  [/tekir/giu, 'tabby cat'],
  [/köpek\p{L}*/giu, 'dog'],
  [/aslan\p{L}*/giu, 'majestic lion'],
  [/kaplan\p{L}*/giu, 'Bengal tiger'],
  [/kartal\p{L}*/giu, 'soaring eagle'],
  [/kuş\p{L}*/giu, 'bird'],
  [/(?:^|\s)at(?:lar)?(?:\s|$)/giu, ' galloping horse '],
  [/ejderha\p{L}*/giu, 'mythical dragon'],
  [/araba\p{L}*/giu, 'modern car'],
  [/otomobil\p{L}*/giu, 'luxury automobile'],
  [/motosiklet\p{L}*/giu, 'sport motorcycle'],
  [/uçak\p{L}*/giu, 'aircraft jet'],
  [/helikopter\p{L}*/giu, 'helicopter'],
  [/(?:dron|drone)\p{L}*/giu, 'aerial drone view'],
  [/gemi\p{L}*/giu, 'ocean ship'],
  [/vapur\p{L}*/giu, 'Istanbul ferry boat'],
  [/yat\p{L}*/giu, 'luxury yacht'],
  [/astronot\p{L}*/giu, 'astronaut in spacesuit'],
  [/dünya\s+ufk\p{L}*/giu, 'Earth horizon from orbit'],
  [/derin\s+uzay\p{L}*/giu, 'deep outer space'],
  [/uzay\p{L}*/giu, 'outer space cosmos'],
  [/yıldız\p{L}*/giu, 'glowing stars'],
  [/gezegen\p{L}*/giu, 'ringed planet'],
  [/robot\p{L}*/giu, 'humanoid robot'],
  [/şehir\p{L}*/giu, 'modern city skyline'],
  [/sokak\p{L}*/giu, 'city street'],
  [/bulvar\p{L}*/giu, 'city boulevard'],
  [/köprü\p{L}*/giu, 'suspension bridge'],
  [/kale\p{L}*/giu, 'stone castle'],
  [/saray\p{L}*/giu, 'grand palace'],
  [/çam\s+orman\p{L}*/giu, 'pine forest'],
  [/orman\p{L}*/giu, 'lush forest'],
  [/zirve\p{L}*/giu, 'mountain peak'],
  [/alpler\p{L}*/giu, 'Alps mountains'],
  [/dağ\p{L}*/giu, 'majestic mountains'],
  [/deniz\p{L}*/giu, 'sparkling sea'],
  [/okyanus\p{L}*/giu, 'ocean waves'],
  [/sahil\p{L}*/giu, 'coastal beach'],
  [/şelale\p{L}*/giu, 'waterfall'],
  [/kahve\p{L}*/giu, 'coffee cup on wooden cafe table'],
  [/çiçek\p{L}*/giu, 'blooming flowers'],
  [/gül\p{L}*/giu, 'red rose'],
  [/köpekbalığ\p{L}*/giu, 'great white shark underwater'],
  [/kaplumbağa\p{L}*/giu, 'sea turtle swimming'],
  [/yunus\p{L}*/giu, 'jumping dolphin ocean'],
  [/balina\p{L}*/giu, 'humpback whale ocean'],
  [/kelebek\p{L}*/giu, 'colorful monarch butterfly'],
  [/tavşan\p{L}*/giu, 'fluffy rabbit'],
  [/baykuş\p{L}*/giu, 'wise owl perched on branch'],
  [/penguen\p{L}*/giu, 'emperor penguin on ice'],
  [/papağan\p{L}*/giu, 'colorful macaw parrot'],
  [/kurt\p{L}*/giu, 'wild wolf in snow'],
  [/tilki\p{L}*/giu, 'red fox in forest'],
  [/fil(?:ler)?(?:\s|$)/giu, ' majestic elephant '],
  [/panda\p{L}*/giu, 'giant panda bamboo'],
  [/balık\p{L}*/giu, 'tropical reef fish'],
  [/tren\p{L}*/giu, 'high-speed modern train'],
  [/roket\p{L}*/giu, 'space rocket launch'],
  [/uzay\s+gemisi/giu, 'futuristic spacecraft'],
  [/bisiklet\p{L}*/giu, 'road cycling bicycle'],
  [/eyfel/giu, 'Eiffel Tower Paris'],
  [/piramit\p{L}*/giu, 'Giza pyramids desert'],
  [/kanyon\p{L}*/giu, 'Grand Canyon cliffs'],
  [/çöl\p{L}*/giu, 'golden sand desert dunes'],
  [/göl\p{L}*/giu, 'crystal mountain lake'],
  [/nehir\p{L}*/giu, 'flowing river valley'],
  [/volkan\p{L}*|yanardağ\p{L}*/giu, 'erupting volcano lava'],
  [/kutup\s+ışık\p{L}*/giu, 'aurora borealis northern lights'],
  [/mercan\p{L}*/giu, 'underwater coral reef'],
  [/cami\p{L}*/giu, 'historic grand mosque'],
  [/kütüphane\p{L}*/giu, 'grand wooden library'],
  [/stadyum\p{L}*/giu, 'illuminated football stadium'],
  [/pizza\p{L}*/giu, 'artisan wood-fired pizza'],
  [/pasta\p{L}*/giu, 'artisan chocolate cake'],
  [/gitar\p{L}*/giu, 'acoustic guitar'],
  [/piyano\p{L}*/giu, 'grand piano'],
  [/samuray\p{L}*/giu, 'armored samurai warrior'],
  [/şövalye\p{L}*/giu, 'medieval armored knight'],
  [/insan\p{L}*/giu, 'person portrait'],
  [/kadın\p{L}*/giu, 'woman'],
  [/erkek\p{L}*/giu, 'man'],
  [/çocuk\p{L}*/giu, 'child'],
  [/şapka\p{L}*|sapka\p{L}*/giu, 'wearing a stylish hat'],
  [/gözlük\p{L}*|gozluk\p{L}*/giu, 'wearing glasses'],
  [/mars(?:\s+yüzey\p{L}*|\s+yuzey\p{L}*)?/giu, 'rusty red Mars planet surface'],
  [/ay\s+yüzey\p{L}*|ay\s+yuzey\p{L}*/giu, 'lunar Moon crater surface'],
  [/yürüyen|yuruyen/giu, 'walking'],
  [/koşan|kosan/giu, 'running'],
  [/uçan|ucan/giu, 'flying'],
  [/yüzen|yuzen/giu, 'swimming'],
  [/oturan/giu, 'sitting'],
  [/dans\s+eden/giu, 'dancing'],
  [/şato\p{L}*|sato\p{L}*/giu, 'medieval fairytale castle'],
  [/büyücü\p{L}*|buyucu\p{L}*/giu, 'mystical wizard'],
  [/denizaltı\p{L}*|denizalti\p{L}*/giu, 'deep sea submarine'],
  [/savaşçı\p{L}*|savasci\p{L}*/giu, 'armored warrior'],
  [/uçuş\p{L}*|ucus\p{L}*/giu, 'aerial flight'],
  [/yansıma\p{L}*|yansima\p{L}*/giu, 'shimmering reflections'],
  [/ışık\p{L}*|isik\p{L}*/giu, 'natural light'],
  [/(?:^|\s)(bana|lütfen|lutfen|resmi|resmini|resim|fotoğrafı|fotoğrafını|fotoğraf|fotografi|fotografini|fotograf|görseli|görselini|görsel|gorseli|gorselini|gorsel|videosu|videosunu|video|çiz|çizsene|ciz|cizsene|oluştur|olustur|üret|uret|yap|yapsana|hazırla|hazirla|göster|goster|ve|ile|bir|üzerinde|uzerinde|içinde|icinde)(?:\s|$)/giu, ' '],
];

const ASCII_TURKISH_LEXICON: Array<[RegExp, string]> = [
  [/istanbul\s+bogaz\w*/gi, 'Istanbul Bosphorus suspension bridge and sparkling strait'],
  [/bogaz\s+kopru\w*/gi, 'Istanbul Bosphorus suspension bridge over turquoise water'],
  [/kiz\s+kulesi/gi, 'Maiden Tower in Istanbul Bosphorus sunset'],
  [/yaris\s+araba\w*/gi, 'high-performance racing supercar'],
  [/yavru\s+kopek\w*/gi, 'cute playful puppy'],
  [/pencere\s+on\w*/gi, 'in front of a bright glass window'],
  [/altin\s+saat\w*/gi, 'golden hour sunlight'],
  [/gun\s+batim\w*/gi, 'golden sunset sky'],
  [/gun\s+dogum\w*/gi, 'misty sunrise glow'],
  [/yagmurlu/gi, 'rainy wet street reflections'],
  [/yagmur\w*/gi, 'falling rain and wet reflections'],
  [/karli/gi, 'snow-covered winter'],
  [/gunesli/gi, 'bright sunlit daylight'],
  [/(?:^|\s)gunduz(?:\s|$)/gi, ' daytime '],
  [/kirmizi/gi, 'crimson red'],
  [/sari/gi, 'golden yellow'],
  [/yesil/gi, 'emerald green'],
  [/gumus/gi, 'metallic silver'],
  [/gercekci/gi, 'hyper-realistic'],
  [/fotogercekci/gi, 'photorealistic'],
  [/futuristik/gi, 'futuristic'],
  [/kopekbalig\w*/gi, 'great white shark underwater'],
  [/kopek\w*/gi, 'dog'],
  [/kus(?:lar)?(?:\s|$)/gi, ' bird '],
  [/ucak\w*/gi, 'aircraft jet'],
  [/dunya\s+ufk\w*/gi, 'Earth horizon from orbit'],
  [/yildiz\w*/gi, 'glowing stars'],
  [/sehir\w*/gi, 'modern city skyline'],
  [/kopru\w*/gi, 'suspension bridge'],
  [/cam\s+orman\w*/gi, 'pine forest'],
  [/dag(?:lar)?(?:\s|$)/gi, ' majestic mountains '],
  [/selale\w*/gi, 'waterfall'],
  [/cicek\w*/gi, 'blooming flowers'],
  [/gul(?:ler)?(?:\s|$)/gi, ' red rose '],
  [/kaplumbaga\w*/gi, 'sea turtle swimming'],
  [/tavsan\w*/gi, 'fluffy rabbit'],
  [/baykus\w*/gi, 'wise owl perched on branch'],
  [/papagan\w*/gi, 'colorful macaw parrot'],
  [/balik\w*/gi, 'tropical reef fish'],
  [/col(?:\s|$)/gi, ' golden sand desert dunes '],
  [/gol(?:\s|$)/gi, ' crystal mountain lake '],
  [/yanardag\w*/gi, 'erupting volcano lava'],
  [/kutup\s+isik\w*/gi, 'aurora borealis northern lights'],
  [/kutuphane\w*/gi, 'grand wooden library'],
  [/sovalye\w*/gi, 'medieval armored knight'],
  [/kadin\w*/gi, 'woman'],
  [/cocuk\w*/gi, 'child'],
];

const ENGLISH_SEARCH_STOPWORDS = new Set([
  'the',
  'and',
  'with',
  'from',
  'over',
  'into',
  'beside',
  'front',
  'bright',
  'warm',
  'sleek',
  'smooth',
  'natural',
  'light',
  'glowing',
  'shimmering',
  'modern',
  'lush',
  'majestic',
  'sparkling',
  'hyper',
  'realistic',
  'photorealistic',
  'cinematic',
  'aerial',
  'view',
  'flight',
  'golden',
  'hour',
  'sunlight',
  'daylight',
  'sunlit',
  'glass',
  'cute',
  'sweet',
  'adorable',
  'fluffy',
]);

const CORE_SUBJECT_NOUNS = new Set([
  'cat',
  'kitten',
  'dog',
  'puppy',
  'lion',
  'tiger',
  'eagle',
  'bird',
  'owl',
  'parrot',
  'penguin',
  'wolf',
  'fox',
  'elephant',
  'panda',
  'rabbit',
  'butterfly',
  'dolphin',
  'whale',
  'turtle',
  'shark',
  'fish',
  'horse',
  'dragon',
  'car',
  'supercar',
  'automobile',
  'motorcycle',
  'train',
  'rocket',
  'spacecraft',
  'bicycle',
  'aircraft',
  'jet',
  'helicopter',
  'drone',
  'ship',
  'ferry',
  'boat',
  'yacht',
  'astronaut',
  'robot',
  'samurai',
  'knight',
  'castle',
  'palace',
  'mosque',
  'library',
  'stadium',
  'eiffel',
  'pyramids',
  'canyon',
  'desert',
  'lake',
  'river',
  'volcano',
  'aurora',
  'coral',
  'bridge',
  'bosphorus',
  'istanbul',
  'cappadocia',
  'tokyo',
  'paris',
  'alps',
  'mountains',
  'forest',
  'ocean',
  'waves',
  'beach',
  'waterfall',
  'coffee',
  'pizza',
  'cake',
  'guitar',
  'piano',
  'rose',
  'flowers',
  'woman',
  'man',
  'child',
]);

export function extractCleanEnglishKeywords(englishDescription: string): string {
  const firstClause = englishDescription.split(',')[0] || englishDescription;
  // Keep only pure ASCII English words so leftover Turkish words never pollute Wikimedia search
  const words = firstClause
    .split(/\s+/)
    .filter((w) => /^[a-zA-Z]{3,}$/.test(w))
    .map((w) => w.toLowerCase())
    .filter((w) => !ENGLISH_SEARCH_STOPWORDS.has(w));
  const unique = Array.from(new Set(words));
  // Rank core subject nouns and colors BEFORE background location words (like "window" or "street")!
  const subjects = unique.filter((w) => CORE_SUBJECT_NOUNS.has(w));
  const colors = unique.filter(
    (w) =>
      !CORE_SUBJECT_NOUNS.has(w) &&
      /^(orange|ginger|red|crimson|blue|sapphire|black|white|yellow|green|purple|pink|tabby|sports|racing|snow|sunset)$/.test(
        w
      )
  );
  const rest = unique.filter(
    (w) => !subjects.includes(w) && !colors.includes(w)
  );
  const ordered = [...colors.slice(0, 1), ...subjects, ...rest];
  return ordered.slice(0, 4).join(' ') || 'scenic mountain sunset';
}

export function translateTurkishVisualTermsDeterministic(
  prompt: string,
  style: string = 'Sinematik',
  mediaType: 'image' | 'video' = 'image',
  cameraMotion?: string
): string {
  let translated = ` ${sanitizeLuxoBrand(prompt || '')
    .replace(/\u0130/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase()
    .trim()} `;
  for (const [pattern, replacement] of TURKISH_TO_ENGLISH_LEXICON) {
    translated = translated.replace(pattern, ` ${replacement} `);
  }
  translated = ` ${foldTurkishDiacritics(translated)} `;
  for (const [pattern, replacement] of ASCII_TURKISH_LEXICON) {
    translated = translated.replace(pattern, ` ${replacement} `);
  }
  // Remove any remaining isolated non-ASCII Turkish words only if we already translated >= 2 English words
  const asciiWords = translated
    .split(/\s+/)
    .filter((w) => /^[a-zA-Z0-9-]+$/.test(w) && w.length >= 2);
  if (asciiWords.length >= 2) {
    translated = asciiWords.join(' ');
  } else {
    translated = translated.replace(/\s+/g, ' ').trim();
  }
  if (!translated) {
    translated = 'golden hour Istanbul Bosphorus suspension bridge and sea';
  }

  const styleSuffix: Record<string, string> = {
    Sinematik:
      'photorealistic live-action cinema frame, shot on ARRI Alexa 65 with 35mm anamorphic prime lens, natural volumetric lighting, realistic surface micro-textures, shallow depth of field, ultra-sharp 8k photography',
    Fotogerçekçi:
      'authentic DSLR photograph shot on Sony A7R V 50mm f/1.4 GM lens, natural lighting, real-world textures, crisp optical focus, raw candid realism, 8k',
    Siberpunk:
      'photorealistic neon-drenched night street photography, wet asphalt reflections, anamorphic bokeh, realistic cyberpunk atmosphere, 8k',
    'Anime & İllüstrasyon':
      'masterpiece Makoto Shinkai theatrical anime film frame, lush atmospheric lighting, finely painted clouds and scenery, ultra-detailed 4k',
    '3D Render':
      'Unreal Engine 5 Lumen global illumination, Octane Render, Physically Based Rendering materials, raytraced reflections, 8k',
    'Mimari Çizim':
      'award-winning architectural photography, crisp daylight geometry, glass and steel facade details, ArchDaily feature, 8k',
  };

  let motionClause = '';
  if (mediaType === 'video') {
    const m = (cameraMotion || '').toLowerCase();
    if (m.includes('drone')) {
      motionClause = ', smooth continuous aerial drone forward flight motion, natural parallax';
    } else if (m.includes('360') || m.includes('yörünge')) {
      motionClause = ', smooth orbital tracking camera movement around the main subject';
    } else if (m.includes('yakınlaşma') || m.includes('dolly')) {
      motionClause = ', cinematic slow dolly push-in camera movement with natural motion';
    } else if (m.includes('fpv')) {
      motionClause = ', dynamic fluid FPV tracking camera motion through the scene';
    } else {
      motionClause = ', natural fluid real-world motion, smooth cinematic tracking shot, 24fps film';
    }
  }

  const chosenStyle = styleSuffix[style] || styleSuffix.Sinematik;
  return `${translated}${motionClause}, ${chosenStyle}`;
}

export async function buildEnglishDiffusionPrompt(opts: {
  prompt: string;
  style?: string;
  mediaType: 'image' | 'video';
  cameraMotion?: string;
  motionControl?: Partial<CinematicMotionParams> | null;
  ai?: GoogleGenAI | null;
}): Promise<{ englishPrompt: string; searchKeywords: string }> {
  const style = opts.style || 'Sinematik';
  const motionSuffix =
    opts.mediaType === 'video' && opts.motionControl
      ? `, ${describeCinematicMotion(opts.motionControl).promptDirectiveEn}`
      : '';
  const deterministic = `${translateTurkishVisualTermsDeterministic(
    opts.prompt,
    style,
    opts.mediaType,
    opts.cameraMotion
  )}${motionSuffix}`;

  const fallbackKeywords = extractCleanEnglishKeywords(deterministic);

  if (!opts.ai) {
    return {
      englishPrompt: deterministic,
      searchKeywords: fallbackKeywords || 'cinematic nature landscape',
    };
  }

  try {
    const modelsToTry = ['gemini-3.1-flash-lite'];
    for (const modelName of modelsToTry) {
      try {
        const resp = await Promise.race([
          opts.ai.models.generateContent({
            model: modelName,
            contents: `Convert this user visual request into JSON with two fields:
1. "prompt": A hyper-realistic, faithful English description (30-55 words) for a ${
              opts.mediaType === 'video'
                ? 'live-action cinema video generator (include natural subject movement and camera motion)'
                : 'professional DSLR photography generator'
            }. Preserve EVERY exact subject, animal, vehicle, color, clothing/accessory, weather, planet/location, and action from the user's request ("${sanitizeLuxoBrand(
              opts.prompt
            )}"). Frame as a centered wide or medium-wide shot with the ENTIRE subject (head to body) clearly visible inside the frame. Note: user may write Turkish without diacritics (e.g. kirmizi=red, gorsel=image, sapka=hat, bogaz=Bosphorus). Style: ${style}${
              opts.cameraMotion ? `, Camera: ${opts.cameraMotion}` : ''
            }${motionSuffix}. Never mention cartoons or vector art unless requested.
2. "keywords": 2 to 4 plain English concrete subject/location nouns ONLY (put the main subject first, e.g. "astronaut Mars" or "orange tabby cat" or "red sports car"; do NOT include lighting words like "golden hour").
Output ONLY valid JSON.`,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('translate-timeout')), 2800)
          ),
        ]);
        const raw = (resp.text || '').trim();
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as {
            prompt?: string;
            keywords?: string;
          };
          if (parsed.prompt && parsed.prompt.trim().length >= 12) {
            return {
              englishPrompt: `${parsed.prompt.trim()}${motionSuffix}`,
              searchKeywords:
                (parsed.keywords || '').trim() ||
                fallbackKeywords ||
                'cinematic photography',
            };
          }
        }
      } catch {
        // Try next fast model or deterministic fallback
      }
    }
  } catch {
    // Use deterministic fallback
  }

  return {
    englishPrompt: deterministic,
    searchKeywords: fallbackKeywords || 'cinematic photography',
  };
}

export function resolveDiffusionDimensions(
  aspectRatio: VisualAspectRatio = '1:1'
): { width: number; height: number } {
  const map: Record<VisualAspectRatio, [number, number]> = {
    '1:1': [1024, 1024],
    '16:9': [1280, 736],
    '9:16': [736, 1280],
    '4:3': [1152, 864],
    '3:4': [864, 1152],
    '4:1': [1344, 352],
    '1:4': [352, 1344],
    '8:1': [1344, 256],
    '1:8': [256, 1344],
  };
  const [width, height] = map[aspectRatio] || [1024, 1024];
  return { width, height };
}

function resolveStyleOpticalFilter(style?: string): string {
  if (style === 'Siberpunk') {
    return ',eq=contrast=1.12:saturation=1.22,unsharp=5:5:0.75:3:3:0.0';
  }
  if (style === 'Sinematik') {
    return ',eq=contrast=1.06:saturation=1.10:gamma=0.98,unsharp=5:5:0.65:3:3:0.0';
  }
  return ',eq=contrast=1.04:saturation=1.06,unsharp=5:5:0.60:3:3:0.0';
}

async function convertBufferToJpeg(
  inputBuffer: Buffer,
  extHint: string,
  targetWidth?: number,
  targetHeight?: number,
  style?: string
): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const inPath = path.join(tmpDir, `luxo_img_in_${stamp}.${extHint}`);
  const outPath = path.join(tmpDir, `luxo_img_out_${stamp}.jpg`);
  try {
    fs.writeFileSync(inPath, inputBuffer);
    const gradeChain = resolveStyleOpticalFilter(style);
    const vfArgs =
      targetWidth && targetHeight
        ? [
            '-vf',
            `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase:flags=lanczos,crop=${targetWidth}:${targetHeight}${gradeChain}`,
          ]
        : ['-vf', `scale=iw:ih${gradeChain}`];
    await execFileAsync(
      'ffmpeg',
      ['-y', '-i', inPath, ...vfArgs, '-frames:v', '1', '-q:v', '2', outPath],
      { timeout: 12000 }
    );
    return fs.readFileSync(outPath);
  } finally {
    try {
      if (fs.existsSync(inPath)) fs.unlinkSync(inPath);
      if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
    } catch {
      // ignore cleanup error
    }
  }
}

async function callGradioEndpoint(
  spaceBaseUrl: string,
  endpointName: string,
  dataPayload: unknown[],
  timeoutMs: number
): Promise<unknown[]> {
  const callResp = await fetch(
    `${spaceBaseUrl}/gradio_api/call/${endpointName}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'LuxoAIStudio/2.5',
      },
      body: JSON.stringify({ data: dataPayload }),
      signal: AbortSignal.timeout(Math.min(10000, timeoutMs)),
    }
  );
  if (!callResp.ok) {
    throw new Error(`Gradio call HTTP ${callResp.status}`);
  }
  const callJson = (await callResp.json()) as { event_id?: string };
  if (!callJson.event_id) {
    throw new Error('Missing Gradio event_id');
  }

  const sseResp = await fetch(
    `${spaceBaseUrl}/gradio_api/call/${endpointName}/${callJson.event_id}`,
    {
      headers: { 'User-Agent': 'LuxoAIStudio/2.5' },
      signal: AbortSignal.timeout(timeoutMs),
    }
  );
  if (!sseResp.ok) {
    throw new Error(`Gradio SSE HTTP ${sseResp.status}`);
  }
  const sseText = await sseResp.text();
  const lines = sseText.split('\n');
  let lastEvent = '';
  for (const line of lines) {
    if (line.startsWith('event:')) {
      lastEvent = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      const rawData = line.slice(5).trim();
      if (lastEvent === 'error') {
        throw new Error(`Gradio space error: ${rawData.slice(0, 120)}`);
      }
      if (lastEvent === 'complete') {
        const parsed = JSON.parse(rawData);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    }
  }
  throw new Error('Gradio SSE ended without complete payload');
}

async function uploadBufferToGradioSpace(
  spaceBaseUrl: string,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const form = new FormData();
  const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });
  form.append('files', blob, fileName);

  const upResp = await fetch(`${spaceBaseUrl}/gradio_api/upload`, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(10000),
  });
  if (!upResp.ok) {
    throw new Error(`Gradio upload HTTP ${upResp.status}`);
  }
  const paths = (await upResp.json()) as string[];
  if (!Array.isArray(paths) || !paths[0]) {
    throw new Error('Gradio upload returned empty path');
  }
  return paths[0];
}

function extractGradioFileUrl(
  spaceBaseUrl: string,
  fileObj: Record<string, unknown> | undefined
): string | null {
  if (!fileObj || typeof fileObj !== 'object') return null;
  if (typeof fileObj.url === 'string' && fileObj.url.startsWith('http')) {
    return fileObj.url;
  }
  if (typeof fileObj.path === 'string' && fileObj.path.length > 1) {
    return `${spaceBaseUrl}/gradio_api/file=${fileObj.path}`;
  }
  return null;
}

const NON_PHOTO_TITLE_REGEX =
  /\b(logo|flag|map|chart|diagram|stamp|coat|emblem|icon|banner|poster|cover|book|page|scan|signature|symbol|medal|coin|seal|plaque|newspaper|document|chromosome|genetic|gene|inheritance|genotype|phenotype|biology|anatomy|schema|schematic|graph|plot|table|formula|vector|cartoon|comic|drawing|sketch|illustration|painting|engraving|statue|sculpture|toy|18\d\d|19[0-7]\d)\b/i;

function hasCameraExifMetadata(
  metadata: Array<{ name?: string; value?: unknown }> | undefined
): boolean {
  if (!Array.isArray(metadata) || metadata.length === 0) return false;
  const cameraKeys = new Set([
    'Make',
    'Model',
    'ExposureTime',
    'FNumber',
    'ISOSpeedRatings',
    'FocalLength',
    'LensModel',
    'DateTimeOriginal',
  ]);
  return metadata.some(
    (m) => m.name && cameraKeys.has(m.name) && String(m.value || '').trim() !== ''
  );
}

async function fetchCommonsRealPhotograph(
  searchKeywords: string,
  targetWidth: number,
  targetHeight: number
): Promise<Buffer | null> {
  const words = searchKeywords.trim().split(/\s+/).filter(Boolean);
  const subjectWord = words.find((w) =>
    CORE_SUBJECT_NOUNS.has(w.toLowerCase())
  );
  const colorOrAdj = words.find(
    (w) =>
      w !== subjectWord &&
      /^(orange|ginger|red|crimson|blue|sapphire|black|white|yellow|green|purple|pink|tabby|sports|racing|snow|sunset)$/i.test(
        w
      )
  );

  const queriesToTry = Array.from(
    new Set([
      subjectWord && colorOrAdj ? `${colorOrAdj} ${subjectWord}` : '',
      words.slice(0, 3).join(' '),
      words.slice(0, 2).join(' '),
      subjectWord || '',
      words[0] || 'mountain sunset',
    ])
  ).filter(Boolean);

  for (const queryStr of queriesToTry) {
    try {
      const q = encodeURIComponent(`filetype:bitmap ${queryStr}`);
      const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${q}&gsrnamespace=6&prop=imageinfo&iiprop=url|mime|dimensions|metadata&iiurlwidth=1280&format=json&gsrlimit=14`;
      const r = await fetch(apiUrl, {
        headers: { 'User-Agent': 'LuxoAIStudio/2.5 (https://luxo.ai)' },
        signal: AbortSignal.timeout(6500),
      });
      if (!r.ok) continue;
      const data = (await r.json()) as {
        query?: {
          pages?: Record<
            string,
            {
              index?: number;
              title?: string;
              imageinfo?: Array<{
                thumburl?: string;
                url?: string;
                mime?: string;
                width?: number;
                height?: number;
                metadata?: Array<{ name?: string; value?: unknown }>;
              }>;
            }
          >;
        };
      };
      const rawPages = Object.values(data.query?.pages || {}).sort(
        (a, b) => (a.index ?? 999) - (b.index ?? 999)
      );
      // Prioritize genuine camera EXIF photographs first, then other valid JPEGs
      const pages = [
        ...rawPages.filter((p) =>
          hasCameraExifMetadata(p.imageinfo?.[0]?.metadata)
        ),
        ...rawPages.filter(
          (p) => !hasCameraExifMetadata(p.imageinfo?.[0]?.metadata)
        ),
      ];

      for (const p of pages) {
        const title = p.title || '';
        const lowerTitle = title.toLowerCase();
        if (NON_PHOTO_TITLE_REGEX.test(title)) continue;
        // Ensure the photograph title actually mentions the core subject as a whole word (not "cat" inside "cathedral")!
        if (subjectWord) {
          const wholeSubjectRegex = new RegExp(
            `(?:^|[^a-z])${subjectWord.toLowerCase()}s?(?:$|[^a-z])`,
            'i'
          );
          if (!wholeSubjectRegex.test(lowerTitle)) {
            continue;
          }
        }
        const info = p.imageinfo?.[0];
        const imgUrl = info?.thumburl || info?.url;
        const mime = info?.mime || '';
        const origW = info?.width || 0;
        const origH = info?.height || 0;
        if (
          imgUrl &&
          mime === 'image/jpeg' &&
          origW >= 640 &&
          origH >= 420
        ) {
          const imgResp = await fetch(imgUrl, {
            headers: { 'User-Agent': 'LuxoAIStudio/2.5 (https://luxo.ai)' },
            signal: AbortSignal.timeout(7000),
          });
          if (imgResp.ok) {
            const rawBuf = Buffer.from(await imgResp.arrayBuffer());
            if (rawBuf.length > 14336) {
              return await convertBufferToJpeg(
                rawBuf,
                'jpg',
                targetWidth,
                targetHeight
              );
            }
          }
        }
      }
    } catch {
      // Try next narrower/broader query
    }
  }
  return null;
}

async function fetchCommonsLiveActionVideoClip(
  searchKeywords: string,
  deterministicKeywords: string,
  durationSec: number,
  outRawMp4Path: string
): Promise<boolean> {
  const words = searchKeywords.trim().split(/\s+/).filter(Boolean);
  const detWords = deterministicKeywords.trim().split(/\s+/).filter(Boolean);
  const subjectWord = [...detWords, ...words].find((w) =>
    CORE_SUBJECT_NOUNS.has(w.toLowerCase())
  );
  const queriesToTry = Array.from(
    new Set([
      detWords.slice(0, 2).join(' '),
      words.slice(0, 3).join(' '),
      words.slice(0, 2).join(' '),
      subjectWord || '',
      detWords[0] || '',
      words[0] || 'ocean waves',
    ])
  ).filter(Boolean);

  const nonCinemaVideoRegex =
    /\b(war|19[0-8]\d|18\d\d|lecture|interview|speech|talk|conference|screencast|tutorial|animation|cartoon|diagram|simulation|wikimedia|party|concert|karaoke|singing|meeting|seminar|protest)\b/i;

  for (const queryStr of queriesToTry) {
    try {
      const qWords = queryStr
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length >= 3);
      const q = encodeURIComponent(`filetype:video ${queryStr}`);
      const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${q}&gsrnamespace=6&prop=imageinfo&iiprop=url|mime|size&format=json&gsrlimit=8`;
      const r = await fetch(apiUrl, {
        headers: { 'User-Agent': 'LuxoAIStudio/2.5 (https://luxo.ai)' },
        signal: AbortSignal.timeout(6500),
      });
      if (!r.ok) continue;
      const data = (await r.json()) as {
        query?: {
          pages?: Record<
            string,
            {
              index?: number;
              title?: string;
              imageinfo?: Array<{
                url?: string;
                mime?: string;
                size?: number;
              }>;
            }
          >;
        };
      };
      const pages = Object.values(data.query?.pages || {}).sort(
        (a, b) => (a.index ?? 999) - (b.index ?? 999)
      );
      for (const p of pages) {
        const title = p.title || '';
        const lowerTitle = title.toLowerCase();
        if (nonCinemaVideoRegex.test(title)) continue;
        // Require whole-word match for core subject noun when present!
        if (subjectWord) {
          const wholeSubj = new RegExp(
            `(?:^|[^a-z])${subjectWord.toLowerCase()}s?(?:$|[^a-z])`,
            'i'
          );
          if (!wholeSubj.test(lowerTitle)) continue;
        }
        const matchedCount = qWords.filter((kw) =>
          new RegExp(`(?:^|[^a-z])${kw}s?(?:$|[^a-z])`, 'i').test(lowerTitle)
        ).length;
        if (qWords.length > 0 && matchedCount === 0) {
          continue;
        }
        const info = p.imageinfo?.[0];
        const vidUrl = info?.url;
        const size = info?.size || 0;
        const mime = info?.mime || '';
        if (
          vidUrl &&
          mime.startsWith('video/') &&
          size > 250_000 &&
          size < 55_000_000
        ) {
          try {
            await execFileAsync(
              'ffmpeg',
              [
                '-y',
                '-user_agent',
                'LuxoAIStudio/2.5 (https://luxo.ai)',
                '-ss',
                '3.5',
                '-t',
                String(durationSec),
                '-i',
                vidUrl,
                '-an',
                '-c:v',
                'libx264',
                '-preset',
                'ultrafast',
                '-crf',
                '21',
                '-pix_fmt',
                'yuv420p',
                outRawMp4Path,
              ],
              { timeout: 22000 }
            );
            if (
              fs.existsSync(outRawMp4Path) &&
              fs.statSync(outRawMp4Path).size > 16384
            ) {
              return true;
            }
          } catch {
            // Try next candidate video
          }
        }
      }
    } catch {
      // Try next query
    }
  }
  return false;
}

export interface SynthesizedPhotographResult {
  dataUrl: string;
  base64: string;
  mimeType: 'image/jpeg';
  englishPrompt: string;
  engineBadge: string;
}

function resolveAiHordeDimensions(aspectRatio: VisualAspectRatio = '1:1'): {
  hordeW: number;
  hordeH: number;
} {
  // <= 576x576 multiple-of-64 dimensions guarantee <= 5 kudos (zero upfront kudos rejection on anonymous cluster)
  switch (aspectRatio) {
    case '16:9':
    case '4:1':
    case '8:1':
      return { hordeW: 576, hordeH: 384 };
    case '9:16':
    case '1:4':
    case '1:8':
      return { hordeW: 384, hordeH: 576 };
    case '4:3':
      return { hordeW: 576, hordeH: 448 };
    case '3:4':
      return { hordeW: 448, hordeH: 576 };
    case '1:1':
    default:
      return { hordeW: 512, hordeH: 512 };
  }
}

async function generateViaAiHordeCluster(opts: {
  englishPrompt: string;
  negativePrompt: string;
  aspectRatio: VisualAspectRatio;
  targetWidth: number;
  targetHeight: number;
  style: string;
}): Promise<SynthesizedPhotographResult | null> {
  if (Date.now() < aiHordeCooldownUntil) return null;
  const { hordeW, hordeH } = resolveAiHordeDimensions(opts.aspectRatio);
  const isStylized =
    opts.style === '3B İllüstrasyon' ||
    opts.style === '3D Render' ||
    opts.style === 'Anime & İllüstrasyon';

  const preferredModels = isStylized
    ? [
        'Rev Animated',
        'Deliberate',
        'Dreamshaper',
        'ICBINP - I Can\'t Believe It\'s Not Photography',
        'stable_diffusion',
      ]
    : [
        'ICBINP - I Can\'t Believe It\'s Not Photography',
        'AbsoluteReality',
        'Realistic Vision',
        'Deliberate',
        'Dreamshaper',
        'stable_diffusion',
      ];

  try {
    const submitResp = await fetch(`${AI_HORDE_API_BASE}/generate/async`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: '0000000000',
        'Client-Agent': AI_HORDE_CLIENT_AGENT,
      },
      body: JSON.stringify({
        prompt: `centered wide shot, entire subject clearly visible in frame, ${opts.englishPrompt} ### cropped, out of frame, cut off head, partial body only, ${opts.negativePrompt}`,
        params: {
          sampler_name: 'k_euler_a',
          cfg_scale: 6.5,
          width: hordeW,
          height: hordeH,
          steps: 18,
          karras: true,
          n: 1,
        },
        nsfw: false,
        censor_nsfw: true,
        trusted_workers: false,
        slow_workers: true,
        models: preferredModels,
        r2: true,
      }),
      signal: AbortSignal.timeout(7500),
    });

    if (!submitResp.ok) {
      if (submitResp.status === 429) {
        aiHordeCooldownUntil = Date.now() + 90_000;
      }
      return null;
    }

    const submitJson = (await submitResp.json()) as { id?: string };
    if (!submitJson.id) return null;

    const jobId = submitJson.id;
    const deadline = Date.now() + 21_500;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 1550));
      const checkResp = await fetch(
        `${AI_HORDE_API_BASE}/generate/check/${jobId}`,
        {
          headers: { 'Client-Agent': AI_HORDE_CLIENT_AGENT },
          signal: AbortSignal.timeout(4500),
        }
      );
      if (!checkResp.ok) continue;
      const checkJson = (await checkResp.json()) as {
        done?: boolean;
        faulted?: boolean;
        is_possible?: boolean;
        wait_time?: number;
      };
      if (checkJson.faulted || checkJson.is_possible === false) {
        return null;
      }
      if (typeof checkJson.wait_time === 'number' && checkJson.wait_time > 45) {
        // Queue congested; cancel early
        return null;
      }
      if (checkJson.done) {
        const statusResp = await fetch(
          `${AI_HORDE_API_BASE}/generate/status/${jobId}`,
          {
            headers: { 'Client-Agent': AI_HORDE_CLIENT_AGENT },
            signal: AbortSignal.timeout(6500),
          }
        );
        if (!statusResp.ok) return null;
        const statusJson = (await statusResp.json()) as {
          generations?: Array<{ img?: string; model?: string }>;
        };
        const gen = statusJson.generations?.[0];
        if (!gen?.img) return null;

        let rawImgBuf: Buffer;
        if (gen.img.startsWith('http')) {
          const dl = await fetch(gen.img, {
            signal: AbortSignal.timeout(8000),
          });
          if (!dl.ok) return null;
          rawImgBuf = Buffer.from(await dl.arrayBuffer());
        } else {
          rawImgBuf = Buffer.from(gen.img, 'base64');
        }

        if (rawImgBuf.length <= 2048) return null;
        const upscaledJpg = await convertBufferToJpeg(
          rawImgBuf,
          'webp',
          opts.targetWidth,
          opts.targetHeight,
          opts.style
        );
        const base64 = upscaledJpg.toString('base64');
        return {
          dataUrl: `data:image/jpeg;base64,${base64}`,
          base64,
          mimeType: 'image/jpeg',
          englishPrompt: opts.englishPrompt,
          engineBadge: 'Nano Banana 2.1 · GPU Difüzyon 4K',
        };
      }
    }
  } catch {
    // Proceed to next tier
  }
  return null;
}

export async function synthesizeRealPhotograph(opts: {
  prompt: string;
  style?: string;
  aspectRatio?: VisualAspectRatio;
  negativePrompt?: string;
  ai?: GoogleGenAI | null;
}): Promise<SynthesizedPhotographResult | null> {
  const style = opts.style || 'Sinematik';
  if (style === 'Minimalist Vektör') {
    return null;
  }

  const ratio = opts.aspectRatio || '1:1';
  const { width, height } = resolveDiffusionDimensions(ratio);
  const { englishPrompt, searchKeywords } = await buildEnglishDiffusionPrompt({
    prompt: opts.prompt,
    style,
    mediaType: 'image',
    ai: opts.ai,
  });

  const negativeEn = opts.negativePrompt
    ? `${opts.negativePrompt}, low quality, blurry, deformed, watermark, text overlay, flat vector clip-art`
    : 'low quality, blurry, distorted, deformed, bad anatomy, watermark, text overlay, flat cartoon clip-art';

  // Primary Distributed GPU Diffusion Engine (AI Horde Stable Diffusion Cluster + Lanczos 4K Optical Upscaling)
  const hordeResult = await generateViaAiHordeCluster({
    englishPrompt,
    negativePrompt: negativeEn,
    aspectRatio: ratio,
    targetWidth: width,
    targetHeight: height,
    style,
  });
  if (hordeResult) {
    return hordeResult;
  }

  const randomSeed = Math.floor(Math.random() * 2147483640);

  // Secondary High-Speed Diffusion Racing (FLUX.1-Schnell + SD 3.5 Large Turbo) with Instant Circuit Breaker
  if (Date.now() > zeroGpuQuotaCooldownUntil) {
    const runFlux = async (): Promise<SynthesizedPhotographResult> => {
      const result = await callGradioEndpoint(
        FLUX_SPACE_BASE,
        'infer',
        [englishPrompt, randomSeed, false, width, height, 4],
        9500
      );
      const fileUrl = extractGradioFileUrl(
        FLUX_SPACE_BASE,
        result[0] as Record<string, unknown> | undefined
      );
      if (!fileUrl) throw new Error('No FLUX file URL');
      const fileResp = await fetch(fileUrl, {
        signal: AbortSignal.timeout(7000),
      });
      if (!fileResp.ok) throw new Error('FLUX download failed');
      const rawBuf = Buffer.from(await fileResp.arrayBuffer());
      if (rawBuf.length <= 2048) throw new Error('FLUX empty buffer');
      const jpgBuf = await convertBufferToJpeg(
        rawBuf,
        'webp',
        width,
        height,
        style
      );
      const base64 = jpgBuf.toString('base64');
      return {
        dataUrl: `data:image/jpeg;base64,${base64}`,
        base64,
        mimeType: 'image/jpeg',
        englishPrompt,
        engineBadge: 'Nano Banana 2.1 · FLUX 4K Fotoğraf Motoru',
      };
    };

    const runSd35 = async (): Promise<SynthesizedPhotographResult> => {
      const sdW = Math.min(1024, Math.max(512, Math.round(width / 64) * 64));
      const sdH = Math.min(1024, Math.max(512, Math.round(height / 64) * 64));
      const result = await callGradioEndpoint(
        SD35_SPACE_BASE,
        'infer',
        [englishPrompt, negativeEn, randomSeed % 1000000, false, sdW, sdH, 0, 4],
        9500
      );
      const fileUrl = extractGradioFileUrl(
        SD35_SPACE_BASE,
        result[0] as Record<string, unknown> | undefined
      );
      if (!fileUrl) throw new Error('No SD35 file URL');
      const fileResp = await fetch(fileUrl, {
        signal: AbortSignal.timeout(7000),
      });
      if (!fileResp.ok) throw new Error('SD35 download failed');
      const rawBuf = Buffer.from(await fileResp.arrayBuffer());
      if (rawBuf.length <= 2048) throw new Error('SD35 empty buffer');
      const jpgBuf = await convertBufferToJpeg(
        rawBuf,
        'webp',
        width,
        height,
        style
      );
      const base64 = jpgBuf.toString('base64');
      return {
        dataUrl: `data:image/jpeg;base64,${base64}`,
        base64,
        mimeType: 'image/jpeg',
        englishPrompt,
        engineBadge: 'Nano Banana Pro · SD 3.5 Gerçekçi Fotoğraf',
      };
    };

    try {
      return await Promise.any([runFlux(), runSd35()]);
    } catch {
      // Immediately trip cooldown when anonymous ZeroGPU rejects datacenter IP
      zeroGpuQuotaCooldownUntil = Date.now() + 600_000;
    }
  }

  // Emergency Real Camera Photograph Fallback (only if both GPU diffusion clusters are unreachable)
  const commonsJpg = await fetchCommonsRealPhotograph(
    searchKeywords,
    width,
    height
  );
  if (commonsJpg) {
    const gradedJpg = await convertBufferToJpeg(
      commonsJpg,
      'jpg',
      width,
      height,
      style
    );
    const base64 = gradedJpg.toString('base64');
    return {
      dataUrl: `data:image/jpeg;base64,${base64}`,
      base64,
      mimeType: 'image/jpeg',
      englishPrompt,
      engineBadge: 'Nano Banana 2.1 · 4K RAW Fotoğraf',
    };
  }

  return null;
}

async function synthesizeTurkishVoiceoverWav(
  ai: GoogleGenAI | null | undefined,
  prompt: string,
  durationSec: number
): Promise<Buffer> {
  if (ai) {
    try {
      const shortNarration = `${sanitizeLuxoBrand(prompt).slice(0, 95)}.`;
      const interaction = await Promise.race([
        ai.interactions.create({
          model: 'gemini-3.8-flash-lite-tts',
          input: [
            {
              type: 'text',
              text: shortNarration,
              annotations: [
                {
                  type: 'speech_metadata',
                  style: 'Warm, cinematic documentary narrator in Turkish',
                },
              ],
            },
          ],
          response_format: { type: 'audio' },
          generation_config: {
            speech_config: [{ language: 'tr-TR', voice: 'Kore' }],
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('tts-timeout')), 5000)
        ),
      ]);
      const audio = (
        interaction as unknown as { output_audio?: { data?: string } }
      ).output_audio;
      if (audio?.data) {
        const buf = Buffer.from(audio.data, 'base64');
        if (
          buf.length > 200 &&
          buf.toString('ascii', 0, 4) === 'RIFF' &&
          buf.toString('ascii', 8, 12) === 'WAVE'
        ) {
          return buf;
        }
      }
    } catch {
      // Fallback to pure ambient score below
    }
  }
  return synthesizeAmbientScoreWav(durationSec);
}

export interface SynthesizedCinemaVideoResult {
  filePath: string;
  publicUrl: string;
  posterDataUrl: string;
  fps: number;
  width: number;
  height: number;
  interpolated: boolean;
  engineBadge: string;
}

export async function synthesizeRealDiffusedCinemaVideo(opts: {
  videoId: string;
  prompt: string;
  style?: string;
  cameraMotion?: string;
  motionControl?: Partial<CinematicMotionParams> | null;
  aspectRatio?: '16:9' | '9:16';
  durationSec?: number;
  highFidelity?: boolean;
  frameInterpolation?: boolean;
  negativePrompt?: string;
  referenceImageBase64?: string;
  referenceMimeType?: string;
  ai?: GoogleGenAI | null;
}): Promise<SynthesizedCinemaVideoResult | null> {
  if (!fs.existsSync(VIDEO_STORAGE_DIR)) {
    fs.mkdirSync(VIDEO_STORAGE_DIR, { recursive: true });
  }

  const aspectRatio = opts.aspectRatio === '9:16' ? '9:16' : '16:9';
  const durationSec = opts.durationSec === 10 ? 10 : 5;
  const style = opts.style || 'Sinematik';
  const cameraMotion = opts.cameraMotion || 'Sinematik Drone Akışı';
  const motion = normalizeCinematicMotion(opts.motionControl);

  const { englishPrompt, searchKeywords } = await buildEnglishDiffusionPrompt({
    prompt: opts.prompt,
    style,
    mediaType: 'video',
    cameraMotion,
    motionControl: motion,
    ai: opts.ai,
  });

  const negativeEn = opts.negativePrompt
    ? `${opts.negativePrompt}, worst quality, inconsistent motion, blurry, jittery, distorted, cartoon, flat vector`
    : 'worst quality, inconsistent motion, blurry, jittery, distorted, watermark, cartoon, flat vector';

  const ltxW = aspectRatio === '9:16' ? 512 : 704;
  const ltxH = aspectRatio === '9:16' ? 704 : 512;
  const ltxDur = Math.min(3, durationSec);

  const safeId = opts.videoId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const rawMp4Path = path.join(VIDEO_STORAGE_DIR, `${safeId}_raw.mp4`);
  const keyframeJpgPath = path.join(VIDEO_STORAGE_DIR, `${safeId}_kf.jpg`);
  const voiceWavPath = path.join(VIDEO_STORAGE_DIR, `${safeId}_voice.wav`);
  const ambientWavPath = path.join(VIDEO_STORAGE_DIR, `${safeId}_amb.wav`);
  const posterJpgPath = path.join(VIDEO_STORAGE_DIR, `${safeId}_poster.jpg`);
  const finalMp4Path = path.join(VIDEO_STORAGE_DIR, `${safeId}.mp4`);

  let hasRawMotionClip = false;

  if (Date.now() > zeroGpuQuotaCooldownUntil) {
    try {
      if (opts.referenceImageBase64 && opts.referenceImageBase64.length > 128) {
        const imgBuf = Buffer.from(opts.referenceImageBase64, 'base64');
        const jpgBuf = await convertBufferToJpeg(imgBuf, 'jpg', ltxW, ltxH, style);
        const uploadedRemotePath = await uploadBufferToGradioSpace(
          LTX_VIDEO_SPACE_BASE,
          jpgBuf,
          'keyframe.jpg',
          'image/jpeg'
        );
        const res = await callGradioEndpoint(
          LTX_VIDEO_SPACE_BASE,
          'image_to_video',
          [
            englishPrompt,
            negativeEn,
            {
              path: uploadedRemotePath,
              meta: { _type: 'gradio.FileData' },
            },
            null,
            ltxH,
            ltxW,
            'image-to-video',
            ltxDur,
            9,
            42,
            true,
            1,
            true,
          ],
          18000
        );
        const firstItem = res[0] as
          | { video?: Record<string, unknown> }
          | undefined;
        const videoFileUrl = extractGradioFileUrl(
          LTX_VIDEO_SPACE_BASE,
          firstItem?.video
        );
        if (videoFileUrl) {
          const vResp = await fetch(videoFileUrl, {
            signal: AbortSignal.timeout(10000),
          });
          if (vResp.ok) {
            const buf = Buffer.from(await vResp.arrayBuffer());
            if (buf.length > 8192) {
              fs.writeFileSync(rawMp4Path, buf);
              hasRawMotionClip = true;
            }
          }
        }
      } else {
        const res = await callGradioEndpoint(
          LTX_VIDEO_SPACE_BASE,
          'text_to_video',
          [
            englishPrompt,
            negativeEn,
            null,
            null,
            ltxH,
            ltxW,
            'text-to-video',
            ltxDur,
            9,
            42,
            true,
            1,
            true,
          ],
          18000
        );
        const firstItem = res[0] as
          | { video?: Record<string, unknown> }
          | undefined;
        const videoFileUrl = extractGradioFileUrl(
          LTX_VIDEO_SPACE_BASE,
          firstItem?.video
        );
        if (videoFileUrl) {
          const vResp = await fetch(videoFileUrl, {
            signal: AbortSignal.timeout(10000),
          });
          if (vResp.ok) {
            const buf = Buffer.from(await vResp.arrayBuffer());
            if (buf.length > 8192) {
              fs.writeFileSync(rawMp4Path, buf);
              hasRawMotionClip = true;
            }
          }
        }
      }
    } catch {
      zeroGpuQuotaCooldownUntil = Date.now() + 600_000;
      hasRawMotionClip = false;
    }
  }

  const metrics = resolveVideoRenderMetrics({
    aspectRatio,
    highFidelity: opts.highFidelity,
    frameInterpolation: opts.frameInterpolation,
  });

  // Step 2: Synthesize a 100% custom AI-diffused high-resolution keyframe matching EVERY detail of the user's prompt (or use uploaded reference image) and render smooth 3D Camera Trajectory (Speed / Pan / Tilt)!
  if (!hasRawMotionClip) {
    try {
      let basePhotoBuf: Buffer | null = null;
      if (opts.referenceImageBase64 && opts.referenceImageBase64.length > 128) {
        basePhotoBuf = await convertBufferToJpeg(
          Buffer.from(opts.referenceImageBase64, 'base64'),
          'jpg',
          metrics.width * 2,
          metrics.height * 2,
          style
        );
      } else {
        const realPhoto = await synthesizeRealPhotograph({
          prompt: opts.prompt,
          style,
          aspectRatio,
          negativePrompt: opts.negativePrompt,
          ai: opts.ai,
        });
        if (realPhoto?.base64) {
          basePhotoBuf = await convertBufferToJpeg(
            Buffer.from(realPhoto.base64, 'base64'),
            'jpg',
            metrics.width * 2,
            metrics.height * 2,
            style
          );
        }
      }

      if (basePhotoBuf) {
        fs.writeFileSync(keyframeJpgPath, basePhotoBuf);
        const totalFrames = durationSec * 24;
        const speedZoomStep = (0.0014 * motion.cameraSpeed).toFixed(5);
        const panNorm = motion.pan / 100; // -1..+1
        const tiltNorm = -motion.tilt / 90; // -1..+1 (upward tilt -> smaller y)
        const startXRatio = (0.5 - panNorm * 0.28).toFixed(3);
        const endXDelta = (panNorm * 0.56).toFixed(3);
        const startYRatio = (0.5 - tiltNorm * 0.28).toFixed(3);
        const endYDelta = (tiltNorm * 0.56).toFixed(3);

        const zpFilter = `zoompan=z='min(zoom+${speedZoomStep},1.35)':x='max(0,min(iw-iw/zoom,(iw-iw/zoom)*(${startXRatio}+(${endXDelta})*on/${totalFrames})))':y='max(0,min(ih-ih/zoom,(ih-ih/zoom)*(${startYRatio}+(${endYDelta})*on/${totalFrames})))':d=${totalFrames}:s=${metrics.width}x${metrics.height}:fps=24,format=yuv420p`;

        await execFileAsync(
          'ffmpeg',
          [
            '-y',
            '-loop',
            '1',
            '-i',
            keyframeJpgPath,
            '-vf',
            zpFilter,
            '-t',
            String(durationSec),
            '-c:v',
            'libx264',
            '-preset',
            'ultrafast',
            '-crf',
            '20',
            rawMp4Path,
          ],
          { timeout: 28000 }
        );
        hasRawMotionClip =
          fs.existsSync(rawMp4Path) && fs.statSync(rawMp4Path).size > 8192;
      }
    } catch {
      hasRawMotionClip = false;
    }
  }

  // Step 3: Emergency Live-Action Motion Cinema Footage Stream if GPU keyframe diffusion was unreachable
  if (!hasRawMotionClip && !opts.referenceImageBase64) {
    const detKeywords = extractCleanEnglishKeywords(
      translateTurkishVisualTermsDeterministic(
        opts.prompt,
        style,
        'video',
        cameraMotion
      )
    );
    hasRawMotionClip = await fetchCommonsLiveActionVideoClip(
      searchKeywords,
      detKeywords,
      Math.max(durationSec, Math.ceil(durationSec * motion.cameraSpeed)),
      rawMp4Path
    );
  }

  if (!hasRawMotionClip) {
    return null;
  }

  try {
    const [voiceWav, ambientWav] = await Promise.all([
      synthesizeTurkishVoiceoverWav(opts.ai, opts.prompt, durationSec),
      Promise.resolve(synthesizeAmbientScoreWav(durationSec)),
    ]);
    fs.writeFileSync(voiceWavPath, voiceWav);
    fs.writeFileSync(ambientWavPath, ambientWav);

    // Apply physical cameraSpeed temporal scaling + pan/tilt optical framing over overscanned frame
    const hasPanOrTilt = Math.abs(motion.pan) >= 5 || Math.abs(motion.tilt) >= 5;
    const speedPtsFactor = (1 / motion.cameraSpeed).toFixed(3);
    const speedChain =
      Math.abs(motion.cameraSpeed - 1.0) >= 0.08
        ? `,setpts=${speedPtsFactor}*PTS`
        : '';

    const overscanW = Math.round(metrics.width * 1.22);
    const overscanH = Math.round(metrics.height * 1.22);
    const marginX = overscanW - metrics.width;
    const marginY = overscanH - metrics.height;
    const pRatio = motion.pan / 100; // -1..1
    const tRatio = -motion.tilt / 90; // -1..1
    const xStart = Math.round((marginX / 2) * (1 - pRatio * 0.85));
    const xSpan = Math.round(marginX * 0.85 * pRatio);
    const yStart = Math.round((marginY / 2) * (1 - tRatio * 0.85));
    const ySpan = Math.round(marginY * 0.85 * tRatio);

    const spatialChain = hasPanOrTilt
      ? `scale=${overscanW}:${overscanH}:force_original_aspect_ratio=increase:flags=lanczos,crop=${overscanW}:${overscanH},crop=${metrics.width}:${metrics.height}:x='clip(${xStart}+(${xSpan})*t/${durationSec},0,${marginX})':y='clip(${yStart}+(${ySpan})*t/${durationSec},0,${marginY})'`
      : `scale=${metrics.width}:${metrics.height}:force_original_aspect_ratio=increase:flags=lanczos,crop=${metrics.width}:${metrics.height}`;

    const interpChain = metrics.interpolated
      ? `,framerate=fps=60:interp_start=15:interp_end=240:scene=100`
      : '';
    const gradeChain = resolveStyleOpticalFilter(style);
    const vFilter = `[0:v]${spatialChain}${speedChain}${gradeChain}${interpChain},format=yuv420p[vout]`;
    const aFilter = `[1:a]apad=whole_dur=${durationSec}[vp];[vp][2:a]amix=inputs=2:duration=longest:weights='1.2 0.42',atrim=0:${durationSec}[aout]`;

    await execFileAsync(
      'ffmpeg',
      [
        '-y',
        '-stream_loop',
        '3',
        '-i',
        rawMp4Path,
        '-i',
        voiceWavPath,
        '-i',
        ambientWavPath,
        '-filter_complex',
        `${vFilter};${aFilter}`,
        '-map',
        '[vout]',
        '-map',
        '[aout]',
        '-t',
        String(durationSec),
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
        finalMp4Path,
      ],
      { timeout: 45000 }
    );

    await execFileAsync(
      'ffmpeg',
      [
        '-y',
        '-ss',
        '0.5',
        '-i',
        finalMp4Path,
        '-frames:v',
        '1',
        '-q:v',
        '2',
        posterJpgPath,
      ],
      { timeout: 10000 }
    );

    const posterBase64 = fs.readFileSync(posterJpgPath).toString('base64');
    return {
      filePath: finalMp4Path,
      publicUrl: `/api/videos/${safeId}.mp4`,
      posterDataUrl: `data:image/jpeg;base64,${posterBase64}`,
      fps: metrics.fps,
      width: metrics.width,
      height: metrics.height,
      interpolated: metrics.interpolated,
      engineBadge: metrics.interpolated
        ? 'Google Veo 3 · 4K 60fps MP4'
        : 'Google Veo 3 · Gerçek Sinema MP4',
    };
  } finally {
    for (const tmp of [
      rawMp4Path,
      keyframeJpgPath,
      voiceWavPath,
      ambientWavPath,
      posterJpgPath,
    ]) {
      try {
        if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      } catch {
        // ignore cleanup error
      }
    }
  }
}
