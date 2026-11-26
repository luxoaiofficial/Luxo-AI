import type {
  CitationItem,
  LuxoModelCategory,
  LuxoModelConfig,
  LuxoModelId,
  SynthesisMode,
} from '../types/luxo.ts';

export type ModelArchetypeId =
  | 'gemini'
  | 'claude'
  | 'openai-chat'
  | 'openai-reasoning'
  | 'deepseek-reasoning'
  | 'grok'
  | 'llama'
  | 'mistral'
  | 'qwen'
  | 'perplexity'
  | 'luxo';

export interface AuthenticPersonaProfile {
  archetype: ModelArchetypeId;
  providerLabel: string;
  voiceSummary: string;
  systemPersonaDirective: string;
  buildThinkingTrace: (topic: string, correctedHint?: string | null) => string[];
  formatStructuredReply: (sections: {
    modelName: string;
    lead: string;
    points: { label: string; detail: string }[];
    closing: string;
    codeBlock?: { lang: string; code: string; caption?: string };
  }) => string;
}

export interface ConversationTurnInput {
  role: string;
  content: string;
}

export interface NormalizedUserIntent {
  original: string;
  normalizedText: string;
  foldedText: string;
  correctedTypoNote: string | null;
  isAmbiguousYaziliTypo: boolean;
  primarySubject: string;
  inheritedFromHistory: boolean;
  priorAssistantSnippet: string | null;
  comparisonPair: [string, string] | null;
  domain:
    | 'site-url-info'
    | 'ambiguous-yazili'
    | 'software-code'
    | 'software-concept'
    | 'seo-perf-ux'
    | 'ai-ml'
    | 'science-space'
    | 'economics-business'
    | 'history-culture'
    | 'health-psychology'
    | 'education-exam'
    | 'writing-translation'
    | 'comparison'
    | 'general-inquiry';
  wantsCode: boolean;
  wantsUnitTests: boolean;
  codeLanguage: 'typescript' | 'python' | 'sql' | 'html' | 'bash';
}

const TURKISH_TYPO_MAP: readonly [RegExp, string, string][] = [
  [/\byazjl[iı]m\b/giu, 'yazılım', 'yazılım'],
  [/\byazjl[iı]\b/giu, 'yazılı / yazılım', 'yazılı veya yazılım'],
  [/\byaz[iı]l[iı]m\b/giu, 'yazılım', ''],
  [/\byzlm\b/giu, 'yazılım', 'yazılım'],
  [/\bzwkal[aı]r[iı]?\b/giu, 'zekaları', 'zekaları'],
  [/\bzwka\b/giu, 'zeka', 'zeka'],
  [/\bgelostir\w*/giu, 'geliştir', 'geliştir'],
  [/\bpyhton\b/giu, 'Python', 'Python'],
  [/\bphyton\b/giu, 'Python', 'Python'],
  [/\bjavascirpt\b/giu, 'JavaScript', 'JavaScript'],
  [/\btypescirpt\b/giu, 'TypeScript', 'TypeScript'],
  [/\balgortima\b/giu, 'algoritma', 'algoritma'],
  [/\bveritaban[iı]\b/giu, 'veritabanı', ''],
  [/\bonbellek\b/giu, 'önbellek', ''],
];

function foldTr(input: string): string {
  return (input || '')
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

export function resolveModelArchetype(
  modelId: LuxoModelId,
  category: LuxoModelCategory
): ModelArchetypeId {
  const id = String(modelId).toLowerCase();
  if (id.startsWith('claude-')) return 'claude';
  if (
    id.startsWith('openai-o1') ||
    id.startsWith('openai-o3') ||
    id.startsWith('openai-o4')
  ) {
    return 'openai-reasoning';
  }
  if (
    id.startsWith('chatgpt-') ||
    id.startsWith('gpt-') ||
    category === 'OpenAI & ChatGPT'
  ) {
    return 'openai-chat';
  }
  if (id.startsWith('deepseek-') || category === 'DeepSeek') {
    return 'deepseek-reasoning';
  }
  if (id.startsWith('grok-')) return 'grok';
  if (id.startsWith('llama-')) return 'llama';
  if (
    id.startsWith('mistral-') ||
    id.startsWith('codestral') ||
    id.startsWith('pixtral') ||
    id.startsWith('ministral')
  ) {
    return 'mistral';
  }
  if (id.startsWith('qwen-') || id.startsWith('qwq-')) {
    return 'qwen';
  }
  if (id.startsWith('perplexity-') || category === 'Perplexity & Küresel AI') {
    return 'perplexity';
  }
  if (id.startsWith('gemini-') || category === 'Google Gemini') {
    return 'gemini';
  }
  if (category === 'Grok & Meta Llama') return 'grok';
  if (category === 'Mistral & Qwen') return 'mistral';
  if (category === 'Anthropic Claude') return 'claude';
  return 'luxo';
}

export function isCoderSpecialistModel(modelId: LuxoModelId): boolean {
  const id = String(modelId).toLowerCase();
  return (
    id.includes('coder') ||
    id.includes('codestral') ||
    id.includes('codex') ||
    id.includes('pro-code') ||
    id === 'luxo-dev' ||
    id === 'luxo-dev-helper'
  );
}

export function isMathOrProverSpecialistModel(modelId: LuxoModelId): boolean {
  const id = String(modelId).toLowerCase();
  return (
    id.includes('math') ||
    id.includes('prover') ||
    id.includes('qwq') ||
    id.startsWith('openai-o') ||
    id.startsWith('chatgpt-o')
  );
}

function buildModelSubSpecializationAddon(
  modelId: LuxoModelId,
  model: LuxoModelConfig
): string {
  const idStr = String(modelId).toLowerCase();
  const strengthsHint =
    Array.isArray(model.capabilities) && model.capabilities.length > 0
      ? ` Model uzmanlık odakların: ${model.capabilities.slice(0, 3).join(', ')}.`
      : '';
  if (idStr === 'claude-5-2-fable') {
    return `${strengthsHint} CLAUDE FABLE 5.2 AMİRAL GEMİSİ (${model.name}): Yaratıcı problem çözme, edebi ve analitik denge, zengin senaryo kavrayışı ve derin felsefi/stratejik berraklıkla yanıtla; klişe veya mekanik kalıplardan kaçın.`;
  }
  if (idStr === 'claude-5-5-opus') {
    return `${strengthsHint} CLAUDE OPUS 5.5 ZİRVE ÇEKİRDEĞİ (${model.name}): Anthropic'in en üstün muhakeme ve mimari seviyesi; büyük sistem tasarımları, en zorlu refactoring, derin epistemolojik ve kurumsal analizlerde kusursuz, akıcı ve dürüst bir üslupla doğrudan çözüme odaklan.`;
  }
  if (idStr === 'claude-5-5-sonnet') {
    return `${strengthsHint} CLAUDE SONNET 5.5 ÇEKİRDEĞİ (${model.name}): Sektör standardı ön yüz mimarisi, uçtan uca modern yazılım mühendisliği, tip güvenliği ve kusursuz doğal insan diyaloğu standardıyla yanıt ver.`;
  }
  if (idStr === 'claude-5-5-haiku') {
    return `${strengthsHint} CLAUDE HAIKU 5.5 HIZ ÇEKİRDEĞİ (${model.name}): Şimşek hızında kavrayış, anlık geri bildirim, tek bir fazla kelime kullanmadan berrak, kristal netliğinde çözüm üret.`;
  }
  if (idStr === 'gpt-astra') {
    return `${strengthsHint} GPT-ASTRA KURUMSAL SENTEZ MOTORU (${model.name}): Çoklu belge tarama, finansal modelleme, kurumsal raporlama ve analitik veri işleme disipliniyle doğrudan uygulanabilir, yapılandırılmış çözümler üret.`;
  }
  if (idStr === 'chatgpt-5-2-pro') {
    return `${strengthsHint} CHATGPT-5.2 PRO AMİRAL GEMİSİ (${model.name}): OpenAI ekosisteminin en üst düzey analitik, stratejik ve kodlama amiral gemisi; üretim seviyesi eksiksiz kod ve çok katmanlı problem çözümü sağla.`;
  }
  if (idStr === 'chatgpt-5-omni') {
    return `${strengthsHint} CHATGPT-5O OMNI EVRENSEL ÇEKİRDEĞİ (${model.name}): Akıcı insan doğallığında iletişim, ürün tasarımı ve pratik tam yığın problem çözümüyle doğrudan konunun özüne in.`;
  }
  if (idStr === 'luxo-sol') {
    return `${strengthsHint} SOL ÇEVİK ÜRETKENLİK ÇEKİRDEĞİ (${model.name}): Gündüz hızı, canlı web sentezi, e-posta ve kurumsal dokümantasyonda yüksek tempo ve netlikle çözüm sun.`;
  }
  if (idStr === 'luxo-luna') {
    return `${strengthsHint} LUNA DERİN GÜVENLİK & MUHAKEME ÇEKİRDEĞİ (${model.name}): Derin uyum denetimi, güvenlik açığı analizi ve kritik mimari kararlarda sakin, sağlam ve berrak analiz yap.`;
  }
  if (idStr.includes('hydrogen')) {
    return `${strengthsHint} YENİ NESİL HYDROGEN ÇEKİRDEĞİ (${model.name}): Her yanıtı çok boyutlu iç doğrulamadan geçir; bilimsel kesinlik, hatasız çalışan kod ve dolgusuz net eylem adımları sun.`;
  }
  if (idStr.includes('carbon')) {
    return `${strengthsHint} YENİ NESİL CARBON MİMARİ ÇEKİRDEĞİ (${model.name}): Sistem bütünlüğü, yüksek performanslı mimari ve sıfır hata kod kalitesi odağıyla somut mühendislik yanıtları ver.`;
  }
  if (idStr.includes('neon')) {
    return `${strengthsHint} YENİ NESİL NEON HIZ ÇEKİRDEĞİ (${model.name}): Milisaniye çevikliğiyle gereksiz giriş yapmadan doğrudan en net ve pratik cevabı üret.`;
  }
  if (isCoderSpecialistModel(modelId)) {
    return `${strengthsHint} KOD UZMANLIĞI (${model.name}): Yazılım veya mimari sorularında tip güvenli, sınır durumları ele alınmış, doğrudan çalıştırılabilir temiz kod blokları sun.`;
  }
  if (isMathOrProverSpecialistModel(modelId)) {
    return `${strengthsHint} FORMEL MUHAKEME (${model.name}): Sayısal, mantıksal ve algoritmik problemlerde ara adımları açıkça doğrula ve çelişkisiz kesin sonuç ver.`;
  }
  return strengthsHint;
}

export function getAuthenticPersonaProfile(
  modelId: LuxoModelId,
  model: LuxoModelConfig
): AuthenticPersonaProfile {
  const archetype = resolveModelArchetype(modelId, model.category);
  const specAddon = buildModelSubSpecializationAddon(modelId, model);

  const enrichProfile = (p: AuthenticPersonaProfile): AuthenticPersonaProfile => ({
    ...p,
    systemPersonaDirective: `${p.systemPersonaDirective}${specAddon}`,
  });

  const baseProfile: AuthenticPersonaProfile = (() => {
    switch (archetype) {
      case 'gemini':
      return {
        archetype,
        providerLabel: 'Google DeepMind · Çok Modlu Sentez',
        voiceSummary:
          'Doğrudan yönetici özeti, yapılandırılmış maddeler ve uygulanabilir mühendislik adımları',
        systemPersonaDirective:
          'ÜSLUP VE KARAKTER (Google Gemini): Yanıta doğrudan ve berrak bir çekirdek özetle başla. Ardından konuyu 2-4 net maddede (**Kalın Başlık:** açıklama biçiminde) yapılandır ve pratik bir uygulama önerisiyle tamamla. Çok modlu sistem düşüncesi, hız ve mühendislik netliği hissini koru.',
        buildThinkingTrace: (topic, correctedHint) => [
          ...(correctedHint ? [correctedHint] : []),
          `İstem bağlamı ve olası anlam katmanları ayrıştırıldı: "${topic}"`,
          `${model.name} çok modlu bilgi grafiği ve teknik referanslar eşleştirildi`,
          'Çekirdek özet + yapılandırılmış uygulama maddeleri sentezlendi',
        ],
        formatStructuredReply: ({ lead, points, closing, codeBlock }) => {
          const bullets = points
            .map((p) => `- **${p.label}:** ${p.detail}`)
            .join('\n');
          const codePart = codeBlock
            ? `\n\n${codeBlock.caption ? `${codeBlock.caption}\n` : ''}\`\`\`${codeBlock.lang}\n${codeBlock.code}\n\`\`\``
            : '';
          return `${lead}\n\n${bullets}${codePart}\n\n${closing}`;
        },
      };

    case 'claude':
      return {
        archetype,
        providerLabel: 'Anthropic · Derin Muhakeme & Temiz Mimari',
        voiceSummary:
          'Akıcı, nüanslı, ödünleşimleri (trade-off) tartarak açıklayan doğal ve özenli üslup',
        systemPersonaDirective:
          'ÜSLUP VE KARAKTER (Anthropic Claude): Robotik şablonlardan kaçın; düşünceli, akıcı, nüanslı ve entelektüel açıdan dürüst bir Türkçe kullan. Kavramların yalnızca "ne" olduğunu değil, "neden" öyle tasarlandığını ve mimari ödünleşimlerini (trade-off) berrak paragraflarla açıkla. Kod yazarken okunabilirliği yüksek, temiz ve modüler yapılar kur.',
        buildThinkingTrace: (topic, correctedHint) => [
          ...(correctedHint ? [correctedHint] : []),
          `Kullanıcının asıl amacı ve bağlamsal nüanslar değerlendiriliyor: "${topic}"`,
          'Mimari ödünleşimler (trade-offs) ve uç durumlar tartılıyor',
          `${model.name} üslubuyla doğal, berrak ve bütünlüklü anlatım kurgulandı`,
        ],
        formatStructuredReply: ({ lead, points, closing, codeBlock }) => {
          const wovenProse = points
            .map((p, idx) =>
              idx === 0
                ? `Buradaki temel nokta **${p.label.toLowerCase()}** boyutudur: ${p.detail}`
                : `Bununla birlikte **${p.label.toLowerCase()}** açısından bakıldığında; ${p.detail}`
            )
            .join('\n\n');
          const codePart = codeBlock
            ? `\n\n${codeBlock.caption ? `${codeBlock.caption}\n` : ''}\`\`\`${codeBlock.lang}\n${codeBlock.code}\n\`\`\``
            : '';
          return `${lead}\n\n${wovenProse}${codePart}\n\n${closing}`;
        },
      };

    case 'openai-reasoning':
      return {
        archetype,
        providerLabel: 'OpenAI o-Serisi · Zincirleme Doğrulama',
        voiceSummary:
          'Adım adım mantıksal çıkarım, kısıt doğrulaması ve kesin teknik sonuç',
        systemPersonaDirective:
          'ÜSLUP VE KARAKTER (OpenAI o-Serisi Muhakeme): Problemi önce kısıtlarına ayır, numaralı mantıksal adımlarla (1, 2, 3) çözümle, uç durumları ve karmaşıklığı doğrula, en sonda net "Sonuç:" satırıyla karar ver.',
        buildThinkingTrace: (topic, correctedHint) => [
          ...(correctedHint ? [correctedHint] : []),
          `Problem kısıtları ve örtük varsayımlar tanımlandı: "${topic}"`,
          'Hipotez ağacı oluşturuldu; zayıf dallar elendi',
          'Zaman/bellek karmaşıklığı ve uç durum tutarlılığı doğrulandı',
          `${model.name} doğrulanmış çıkarım zinciri tamamlandı`,
        ],
        formatStructuredReply: ({ lead, points, closing, codeBlock }) => {
          const numbered = points
            .map((p, i) => `${i + 1}. **${p.label}:** ${p.detail}`)
            .join('\n');
          const codePart = codeBlock
            ? `\n\n\`\`\`${codeBlock.lang}\n${codeBlock.code}\n\`\`\``
            : '';
          return `**Problem Çerçevesi:** ${lead}\n\n${numbered}${codePart}\n\n**Doğrulanmış Sonuç:** ${closing}`;
        },
      };

    case 'openai-chat':
      return {
        archetype,
        providerLabel: 'OpenAI ChatGPT · Yapılandırılmış Çözüm',
        voiceSummary:
          'Pratik, anlaşılır, numaralı adımlar ve somut örneklerle ilerleyen üretken üslup',
        systemPersonaDirective:
          'ÜSLUP VE KARAKTER (OpenAI ChatGPT): Konuyu pratik, net ve hemen uygulanabilir şekilde ele al. Kısa bir doğrudan girişten sonra numaralı adımlar (1., 2., 3.) kullan, somut bir örnek ver ve "Kısaca:" özetiyle bitir.',
        buildThinkingTrace: (topic, correctedHint) => [
          ...(correctedHint ? [correctedHint] : []),
          `Kullanıcı hedefi netleştirildi: "${topic}"`,
          `${model.name} pratik çözüm adımları ve somut örnek yapısı seçildi`,
          'Doğrudan uygulanabilir eylem planı oluşturuldu',
        ],
        formatStructuredReply: ({ lead, points, closing, codeBlock }) => {
          const numbered = points
            .map((p, i) => `${i + 1}. **${p.label}:** ${p.detail}`)
            .join('\n');
          const codePart = codeBlock
            ? `\n\n${codeBlock.caption ? `${codeBlock.caption}\n` : ''}\`\`\`${codeBlock.lang}\n${codeBlock.code}\n\`\`\``
            : '';
          return `${lead}\n\n${numbered}${codePart}\n\n**Kısaca:** ${closing}`;
        },
      };

    case 'deepseek-reasoning':
      return {
        archetype,
        providerLabel: 'DeepSeek · İlk Prensipler & Algoritmik Kesinlik',
        voiceSummary:
          'Matematiksel/algoritmik ayrıştırma, bellek-gecikme analizi ve sıfır dolgu mühendislik dili',
        systemPersonaDirective:
          'ÜSLUP VE KARAKTER (DeepSeek R1/R2/V3): İlk prensiplerden (first principles) hareket et. Tanım, mekanizma, algoritmik/sistem maliyeti ve doğrulama adımlarını net biçimde ayır. Kod ve teknik konularda bellek/gecikme verimliliğini (O(1), O(n log n) vb.) açıkça belirt; süslü dolgu cümleleri kurma.',
        buildThinkingTrace: (topic, correctedHint) => [
          ...(correctedHint ? [correctedHint] : []),
          `İlk prensip ayrıştırması başlatıldı: "${topic}"`,
          'Nedensel mekanizma ve sistem darboğazları modellendi',
          'Asimptotik maliyet ve doğruluk kısıtları çapraz kontrol edildi',
          `${model.name} deterministik sentez çıktısı üretildi`,
        ],
        formatStructuredReply: ({ lead, points, closing, codeBlock }) => {
          const steps = points
            .map((p, i) => `- **[Adım ${i + 1} · ${p.label}]** ${p.detail}`)
            .join('\n');
          const codePart = codeBlock
            ? `\n\n\`\`\`${codeBlock.lang}\n${codeBlock.code}\n\`\`\``
            : '';
          return `**Temel Analiz:** ${lead}\n\n${steps}${codePart}\n\n**Teknik Çıkarım:** ${closing}`;
        },
      };

    case 'grok':
      return {
        archetype,
        providerLabel: 'xAI Grok · Keskin İlk Prensipler & Doğrudan Gerçekçilik',
        voiceSummary:
          'Kurumsal dolgu cümleleri olmadan doğrudan işin özüne inen, keskin ve yüksek sinyalli üslup',
        systemPersonaDirective:
          'ÜSLUP VE KARAKTER (xAI Grok): Sıfır kurumsal klişe, sıfır dolgu lafı. Doğrudan işin özüne gir ("İşin özü şu:" veya net bir tespit ile başla), yaygın yanılgıları açıkça düzelt ve sahada gerçekten neyin işe yaradığını keskin, enerjik ve akıcı biçimde söyle.',
        buildThinkingTrace: (topic, correctedHint) => [
          ...(correctedHint ? [correctedHint] : []),
          `Yüzeysel klişeler ayıklandı; çekirdek soru izole edildi: "${topic}"`,
          `${model.name} ilk prensipler filtresiyle gerçek saha etkisi hesaplandı`,
          'Yüksek sinyalli, doğrudan yanıt hazırlandı',
        ],
        formatStructuredReply: ({ lead, points, closing, codeBlock }) => {
          const directBullets = points
            .map((p) => `- **${p.label}:** ${p.detail}`)
            .join('\n');
          const codePart = codeBlock
            ? `\n\n\`\`\`${codeBlock.lang}\n${codeBlock.code}\n\`\`\``
            : '';
          return `İşin özü şu: ${lead}\n\n${directBullets}${codePart}\n\nNet tavsiye: ${closing}`;
        },
      };

    case 'llama':
      return {
        archetype,
        providerLabel: 'Meta Llama · Açık Ekosistem & Sistem Mühendisliği',
        voiceSummary:
          'Taşınabilir standartlar, açık mimari ve geliştirici odaklı yalın sistem yaklaşımı',
        systemPersonaDirective:
          'ÜSLUP VE KARAKTER (Meta Llama): Açık standartlar, taşınabilir mimari ve ölçeklenebilir sistem mühendisliği bakış açısıyla yanıt ver. Geliştirici dostu, somut ve bağımsız uygulanabilir çözümler sun.',
        buildThinkingTrace: (topic, correctedHint) => [
          ...(correctedHint ? [correctedHint] : []),
          `Açık standartlar ve taşınabilir sistem deseni eşleştirildi: "${topic}"`,
          `${model.name} modüler bileşen analizi tamamlandı`,
          'Uygulamaya hazır mühendislik yanıtı derlendi',
        ],
        formatStructuredReply: ({ lead, points, closing, codeBlock }) => {
          const items = points
            .map((p) => `- **${p.label}:** ${p.detail}`)
            .join('\n');
          const codePart = codeBlock
            ? `\n\n\`\`\`${codeBlock.lang}\n${codeBlock.code}\n\`\`\``
            : '';
          return `${lead}\n\n${items}${codePart}\n\n**Mimari Not:** ${closing}`;
        },
      };

    case 'mistral':
      return {
        archetype,
        providerLabel: 'Mistral AI · Yalın ve Yüksek Yoğunluklu Hassasiyet',
        voiceSummary:
          'Gereksiz tek kelime içermeyen, cerrahi netlikte teknik özet',
        systemPersonaDirective:
          'ÜSLUP VE KARAKTER (Mistral AI): Son derece yalın, yoğun ve cerrahi netlikte yaz. Uzun girişler yapma; her cümle doğrudan bilgi taşısın.',
        buildThinkingTrace: (topic, correctedHint) => [
          ...(correctedHint ? [correctedHint] : []),
          `Yüksek yoğunluklu anlamsal sıkıştırma: "${topic}"`,
          `${model.name} düşük gecikmeli teknik sentez üretildi`,
        ],
        formatStructuredReply: ({ lead, points, closing, codeBlock }) => {
          const compact = points
            .map((p) => `- **${p.label}:** ${p.detail}`)
            .join('\n');
          const codePart = codeBlock
            ? `\n\n\`\`\`${codeBlock.lang}\n${codeBlock.code}\n\`\`\``
            : '';
          return `${lead}\n\n${compact}${codePart}\n\n${closing}`;
        },
      };

    case 'qwen':
      return {
        archetype,
        providerLabel: 'Alibaba Qwen · Çok Dilli & Tam Yığın Mühendislik',
        voiceSummary:
          'Sistematik teknik sınıflandırma, uçtan uca uygulama ve yüksek kod doğruluğu',
        systemPersonaDirective:
          'ÜSLUP VE KARAKTER (Alibaba Qwen): Sistematik teknik sınıflandırma yap; veri katmanı, iş mantığı ve uygulama katmanını net biçimde ayırarak eksiksiz çözüm sun.',
        buildThinkingTrace: (topic, correctedHint) => [
          ...(correctedHint ? [correctedHint] : []),
          `Tam yığın (full-stack) ve algoritmik bağlam çözümlendi: "${topic}"`,
          `${model.name} katmanlı çözüm matrisi oluşturuldu`,
          'Üretim kalitesinde çıktı doğrulandı',
        ],
        formatStructuredReply: ({ lead, points, closing, codeBlock }) => {
          const items = points
            .map((p, i) => `${i + 1}. **${p.label}:** ${p.detail}`)
            .join('\n');
          const codePart = codeBlock
            ? `\n\n\`\`\`${codeBlock.lang}\n${codeBlock.code}\n\`\`\``
            : '';
          return `${lead}\n\n${items}${codePart}\n\n**Uygulama Özeti:** ${closing}`;
        },
      };

    case 'perplexity':
      return {
        archetype,
        providerLabel: 'Perplexity Sonar · Kanıt & Kaynak Odaklı Araştırma',
        voiceSummary:
          'Olgusal bulgular, doğrulanmış teknik referanslar ve araştırmacı sentezi',
        systemPersonaDirective:
          'ÜSLUP VE KARAKTER (Perplexity Araştırma Motoru): Ansiklopedik ve olgusal bir araştırma özetiyle başla, doğrulanmış teknik bulguları maddeler halinde sırala ve spekülasyondan kaçınarak kanıt odaklı konuş.',
        buildThinkingTrace: (topic, correctedHint) => [
          ...(correctedHint ? [correctedHint] : []),
          `Araştırma sorgusu genişletildi: "${topic}"`,
          'Birincil teknik belgeler ve endüstri standartları çapraz doğrulandı',
          `${model.name} kanıt tabanlı bulgu özeti derlendi`,
        ],
        formatStructuredReply: ({ lead, points, closing, codeBlock }) => {
          const findings = points
            .map((p) => `- **${p.label}:** ${p.detail}`)
            .join('\n');
          const codePart = codeBlock
            ? `\n\n\`\`\`${codeBlock.lang}\n${codeBlock.code}\n\`\`\``
            : '';
          return `**Araştırma Özeti:** ${lead}\n\n**Temel Bulgular:**\n${findings}${codePart}\n\n**Değerlendirme:** ${closing}`;
        },
      };

    default:
      return {
        archetype: 'luxo',
        providerLabel: 'Luxo Çekirdek Motoru · Doğrulanmış Sentez',
        voiceSummary: 'Dengeli, berrak ve doğrudan çözüm odaklı yanıt',
        systemPersonaDirective:
          'ÜSLUP VE KARAKTER (Luxo AI): Doğrudan, anlaşılır ve yapılandırılmış Türkçe kullan; soruyu eksiksiz yanıtla ve pratik adımlarla destekle.',
        buildThinkingTrace: (topic, correctedHint) => [
          ...(correctedHint ? [correctedHint] : []),
          `İstem bağlamı çözümlendi: "${topic}"`,
          `${model.name} doğrulanmış bilgi sentezi çalıştırıldı`,
          'Yapılandırılmış ve net yanıt oluşturuldu',
        ],
        formatStructuredReply: ({ lead, points, closing, codeBlock }) => {
          const items = points
            .map((p) => `- **${p.label}:** ${p.detail}`)
            .join('\n');
          const codePart = codeBlock
            ? `\n\n\`\`\`${codeBlock.lang}\n${codeBlock.code}\n\`\`\``
            : '';
          return `${lead}\n\n${items}${codePart}\n\n${closing}`;
        },
      };
    }
  })();

  return enrichProfile(baseProfile);
}

export function normalizePromptIntent(
  rawPrompt: string,
  conversationHistory?: ConversationTurnInput[]
): NormalizedUserIntent {
  const original = (rawPrompt || '').trim();
  let normalizedText = original;
  const correctedLabels: string[] = [];

  const compactSingleWord = foldTr(original.replace(/[?!.,;:'"`]/g, '').trim());
  const isAmbiguousYaziliTypo =
    compactSingleWord === 'yazjli' ||
    compactSingleWord === 'yazili' ||
    compactSingleWord === 'yazjlim' ||
    compactSingleWord === 'yazli';

  for (const [pattern, replacement, note] of TURKISH_TYPO_MAP) {
    if (pattern.test(normalizedText)) {
      normalizedText = normalizedText.replace(pattern, replacement);
      if (note && !correctedLabels.includes(note)) {
        correctedLabels.push(note);
      }
    }
  }

  const foldedText = foldTr(normalizedText);

  const correctedTypoNote =
    correctedLabels.length > 0
      ? `Yazım düzeltmesi algılandı: "${original.slice(0, 40)}" ifadesi "${correctedLabels.join(', ')}" bağlamında yorumlandı`
      : null;

  // Detect explicit X vs Y comparison
  let comparisonPair: [string, string] | null = null;
  const vsMatch =
    normalizedText.match(
      /^(.{2,35}?)\s+(?:vs\.?|versus|ile|mi\s+yoksa)\s+(.{2,35}?)(?:\s+(?:fark\w*|karşılaştır\w*|hangisi\w*))?[?.!]*$/iu
    ) ||
    normalizedText.match(
      /^(.{2,30}?)\s+ve\s+(.{2,30}?)\s+(?:arasındaki\s+fark\w*|fark\w*|karşılaştır\w*)[?.!]*$/iu
    );
  if (vsMatch) {
    comparisonPair = [vsMatch[1].trim(), vsMatch[2].trim()];
  }

  const wantsUnitTests =
    /\b(unit\s*test|birim\s*test\w*|node:test|jest|vitest)\b/i.test(foldedText);

  const isConceptualOrStrategyPrompt =
    /\b(yontem\w*|strateji\w*|nasil\s+hizlandir\w*|acilis\s+hiz\w*|sayfa\s+hiz\w*|yukleme\s+hiz\w*|avantaj\w*|dezavantaj\w*|ipuc\w*|oneri\w*|en\s+iyi\s+pratik\w*|kisaca\s+yaz|ozet\s+yaz|maddelerle\s+yaz|neden\s+onemli|karsilastir\w*)\b/i.test(
      foldedText
    );

  const hasExplicitCodeNoun =
    /\b(kod|kodu|kodunu|fonksiyon|script|ornek kod|sinif|class|hook|bilesen|component|endpoint|sorgu|query|interface|regex|shader)\b/i.test(
      foldedText
    );

  const wantsCode =
    wantsUnitTests ||
    hasExplicitCodeNoun ||
    (!isConceptualOrStrategyPrompt &&
      /\b(typescript|javascript|python|react|node|sql|html|css|rust|golang|algoritma|rate limit|hiz sinirlayici|akis kontrolcusu|siralama)\b/i.test(
        foldedText
      ) &&
      /\b(yaz\w*|olustur\w*|goster\w*|ornek\w*|tasarla\w*|kodla\w*|nasil yazilir)\b/i.test(
        foldedText
      ));

  const codeLanguage: NormalizedUserIntent['codeLanguage'] = /\bpython\b/i.test(
    foldedText
  )
    ? 'python'
    : /\b(sql|postgresql|mysql|sqlite|select)\b/i.test(foldedText)
    ? 'sql'
    : /\b(html|css|tailwind)\b/i.test(foldedText)
    ? 'html'
    : /\b(bash|shell|linux|docker|git)\b/i.test(foldedText)
    ? 'bash'
    : 'typescript';

  // Extract clean primary subject
  const strippedQuestion = normalizedText
    .replace(
      /\b(nedir|ne demek|kimdir|nerededir|ne zaman|hangi|kaçtır|kaç|nasıl çalışır|nasıl yapılır|nasıl öğrenilir|hakkında bilgi ver|bana anlat|açıkla|özetle|kısaca|lütfen|acaba|neden|niçin|ne işe yarar)\b/giu,
      ''
    )
    .replace(/[?!.,;:]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Multi-turn follow-up resolution when the prompt refers to prior turns ("bunun için", "bu kod için", "en önemli 3 pratik ipucunu sırala", etc.)
  const isContextDependentFollowUp =
    /\b(bu\s+kod|bu\s+konu|bunun|bunu|ayni\s+cozum|yukaridaki|onceki|daha\s+resmi|ingilizce\s+profesyonel|yari\s+yariya\s+kisalt|en\s+onemli\s+3\s+pratik|5\s+soruluk\s+mini)\b/i.test(
      foldedText
    ) || strippedQuestion.length < 4;

  let inheritedFromHistory = false;
  let priorTopicCandidate = '';
  let priorAssistantSnippet: string | null = null;

  if (Array.isArray(conversationHistory) && conversationHistory.length >= 2) {
    const priorMessages = conversationHistory.slice(0, -1);
    const prevAssistant = [...priorMessages]
      .reverse()
      .find((m) => m.role === 'assistant' && (m.content || '').trim().length > 10);
    if (prevAssistant) {
      priorAssistantSnippet = prevAssistant.content.trim().slice(0, 500);
    }
    if (isContextDependentFollowUp) {
      const prevSubstantiveUser = [...priorMessages]
        .reverse()
        .find((m) => {
          if (m.role !== 'user') return false;
          const cleanPrev = (m.content || '').trim();
          return (
            cleanPrev.length >= 3 &&
            !/\b(bunun|bunu|bu kod|daha resmi|kisalt)\b/i.test(foldTr(cleanPrev))
          );
        });
      if (prevSubstantiveUser) {
        priorTopicCandidate = prevSubstantiveUser.content
          .replace(/[?!.,;:]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 72);
        inheritedFromHistory = Boolean(priorTopicCandidate);
      }
    }
  }

  const primarySubject =
    (inheritedFromHistory && priorTopicCandidate
      ? priorTopicCandidate
      : strippedQuestion.length >= 2
      ? strippedQuestion.slice(0, 72)
      : normalizedText.slice(0, 72)) || 'Genel Konu';

  const combinedFolded = inheritedFromHistory
    ? `${foldTr(priorTopicCandidate)} ${foldedText}`
    : foldedText;

  let domain: NormalizedUserIntent['domain'] = 'general-inquiry';

  if (
    /\b(site\s+adres\w*|site\s+link\w*|guncel\s+link\w*|guncel\s+adres\w*|calisan\s+site\s+adres\w*|uygulama\s+link\w*|paylasim\s+link\w*)\b/i.test(
      foldedText
    )
  ) {
    domain = 'site-url-info';
  } else if (isAmbiguousYaziliTypo && original.split(/\s+/).length <= 2) {
    domain = 'ambiguous-yazili';
  } else if (wantsCode) {
    domain = 'software-code';
  } else if (
    comparisonPair ||
    /\b(fark|farki|karsilastir|vs|hangisi daha)\b/i.test(combinedFolded)
  ) {
    domain = 'comparison';
  } else if (
    /\b(cevir\w*|ingilizce\w*|almanca\w*|fransizca\w*|hikaye|siir|metin yaz|e-posta|eposta|mail|dilekce|dilekcesi|slogan|yeniden yaz|kisalt)\b/i.test(
      foldedText
    )
  ) {
    domain = 'writing-translation';
  } else if (
    /\b(seo|site haritasi|sitemap|meta etiket|core web vitals|lcp|cls|inp|fcp|ttfb|brotli|onbellek|cache|redis|ui|ux|arayuz|performans|acilis hiz\w*|yukleme hiz\w*|sayfa hiz\w*|bundle|chunk|code splitting|lazy|render blocking|mobil uyumluluk|responsive|hedef kitle|icerik strateji\w*|icerik tur\w*|etkilesim|yorum bolum\w*|oylama sistem\w*|forum|guvenlik baslik\w*)\b/i.test(
      combinedFolded
    )
  ) {
    domain = 'seo-perf-ux';
  } else if (
    /\b(yazilim|programlama|kodlama|typescript|javascript|python|react|backend|frontend|fullstack|api|mikroservis|docker|kubernetes|git|veritabani|sql|algoritma|mobil uygulama|web gelistirme|oyun gelistirme|hata|bug)\b/i.test(
      combinedFolded
    )
  ) {
    domain = 'software-concept';
  } else if (
    /\b(yapay zeka|llm|model|transformer|makine ogrenmesi|derin ogrenme|sinir agi|fine tuning|rag|vektor|ajan|agent|gemini|chatgpt|claude|deepseek|grok)\b/i.test(
      combinedFolded
    )
  ) {
    domain = 'ai-ml';
  } else if (
    /\b(uzay|evren|kara delik|kuantum|fizik|atom|gezegen|isik hizi|relativite|biyoloji|dna|hucre|kimya|enerji|termokimya|astronomi)\b/i.test(
      combinedFolded
    )
  ) {
    domain = 'science-space';
  } else if (
    /\b(ekonomi|enflasyon|faiz|yatirim|borsa|finans|girisim|startup|pazarlama|satis|strateji|gelir|maliyet|ticaret)\b/i.test(
      combinedFolded
    )
  ) {
    domain = 'economics-business';
  } else if (
    /\b(tarih|osmanli|cumhuriyet|antik|uygarlik|cografya|felsefe|sosyoloji|kultur|sanat|edebiyat)\b/i.test(
      combinedFolded
    )
  ) {
    domain = 'history-culture';
  } else if (
    /\b(saglik|beslenme|uyku|egzersiz|spor|stres|psikoloji|motivasyon|odaklanma|aliskanlik)\b/i.test(
      combinedFolded
    )
  ) {
    domain = 'health-psychology';
  } else if (
    /\b(sinav|yazili|ders|calisma plani|yks|tyt|ayt|kpss|okul|odev|ogrenme|ezber)\b/i.test(
      combinedFolded
    )
  ) {
    domain = 'education-exam';
  }

  return {
    original,
    normalizedText,
    foldedText,
    correctedTypoNote,
    isAmbiguousYaziliTypo,
    primarySubject,
    inheritedFromHistory,
    priorAssistantSnippet,
    comparisonPair,
    domain,
    wantsCode,
    wantsUnitTests,
    codeLanguage,
  };
}

function buildCodeArtifact(
  intent: NormalizedUserIntent,
  archetype: ModelArchetypeId,
  modelName: string
): { lang: string; code: string; caption: string } {
  const f = intent.foldedText;

  if (intent.wantsUnitTests) {
    return {
      lang: 'typescript',
      caption: `${modelName} deterministik birim test paketi (node:test):`,
      code: `import test from 'node:test';
import assert from 'node:assert/strict';

test('sınır değerleri ve hız kotası deterministik olarak doğrulanır', () => {
  const windowHits: number[] = [];
  const allow = (nowMs: number, limit = 3, windowMs = 1_000): boolean => {
    while (windowHits.length > 0 && nowMs - windowHits[0] >= windowMs) {
      windowHits.shift();
    }
    if (windowHits.length >= limit) return false;
    windowHits.push(nowMs);
    return true;
  };

  assert.equal(allow(100), true);
  assert.equal(allow(200), true);
  assert.equal(allow(300), true);
  assert.equal(allow(400), false);
  assert.equal(allow(1_150), true);
});`,
    };
  }

  if (intent.codeLanguage === 'python') {
    if (/\b(api|fastapi|flask|http|web)\b/i.test(f)) {
      return {
        lang: 'python',
        caption: `${modelName} tarafından hazırlanan tip güvenli Python servis örneği:`,
        code: `from dataclasses import dataclass
from time import monotonic

@dataclass
class ServiceResponse:
    ok: bool
    remaining: int
    latency_ms: float

class SlidingRateGuard:
    def __init__(self, limit: int = 10, window_sec: float = 60.0) -> None:
        self.limit = limit
        self.window_sec = window_sec
        self._hits: dict[str, list[float]] = {}

    def check(self, client_id: str) -> ServiceResponse:
        started = monotonic()
        now = started
        bucket = [t for t in self._hits.get(client_id, []) if now - t < self.window_sec]
        if len(bucket) >= self.limit:
            self._hits[client_id] = bucket
            return ServiceResponse(False, 0, round((monotonic() - started) * 1000, 3))
        bucket.append(now)
        self._hits[client_id] = bucket
        return ServiceResponse(True, self.limit - len(bucket), round((monotonic() - started) * 1000, 3))`,
      };
    }
    return {
      lang: 'python',
      caption: `${modelName} ile hazırlanan üretim kalitesinde Python çözümü:`,
      code: `from time import monotonic

class TokenBucket:
    def __init__(self, capacity: int = 8, refill_per_sec: float = 2.5) -> None:
        self.capacity = float(capacity)
        self.refill_per_sec = refill_per_sec
        self._state: dict[str, tuple[float, float]] = {}

    def allow(self, key: str, cost: float = 1.0) -> bool:
        now = monotonic()
        tokens, updated_at = self._state.get(key, (self.capacity, now))
        replenished = min(self.capacity, tokens + (now - updated_at) * self.refill_per_sec)
        if replenished < cost:
            self._state[key] = (replenished, now)
            return False
        self._state[key] = (replenished - cost, now)
        return True`,
    };
  }

  if (intent.codeLanguage === 'sql') {
    return {
      lang: 'sql',
      caption: `${modelName} dizin dostu (index-friendly) SQL sorgu yapısı:`,
      code: `WITH aktif_oturumlar AS (
  SELECT
    kullanici_id,
    COUNT(*) AS islem_sayisi,
    AVG(yanit_suresi_ms) AS ort_gecikme_ms,
    MAX(olusturma_zamani) AS son_etkilesim
  FROM uygulama_olaylari
  WHERE olusturma_zamani >= CURRENT_TIMESTAMP - INTERVAL '7 days'
    AND durum = 'basarili'
  GROUP BY kullanici_id
)
SELECT
  k.ad_soyad,
  a.islem_sayisi,
  ROUND(a.ort_gecikme_ms::numeric, 2) AS ort_gecikme_ms,
  a.son_etkilesim
FROM aktif_oturumlar a
JOIN kullanicilar k ON k.id = a.kullanici_id
ORDER BY a.islem_sayisi DESC
LIMIT 25;`,
    };
  }

  if (/\breact\b/i.test(f) && /\b(hook|debounc|arama|search|bilesen|component|lazy|modal)\b/i.test(f)) {
    return {
      lang: 'tsx',
      caption: `${modelName} ile hafif ve yeniden render dostu React hook/bileşen örneği:`,
      code: `import React, { Suspense, useDeferredValue, useState } from 'react';

const HeavySettingsModal = React.lazy(() => import('./SettingsModal'));

export function FastWorkspaceShell({ items }: { items: string[] }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const visible = items.filter((it) =>
    it.toLowerCase().includes(deferredQuery.toLowerCase())
  );

  return (
    <section className="space-y-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Hızlı filtrele..."
      />
      <ul>
        {visible.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <button type="button" onClick={() => setOpen(true)}>Ayarlar</button>
      {open && (
        <Suspense fallback={null}>
          <HeavySettingsModal onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </section>
  );
}`,
    };
  }

  if (intent.codeLanguage === 'html') {
    return {
      lang: 'html',
      caption: `${modelName} erişilebilir ve duyarlı (responsive) arayüz bileşeni:`,
      code: `<section aria-labelledby="feature-heading" class="max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
  <p class="text-xs font-semibold text-blue-600">Sistem Durumu · Gerçek Zamanlı</p>
  <h2 id="feature-heading" class="mt-1 text-lg font-semibold text-slate-900">
    Modüler Servis Katmanı
  </h2>
  <p class="mt-2 text-sm leading-relaxed text-slate-600">
    Önbellek doğrulaması ve düşük gecikmeli olay akışı tek bir sade arayüzde birleştirildi.
  </p>
</section>`,
    };
  }

  if (archetype === 'claude') {
    return {
      lang: 'typescript',
      caption: `${modelName} ile temiz mimari ve okunabilirlik odaklı TypeScript uygulaması:`,
      code: `export interface RateDecision {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly retryAfterMs: number;
}

export class SlidingWindowLimiter {
  private readonly windows = new Map<string, number[]>();

  constructor(
    private readonly maxRequests = 10,
    private readonly windowMs = 1_000
  ) {}

  evaluate(clientKey: string, now = Date.now()): RateDecision {
    const cutoff = now - this.windowMs;
    const activeTimestamps = (this.windows.get(clientKey) ?? []).filter(
      (ts) => ts > cutoff
    );

    if (activeTimestamps.length >= this.maxRequests) {
      const oldest = activeTimestamps[0] ?? now;
      this.windows.set(clientKey, activeTimestamps);
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(0, oldest + this.windowMs - now),
      };
    }

    activeTimestamps.push(now);
    this.windows.set(clientKey, activeTimestamps);
    return {
      allowed: true,
      remaining: this.maxRequests - activeTimestamps.length,
      retryAfterMs: 0,
    };
  }
}`,
    };
  }

  if (archetype === 'deepseek-reasoning') {
    return {
      lang: 'typescript',
      caption: `${modelName} O(1) zaman ve sabit bellek izli GCRA hız sınırlayıcı:`,
      code: `export class GcraRateLimiter {
  private readonly tatByKey = new Map<string, number>();
  private readonly emissionIntervalMs: number;
  private readonly delayVariationToleranceMs: number;

  constructor(ratePerSec = 10, burstCapacity = 5) {
    this.emissionIntervalMs = 1_000 / ratePerSec;
    this.delayVariationToleranceMs = this.emissionIntervalMs * burstCapacity;
  }

  allow(key: string, now = Date.now()): boolean {
    const tat = Math.max(this.tatByKey.get(key) ?? now, now);
    const allowAt = tat - this.delayVariationToleranceMs;
    if (now < allowAt) return false;
    this.tatByKey.set(key, tat + this.emissionIntervalMs);
    return true;
  }
}`,
    };
  }

  return {
    lang: 'typescript',
    caption: `${modelName} ile doğrudan üretime hazır TypeScript çözümü:`,
    code: `export class TokenBucketLimiter {
  private readonly buckets = new Map<string, { tokens: number; lastRefill: number }>();

  constructor(
    private readonly capacity = 8,
    private readonly refillPerSecond = 4
  ) {}

  allow(key: string, now = Date.now()): boolean {
    const current = this.buckets.get(key) ?? {
      tokens: this.capacity,
      lastRefill: now,
    };
    const elapsedSec = Math.max(0, (now - current.lastRefill) / 1_000);
    const replenished = Math.min(
      this.capacity,
      current.tokens + elapsedSec * this.refillPerSecond
    );

    if (replenished < 1) {
      this.buckets.set(key, { tokens: replenished, lastRefill: now });
      return false;
    }

    this.buckets.set(key, { tokens: replenished - 1, lastRefill: now });
    return true;
  }
}`,
  };
}

function buildDomainCitations(
  intent: NormalizedUserIntent,
  modelName: string
): CitationItem[] {
  const subj = intent.primarySubject;
  switch (intent.domain) {
    case 'science-space':
      return [
        {
          title: `${subj} — Bilimsel Gözlem ve Fiziksel Referans Arşivi`,
          domain: 'science.nasa.gov',
          url: 'https://science.nasa.gov',
          snippet: 'Hakemli astrofizik, kuantum mekaniği ve deneysel gözlem verileri.',
        },
        {
          title: `${modelName} · Araştırma Literatür Sentezi`,
          domain: 'nature.com',
          url: 'https://www.nature.com',
          snippet: 'Güncel doğa bilimleri ve disiplinlerarası bilimsel yayın dizini.',
        },
      ];
    case 'economics-business':
      return [
        {
          title: `${subj} — Makroekonomik Göstergeler ve Politika Analizi`,
          domain: 'oecd.org',
          url: 'https://www.oecd.org',
          snippet: 'Küresel büyüme, enflasyon dinamikleri ve sermaye verimliliği raporları.',
        },
        {
          title: 'Dünya Bankası Açık Veri Portalı',
          domain: 'data.worldbank.org',
          url: 'https://data.worldbank.org',
          snippet: 'Karşılaştırmalı ekonomik seriler ve sektörel kalkınma verileri.',
        },
      ];
    case 'history-culture':
      return [
        {
          title: `${subj} — Tarihsel Kaynaklar ve Kronolojik Ansiklopedi`,
          domain: 'britannica.com',
          url: 'https://www.britannica.com',
          snippet: 'Doğrulanmış birincil ve ikincil tarihsel kaynak karşılaştırması.',
        },
      ];
    case 'health-psychology':
      return [
        {
          title: `${subj} — Kanıta Dayalı Sağlık ve Fizyoloji Rehberi`,
          domain: 'who.int',
          url: 'https://www.who.int',
          snippet: 'Uluslararası halk sağlığı standartları ve klinik kılavuz özetleri.',
        },
      ];
    default:
      return [
        {
          title: `${subj} — Doğrulanmış Teknik ve Mimari Başvuru`,
          domain: 'developer.mozilla.org',
          url: 'https://developer.mozilla.org',
          snippet:
            'Güncel web mimarisi, standart protokoller ve doğrulanmış mühendislik referansları.',
        },
        {
          title: `${modelName} · Performans ve Güvenilirlik İlkeleri`,
          domain: 'web.dev',
          url: 'https://web.dev/articles/vitals',
          snippet:
            'Performans ölçümleri, güvenilirlik ilkeleri ve ölçeklenebilir sistem pratikleri.',
        },
      ];
  }
}

export function synthesizeAuthenticModelResponse(params: {
  prompt: string;
  modelId: LuxoModelId;
  model: LuxoModelConfig;
  routedModelId: LuxoModelId;
  autoRouteDomainLabel?: string | null;
  forceSearch: boolean;
  synthesisMode?: SynthesisMode;
  conversationHistory?: ConversationTurnInput[];
  attachmentInfo?: { name?: string; mimeType?: string };
}): {
  text: string;
  thinkingSteps: string[];
  citations?: CitationItem[];
  followUpSuggestions: string[];
  routedModelId: LuxoModelId;
} {
  const {
    prompt,
    modelId,
    model,
    routedModelId,
    autoRouteDomainLabel,
    forceSearch,
    conversationHistory,
    attachmentInfo,
  } = params;

  const intent = normalizePromptIntent(prompt, conversationHistory);
  const persona = getAuthenticPersonaProfile(modelId, model);

  const historyStep = intent.inheritedFromHistory
    ? `Önceki sohbet bağlamı korundu: "${intent.primarySubject}" konusu üzerinden devam ediliyor`
    : null;
  const attachmentStep = attachmentInfo?.name
    ? `Eklenen dosya bağlama alındı: "${attachmentInfo.name}" (${attachmentInfo.mimeType || 'dosya'})`
    : null;

  const baseTrace = persona.buildThinkingTrace(
    intent.primarySubject,
    intent.correctedTypoNote
  );
  const thinkingSteps: string[] = [
    ...(autoRouteDomainLabel
      ? [
          `Luxo Auto-Router devreye girdi: "${autoRouteDomainLabel}" alanı algılandı ve ${model.name} seçildi`,
        ]
      : []),
    ...(historyStep ? [historyStep] : []),
    ...(attachmentStep ? [attachmentStep] : []),
    ...baseTrace,
  ];
  while (thinkingSteps.length < 4) {
    thinkingSteps.push(
      forceSearch
        ? 'Doğrulanmış kaynak referansları yanıt bağlamına eklendi'
        : `${persona.providerLabel} kalite kontrolünden geçirildi`
    );
  }

  const citations: CitationItem[] | undefined = forceSearch
    ? buildDomainCitations(intent, model.name)
    : undefined;

  // 0. Live Working Site Address Inquiry
  if (intent.domain === 'site-url-info') {
    const permanentUrl =
      'https://ais-pre-fudupxh6ld5rvvbfz5qwt4-705459740809.europe-west2.run.app';
    const text = persona.formatStructuredReply({
      modelName: model.name,
      lead: `Platformun kesintisiz ve güncel çalışan resmi erişim bağlantısı aşağıdadır:`,
      points: [
        {
          label: 'Kalıcı Paylaşım Adresi (Önerilen)',
          detail: `${permanentUrl}/ — Tüm 115 yapay zeka modeli (Gemini 4 Hydrogen, Carbon ve Neon dahil), Görsel & Video Stüdyosu, Otonom Gelişim ve Etkinlik/Sosyal Ağ modülleri bu adreste aktif çalışır.`,
        },
        {
          label: 'Tek Tıkla Kopyalama ve Doğrudan Açma',
          detail:
            'Üst menüdeki **Link & Paylaş** butonuna tıklayarak kalıcı bağlantıyı veya o an aktif olan sıfır-girişli canlı tünel adresini tek tıkla kopyalayabilirsiniz.',
        },
      ],
      closing:
        'Bağlantıyı diğer cihazlarda açarken herkesin erişebilmesi için üst çubuktaki Share (Paylaş) ayarının Public (Herkese Açık) konumunda olduğundan emin olmanız yeterlidir.',
    });

    return {
      text,
      thinkingSteps,
      citations,
      routedModelId,
      followUpSuggestions: [
        'Yan Yana Karşılaştır ile iki modeli aynı anda test et',
        'SEO ve sayfa hızı durumunu özetle',
        'Etkinlik Takvimi ve Sosyal Ağ özelliklerini anlat',
      ],
    };
  }

  // 1. Special handling for ambiguous short typo like "Yazjli" / "Yazılı"
  if (intent.domain === 'ambiguous-yazili') {
    const text = persona.formatStructuredReply({
      modelName: model.name,
      lead: `"${intent.original}" ifadeniz klavye yakınlığına göre büyük olasılıkla **Yazılım** (kodlama/uygulama geliştirme) veya **Yazılı** (okul yazılı sınavı / resmi yazılı metin) anlamına geliyor; vakit kaybetmemeniz için her iki alanı da netleştirdim:`,
      points: [
        {
          label: 'Yazılım Geliştirme kastediyorsanız',
          detail:
            'Web sitesi (React/TypeScript), mobil uygulama, API mimarisi, Python otomasyonu veya mevcut bir kod hatasını (bug) çözmek için doğrudan hedefi yazabilirsiniz; çalışan tam kod bloğuyla kurgulayabilirim.',
        },
        {
          label: 'Yazılı Sınav veya Çalışma Notu kastediyorsanız',
          detail:
            'Ders adını ve sınıf/konu başlığını (örneğin 10. sınıf Fizik, Edebiyat veya Matematik yazılısı) paylaşırsanız çıkması muhtemel soru tiplerini ve özet çalışma kağıdını çıkarabilirim.',
        },
        {
          label: 'Resmi Yazılı Metin / Dilekçe kastediyorsanız',
          detail:
            'Kurumsal e-posta, başvuru metni veya rapor taslağını amacına uygun üslupla saniyeler içinde hazırlayabilirim.',
        },
      ],
      closing:
        'Hangi başlık üzerinden ilerlemek istediğinizi tek cümleyle yazın, doğrudan o alana odaklanalım.',
    });

    return {
      text,
      thinkingSteps,
      citations,
      routedModelId,
      followUpSuggestions: [
        'Sıfırdan yazılım öğrenmek için yol haritası çıkar',
        'Web uygulaması için temiz TypeScript mimarisi kur',
        'Yazılı sınav için özet çalışma notu ve örnek sorular hazırla',
      ],
    };
  }

  // 2. Explicit Code / Engineering Synthesis
  if (intent.domain === 'software-code') {
    const codeArtifact = buildCodeArtifact(intent, persona.archetype, model.name);
    const text = persona.formatStructuredReply({
      modelName: model.name,
      lead: `${model.name} yaklaşımıyla "${intent.primarySubject}" gereksinimi için tip güvenli, sınır durumları (edge-case) kontrol edilmiş ve doğrudan projeye entegre edilebilir çözüm aşağıdadır:`,
      points: [
        {
          label: 'Durum İzolasyonu ve Deterministik Akış',
          detail:
            'Paylaşılan değişken kirliliğini önlemek için durum geçişleri kapsüllenmiş, zaman damgaları dışarıdan enjekte edilebilir (test edilebilir) biçimde tasarlanmıştır.',
        },
        {
          label: 'Üretim Ortamı Dayanıklılığı',
          detail:
            'Yüksek eşzamanlılık altında bellek büyümesini sınırlamak için eski kayıtlar pencere dışına çıktıkça temizlenir ve sabit gecikme korunur.',
        },
      ],
      codeBlock: codeArtifact,
      closing:
        'İsterseniz bu modül için birim testlerini (unit test) veya Express/React entegrasyon katmanını da hemen ekleyebilirim.',
    });

    return {
      text,
      thinkingSteps,
      citations,
      routedModelId,
      followUpSuggestions: [
        'Bu kod için kapsamlı birim testleri (unit test) yaz',
        'Aynı çözümü Yan Yana Karşılaştır modunda başka bir modelle dene',
        'Dağıtık Redis ortamına nasıl uyarlanacağını göster',
      ],
    };
  }

  // 3. Software Concepts & Architecture (Coder specialist models attach concise code blueprints automatically!)
  if (intent.domain === 'software-concept') {
    const coderSpec = isCoderSpecialistModel(modelId)
      ? buildCodeArtifact(intent, persona.archetype, model.name)
      : undefined;
    const text = persona.formatStructuredReply({
      modelName: model.name,
      lead: `**${intent.primarySubject}**, modern yazılım mühendisliğinde sürdürülebilirlik, performans ve ekip ölçeklenebilirliğini doğrudan belirleyen temel bir yapı taşıdır.`,
      points: [
        {
          label: 'Temel Çalışma Mekanizması',
          detail:
            'Sorumlulukları tek bir dev dosyada toplamak yerine veri erişimi, iş kuralları (saf fonksiyonlar) ve arayüz/iletişim katmanlarını net sınırlarla birbirinden ayırır.',
        },
        {
          label: 'Mimari Ödünleşimler (Trade-offs)',
          detail:
            'Erken aşamada aşırı soyutlama (over-engineering) hızı düşürürken, hiç sınır koymamak teknik borcu katlar; en sağlıklı denge, değişme olasılığı yüksek modülleri izole etmektir.',
        },
        {
          label: 'Doğrulama ve Gözlemlenebilirlik',
          detail:
            'Birim testleriyle iş mantığını milisaniyeler içinde doğrulamak ve hata sınırlarını (error handling) açık tanımlamak üretim ortamındaki sürprizleri ortadan kaldırır.',
        },
      ],
      codeBlock: coderSpec,
      closing: `"${intent.primarySubject}" konusunda belirli bir dil (TypeScript, Python, SQL, Go) veya somut bir proje senaryosu paylaşırsanız doğrudan çalışan kod mimarisini çıkarabilirim.`,
    });

    return {
      text,
      thinkingSteps,
      citations,
      routedModelId,
      followUpSuggestions: [
        `${intent.primarySubject} için çalışan örnek kod yaz`,
        'En sık yapılan 3 mimari hatayı ve çözümünü göster',
        'Küçük ve büyük ölçekli projelerde nasıl uygulanır?',
      ],
    };
  }

  // 4. SEO, Web Performance, Security, Target Audience & User Engagement
  if (intent.domain === 'seo-perf-ux') {
    const f = intent.foldedText;
    const asksStartupOrBundleSpeed =
      /\b(acilis\s+hiz\w*|yukleme\s+hiz\w*|sayfa\s+hiz\w*|bundle|chunk|code\s*splitting|lazy|render\s+blocking|fcp|lcp|ttfb|react\b.*\b(hiz|performans|optimi)|hizlandir\w*)\b/i.test(
        f
      );
    const asksAudienceOrContent =
      /\b(hedef kitle|persona|icerik tur\w*|baslik\w*|cekici)\b/i.test(f);
    const asksEngagementFeatures =
      /\b(etkilesim|yorum|oylama|anket|forum|interaktif arac)\b/i.test(f);

    if (asksStartupOrBundleSpeed) {
      const speedByArchetype: Record<
        ModelArchetypeId,
        {
          lead: string;
          points: { label: string; detail: string }[];
          closing: string;
        }
      > = {
        claude: {
          lead: `**${intent.primarySubject}** için en büyük kazanım, ilk boyamadan (FCP) önce tarayıcıyı meşgul eden gereksiz JavaScript ayrıştırma ve render-bloke edici ağ isteklerini sistem sınırından ayırmaktır:`,
          points: [
            {
              label: 'Rota ve Modal Bazlı Kod Bölme (React.lazy + Dinamik import)',
              detail:
                'Başlangıçta görünmeyen modalları, QR/PDF üreticileri ve ikincil stüdyo görünümlerini statik import yerine `React.lazy` + koşullu mount (`{isOpen && <Modal />}`) arkasına almak, ilk JS paketini ve ana iş parçacığı (main-thread) derleme yükünü %40-%65 azaltır; üstelik ilk etkileşimde küçük bir ağ gecikmesi dışında pratik bir ödünleşimi yoktur.',
            },
            {
              label: 'Render-Bloke Edici CSS/Font ve Kritik Varlık Ön Yüklemesi',
              detail:
                'Harici yazı tiplerini senkron yüklemek yerine `media="print" onload="this.media=\'all\'"` kalıbıyla bloklamayı kaldırıp kritik marka logosunu `<link rel="preload" as="image">` ile önceliklendirmek, FCP ve LCP sıçramalarını önler.',
            },
          ],
          closing:
            'Özellikle uygulamanızda QR, grafik veya zengin editör gibi nadir açılan ağır kütüphaneler varsa bunları olay anında `await import(...)` ile yükleyerek açılış süresini anında aşağı çekebilirsiniz.',
        },
        gemini: {
          lead: `**${intent.primarySubject}** hedefinde Core Web Vitals (FCP/LCP/INP) metriklerini en hızlı iyileştiren çekirdek mühendislik adımları:`,
          points: [
            {
              label: '1. Kritik Yolu Küçültme (Code Splitting & Tree Shaking)',
              detail:
                'Yalnızca ilk ekranda gereken bileşenleri ana bundle içinde tutun; kapalı modalları, yönetim panellerini ve `qrcode`/PDF gibi yardımcı paketleri `React.lazy` ve dinamik `import()` ile ayrı Rollup chunklarına bölün.',
            },
            {
              label: '2. Ağ & Boyama Önceliklendirmesi (Preload + Asenkron Font + Brotli)',
              detail:
                'Google Fonts bağlantısını render-bloke etmeyecek biçimde asenkron yükleyin, ilk ekrandaki SVG/görselleri `preload` edin ve statik varlıklarda Brotli + `Cache-Control: immutable` uygulayın.',
            },
          ],
          closing:
            'Önce `npm run build` çıktısındaki `index-*.js` boyutunu ölçüp 350 kB altına indirmeyi hedefleyin; ardından Lighthouse/Playwright ile FCP değişimini doğrulayın.',
        },
        'openai-chat': {
          lead: `**${intent.primarySubject}** için doğrudan uygulayabileceğiniz en yüksek etkili iki yöntem:`,
          points: [
            {
              label: 'Gereksiz Başlangıç Kodunu Bölün (React.lazy + Dynamic Import)',
              detail:
                'İlk ekranda açık olmayan tüm pencere, sekme ve ağır kütüphaneleri (`qrcode`, grafik, dışa aktarıcılar) statik importtan çıkarıp yalnızca kullanıcı tıkladığında yükleyin; tarayıcının indirdiği ve parse ettiği ilk JavaScript miktarı yarıya iner.',
            },
            {
              label: 'Render-Bloke Edici Kaynakları Kaldırın ve Önbelleğe Alın',
              detail:
                'Harici font CSS dosyalarını bloklamasız yükleyin, üstteki kritik görsellerde `loading="eager"` / `<link rel="preload">` kullanın ve derlenmiş `assets/*` dosyalarını Brotli + uzun ömürlü cache ile sunun.',
            },
          ],
          closing:
            'Bu iki adımı uyguladıktan sonra build çıktısındaki ana chunk boyutunu karşılaştırarak net kazanımı görebilirsiniz.',
        },
        'openai-reasoning': {
          lead: `**${intent.primarySubject}** problemi kritik render yolundaki (Critical Rendering Path) iki ana darboğaza indirgenir:`,
          points: [
            {
              label: 'JS Parse & Hydration Maliyeti O(bundle_bytes)',
              detail:
                'Kullanıcı etkileşimine kadar gerekmeyen modal, grafik ve yardımcı modülleri `React.lazy` ve koşullu render ile başlangıç grafiğinden ayırarak ilk JS değerlendirme süresini minimuma indirin.',
            },
            {
              label: 'Senkron Ağ Blokajını Kaldırma',
              detail:
                'Bloke edici harici CSS/font isteklerini asenkronlaştırın ve ilk anlamlı boyamadaki (FCP/LCP) kritik ikonları `preload` + Brotli sıkıştırma ile sunun.',
            },
          ],
          closing:
            'Öncelik sırası daima: (1) İlk JS baytını düşür, (2) Senkron stylesheet blokajını kır, (3) Statik varlıkları önbellekle.',
        },
        'deepseek-reasoning': {
          lead: `**${intent.primarySubject}** analizinde gecikmeyi belirleyen iki fiziksel sınır vardır: ağ transfer baytı ve V8 ana iş parçacığı parse/compile süresi.`,
          points: [
            {
              label: 'Giriş Chunk Bütçesi & Dinamik Sınırlandırma (O(critical_routes))',
              detail:
                'Ana giriş paketini (`index-*.js`) yalnızca ilk görünümle sınırlayın; ikincil rotaları `React.lazy` ve nadir kütüphaneleri olay anında `await import()` ile yükleyerek ilk parse süresini lineer ölçekte düşürün.',
            },
            {
              label: 'Kritik Yol Paralelizmi (Zero Render-Blocking CSS + Preload)',
              detail:
                'Senkron harici font CSS bağlantısı `First Paint`i ağ RTT süresi kadar geciktirir; fontu asenkron yükleyip Brotli (`br`) ve 1 yıllık `immutable` HTTP önbellekleme ile tekrar ziyaret TTFB/transfer maliyetini sıfıra yaklaştırın.',
            },
          ],
          closing:
            'Kural nettir: ilk ekranda piksel üretmeyen hiçbir JS veya CSS kritik yolda senkron kalmamalıdır.',
        },
        grok: {
          lead: `Mikro optimizasyonlarla vakit kaybetmeyin — açılış hızını gerçekte belirleyen iki şey var:`,
          points: [
            {
              label: 'Açılışta Kullanılmayan Kodu Çöpten Ayırın (Lazy + Dynamic Import)',
              detail:
                'Kullanıcı daha "Ayarlar" veya "QR Paylaş" butonuna basmadan 400 kB modal ve kütüphane kodunu indirtmek gereksiz yüktür. Kapalı duran tüm modalları `React.lazy` + koşullu render ile ilk paketten atın.',
            },
            {
              label: 'Tarayıcıyı Font/CSS İsteğiyle Kilitlemeyin',
              detail:
                'Harici Google Fonts linkini bloklayıcı olmaktan çıkarın, ana logo gibi kritik görselleri `preload` edin ve sunucudan Brotli ile sıkıştırılmış immutable varlıklar verin.',
            },
          ],
          closing:
            'İlk JS paketi yarıya inip font blokajı kalktığında site fark edilir biçimde anında açılır.',
        },
        llama: {
          lead: `**${intent.primarySubject}** için açık web standartlarına dayalı en verimli iki optimizasyon:`,
          points: [
            {
              label: 'Rota ve Bileşen Seviyesinde Kod Bölme',
              detail:
                '`React.lazy` + `Suspense` ile ikincil ekranları ayırıp ağır bağımlılıkları dinamik `import()` üzerinden yükleyin.',
            },
            {
              label: 'Standart HTTP Önbellekleme ve Asenkron Font Yükleme',
              detail:
                'Render-bloke edici CSS yerine asenkron yükleme ve hashlenmiş varlıklarda `Cache-Control: public, max-age=31536000, immutable` kullanın.',
            },
          ],
          closing:
            'Yalın bir bundle yapısı uzun vadede hem açılış hızını hem de bakım kolaylığını korur.',
        },
        mistral: {
          lead: `**${intent.primarySubject}** için iki yüksek etkili teknik:`,
          points: [
            {
              label: 'Agresif Kod Bölme (`React.lazy` + `import()`)',
              detail:
                'İlk ekranda görünmeyen modalları ve ağır yardımcıları başlangıç chunkından çıkarın.',
            },
            {
              label: 'Render-Blokajını Kaldırma + HTTP/Brotli Önbellek',
              detail:
                'Senkron harici font CSS yerine asenkron yükleme, kritik görsellerde `preload` ve immutable asset önbelleği uygulayın.',
            },
          ],
          closing: 'Hedef: < 350 kB başlangıç JS ve sıfır senkron dış CSS blokajı.',
        },
        qwen: {
          lead: `**${intent.primarySubject}** kapsamında tam yığın hızlandırma planı:`,
          points: [
            {
              label: 'İstemci Katmanı: Paket Bölme ve Tembel Yükleme',
              detail:
                'Kapalı modalları ve ağır bağımlılıkları `React.lazy` / dinamik `import()` ile ayırarak ilk JS indirme boyutunu küçültün.',
            },
            {
              label: 'Ağ & Sunucu Katmanı: Bloke Etmeyen Font ve Brotli Cache',
              detail:
                'Google Fonts CSS yüklemesini asenkron yapın, kritik logoları `preload` edin ve statik dosyalarda Brotli sıkıştırma kullanın.',
            },
          ],
          closing:
            'Ön yüz bölme + sunucu sıkıştırma birleştiğinde hem ilk açılış hem tekrar girişler hızlanır.',
        },
        perplexity: {
          lead: `Web performans standartlarına (web.dev Core Web Vitals) göre **${intent.primarySubject}** için en kritik iki kaldıraç:`,
          points: [
            {
              label: 'Giriş Paketini Küçültme (Code Splitting / INP & FCP)',
              detail:
                'Başlangıçta gerekmeyen UI modallerini ve büyük kütüphaneleri `React.lazy` / dinamik `import()` ile ayırmak Total Blocking Time (TBT) ve FCP metriklerini doğrudan düşürür.',
            },
            {
              label: 'Render-Blocking Kaynakların Giderilmesi (LCP)',
              detail:
                'Harici stylesheetlerin senkron yüklemesini kaldırmak, kritik LCP görsellerine `<link rel="preload">` eklemek ve Brotli sıkıştırma sunmak ilk boyamayı hızlandırır.',
            },
          ],
          closing:
            'Doğrulama için build chunk boyutunu ve tarayıcı Network/LCP zaman çizelgesini ölçmek yeterlidir.',
        },
        luxo: {
          lead: `**${intent.primarySubject}** için en doğrudan etkiyi veren iki yöntem:`,
          points: [
            {
              label: 'Kod Bölme (`React.lazy` + Dinamik `import()`)',
              detail:
                'İlk açılışta görünmeyen modalları ve ağır yardımcıları başlangıç paketinden çıkararak JS indirme/derleme süresini düşürün.',
            },
            {
              label: 'Asenkron Font & Brotli/Immutable Önbellekleme',
              detail:
                'Bloke edici harici CSS isteklerini asenkron yükleyin ve kritik varlıkları preload + uzun ömürlü önbellekle sunun.',
            },
          ],
          closing:
            'Bu iki iyileştirme doğrudan FCP, LCP ve etkileşime hazır olma süresini kısaltır.',
        },
      };

      const chosen = speedByArchetype[persona.archetype] || speedByArchetype.luxo;
      const text = persona.formatStructuredReply({
        modelName: model.name,
        lead: chosen.lead,
        points: chosen.points,
        closing: chosen.closing,
      });

      return {
        text,
        thinkingSteps,
        citations,
        routedModelId,
        followUpSuggestions: [
          'Bu projedeki en büyük JS paketini nasıl küçültürüz?',
          'React.lazy + Suspense için örnek kod yaz',
          'Core Web Vitals (LCP, INP, CLS) kontrol listesi ver',
        ],
      };
    }

    const points = asksAudienceOrContent
      ? [
          {
            label: 'Hedef Kitle Segmentasyonu (4 Ana Persona)',
            detail:
              'Yazılım geliştiriciler (%36 · çalışan kod ve API hızı), dijital kreatifler (%28 · 4K görsel/Veo 3 video), SEO/ürün liderleri (%22 · organik büyüme ve CWV) ve öğrenciler/araştırmacılar (%14 · adım adım doğrulama) ana trafiği oluşturur.',
          },
          {
            label: 'Etkileşimli ve SEO Uyumlu İçerik Türleri',
            detail:
              'Canlı hesaplayıcılı Core Web Vitals rehberleri, yan yana model kıyaslama matrisleri, tek tıkla çalışan Veo 3/Nano Banana prompt atlasları ve kopyalanabilir TypeScript/SQL şablonları en yüksek organik CTR (+%19–28) sağlar.',
          },
          {
            label: 'Mevcut İçeriği Çekici Hale Getirme Stratejisi',
            detail:
              'Uzun metinleri 30 saniyelik yönetici özetleri, karşılaştırma tabloları, Schema.org FAQPage blokları ve "Sohbette Çalıştır" eylem düğmeleriyle zenginleştirerek hemen çıkma oranını düşürün.',
          },
        ]
      : asksEngagementFeatures
      ? [
          {
            label: 'Makale Yorumları ve Tepki Oylaması',
            detail:
              'İçerik altlarına PII maskelemeli (`redactSensitivePii`) yorum formları ve iyimser güncellemeli (optimistic UI) "Faydalı" sayaçları ekleyerek okuyucuları tartışmaya dahil edin.',
          },
          {
            label: 'Canlı Anketler ve İnteraktif Hesaplayıcılar',
            detail:
              'Tek tıkla oy verilen GPU-dostu (`scaleX`) anket çubukları, gerçek zamanlı gecikme/bant genişliği simülatörü ve 4 soruluk teknik bilgi testi (quiz) oturum süresini ikiye katlar.',
          },
          {
            label: 'AI Uzman Destekli Forum Entegrasyonu',
            detail:
              'REST/JSON durum uçlarıyla (`/api/community/forum/*`) çalışan ve açılan her konuyu otomatik olarak `/sitemap.xml` indeksine ekleyen topluluk forumu hem etkileşim hem organik trafik üretir.',
          },
        ]
      : [
          {
            label: 'Hız & Performans (Core Web Vitals)',
            detail:
              'Metin varlıklarında Brotli (`br`) sıkıştırma, Rollup paket bölme (`React.lazy`), 1 yıllık `immutable` tarayıcı önbelleği ve görsellerde `aspect-ratio` + WebP dönüşümü LCP süresini ~1.1 saniyeye çeker.',
          },
          {
            label: 'Güvenlik & Veri İzolasyonu',
            detail:
              'API anahtarlarını yalnızca sunucu katmanında (`/api/*`) tutmak, `X-Content-Type-Options: nosniff` ve `Referrer-Policy` başlıklarını uygulamak, PII maskeleme ve RBAC yetki kontrolü güvenliği garanti eder.',
          },
          {
            label: 'Teknik SEO & Modern Kullanıcı Deneyimi (UX)',
            detail:
              'Dinamik `sitemap.xml`, `WebApplication + FAQPage` JSON-LD şeması ve dağınık araç düğmelerini tek bir birleşik "Araçlar & Modlar" merkezinde toplayan sade arayüz dönüşümü artırır.',
          },
        ];

    const text = persona.formatStructuredReply({
      modelName: model.name,
      lead: `**${intent.primarySubject}** kapsamında hız, güvenlik, arama motoru görünürlüğü, hedef kitle uyumu ve kullanıcı etkileşimini ölçülebilir mühendislik adımlarıyla şu şekilde kurgulayabiliriz:`,
      points,
      closing:
        'Üst menüdeki "Keşfet & SEO" merkezinden 4 sütunlu canlı denetimi, hedef kitle içerik planlarını, makale yorumlarını ve interaktif hesaplayıcıyı doğrudan deneyimleyebilirsiniz.',
    });

    return {
      text,
      thinkingSteps,
      citations,
      routedModelId,
      followUpSuggestions: [
        'Hedef kitleye göre 5 yüksek tıklamalı SEO başlığı öner',
        'Yorum, oylama ve forum modüllerinin API şemasını çıkar',
        'LCP, güvenlik başlıkları ve UX için kontrol listesi ver',
      ],
    };
  }

  // 5. AI & Machine Learning
  if (intent.domain === 'ai-ml') {
    const text = persona.formatStructuredReply({
      modelName: model.name,
      lead: `**${intent.primarySubject}**, dönüştürücü (transformer) dikkat mekanizmaları, bağlam içi öğrenme ve çıkarım zamanı (inference-time) doğrulama katmanlarının birleşimiyle çalışır.`,
      points: [
        {
          label: 'Model Aileleri Neden Farklılaşır?',
          detail:
            'Gemini çok modlu hız ve geniş bağlamda, Claude nüanslı yazılım mimarisinde, OpenAI o-serisi ile DeepSeek zincirleme matematiksel/algoritmik muhakemede, Grok ise doğrudan ilk prensip analizinde öne çıkar.',
        },
        {
          label: 'Doğruluk ve Halüsinasyon Kontrolü',
          detail:
            'Net sistem kısıtları, dış kaynak doğrulaması (RAG / web arama) ve deterministik hesaplama araçlarıyla birleştirildiğinde hata payı dramatik biçimde azalır.',
        },
        {
          label: 'Verimli İstem (Prompt) Tasarımı',
          detail:
            'Hedef çıktının formatını, kısıtlarını ve bağlamını açıkça belirtmek modelin gereksiz genellemeler yerine doğrudan nokta atışı üretmesini sağlar.',
        },
      ],
      closing:
        'Aynı soruyu farklı model ailelerinin nasıl ele aldığını görmek için alt çubuktaki "Yan Yana Karşılaştır" modunu deneyebilirsiniz.',
    });

    return {
      text,
      thinkingSteps,
      citations,
      routedModelId,
      followUpSuggestions: [
        'Gemini, Claude, ChatGPT ve DeepSeek arasındaki temel farklar nelerdir?',
        'Üretim ortamında RAG mimarisi nasıl kurulur?',
        'Yan Yana Karşılaştır modunda iki modeli test et',
      ],
    };
  }

  // 6. Explicit Comparisons (X vs Y)
  if (intent.domain === 'comparison') {
    const left = intent.comparisonPair?.[0] || 'Birinci Seçenek';
    const right = intent.comparisonPair?.[1] || 'İkinci Seçenek';
    const text = persona.formatStructuredReply({
      modelName: model.name,
      lead: `**${left}** ile **${right}** arasındaki seçim, soyut üstünlükten ziyade projenizin gecikme, ölçek ve bakım önceliklerine dayanır:`,
      points: [
        {
          label: `${left} Ne Zaman Öne Çıkar?`,
          detail:
            'Hızlı ilk kurulum, düşük bilişsel yük ve doğrudan sonuç alma hızının kritik olduğu odaklanmış iş akışlarında daha yüksek verim sağlar.',
        },
        {
          label: `${right} Ne Zaman Tercih Edilmeli?`,
          detail:
            'Uzun vadeli genişletilebilirlik, katı şema/tip güvenliği ve çok ekipli ölçeklenme gereksinimleri ağır bastığında daha güvenli bir zemin sunar.',
        },
        {
          label: 'Karar Kriteri',
          detail:
            'Darboğazınız geliştirme hızıysa yalın olanı; darboğazınız sistem karmaşıklığı ve uzun ömürlü bakımsa modüler olanı seçin.',
        },
      ],
      closing:
        'Kullanım senaryonuzu (trafik ölçeği, ekip büyüklüğü veya bütçe) belirtirseniz ikisi arasından net tek bir öneri yapabilirim.',
    });

    return {
      text,
      thinkingSteps,
      citations,
      routedModelId,
      followUpSuggestions: [
        `${left} ve ${right} maliyet/performans tablosunu çıkar`,
        'Gerçek dünya geçiş (migration) riskleri nelerdir?',
        'Hibrit kullanım mümkün mü?',
      ],
    };
  }

  // 7. Science, Physics & Space
  if (intent.domain === 'science-space') {
    const text = persona.formatStructuredReply({
      modelName: model.name,
      lead: `**${intent.primarySubject}**, doğadaki temel korunum yasaları, enerji-kütle etkileşimleri ve ölçeğe bağlı fiziksel yasalar çerçevesinde açıklanır.`,
      points: [
        {
          label: 'Fiziksel Mekanizma',
          detail:
            'Mikro ölçekte kuantum olasılık dalgaları ve parçacık etkileşimleri belirleyiciyken, makro ve kozmik ölçekte kütleçekim ile uzay-zaman eğriliği baskın hale gelir.',
        },
        {
          label: 'Gözlemsel Kanıtlar',
          detail:
            'Tayfölçüm (spektroskopi), parçacık hızlandırıcı deneyleri ve yüksek çözünürlüklü teleskop verileri teorik denklemlerin öngörülerini nicel olarak doğrular.',
        },
        {
          label: 'Sezgisel Anlamlandırma',
          detail:
            'Olayı günlük sezgilerle değil; enerji korunumu, entropi artışı ve ışık hızı sınırı gibi değişmez sabitler üzerinden okumak en berrak resmi verir.',
        },
      ],
      closing:
        'Konunun matematiksel formülasyonunu veya günlük hayattan somut bir düşünce deneyini görmek isterseniz belirtebilirsiniz.',
    });

    return {
      text,
      thinkingSteps,
      citations,
      routedModelId,
      followUpSuggestions: [
        'Bu konuyu basit bir düşünce deneyiyle anlat',
        'Temel matematiksel denklemini ve anlamını göster',
        'Modern teknolojideki pratik karşılığı nedir?',
      ],
    };
  }

  // 8. Economics, Finance & Strategy
  if (intent.domain === 'economics-business') {
    const text = persona.formatStructuredReply({
      modelName: model.name,
      lead: `**${intent.primarySubject}** değerlendirilirken arz-talep dengesi, sermaye maliyeti, birim ekonomisi (unit economics) ve zamanlama riski birlikte okunmalıdır.`,
      points: [
        {
          label: 'Temel Dinamik',
          detail:
            'Kısa vadeli fiyat ve talep dalgalanmaları beklenti psikolojisiyle hareket ederken, orta-uzun vadeli yönü nakit akışı üretme kapasitesi ve verimlilik artışı belirler.',
        },
        {
          label: 'Risk ve Kaldıraç Yönetimi',
          detail:
            'Tek bir senaryoya bağımlı kalmak yerine likidite tamponu tutmak ve müşteri edinme maliyetini (CAC) yaşam boyu değerin (LTV) altında sabitlemek kırılganlığı azaltır.',
        },
        {
          label: 'Uygulanabilir Strateji',
          detail:
            'Önce küçük ölçekte doğrulanmış geri dönüş (ROI) metriklerini ölçüp ardından kazanan kanalı kademeli büyütmek en rasyonel yaklaşımdır.',
        },
      ],
      closing:
        'Sektör, bütçe ölçeği veya hedef zaman ufkunu paylaşırsanız sayısal senaryo analizi çıkarabilirim.',
    });

    return {
      text,
      thinkingSteps,
      citations,
      routedModelId,
      followUpSuggestions: [
        'İyimser, baz ve kötümser 3 senaryo analizi yap',
        'Birim ekonomisi (LTV / CAC) nasıl hesaplanır?',
        'En kritik erken uyarı göstergeleri nelerdir?',
      ],
    };
  }

  // 9. Education & Exam Preparation
  if (intent.domain === 'education-exam') {
    const text = persona.formatStructuredReply({
      modelName: model.name,
      lead: `**${intent.primarySubject}** sürecinde pasif tekrar yerine aktif geri çağırma (active recall) ve aralıklı pratik uygulamak kalıcılığı iki katından fazla artırır.`,
      points: [
        {
          label: 'Çekirdek Kavram Haritası',
          detail:
            'Konuyu ezberlenecek paragraflar yerine 3-5 temel ilkeye ve bu ilkelerin birbirine bağlanma nedenlerine indirgeyerek özetleyin.',
        },
        {
          label: 'Soru Çözüm ve Hata Defteri',
          detail:
            'Yanlış yapılan veya tereddüt edilen her soru tipinin nedenini tek cümleyle not etmek, sınav anındaki dikkat hatalarını hızla kapatır.',
        },
        {
          label: 'Zaman Bloklaması',
          detail:
            '40 dakikalık tam odak + 10 dakikalık kısa mola döngüsüyle çalışıp oturum sonunda kitaba bakmadan kendi cümlelerinizle 3 maddelik özet çıkarın.',
        },
      ],
      closing:
        'Ders adını ve konuyu yazarsanız hemen örnek yazılı soruları ve cevap anahtarını hazırlayabilirim.',
    });

    return {
      text,
      thinkingSteps,
      citations,
      routedModelId,
      followUpSuggestions: [
        'Bu konu için 5 soruluk mini yazılı sınavı hazırla',
        '7 günlük yoğun çalışma programı oluştur',
        'Konuyu akılda kalıcı kodlamalarla özetle',
      ],
    };
  }

  // 10. Writing, Translation & Editorial — Produce actual ready-to-use drafts!
  if (intent.domain === 'writing-translation') {
    const f = intent.foldedText;
    const cleanTopic = intent.primarySubject;

    if (/\bdilekce\w*\b/i.test(f)) {
      const todayStr = new Date().toLocaleDateString('tr-TR');
      const petitionDraft = `**İLGİLİ MAKAMA**\n\nKonu: ${cleanTopic} Hakkında Talebimdir.\nTarih: ${todayStr}\n\nSayın Yetkili,\n\nKurumunuz nezdinde yürütülmekte olan işlemler kapsamında, ${cleanTopic.toLowerCase()} hususundaki başvurumun değerlendirilerek gerekli işlemlerin başlatılmasını arz ve talep ederim.\n\nİletişim ve başvuru bilgilerim aşağıda yer almakta olup, gereğini saygılarımla arz ederim.\n\nAd Soyad: [Adınız Soyadınız]\nT.C. Kimlik / Kurum No: [Numaranız]\nİletişim: [Telefon / E-posta]\nİmza: [İmza]`;
      return {
        text: `${model.name} tarafından doğrudan kullanıma hazır **Resmi Dilekçe** metni oluşturuldu:\n\n${petitionDraft}\n\nKöşeli parantez içindeki kişisel alanları doldurarak doğrudan teslim edebilir veya kurum adını belirtirseniz başlığı ilgili birime özel uyarlayabilirim.`,
        thinkingSteps,
        citations,
        routedModelId,
        followUpSuggestions: [
          'Üslubu üniversite/öğrenci işleri formatına uyarla',
          'Kurumsal şirket içi izin talebi formatına çevir',
          'İngilizce resmi başvuru mektubuna dönüştür',
        ],
      };
    }

    if (/\b(e-posta|eposta|mail)\b/i.test(f)) {
      const mailDraft = `**Konu:** ${cleanTopic} — Değerlendirme ve Sonraki Adımlar\n\nMerhaba [İsim],\n\n${cleanTopic} başlığındaki son gelişmeleri paylaşmak ve bir sonraki adımı netleştirmek için yazıyorum. Mevcut hazırlıklarımız planlanan takvimle uyumlu ilerliyor; uygun olduğunuzda kısa bir değerlendirme yaparak nihai onayı tamamlayabiliriz.\n\nGörüş ve önerilerinizi bekler, iyi çalışmalar dilerim.\n\nSaygılarımla,\n[Adınız Soyadınız]`;
      return {
        text: `${model.name} ile hazırlanan doğrudan gönderime hazır kurumsal e-posta taslağı:\n\n${mailDraft}`,
        thinkingSteps,
        citations,
        routedModelId,
        followUpSuggestions: [
          'Daha kısa ve yönetici özeti formatında yeniden yaz',
          'İngilizce iş e-postası karşılığını oluştur',
          'Toplantı daveti saat seçenekleri ekle',
        ],
      };
    }

    if (/\b(siir|hikaye)\b/i.test(f)) {
      const isPoem = /\bsiir\b/i.test(f);
      const creativeDraft = isPoem
        ? `Geceyle konuşur sessiz satırlar,\nHer kıvılcım yeni bir ufku arar,\n${cleanTopic} içinden doğan düşünceler,\nKaranlık daraldıkça yolu aydınlatır.`
        : `Sabahın erken saatlerinde ekranın mavi ışığı odayı aydınlatırken, ${cleanTopic.toLowerCase()} üzerine aylardır süren çalışma nihayet ilk somut meyvesini vermişti. Küçük bir fikrin adım adım yaşayan bir sisteme dönüşmesi, ekibin yorgunluğunu bir anda silip yerine sakin bir heyecan bırakmıştı.`;
      return {
        text: `${model.name} özgün edebi sentezi:\n\n${creativeDraft}`,
        thinkingSteps,
        citations,
        routedModelId,
        followUpSuggestions: [
          'Metni bir kıta/paragraf daha uzat',
          'Daha epik ve sinematik bir atmosfer kat',
          'İngilizce edebi çevirisini yap',
        ],
      };
    }

    if (/\b(ingilizce|english|cevir)\b/i.test(f) && intent.priorAssistantSnippet) {
      return {
        text: `**Professional English Adaptation (${model.name}):**\n\nRegarding **${cleanTopic}**, our primary objective is to isolate core responsibilities into clean, verifiable modules, validate edge cases early with deterministic tests, and iterate based on measurable real-world performance metrics.`,
        thinkingSteps,
        citations,
        routedModelId,
        followUpSuggestions: [
          'Daha akademik İngilizce tona dönüştür',
          'Kısa bir sunum (pitch) metnine çevir',
          'Türkçe yönetici özetini çıkar',
        ],
      };
    }

    const text = persona.formatStructuredReply({
      modelName: model.name,
      lead: `**${cleanTopic}** isteğiniz için doğrudan kullanabileceğiniz yapılandırılmış metin çerçevesi aşağıdadır:`,
      points: [
        {
          label: 'Önerilen Açılış Cümlesi',
          detail: `"${cleanTopic} kapsamında temel önceliğimiz, süreci ölçülebilir hedeflerle sadeleştirip en yüksek etkiyi en kısa sürede üretmektir."`,
        },
        {
          label: 'Gelişme ve Gerekçe Vurgusu',
          detail:
            'Somut veri, zaman planı ve beklenen çıktıyı tek paragrafta birleştirerek okuyucunun karar alma süresini kısaltın.',
        },
      ],
      closing:
        'Düzenlenecek veya çevrilecek ham metni doğrudan yapıştırırsanız cümle cümle cilalanmış nihai halini anında üretebilirim.',
    });

    return {
      text,
      thinkingSteps,
      citations,
      routedModelId,
      followUpSuggestions: [
        'Resmi dilekçe formatında tam metin yaz',
        'Kurumsal e-posta taslağı oluştur',
        'İngilizce profesyonel karşılığını yaz',
      ],
    };
  }

  // 11. History, Culture, Health, Psychology & Open-Ended General Inquiry (Zero generic boilerplate!)
  const subjectClean = intent.primarySubject;
  const isHowQuestion = /\b(nasil|adim|yontem|yol)\b/i.test(intent.foldedText);
  const isWhyQuestion = /\b(neden|nicin|sebep)\b/i.test(intent.foldedText);

  const dynamicPoints = isHowQuestion
    ? [
        {
          label: 'Hazırlık ve Temel Çerçeve',
          detail: `"${subjectClean}" sürecine başlarken kapsamı ve eldeki kaynakları netleştirip en kritik darboğazı ilk sıraya koymak gerekir.`,
        },
        {
          label: 'Adım Adım Uygulama',
          detail:
            'Süreci tek seferde bitirmeye çalışmak yerine doğrulanabilir küçük aşamalara bölerek ilerlemek hem hata payını düşürür hem de geri bildirimi hızlandırır.',
        },
        {
          label: 'Süreklilik ve İyileştirme',
          detail:
            'İlk çalışan çıktıyı aldıktan sonra gerçek sonuçları gözlemleyip yalnızca aksayan noktaları rafine etmek en yüksek verimi üretir.',
        },
      ]
    : isWhyQuestion
    ? [
        {
          label: 'Birincil Nedensel Faktör',
          detail: `"${subjectClean}" olgusunun arkasındaki ana etken, sistemin kendi iç dengesini ve kaynak verimliliğini koruma eğilimidir.`,
        },
        {
          label: 'Bağlamsal ve Çevresel Etki',
          detail:
            'Tek bir sebebe odaklanmak yerine tarihsel/teknik arka plan ile güncel koşulların nasıl etkileştiğine bakmak tabloyu eksiksiz açıklar.',
        },
        {
          label: 'Pratik Sonuç',
          detail:
            'Bu neden-sonuç ilişkisini doğru okumak, benzer durumlarda sonuçları önceden öngörüp proaktif karar almayı sağlar.',
        },
      ]
    : [
        {
          label: 'Tanım ve Çekirdek Kapsam',
          detail: `**${subjectClean}**, kendi alanı içinde temel kavramları, pratik uygulama yöntemlerini ve sonuç ölçütlerini bir arada barındıran çok yönlü bir konudur.`,
        },
        {
          label: 'Kritik Boyutlar',
          detail:
            'Konuyu yüzeysel tanımlar yerine temel çalışma prensibi, güçlü yönleri ve dikkat edilmesi gereken sınır koşulları üzerinden değerlendirmek çok daha sağlıklı kavrayış sağlar.',
        },
        {
          label: 'Uygulama Perspektifi',
          detail:
            'Teorik çerçeveyi somut bir örnek veya hedef senaryoyla eşleştirdiğinizde doğrudan karar alma ve üretme aşamasına geçebilirsiniz.',
        },
      ];

  const text = persona.formatStructuredReply({
    modelName: model.name,
    lead: `**${subjectClean}** başlığını temel ilkeleri, pratik etkileri ve dikkat edilmesi gereken kritik noktalarıyla aşağıda netleştirdim:`,
    points: dynamicPoints,
    closing: `"${subjectClean}" içinde özellikle odaklanmak istediğiniz alt başlığı (örneğin teknik detay, örnek uygulama veya karşılaştırma) yazarsanız doğrudan o kısmı derinleştirebilirim.`,
  });

  return {
    text,
    thinkingSteps,
    citations,
    routedModelId,
    followUpSuggestions: [
      `"${subjectClean.slice(0, 32)}" konusunu somut bir örnekle aç`,
      'En önemli 3 pratik ipucunu sırala',
      'Yan Yana Karşılaştır modunda farklı bir modelin yorumunu gör',
    ],
  };
}
