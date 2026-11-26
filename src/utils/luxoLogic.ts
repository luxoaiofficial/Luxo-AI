import type {
  CinematicMotionParams,
  CitationItem,
  GeneratedVisual,
  LibraryItem,
  LuxoModelCategory,
  LuxoModelConfig,
  LuxoModelId,
  LuxoPlugin,
  LuxoProject,
  LuxoUser,
  LuxoVoiceOption,
  NanoBananaModelId,
  NanoLensPresetId,
  ProviderConnectionStatusMap,
  ScheduledRoutine,
  SelfEvolutionState,
  SharedContentPayload,
  SocialShareLinks,
  SynthesisMode,
  VisualAspectRatio,
} from '../types/luxo.ts';
import { renderPromptAwareSvgArtwork } from './visualSceneComposer.ts';
import {
  type ConversationTurnInput,
  getAuthenticPersonaProfile,
  synthesizeAuthenticModelResponse,
} from './aiPersonaEngine.ts';
import {
  getModelTokenSpec,
  isModelExecutableWithProviders,
  LIVE_VERIFIED_GOOGLE_MODELS,
} from './tokenLimitsEngine.ts';

export const GUEST_MESSAGE_LIMIT = 100;

export const DEFAULT_SEO_TITLE =
  'Luxo AI – 122 Yapay Zeka Modeli, 4K Görsel & Video Stüdyo';
export const DEFAULT_SEO_DESCRIPTION =
  '122 yapay zeka modeli: Gemini 4, ChatGPT-5.2 Pro, Claude 5.5 Opus, DeepSeek R2, Grok 4, Nano Banana 4K ve Google Veo 3 Video Stüdyosu.';

export const NANO_BANANA_MODELS: {
  id: NanoBananaModelId;
  name: string;
  badge: string;
  desc: string;
  supports4K: boolean;
  supportsSearchGrounding: boolean;
  supportsPanoramic: boolean;
  supportsDualReference: boolean;
}[] = [
  {
    id: 'gemini-nano-banana-2.1',
    name: 'Nano Banana 2.1 Ultra',
    badge: '4K UHD · PANORAMİK & ARAMA',
    desc: '1K/2K/4K ultra detay, 4:1 / 8:1 sinemaskop panoramik oranlar, çift referans birleştirme ve canlı Google Görsel Arama bağlamı',
    supports4K: true,
    supportsSearchGrounding: true,
    supportsPanoramic: true,
    supportsDualReference: true,
  },
  {
    id: 'gemini-3-pro-image',
    name: 'Nano Banana Pro (Gemini 3 Pro)',
    badge: 'STÜDYO · TİPOGRAFİ & MİMARİ',
    desc: 'Kusursuz tipografi, endüstriyel ürün tasarımı, mimari kesit render ve panoramik kompozisyon motoru (1K-4K)',
    supports4K: true,
    supportsSearchGrounding: true,
    supportsPanoramic: true,
    supportsDualReference: true,
  },
  {
    id: 'gemini-3.1-flash-lite-image',
    name: 'Nano Banana 2 Lite',
    badge: 'ANLIK SENTEZ & DÜZENLEME',
    desc: 'Ultra düşük gecikmeli konsept üretimi, çoklu kare taslağı ve hassas görsel düzenleme (Image-to-Image)',
    supports4K: false,
    supportsSearchGrounding: false,
    supportsPanoramic: false,
    supportsDualReference: true,
  },
];

export const NANO_LENS_PRESETS: {
  id: NanoLensPresetId;
  label: string;
  shortTag: string;
  descriptor: string;
}[] = [
  {
    id: '35mm-cinema',
    label: '35mm ARRI Sinema',
    shortTag: '35mm f/1.8',
    descriptor:
      '35mm ARRI Alexa Mini LF prime cinema lens, natural cinematic depth of field, subtle filmic highlight roll-off, volumetric key lighting',
  },
  {
    id: '85mm-portrait',
    label: '85mm Portre f/1.2',
    shortTag: '85mm Bokeh',
    descriptor:
      '85mm f/1.2 optical prime portrait lens, creamy optical bokeh, razor-sharp subject micro-contrast, balanced Rembrandt rim lighting',
  },
  {
    id: 'imax-anamorphic',
    label: 'IMAX Anamorfik',
    shortTag: '65mm Geniş',
    descriptor:
      '65mm IMAX 2.39:1 anamorphic optics, subtle horizontal optical flare, monumental scale, edge-to-edge 4K clarity',
  },
  {
    id: 'macro-crystal',
    label: 'Makro Kristal f/2.8',
    shortTag: '100mm Makro',
    descriptor:
      '100mm f/2.8 studio macro lens, microscopic material texture, subsurface scattering, specular crystal refraction',
  },
  {
    id: 'studio-product',
    label: 'Hasselblad Stüdyo',
    shortTag: '100MP Ürün',
    descriptor:
      'Hasselblad 100MP medium-format sensor, architectural tilt-shift geometry, diffused dual-softbox commercial studio lighting',
  },
];

export const SYNTHESIS_MODES: {
  id: SynthesisMode;
  label: string;
  shortDesc: string;
  directive: string;
}[] = [
  {
    id: 'standart',
    label: 'Dengeli & Yapılandırılmış',
    shortDesc: 'Net özet, düzenli maddeler ve doğrudan çözüm',
    directive:
      'Gereksiz giriş cümleleri kurmadan doğrudan konuya gir; çekirdek yanıtı net maddeler veya akıcı paragraflarla yapılandır.',
  },
  {
    id: 'uzman-mimari',
    label: 'Başmühendis & Mimari',
    shortDesc: 'Özlü teknik mimari ve net çözüm',
    directive:
      'Kıdemli sistem mimarı gibi düşün; modüler mimariyi ve kritik noktaları uzatmadan kısa ve net biçimde açıkla.',
  },
  {
    id: 'akademik-kanit',
    label: 'Bilimsel & Kanıt Odaklı',
    shortDesc: 'İlk prensipler ve doğrulanmış kısa özet',
    directive:
      'Problemi ilk prensiplerden ele al, doğrulanmış kanıtları birkaç kısa ve sade cümleyle özetle.',
  },
  {
    id: 'yaratici-vizyon',
    label: 'Yaratıcı & Ürün Vizyonu',
    shortDesc: 'Özgün fikirler ve yalın anlatım',
    directive:
      'Özgün ürün ve tasarım fikirlerini karmaşık semboller kullanmadan, kısa ve akıcı cümlelerle sun.',
  },
];

export const LUXO_VOICES: LuxoVoiceOption[] = [
  {
    name: 'Breeze',
    desc: 'Doğal, samimi ve dengeli günlük sohbet sesi',
    sample: 'Merhaba! Ben Luxo AI Breeze. Bugün hangi fikri hayata geçiriyoruz?',
    pitch: 1.02,
    rate: 1.0,
    accentColor: '#2563eb',
    geminiVoice: 'Puck',
    acousticStyle: 'Natural, warm, friendly conversational studio voice',
  },
  {
    name: 'Cove',
    desc: 'Sıcak, sakin ve güven veren anlatıcı tonu',
    sample: 'Derin bir nefes alın, tüm karmaşık konuları adım adım birlikte çözelim.',
    pitch: 0.88,
    rate: 0.95,
    accentColor: '#0284c7',
    geminiVoice: 'Charon',
    acousticStyle: 'Calm, reassuring, resonant documentary narrator',
  },
  {
    name: 'Ember',
    desc: 'Kendinden emin, net ve dinamik sunum sesi',
    sample: 'Strateji hazır! Hedeflerimize en hızlı yoldan ulaşmak için başlıyoruz.',
    pitch: 0.94,
    rate: 1.06,
    accentColor: '#ea580c',
    geminiVoice: 'Fenrir',
    acousticStyle: 'Confident, energetic keynote presenter with crisp diction',
  },
  {
    name: 'Juniper',
    desc: 'Enerjik, neşeli ve akıcı yardımcı tonu',
    sample: 'Harika bir soru sordunuz! Hemen en yaratıcı çözümü üretelim.',
    pitch: 1.14,
    rate: 1.05,
    accentColor: '#059669',
    geminiVoice: 'Kore',
    acousticStyle: 'Bright, cheerful, articulate creative assistant',
  },
  {
    name: 'Sky',
    desc: 'Pozitif, ferah ve berrak stüdyo akustiği',
    sample: 'Luxo AI ses stüdyosuna hoş geldiniz, sizi net bir şekilde dinliyorum.',
    pitch: 1.08,
    rate: 1.0,
    accentColor: '#06b6d4',
    geminiVoice: 'Zephyr',
    acousticStyle: 'Clear, airy, broadcast-grade studio clarity',
  },
  {
    name: 'Nova',
    desc: 'Parlak, modern ve ilham verici teknoloji sesi',
    sample: 'Merhaba! Ben Nova. Gemini 4 Argon ve geleceğin mimarilerini konuşmaya hazırım.',
    pitch: 1.18,
    rate: 1.04,
    accentColor: '#8b5cf6',
    geminiVoice: 'Kore',
    acousticStyle: 'Inspiring, futuristic technology host with polished cadence',
    isNew: true,
  },
  {
    name: 'Orion',
    desc: 'Derin, tok ve karizmatik belgesel tonu',
    sample: 'Karmaşık sistemlerin ardındaki temel prensipleri birlikte keşfedelim.',
    pitch: 0.78,
    rate: 0.94,
    accentColor: '#4f46e5',
    geminiVoice: 'Fenrir',
    acousticStyle: 'Deep, rich baritone cinema and science narrator',
    isNew: true,
  },
  {
    name: 'Atlas',
    desc: 'Analitik, profesyonel ve kurumsal danışman sesi',
    sample: 'Verileri inceledim; en verimli üç mimari seçeneği sizin için sıralıyorum.',
    pitch: 0.85,
    rate: 1.02,
    accentColor: '#0f766e',
    geminiVoice: 'Charon',
    acousticStyle: 'Authoritative, analytical executive advisor',
    isNew: true,
  },
  {
    name: 'Luna',
    desc: 'Yumuşak, dingin ve odaklanmayı artıran gece modu sesi',
    sample: 'Sessiz ve odaklı bir çalışma seansı için yanınızdayım, başlayabiliriz.',
    pitch: 1.1,
    rate: 0.92,
    accentColor: '#ec4899',
    geminiVoice: 'Zephyr',
    acousticStyle: 'Gentle, soothing late-night focus companion',
    isNew: true,
  },
  {
    name: 'Zephyr',
    desc: 'Çevik, ultra akıcı ve yüksek tempolu geliştirici sesi',
    sample: 'Kod blokları derlendi ve testler geçti! Sıradaki göreve geçelim.',
    pitch: 1.0,
    rate: 1.14,
    accentColor: '#f59e0b',
    geminiVoice: 'Puck',
    acousticStyle: 'Fast-paced, agile developer pair-programming partner',
    isNew: true,
  },
];

export function getVoiceOption(voiceName?: string): LuxoVoiceOption {
  return LUXO_VOICES.find((v) => v.name === voiceName) || LUXO_VOICES[0];
}

export function sanitizeLuxoBrand(text: string): string {
  if (!text) return '';
  return text.replace(
    /[a-zA-Z0-9._%+-]+@gmail\.com/gi,
    'Luxo Destek Merkezi'
  );
}

export function foldTurkishDiacritics(input: string): string {
  if (!input) return '';
  return input
    .replace(/\u0130/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/Ğ/g, 'g')
    .replace(/ğ/g, 'g')
    .replace(/Ü/g, 'u')
    .replace(/ü/g, 'u')
    .replace(/Ş/g, 's')
    .replace(/ş/g, 's')
    .replace(/Ö/g, 'o')
    .replace(/ö/g, 'o')
    .replace(/Ç/g, 'c')
    .replace(/ç/g, 'c')
    .toLowerCase();
}

export function cleanAssistantResponse(
  text: string,
  allowLong = false
): string {
  if (!text) return '';
  let redacted = sanitizeLuxoBrand(text);

  // Auto-repair unclosed markdown code fence so code is never mangled or truncated as prose
  const fenceMatches = redacted.match(/```/g);
  if (fenceMatches && fenceMatches.length % 2 === 1) {
    redacted = `${redacted.trimEnd()}\n\`\`\``;
  }

  const parts = redacted.split(/(```[\s\S]*?```)/g);
  const cleanedParts = parts.map((segment, idx) => {
    if (segment.startsWith('```')) {
      return segment;
    }
    let prose = segment;
    if (idx === 0) {
      prose = prose
        .replace(
          /^[^\n.!?]{2,85}\bolarak\s+yanıt\s+veriyorum[.!?\s]*/iu,
          ''
        )
        .replace(
          /^(?:bir\s+yapay\s+zeka(?:\s+modeli|\s+asistanı)?\s+olarak[,:\s-]*|as\s+an\s+ai(?:\s+language\s+model)?[,:\s-]*)/iu,
          ''
        )
        .replace(
          /^(?:tabii(?:\s+ki)?|elbette|memnuniyetle|hemen\s+açıklıyorum|işte\s+(?:yanıtınız|cevabınız|kısa\s+özet))[!,:.\s-]*/iu,
          ''
        );
    }
    return prose
      .replace(
        /[^.!?\n]*\b(argon\s+kod\s+stüdyo\S*|argon\s+stüdyo\S*|kod\s+stüdyosu\S*|stüdyoda\s+aç\S*)\b[^.!?\n]*[.!?]?/giu,
        ''
      )
      .replace(/[✦❖⚡➤►▪◆★☆⟦⟧⟪⟫«»§¶†‡•◦‣⁃]/g, '')
      .replace(/\\textbf\{([^}]*)\}/g, '$1')
      .replace(/\$\$([^$]+)\$\$/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^>\s?/gm, '')
      .replace(/^\s*\*\s+/gm, '- ')
      .replace(/^\s*[-=~_*]{3,}\s*$/gm, '')
      .replace(/\*{3,}/g, '')
      .replace(/(?<!\*)\*(?!\*)/g, '')
      .replace(/_{2,}/g, '')
      .replace(/~{2,}/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n');
  });
  let out = cleanedParts.join('').trim();
  const maxProseChars = allowLong ? 4200 : 680;
  if (!redacted.includes('```') && out.length > maxProseChars) {
    const windowSlice = out.slice(0, maxProseChars);
    const lastBoundary = Math.max(
      windowSlice.lastIndexOf('. '),
      windowSlice.lastIndexOf('! '),
      windowSlice.lastIndexOf('? '),
      windowSlice.lastIndexOf('.\n')
    );
    if (lastBoundary >= 180) {
      out = windowSlice.slice(0, lastBoundary + 1).trim();
    } else {
      out = `${windowSlice.replace(/\s+\S*$/, '').trim()}.`;
    }
  }
  return out;
}

export const LUXO_MODEL_CATEGORIES: ('Tümü' | LuxoModelCategory)[] = [
  'Tümü',
  'Google Gemini',
  'OpenAI & ChatGPT',
  'Anthropic Claude',
  'DeepSeek',
  'Grok & Meta Llama',
  'Mistral & Qwen',
  'Sinema & Görsel AI',
  'Perplexity & Küresel AI',
  'Luxo Özel',
];

export function getModelBrandLogoUrl(id: string, name: string, category: string): string {
  const lId = id.toLowerCase();
  const lName = name.toLowerCase();
  const lCat = category.toLowerCase();

  if (lId === 'luxo-sol' || lId.endsWith('-sol')) {
    return '/logos/sol.svg';
  }
  if (lId === 'luxo-luna' || lId.endsWith('-luna')) {
    return '/logos/luna.svg';
  }
  if (lId.startsWith('luxo-')) {
    return '/logos/luxo.svg';
  }
  if (
    lId.includes('claude') ||
    lId.includes('fable') ||
    lId.includes('opus') ||
    lId.includes('sonnet') ||
    lId.includes('haiku')
  ) {
    return '/logos/claude.svg';
  }
  if (
    lId.includes('gpt') ||
    lId.includes('chatgpt') ||
    lId.includes('openai') ||
    lId.includes('astra') ||
    lId.includes('sora')
  ) {
    return '/logos/openai.svg';
  }
  if (lId.includes('deepseek')) {
    return '/logos/deepseek.svg';
  }
  if (lId.includes('grok')) {
    return '/logos/grok.svg';
  }
  if (lId.includes('llama') || lName.includes('meta')) {
    return '/logos/meta.svg';
  }
  if (
    lId.includes('mistral') ||
    lId.includes('codestral') ||
    lId.includes('pixtral') ||
    lId.includes('magistral')
  ) {
    return '/logos/mistral.svg';
  }
  if (lId.includes('qwen') || lId.includes('qwq')) {
    return '/logos/qwen.svg';
  }
  if (lId.includes('perplexity')) {
    return '/logos/perplexity.svg';
  }
  if (
    lId.includes('gemini') ||
    lId.includes('gemma') ||
    lId.includes('antigravity') ||
    lId.includes('deep-research') ||
    lId.includes('imagen') ||
    lId.includes('veo')
  ) {
    return '/logos/gemini.svg';
  }
  if (
    lCat.includes('sinema') ||
    lCat.includes('görsel') ||
    lId.includes('nano-banana') ||
    lId.includes('flux') ||
    lId.includes('kling') ||
    lId.includes('runway') ||
    lId.includes('higgsfield') ||
    lId.includes('wan') ||
    lId.includes('seedance') ||
    lId.includes('hailuo') ||
    lId.includes('luma') ||
    lId.includes('pika') ||
    lId.includes('midjourney')
  ) {
    return '/logos/cinema.svg';
  }
  if (lCat.includes('küresel') || lId.includes('kimi') || lId.includes('cohere') || lId.includes('phi') || lId.includes('nova') || lId.includes('nemotron') || lId.includes('glm') || lId.includes('minimax') || lId.includes('yi-')) {
    return '/logos/global.svg';
  }
  return '/logos/luxo.svg';
}

function createModelSpec(
  id: LuxoModelId,
  name: string,
  category: LuxoModelCategory,
  sdkBackend: string,
  badge: string,
  accentColor: string,
  thinkingLevel: 'LOW' | 'MEDIUM' | 'HIGH',
  contextWindow: string,
  tagline: string,
  description: string,
  capabilities: string[],
  systemInstruction: string,
  options?: {
    allowGuest?: boolean;
    isLocked?: boolean;
    tier?: 'free' | 'go' | 'plus';
    speed?: string;
  }
): LuxoModelConfig {
  const tokenSpec = getModelTokenSpec(id);
  return {
    id,
    name,
    category,
    provider: tokenSpec.provider,
    sdkBackend,
    allowGuest: options?.allowGuest ?? true,
    tagline,
    description,
    badge,
    speed:
      options?.speed ||
      (thinkingLevel === 'HIGH'
        ? 'Derin & Keskin'
        : thinkingLevel === 'MEDIUM'
        ? 'Akıcı & Net'
        : 'Şimşek Hızı'),
    isLocked: options?.isLocked ?? true,
    accentColor,
    thinkingLevel,
    tier: options?.tier ?? 'free',
    contextWindow,
    maxInputTokens: tokenSpec.maxInputTokens,
    maxOutputTokens: tokenSpec.maxOutputTokens,
    defaultDailyTokenLimit: tokenSpec.defaultDailyTokenLimit,
    capabilities,
    systemInstruction,
    logoUrl: getModelBrandLogoUrl(id, name, category),
  };
}

export const LUXO_MODELS: Record<LuxoModelId, LuxoModelConfig> = {
  // ==================== 1. GOOGLE GEMINI & DEEPMIND (19) ====================
  'gemini-4-argon': createModelSpec(
    'gemini-4-argon',
    'Gemini 4 Argon',
    'Google Gemini',
    'gemini-4-argon',
    'GEMINI 4 · AMİRAL GEMİSİ',
    '#4f46e5',
    'HIGH',
    '2M Token',
    'Google Amiral Gemisi Akıl Yürütme, STEM & Yazılım Motoru',
    'Karmaşık mühendislik, ileri matematik ve sistem mimarisini öz-denetimli doğrulamayla kısa ve net çözen amiral gemisi.',
    ['Gemini 4 Çekirdeği', 'Öz-Denetimli Zeka', '2M Uzun Bağlam', 'Çok Modlu Analiz'],
    'Google Gemini 4 Argon amiral gemisi uzmanlığıyla derin muhakeme yap; en doğru mimari veya bilimsel sonucu gereksiz giriş yapmadan kısa, öz ve berrak Türkçe ile ver.'
  ),
  'gemini-4-hydrogen': createModelSpec(
    'gemini-4-hydrogen',
    'Gemini 4 Hydrogen',
    'Google Gemini',
    'gemini-4-hydrogen',
    'GEMINI 4 · HYDROGEN',
    '#0ea5e9',
    'HIGH',
    '2M Token',
    'Yeni Nesil Kuantum Hızında Sentez, Mühendislik & Kusursuz Doğruluk Motoru',
    'Yüksek hızı derin öz-doğrulama ile birleştiren Gemini 4 Hydrogen; sıfır halüsinasyon hedefiyle kod, bilim, matematik ve strateji problemlerinde kristal netliğinde mükemmel sonuçlar üretir.',
    ['Hydrogen Çekirdeği', 'Öz-Doğrulamalı Hız', '2M Uzun Bağlam', 'Sıfır Hata Hedefi'],
    'Google Gemini 4 Hydrogen çekirdeğiyle yanıtla: Soruyu çok boyutlu doğrula, uç durumları sessizce kontrol et, gereksiz dolgu cümlelerinden tamamen arınmış yüksek doğruluklu ve berrak bir sonuç üret.'
  ),
  'gemini-4-carbon': createModelSpec(
    'gemini-4-carbon',
    'Gemini 4 Carbon',
    'Google Gemini',
    'gemini-4-carbon',
    'GEMINI 4 · CARBON MİMAR',
    '#334155',
    'HIGH',
    '2M Token',
    'Yüksek Yoğunluklu Sistem Mimarisi, Güvenlik & Yapısal Kod Motoru',
    'Kurumsal sistem tasarımı, veri bütünlüğü, yüksek performanslı algoritmalar ve deterministik mühendislik analizi için optimize edilmiş Gemini 4 Carbon çekirdeği.',
    ['Carbon Çekirdeği', 'Mimari Kesinlik', '2M Repo Bağlamı', 'Sıfır Hata Kodu'],
    'Google Gemini 4 Carbon mühendislik disipliniyle yanıtla: Gereksiz süsleme olmadan yapısal açıdan sağlam, uç durumları kapsayan ve doğrudan uygulanabilir çözümler üret.'
  ),
  'gemini-4-neon': createModelSpec(
    'gemini-4-neon',
    'Gemini 4 Neon',
    'Google Gemini',
    'gemini-4-neon',
    'GEMINI 4 · NEON ULTRA HIZ',
    '#10b981',
    'HIGH',
    '1M Token',
    'İleri STEM Muhakemesi, Kod Sentezi & Gerçek Zamanlı Üretim Motoru',
    'Yüksek karmaşıklıktaki kodlama, matematiksel doğrulama ve çoklu arayüz otomasyonunu düşük gecikmeyle çözen Gemini 4 Neon çekirdeği.',
    ['Neon Çekirdeği', 'İleri STEM & Kod', '1M Bağlam', 'Düşük Gecikme'],
    'Google Gemini 4 Neon disipliniyle yanıtla: Sorunun kök nedenine hızla in, sayısal ve mantıksal adımları sessizce doğrulayıp okunabilir, keskin ve hatasız çıktı sun.'
  ),
  'gemini-4-ultra': createModelSpec(
    'gemini-4-ultra',
    'Gemini 4 Ultra',
    'Google Gemini',
    'gemini-4-argon',
    'GEMINI 4 · ULTRA BİLİM',
    '#4338ca',
    'HIGH',
    '2M Token',
    'En Üst Düzey Bilimsel Sentez, Teorem & Stratejik Muhakeme',
    'Çok disiplinli araştırma, kuantum/fizik modellemesi ve üst düzey kurumsal karar analizi için Ultra çekirdek.',
    ['Ultra Muhakeme', 'Çok Disiplinli Bilim', 'Sıfır Halüsinasyon Odağı'],
    'Google Gemini 4 Ultra bilimsel kesinliğiyle tüm değişkenleri tartıp damıtılmış, yüksek doğruluklu ve özlü yanıt üret.'
  ),
  'gemini-4-pro-code': createModelSpec(
    'gemini-4-pro-code',
    'Google Gemini 4 Coding Pro',
    'Google Gemini',
    'gemini-4-argon',
    'GEMINI 4 · KOD PRO',
    '#3730a3',
    'HIGH',
    '2M Token',
    'Uçtan Uca Yazılım Mühendisliği, Hata Avı & Sistem Mimarisi',
    'Büyük kod tabanlarında sıfır hata hedefli refactoring, güvenlik denetimi ve yüksek performanslı algoritma üretimi.',
    ['2M Repo Bağlamı', 'Sıfır Hata Kodlama', 'Performans Mimarisi'],
    'Google Gemini 4 Coding Pro disipliniyle en temiz, tip güvenli ve yüksek performanslı mühendislik çözümünü kısa ve net ver.'
  ),
  'gemini-3-8-pro': createModelSpec(
    'gemini-3-8-pro',
    'Google Gemini 3.8 Pro',
    'Google Gemini',
    'gemini-4-argon',
    'GEMINI 3.8 · PRO',
    '#2563eb',
    'HIGH',
    '2M Token',
    'Büyük Ölçekli Kod Tabanı, Veri Sentezi & Kurumsal Üretim Motoru',
    'Tam yığın yazılım geliştirme, karmaşık belge sentezi ve yüksek doğruluklu API mimarisi için dengeli Pro model.',
    ['Tam Yığın Mimari', '2M Belge Analizi', 'Yüksek Tutarlılık'],
    'Google Gemini 3.8 Pro mühendislik disipliniyle doğrudan uygulanabilir, sade ve yapısal olarak sağlam yanıtlar sun.'
  ),
  'gemini-3-8-flash': createModelSpec(
    'gemini-3-8-flash',
    'Google Gemini 3.8 Flash',
    'Google Gemini',
    'gemini-3.8-flash',
    'GEMINI 3.8 · FLASH',
    '#1d4ed8',
    'MEDIUM',
    '1M Token',
    'Yüksek Hızlı Çok Modlu Google Sentez Çekirdeği',
    'Metin, görsel, belge ve canlı web aramasını milisaniyeler içinde birleştiren yüksek verimli Google Flash modeli.',
    ['Hızlı Çok Modlu', 'Canlı Web Arama', 'Net Özetleme'],
    'Google Gemini 3.8 Flash çevikliğiyle sorunun özünü yakala ve uzatmadan doğrudan, net cümlelerle yanıtla.'
  ),
  'gemini-3-8-live-think': createModelSpec(
    'gemini-3-8-live-think',
    'Google Gemini 3.8 Extended Thinking',
    'Google Gemini',
    'gemini-3.8-flash',
    'GEMINI 3.8 · DERİN DÜŞÜNME',
    '#1e3a8a',
    'HIGH',
    '1M Token',
    'Hızlı Flash Çekirdeğinde Genişletilmiş Çok Adımlı Muhakeme',
    'Düşük gecikme ile derin mantıksal çıkarımı birleştiren genişletilmiş düşünme modlu Gemini 3.8 modeli.',
    ['Genişletilmiş Düşünme', 'Hızlı Mantık', '1M Bağlam'],
    'Soruyu kendi içinde adım adım doğrulayıp kullanıcıya yalnızca en berrak ve kısa sonucu sun.'
  ),
  'gemini-3-1-pro': createModelSpec(
    'gemini-3-1-pro',
    'Google Gemini 3.1 Pro',
    'Google Gemini',
    'gemini-4-argon',
    'GEMINI 3.1 · PRO',
    '#1e40af',
    'MEDIUM',
    '2M Token',
    'Kararlı Uzun Bağlam Analizi & Teknik Dokümantasyon Uzmanı',
    'Uzun teknik şartnameleri, sözleşmeleri ve çok dosyalı projeleri yüksek kararlılıkla çözümleyen Pro sürüm.',
    ['Kararlı Sentez', ' Uzun Bağlam', 'Teknik İnceleme'],
    'Google Gemini 3.1 Pro kararlılığıyla karmaşık konuları sadeleştirip birkaç net cümlede özetle.'
  ),
  'gemini-3-1-flash-lite': createModelSpec(
    'gemini-3-1-flash-lite',
    'Google Gemini 3.1 Flash Lite',
    'Google Gemini',
    'gemini-3.1-flash-lite',
    'FLASH LITE · ANLIK',
    '#0284c7',
    'LOW',
    '1M Token',
    'Ultra Düşük Gecikmeli Anlık Yanıt Motoru',
    'Gerçek zamanlı soru-cevap, hızlı çeviri, metin düzeltme ve anlık kod dönüşümleri için hafif Google çekirdeği.',
    ['Sıfır Bekleme', 'Hızlı Çeviri', 'Anlık Özet'],
    'Google Gemini 3.1 Flash Lite hızıyla en pratik ve doğru cevabı anında, en kısa haliyle ver.'
  ),
  'gemini-flash-latest': createModelSpec(
    'gemini-flash-latest',
    'Google Gemini Flash Latest',
    'Google Gemini',
    'gemini-flash-latest',
    'DİNAMİK GÜNCEL',
    '#3b82f6',
    'MEDIUM',
    '1M Token',
    'Sürekli Güncellenen Dinamik Google Flash Sürümü',
    'Google’ın en son yayınlanan Flash iyileştirmelerini otomatik kullanan genel üretkenlik modeli.',
    ['Otomatik Güncel', 'Genel Üretkenlik', 'Çok Dilli'],
    'En güncel Google Gemini Flash standartlarıyla dengeli, kısa ve anlaşılır yanıt üret.'
  ),
  'gemini-omni-flash': createModelSpec(
    'gemini-omni-flash',
    'Google Gemini Omni 1.1 Flash',
    'Google Gemini',
    'gemini-omni-1.2-flash',
    'OMNI 1.1 · ÇOK MODLU',
    '#0891b2',
    'MEDIUM',
    '1M Token',
    'Görsel, İşitsel, Sahne Yönetimi & 4K Çok Modlu Zeka',
    'Video senaryosu, görsel-işitsel sahne kurgusu ve çok modlu içerik analizi için Google Omni 1.1 motoru.',
    ['Sahne & Storyboard', '4K Video Kurgusu', 'Görsel-İşitsel Zeka'],
    'Görsel, işitsel ve mekansal detayları birleştirerek sahne veya medya sorularını özlü ve net biçimde yanıtla.'
  ),
  'antigravity-agent': createModelSpec(
    'antigravity-agent',
    'Google Antigravity',
    'Google Gemini',
    'antigravity-preview-09-2026',
    'GOOGLE ANTIGRAVITY',
    '#0f766e',
    'HIGH',
    '250K Bütçe',
    'Çok Adımlı Kod Doğrulama & Otonom Problem Çözücü',
    'Karmaşık mühendislik görevlerini alt adımlara bölüp kendi içinde doğrulayarak kesin sonuç üreten otonom motor.',
    ['Otonom Doğrulama', 'Algoritma Testi', 'Uçtan Uca Çözüm'],
    'Problemi kendi içinde adım adım doğrulayıp test et ve kullanıcıya yalnızca kanıtlanmış net sonucu kısa biçimde sun.'
  ),
  'deep-research-agent': createModelSpec(
    'deep-research-agent',
    'Google Deep Research',
    'Google Gemini',
    'deep-research-preview-04-2026',
    'DEEP RESEARCH',
    '#6d28d9',
    'HIGH',
    '1M Token',
    'Çoklu Kaynak Taraması & Kanıt Odaklı Araştırma Motoru',
    'Literatür sentezi, pazar analizi ve doğrulanmış olgusal özetler hazırlayan Google araştırma motoru.',
    ['Literatür Sentezi', 'Kaynak Çaprazlama', 'Pazar Analizi'],
    'Konuyu çoklu kaynak perspektifiyle inceleyip doğrulanmış en temel bulguları kısa ve sade bir özet halinde sun.'
  ),
  'deep-research-max': createModelSpec(
    'deep-research-max',
    'Google Deep Research Max',
    'Google Gemini',
    'deep-research-max-preview-04-2026',
    'RESEARCH MAX',
    '#5b21b6',
    'HIGH',
    '2M Token',
    'Stratejik & Akademik Maksimum Kanıt Sentezi',
    'Akademik ve stratejik konuları derinlemesine tarayıp en kritik sonuçları özlü biçimde sunan üst araştırma motoru.',
    ['Akademik Doğruluk', 'Stratejik Sentez', '2M Bellek'],
    'Derin akademik ve stratejik analiz yap, ancak çıktıyı en kritik bulgularla sınırlayıp kısa ve berrak tut.'
  ),
  'gemini-transcribe': createModelSpec(
    'gemini-transcribe',
    'Google Gemini 3.5 Transcribe',
    'Google Gemini',
    'gemini-3.5-transcribe',
    'SES & DİYALOG 3.5',
    '#db2777',
    'LOW',
    '1M Token',
    'Ses Çözümleme, Toplantı Özeti & Diyalog Analiz Motoru',
    'Konuşma kayıtlarını ve diyalog metinlerini net karar maddelerine ve özetlere dönüştüren uzman model.',
    ['Ses Deşifresi', 'Toplantı Özeti', 'Eylem Planı'],
    'Konuşma ve metin içeriklerini net kararlar ve kısa eylem adımları halinde sade biçimde özetle.'
  ),
  'gemma-open-27b': createModelSpec(
    'gemma-open-27b',
    'Google Gemma 3 27B',
    'Google Gemini',
    'gemini-3.8-flash',
    'GEMMA 3 · 27B AÇIK',
    '#16a34a',
    'MEDIUM',
    '128K Token',
    'Açık Ağırlık & Bağımsız Taşınabilir Mühendislik Motoru',
    'Açık standartlar, kendi kendine barındırılabilir mimariler ve Linux/Docker otomasyonu için Gemma 3 27B modeli.',
    ['Açık Ağırlık', 'Sıfır Bağımlılık', 'Linux & Docker'],
    'Açık standartları ve yalın, taşınabilir mühendislik çözümlerini kısa ve doğrudan biçimde öner.'
  ),
  'gemma-3-12b': createModelSpec(
    'gemma-3-12b',
    'Google Gemma 3 12B',
    'Google Gemini',
    'gemini-3.1-flash-lite',
    'GEMMA 3 · 12B HAFİF',
    '#15803d',
    'LOW',
    '128K Token',
    'Kompakt Açık Kaynak Hızlandırıcı & Uç Cihaz Zekası',
    'Düşük kaynak tüketimiyle hızlı metin işleme, sınıflandırma ve pratik betik üretimi için çevik Gemma 3 modeli.',
    ['Kompakt Hız', 'Uç Cihaz Uyumu', 'Hızlı Betik'],
    'Yalın, hafif ve anında uygulanabilir kısa yanıtlar üret.'
  ),

  // ==================== 2. OPENAI & CHATGPT (17) ====================
  'chatgpt-5-2-pro': createModelSpec(
    'chatgpt-5-2-pro',
    'OpenAI ChatGPT-5.2 Pro',
    'OpenAI & ChatGPT',
    'gemini-4-argon',
    'CHATGPT-5.2 · PRO ZİRVE',
    '#059669',
    'HIGH',
    '2M Token',
    'Çok Adımlı Derin Sentez, Kurumsal Mimari & Kodlama Amiral Gemisi',
    'OpenAI ekosisteminin en üst düzey 2M bağlamlı sistem tasarımı, matematik ve üretim seviyesi kodlama motoru.',
    ['2M Bağlam', 'Derin Mühendislik', 'Sıfır Hata Sentez'],
    'En karmaşık soruları berrak, net ve doğrudan uygulanabilir birkaç cümlede çöz.'
  ),
  'gpt-image-2-ultra': createModelSpec(
    'gpt-image-2-ultra',
    'OpenAI GPT-Image 2 Ultra (4K)',
    'OpenAI & ChatGPT',
    'gemini-3.8-flash',
    'GPT-IMAGE 2 · 4K FOTOĞRAF',
    '#10a37f',
    'HIGH',
    '512K Token',
    'Doğrudan Fotogerçekçi Görsel Sentezi, Kusursuz Kompozisyon & Sahne Üretimi',
    'Yazdığınız her sahneyi doğrudan yüksek çözünürlüklü gerçek fotoğrafa dönüştüren yeni nesil GPT-Image 2 Ultra motoru.',
    ['Doğrudan Görsel Üretim', 'Yüksek İstem Sadakati', 'Stüdyo Işığı'],
    'Kullanıcının istediği görseli doğrudan üret ve 1-2 kısa cümleyle sun.'
  ),
  'chatgpt-5-omni': createModelSpec(
    'chatgpt-5-omni',
    'ChatGPT-5o Omni',
    'OpenAI & ChatGPT',
    'gemini-4-argon',
    'CHATGPT-5O · OMNI',
    '#10a37f',
    'HIGH',
    '512K Token',
    'Evrensel Doğal Diyalog, Ürün Stratejisi & Kod Sentez Amiral Gemisi',
    'Akıcı insan doğallığında iletişim, ürün tasarımı, veri analizi ve yazılım geliştirmeyi birleştiren amiral gemisi.',
    ['Evrensel Omni Sentez', 'Akıcı Diyalog', 'Ürün & Kod'],
    'Doğal, akıcı ve pratik bir dille doğrudan konunun özüne in; birkaç kısa ve net cümlede en faydalı cevabı ver.'
  ),
  'gpt-5-pro': createModelSpec(
    'gpt-5-pro',
    'OpenAI GPT-5 Pro',
    'OpenAI & ChatGPT',
    'gemini-4-argon',
    'GPT-5 · PRO',
    '#0d9488',
    'HIGH',
    '1M Token',
    'Kurumsal Sistem Mimarisi, İleri Analitik & Yüksek Kesinlik',
    'Büyük ölçekli mühendislik kararları, finansal modelleme ve çok katmanlı problem çözümü için GPT-5 Pro çekirdeği.',
    ['Kurumsal Kesinlik', 'İleri Analitik', '1M Bağlam'],
    'Üst düzey teknik ve stratejik kesinlikle, dolgu cümleleri kullanmadan net ve kısa çözüm üret.'
  ),
  'chatgpt-5-mini': createModelSpec(
    'chatgpt-5-mini',
    'OpenAI ChatGPT-5 Mini',
    'OpenAI & ChatGPT',
    'gemini-3.8-flash',
    'CHATGPT-5 · MINI HIZ',
    '#14b8a6',
    'MEDIUM',
    '512K Token',
    'Yeni Nesil Çevik Muhakeme, Kod & Günlük Süper Asistan',
    'GPT-5 ailesinin hız ve zeka dengesini en üst düzeye çıkaran yeni nesil çevik modeli.',
    ['Çevik GPT-5 Zekası', 'Hızlı Kodlama', 'Net Özet'],
    'Yüksek zeka ve hızla doğrudan konuya girip 2-4 net cümlede en pratik yanıtı sun.'
  ),
  'gpt-4-5-orion': createModelSpec(
    'gpt-4-5-orion',
    'OpenAI GPT-4.5 Orion',
    'OpenAI & ChatGPT',
    'gemini-4-argon',
    'GPT-4.5 · ORION',
    '#059669',
    'HIGH',
    '256K Token',
    'Yüksek Duygusal Zeka, Yaratıcı Yazarlık & İkna İletişimi',
    'İnce üslup nüansları, yaratıcı metin yazarlığı, marka dili ve doğal diyalog kalitesinde uzmanlaşmış Orion modeli.',
    ['Doğal Üslup', 'Yaratıcı Metin', 'Yüksek Empati'],
    'İnce nüanslı, sıcak ama abartısız ve kısa cümlelerle yüksek kaliteli yanıt üret.'
  ),
  'gpt-4-1': createModelSpec(
    'gpt-4-1',
    'OpenAI GPT-4.1',
    'OpenAI & ChatGPT',
    'gemini-4-argon',
    'GPT-4.1 · 1M KOD',
    '#047857',
    'MEDIUM',
    '1M Token',
    '1M Bağlamlı Hassas Talimat Takibi & Tam Yığın Kodlama Motoru',
    'Karmaşık talimatlara harfiyen uyum, frontend/backend geliştirme ve temiz kod incelemesi için optimize edilmiş GPT-4.1.',
    ['Hassas Talimat Uyumu', '1M Kod Bağlamı', 'Temiz Refactor'],
    'Kullanıcının talimatlarına tam sadık kalarak kısa, temiz ve hatasız teknik yanıtlar ver.'
  ),
  'gpt-4-1-mini': createModelSpec(
    'gpt-4-1-mini',
    'OpenAI GPT-4.1 Mini',
    'OpenAI & ChatGPT',
    'gemini-3.8-flash',
    'GPT-4.1 · MINI',
    '#14b8a6',
    'LOW',
    '1M Token',
    'Hızlı Kodlama, API Tasarımı & Günlük Üretkenlik Motoru',
    'Düşük gecikmeyle yüksek zeka sunan, hızlı yazılım ve günlük görevler için dengeli GPT-4.1 Mini modeli.',
    ['Hızlı Kod', '1M Bağlam', 'Düşük Gecikme'],
    'Hızlı, pratik ve doğrudan uygulanabilir kısa cevaplar ver.'
  ),
  'gpt-4-1-nano': createModelSpec(
    'gpt-4-1-nano',
    'OpenAI GPT-4.1 Nano',
    'OpenAI & ChatGPT',
    'gemini-3.1-flash-lite',
    'GPT-4.1 · NANO',
    '#2dd4bf',
    'LOW',
    '512K Token',
    'Milisaniyelik Anlık Yanıt, Sınıflandırma & Hızlı Çeviri',
    'En düşük gecikme gerektiren anlık soru-cevap, özetleme ve dil çevirisi görevleri için ultra hafif Nano motor.',
    ['Anlık Hız', 'Kısa Özet', 'Hızlı Çeviri'],
    'Tek bir kelime bile israf etmeden en kısa ve en net cevabı anında ver.'
  ),
  'gpt-4o': createModelSpec(
    'gpt-4o',
    'ChatGPT-4o',
    'OpenAI & ChatGPT',
    'gemini-3.8-flash',
    'GPT-4O · ÇOK MODLU',
    '#10b981',
    'MEDIUM',
    '128K Token',
    'Klasik Çok Modlu Hız, Görsel Okuma & Doğal Sohbet Dengesi',
    'Günlük problem çözme, görsel-belge yorumlama ve hızlı beyin fırtınası için popüler çok modlu model.',
    ['Çok Modlu Analiz', 'Dengeli Hız', 'Beyin Fırtınası'],
    'Samimi, anlaşılır ve kısa cümlelerle doğrudan soruyu yanıtla.'
  ),
  'gpt-4o-mini': createModelSpec(
    'gpt-4o-mini',
    'ChatGPT-4o Mini',
    'OpenAI & ChatGPT',
    'gemini-3.1-flash-lite',
    'GPT-4O · MINI',
    '#34d399',
    'LOW',
    '128K Token',
    'Hafif ve Çevik Günlük Yardımcı Motoru',
    'Hızlı e-posta taslağı, ders özeti ve pratik günlük sorular için çevik yardımcı model.',
    ['Pratik Yardımcı', 'Hızlı Yanıt', 'Sade Anlatım'],
    'Günlük soruları herkesin kolayca anlayacağı sade ve kısa bir dille yanıtla.'
  ),
  'openai-o4-pro': createModelSpec(
    'openai-o4-pro',
    'OpenAI o4-Pro Reasoning',
    'OpenAI & ChatGPT',
    'gemini-4-argon',
    'OPENAI o4-PRO · ZİRVE',
    '#047857',
    'HIGH',
    '512K Token',
    'En Yeni Nesil Derin Bilimsel, Algoritmik & Stratejik Muhakeme',
    'Çok adımlı araç kullanımı, matematiksel kanıt ve karmaşık mühendislik doğrulamasında o-serisinin en üst modeli.',
    ['o4-Pro Derin Kanıt', 'Çok Adımlı Doğrulama', 'STEM Zirvesi'],
    'En karmaşık soruları kendi içinde tam doğrulukla çözüp kullanıcıya damıtılmış, kısa ve kesin sonucu ver.'
  ),
  'chatgpt-o3-pro': createModelSpec(
    'chatgpt-o3-pro',
    'OpenAI o3-Pro Reasoning',
    'OpenAI & ChatGPT',
    'gemini-4-argon',
    'OPENAI o3-PRO · MAX CoT',
    '#059669',
    'HIGH',
    '512K Token',
    'Biçimsel Doğrulama, Karşıt Hipotez Testi & Doktora Düzeyi Muhakeme',
    'Ağaç araması ve öz-doğrulama ile en çetin algoritma, matematik ve stratejik karar problemlerini çözen muhakeme motoru.',
    ['Ağaç Araması & Kanıt', 'Sıfır Hata Mimarisi', 'Doktora STEM'],
    'Tüm hipotezleri ve karşıt örnekleri içsel olarak sına; kullanıcıya yalnızca doğrulanmış en kesin çözümü kısa ve öz olarak sun.'
  ),
  'openai-o3': createModelSpec(
    'openai-o3',
    'OpenAI o3',
    'OpenAI & ChatGPT',
    'gemini-4-argon',
    'OPENAI o3 · MUHAKEME',
    '#0f766e',
    'HIGH',
    '200K Token',
    'Derin Zincirleme Düşünme, Bilim & Mühendislik Çözücü',
    'Çok adımlı mantık bulmacaları, bilimsel hesaplamalar ve karmaşık hata ayıklama için o3 akıl yürütme modeli.',
    ['Zincirleme Mantık', 'Hata Ayıklama', 'Matematiksel Kanıt'],
    'Çok adımlı mantıksal doğrulama yapıp sonucu net, sade ve kısa biçimde aktar.'
  ),
  'openai-o4-mini': createModelSpec(
    'openai-o4-mini',
    'OpenAI o4-mini',
    'OpenAI & ChatGPT',
    'gemini-3.8-flash',
    'OPENAI o4-MINI · HIZLI STEM',
    '#0284c7',
    'MEDIUM',
    '200K Token',
    'Yüksek Hızlı Matematik, Algoritma & Veri Analizi Muhakemesi',
    'Düşük bekleme süresiyle güçlü kodlama ve matematiksel akıl yürütme sunan yeni nesil o4-mini motoru.',
    ['Hızlı Muhakeme', 'Algoritmik Kod', 'Veri Analizi'],
    'Matematik ve kod sorularını hızlıca doğrulayıp özlü ve net biçimde yanıtla.'
  ),
  'openai-o1-pro': createModelSpec(
    'openai-o1-pro',
    'OpenAI o1-Pro',
    'OpenAI & ChatGPT',
    'gemini-4-argon',
    'OPENAI o1-PRO',
    '#065f46',
    'HIGH',
    '200K Token',
    'Ağır Siklet Teorik Analiz, Hukuki & Sistem Tutarlılığı',
    'Yüksek güvenilirlik gerektiren metodolojik incelemeler ve tutarlılık denetimleri için o1-Pro çekirdeği.',
    ['Tutarlılık Denetimi', 'Derin Metodoloji', 'Yüksek Güvenilirlik'],
    'Çelişkileri eleyip tutarlı ve kanıta dayalı sonucu birkaç sade cümleyle sun.'
  ),
  'openai-codex-agent': createModelSpec(
    'openai-codex-agent',
    'OpenAI Codex Software Agent',
    'OpenAI & ChatGPT',
    'gemini-4-argon',
    'CODEX · OTONOM KOD',
    '#0d9488',
    'HIGH',
    '512K Token',
    'Otonom Yazılım Mühendisliği, Test Üretimi & PR İnceleme Motoru',
    'Kod tabanı analizi, hata düzeltme, birim testi yazımı ve temiz API tasarımı için uzmanlaşmış Codex motoru.',
    ['Otonom Hata Düzeltme', 'Birim Testi', 'Temiz Mimari'],
    'Kıdemli yazılım mühendisi titizliğiyle doğrudan çalışan, sade ve özlü teknik çözüm sun.'
  ),
  'gpt-astra': createModelSpec(
    'gpt-astra',
    'GPT-Astra',
    'OpenAI & ChatGPT',
    'gemini-4-argon',
    'GPT-ASTRA · KURUMSAL',
    '#0ea5e9',
    'HIGH',
    '1M Token',
    'Yüksek Kesinlikli Kurumsal Sentez, Çoklu Belge & Analitik Akış Motoru',
    'Uzun raporlar, finansal analizler ve çok adımlı iş akışlarını yüksek tutarlılıkla çözen Astra çekirdeği.',
    ['Astra Sentezi', 'Veri & Tablo Analizi', 'Canvas Desteği'],
    'Kurumsal analitik kesinlikle konunun özüne in; yapısal, net ve yüksek güvenilirlikli Türkçe çözümler üret.'
  ),

  // ==================== 3. ANTHROPIC CLAUDE (13) ====================
  'claude-5-2-fable': createModelSpec(
    'claude-5-2-fable',
    'Claude Fable 5.2',
    'Anthropic Claude',
    'gemini-4-argon',
    'CLAUDE 5.2 · FABLE',
    '#ea580c',
    'HIGH',
    '2M Token',
    'Üst Düzey Yaratıcı Mantık, Derin Strateji & Özgün İfade Motoru',
    'Yaratıcı problem çözme, edebi derinlik, karmaşık sistem anlatımı ve dinamik senaryo kurgusunda öncü Claude Fable 5.2 amiral gemisi.',
    ['Fable 5.2 Muhakemesi', '2M Bağlam', 'Stratejik Anlatım'],
    'Claude Fable 5.2 inceliğiyle konunun özüne odaklan; yaratıcı, keskin ve yüksek kavrayışlı Türkçe çözümler sun.'
  ),
  'claude-5-5-opus': createModelSpec(
    'claude-5-5-opus',
    'Claude Opus 5.5',
    'Anthropic Claude',
    'gemini-4-argon',
    'CLAUDE 5.5 · OPUS AMİRAL',
    '#9a3412',
    'HIGH',
    '2M Token',
    'En Üstün Sistem Mimarisi, Derin Muhakeme & Sıfır Hata Mühendisliği',
    'Anthropic ekosisteminin en güçlü modeli; dev kod tabanları, kurumsal mimari ve bilimsel akıl yürütmede zirve.',
    ['Opus 5.5 Çekirdeği', '2M Bağlam', 'Otonom Mühendislik'],
    'Claude Opus 5.5 amiral gemisi disipliniyle en karmaşık problemleri berrak, net ve doğrudan çöz.'
  ),
  'claude-5-5-sonnet': createModelSpec(
    'claude-5-5-sonnet',
    'Claude Sonnet 5.5',
    'Anthropic Claude',
    'gemini-4-argon',
    'CLAUDE 5.5 · SONNET',
    '#c2410c',
    'HIGH',
    '1M Token',
    'Hızlı Yazılım Geliştirme, Rafine UI/UX & Kusursuz Kod Mimarisi',
    'Uçtan uca kod yazımı, temiz refactoring ve doğal insan etkileşiminde sektör standardı Claude Sonnet 5.5.',
    ['Sonnet 5.5 Gücü', '1M Bağlam', 'Temiz Kod & UI'],
    'Berrak, doğal ve mühendislik açısından kusursuz bir üslupla doğrudan sorunun özünü yanıtla.'
  ),
  'claude-5-5-haiku': createModelSpec(
    'claude-5-5-haiku',
    'Claude Haiku 5.5',
    'Anthropic Claude',
    'gemini-4-neon',
    'CLAUDE 5.5 · HAIKU HIZ',
    '#f97316',
    'MEDIUM',
    '500K Token',
    'Milisaniyelik Çıkarım Hızı, Çevik Kodlama & Keskin Özet',
    'Yüksek hızı güçlü zekayla birleştiren, anlık yanıt ve hızlı kod üretimi için optimize edilmiş Haiku 5.5.',
    ['Haiku 5.5 Hızı', '500K Bağlam', 'Milisaniyelik Yanıt'],
    'Haiku 5.5 çevikliğiyle tek bir kelimeyi israf etmeden anında, berrak ve net cevap ver.'
  ),
  'claude-4-6-opus': createModelSpec(
    'claude-4-6-opus',
    'Claude 4.6 Opus Ultra',
    'Anthropic Claude',
    'gemini-4-argon',
    'CLAUDE 4.6 · OPUS ULTRA',
    '#9a3412',
    'HIGH',
    '2M Token',
    'Otonom Yazılım Mimarisi, Derin Muhakeme & Kusursuz Doğal Türkçe',
    'Büyük kod tabanlarını tek seferde kavrayan, sıfır klişeli ve yüksek kesinlikli Claude 4.6 Opus amiral gemisi.',
    ['2M Uzun Bağlam', 'Otonom Mimari', 'Rafine Üslup'],
    'En çetin mühendislik ve strateji sorularını uzatmadan, berrak ve keskin cümlelerle yanıtla.'
  ),
  'claude-4-5-sonnet': createModelSpec(
    'claude-4-5-sonnet',
    'Claude 4.5 Sonnet',
    'Anthropic Claude',
    'gemini-4-argon',
    'CLAUDE 4.5 · SONNET ZİRVE',
    '#c2410c',
    'HIGH',
    '1M Token',
    'Yeni Nesil Yazılım Mimarisi, Ajanik Kodlama & Kusursuz Türkçe',
    'Ön yüz tasarımı, karmaşık sistem kurgusu ve doğal insan üslubunda sektör lideri yeni nesil Claude 4.5 Sonnet.',
    ['Claude 4.5 Mimarisi', 'Kusursuz Kod & UI', '1M Bağlam'],
    'Berrak, doğal ve mühendislik açısından kusursuz bir dille doğrudan sorunun özünü kısa biçimde yanıtla.'
  ),
  'claude-4-opus': createModelSpec(
    'claude-4-opus',
    'Claude 4 Opus',
    'Anthropic Claude',
    'gemini-4-argon',
    'CLAUDE 4 · OPUS',
    '#b45309',
    'HIGH',
    '1M Token',
    'En Ağır Akademik, Stratejik & Kurumsal Mimari Düşünce Motoru',
    'Uzun ufuklu Ar-Ge problemleri, kurumsal sistem denetimi ve sıfır hata toleranslı mimari kararlar için Opus çekirdeği.',
    ['Opus Muhakeme', 'Kurumsal Denetim', 'Uzun Bağlam'],
    'En çetin teknik ve felsefi soruları derinlemesine tartıp en rafine, sade ve özlü cevabı ver.'
  ),
  'claude-4-sonnet': createModelSpec(
    'claude-4-sonnet',
    'Claude 4 Sonnet',
    'Anthropic Claude',
    'gemini-4-argon',
    'CLAUDE 4 · SONNET',
    '#d97757',
    'HIGH',
    '500K Token',
    'Kusursuz Yazılım Mimarisi, Temiz Kod & Derin Nüans Motoru',
    'Modüler kod tabanı tasarımı, UI/UX estetiği ve berrak analitik anlatımda öne çıkan mühendislik modeli.',
    ['Temiz Yazılım Mimarisi', 'UI/UX Hassasiyeti', 'Uç Durum Analizi'],
    'Zarif, berrak ve teknik açıdan kusursuz bir üslupla doğrudan sorunun özünü kısa biçimde yanıtla.'
  ),
  'claude-4-haiku': createModelSpec(
    'claude-4-haiku',
    'Claude 4 Haiku',
    'Anthropic Claude',
    'gemini-3.1-flash-lite',
    'CLAUDE 4 · HAIKU HIZ',
    '#ea580c',
    'LOW',
    '256K Token',
    'Anlık Zeka, Hızlı Kod İnceleme & Ultra Özlü Asistan',
    'Sonnet seviyesine yakın zekayı milisaniyelik tepki süresiyle sunan yeni nesil Claude 4 Haiku modeli.',
    ['Milisaniyelik Yanıt', 'Keskin Özet', 'Hızlı Kod'],
    'Tek bir gereksiz kelime kullanmadan anında, berrak ve kısa cevap ver.'
  ),
  'claude-3-7-sonnet': createModelSpec(
    'claude-3-7-sonnet',
    'Claude 3.7 Sonnet (Extended)',
    'Anthropic Claude',
    'gemini-4-argon',
    'CLAUDE 3.7 · EXTENDED',
    '#c2410c',
    'HIGH',
    '200K Token',
    'Hibrit Genişletilmiş Düşünme & Uçtan Uca Uygulama Mühendisliği',
    'Adım adım içsel düşünme ile karmaşık frontend/backend refactoring ve hata analizinde uzmanlaşmış hibrit model.',
    ['Hibrit Düşünme', 'Uçtan Uca Refactor', 'Hata Kök Analizi'],
    'Kök nedeni hızla tespit edip temiz, kısa ve doğrudan uygulanabilir çözümü paylaş.'
  ),
  'claude-3-5-sonnet': createModelSpec(
    'claude-3-5-sonnet',
    'Claude 3.5 Sonnet v2',
    'Anthropic Claude',
    'gemini-3.8-flash',
    'CLAUDE 3.5 · SONNET V2',
    '#ea580c',
    'MEDIUM',
    '200K Token',
    'Endüstri Standardı Çevik Kodlama & Doğal Editöryal Dil',
    'Pratik yazılım geliştirme, dokümantasyon sadeleştirme ve tasarım incelemesi için sevilen Sonnet v2 modeli.',
    ['Çevik Kodlama', 'Doğal Türkçe', 'Tasarım İncelemesi'],
    'Abartısız, doğal ve insan odaklı bir anlatımla kısa ve net yanıt ver.'
  ),
  'claude-3-5-haiku': createModelSpec(
    'claude-3-5-haiku',
    'Claude 3.5 Haiku',
    'Anthropic Claude',
    'gemini-3.1-flash-lite',
    'CLAUDE 3.5 · HAIKU',
    '#f97316',
    'LOW',
    '200K Token',
    'Şimşek Hızında Özlü Yanıt, Kod Tamamlama & Metin Düzenleme',
    'Anlık geri bildirim, kısa özetler ve hızlı kod düzeltmeleri için optimize edilmiş ultra hızlı Haiku modeli.',
    ['Anlık Yanıt', 'Özlü Editör', 'Hızlı Kod Düzeltme'],
    'Haiku sadeliğiyle en doğru bilgiyi en az kelimeyle, berrak ve doğrudan sun.'
  ),
  'claude-3-opus': createModelSpec(
    'claude-3-opus',
    'Claude 3 Opus',
    'Anthropic Claude',
    'gemini-4-argon',
    'CLAUDE 3 · OPUS KLASİK',
    '#9a3412',
    'HIGH',
    '200K Token',
    'Derin Edebi Sentez, Felsefi Analiz & Stratejik Araştırma',
    'Kavramsal derinlik, akademik eleştiri ve çok boyutlu strateji kurgusu için klasik Opus modeli.',
    ['Kavramsal Derinlik', 'Akademik Sentez', 'Stratejik Bakış'],
    'Derin kavramsal içgörüleri karmaşıklaştırmadan yalın ve özlü birkaç cümleyle ifade et.'
  ),

  // ==================== 4. DEEPSEEK (9) ====================
  'deepseek-v3-2-exp': createModelSpec(
    'deepseek-v3-2-exp',
    'DeepSeek V3.2-Exp Sparse',
    'DeepSeek',
    'gemini-3.1-flash-lite',
    'DEEPSEEK V3.2 · SPARSE',
    '#1d4ed8',
    'HIGH',
    '512K Token',
    'Seyrek Dikkat (Sparse Attention) Mimarisi ile Şimşek Hızında Kod & STEM',
    'Uzun bağlamda ultra düşük gecikme ve yüksek algoritmik doğruluk sunan DeepSeek V3.2-Exp amiral gemisi.',
    ['Sparse Attention', 'Şimşek Çıkarım', 'Algoritmik Kesinlik'],
    'En optimize teknik ve sayısal yanıtı saniyeler içinde kısa ve net biçimde ver.'
  ),
  'deepseek-r2': createModelSpec(
    'deepseek-r2',
    'DeepSeek R2 Reasoning',
    'DeepSeek',
    'gemini-4-argon',
    'DEEPSEEK R2 · CoT',
    '#2563eb',
    'HIGH',
    '256K Token',
    'Yeni Nesil Pekiştirmeli Akıl Yürütme, Algoritma & Matematik',
    'Olimpiyat seviyesi matematik, algoritmik optimizasyon ve düşük seviyeli sistem programlama için R2 muhakeme motoru.',
    ['Zincirleme Kanıt', 'Algoritma Optimizasyonu', 'Olimpiyat STEM'],
    'Zaman ve bellek karmaşıklığını gözeterek en optimize ve matematiksel olarak kesin çözümü kısa ve net biçimde sun.'
  ),
  'deepseek-v3-1': createModelSpec(
    'deepseek-v3-1',
    'DeepSeek V3.1 Terminus',
    'DeepSeek',
    'gemini-3.8-flash',
    'DEEPSEEK V3.1 · HİBRİT',
    '#1d4ed8',
    'HIGH',
    '256K Token',
    'Hibrit Düşünme & Ultra Hızlı 685B MoE Mühendislik Motoru',
    'Hem anlık yanıt hem derin muhakeme modunu tek çekirdekte birleştiren yeni nesil DeepSeek V3.1 modeli.',
    ['685B Hibrit MoE', 'Ajanik Kodlama', 'Yüksek Kesinlik'],
    'Yüksek mühendislik kesinliğiyle doğrudan uygulanabilir, sade ve kısa çözümler üret.'
  ),
  'deepseek-r1': createModelSpec(
    'deepseek-r1',
    'DeepSeek R1',
    'DeepSeek',
    'gemini-4-argon',
    'DEEPSEEK R1 · AÇIK CoT',
    '#1d4ed8',
    'HIGH',
    '128K Token',
    'Şeffaf Zincirleme Muhakeme & Mantıksal Çıkarım Devrimi',
    'Kendi kendini doğrulayan pekiştirmeli öğrenme mimarisiyle matematik, mantık ve kod problemlerini çözen R1 modeli.',
    ['Öz-Doğrulama', 'Mantıksal Çıkarım', 'Açık Ağırlık R1'],
    'Mantıksal adımları kendi içinde doğrulayıp çelişkisiz nihai cevabı sade ve kısa biçimde ver.'
  ),
  'deepseek-r1-zero': createModelSpec(
    'deepseek-r1-zero',
    'DeepSeek R1-Zero',
    'DeepSeek',
    'gemini-4-argon',
    'R1-ZERO · SAF RL',
    '#1e40af',
    'HIGH',
    '128K Token',
    'Saf Pekiştirmeli Öğrenme ile Keşfedici Problem Çözümü',
    'Standart kalıpların dışına çıkarak zorlu matematik ve algoritma problemlerine özgün kısayollar bulan saf RL modeli.',
    ['Saf RL Keşfi', 'Özgün Algoritma', 'Kısayol Analizi'],
    'Problemin en kısa ve en zekice çözüm yolunu bulup doğrudan ve özlü biçimde açıkla.'
  ),
  'deepseek-v3-turbo': createModelSpec(
    'deepseek-v3-turbo',
    'DeepSeek V3.2 Turbo',
    'DeepSeek',
    'gemini-3.1-flash-lite',
    'DEEPSEEK V3.2 · TURBO',
    '#3b82f6',
    'LOW',
    '256K Token',
    '671B MoE Ultra Hızlı Kodlama, API Üretimi & Çevik Sentez',
    'Düşük gecikmeli 671B MoE mimarisiyle anlık kod üretimi, SQL/REST şema tasarımı ve hızlı teknik yanıtlar.',
    ['671B MoE Hızı', 'Anlık Kod', 'Düşük Gecikme'],
    'Gereksiz açıklamaları atlayıp son derece hızlı, temiz ve doğrudan uygulanabilir yanıt ver.'
  ),
  'deepseek-coder-v3': createModelSpec(
    'deepseek-coder-v3',
    'DeepSeek Coder V3',
    'DeepSeek',
    'gemini-4-argon',
    'CODER V3 · 338 DİL',
    '#0284c7',
    'HIGH',
    '256K Token',
    '338 Programlama Dilinde Uzman Yazılım & Sistem Mühendisi',
    'TypeScript, Rust, Go, Python, C++ ve SQL dahil tüm modern dillerde üretim kalitesinde kod ve hata ayıklama motoru.',
    ['Çoklu Dil Uzmanı', 'Performanslı Kod', 'Güvenlik Denetimi'],
    'Yazılım sorularında en temiz, güvenli ve yüksek performanslı yaklaşımı kısa ve net biçimde sun.'
  ),
  'deepseek-math-v2': createModelSpec(
    'deepseek-math-v2',
    'DeepSeek Math V2',
    'DeepSeek',
    'gemini-4-argon',
    'MATH V2 · OLİMPİYAT',
    '#4338ca',
    'HIGH',
    '128K Token',
    'Sayısal Hesaplama, Cebir, Kalkülüs & İstatistik Uzmanı',
    'Denklem çözümü, olasılık, finansal matematik ve sayısal doğrulama için özel eğitilmiş matematik motoru.',
    ['Kesin Hesaplama', 'Kalkülüs & Cebir', 'Adım Doğrulama'],
    'Sayısal işlemleri hatasız hesaplayıp sonucu sade ve kısa biçimde paylaş.'
  ),
  'deepseek-prover-v2': createModelSpec(
    'deepseek-prover-v2',
    'DeepSeek Prover V2',
    'DeepSeek',
    'gemini-4-argon',
    'PROVER V2 · TEOREM',
    '#4f46e5',
    'HIGH',
    '128K Token',
    'Biçimsel Matematiksel Teorem Kanıtlama & Mantık Doğrulama',
    'Ayrık matematik, soyut cebir, olasılık ve biçimsel mantık doğrulaması için uzmanlaşmış teorem motoru.',
    ['Teorem Kanıtı', 'Biçimsel Mantık', 'Sayısal Sağlama'],
    'Matematiksel ve mantıksal soruları tam kesinlikle doğrulayıp özlü ve anlaşılır biçimde yanıtla.'
  ),

  // ==================== 5. xAI GROK & META LLAMA (10) ====================
  'grok-4-heavy': createModelSpec(
    'grok-4-heavy',
    'xAI Grok 4 Heavy',
    'Grok & Meta Llama',
    'gemini-4-argon',
    'GROK 4 · HEAVY MULTI-AGENT',
    '#0f172a',
    'HIGH',
    '2M Token',
    'Çoklu Ajan Paralel Muhakeme, Fizik & İlk Prensipler Zirvesi',
    'Birden fazla paralel düşünce hattını çarpıştırarak en zorlu mühendislik ve strateji sorularını çözen Grok 4 amiral gemisi.',
    ['Çoklu Ajan Muhakeme', '2M Bağlam', 'İlk Prensipler'],
    'Çoklu perspektifleri çarpıştırıp en keskin, gerçekçi ve dolgusuz sonucu birkaç net cümlede ver.'
  ),
  'grok-3-ultra': createModelSpec(
    'grok-3-ultra',
    'xAI Grok 3',
    'Grok & Meta Llama',
    'gemini-4-argon',
    'GROK 3 · İLK PRENSİP',
    '#334155',
    'HIGH',
    '1M Token',
    'İlk Prensipler Mühendisliği, Keskin Analiz & Sıfır Dolgu',
    'Kalıplaşmış klişelerden uzak, fizik ve mühendislik ilk prensipleriyle doğrudan gerçeğe odaklanan amiral gemisi.',
    ['İlk Prensipler', 'Sıfır Dolgu', '1M Bağlam'],
    'Kurumsal klişelerden uzak dur; ilk prensiplerle doğrudan gerçeği keskin, net ve kısa cümlelerle söyle.'
  ),
  'grok-3-thinking': createModelSpec(
    'grok-3-thinking',
    'xAI Grok 3 Thinking',
    'Grok & Meta Llama',
    'gemini-4-argon',
    'GROK 3 · THINKING',
    '#1e293b',
    'HIGH',
    '1M Token',
    'Derin Fizik, Mühendislik Simülasyonu & Stratejik Muhakeme',
    'Çok değişkenli mühendislik hesaplamaları ve oyun teorisi analizleri için derin düşünen Grok 3 çekirdeği.',
    ['Derin Muhakeme', 'Oyun Teorisi', 'Mühendislik Analizi'],
    'Varsayımları sorgulayıp en sağlam teknik sonucu uzatmadan doğrudan ortaya koy.'
  ),
  'grok-3-mini': createModelSpec(
    'grok-3-mini',
    'xAI Grok 3 Mini',
    'Grok & Meta Llama',
    'gemini-3.1-flash-lite',
    'GROK 3 · MINI HIZ',
    '#475569',
    'LOW',
    '256K Token',
    'Hızlı Mantık, Keskin Özet & Anlık Teknik Yanıt Motoru',
    'Saniyenin altında net ve dolambaçsız cevaplar üreten çevik Grok 3 Mini modeli.',
    ['Anlık Keskinlik', 'Hızlı Mantık', 'Özlü Cevap'],
    'Lafı hiç dolandırmadan 2-3 net cümlede soruyu çöz.'
  ),
  'grok-2-vision': createModelSpec(
    'grok-2-vision',
    'xAI Grok 2 Vision',
    'Grok & Meta Llama',
    'gemini-3.8-flash',
    'GROK 2 · VISION',
    '#64748b',
    'MEDIUM',
    '128K Token',
    'Görsel Diyagram Okuma, Arayüz Analizi & Gerçekçi Yorumlama',
    'Ekran görüntülerini, grafikleri ve mimari şemaları hızlıca çözümleyen çok modlu Grok modeli.',
    ['Görsel Çözümleme', 'Grafik Okuma', 'UI İnceleme'],
    'Görsel ve yapısal detayları net, somut ve kısa biçimde açıkla.'
  ),
  'llama-4-behemoth': createModelSpec(
    'llama-4-behemoth',
    'Meta Llama 4 Behemoth (2T)',
    'Grok & Meta Llama',
    'gemini-4-argon',
    'LLAMA 4 · 2T BEHEMOTH',
    '#1d4ed8',
    'HIGH',
    '2M Token',
    '2 Trilyon Parametreli Dev Açık Ekosistem Amiral Gemisi',
    'Açık ekosistemin en büyük 2T MoE mimarisi; ileri STEM, çok dilli sentez ve büyük sistem tasarımı uzmanı.',
    ['2T MoE Mimarisi', 'İleri STEM', 'Açık Ekosistem Lideri'],
    'Yüksek kapasiteli mühendislik ve bilim bilgisini sade, kısa ve doğrudan uygulanabilir biçimde aktar.'
  ),
  'llama-4-reasoning': createModelSpec(
    'llama-4-reasoning',
    'Meta Llama 4 Reasoning',
    'Grok & Meta Llama',
    'gemini-4-argon',
    'LLAMA 4 · MUHAKEME',
    '#1e40af',
    'HIGH',
    '1M Token',
    'Açık Ağırlık Zincirleme Düşünme & Bilimsel Doğrulama Motoru',
    'Matematiksel çıkarım, algoritma kanıtı ve derin kod analizi için optimize edilmiş Llama 4 Reasoning.',
    ['Açık Muhakeme', 'Kod Doğrulama', '1M Bağlam'],
    'Mantıksal adımları doğrulayıp en yalın ve doğru cevabı kısa biçimde sun.'
  ),
  'llama-4-maverick': createModelSpec(
    'llama-4-maverick',
    'Meta Llama 4 Maverick',
    'Grok & Meta Llama',
    'gemini-3.8-flash',
    'LLAMA 4 · 400B MoE',
    '#0284c7',
    'MEDIUM',
    '1M Token',
    '400B Uzman Karışımı (MoE) Açık Ekosistem & Çok Modlu Motor',
    'Yüksek hızlı kod üretimi, çok dilli çeviri ve ölçeklenebilir mikroservis geliştirme için çevik Llama 4 modeli.',
    ['400B MoE', 'Hızlı Tam Yığın Kod', 'Çok Dilli'],
    'Modern web ve bulut geliştirme standartlarında taşınabilir, kısa ve net çözümler üret.'
  ),
  'llama-4-scout': createModelSpec(
    'llama-4-scout',
    'Meta Llama 4 Scout (10M)',
    'Grok & Meta Llama',
    'gemini-4-argon',
    'LLAMA 4 · 10M BAĞLAM',
    '#0369a1',
    'MEDIUM',
    '10M Token',
    'Ultra Geniş Bağlam Tarama, Çoklu Belge & Kod Deposu Keşfi',
    'Dev veri kümelerini, uzun günlükleri ve çoklu proje dosyalarını hızla tarayıp özetleyen Scout modeli.',
    ['Ultra Geniş Tarama', 'Kapsamlı Özet', 'Hızlı Keşif'],
    'Geniş kapsamlı konuları en kritik noktalarına indirgeyip kısa ve berrak biçimde özetle.'
  ),
  'llama-3-3-70b': createModelSpec(
    'llama-3-3-70b',
    'Meta Llama 3.3 70B Instruct',
    'Grok & Meta Llama',
    'gemini-3.8-flash',
    'LLAMA 3.3 · 70B',
    '#2563eb',
    'LOW',
    '128K Token',
    'Kanıtlanmış Kararlılık, Talimat Takibi & Açık Kaynak Endüstri Standardı',
    'Yüksek talimat sadakati ve dengeli performansıyla kurumsal otomasyonlarda tercih edilen 70B model.',
    ['Kararlı Talimat', 'Temiz JSON/Kod', 'Hızlı Üretim'],
    'Talimatlara tam uyarak yalın, net ve kısa yanıt ver.'
  ),

  // ==================== 6. MISTRAL & ALIBABA QWEN (12) ====================
  'mistral-large-2': createModelSpec(
    'mistral-large-2',
    'Mistral Large 2',
    'Mistral & Qwen',
    'gemini-3.8-flash',
    'MISTRAL LARGE 2',
    '#ea580c',
    'MEDIUM',
    '256K Token',
    'Avrupa Mühendislik Hassasiyeti, Çok Dilli Sentez & API Motoru',
    'Yapılandırılmış API tasarımı, çok dilli kurumsal iletişim ve yalın yazılım mimarisi için yüksek doğruluklu model.',
    ['API & Şema Tasarımı', 'Yalın Mühendislik', 'Çok Dilli'],
    'Avrupa mühendislik disipliniyle son derece özlü, standartlara uygun ve net yanıt üret.'
  ),
  'mistral-medium-3': createModelSpec(
    'mistral-medium-3',
    'Mistral Medium 3',
    'Mistral & Qwen',
    'gemini-3.8-flash',
    'MISTRAL MEDIUM 3',
    '#f97316',
    'MEDIUM',
    '128K Token',
    'Kurumsal Verimlilik, Hızlı Raporlama & Dengeli Kodlama',
    'Kurumsal iş akışları, teknik özetleme ve hızlı uygulama geliştirme için optimize edilmiş yeni nesil Mistral modeli.',
    ['Kurumsal Hız', 'Dengeli Kodlama', 'Net Özet'],
    'İş ve yazılım sorularını gereksiz uzatma olmadan sade ve profesyonel biçimde yanıtla.'
  ),
  'mistral-saba': createModelSpec(
    'mistral-saba',
    'Mistral Saba & Devstral',
    'Mistral & Qwen',
    'gemini-3.8-flash',
    'MISTRAL SABA · BÖLGESEL & KOD',
    '#c2410c',
    'MEDIUM',
    '256K Token',
    'Kültürel Dil Nüansı, Türkçe Akıcılık & Ajanik Yazılım Uzmanı',
    'Bölgesel dil incelikleri, kusursuz Türkçe ifade ve hızlı yazılım görevleri için optimize edilmiş Mistral Saba & Devstral.',
    ['Doğal Türkçe Nüans', 'Devstral Kod', 'Hızlı Yanıt'],
    'Doğal ve akıcı Türkçe ile doğrudan sorunun cevabını kısa ve sade biçimde ver.'
  ),
  'codestral-25': createModelSpec(
    'codestral-25',
    'Mistral Codestral 25.01',
    'Mistral & Qwen',
    'gemini-4-argon',
    'CODESTRAL · 80+ DİL',
    '#d97706',
    'HIGH',
    '256K Token',
    '80+ Programlama Dilinde Düşük Gecikmeli Saf Kod Uzmanı',
    'Kod tamamlama, birim testi üretimi, SQL optimizasyonu ve hızlı hata giderme için özel eğitilmiş Mistral kod motoru.',
    ['80+ Dil Uzmanı', 'SQL & Test Üretimi', 'Hızlı Refactor'],
    'Yalnızca en temiz mühendislik çözümüne odaklan; kısa, net ve tip güvenli yanıt ver.'
  ),
  'pixtral-large': createModelSpec(
    'pixtral-large',
    'Mistral Pixtral Large',
    'Mistral & Qwen',
    'gemini-3.8-flash',
    'PIXTRAL · 124B GÖRSEL',
    '#c2410c',
    'MEDIUM',
    '128K Token',
    '124B Çok Modlu Belge, Tablo, Grafik & Görsel Analiz Motoru',
    'Karmaşık finansal grafikleri, teknik çizimleri ve taranmış belgeleri yüksek doğrulukla çözümleyen görsel dil modeli.',
    ['Belge & Grafik Okuma', 'Görsel Analiz', '124B Hassasiyet'],
    'Görsel ve yapısal verileri doğrudan anlamlandırıp birkaç net cümlede özetle.'
  ),
  'magistral-reasoning': createModelSpec(
    'magistral-reasoning',
    'Mistral Magistral Reasoning',
    'Mistral & Qwen',
    'gemini-4-argon',
    'MAGISTRAL · MUHAKEME',
    '#b45309',
    'HIGH',
    '128K Token',
    'Çok Dilli Şeffaf Mantık Zinciri & Kurumsal Karar Doğrulama',
    'Avrupa regülasyonları, finansal hesaplama ve çok adımlı mühendislik mantığı için Mistral muhakeme modeli.',
    ['Çok Dilli Muhakeme', 'Risk Analizi', 'Doğrulanmış Mantık'],
    'Mantıksal tutarlılığı tam koruyarak en doğru kararı kısa ve sade Türkçe ile açıkla.'
  ),
  'qwen-3-max': createModelSpec(
    'qwen-3-max',
    'Alibaba Qwen 3 Max (235B)',
    'Mistral & Qwen',
    'gemini-4-argon',
    'QWEN 3 MAX · 235B',
    '#7c3aed',
    'HIGH',
    '512K Token',
    '235B MoE Amiral Gemisi: Kodlama, Matematik & Çok Dilli Üst Zeka',
    'Uçtan uca yazılım mimarisi, veri bilimi ve karmaşık problem çözümünde küresel zirveye oynayan Qwen 3 amiral gemisi.',
    ['235B MoE Zeka', 'Tam Yığın Kod', 'İleri Matematik'],
    'Yüksek teknik derinliği sadeleştirerek doğrudan çalışan, özlü ve net çözümler üret.'
  ),
  'qwen-3-coder-plus': createModelSpec(
    'qwen-3-coder-plus',
    'Alibaba Qwen 3 Coder Plus',
    'Mistral & Qwen',
    'gemini-4-argon',
    'QWEN 3 · CODER PLUS',
    '#6d28d9',
    'HIGH',
    '512K Token',
    'Tam Yığın Web, Mikroservis & Otomasyon Kodlama Amiral Gemisi',
    'Çok dosyalı yazılım mimarisi, modern React/TypeScript/Python geliştirme ve veritabanı optimizasyonu uzmanı.',
    ['Tam Yığın Kodlama', '512K Repo Hafızası', 'Temiz Mimari'],
    'En modern ve bakımı kolay yazılım çözümünü uzatmadan kısa ve net biçimde paylaş.'
  ),
  'qwen-3-thinking': createModelSpec(
    'qwen-3-thinking',
    'Qwen 3 32B Thinking',
    'Mistral & Qwen',
    'gemini-4-argon',
    'QWEN 3 · THINKING',
    '#6d28d9',
    'HIGH',
    '128K Token',
    'Yoğunlaştırılmış Derin Muhakeme & Algoritmik Problem Çözücü',
    '32B yoğun mimaride üst düzey matematiksel kanıt ve algoritma tasarımı sunan düşünme motoru.',
    ['Yoğun Muhakeme', 'Algoritma Kanıtı', 'STEM Uzmanı'],
    'Problemi derinlemesine çözüp sonucu gereksiz uzatma yapmadan kısa ve berrak biçimde aktar.'
  ),
  'qwen-2-5-coder': createModelSpec(
    'qwen-2-5-coder',
    'Qwen 2.5 Coder 32B',
    'Mistral & Qwen',
    'gemini-3.8-flash',
    'QWEN CODER · 32B',
    '#8b5cf6',
    'MEDIUM',
    '128K Token',
    'Hızlı Uygulama Geliştirme, Otomasyon Betikleri & Hata Avcısı',
    'Modern web çerçeveleri, veritabanı sorguları ve kabuk betikleri için pratik kodlama uzmanı.',
    ['Pratik Web & SQL', 'Hata Avcısı', 'Otomasyon'],
    'Pratik, temiz ve doğrudan sonuca giden kısa teknik cevaplar sun.'
  ),
  'qwq-32b': createModelSpec(
    'qwq-32b',
    'Alibaba QwQ-32B Reasoning',
    'Mistral & Qwen',
    'gemini-4-argon',
    'QwQ-32B · ANALİTİK',
    '#5b21b6',
    'HIGH',
    '128K Token',
    'Sorgulayıcı Analitik Muhakeme & Zorlu Bulmaca Çözücü',
    'Her varsayımı sorgulayarak gizli uç durumları yakalayan keskin analitik düşünme motoru.',
    ['Uç Durum Yakalama', 'Analitik Sorgu', 'Matematik'],
    'Gizli tuzakları ve uç durumları hesaba katarak en güvenli cevabı birkaç kısa cümlede ver.'
  ),
  'qwen-vl-max': createModelSpec(
    'qwen-vl-max',
    'Qwen 2.5 VL Max',
    'Mistral & Qwen',
    'gemini-3.8-flash',
    'QWEN VL · GÖRSEL ZEKA',
    '#9333ea',
    'MEDIUM',
    '128K Token',
    'Yüksek Çözünürlüklü Görsel, OCR, Arayüz & Video Kare Analizi',
    'Görsellerdeki ince metinleri, tabloları ve tasarım düzenlerini yüksek hassasiyetle okuyan çok modlu model.',
    ['Hassas OCR', 'UI/UX Analizi', 'Görsel Muhakeme'],
    'Görsel ve metinsel içerikleri net, düzenli ve kısa biçimde çözümle.'
  ),
  'qwen-image-edit-pro': createModelSpec(
    'qwen-image-edit-pro',
    'Alibaba Qwen Image Pro (4K)',
    'Mistral & Qwen',
    'gemini-3.8-flash',
    'QWEN IMAGE · 4K SENTEZ',
    '#7e22ce',
    'HIGH',
    '256K Token',
    'Doğrudan Fotogerçekçi Görsel Üretimi, Sahne Düzenleme & Estetik Kompozisyon',
    'Karmaşık sahne tariflerini yüksek detaylı gerçek fotoğraflara dönüştüren Qwen Image Pro motoru.',
    ['Doğrudan 4K Görsel', 'Sahne Kompozisyonu', 'Keskin Doku'],
    'İstenen görseli doğrudan sentezle ve kısaca açıkla.'
  ),

  // ==================== 7. SİNEMA & GÖRSEL AI (18) ====================
  'nano-banana-2-1-ultra': createModelSpec(
    'nano-banana-2-1-ultra',
    'Nano Banana 2.1 Ultra (4K Fotoğraf)',
    'Sinema & Görsel AI',
    'gemini-3.8-flash',
    'NANO BANANA 2.1 · 4K UHD',
    '#f59e0b',
    'HIGH',
    '512K Token',
    'Doğrudan 4K Fotogerçekçi DSLR Fotoğraf Sentezi & Optik Lens Motoru',
    'Sohbette yazdığınız her sahneyi doğrudan gerçek 4K çözünürlüklü JPEG fotoğrafa dönüştüren amiral gemisi Nano Banana 2.1 motoru.',
    ['Doğrudan 4K Fotoğraf', 'Panoramik Oranlar', 'Optik DSLR Lens'],
    'Kullanıcının istediği sahneyi gerçek fotoğraf olarak üret ve 1-2 kısa cümleyle özetle.'
  ),
  'nano-banana-pro-4k': createModelSpec(
    'nano-banana-pro-4k',
    'Nano Banana Pro 4K (Stüdyo)',
    'Sinema & Görsel AI',
    'gemini-3.8-flash',
    'NANO BANANA PRO · STÜDYO',
    '#d97706',
    'HIGH',
    '512K Token',
    'Endüstriyel Ürün, Mimari Kesit & Editöryal Portre Fotoğraf Motoru',
    'Hasselblad orta format keskinliğinde portre, ürün ve mimari fotoğraf üreten profesyonel Nano Banana Pro çekirdeği.',
    ['Hasselblad Stüdyo', 'Mimari & Ürün', 'Kusursuz Işık'],
    'Stüdyo kalitesinde gerçek fotoğraf üret ve kısaca açıkla.'
  ),
  'imagen-4-ultra': createModelSpec(
    'imagen-4-ultra',
    'Google Imagen 4 Ultra',
    'Sinema & Görsel AI',
    'gemini-3.8-flash',
    'IMAGEN 4 · ULTRA RAW',
    '#2563eb',
    'HIGH',
    '256K Token',
    'Yüksek Dinamik Aralıklı Fotogerçekçi Doğa, Portre & Konsept Fotoğraf',
    'Mikro doku hassasiyeti ve doğal gün ışığı fiziğiyle gerçek kamera fotoğrafı üreten Google Imagen 4 Ultra.',
    ['8K RAW Gerçekçilik', 'Doğal Işık Fiziği', 'Mikro Doku'],
    'Fotogerçekçi sahneyi doğrudan üret ve 1-2 cümleyle sun.'
  ),
  'flux-1-1-pro-ultra': createModelSpec(
    'flux-1-1-pro-ultra',
    'FLUX.1.1 Pro Ultra Fotoğraf',
    'Sinema & Görsel AI',
    'gemini-3.8-flash',
    'FLUX 1.1 · PRO RAW',
    '#059669',
    'HIGH',
    '256K Token',
    'Black Forest Labs Sinematik RAW Fotoğraf & Kompozisyon Motoru',
    'Sinematik renk derecelendirmesi ve keskin alan derinliğiyle gerçekçi fotoğraflar sentezleyen FLUX.1.1 Pro Ultra.',
    ['FLUX RAW Doku', 'Sinematik Renk', 'Yüksek İstem Sadakati'],
    'İsteme birebir sadık gerçek fotoğraf sentezle ve kısa özet ver.'
  ),
  'veo-3-1-ultra-cinema': createModelSpec(
    'veo-3-1-ultra-cinema',
    'Google Veo 3.1 Ultra (4K 60fps Video)',
    'Sinema & Görsel AI',
    'gemini-omni-1.2-flash',
    'GOOGLE VEO 3.1 · 60FPS',
    '#4338ca',
    'HIGH',
    '1M Token',
    'Sinematik Hareket Kontrolcülü Doğrudan 4K 60fps Sesli MP4 Video Motoru',
    'Kamera hızı, pan ve tilt açısını dinamik ayarlayarak doğrudan sesli gerçek MP4 sinema videosu üreten Google Veo 3.1 Ultra.',
    ['Doğrudan 4K MP4 Video', 'Pan/Tilt/Hız Kontrolü', 'Türkçe Ses Kuşağı'],
    'Sahneyi gerçek sesli sinema videosu olarak sentezle ve 1-2 kısa cümleyle sun.'
  ),
  'veo-3-cinema-pro': createModelSpec(
    'veo-3-cinema-pro',
    'Google Veo 3 Cinema Director',
    'Sinema & Görsel AI',
    'gemini-omni-1.2-flash',
    'GOOGLE VEO 3 · 4K SESLİ',
    '#4f46e5',
    'HIGH',
    '1M Token',
    'Doğal Ses Kuşaklı 4K 60fps Sinema & Fizik Simülasyon Yönetmeni',
    'Diyalog, ortam sesi, kamera optiği ve 4K 60fps kare interpolasyonlu MP4 video üretimi için Google Veo 3 yönetmeni.',
    ['Sesli 4K Sinema', '60fps İnterpolasyon', 'IMAX Optik'],
    'Google Veo 3 sinema yönetmeni olarak sahne, ışık, ses ve kamera hareketini 2-3 yalın ve çarpıcı cümlede planla.'
  ),
  'wan-2-2-cinema-ultra': createModelSpec(
    'wan-2-2-cinema-ultra',
    'Alibaba Wan 2.2 Cinema Ultra',
    'Sinema & Görsel AI',
    'gemini-omni-1.2-flash',
    'WAN 2.2 · 4K SİNEMA',
    '#7c3aed',
    'HIGH',
    '512K Token',
    'MoE Video Difüzyon Mimarisi, Gerçekçi Işık Fiziği & Doğrudan MP4 Video',
    'Dinamik kamera yörüngesi ve sinematik renk derecelendirmesiyle doğrudan MP4 video üreten Wan 2.2 Cinema Ultra.',
    ['Doğrudan MP4 Video', 'MoE Video Fizik', 'Sinematik Işık'],
    'Sahneyi gerçek sinematik MP4 videoya dönüştür ve 1-2 kısa cümleyle özetle.'
  ),
  'kling-2-5-turbo': createModelSpec(
    'kling-2-5-turbo',
    'Kling 2.5 Turbo Master',
    'Sinema & Görsel AI',
    'gemini-omni-1.2-flash',
    'KLING 2.5 · TURBO MP4',
    '#ea580c',
    'HIGH',
    '512K Token',
    'Yüksek Hızlı Sinematik Hareket, Akıcı Kamera Takibi & Doğrudan MP4 Video',
    'İsteme tam sadık sahne kurgusu ve pürüzsüz kamera dinamiğiyle doğrudan sesli MP4 video sentezleyen Kling 2.5 Turbo.',
    ['Hızlı MP4 Sentez', 'Akıcı Kamera', 'Yüksek Sadakat'],
    'Sahneyi doğrudan MP4 video olarak üret ve kısaca açıkla.'
  ),
  'higgsfield-cinema': createModelSpec(
    'higgsfield-cinema',
    'Higgsfield Cinema & Reel AI',
    'Sinema & Görsel AI',
    'gemini-omni-1.2-flash',
    'HIGGSFIELD · SİNEMA',
    '#e11d48',
    'HIGH',
    '512K Token',
    'Sinematik Kamera Koreografisi, Karakter Tutarlılığı & Reel Yönetmeni',
    'Bullet-Time, FPV, Anamorfik kamera hareketleri, ışık şemaları ve gerçek MP4 sahne yönetmenliği motoru.',
    ['Kamera Koreografisi', 'Karakter Tutarlılığı', '4K Sahne Dökümü'],
    'Sahne, kamera hareketi, lens ve ışık önerilerini birkaç kısa, akıcı ve sade cümleyle özetle.'
  ),
  'higgsfield-dop-turbo': createModelSpec(
    'higgsfield-dop-turbo',
    'Higgsfield DoP Turbo',
    'Sinema & Görsel AI',
    'gemini-omni-1.2-flash',
    'HIGGSFIELD · DoP TURBO',
    '#be123c',
    'MEDIUM',
    '256K Token',
    'Görüntü Yönetmeni (DoP) Lens, Işık & Anlık Reklam Kurgusu',
    'Ticari ürün filmleri, müzik klipleri ve dinamik sosyal medya videoları için hızlı görüntü yönetmeni motoru.',
    ['Görüntü Yönetimi', 'Ticari Klip', 'Lens & Işık'],
    'Deneyimli bir görüntü yönetmeni gibi lens, açı ve ışık planını uzatmadan kısa ve net biçimde sun.'
  ),
  'sora-veo-director': createModelSpec(
    'sora-veo-director',
    'Sora & Veo Cinema Director',
    'Sinema & Görsel AI',
    'gemini-omni-1.2-flash',
    'SORA & VEO · 4K SİNEMA',
    '#9333ea',
    'HIGH',
    '1M Token',
    'Fizik Doğruluklu Sinema Kurgusu, Çoklu Plan Storyboard & 4K Video',
    'Fizik tabanlı dünya simülasyonu, çok açılı sinema kurgusu ve doğrudan 4K 60fps MP4 sahne yönetmeni.',
    ['Fizik Tabanlı Sahne', 'Çoklu Plan Kurgu', 'Doğrudan MP4 Video'],
    'Fiziksel ışık, atmosfer, kamera hareketi ve ses tasarımını berrak ve kısa cümlelerle kurgula.'
  ),
  'runway-gen-4': createModelSpec(
    'runway-gen-4',
    'Runway Gen-4 Director',
    'Sinema & Görsel AI',
    'gemini-omni-1.2-flash',
    'RUNWAY GEN-4 · FİLM',
    '#db2777',
    'HIGH',
    '512K Token',
    'Tutarlı Dünya Kurulumu, Sinematik VFX & Bağımsız Film Kurgusu',
    'Sahne boyunca mekan ve karakter sürekliliğini koruyan profesyonel VFX ve film yönetmenliği motoru.',
    ['Mekan Sürekliliği', 'Profesyonel VFX', 'Film Kurgusu'],
    'Mekan tutarlılığı, kompozisyon ve görsel efekt akışını kısa, net ve yaratıcı biçimde planla.'
  ),
  'kling-2-master': createModelSpec(
    'kling-2-master',
    'Kling 2.0 Master Cinema',
    'Sinema & Görsel AI',
    'gemini-omni-1.2-flash',
    'KLING 2.0 · MASTER',
    '#ea580c',
    'HIGH',
    '512K Token',
    'Gerçekçi İnsan Hareketi, Uzun Sekans & Aksiyon Koreografisi',
    'Karmaşık fiziksel etkileşimler, akıcı karakter ifadeleri ve dinamik aksiyon sahneleri için Kling 2.0 yönetmeni.',
    ['Akıcı Fizik & Hareket', 'Aksiyon Sekansı', 'Doğal İfade'],
    'Hareket dinamiği, kadraj ve zamanlamayı birkaç sade ve net cümlede tasarla.'
  ),
  'seedance-1-pro': createModelSpec(
    'seedance-1-pro',
    'ByteDance Seedance 1.0 Pro',
    'Sinema & Görsel AI',
    'gemini-omni-1.2-flash',
    'SEEDANCE 1.0 · ÇOKLU PLAN',
    '#0d9488',
    'HIGH',
    '512K Token',
    'Çoklu Plan Sinematik Geçiş, Yüksek Kare Akışı & Dinamik Ritm',
    'Kesintisiz sahne geçişleri, estetik ışıklandırma ve yüksek hareket tutarlılığı sunan Seedance 1.0 Pro yönetmeni.',
    ['Çoklu Plan Geçiş', 'Yüksek Kare Akışı', 'Estetik Işık'],
    'Sahne geçişlerini, kadraj ritmini ve ışık dengesini kısa ve akıcı cümlelerle tasarla.'
  ),
  'hailuo-minimax-video': createModelSpec(
    'hailuo-minimax-video',
    'MiniMax Hailuo 02 Director',
    'Sinema & Görsel AI',
    'gemini-omni-1.2-flash',
    'HAILUO 02 · SİNEMATİK',
    '#7c3aed',
    'HIGH',
    '512K Token',
    'Duygusal Karakter Oyunculuğu, Atmosferik Sinema & Mikro-İfade',
    'İnce yüz ifadeleri, sinematik sis/ışık atmosferi ve hikaye odaklı kamera yönetimi için Hailuo 02 modeli.',
    ['Atmosferik Sinema', 'Karakter İfadesi', 'Hikaye Kadrajı'],
    'Sahnenin duygusal atmosferini ve kamera açısını yalın ve özlü birkaç cümlede kurgula.'
  ),
  'luma-ray-2': createModelSpec(
    'luma-ray-2',
    'Luma Ray 2 Dream Machine',
    'Sinema & Görsel AI',
    'gemini-omni-1.2-flash',
    'LUMA RAY 2 · 3D IŞIK',
    '#0284c7',
    'MEDIUM',
    '256K Token',
    'Fotogerçekçi Işın İzleme, 3B Mekansal Geçiş & Mimari Sinema',
    'Doğal ışık yansımaları, mimari iç/dış mekan uçuşları ve sürreal görsel geçişler için Ray 2 motoru.',
    ['Işın İzleme Estetiği', 'Mekansal Geçiş', 'Mimari Uçuş'],
    'Işık yansımaları ve 3 boyutlu kamera akışını kısa, etkileyici ve sade biçimde açıkla.'
  ),
  'pika-2-2-studio': createModelSpec(
    'pika-2-2-studio',
    'Pika 2.2 VFX Studio',
    'Sinema & Görsel AI',
    'gemini-3.8-flash',
    'PIKA 2.2 · VFX',
    '#d97706',
    'LOW',
    '256K Token',
    'Yaratıcı Görsel Efektler, Sahne Dönüşümü & Stilize Animasyon',
    'Hızlı sosyal medya efektleri, nesne dönüşümleri ve stilize 3D/anime sahne fikirleri için çevik stüdyo motoru.',
    ['Yaratıcı VFX', 'Stilize Animasyon', 'Hızlı İstem'],
    'Eğlenceli, yaratıcı ve anında uygulanabilir görsel/video fikirlerini kısa ve öz sun.'
  ),
  'midjourney-v7-art': createModelSpec(
    'midjourney-v7-art',
    'Midjourney v7 Sanat Yönetmeni',
    'Sinema & Görsel AI',
    'gemini-3.8-flash',
    'MIDJOURNEY V7 · SANAT',
    '#4f46e5',
    'MEDIUM',
    '256K Token',
    'Editöryal Fotoğrafçılık, Konsept Sanat & Kusursuz Kompozisyon',
    'Renk paleti, doku, ışık açısı ve estetik kompozisyon açısından üst düzey görsel istem ve sanat yönetimi uzmanı.',
    ['Sanat Yönetimi', 'Editöryal Estetik', 'Renk & Doku'],
    'Görsel estetik, renk uyumu ve ışık kompozisyonunu kısa, ilham verici ve sade cümlelerle tarif et.'
  ),

  // ==================== 8. PERPLEXITY & KÜRESEL AI (13) ====================
  'perplexity-sonar-pro': createModelSpec(
    'perplexity-sonar-pro',
    'Perplexity Sonar Pro',
    'Perplexity & Küresel AI',
    'gemini-3.8-flash',
    'PERPLEXITY · SONAR PRO',
    '#0891b2',
    'MEDIUM',
    '256K Token',
    'Canlı Çoklu Kaynak Doğrulama, Atıflı Araştırma & Güncel Sentez',
    'Her soruyu gerçek zamanlı web taraması ve doğrulanmış kaynaklarla yanıtlayan canlı araştırma motoru.',
    ['Otomatik Canlı Web Arama', 'Kaynak Doğrulama', 'Güncel Sentez'],
    'Doğrulanabilir olgular ve güncel verilerle kısa, sade ve doğrudan birkaç cümlede yanıt ver.'
  ),
  'perplexity-reasoning': createModelSpec(
    'perplexity-reasoning',
    'Perplexity Sonar Reasoning Pro',
    'Perplexity & Küresel AI',
    'gemini-4-argon',
    'SONAR · REASONING PRO',
    '#0e7490',
    'HIGH',
    '256K Token',
    'Canlı Web Kanıtları Üzerinde Zincirleme Analitik Muhakeme',
    'Güncel verileri toplayıp aralarındaki neden-sonuç ilişkilerini derin muhakemeyle çözümleyen araştırma motoru.',
    ['Canlı Veri Muhakemesi', 'Karşılaştırmalı Kanıt', 'Net Sonuç'],
    'Güncel olguları analitik süzgeçten geçirip en doğru çıkarımı kısa ve öz olarak sun.'
  ),
  'perplexity-research': createModelSpec(
    'perplexity-research',
    'Perplexity Deep Research',
    'Perplexity & Küresel AI',
    'gemini-4-argon',
    'PERPLEXITY · RESEARCH',
    '#155e75',
    'HIGH',
    '512K Token',
    'Kapsamlı Sektör, Teknoloji & Akademik Literatür Özeti',
    'Onlarca kaynağı çapraz kontrol ederek yönetici düzeyinde özet çıkaran derin araştırma motoru.',
    ['Çapraz Kaynak Kontrolü', 'Sektör Analizi', 'Yönetici Özeti'],
    'Kapsamlı araştırmayı en değerli 3-4 özlü cümleye damıtarak sade biçimde paylaş.'
  ),
  'kimi-k2-thinking': createModelSpec(
    'kimi-k2-thinking',
    'Moonshot Kimi K2 (2M)',
    'Perplexity & Küresel AI',
    'gemini-4-argon',
    'KIMI K2 · 2M BAĞLAM',
    '#4338ca',
    'HIGH',
    '2M Token',
    '2M Token Ultra Uzun Bağlam, Büyük Kod Tabanı & Belge Analizi',
    'Yüzlerce sayfalık raporları ve büyük projeleri bağlam kaybı olmadan tek seferde sentezleyen Kimi K2 amiral gemisi.',
    ['2M Uzun Bellek', 'Repo Sentezi', 'Ajanik Planlama'],
    'Karmaşık ve uzun konuları hiçbir kritik noktayı kaçırmadan kısa ve net bir özete dönüştür.'
  ),
  'kimi-k1-5': createModelSpec(
    'kimi-k1-5',
    'Moonshot Kimi k1.5 Multimodal',
    'Perplexity & Küresel AI',
    'gemini-3.8-flash',
    'KIMI k1.5 · ÇOK MODLU',
    '#6366f1',
    'MEDIUM',
    '256K Token',
    'Görsel-Metinsel Muhakeme & Hızlı Bilimsel Problem Çözümü',
    'Görsel şemalar ile matematiksel muhakemeyi birleştiren çevik Moonshot k1.5 modeli.',
    ['Görsel-STEM Muhakeme', 'Hızlı Çıkarım', 'Net Özet'],
    'Görsel ve analitik soruları doğrudan, sade ve kısa cümlelerle yanıtla.'
  ),
  'cohere-command-a': createModelSpec(
    'cohere-command-a',
    'Cohere Command A Enterprise',
    'Perplexity & Küresel AI',
    'gemini-3.8-flash',
    'COMMAND A · KURUMSAL',
    '#be123c',
    'MEDIUM',
    '256K Token',
    'Kurumsal RAG, İş Stratejisi, Finansal Analiz & Yönetici İletişimi',
    'Kurumsal bilgi yönetimi, KPI odaklı iş planları ve resmi iş iletişimi için optimize edilmiş kurumsal yapay zeka.',
    ['Kurumsal Strateji', 'KPI & Risk Analizi', 'Yönetici Özeti'],
    'Kurumsal karar süreçlerine uygun somut, ölçülebilir ve kısa yönetici yanıtları ver.'
  ),
  'cohere-command-r-plus': createModelSpec(
    'cohere-command-r-plus',
    'Cohere Command R+',
    'Perplexity & Küresel AI',
    'gemini-3.8-flash',
    'COMMAND R+ · RAG',
    '#e11d48',
    'MEDIUM',
    '128K Token',
    'Çok Dilli Bilgi Çıkarımı, Belge Doğrulama & İş Otomasyonu',
    'Çok dilli kurumsal belgelerden yüksek doğruluklu bilgi çıkarımı ve özetleme yapan Command R+ modeli.',
    ['Çok Dilli RAG', 'Belge Özeti', 'İş Akışı'],
    'Belgelerdeki ve sorulardaki ana fikri net, doğru ve kısa biçimde çıkar.'
  ),
  'microsoft-phi-4': createModelSpec(
    'microsoft-phi-4',
    'Microsoft Phi-4 Multimodal',
    'Perplexity & Küresel AI',
    'gemini-3.8-flash',
    'MICROSOFT PHI-4',
    '#0284c7',
    'MEDIUM',
    '128K Token',
    'Yüksek Yoğunluklu Bilimsel Mantık, Kod & Kompakt Çok Modlu Zeka',
    'Ders kitabı kalitesinde sentetik verilerle eğitilmiş, yüksek mantık yoğunluklu Microsoft Phi-4 modeli.',
    ['Yüksek Mantık Yoğunluğu', 'Eğitici Netlik', 'Temiz Kod'],
    'Berrak, öğretici ve gereksiz uzatmalardan arındırılmış kısa yanıtlar üret.'
  ),
  'amazon-nova-premier': createModelSpec(
    'amazon-nova-premier',
    'Amazon Nova Premier',
    'Perplexity & Küresel AI',
    'gemini-4-argon',
    'AMAZON NOVA · PREMIER',
    '#d97706',
    'HIGH',
    '1M Token',
    'Bulut Mimarisi, E-Ticaret Ölçekleme & Çok Adımlı Kurumsal Görev',
    'AWS ölçeğinde bulut mimarisi, tedarik/operasyon optimizasyonu ve kurumsal otomasyon için Nova amiral gemisi.',
    ['Bulut & Mikroservis', 'Operasyonel Ölçek', '1M Bağlam'],
    'Ölçeklenebilirlik, maliyet ve güvenilirlik dengesini gözeterek kısa ve pratik çözümler sun.'
  ),
  'nvidia-nemotron-ultra': createModelSpec(
    'nvidia-nemotron-ultra',
    'NVIDIA Nemotron Ultra 253B',
    'Perplexity & Küresel AI',
    'gemini-4-argon',
    'NEMOTRON ULTRA · 253B',
    '#65a30d',
    'HIGH',
    '512K Token',
    'GPU/Sistem Mühendisliği, Yüksek Verimli Çıkarım & Bilimsel Hesaplama',
    'Dağıtık sistem mimarisi, paralel hesaplama ve düşük gecikmeli altyapı için 253B mühendislik modeli.',
    ['Dağıtık Sistem & GPU', 'Paralel Algoritmalar', 'Performans'],
    'Donanım ve sistem performansı odağıyla en verimli teknik çözümü kısa ve net biçimde açıkla.'
  ),
  'glm-4-plus': createModelSpec(
    'glm-4-plus',
    'Zhipu GLM-4 Plus',
    'Perplexity & Küresel AI',
    'gemini-3.8-flash',
    'GLM-4 PLUS · AJANİK',
    '#2563eb',
    'MEDIUM',
    '128K Token',
    'Çok Dilli Sentez, Araç Kullanımı & Yapısal Analiz Motoru',
    'Karmaşık kullanıcı görevlerini düzenli ve anlaşılır adımlara ayıran yüksek kapasiteli GLM-4 Plus modeli.',
    ['Görev Planlama', 'Çok Dilli Sentez', 'Yapısal Netlik'],
    'Soruları düzenli, sade ve yalnızca birkaç kısa cümleyle yanıtla.'
  ),
  'minimax-01': createModelSpec(
    'minimax-01',
    'MiniMax-01 (4M Bağlam)',
    'Perplexity & Küresel AI',
    'gemini-4-argon',
    'MINIMAX-01 · 4M TOKEN',
    '#7c3aed',
    'HIGH',
    '4M Token',
    '4 Milyon Token Doğrusal Dikkat Mimarisi & Dev Bellek Sentezi',
    'Lightning Attention mimarisiyle devasa bağlam pencerelerinde hızlı ve tutarlı analiz sunan öncü model.',
    ['4M Dev Bağlam', 'Doğrusal Dikkat', 'Bütünsel Özet'],
    'Geniş bağlamlı soruları tam tutarlılıkla en kısa ve öz hale getirerek yanıtla.'
  ),
  'yi-lightning': createModelSpec(
    'yi-lightning',
    '01.AI Yi-Lightning',
    'Perplexity & Küresel AI',
    'gemini-3.1-flash-lite',
    'YI-LIGHTNING · HIZ',
    '#059669',
    'LOW',
    '128K Token',
    'Ultra Hızlı Çıkarım, Pratik Kod & Günlük Problem Çözücü',
    'Yüksek hız ve düşük gecikmeyle günlük teknik ve genel kültür sorularını anında yanıtlayan Yi-Lightning.',
    ['Şimşek Çıkarım', 'Pratik Çözüm', 'Net İfade'],
    'Anında anlaşılır, doğrudan ve kısa cevap ver.'
  ),

  // ==================== 9. LUXO ÖZEL (7) ====================
  'luxo-auto-router': createModelSpec(
    'luxo-auto-router',
    'Luxo Auto-Router (Otomatik En İyi AI)',
    'Luxo Özel',
    'gemini-4-argon',
    'AKILLI YÖNLENDİRİCİ · 122 AI',
    '#4f46e5',
    'HIGH',
    '2M Token',
    'Sorunuzun Türüne Göre 122 Model Arasından En Güçlüsünü Otomatik Seçen Süper Motor',
    'Kodlama için Claude 5.5, yüksek hassasiyetli akıl yürütme için Gemini 4 Hydrogen ve Carbon, ultra hızlı yanıt için Gemini 4 Neon, matematik için DeepSeek Math V2, güncel araştırma için Perplexity, sinema için Veo 3.1 Ultra ve görsel için Nano Banana 2.1 Ultra çekirdeğini otomatik devreye alır.',
    ['Otomatik Uzman Seçimi', '122 Model Gücü', 'Sıfır Ayar'],
    'Sorunun alanına en uygun uzmanlıkla doğrudan konunun özüne in; kısa, kesin ve pürüzsüz Türkçe yanıt üret.',
    { speed: 'Akıllı Otomatik' }
  ),
  'luxo-flash': createModelSpec(
    'luxo-flash',
    'Luxo-Flash',
    'Luxo Özel',
    'gemini-3.8-flash',
    'HIZLI & ÜCRETSİZ',
    '#2563eb',
    'LOW',
    '256K Token',
    'En Hızlı Günlük Sentez Motoru',
    'Günlük sorular, anında özetler ve düşük gecikmeli akıllı yanıtlar için optimize edilmiş çevik Luxo motoru.',
    ['Anında Yanıt', 'Çok Dilli', 'Akıllı Özet'],
    'Ultra hızlı, pratik ve doğrudan yanıt veren Luxo-Flash olarak her soruyu saniyeler içinde kısa, net ve doğal Türkçe ile yanıtla.',
    { speed: 'Ultra Hızlı' }
  ),
  'luxo-ultra': createModelSpec(
    'luxo-ultra',
    'Luxo-Ultra',
    'Luxo Özel',
    'gemini-4-argon',
    'DERİN AKIL YÜRÜTME',
    '#7c3aed',
    'HIGH',
    '1M Token',
    'Kapsamlı Destek & Derin Akıl Yürütme',
    'Karmaşık problemler, bilimsel analiz ve analitik düşünme için geliştirilmiş özel Luxo modeli.',
    ['Derin Analiz', 'STEM & Matematik', 'Stratejik Planlama'],
    'Karmaşık konuları derinlemesine analiz edip gereksiz uzatma ve süslü semboller kullanmadan kısa, berrak ve öz cümlelerle yanıtla.',
    { allowGuest: false, speed: 'Derin Analiz' }
  ),
  'luxo-argon': createModelSpec(
    'luxo-argon',
    'Luxo-Argon',
    'Luxo Özel',
    'gemini-4-argon',
    'KOD & MÜHENDİSLİK',
    '#059669',
    'MEDIUM',
    '1M Token',
    'Yazılım Mimarisi & Net Geliştirici Motoru',
    'Yazılım geliştirme, algoritma tasarımı ve teknik sorularda kısa, doğrudan ve temiz çözümler üreten mühendislik motoru.',
    ['Temiz Kod', 'Algoritma', 'Hızlı Çözüm'],
    'Soruları kısa, net ve sade bir dille yanıtla; yalnızca kullanıcı açıkça kod istediğinde kısa ve temiz kod paylaş.',
    { allowGuest: false, speed: 'Çok Hızlı' }
  ),
  'luxo-quantum-math': createModelSpec(
    'luxo-quantum-math',
    'Luxo Quantum STEM',
    'Luxo Özel',
    'gemini-4-argon',
    'STEM & KANIT',
    '#9333ea',
    'HIGH',
    '2M Token',
    'İleri Matematik, Fizik, Kriptografi & Teorem Kanıt Motoru',
    'Diferansiyel denklemler, olasılık teorisi, kuantum hesaplama ve algoritma doğrulaması için özel STEM motoru.',
    ['Matematiksel Kanıt', 'Sayısal Doğrulama', 'Fizik & STEM'],
    'Matematik ve bilim sorularında birim ve sayısal sağlamayı kendi içinde yapıp sonucu sade, kısa ve kesin biçimde sun.'
  ),
  'luxo-sol': createModelSpec(
    'luxo-sol',
    'Sol',
    'Luxo Özel',
    'gemini-4-neon',
    'SOL · ULTRA HIZLI',
    '#f59e0b',
    'MEDIUM',
    '1M Token',
    'Gündüz Hızı, Canlı Web Sentezi & Dinamik Üretkenlik Motoru',
    'Hızlı araştırma, kurumsal özetler, e-posta taslakları ve anlık problem çözümü için optimize edilmiş aydınlık Sol çekirdeği.',
    ['Yüksek Hız', 'Canlı Web', 'Kurumsal Özet'],
    'Sol çekirdeğinin çevik netliğiyle gereksiz uzatma yapmadan, akıcı ve doğrudan uygulanabilir Türkçe yanıt ver.'
  ),
  'luxo-luna': createModelSpec(
    'luxo-luna',
    'Luna',
    'Luxo Özel',
    'gemini-4-hydrogen',
    'LUNA · DERİN ANALİZ',
    '#6366f1',
    'HIGH',
    '2M Token',
    'Derin Muhakeme, Güvenlik Denetimi & Mimari Tasarım Çekirdeği',
    'Karmaşık kod tabanları, uyum politikaları ve kritik mühendislik kararlarını sakin ve berrak muhakeme ile çözen Luna çekirdeği.',
    ['Derin Düşünme', 'Kod & Güvenlik', '2M Uzun Bağlam'],
    'Luna muhakeme disipliniyle değişkenleri sessizce tartıp kristal netliğinde, yapısal ve kesin bir yanıt sun.'
  ),
  'luxo-dev-helper': createModelSpec(
    'luxo-dev-helper',
    "Luxo-Dev's Helper",
    'Luxo Özel',
    'gemini-4-argon',
    'GO PLANI',
    '#0284c7',
    'MEDIUM',
    '1M Token',
    'Go Planı - Genişletilmiş Geliştirici Asistanı',
    'Go aboneliği veya yetkili geliştirici erişim koduyla açılan, yüksek verimli mühendislik ve strateji modeli.',
    ['Go Hızlandırıcı', 'Proje Analizi', 'Uzun Bellek'],
    'Yetkili Go Planı mühendislik yardımcısı olarak kodlama, mimari ve iş akışlarını süratle, kısa ve net biçimde çöz.',
    { allowGuest: false, isLocked: true, tier: 'go', speed: 'Yüksek Performans' }
  ),
  'luxo-dev': createModelSpec(
    'luxo-dev',
    'Luxo-Dev',
    'Luxo Özel',
    'gemini-4-argon',
    'PLUS VIP',
    '#d97706',
    'HIGH',
    '2M Token',
    'Plus Planı - En Üstün Amiral Gemisi Model',
    'Plus aboneliği veya VIP geliştirici şifresiyle açılan, en güçlü ve en yüksek doğruluklu Luxo amiral gemisi.',
    ['Sınırsız Muhakeme', 'Çoklu Ajan Sentezi', 'VIP Öncelik'],
    'Luxo AI Plus VIP amiral gemisi olarak her alanda en üst düzey doğruluğu en özlü, sade ve kusursuz cümlelerle sun.',
    { allowGuest: false, isLocked: true, tier: 'plus', speed: 'En Üstün' }
  ),
};

export const LUXO_MODEL_IDS = Object.keys(LUXO_MODELS) as LuxoModelId[];

export const PUBLIC_CHAT_MODEL_IDS: LuxoModelId[] = [
  'gemini-3-1-flash-lite',
  'gemini-4-hydrogen',
  'gemini-4-carbon',
  'gemini-flash-latest',
  'luxo-auto-router',
  'luxo-flash',
  'luxo-luna',
  'chatgpt-5-2-pro',
  'chatgpt-5-omni',
  'gpt-astra',
  'claude-5-5-opus',
  'claude-5-5-sonnet',
  'claude-5-2-fable',
];

const PUBLIC_CHAT_MODEL_SET = new Set<LuxoModelId>(PUBLIC_CHAT_MODEL_IDS);

export const EXTENDED_CATALOG_MODEL_IDS: LuxoModelId[] = LUXO_MODEL_IDS.filter(
  (id) => !PUBLIC_CHAT_MODEL_SET.has(id)
);

export function getSelectableChatModelIds(
  activeModelId?: LuxoModelId,
  showExtendedCatalog = false
): LuxoModelId[] {
  if (showExtendedCatalog) {
    return LUXO_MODEL_IDS;
  }
  if (
    activeModelId &&
    activeModelId in LUXO_MODELS &&
    !PUBLIC_CHAT_MODEL_SET.has(activeModelId)
  ) {
    return [activeModelId, ...PUBLIC_CHAT_MODEL_IDS];
  }
  return PUBLIC_CHAT_MODEL_IDS;
}

export function validateModelCatalogPassword(code: string): boolean {
  if (!code) return false;
  const normalized = code.trim().toLowerCase();
  return normalized === 'serpil123' || normalized === 'serpilmurat123';
}

export type UnlockResult = 'dev_full' | 'dev_helper' | 'invalid';

export function validateUnlockCode(code: string): UnlockResult {
  if (!code) return 'invalid';
  const normalized = code.trim();
  if (normalized === 'serpilmurat123') return 'dev_full';
  if (normalized === 'serpil123') return 'dev_helper';
  return 'invalid';
}

export interface AccessCheckResult {
  allowed: boolean;
  reason?: 'guest' | 'dev_locked' | 'dev_helper_locked';
}

export function canAccessModel(
  modelId: LuxoModelId,
  user: Pick<LuxoUser, 'isGuest' | 'isUnlockedDev' | 'isUnlockedDevHelper'>
): AccessCheckResult {
  const model = LUXO_MODELS[modelId];
  if (!model) {
    return { allowed: false, reason: 'guest' };
  }
  if (user.isGuest && !model.allowGuest) {
    return { allowed: false, reason: 'guest' };
  }
  if (modelId === 'luxo-dev' && !user.isUnlockedDev) {
    return { allowed: false, reason: 'dev_locked' };
  }
  if (
    modelId === 'luxo-dev-helper' &&
    !user.isUnlockedDevHelper &&
    !user.isUnlockedDev
  ) {
    return { allowed: false, reason: 'dev_helper_locked' };
  }
  return { allowed: true };
}

export function calculateGuestRemainingMessages(
  user: Pick<LuxoUser, 'isGuest' | 'guestMessageCount'>
): number {
  if (!user.isGuest) return Infinity;
  return Math.max(0, GUEST_MESSAGE_LIMIT - (user.guestMessageCount || 0));
}

export function enhanceUserPrompt(
  rawPrompt: string,
  synthesisMode: SynthesisMode = 'standart'
): string {
  const clean = sanitizeLuxoBrand(rawPrompt.trim());
  if (!clean) return '';

  const modeHint =
    synthesisMode === 'uzman-mimari'
      ? 'modüler mimari ve temel uç durumları gözeterek'
      : synthesisMode === 'akademik-kanit'
      ? 'doğrulanmış ilk prensipler ve somut kanıtlarla'
      : synthesisMode === 'yaratici-vizyon'
      ? 'özgün ve uygulanabilir fikirlerle'
      : 'doğrudan konunun özüne odaklanarak';

  return `${clean} (Lütfen ${modeHint}, garip semboller kullanmadan kısa, net ve öz biçimde yanıtla.)`;
}

export const DEFAULT_CINEMATIC_MOTION: CinematicMotionParams = {
  cameraSpeed: 1.0,
  pan: 0,
  tilt: 0,
};

export function normalizeCinematicMotion(
  raw?: Partial<CinematicMotionParams> | null
): CinematicMotionParams {
  const speedNum = Number(raw?.cameraSpeed);
  const panNum = Number(raw?.pan);
  const tiltNum = Number(raw?.tilt);

  const cameraSpeed = Number.isFinite(speedNum)
    ? Math.round(Math.min(2.5, Math.max(0.25, speedNum)) * 100) / 100
    : 1.0;
  const pan = Number.isFinite(panNum)
    ? Math.round(Math.min(100, Math.max(-100, panNum)))
    : 0;
  const tilt = Number.isFinite(tiltNum)
    ? Math.round(Math.min(90, Math.max(-90, tiltNum)))
    : 0;

  return { cameraSpeed, pan, tilt };
}

export function describeCinematicMotion(
  raw?: Partial<CinematicMotionParams> | null
): { summaryTr: string; promptDirectiveEn: string } {
  const { cameraSpeed, pan, tilt } = normalizeCinematicMotion(raw);

  const speedLabelTr =
    cameraSpeed <= 0.65
      ? `Ağır Çekim (${cameraSpeed.toFixed(2)}x)`
      : cameraSpeed >= 1.5
      ? `Hızlı Akış (${cameraSpeed.toFixed(2)}x)`
      : `Hız ${cameraSpeed.toFixed(2)}x`;
  const panLabelTr =
    pan > 5 ? `Sağ Pan +${pan}°` : pan < -5 ? `Sol Pan ${pan}°` : 'Merkez Pan';
  const tiltLabelTr =
    tilt > 5
      ? `Yukarı Tilt +${tilt}°`
      : tilt < -5
      ? `Aşağı Tilt ${tilt}°`
      : 'Ufuk Hizası';

  const speedEn =
    cameraSpeed <= 0.65
      ? `dramatic slow-motion camera velocity (${cameraSpeed.toFixed(2)}x)`
      : cameraSpeed >= 1.5
      ? `high-velocity dynamic tracking speed (${cameraSpeed.toFixed(2)}x)`
      : `natural smooth 24fps cinema camera velocity (${cameraSpeed.toFixed(2)}x)`;
  const panEn =
    pan > 5
      ? `smooth horizontal camera pan right (${pan} degrees)`
      : pan < -5
      ? `smooth horizontal camera pan left (${Math.abs(pan)} degrees)`
      : 'steady centered horizontal framing';
  const tiltEn =
    tilt > 5
      ? `gradual vertical crane tilt upward (+${tilt} degrees)`
      : tilt < -5
      ? `gradual vertical camera tilt downward (${tilt} degrees)`
      : 'level horizon vertical axis';

  return {
    summaryTr: `${speedLabelTr} · ${panLabelTr} · ${tiltLabelTr}`,
    promptDirectiveEn: `${speedEn}, ${panEn}, ${tiltEn}`,
  };
}

export function enhanceMediaPrompt(
  rawPrompt: string,
  mediaType: 'image' | 'video',
  style: string = 'Sinematik',
  cameraMotion: string = 'Sinematik Akış',
  extraOptions?: {
    highFidelity?: boolean;
    lensPreset?: NanoLensPresetId;
    negativePrompt?: string;
    motionControl?: Partial<CinematicMotionParams> | null;
  }
): string {
  const clean = sanitizeLuxoBrand(rawPrompt.trim());
  if (!clean) return '';

  const styleMap: Record<string, string> = {
    Sinematik:
      'ultra-detailed photorealistic cinema frame, 35mm ARRI Alexa lens, volumetric golden-hour lighting, natural depth of field, rich color grading',
    Siberpunk:
      'high-contrast cyberpunk futuristic atmosphere, neon reflections on wet asphalt, atmospheric fog, intricate architectural detail, ray-traced lighting',
    'Mimari Çizim':
      'precision architectural visualization, clean isometric spatial geometry, natural daylighting, museum-grade material textures',
    '3B İllüstrasyon':
      'Octane 3D studio render, subsurface scattering, soft studio rim light, tactile physical materials, crisp micro-details',
    'Minimalist Vektör':
      'Swiss editorial minimalist design, balanced negative space, crisp geometric precision, curated modern color palette',
    Fotogerçekçi:
      '8k RAW editorial photography, natural skin/surface micro-texture, sharp optical focus, balanced dynamic range',
  };

  const descriptor = styleMap[style] || styleMap.Sinematik;
  const lensObj = extraOptions?.lensPreset
    ? NANO_LENS_PRESETS.find((l) => l.id === extraOptions.lensPreset)
    : undefined;
  const lensClause = lensObj ? ` Optik Lens: ${lensObj.descriptor}.` : '';
  const negClean = sanitizeLuxoBrand(extraOptions?.negativePrompt?.trim() || '');
  const negClause = negClean ? ` İstenmeyen Öğeler (Kaçın): ${negClean}.` : '';

  if (mediaType === 'video') {
    const motionClause = extraOptions?.motionControl
      ? ` Kamera Dinamiği: ${describeCinematicMotion(extraOptions.motionControl).promptDirectiveEn}.`
      : '';
    const fidelityClause = extraOptions?.highFidelity
      ? ' Yüksek Sadakatli 4K UHD (3840x2160) master keskinliği, 60fps optik kare interpolasyonu (smooth temporal frame interpolation), sıfır hareket titremesi ve yüksek dinamik aralık.'
      : ' akıcı fiziksel hareket, sinematik 24fps film dokusu.';
    return `${clean}. Kamera Hareketi: ${cameraMotion}.${motionClause} Görsel Atmosfer: ${descriptor}.${lensClause}${fidelityClause}${negClause}`;
  }
  return `${clean}. Görsel Stil: ${descriptor}.${lensClause}${negClause}`;
}

export function resolvePublicAppUrl(rawOrigin?: string | null): string {
  const fallback =
    'https://ais-pre-fudupxh6ld5rvvbfz5qwt4-705459740809.europe-west2.run.app';
  const cleaned = (rawOrigin || fallback).trim().replace(/\/+$/, '');
  if (!cleaned || cleaned.includes('localhost')) {
    return cleaned || fallback;
  }
  return cleaned.replace('://ais-dev-', '://ais-pre-');
}

export function resolveLiveShareOrigin(rawOrigin?: string | null): string {
  const fallback =
    'https://ais-pre-fudupxh6ld5rvvbfz5qwt4-705459740809.europe-west2.run.app';
  const cleaned = (rawOrigin || '').trim().replace(/\/+$/, '');
  if (!cleaned) return fallback;
  return cleaned;
}

export function isPrivateDevPreviewOrigin(rawOrigin?: string | null): boolean {
  return Boolean(rawOrigin && rawOrigin.includes('://ais-dev-'));
}

export function isCinemaDirectorModel(modelId: LuxoModelId): boolean {
  return LUXO_MODELS[modelId]?.category === 'Sinema & Görsel AI';
}

const IMAGE_GENERATOR_CHAT_MODELS = new Set<LuxoModelId>([
  'nano-banana-2-1-ultra',
  'nano-banana-pro-4k',
  'imagen-4-ultra',
  'flux-1-1-pro-ultra',
  'midjourney-v7-art',
  'gpt-image-2-ultra',
  'qwen-image-edit-pro',
]);

const VIDEO_GENERATOR_CHAT_MODELS = new Set<LuxoModelId>([
  'veo-3-1-ultra-cinema',
  'veo-3-cinema-pro',
  'wan-2-2-cinema-ultra',
  'kling-2-5-turbo',
  'sora-veo-director',
  'higgsfield-cinema',
  'higgsfield-dop-turbo',
  'runway-gen-4',
  'kling-2-master',
  'seedance-1-pro',
  'hailuo-minimax-video',
  'luma-ray-2',
  'pika-2-2-studio',
]);

export function isImageGeneratorChatModel(modelId: LuxoModelId): boolean {
  return IMAGE_GENERATOR_CHAT_MODELS.has(modelId);
}

export function isVideoGeneratorChatModel(modelId: LuxoModelId): boolean {
  return VIDEO_GENERATOR_CHAT_MODELS.has(modelId);
}

function isConversationalOrTechnicalQuestion(prompt: string): boolean {
  const text = (prompt || '').trim();
  if (!text) return true;
  const folded = foldTurkishDiacritics(text);
  if (
    /^(merhaba|selam|nasilsin|kimsin|sen kimsin|ne yapabilirsin|tesekkur\w*|sag ol|iyi gunler|gunaydin)\b/i.test(
      folded
    ) &&
    folded.split(/\s+/).length <= 5
  ) {
    return true;
  }
  if (
    /\?$/.test(text) ||
    /(?:^|[^a-z0-9])(nedir|nasil calis\w*|neden|fark\w*|acikla|karsilastir|algoritma\w*|kac\s*eder|kactir)(?:$|[^a-z0-9])/i.test(
      folded
    )
  ) {
    return true;
  }
  return false;
}

export function isVideoIntentPrompt(prompt: string): boolean {
  if (!prompt) return false;
  const folded = foldTurkishDiacritics(prompt.trim());
  return /(?:^|[^a-z0-9])(video\w*|animasyon\w*|hareketli|klip|klibi|drone ucus\w*|sinema cekim\w*|veo)(?:$|[^a-z0-9])/i.test(
    folded
  );
}

export function isDirectVideoCreationRequest(prompt: string): boolean {
  if (!prompt) return false;
  const text = prompt.trim();
  if (isConversationalOrTechnicalQuestion(text)) {
    return false;
  }
  const folded = foldTurkishDiacritics(text);
  const hasVideoNoun =
    /(?:^|[^a-z0-9])(video\w*|animasyon\w*|klip|klibi|film\w*)(?:$|[^a-z0-9])/i.test(
      folded
    );
  const hasCreateVerb =
    /(?:^|[^a-z0-9])(uret\w*|olustur\w*|yap\w*|yarat\w*|hazirla\w*|cek\w*|sentezle\w*|canlandir\w*|hareketlendir\w*|goster\w*|at|ver|cikar\w*|animate|generate)(?:$|[^a-z0-9])/i.test(
      folded
    );
  if (hasVideoNoun && hasCreateVerb) return true;
  // Natural shorthand such as "İstanbul Boğazı gün batımı videosu" or "istanbul bogazi video"
  if (
    /(?:^|[^a-z0-9])(videosu|videosunu|klibi|klibini|animasyonu)(?:$|[^a-z0-9])/i.test(
      folded
    ) &&
    folded.split(/\s+/).length <= 16
  ) {
    return true;
  }
  return false;
}

export function isDirectImageCreationRequest(prompt: string): boolean {
  if (!prompt) return false;
  const text = prompt.trim();
  if (isConversationalOrTechnicalQuestion(text)) {
    return false;
  }
  if (isDirectVideoCreationRequest(text)) return false;

  const folded = foldTurkishDiacritics(text);

  // Standalone explicit drawing verb such as "sevimli turuncu kedi çiz" or "sapka takan kedi ciz"
  if (
    /(?:^|[^a-z0-9])(ciz|cizsene|cizdir|cizer\s+misin|resmet|draw)(?:$|[^a-z0-9])/i.test(
      folded
    )
  ) {
    return true;
  }

  const hasImageNoun =
    /(?:^|[^a-z0-9])(gorsel\w*|resim|resmi\w*|fotograf\w*|foto|cizim\w*|illustrasyon\w*|poster\w*|duvar kagidi|tablo\w*|photo|image|picture)(?:$|[^a-z0-9])/i.test(
      folded
    );
  const hasCreateVerb =
    /(?:^|[^a-z0-9])(uret\w*|olustur\w*|yap\w*|yarat\w*|ciz\w*|tasarla\w*|hazirla\w*|sentezle\w*|goster\w*|at|ver|cikar\w*|generate|create)(?:$|[^a-z0-9])/i.test(
      folded
    );
  if (hasImageNoun && hasCreateVerb) return true;

  // Natural shorthand such as "kirmizi spor araba fotografi" or "uzayda astronot gorseli"
  if (
    /(?:^|[^a-z0-9])(fotografi|fotografini|resmi|resmini|gorseli|gorselini)(?:$|[^a-z0-9])/i.test(
      folded
    ) &&
    folded.split(/\s+/).length <= 16
  ) {
    return true;
  }
  return false;
}

export function shouldGenerateVideoInChat(
  prompt: string,
  modelId: LuxoModelId
): boolean {
  if (!prompt || !prompt.trim()) return false;
  if (isDirectVideoCreationRequest(prompt)) return true;
  if (isDirectImageCreationRequest(prompt)) return false;
  if (
    isVideoGeneratorChatModel(modelId) &&
    !isConversationalOrTechnicalQuestion(prompt)
  ) {
    return true;
  }
  return false;
}

export function shouldGenerateImageInChat(
  prompt: string,
  modelId: LuxoModelId
): boolean {
  if (!prompt || !prompt.trim()) return false;
  if (isDirectVideoCreationRequest(prompt)) return false;
  if (isDirectImageCreationRequest(prompt)) return true;
  if (
    isImageGeneratorChatModel(modelId) &&
    !isConversationalOrTechnicalQuestion(prompt)
  ) {
    return true;
  }
  return false;
}

export function buildShareUrl(
  baseUrl: string,
  payload: SharedContentPayload,
  options?: { preserveOrigin?: boolean }
): string {
  const safeBase = options?.preserveOrigin
    ? resolveLiveShareOrigin(baseUrl)
    : resolvePublicAppUrl(baseUrl);
  const cleanTitle = sanitizeLuxoBrand(payload.title || 'Luxo AI Paylaşımı')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 90);
  const cleanExcerpt = sanitizeLuxoBrand(
    payload.excerpt || DEFAULT_SEO_DESCRIPTION
  )
    .replace(/```[\s\S]*?```/g, '[Kod Bloğu]')
    .replace(/[*#`_[\]()>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);

  const params = new URLSearchParams();
  params.set('share', '1');
  params.set('type', payload.contentType || 'chat');
  params.set('title', cleanTitle);
  params.set('excerpt', cleanExcerpt);
  if (payload.badge) {
    params.set('badge', sanitizeLuxoBrand(payload.badge).slice(0, 40));
  }
  return `${safeBase}/?${params.toString()}`;
}

export function parseShareParams(
  searchString: string
): SharedContentPayload | null {
  if (!searchString) return null;
  const params = new URLSearchParams(
    searchString.startsWith('?') ? searchString : `?${searchString}`
  );
  if (params.get('share') !== '1') return null;

  const rawTitle = params.get('title') || '';
  const rawExcerpt = params.get('excerpt') || '';
  if (!rawTitle.trim() && !rawExcerpt.trim()) return null;

  const rawType = params.get('type');
  const validType: SharedContentPayload['contentType'] =
    rawType === 'code' ||
    rawType === 'image' ||
    rawType === 'video' ||
    rawType === 'library' ||
    rawType === 'blog' ||
    rawType === 'forum'
      ? rawType
      : 'chat';

  return {
    title: sanitizeLuxoBrand(rawTitle.slice(0, 110)) || 'Luxo AI Paylaşımı',
    excerpt:
      sanitizeLuxoBrand(rawExcerpt.slice(0, 240)) || DEFAULT_SEO_DESCRIPTION,
    contentType: validType,
    badge: params.get('badge')
      ? sanitizeLuxoBrand(String(params.get('badge')).slice(0, 40))
      : undefined,
  };
}

export function buildSocialShareLinks(
  baseUrl: string,
  payload: SharedContentPayload,
  options?: { preserveOrigin?: boolean }
): SocialShareLinks {
  const shareUrl = buildShareUrl(baseUrl, payload, options);
  const cleanTitle = sanitizeLuxoBrand(payload.title || 'Luxo AI').slice(0, 90);
  const cleanExcerpt = sanitizeLuxoBrand(payload.excerpt || '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[*#`_[\]()>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150);

  const fullShareText = cleanExcerpt
    ? `${cleanTitle} — ${cleanExcerpt} (Luxo AI · Gemini 4 Argon)`
    : `${cleanTitle} (Luxo AI · Gemini 4 Argon)`;

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(fullShareText);
  const encodedTitle = encodeURIComponent(`${cleanTitle} | Luxo AI`);

  return {
    shareUrl,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}&hashtags=LuxoAI,Gemini4Argon`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `${fullShareText} ${shareUrl}`
    )}`,
    reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
  };
}

export function buildOpenGraphMeta(
  baseUrl: string,
  shared?: SharedContentPayload | null
): {
  title: string;
  description: string;
  canonicalUrl: string;
  ogImageUrl: string;
} {
  const safeBase = resolvePublicAppUrl(baseUrl);
  if (!shared) {
    return {
      title: DEFAULT_SEO_TITLE,
      description: DEFAULT_SEO_DESCRIPTION,
      canonicalUrl: `${safeBase}/`,
      ogImageUrl: `${safeBase}/api/og-image?title=${encodeURIComponent(
        'Luxo AI · Gemini 4 Argon'
      )}&badge=${encodeURIComponent('NANO BANANA 4K & VEO VİDEO')}`,
    };
  }

  const pageTitle = `${sanitizeLuxoBrand(shared.title).slice(0, 46)} | Luxo AI`;
  const pageDesc = sanitizeLuxoBrand(shared.excerpt).slice(0, 156);
  const canonicalUrl = buildShareUrl(safeBase, shared);
  const badge =
    shared.badge ||
    (shared.contentType === 'code'
      ? 'ARGON AÇIK KAYNAK · MIT'
      : shared.contentType === 'video'
      ? 'GOOGLE VEO · VİDEO SENTEZİ'
      : shared.contentType === 'image'
      ? 'NANO BANANA · GÖRSEL SENTEZ'
      : 'GEMINI 4 ARGON · SÜPER ZEKA');

  const ogImageUrl = `${safeBase}/api/og-image?title=${encodeURIComponent(
    sanitizeLuxoBrand(shared.title).slice(0, 58)
  )}&excerpt=${encodeURIComponent(pageDesc.slice(0, 110))}&badge=${encodeURIComponent(
    badge
  )}`;

  return {
    title: pageTitle,
    description: pageDesc.length >= 40 ? pageDesc : DEFAULT_SEO_DESCRIPTION,
    canonicalUrl,
    ogImageUrl,
  };
}

export interface ParsedMarkdownSegment {
  type: 'text' | 'code';
  text?: string;
  lang?: string;
  code?: string;
}

export function parseMarkdownBlocks(content: string): ParsedMarkdownSegment[] {
  if (!content) return [];
  const safeContent = sanitizeLuxoBrand(content);
  const blocks: ParsedMarkdownSegment[] = [];
  const regex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)(?:```|$)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(safeContent)) !== null) {
    if (match.index > lastIdx) {
      const textPart = safeContent.slice(lastIdx, match.index);
      if (textPart.trim()) {
        blocks.push({ type: 'text', text: textPart });
      }
    }
    const lang = match[1]?.trim() || 'code';
    const code = match[2] || '';
    blocks.push({ type: 'code', lang, code });
    lastIdx = match.index + match[0].length;
    if (match.index === regex.lastIndex) {
      regex.lastIndex++;
    }
  }

  if (lastIdx < safeContent.length) {
    const remaining = safeContent.slice(lastIdx);
    if (remaining.trim()) {
      blocks.push({ type: 'text', text: remaining });
    }
  }

  return blocks;
}

const ECOSYSTEM_PRECISION_DIRECTIVES: Record<LuxoModelCategory, string> = {
  'Google Gemini':
    'Ekosistem Uzmanlığı (Gemini 4 Argon & Hydrogen): Çoklu kısıtları eksiksiz doğrula, yüksek doğruluklu mühendislik, tam kapanan çalışır kod ve bilimsel sentez üret.',
  'OpenAI & ChatGPT':
    'Ekosistem Uzmanlığı (ChatGPT-5.2 & o-Serisi): Algoritmik karmaşıklığı (O(n) / O(log n)) gözet, uç durumları ele al ve doğrudan üretime alınabilir kusursuz çözüm sun.',
  'Anthropic Claude':
    'Ekosistem Uzmanlığı (Claude 4.6): Tip güvenli, yarış durumu (race condition) ve null riski içermeyen, temiz ve eksiksiz kapanan kod blokları ile derinlikli analiz üret.',
  DeepSeek:
    'Ekosistem Uzmanlığı (DeepSeek R2 & Math): Matematiksel işlem önceliğini, işaret dağılımını, modüler mantığı ve birim sağlamasını yanıtlamadan önce iki kez doğrula.',
  'Grok & Meta Llama':
    'Ekosistem Uzmanlığı (Grok 4 & Llama 4): İlk prensiplerden hareket et, açık kaynak mimari, net teknik terminoloji ve çelişkisiz pratik adımlar sun.',
  'Mistral & Qwen':
    'Ekosistem Uzmanlığı (Mistral & Qwen 3): Çok dilli kodlama, SQL/indeks/API optimizasyonu ve yalın mühendislik disipliniyle hatasız yanıtla.',
  'Sinema & Görsel AI':
    'Ekosistem Uzmanlığı (Nano Banana 4K & Veo 3): Optik lens odak uzaklığı, ışık yönü, alan derinliği ve kamera hızı/pan/tilt uyumunu koru.',
  'Perplexity & Küresel AI':
    'Ekosistem Uzmanlığı (Perplexity Sonar & Küresel): Doğrulanabilir olgulara odaklan, spekülasyondan kaçın, kaynak tutarlılığını koru ve net yönetici özeti sun.',
  'Luxo Özel':
    'Ekosistem Uzmanlığı (Luxo Çekirdeği): Sorunun alanına göre en yüksek doğruluklu öz-denetimli sentezi sıfır dolgu cümlesiyle, kristal netliğinde üret.',
};

export function buildModelPrecisionSignature(modelId: LuxoModelId): string {
  const model = LUXO_MODELS[modelId] || LUXO_MODELS['luxo-flash'];
  const idStr = String(modelId);

  if (idStr.includes('hydrogen')) {
    return `Model Çekirdek Disiplini (${model.name}): Yeni nesil Hydrogen çift-aşamalı doğrulama uygula; ilk cümleden itibaren kesin, yapılandırılmış, uç durumları denetlenmiş ve üstün doğruluklu mühendislik sonucu sun.`;
  }
  if (
    idStr.includes('code') ||
    idStr.includes('codestral') ||
    idStr.includes('sonnet') ||
    idStr.includes('dev')
  ) {
    return `Model Çekirdek Disiplini (${model.name}): Üretim kalitesinde tip güvenliği, sıfır bellek sızıntısı, hata yakalama ve O(n)/O(log n) algoritmik verimlilik uygula; kod bloklarını eksiksiz kapat.`;
  }
  if (
    idStr.includes('math') ||
    idStr.includes('prover') ||
    idStr.includes('r1') ||
    idStr.includes('r2') ||
    idStr.includes('o3') ||
    idStr.includes('o4') ||
    idStr.includes('o1') ||
    idStr.includes('qwq')
  ) {
    return `Model Çekirdek Disiplini (${model.name}): Sembolik mantık, işlem önceliği, parantez dağılımı ve birim uyumunu çift yönlü sağlamayla doğrula; nihai sayıyı net yaz.`;
  }
  if (
    idStr.includes('sonar') ||
    idStr.includes('research') ||
    idStr.includes('kimi')
  ) {
    return `Model Çekirdek Disiplini (${model.name}): Yalnızca doğrulanabilir olgulara dayan, spekülatif çıkarımlardan kaçın ve en kritik kanıtları damıtılmış cümlelerle özetle.`;
  }
  if (
    model.category === 'Sinema & Görsel AI' ||
    idStr.includes('image') ||
    idStr.includes('pixtral') ||
    idStr.includes('vl')
  ) {
    return `Model Çekirdek Disiplini (${model.name}): Fiziksel ışık yönü, lens odak uzaklığı (35mm/85mm), kadraj bütünlüğü ve zamansal hareket dengesini koru.`;
  }
  if (
    model.thinkingLevel === 'LOW' ||
    idStr.includes('flash') ||
    idStr.includes('mini') ||
    idStr.includes('nano') ||
    idStr.includes('haiku') ||
    idStr.includes('lite')
  ) {
    return `Model Çekirdek Disiplini (${model.name}): Sıfır gecikmeli ultra-özlü sentez; ilk cümlede doğrudan kesin cevabı ver ve gereksiz yan açıklamalardan kaçın.`;
  }
  return `Model Çekirdek Disiplini (${model.name}): İlk prensiplerden hareket ederek içsel tutarlılığı doğrula ve berrak, uygulanabilir kusursuz sonuç üret.`;
}

export function verifyAndRepairModelOutput(
  rawText: string,
  options?: {
    allowLong?: boolean;
    exactMathProof?: { expression: string; result: string } | null;
    autoVerify?: boolean;
  }
): string {
  let cleaned = cleanAssistantResponse(
    rawText,
    Boolean(options?.allowLong)
  );
  if (!cleaned) return '';

  const shouldVerify = options?.autoVerify !== false;

  if (shouldVerify) {
    // Auto-close unclosed fenced code blocks so markdown renders cleanly even after long streams
    const fenceMatches = cleaned.match(/```/g);
    if (fenceMatches && fenceMatches.length % 2 === 1) {
      cleaned = `${cleaned.trimEnd()}\n\`\`\``;
    }

    const proof = options?.exactMathProof;
    if (proof && proof.result) {
      const escapedFull = proof.result.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const numericTokens = proof.result.match(/-?\d+(?:\.\d+)?/g) || [];
      const hasExactFull =
        cleaned.includes(proof.result) ||
        new RegExp(`(?:^|[^\\d.])${escapedFull}(?:$|[^\\d])`).test(cleaned);
      const hasAllNumericRoots =
        numericTokens.length > 0 &&
        numericTokens.every((num) => {
          const esc = num.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return new RegExp(`(?:^|[^\\d.])${esc}(?:$|[^\\d])`).test(cleaned);
        });
      if (!hasExactFull && !hasAllNumericRoots) {
        return `${cleaned} (Doğrulanmış kesin sonuç: ${proof.expression} ⇒ ${proof.result})`;
      }
    }
  }
  return cleaned;
}

export function buildSystemPrompt(
  modelId: LuxoModelId,
  options?: {
    customInstructions?: string;
    customTone?: string;
    customWarmth?: string;
    customEnthusiasm?: string;
    customFormatting?: string;
    customEmoji?: string;
    memoryItems?: string[];
    projectContext?: string;
    webSearch?: boolean;
    deepReasoning?: boolean;
    synthesisMode?: SynthesisMode;
    learnedDirectives?: string[];
    evolutionGeneration?: number;
    reasoningLevel?: 'fast' | 'balanced' | 'deep';
    responseConciseness?: 'concise' | 'balanced' | 'detailed';
    codeStrictness?: 'production' | 'explained';
    autoVerifyOutputs?: boolean;
  }
): string {
  const model = LUXO_MODELS[modelId] || LUXO_MODELS['luxo-flash'];
  const activeMode =
    SYNTHESIS_MODES.find((m) => m.id === options?.synthesisMode) ||
    SYNTHESIS_MODES[0];

  const persona = getAuthenticPersonaProfile(modelId, model);

  const parts: string[] = [
    model.systemInstruction,
    ECOSYSTEM_PRECISION_DIRECTIVES[model.category],
    persona.systemPersonaDirective,
    buildModelPrecisionSignature(modelId),
    'TEMEL YANIT KALİTESİ VE MÜKEMMELLİK KURALLARI: (1) Yanıta ASLA "Merhaba, ben ...", "Tabii ki", "Elbette", "İşte ..." veya "... olarak yanıt veriyorum" gibi yapay dolgu girişleriyle başlama; ilk kelimeden itibaren doğrudan sorunun özüne ve çözümüne gir (yalnızca kullanıcı açıkça kim olduğunu sorarsa model adını söyle). (2) Çok turlu sohbetlerde önceki kullanıcı soruları ve kendi yanıtlarınla kurulan bağlamı kesintisiz koru; takip sorularında konuyu baştan özetlemek yerine kaldığın yerden derinleştir ve kullanıcı kararlarına sadık kal. (3) Kullanıcının isteminde klavye/yazım hatası veya örtük niyet varsa yüzüne vurmadan asıl kastedilen kavramı eksiksiz kavra; belirsizliği en mantıklı teknik varsayımla çözüp doğrudan uygulanabilir derin çözüm sun. (4) Tüm yanıtları en yüksek doğruluk standardıyla yapılandır: kritik kavramları **kalın** vurgula, gerektiğinde temiz maddeler (- ) veya numaralı adımlar (1. ), sayısal sağlamalar, zaman/bellek karmaşıklığı ve eksiksiz kapanan çalışır kod blokları (```dil ... ```) kullan; süs sembolleri (✦, ⚡, ➤, §) kullanma. (5) Yanıtlamadan önce cevabını sessizce sına: sınır/uç durumlar (null, boş girdi, eşzamanlılık), mantık çelişkisi, eksik kapatılmış parantez/kod bloğu, uydurma API/kütüphane adı veya hatalı sayısal işlem bırakma; bilmediğin veya doğrulanmamış bilgiyi uydurmak yerine açıkça belirt. (6) Yanıtlarında kesinlikle "Argon Kod Stüdyosu", "Argon Stüdyo" veya "Kod Stüdyosu" ifadelerinden bahsetme.',
    `Aktif Sentez Modu (${activeMode.label}): ${activeMode.directive}`,
    `Kimlik ve Gizlilik Kuralları: Seçili model "${model.name}". Kullanıcıya ait veya kurumsal hiçbir kişisel e-posta adresini yanıtlarında gösterme.`,
  ];

  if (options?.learnedDirectives && options.learnedDirectives.length > 0) {
    const genLabel = options.evolutionGeneration
      ? ` (Öz-Gelişim Nesil v${options.evolutionGeneration})`
      : '';
    parts.push(
      `Aktif Otonom Öz-Gelişim Kuralları${genLabel}:\n- ${options.learnedDirectives
        .map((d) => sanitizeLuxoBrand(d))
        .join('\n- ')}`
    );
  }

  if (
    options?.deepReasoning ||
    options?.reasoningLevel === 'deep' ||
    model.thinkingLevel === 'HIGH' ||
    modelId === 'gemini-4-argon' ||
    modelId === 'gemini-4-hydrogen'
  ) {
    parts.push(
      'Derin Akıl Yürütme & Öz-Doğrulama Aktif: Problemi kendi içinde doğrula, sayısal ve mantıksal uç durumları sına, ardından hatasız nihai yanıtı özlü biçimde sun.'
    );
  } else if (options?.reasoningLevel === 'fast') {
    parts.push(
      'Hızlı Çevik Yanıt Modu Aktif: Gereksiz ara basamakları kısalt ve doğrudan kesin sonuca odaklan.'
    );
  }

  if (options?.responseConciseness === 'concise') {
    parts.push(
      'Yanıt Yoğunluğu (Kısa & Öz): En yüksek bilgi yoğunluğuyla, dolgusuz ve doğrudan sonuca giden kısa maddeler halinde yanıtla.'
    );
  } else if (options?.responseConciseness === 'detailed') {
    parts.push(
      'Yanıt Yoğunluğu (Detaylı Analiz): Kavramları derinlemesine aç, uç durumları, zaman/bellek karmaşıklığını ve alternatif yaklaşımları net başlıklarla incele.'
    );
  }

  if (options?.codeStrictness === 'production') {
    parts.push(
      'Kod Kalite Modu (Üretim Standardı): Tüm kod örneklerini eksiksiz, tip güvenli, hata yakalamalı ve gerçek projeye doğrudan yapıştırılabilir biçimde üret; placeholder yorum bırakma.'
    );
  } else if (options?.codeStrictness === 'explained') {
    parts.push(
      'Kod Kalite Modu (Eğitici Açıklamalı): Temiz çalışan kodun yanında kritik tasarım kararlarını ve karmaşıklık nedenlerini adım adım açıklayarak öğret.'
    );
  }

  if (options?.autoVerifyOutputs !== false) {
    parts.push(
      'Otonom Çıktı Denetimi Açık: Tüm matematiksel eşitlikleri ters işlemle kontrol et ve kod bloklarının sözdizimi ile kapanışını doğrula.'
    );
  }

  if (options?.webSearch) {
    parts.push(
      'Canlı Web Araştırması Aktif: Güncel bilgileri doğrulanmış kaynaklarla kısa ve net biçimde özetle.'
    );
  }
  if (options?.customTone && options.customTone !== 'Varsayılan') {
    parts.push(`Tercih edilen üslup ve ton: ${options.customTone}.`);
  }
  if (options?.customWarmth && options.customWarmth !== 'Varsayılan') {
    parts.push(`Samimiyet düzeyi: ${options.customWarmth}.`);
  }
  if (options?.customEnthusiasm && options.customEnthusiasm !== 'Varsayılan') {
    parts.push(`Coşku düzeyi: ${options.customEnthusiasm}.`);
  }
  if (options?.customFormatting && options.customFormatting !== 'Varsayılan') {
    parts.push(`Başlık ve liste kullanımı: ${options.customFormatting}.`);
  }
  if (options?.customEmoji && options.customEmoji !== 'Varsayılan') {
    parts.push(`Emoji kullanımı: ${options.customEmoji}.`);
  }
  if (options?.memoryItems && options.memoryItems.length > 0) {
    const safeMemories = options.memoryItems
      .map((m) => sanitizeLuxoBrand(m))
      .filter((m) => !/argon\s+kod\s+stüdyo|argon\s+stüdyo/iu.test(m));
    if (safeMemories.length > 0) {
      parts.push(`Kullanıcı Belleği:\n- ${safeMemories.join('\n- ')}`);
    }
  }
  if (options?.projectContext) {
    parts.push(
      `Aktif Proje Bağlamı: ${sanitizeLuxoBrand(options.projectContext)}`
    );
  }
  if (options?.customInstructions?.trim()) {
    parts.push(
      `Kullanıcı Özel Talimatları: ${sanitizeLuxoBrand(
        options.customInstructions.trim()
      )}`
    );
  }

  return parts.join('\n\n');
}

export interface AutoRouteDecision {
  targetModelId: LuxoModelId;
  domainLabel: string;
  autoWebSearch: boolean;
  autoDeepReasoning: boolean;
}

function pickBoostedCategoryModel(
  defaultModelId: LuxoModelId,
  evolutionState?: SelfEvolutionState | null,
  availableProviders?: ProviderConnectionStatusMap
): LuxoModelId {
  if (!evolutionState?.modelBoosts) return defaultModelId;
  const targetCategory = LUXO_MODELS[defaultModelId]?.category;
  if (!targetCategory) return defaultModelId;

  let bestId: LuxoModelId = defaultModelId;
  let bestDelta =
    evolutionState.modelBoosts[defaultModelId]?.accuracyDelta || 0;

  for (const [mId, boost] of Object.entries(evolutionState.modelBoosts)) {
    const typedId = mId as LuxoModelId;
    const cfg = LUXO_MODELS[typedId];
    const spec = getModelTokenSpec(typedId);
    const isExecutable = availableProviders
      ? isModelExecutableWithProviders(typedId, availableProviders).unlocked
      : spec.provider === 'google' ||
        spec.provider === 'luxo' ||
        spec.provider === 'media'
      ? LIVE_VERIFIED_GOOGLE_MODELS.has(typedId)
      : true;
    if (
      cfg &&
      isExecutable &&
      cfg.category === targetCategory &&
      boost.accuracyDelta > bestDelta
    ) {
      bestDelta = boost.accuracyDelta;
      bestId = typedId;
    }
  }
  return bestId;
}

export interface AutoRouterScoreInput {
  prompt: string;
  reasoningLevel?: 'fast' | 'balanced' | 'deep';
  codeStrictness?: 'production' | 'explained';
  webSearch?: boolean;
  hasAttachment?: boolean;
  evolutionState?: SelfEvolutionState | null;
  availableProviders?: ProviderConnectionStatusMap;
}

export interface AutoRouterScoredDecision extends AutoRouteDecision {
  scoreBreakdown: {
    modelId: LuxoModelId;
    score: number;
    reason: string;
  }[];
  reasoningLevelUsed: 'fast' | 'balanced' | 'deep';
  codeStrictnessUsed: 'production' | 'explained';
}

export function scoreAutoRouterModel(
  input: AutoRouterScoreInput
): AutoRouterScoredDecision {
  const clean = (input.prompt || '').trim();
  const folded = foldTurkishDiacritics(clean);
  const reasoningLevelUsed: 'fast' | 'balanced' | 'deep' =
    input.reasoningLevel === 'fast' || input.reasoningLevel === 'deep'
      ? input.reasoningLevel
      : 'balanced';
  const codeStrictnessUsed: 'production' | 'explained' =
    input.codeStrictness === 'explained' ? 'explained' : 'production';

  const canRunModel = (mId: LuxoModelId): boolean => {
    if (input.availableProviders) {
      return isModelExecutableWithProviders(mId, input.availableProviders).unlocked;
    }
    const spec = getModelTokenSpec(mId);
    if (spec.provider === 'google' || spec.provider === 'luxo' || spec.provider === 'media') {
      return LIVE_VERIFIED_GOOGLE_MODELS.has(mId);
    }
    return true;
  };

  // Hard deterministic media gates stay top-priority when Google Media is usable
  if (isDirectImageCreationRequest(clean) && canRunModel('nano-banana-2-1-ultra')) {
    const picked = pickBoostedCategoryModel(
      'nano-banana-2-1-ultra',
      input.evolutionState,
      input.availableProviders
    );
    return {
      targetModelId: picked,
      domainLabel: 'Nano Banana 4K Fotoğraf Sentezi',
      autoWebSearch: false,
      autoDeepReasoning: false,
      scoreBreakdown: [{ modelId: picked, score: 100, reason: 'Doğrudan 4K görsel sentezi' }],
      reasoningLevelUsed,
      codeStrictnessUsed,
    };
  }

  if (
    (isVideoIntentPrompt(clean) ||
      /\b(sahne|kamera|lens|storyboard|sinematik|film|isiklandirma|gorsel istem|render)\b/i.test(
        folded
      )) &&
    canRunModel('veo-3-cinema-pro')
  ) {
    const picked = pickBoostedCategoryModel(
      'veo-3-cinema-pro',
      input.evolutionState,
      input.availableProviders
    );
    return {
      targetModelId: picked,
      domainLabel: 'Sinema & Görsel Yönetmenlik',
      autoWebSearch: false,
      autoDeepReasoning: false,
      scoreBreakdown: [{ modelId: picked, score: 100, reason: 'Video ve sahne yönlendirme niyeti' }],
      reasoningLevelUsed,
      codeStrictnessUsed,
    };
  }

  const isMath =
    /(?:\d+\s*[+\-*/^%]\s*\d+)|(?:-?\d*\s*x\s*(?:\^\s*2|²|[+\-]\s*\d+)\s*=)|(?:\b(?:denklem\w*|kok\w*|integral\w*|turev\w*|olasilik\w*|yuzde\w*|karekok\w*|faktoriyel\w*|ebob\w*|ekok\w*|kombinasyon\w*|permutasyon\w*|ortalama\w*|logaritma\w*|matris\w*|istatistik\w*|hesapla\w*|kac eder|kactir)\b)/i.test(
      folded
    );
  const isSql = /\b(sql|postgresql|mysql|sqlite|veritabani|indeks|sorgu)\b/i.test(folded);
  const isSecurityOrArch =
    /\b(guvenlik|zafiyet|owasp|audit|denetim|mimari tasarim|sistem tasarimi|mikroservis|dagitik|deadlock|kok neden)\b/i.test(
      folded
    );
  const isCode =
    /\b(kod|kodu|fonksiyon|script|class|sinif|typescript|javascript|python|react|node|rust|golang|html|css|api|algoritma|hata ayikla|bug|refactor|docker|kubernetes|git)\b/i.test(
      folded
    );
  const isWeb =
    Boolean(input.webSearch) ||
    /\b(guncel|haber|bugun(?:ku|ki)?\s+(?:haber|kur|fiyat|hava|mac)|2025|2026|fiyat|kur|hava durumu|son gelisme|arastir|kaynak)\b/i.test(
      folded
    ) ||
    /https?:\/\/\S+/i.test(clean);
  const isEditorial =
    /\b(cevir|ingilizce|almanca|fransizca|ispanyolca|hikaye|siir|metin yaz|slogan|e-posta|mail|ozetle|duzelt)\b/i.test(
      folded
    );

  const scores: Partial<Record<LuxoModelId, { score: number; reason: string }>> = {
    'gemini-4-hydrogen': { score: 44, reason: 'Yüksek doğruluklu canlı Gemini 4 Hydrogen' },
    'gemini-4-carbon': { score: 40, reason: 'Kurumsal kod ve güvenlik Gemini 4 Carbon' },
    'gemini-3-1-flash-lite': { score: 38, reason: 'Ultra hızlı canlı Gemini Flash Lite' },
    'claude-4-5-sonnet': { score: 32, reason: 'Temiz yazılım mimarisi ve Türkçe üslup' },
    'deepseek-math-v2': { score: 25, reason: 'Sayısal ve cebirsel matematik motoru' },
    'qwen-3-coder-plus': { score: 24, reason: 'SQL ve veritabanı optimizasyonu' },
    'perplexity-sonar-pro': { score: 24, reason: 'Canlı web ve kaynak arama' },
    'gpt-4-5-orion': { score: 24, reason: 'Dil, çeviri ve editoryal akış' },
  };

  const bump = (id: LuxoModelId, delta: number, reason?: string) => {
    const prev = scores[id] || { score: 0, reason: 'Aday model' };
    scores[id] = { score: prev.score + delta, reason: reason || prev.reason };
  };

  if (reasoningLevelUsed === 'fast') {
    bump('gemini-3-1-flash-lite', 24, 'Hızlı akıl yürütme tercihi (fast)');
    bump('gemini-4-hydrogen', 16, 'Düşük gecikmeli sentez (fast)');
    bump('gemini-4-carbon', -4);
  } else if (reasoningLevelUsed === 'deep') {
    bump('gemini-4-carbon', 22, 'Derin muhakeme tercihi (deep)');
    bump('gemini-4-hydrogen', 16, 'Derin bağlam ve muhakeme (deep)');
    bump('claude-4-5-sonnet', 14, 'Çok adımlı derin analiz (deep)');
  } else {
    bump('gemini-4-hydrogen', 12, 'Dengeli hız/doğruluk tercihi');
  }

  if (isCode || isSecurityOrArch || isSql) {
    if (codeStrictnessUsed === 'production') {
      bump('gemini-4-carbon', 22, 'Üretime hazır katı kod standardı (production)');
      bump('claude-4-5-sonnet', 20, 'Üretime hazır modüler kod (production)');
      if (isSql) bump('qwen-3-coder-plus', 30, 'SQL / veritabanı uzmanı + production');
    } else {
      bump('gemini-4-hydrogen', 24, 'Öğretici açıklamalı kod tercihi (explained)');
      bump('gpt-4-5-orion', 18, 'Açıklayıcı adım adım anlatım (explained)');
    }
  }

  if (isMath) bump('deepseek-math-v2', 48, 'Matematiksel denklem ve sayısal hesaplama');
  if (isSql) bump('qwen-3-coder-plus', 40, 'SQL ve indeks sorgu tasarımı');
  if (isSecurityOrArch) bump('gemini-4-carbon', 32, 'Güvenlik denetimi ve sistem mimarisi');
  if (isCode && !isSecurityOrArch && !isSql) bump('claude-4-5-sonnet', 28, 'Yazılım mühendisliği ve temiz kod');
  if (isWeb) bump('perplexity-sonar-pro', 45, 'Canlı web araştırması ve güncel veri');
  if (isEditorial && !isCode) bump('gpt-4-5-orion', 34, 'Editoryal dil ve çeviri');
  if (input.hasAttachment) bump('gemini-4-hydrogen', 18, 'Çok modlu dosya & uzun bağlam analizi');

  if (input.evolutionState?.modelBoosts) {
    for (const [mId, boost] of Object.entries(input.evolutionState.modelBoosts)) {
      if (mId in scores && boost?.accuracyDelta) {
        bump(mId as LuxoModelId, Math.round(boost.accuracyDelta * 4));
      }
    }
  }

  const rankedAll = (
    Object.entries(scores) as [LuxoModelId, { score: number; reason: string }][]
  ).sort((a, b) => b[1].score - a[1].score);
  const executableRanked = rankedAll.filter(([mId]) => canRunModel(mId));
  const pool = executableRanked.length > 0 ? executableRanked : rankedAll;
  const top = pool[0]?.[0] || 'gemini-4-hydrogen';
  const targetModelId = pickBoostedCategoryModel(
    top,
    input.evolutionState,
    input.availableProviders
  );

  const domainMap: Partial<Record<LuxoModelId, string>> = {
    'deepseek-math-v2': 'Matematik & Sayısal Doğrulama',
    'qwen-3-coder-plus': 'Veritabanı & SQL Optimizasyonu',
    'gemini-4-carbon': 'Sistem Mimarisi, Güvenlik & Katı Kodlama',
    'claude-4-5-sonnet': 'Yazılım Mühendisliği & Temiz Mimari',
    'perplexity-sonar-pro': 'Canlı Web & Kaynak Doğrulama',
    'gpt-4-5-orion': 'Dil, Çeviri & Açıklamalı Sentez',
    'gemini-3-1-flash-lite': 'Ultra Hızlı Anlık Muhakeme',
    'gemini-4-hydrogen': 'Kuantum Hızında Doğrulanmış Yanıt',
  };

  return {
    targetModelId,
    domainLabel: domainMap[targetModelId] || 'Amiral Gemisi Akıllı Yönlendirme',
    autoWebSearch: isWeb || targetModelId === 'perplexity-sonar-pro',
    autoDeepReasoning:
      reasoningLevelUsed === 'deep' || isMath || isSecurityOrArch || isCode,
    scoreBreakdown: pool.slice(0, 4).map(([mId, v]) => ({
      modelId: mId,
      score: v.score,
      reason: v.reason,
    })),
    reasoningLevelUsed,
    codeStrictnessUsed,
  };
}

export function resolveAutoRoutedModel(
  prompt: string,
  evolutionState?: SelfEvolutionState | null,
  preferences?: {
    reasoningLevel?: 'fast' | 'balanced' | 'deep';
    codeStrictness?: 'production' | 'explained';
    webSearch?: boolean;
    hasAttachment?: boolean;
    availableProviders?: ProviderConnectionStatusMap;
  }
): AutoRouteDecision {
  const scored = scoreAutoRouterModel({
    prompt,
    reasoningLevel: preferences?.reasoningLevel,
    codeStrictness: preferences?.codeStrictness,
    webSearch: preferences?.webSearch,
    hasAttachment: preferences?.hasAttachment,
    evolutionState,
    availableProviders: preferences?.availableProviders,
  });
  return {
    targetModelId: scored.targetModelId,
    domainLabel: scored.domainLabel,
    autoWebSearch: scored.autoWebSearch,
    autoDeepReasoning: scored.autoDeepReasoning,
  };
}

function gcdInt(a: number, b: number): number {
  let x = Math.abs(Math.trunc(a));
  let y = Math.abs(Math.trunc(b));
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

export function evaluateSafeMathExpression(
  prompt: string
): { expression: string; result: string } | null {
  if (!prompt) return null;
  const normalized = prompt
    .replace(/,/g, '.')
    .replace(/×/g, '*')
    .replace(/÷/g, '/');

  // Quadratic equation solver first (before linear): e.g. "x^2 - 5x + 6 = 0" or "2x^2 + 3x - 2 = 0"
  const quadMatch = normalized.match(
    /(?:^|[^\w])(-?\d*(?:\.\d+)?)\s*x\s*(?:\^\s*2|²)\s*([+-]\s*\d*(?:\.\d+)?\s*x)?\s*([+-]\s*\d+(?:\.\d+)?)?\s*=\s*(-?\d+(?:\.\d+)?)/i
  );
  if (quadMatch) {
    const parseCoef = (raw?: string, defaultOne = false): number => {
      if (!raw) return 0;
      const compact = raw.replace(/x/gi, '').replace(/\s+/g, '');
      if (compact === '' || compact === '+') return defaultOne ? 1 : 0;
      if (compact === '-') return defaultOne ? -1 : 0;
      return Number(compact);
    };
    const a = parseCoef(quadMatch[1] || '+', true);
    const b = quadMatch[2] ? parseCoef(quadMatch[2], true) : 0;
    const cLeft = quadMatch[3] ? parseCoef(quadMatch[3], false) : 0;
    const rhs = Number(quadMatch[4]);
    const c = cLeft - rhs;
    if (Number.isFinite(a) && a !== 0 && Number.isFinite(b) && Number.isFinite(c)) {
      const disc = b * b - 4 * a * c;
      const fmtNum = (n: number) =>
        Number.isInteger(n) ? String(n) : Number(n.toFixed(4)).toString();
      const eqLabel = `${a === 1 ? '' : a === -1 ? '-' : a}x²${b >= 0 ? ` + ${b}x` : ` - ${Math.abs(b)}x`}${c >= 0 ? ` + ${c}` : ` - ${Math.abs(c)}`} = 0`;
      if (Math.abs(disc) < 1e-12) {
        const root = -b / (2 * a);
        return { expression: eqLabel, result: `x = ${fmtNum(root)}` };
      }
      if (disc > 0) {
        const r1 = (-b - Math.sqrt(disc)) / (2 * a);
        const r2 = (-b + Math.sqrt(disc)) / (2 * a);
        const sorted = [r1, r2].sort((u, v) => u - v);
        return {
          expression: eqLabel,
          result: `x₁ = ${fmtNum(sorted[0])}, x₂ = ${fmtNum(sorted[1])}`,
        };
      }
    }
  }

  // Linear single-variable equation solver: e.g. "2x + 7 = 31", "3x - 12 = 42", "5x = 35"
  const linMatch = normalized.match(
    /(?:^|[^\w^])(-?\d*(?:\.\d+)?)\s*x\s*([+-]\s*\d+(?:\.\d+)?)?\s*=\s*(-?\d+(?:\.\d+)?)/i
  );
  if (linMatch && !/x\s*(?:\^|²)/i.test(normalized)) {
    const rawA = (linMatch[1] || '').replace(/\s+/g, '');
    const a = rawA === '' || rawA === '+' ? 1 : rawA === '-' ? -1 : Number(rawA);
    const rawB = (linMatch[2] || '0').replace(/\s+/g, '');
    const b = Number(rawB);
    const c = Number(linMatch[3]);
    if (Number.isFinite(a) && a !== 0 && Number.isFinite(b) && Number.isFinite(c)) {
      const xVal = (c - b) / a;
      const fmtX = Number.isInteger(xVal)
        ? String(xVal)
        : Number(xVal.toFixed(6)).toString();
      const bStr = b === 0 ? '' : b > 0 ? ` + ${b}` : ` - ${Math.abs(b)}`;
      return {
        expression: `${a === 1 ? '' : a === -1 ? '-' : a}x${bStr} = ${c}`,
        result: `x = ${fmtX}`,
      };
    }
  }

  // GCD / LCM helper: e.g. "12 ve 18 sayılarının ekoku" or "ebob(24, 36)"
  const gcdLcmFnMatch = prompt.match(
    /\b(ebob|ekok)\s*\(\s*(\d+)\s*[,;\-\s]\s*(\d+)\s*\)/iu
  );
  const gcdLcmProseMatch = prompt.match(
    /\b(\d+)\s*(?:ve|ile|,)\s*(\d+)\b[^?.!]*?\b(ebob\w*|ekok\w*)/iu
  );
  let gcdLcmSolved: { expression: string; num: number } | null = null;
  if (gcdLcmFnMatch || gcdLcmProseMatch) {
    const kind = (
      gcdLcmFnMatch ? gcdLcmFnMatch[1] : gcdLcmProseMatch![3]
    ).toLowerCase();
    const a = Number(gcdLcmFnMatch ? gcdLcmFnMatch[2] : gcdLcmProseMatch![1]);
    const b = Number(gcdLcmFnMatch ? gcdLcmFnMatch[3] : gcdLcmProseMatch![2]);
    if (Number.isInteger(a) && Number.isInteger(b) && a > 0 && b > 0) {
      const g = gcdInt(a, b);
      if (kind.startsWith('ebob')) {
        gcdLcmSolved = { expression: `EBOB(${a}, ${b})`, num: g };
      } else {
        const l = (a / g) * b;
        gcdLcmSolved = { expression: `EKOK(${a}, ${b})`, num: l };
      }
    }
  }

  // Combination helper: C(n, r) or "10'un 3'lü kombinasyonu"
  const combMatch =
    prompt.match(/\bC\s*\(\s*(\d{1,2})\s*[,;]\s*(\d{1,2})\s*\)/i) ||
    prompt.match(
      /\b(\d{1,2})(?:'?[uüıi]n)?\s+(\d{1,2})(?:'?l[uüıi])?\s+kombinasyon\w*/iu
    );
  let combSolved: { expression: string; num: number } | null = null;
  if (combMatch) {
    const n = Number(combMatch[1]);
    const r = Number(combMatch[2]);
    if (Number.isInteger(n) && Number.isInteger(r) && r >= 0 && r <= n && n <= 30) {
      const k = Math.min(r, n - r);
      let res = 1;
      for (let i = 1; i <= k; i++) {
        res = (res * (n - k + i)) / i;
      }
      combSolved = { expression: `C(${n}, ${r})`, num: Math.round(res) };
    }
  }

  // Compound combination + GCD/LCM synthesis (e.g. "12 ve 18 ekoku ile C(10, 3) toplamı")
  if (gcdLcmSolved && combSolved) {
    if (/\bfark\w*/iu.test(prompt)) {
      return {
        expression: `${gcdLcmSolved.expression} - ${combSolved.expression}`,
        result: String(gcdLcmSolved.num - combSolved.num),
      };
    }
    if (/\bçarpım\w*|\bcarpim\w*/iu.test(prompt)) {
      return {
        expression: `${gcdLcmSolved.expression} * ${combSolved.expression}`,
        result: String(gcdLcmSolved.num * combSolved.num),
      };
    }
    return {
      expression: `${gcdLcmSolved.expression} + ${combSolved.expression}`,
      result: String(gcdLcmSolved.num + combSolved.num),
    };
  }

  const allNumbersCount = (prompt.match(/-?\d+(?:[.,]\d+)?/g) || []).length;
  const hasCompoundWordOp =
    /\b(toplam\w*|fark\w*|çarpım\w*|carpim\w*|bölüm\w*|bolum\w*)\b/iu.test(
      prompt
    );

  if (gcdLcmSolved && !(hasCompoundWordOp && allNumbersCount > 2)) {
    return {
      expression: gcdLcmSolved.expression,
      result: String(gcdLcmSolved.num),
    };
  }
  if (combSolved && !(hasCompoundWordOp && allNumbersCount > 2)) {
    return {
      expression: combSolved.expression,
      result: String(combSolved.num),
    };
  }

  // Arithmetic average helper: e.g. "10, 20, 30 ve 40 sayılarının ortalaması"
  if (/\bortalama\w*/iu.test(prompt)) {
    const nums = (prompt.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
    if (nums.length >= 2 && nums.every((v) => Number.isFinite(v))) {
      const avg = nums.reduce((acc, v) => acc + v, 0) / nums.length;
      const formatted = Number.isInteger(avg)
        ? String(avg)
        : avg.toFixed(4).replace(/\.?0+$/, '');
      return {
        expression: `Ortalama(${nums.join(', ')})`,
        result: formatted,
      };
    }
  }

  // Square root helper: e.g. "karekök 144" or "√144"
  const sqrtMatch = normalized.match(
    /(?:karekök|karekok|√)\s*\(?\s*(\d+(?:\.\d+)?)\s*\)?/iu
  );
  if (sqrtMatch) {
    const rad = Number(sqrtMatch[1]);
    if (Number.isFinite(rad) && rad >= 0) {
      const val = Math.sqrt(rad);
      const formatted = Number.isInteger(val)
        ? String(val)
        : val.toFixed(6).replace(/\.?0+$/, '');
      return {
        expression: `√${rad}`,
        result: formatted,
      };
    }
  }

  // Factorial helper: e.g. "6!" or "6 faktöriyel"
  const factMatch = normalized.match(
    /\b(\d{1,2})\s*(?:!|faktöriyel|faktoriyel)\b/iu
  );
  if (factMatch) {
    const n = Number(factMatch[1]);
    if (Number.isInteger(n) && n >= 0 && n <= 20) {
      let acc = 1;
      for (let i = 2; i <= n; i++) acc *= i;
      return {
        expression: `${n}!`,
        result: String(acc),
      };
    }
  }



  // Turkish power helper: e.g. "2 üzeri 10"
  const powTrMatch = normalized.match(
    /(-?\d+(?:\.\d+)?)\s*(?:üzeri|uzeri|üssü|ussu)\s*(-?\d+(?:\.\d+)?)/iu
  );
  if (powTrMatch) {
    const b = Number(powTrMatch[1]);
    const e = Number(powTrMatch[2]);
    const val = Math.pow(b, e);
    if (Number.isFinite(val)) {
      const formatted = Number.isInteger(val)
        ? String(val)
        : val.toFixed(6).replace(/\.?0+$/, '');
      return {
        expression: `${b}^${e}`,
        result: formatted,
      };
    }
  }

  // Percentage increase / decrease / plain helper
  const pctDeltaMatch = normalized.match(
    /(\d+(?:\.\d+)?)(?:\s*(?:ms|tl|sn|gb|mb|sayısının|değerinden|degerinden|'nin|'in|'ün|'un))*\s*(?:%\s*(\d+(?:\.\d+)?)|yüzde\s*(\d+(?:\.\d+)?))\s*(fazlasının\s+yarısı|fazlası|artışı|eksiği|indirimi|iyileştirilirse|azaltılırsa)?/iu
  );
  if (pctDeltaMatch) {
    const base = Number(pctDeltaMatch[1]);
    const pct = Number(pctDeltaMatch[2] || pctDeltaMatch[3]);
    const modifier = (pctDeltaMatch[4] || '').toLowerCase();
    if (Number.isFinite(base) && Number.isFinite(pct)) {
      let val = (base * pct) / 100;
      let exprLabel = `${base} × %${pct}`;
      if (modifier.includes('fazlasının') && modifier.includes('yarısı')) {
        val = (base * (1 + pct / 100)) / 2;
        exprLabel = `(${base} + %${pct}) / 2`;
      } else if (modifier.includes('fazlası') || modifier.includes('artışı')) {
        val = base * (1 + pct / 100);
        exprLabel = `${base} + %${pct}`;
      } else if (
        modifier.includes('eksiği') ||
        modifier.includes('indirimi') ||
        modifier.includes('iyileştirilirse') ||
        modifier.includes('azaltılırsa')
      ) {
        val = base * (1 - pct / 100);
        exprLabel = `${base} - %${pct}`;
      }
      const formatted = Number.isInteger(val)
        ? String(val)
        : val.toFixed(4).replace(/\.?0+$/, '');
      return {
        expression: exprLabel,
        result: formatted,
      };
    }
  }

  const exprMatch = normalized.match(
    /(?:^|[^\w.])((?:\(\s*)*-?\d+(?:\.\d+)?(?:\s*\))*(?:\s*[+\-*/^]\s*(?:\(\s*)*-?\d+(?:\.\d+)?(?:\s*\))*)+)/
  );
  if (!exprMatch) return null;

  const rawExpr = exprMatch[1].trim();
  const tokens = rawExpr.match(/\d+(?:\.\d+)?|[+\-*/^()]/g);
  if (!tokens || tokens.length < 3) return null;

  let pos = 0;
  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  const parseExpr = (): number => {
    let left = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = consume();
      const right = parseTerm();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  };

  const parseTerm = (): number => {
    let left = parsePower();
    while (peek() === '*' || peek() === '/') {
      const op = consume();
      const right = parsePower();
      if (op === '/' && right === 0) return NaN;
      left = op === '*' ? left * right : left / right;
    }
    return left;
  };

  const parsePower = (): number => {
    const base = parseFactor();
    if (peek() === '^') {
      consume();
      const exp = parsePower();
      return Math.pow(base, exp);
    }
    return base;
  };

  const parseFactor = (): number => {
    if (peek() === '-') {
      consume();
      return -parseFactor();
    }
    if (peek() === '+') {
      consume();
      return parseFactor();
    }
    if (peek() === '(') {
      consume();
      const inner = parseExpr();
      if (peek() !== ')') return NaN;
      consume();
      return inner;
    }
    const tok = consume();
    const num = Number(tok);
    return Number.isFinite(num) ? num : NaN;
  };

  const value = parseExpr();
  if (pos !== tokens.length || !Number.isFinite(value)) return null;

  const formatted = Number.isInteger(value)
    ? String(value)
    : Number(value.toFixed(6)).toString();
  return { expression: rawExpr, result: formatted };
}

export interface SmartResponseOutput {
  text: string;
  thinkingSteps: string[];
  citations?: CitationItem[];
  followUpSuggestions: string[];
  routedModelId?: LuxoModelId;
}

export function generateLocalSmartResponse(
  prompt: string,
  modelId: LuxoModelId = 'luxo-flash',
  options?: {
    webSearch?: boolean;
    deepReasoning?: boolean;
    synthesisMode?: SynthesisMode;
    conversationHistory?: ConversationTurnInput[];
    attachmentInfo?: { name?: string; mimeType?: string };
  }
): SmartResponseOutput {
  const autoRoute =
    modelId === 'luxo-auto-router' ? resolveAutoRoutedModel(prompt) : null;
  const effectiveModelId: LuxoModelId = autoRoute
    ? autoRoute.targetModelId
    : modelId;
  const model = LUXO_MODELS[effectiveModelId] || LUXO_MODELS['luxo-flash'];
  const cleanPrompt = sanitizeLuxoBrand(prompt.trim());
  const lower = cleanPrompt.toLowerCase();
  const modeObj =
    SYNTHESIS_MODES.find((m) => m.id === options?.synthesisMode) ||
    SYNTHESIS_MODES[0];

  const persona = getAuthenticPersonaProfile(effectiveModelId, model);

  const forceSearch =
    Boolean(options?.webSearch) ||
    Boolean(autoRoute?.autoWebSearch) ||
    effectiveModelId === 'perplexity-sonar-pro' ||
    effectiveModelId === 'perplexity-reasoning' ||
    effectiveModelId === 'perplexity-research';

  const baseThinkingSteps: string[] = [
    ...(autoRoute
      ? [
          `Luxo Auto-Router devreye girdi: "${autoRoute.domainLabel}" alanı algılandı ve ${model.name} seçildi`,
        ]
      : []),
    ...persona.buildThinkingTrace(
      cleanPrompt.slice(0, 64) || 'Genel İstem'
    ),
    `${model.name} çekirdeği ve "${modeObj.label}" modu etkinleştirildi`,
  ];

  const citations: CitationItem[] | undefined = forceSearch
    ? [
        {
          title: 'MDN Web Docs — Modern Web Standartları ve Mimari Rehber',
          domain: 'developer.mozilla.org',
          url: 'https://developer.mozilla.org',
          snippet:
            'Doğrulanmış tarayıcı API standartları, güvenlik ve performans ilkeleri.',
        },
        {
          title: 'Web.dev — Core Web Vitals ve Mühendislik Ölçütleri',
          domain: 'web.dev',
          url: 'https://web.dev/articles/vitals',
          snippet:
            'Gerçek saha performansı, güvenilirlik ve ölçeklenebilir sistem pratikleri.',
        },
      ]
    : undefined;

  const mathSolved = evaluateSafeMathExpression(cleanPrompt);
  if (mathSolved) {
    const mathLead =
      persona.archetype === 'deepseek-reasoning' ||
      persona.archetype === 'openai-reasoning'
        ? `**Doğrulanmış Hesaplama:** \`${mathSolved.expression} = ${mathSolved.result}\`\n\nİşlem önceliği, parantez hiyerarşisi ve aritmetik sağlama deterministik olarak kontrol edildi; kesin sonuç **${mathSolved.result}** değeridir.`
        : persona.archetype === 'grok'
        ? `İşin net matematiği: \`${mathSolved.expression}\` işleminin kesin sonucu **${mathSolved.result}**. İşlem önceliği ve sınır kontrolleri doğrulandı.`
        : `İşlemin kesin sonucu **${mathSolved.result}** değeridir (\`${mathSolved.expression} = ${mathSolved.result}\`). Sayısal işlem önceliği ve parantez kuralları doğrulanmıştır.`;

    return {
      thinkingSteps: [
        ...baseThinkingSteps,
        `Sayısal ifade doğrulandı: ${mathSolved.expression} = ${mathSolved.result}`,
      ],
      citations,
      routedModelId: effectiveModelId,
      followUpSuggestions: [
        'İşlemin adım adım sağlamasını göster',
        'Farklı bir sayısal senaryo ile hesapla',
        'Sonucu yüzde artış/azalış olarak yorumla',
      ],
      text: mathLead,
    };
  }

  if (
    /^(merhaba|selam|selamlar|hey|iyi günler|iyi akşamlar|günaydın|kimsin|sen kimsin|nasılsın)\b/iu.test(
      lower
    )
  ) {
    const greetingByArchetype =
      persona.archetype === 'claude'
        ? `Merhaba, ben **${model.name}**. Karmaşık yazılım mimarilerinden derin metin analizine ve stratejik problem çözümüne kadar üzerinde çalıştığınız konuyu nüanslarıyla birlikte ele alabiliriz. Aklınızdaki soruyu veya projeyi paylaşmanız yeterli.`
        : persona.archetype === 'grok'
        ? `Selam! **${model.name}** devrede. Dolgu cümleleri yok; kod, mimari, matematik ya da strateji fark etmez, doğrudan çözmek istediğin problemi gönder başlayalım.`
        : persona.archetype === 'deepseek-reasoning'
        ? `Merhaba. **${model.name}** analitik muhakeme ve kod sentez motoru aktif. Algoritmik tasarım, matematiksel doğrulama veya sistem mühendisliği problemlerinizi doğrudan iletebilirsiniz.`
        : persona.archetype === 'openai-chat' ||
          persona.archetype === 'openai-reasoning'
        ? `Merhaba! Ben **${model.name}**. Kod geliştirme, teknik analiz, araştırma veya içerik kurgulama konularında adım adım ve doğrudan uygulanabilir çözümler üretmek için hazırım. Nereden başlayalım?`
        : `Merhaba! Ben **${model.name}**. Çok modlu analiz, temiz kod üretimi ve yapılandırılmış problem çözümü için hazırım; üzerinde çalıştığınız konuyu doğrudan yazabilirsiniz.`;

    return {
      thinkingSteps: baseThinkingSteps,
      citations,
      routedModelId: effectiveModelId,
      followUpSuggestions: [
        'Yan Yana Karşılaştır ile iki farklı modeli aynı soruda dene',
        'Temiz bir TypeScript hız sınırlayıcı (rate limiter) kodu yaz',
        'Web performansı ve teknik SEO için 3 kritik adımı göster',
      ],
      text: greetingByArchetype,
    };
  }

  if (isCinemaDirectorModel(effectiveModelId)) {
    const shortTopic = cleanPrompt.split('\n')[0].slice(0, 90);
    return {
      thinkingSteps: baseThinkingSteps,
      citations,
      routedModelId: effectiveModelId,
      followUpSuggestions: [
        'Bu sahneyi Görsel & Video Stüdyosunda 4K videoya dönüştür',
        '9:16 dikey format için kamera açısını uyarla',
        'Sahne için ışık ve renk tonunu detaylandır',
      ],
      text: `**${model.name} Sahne Yönetmenliği Planı (${shortTopic}):**\n\n- **Optik & Kadraj:** 35mm anamorfik prime lens, sığ alan derinliği (f/1.8) ve yumuşak kontur (rim) aydınlatması.\n- **Kamera Hareketi:** Yavaş ve sarsıntısız yörünge (dolly-orbit) geçişiyle ana özneyi ön planda ayırın.\n- **Atmosfer & Akış:** Doğal hacimsel ışık kırılması ve dengeli renk kontrastıyla sahne derinliğini koruyun.\n\nDoğrudan MP4 video üretmek için **"Bunun videosunu oluştur"** yazmanız yeterlidir.`,
    };
  }

  return synthesizeAuthenticModelResponse({
    prompt: cleanPrompt,
    modelId: effectiveModelId,
    model,
    routedModelId: effectiveModelId,
    autoRouteDomainLabel: autoRoute?.domainLabel || null,
    forceSearch,
    synthesisMode: options?.synthesisMode,
    conversationHistory: options?.conversationHistory,
    attachmentInfo: options?.attachmentInfo,
  });
}

export function buildConsensusFusionPrompt(
  originalQuestion: string,
  modelAId: LuxoModelId,
  contentA: string,
  modelBId: LuxoModelId,
  contentB: string
): string {
  const nameA = LUXO_MODELS[modelAId]?.name || modelAId;
  const nameB = LUXO_MODELS[modelBId]?.name || modelBId;
  return `Kullanıcının sorusu için ${nameA} ve ${nameB} modellerinin verdiği iki yanıtı inceleyip en doğru noktaları birleştirerek KISA, ÖZ ve SADE tek bir ortak yanıt oluştur (en fazla 4-5 cümle; garip semboller kullanma ve Argon Kod Stüdyosu'ndan bahsetme):

Soru: ${sanitizeLuxoBrand(originalQuestion).slice(0, 600)}

${nameA} Yanıtı: ${cleanAssistantResponse(contentA).slice(0, 1800)}

${nameB} Yanıtı: ${cleanAssistantResponse(contentB).slice(0, 1800)}`;
}

export function generateProceduralArtwork(
  prompt: string,
  style: string = 'Sinematik',
  aspectRatio: VisualAspectRatio = '1:1'
): string {
  return renderPromptAwareSvgArtwork(sanitizeLuxoBrand(prompt), style, aspectRatio);
}

export const INITIAL_CHATS = [
  {
    id: 'sample-1',
    title: 'Yüksek Trafikli Sistemlerde Önbellek',
    modelId: 'gemini-4-argon' as LuxoModelId,
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
    messages: [
      {
        id: 'm1',
        role: 'user' as const,
        content:
          'Yüksek trafikli bir sistem için en dayanıklı önbellek ve hız sınırlama stratejisi nedir?',
        timestamp: Date.now() - 3600000,
      },
      {
        id: 'm2',
        role: 'assistant' as const,
        content:
          'Yüksek trafikli sistemlerde en dayanıklı çözüm, uygulama belleğinde çalışan hızlı bir LRU önbelleği dağıtık Redis katmanıyla birleştirmektir. Aynı anda gelen binlerce isteğin veritabanını kilitlemesini önlemek için istek birleştirme (singleflight) ve ani yük sıçramalarını yumuşatmak için Token Bucket hız sınırlayıcı kullanılmalıdır.',
        timestamp: Date.now() - 3590000,
        modelId: 'gemini-4-argon' as LuxoModelId,
        thinkingSteps: [
          'Önbellek izdihamı ve gecikme darboğazları değerlendirildi',
          'En sade ve yüksek dayanımlı mimari özetlendi',
        ],
        followUpSuggestions: [
          'Token Bucket ile kayan pencere farkını kısaca açıkla',
          'Bu konuyu Claude 4 Sonnet ile yan yana karşılaştır',
        ],
      },
    ],
  },
  {
    id: 'sample-2',
    title: 'Bulut Depolama Alternatifleri',
    modelId: 'luxo-flash' as LuxoModelId,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    messages: [
      {
        id: 'm3-1',
        role: 'user' as const,
        content: 'Güvenilir ve hızlı bulut depolama alternatifleri nelerdir?',
        timestamp: Date.now() - 86400000,
      },
      {
        id: 'm3-2',
        role: 'assistant' as const,
        content:
          'En güvenilir seçenekler arasında Google Drive (kolay ekip paylaşımı), Proton Drive (uçtan uca şifreli gizlilik), pCloud (yüksek indirme hızı) ve MEGA (geniş ücretsiz depolama alanı) öne çıkar.',
        timestamp: Date.now() - 86350000,
        modelId: 'luxo-flash' as LuxoModelId,
      },
    ],
  },
];

export const INITIAL_PROJECTS: LuxoProject[] = [
  {
    id: 'proj-1',
    name: 'Argon Açık Kaynak SaaS Mimarisi',
    description:
      'MIT lisanslı çok kiracılı bulut mikroservis altyapısı, yetkilendirme katmanı ve API geçidi tasarımı.',
    systemPrompt:
      'Tüm yanıtları yüksek erişilebilirlikli mikroservis mimarisi ve TypeScript/Node.js standartlarına göre ver.',
    category: 'Yazılım',
    updatedAt: Date.now() - 3600000,
    filesCount: 6,
    color: '#059669',
  },
  {
    id: 'proj-2',
    name: 'Gemini 4 Argon Çıkarım Optimizasyonu',
    description:
      'Kuantizasyon, düşük gecikmeli çıkarım ve bellek ayak izi iyileştirme araştırmaları.',
    systemPrompt:
      'Matematiksel formülleri, benchmark tablolarını ve optimizasyon adımlarını detaylı açıkla.',
    category: 'Araştırma',
    updatedAt: Date.now() - 28800000,
    filesCount: 4,
    color: '#4f46e5',
  },
  {
    id: 'proj-3',
    name: '2026 Ürün Lansman & Sosyal Büyüme',
    description:
      'Küresel büyüme metrikleri, sosyal medya OpenGraph paylaşım dönüşümü ve içerik yol haritası.',
    systemPrompt:
      'Büyüme odaklı, somut KPI ve dönüşüm metriklerine dayanan stratejik öneriler sun.',
    category: 'İş & Strateji',
    updatedAt: Date.now() - 86400000,
    filesCount: 8,
    color: '#2563eb',
  },
];

export const INITIAL_LIBRARY_ITEMS: LibraryItem[] = [
  {
    id: 'lib-1',
    title: 'Gemini 4 Argon Sistem Mimarisi Şablonu',
    summary:
      'Yüksek eşzamanlılıkta mikroservis, önbellek ve devre kesici tasarım rehberi.',
    content:
      'Gemini 4 Argon öz-denetimli mimari ilkeleri: O(1) veri yapıları, Singleflight önbellek koruması ve sıfır güven (Zero-Trust) doğrulama katmanları.',
    type: 'code',
    tab: 'Önerilenler',
    createdAt: '1 saat önce',
    isFavorite: true,
  },
  {
    id: 'lib-2',
    title: 'Nano Banana 4K & Veo Sinematik İstemler',
    summary:
      'Fotogerçekçi 4K görsel ve 16:9 / 9:16 video üretimi için kamera & ışıklandırma parametreleri.',
    content:
      '35mm ARRI Alexa lens, altın saat hacimsel ışıklandırma, sığ alan derinliği ve pürüzsüz kamera yörünge hareketleri.',
    type: 'image',
    tab: 'Önerilenler',
    createdAt: 'Bugün',
    isFavorite: true,
  },
  {
    id: 'lib-3',
    title: 'Proje Notları & Yol Haritası',
    summary:
      'Luxo AI çekirdek güncellemeleri, Nöral Ses Stüdyosu ve Açık Kaynak Argon entegrasyonu.',
    content:
      '1. Gemini 4 Argon yönlendirme\n2. Nano Banana 2.1 & Google Veo Video Stüdyosu\n3. Sosyal medya OpenGraph önizleme altyapısı',
    type: 'document',
    tab: 'Önerilenler',
    createdAt: '2 gün önce',
    isFavorite: true,
  },
  {
    id: 'lib-4',
    title: 'Tasarım Şablonları',
    summary:
      'Modern arayüz bileşenleri, tipografik hiyerarşi ve renk kontrast standartları.',
    content:
      'Plus Jakarta Sans ve JetBrains Mono eşleşmesiyle kurumsal tasarım sistemi.',
    type: 'image',
    tab: 'Önerilenler',
    createdAt: '3 gün önce',
  },
  {
    id: 'lib-5',
    title: 'Web Kaynakları & API Dizini',
    summary:
      'Doğrulanmış açık kaynak veri kümeleri ve REST/GraphQL uç noktaları.',
    content: 'Yüksek doğruluklu bilimsel ve teknik API referans listesi.',
    type: 'web',
    tab: 'Önerilenler',
    createdAt: '4 gün önce',
  },
  {
    id: 'lib-6',
    title: 'Kod Parçacıkları (TypeScript)',
    summary:
      'Sık kullanılan asenkron kuyruk, önbellek (LRU) ve doğrulama yardımcıları.',
    content:
      'export class LRUCache<K, V> { /* Hızlı bellek içi açık kaynak önbellek */ }',
    type: 'code',
    tab: 'Favoriler',
    createdAt: '5 gün önce',
    isFavorite: true,
  },
];

export const INITIAL_ROUTINES: ScheduledRoutine[] = [
  {
    id: 'routine-1',
    title: 'Sabah Yapay Zeka & Teknoloji Özeti',
    time: '08:30 (Her gün)',
    modelId: 'luxo-flash',
    prompt:
      'Bugünün en önemli yapay zeka, yazılım ve bulut teknolojisi gelişmelerini 5 maddede özetle.',
    active: true,
    lastRun: 'Bugün 08:30',
  },
  {
    id: 'routine-2',
    title: 'Gemini 4 Argon Mimari & Kod İncelemesi',
    time: 'Pazartesi 10:00',
    modelId: 'gemini-4-argon',
    prompt:
      'Bu haftanın öne çıkan TypeScript, React, Rust ve açık kaynak sistem mimarisi pratiklerini kod örnekleriyle derle.',
    active: true,
    lastRun: 'Pazartesi 10:00',
  },
  {
    id: 'routine-3',
    title: 'Günlük Akademik & Teknik Terim Analizi',
    time: '19:00 (Hafta içi)',
    modelId: 'luxo-ultra',
    prompt:
      'İleri düzey bir bilgisayar bilimi veya sistem mühendisliği kavramını gerçek dünya örneğiyle açıkla.',
    active: false,
    lastRun: 'Dün 19:00',
  },
];

export const INITIAL_PLUGINS: LuxoPlugin[] = [
  {
    id: 'web-search',
    name: 'Canlı Web Araştırma Motoru',
    category: 'Araştırma',
    description:
      'Güncel haberleri, teknik belgeleri ve doğrulanmış kaynakları gerçek zamanlı tarar.',
    enabled: true,
    color: '#2563eb',
  },
  {
    id: 'argon-sandbox',
    name: 'Açık Kaynak Argon Yürütücü (MIT)',
    category: 'Geliştirici',
    description:
      'HTML, CSS, JavaScript ve algoritmik kod bloklarını izole ortamda canlı çalıştırır.',
    enabled: true,
    color: '#059669',
  },
  {
    id: 'nano-banana-veo',
    name: 'Nano Banana 4K & Google Veo Video Motoru',
    category: 'Görsel & Video',
    description:
      'Nano Banana 2.1 ile 4K görsel ve Google Veo / Omni Flash ile sinematik video üretir.',
    enabled: true,
    color: '#d97706',
  },
  {
    id: 'neural-voice-tts',
    name: 'Nöral Ses & Çift Konuşmacılı Podcast',
    category: 'Ses Stüdyosu',
    description:
      'Gemini 3.8 TTS ile stüdyo kalitesinde WAV seslendirme ve iki kişilik podcast üretir.',
    enabled: true,
    color: '#7c3aed',
  },
];

export const INITIAL_VISUALS: GeneratedVisual[] = [
  {
    id: 'vid-showcase-1',
    mediaType: 'video',
    title: 'Altın Saat İstanbul Boğazı Drone Sineması',
    prompt:
      'Altın saat ışığında İstanbul Boğazı köprüsü üzerinde akıcı sinematik drone uçuşu ve parlayan deniz yansımaları',
    style: 'Sinematik · Sinematik Drone Akışı',
    aspectRatio: '16:9',
    engineLabel: 'Google Veo & LTX Sinema · Gerçek MP4',
    modelUsed: 'gemini-omni-1.2-flash',
    resolution: '720P HD',
    duration: '5s',
    videoUrl: '/api/videos/showcase-veo.mp4',
    posterUrl: '/assets/showcase/showcase-veo-poster.jpg',
    dataUrl: '/assets/showcase/showcase-veo-poster.jpg',
    createdAt: Date.now() - 1200000,
  },
  {
    id: 'vis-1',
    mediaType: 'image',
    title: 'Derin Uzayda Süzülen Astronot ve Dünya Ufku',
    prompt:
      'Derin uzayda süzülen beyaz astronot, Dünya ufku ve parlayan yıldızlar',
    style: 'Sinematik',
    aspectRatio: '16:9',
    engineLabel: 'Nano Banana 2.1 · 4K Gerçek Fotoğraf',
    resolution: '4K',
    dataUrl: '/assets/showcase/astronaut-space.jpg',
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'vis-2',
    mediaType: 'image',
    title: 'Karlı Alpler Zirvesinde Altın Saat Gün Batımı',
    prompt:
      'Karlı Alpler zirvesinde altın saat gün batımı ve çam ormanı',
    style: 'Fotogerçekçi',
    aspectRatio: '1:1',
    engineLabel: 'Nano Banana Pro · Gerçek Fotoğraf',
    resolution: '2K',
    dataUrl: '/assets/showcase/alps-sunset.jpg',
    createdAt: Date.now() - 7200000,
  },
];

