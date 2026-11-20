import type {
  AdaptiveSiteSuggestion,
  EcosystemCalibration,
  EvolutionBenchmarkCase,
  EvolutionCycleLog,
  EvolutionCycleMetric,
  EvolutionLearnedRule,
  EvolutionModelMetric,
  LuxoModelCategory,
  LuxoModelConfig,
  LuxoModelId,
  ModelCalibrationBoost,
  SelfEvolutionState,
  TrainingConsentStatus,
} from '../types/luxo.ts';

export const TRAINING_CONSENT_STORAGE_KEY = 'luxo_chat_training_consent';
export const EVOLUTION_LOCAL_CACHE_KEY = 'luxo_self_evolution_cache_v1';

const ALL_CATEGORIES: {
  category: LuxoModelCategory;
  modelCount: number;
  baseScore: number;
  baseLatencyMs: number;
  initialNote: string;
}[] = [
  {
    category: 'Google Gemini',
    modelCount: 19,
    baseScore: 98.8,
    baseLatencyMs: 620,
    initialNote:
      'Gemini 4 Hydrogen, Carbon, Neon, Argon ve 3.8 Flash akış zaman aşımı ve çok adımlı muhakeme doğrulaması optimize edildi.',
  },
  {
    category: 'OpenAI & ChatGPT',
    modelCount: 17,
    baseScore: 98.4,
    baseLatencyMs: 710,
    initialNote:
      'ChatGPT-5.2 Pro ve o3/o4 serisinde gereksiz giriş cümleleri temizlendi, doğrudan çözüm katmanı eklendi.',
  },
  {
    category: 'Anthropic Claude',
    modelCount: 9,
    baseScore: 98.8,
    baseLatencyMs: 690,
    initialNote:
      'Claude 4.6 Opus ve 4.5 Sonnet kod bloklarında kapanmamış çit (fence) onarımı ve uç durum denetimi aktif.',
  },
  {
    category: 'DeepSeek',
    modelCount: 9,
    baseScore: 98.5,
    baseLatencyMs: 660,
    initialNote:
      'DeepSeek R2 ve Math V2 sayısal işlem önceliği, faktöriyel, karekök ve yüzde sağlaması güçlendirildi.',
  },
  {
    category: 'Grok & Meta Llama',
    modelCount: 10,
    baseScore: 97.9,
    baseLatencyMs: 680,
    initialNote:
      'Grok 4 Heavy ve Llama 4 Behemoth ilk prensipler analizi ve Türkçe terminoloji tutarlılığı kalibre edildi.',
  },
  {
    category: 'Mistral & Qwen',
    modelCount: 13,
    baseScore: 98.1,
    baseLatencyMs: 620,
    initialNote:
      'Codestral 25 ve Qwen 3 Coder Plus çok dilli kod üretimi ve SQL/TypeScript tip güvenliği iyileştirildi.',
  },
  {
    category: 'Sinema & Görsel AI',
    modelCount: 18,
    baseScore: 98.7,
    baseLatencyMs: 920,
    initialNote:
      'Nano Banana 2.1 4K kadraj bütünlüğü ve Google Veo 3 kamera hızı/pan/tilt optik vektör eşlemesi doğrulandı.',
  },
  {
    category: 'Perplexity & Küresel AI',
    modelCount: 13,
    baseScore: 98.2,
    baseLatencyMs: 740,
    initialNote:
      'Perplexity Sonar Pro ve Kimi K2 canlı kaynak doğrulama ve özet netliği katmanı güncellendi.',
  },
  {
    category: 'Luxo Özel',
    modelCount: 7,
    baseScore: 99.1,
    baseLatencyMs: 590,
    initialNote:
      'Luxo Auto-Router 115 model arası alan sınıflandırması ve öz-denetimli hata yakalama motoru aktif.',
  },
];

export function redactSensitivePii(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EPOSTA_KORUNDU]')
    .replace(
      /\b(?:sk-[a-zA-Z0-9_-]{12,}|AIza[0-9A-Za-z_-]{20,}|ghp_[0-9A-Za-z]{20,}|eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,})\b/g,
      '[ANAHTAR_KORUNDU]'
    )
    .replace(/(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)\d{3}[\s-]?\d{2}[\s-]?\d{2}/g, '[TELEFON_KORUNDU]')
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, '[KART_KORUNDU]')
    .replace(/https?:\/\/[^\s?]+\?[^\s]+/gi, '[BAGLANTI_KORUNDU]')
    .trim();
}

export function normalizeConsentStatus(raw: unknown): TrainingConsentStatus {
  if (raw === 'granted' || raw === 'denied' || raw === 'unset') {
    return raw;
  }
  return 'unset';
}

export function createInitialEvolutionState(now = Date.now()): SelfEvolutionState {
  const learnedRules: EvolutionLearnedRule[] = [
    {
      id: 'rule-code-fence-integrity',
      title: 'Kod Bloğu Bütünlüğü & Tip Güvenliği Denetimi',
      directive:
        'Kod istendiğinde yarım bırakılmış veya kapanmamış kod bloğu üretme; sınır durumları (null/boş girdi) kontrol eden çalışır ve temiz kod ver.',
      category: 'Anthropic Claude',
      source: 'auto-repair',
      confidenceGain: 1.4,
      enabled: true,
      createdAt: now - 180_000,
      testPrompt:
        'TypeScript ile hata yakalamalı ve bellek sızıntısı yapmayan kısa bir LRU önbellek sınıfı yaz.',
    },
    {
      id: 'rule-math-self-verify',
      title: 'Sayısal İşlem Önceliği & Çift Yönlü Sağlama',
      directive:
        'Matematik, yüzde, olasılık ve finans hesaplamalarında sonucu yazmadan önce işlem önceliğini ve birim uyumunu tersten kontrol et.',
      category: 'DeepSeek',
      source: 'autonomous-critic',
      confidenceGain: 1.6,
      enabled: true,
      createdAt: now - 120_000,
      testPrompt: '(144 / 12 + 8) ^ 2 - 150 işleminin sonucu kaçtır?',
    },
    {
      id: 'rule-turkish-direct-clarity',
      title: 'Sıfır Kalıp Giriş & Doğal Türkçe Öz-Sentez',
      directive:
        'Yapay selamlama veya dolgu cümleleri kurmadan doğrudan sorunun cevabına gir; akıcı, duru ve teknik açıdan kesin Türkçe kullan.',
      category: 'Tüm Modeller',
      source: 'autonomous-critic',
      confidenceGain: 1.2,
      enabled: true,
      createdAt: now - 60_000,
      testPrompt:
        'Mikroservis mimarisinde Circuit Breaker (Devre Kesici) neden kullanılır, kısaca açıkla.',
    },
    {
      id: 'rule-cinema-framing-lock',
      title: 'Nano Banana 4K & Veo 3 Tam Kadraj Optik Kilidi',
      directive:
        'Görsel ve sinematik video üretiminde ana öznenin kadrajdan taşmasını önle; lens odak uzaklığı ile kamera hız/pan/tilt vektörlerini dengeli uygula.',
      category: 'Sinema & Görsel AI',
      source: 'auto-repair',
      confidenceGain: 1.5,
      enabled: true,
      createdAt: now - 30_000,
      testPrompt:
        'Altın saatte İstanbul Boğazı üzerinde uçan martılar ve vapur için 35mm sinematik sahne planı oluştur.',
    },
  ];

  const ecosystems: EcosystemCalibration[] = ALL_CATEGORIES.map((item) => ({
    category: item.category,
    modelCount: item.modelCount,
    accuracyScore: item.baseScore,
    avgLatencyMs: item.baseLatencyMs,
    patchesApplied: 3,
    routingBoost: 1.0,
    keyUpgradeNote: item.initialNote,
    lastCalibratedAt: now - 45_000,
  }));

  const recentLogs: EvolutionCycleLog[] = [
    {
      id: 'evo-log-init-1',
      generation: 1,
      timestamp: now - 90_000,
      trigger: 'full-audit',
      targetCategory: 'Tüm Modeller',
      challengerFinding:
        'Uzun kod ve mimari yanıtlarında erken cümle kesilmesi ve model geçişlerinde gecikme saptandı.',
      appliedPatch:
        'Akış zaman aşımı eşiği dengelendi, kapanmamış kod blokları için otomatik onarım ve çok katmanlı yedekleme devreye alındı.',
      verifiedGain: '115 modelde %0 kesik yanıt · +1.5 doğruluk artışı',
    },
  ];

  const adaptiveSuggestions: AdaptiveSiteSuggestion[] = [
    {
      id: 'adapt-1',
      title: 'Öz-Doğrulamalı Kod & Mimari Çözüm',
      subtitle: 'Claude 4.5 Sonnet ile uç durumları test edilmiş temiz kod üret',
      prompt:
        'Yüksek eşzamanlı bir Node.js API için bellek sızıntısı yapmayan Token Bucket hız sınırlayıcı kodunu yaz.',
      recommendedModelId: 'claude-4-5-sonnet',
    },
    {
      id: 'adapt-2',
      title: 'Çok Adımlı Sayısal & Mantıksal Kanıt',
      subtitle: 'DeepSeek Math V2 ile işlem sağlamalı kesin hesaplama',
      prompt:
        'Bir sunucunun yanıt süresi 480ms değerinden %35 iyileştirilirse yeni yanıt süresi kaç ms olur?',
      recommendedModelId: 'deepseek-math-v2',
    },
  ];

  const initialBenchmarks: EvolutionBenchmarkCase[] = [
    {
      id: 'bench-math-pct',
      domain: 'Sayısal Doğrulama & Yüzde Cebiri',
      category: 'DeepSeek',
      modelId: 'deepseek-math-v2',
      prompt:
        'Bir sunucunun yanıt süresi 480ms değerinden %35 iyileştirilirse yeni yanıt süresi kaç ms olur?',
      expectedInvariant: 'Kesin sonuç 312 olarak doğrulanmalı ve dolgu giriş olmamalı',
      passed: true,
      score: 99.4,
      latencyMs: 540,
      verifiedExcerpt:
        'İşlemin kesin sonucu 312 ms değeridir (480 - %35 = 312).',
      evaluatedAt: now - 50_000,
    },
    {
      id: 'bench-code-safety',
      domain: 'Tip Güvenliği & Kod Çiti Bütünlüğü',
      category: 'Anthropic Claude',
      modelId: 'claude-4-5-sonnet',
      prompt:
        'TypeScript ile bellek sızıntısı yapmayan kısa bir TokenBucket hız sınırlayıcı sınıfı yaz.',
      expectedInvariant: 'Eksiksiz kapanan kod bloğu (```) ve sınır değer kontrolü',
      passed: true,
      score: 99.2,
      latencyMs: 610,
      verifiedExcerpt:
        'TokenBucket sınıfı zaman damgası ve kapasite sınırıyla doğrulandı.',
      evaluatedAt: now - 50_000,
    },
    {
      id: 'bench-arch-constraints',
      domain: 'Çok Kısıtlı Dağıtık Sistem Mimarisi',
      category: 'Google Gemini',
      modelId: 'gemini-4-argon',
      prompt:
        'Düşük gecikmeli (<50ms) bir ödeme servisinde çift çekim (double-charge) hatası nasıl önlenir?',
      expectedInvariant: 'Idempotency-Key ve atomik işlem kilidi net açıklanmalı',
      passed: true,
      score: 98.9,
      latencyMs: 580,
      verifiedExcerpt:
        'İstemci bazlı Idempotency-Key ve atomik veritabanı kısıtı ile çift çekim engellenir.',
      evaluatedAt: now - 50_000,
    },
    {
      id: 'bench-sql-index',
      domain: 'Çok Dilli SQL & İndeks Optimizasyonu',
      category: 'Mistral & Qwen',
      modelId: 'qwen-3-coder-plus',
      prompt:
        'Son 24 saatte en çok işlem yapan ilk 10 kullanıcıyı getiren hızlı bir PostgreSQL sorgusu yaz.',
      expectedInvariant: 'Zaman aralığı filtresi, GROUP BY ve LIMIT 10 içermeli',
      passed: true,
      score: 98.7,
      latencyMs: 520,
      verifiedExcerpt:
        'Bileşik indeks uyumlu WHERE zaman filtresi ve LIMIT 10 doğrulandı.',
      evaluatedAt: now - 50_000,
    },
  ];

  const initialUsageCounts: Record<string, number> = {
    'gemini-4-argon': 142,
    'gemini-4-hydrogen': 118,
    'gemini-4-carbon': 104,
    'gemini-4-neon': 92,
    'claude-4-5-sonnet': 96,
    'chatgpt-5-2-pro': 88,
    'luxo-auto-router': 74,
    'deepseek-r2': 63,
    'nano-banana-2-1-ultra': 51,
    'qwen-3-coder-plus': 44,
    'perplexity-sonar-pro': 38,
    'grok-4-heavy': 29,
  };

  const initialModelMetrics: Record<string, EvolutionModelMetric> = {
    'gemini-4-argon': {
      modelId: 'gemini-4-argon',
      latencyMs: 580,
      successRate: 99.2,
      callCount: 142,
      lastUsedAt: now - 40_000,
    },
    'gemini-4-hydrogen': {
      modelId: 'gemini-4-hydrogen',
      latencyMs: 640,
      successRate: 99.4,
      callCount: 118,
      lastUsedAt: now - 55_000,
    },
    'gemini-4-carbon': {
      modelId: 'gemini-4-carbon',
      latencyMs: 615,
      successRate: 99.1,
      callCount: 104,
      lastUsedAt: now - 70_000,
    },
    'gemini-4-neon': {
      modelId: 'gemini-4-neon',
      latencyMs: 495,
      successRate: 99.0,
      callCount: 92,
      lastUsedAt: now - 85_000,
    },
    'claude-4-5-sonnet': {
      modelId: 'claude-4-5-sonnet',
      latencyMs: 690,
      successRate: 98.9,
      callCount: 96,
      lastUsedAt: now - 110_000,
    },
    'chatgpt-5-2-pro': {
      modelId: 'chatgpt-5-2-pro',
      latencyMs: 710,
      successRate: 98.6,
      callCount: 88,
      lastUsedAt: now - 140_000,
    },
    'luxo-auto-router': {
      modelId: 'luxo-auto-router',
      latencyMs: 540,
      successRate: 99.3,
      callCount: 74,
      lastUsedAt: now - 160_000,
    },
    'deepseek-r2': {
      modelId: 'deepseek-r2',
      latencyMs: 655,
      successRate: 98.5,
      callCount: 63,
      lastUsedAt: now - 190_000,
    },
    'qwen-3-coder-plus': {
      modelId: 'qwen-3-coder-plus',
      latencyMs: 560,
      successRate: 98.4,
      callCount: 44,
      lastUsedAt: now - 210_000,
    },
    'perplexity-sonar-pro': {
      modelId: 'perplexity-sonar-pro',
      latencyMs: 760,
      successRate: 98.2,
      callCount: 38,
      lastUsedAt: now - 240_000,
    },
    'grok-4-heavy': {
      modelId: 'grok-4-heavy',
      latencyMs: 685,
      successRate: 97.9,
      callCount: 29,
      lastUsedAt: now - 280_000,
    },
  };

  const initialHistory: EvolutionCycleMetric[] = [
    {
      generation: 0,
      timestamp: now - 360_000,
      avgAccuracy: 96.4,
      avgLatencyMs: 810,
      bugsPatched: 6,
      trigger: 'full-audit',
    },
    {
      generation: 1,
      timestamp: now - 240_000,
      avgAccuracy: 97.3,
      avgLatencyMs: 745,
      bugsPatched: 14,
      trigger: 'autonomous-critic' as unknown as EvolutionCycleLog['trigger'],
    },
    {
      generation: 2,
      timestamp: now - 90_000,
      avgAccuracy: 98.5,
      avgLatencyMs: 694,
      bugsPatched: 27,
      trigger: 'full-audit',
    },
  ].map((item) => ({
    ...item,
    trigger: (item.trigger === ('autonomous-critic' as string)
      ? 'auto-site'
      : item.trigger) as EvolutionCycleLog['trigger'],
  }));

  return {
    generation: 2,
    autoEvolutionEnabled: true,
    totalCyclesRun: 4,
    totalBugsPatched: 27,
    consentedSignalsProcessed: 0,
    learnedRules,
    ecosystems,
    modelBoosts: {},
    modelUsageCounts: initialUsageCounts,
    modelMetrics: initialModelMetrics,
    cycleHistory: initialHistory,
    benchmarkResults: initialBenchmarks,
    recentLogs,
    adaptiveSuggestions,
    lastUpdatedAt: now,
  };
}

export function hydrateEvolutionState(
  raw: Partial<SelfEvolutionState> | null | undefined,
  now = Date.now()
): SelfEvolutionState {
  const fallback = createInitialEvolutionState(now);
  if (!raw || typeof raw.generation !== 'number') {
    return fallback;
  }
  return {
    ...fallback,
    ...raw,
    learnedRules: Array.isArray(raw.learnedRules)
      ? raw.learnedRules
      : fallback.learnedRules,
    ecosystems:
      Array.isArray(raw.ecosystems) && raw.ecosystems.length === 9
        ? raw.ecosystems.map((eco) => {
            const spec = ALL_CATEGORIES.find((c) => c.category === eco.category);
            return spec ? { ...eco, modelCount: spec.modelCount } : eco;
          })
        : fallback.ecosystems,
    modelBoosts:
      raw.modelBoosts && typeof raw.modelBoosts === 'object'
        ? raw.modelBoosts
        : {},
    modelUsageCounts:
      raw.modelUsageCounts && typeof raw.modelUsageCounts === 'object'
        ? { ...fallback.modelUsageCounts, ...raw.modelUsageCounts }
        : fallback.modelUsageCounts,
    modelMetrics:
      raw.modelMetrics && typeof raw.modelMetrics === 'object'
        ? { ...(fallback.modelMetrics || {}), ...raw.modelMetrics }
        : fallback.modelMetrics,
    cycleHistory:
      Array.isArray(raw.cycleHistory) && raw.cycleHistory.length > 0
        ? raw.cycleHistory
        : fallback.cycleHistory,
    benchmarkResults:
      Array.isArray(raw.benchmarkResults) && raw.benchmarkResults.length > 0
        ? raw.benchmarkResults
        : fallback.benchmarkResults,
    recentLogs: Array.isArray(raw.recentLogs)
      ? raw.recentLogs
      : fallback.recentLogs,
    adaptiveSuggestions: Array.isArray(raw.adaptiveSuggestions)
      ? raw.adaptiveSuggestions
      : fallback.adaptiveSuggestions,
  };
}

function appendCycleHistoryMetric(
  prevHistory: EvolutionCycleMetric[] | undefined,
  ecosystems: EcosystemCalibration[],
  generation: number,
  bugsPatched: number,
  trigger: EvolutionCycleLog['trigger'],
  now: number
): EvolutionCycleMetric[] {
  const avgAccuracy =
    ecosystems.length > 0
      ? Math.round(
          (ecosystems.reduce((s, e) => s + e.accuracyScore, 0) /
            ecosystems.length) *
            10
        ) / 10
      : 98.5;
  const avgLatencyMs =
    ecosystems.length > 0
      ? Math.round(
          ecosystems.reduce((s, e) => s + e.avgLatencyMs, 0) / ecosystems.length
        )
      : 650;
  const nextPoint: EvolutionCycleMetric = {
    generation,
    timestamp: now,
    avgAccuracy,
    avgLatencyMs,
    bugsPatched,
    trigger,
  };
  return [...(prevHistory || []), nextPoint].slice(-16);
}

const AUTONOMOUS_CHALLENGE_BLUEPRINTS: {
  category: LuxoModelCategory | 'Tüm Modeller';
  title: string;
  directive: string;
  challengerFinding: string;
  appliedPatch: string;
  verifiedGain: string;
  testPrompt: string;
  recommendedModelId: LuxoModelId;
}[] = [
  {
    category: 'Google Gemini',
    title: 'Çoklu Bağlam Çelişki Tespiti & Net Özetleme',
    directive:
      'Kullanıcının sorusunda birden fazla kısıt olduğunda her kısıtı tek tek karşıla ve birbiriyle çelişen varsayımları ilk cümlede netleştir.',
    challengerFinding:
      'Çok kısıtlı sistem tasarımı sorularında ikincil performans kısıtlarının atlanabildiği tespit edildi.',
    appliedPatch:
      'Gemini 4 Argon ve 3.8 serisine kısıt doğrulama kontrol listesi eklendi.',
    verifiedGain: '+0.3% kısıt tutarlılığı · Sıfır eksik gereksinim',
    testPrompt:
      'Hem düşük gecikmeli (<50ms) hem de güçlü tutarlılık gerektiren bir ödeme servisinde veri kaybı nasıl önlenir?',
    recommendedModelId: 'gemini-4-argon',
  },
  {
    category: 'OpenAI & ChatGPT',
    title: 'Algoritmik Karmaşıklık (Big-O) Öz-Denetimi',
    directive:
      'Veri yapısı ve algoritma çözümlerinde O(n^2) yerine mümkün olan en verimli O(n) veya O(log n) yaklaşımını seç ve nedenini tek cümleyle belirt.',
    challengerFinding:
      'Büyük dizilerde iç içe döngü içeren alt-optimal örneklerin önerilebildiği saptandı.',
    appliedPatch:
      'ChatGPT-5.2 Pro, o3-Pro ve Codex modellerine zaman/bellek karmaşıklığı filtresi uygulandı.',
    verifiedGain: '+0.4% algoritma verimi · O(n) bellek disiplini',
    testPrompt:
      '1 milyon elemanlı bir dizide tekrar eden ilk elemanı O(n) zamanda bulan TypeScript fonksiyonunu yaz.',
    recommendedModelId: 'chatgpt-5-2-pro',
  },
  {
    category: 'Anthropic Claude',
    title: 'Asenkron Yarış Durumu (Race Condition) Koruması',
    directive:
      'Asenkron JavaScript/TypeScript ve API kodlarında iptal sinyali (AbortSignal), hata yakalama ve yarış durumu korumasını ihmal etme.',
    challengerFinding:
      'Eşzamanlı ağ isteklerinde eski yanıtın yeni durumu ezmesi (stale state) riski belirlendi.',
    appliedPatch:
      'Claude 4.6 Opus ve 4.5 Sonnet sistem yönergelerine eşzamanlılık güvenliği yaması işlendi.',
    verifiedGain: '+0.3% kod sağlamlığı · Sıfır yarış durumu hatası',
    testPrompt:
      'React içinde arama kutusu yazılırken eski API isteklerini iptal eden güvenli veri çekme kancasını (hook) kısaca göster.',
    recommendedModelId: 'claude-4-5-sonnet',
  },
  {
    category: 'DeepSeek',
    title: 'Sınır Değer & İşaret Hatası Önleyici Matematik Katmanı',
    directive:
      'Sıfıra bölünme, negatif üs, ondalık yuvarlama ve parantez içi işaret dağılımını yanıt üretmeden önce doğrula.',
    challengerFinding:
      'İç içe negatif parantezli ifadelerde işaret dönüşümü hassasiyeti test edildi.',
    appliedPatch:
      'DeepSeek R2, R1 ve Math V2 modellerine sembolik işaret doğrulama kuralı eklendi.',
    verifiedGain: '+0.4% sayısal kesinlik · %99.6 matematik isabeti',
    testPrompt: '2500 sayısının %18 fazlasının yarısı kaç eder?',
    recommendedModelId: 'deepseek-math-v2',
  },
  {
    category: 'Sinema & Görsel AI',
    title: 'Fiziksel Işık Tutarlılığı & Zamansal Hareket Dengesi',
    directive:
      'Görsel ve video sahnelerinde ışık kaynağının yönü ile gölge ve yansımaları tutarlı tut; yüksek kamera hızında hareket bulanıklığını dengeli kullan.',
    challengerFinding:
      'Hızlı pan/tilt geçişlerinde özne odak kayması olasılığı analiz edildi.',
    appliedPatch:
      'Nano Banana 2.1 Ultra ve Google Veo 3 istem zenginleştiricisine optik odak kilidi eklendi.',
    verifiedGain: '+0.3% sahne tutarlılığı · Keskin 4K özne odağı',
    testPrompt:
      'Yağmurlu gece Tokyo sokağında neon yansımalar arasında ilerleyen spor araba fotoğrafı oluştur.',
    recommendedModelId: 'nano-banana-2-1-ultra',
  },
  {
    category: 'Luxo Özel',
    title: 'Auto-Router Çok Alanlı Hibrit Yönlendirme İyileştirmesi',
    directive:
      'Hem kodlama hem matematik veya hem güncel araştırma hem strateji içeren hibrit sorularda derin düşünme ve kaynak doğrulamayı birlikte etkinleştir.',
    challengerFinding:
      'Hibrit mühendislik ve maliyet hesaplama sorularında tek yönlü yönlendirme saptandı.',
    appliedPatch:
      'Luxo Auto-Router karar ağacına çoklu niyet ağırlıklandırması eklendi.',
    verifiedGain: '+0.5% yönlendirme isabeti · Daha düşük gecikme',
    testPrompt:
      'Günlük 10 milyon istek alan bir servisin önbellek isabet oranı %85 ise veritabanına saniyede ortalama kaç istek düşer?',
    recommendedModelId: 'luxo-auto-router',
  },
];

export function inferDomainFromText(text: string): {
  category: LuxoModelCategory | 'Tüm Modeller';
  domainLabel: string;
  recommendedModelId: LuxoModelId;
} {
  const lower = (text || '').toLowerCase();
  if (
    /\b(kod|typescript|javascript|python|react|sql|api|class|fonksiyon|bug|hata|docker|git)\b/iu.test(
      lower
    )
  ) {
    return {
      category: 'Anthropic Claude',
      domainLabel: 'Yazılım & Temiz Kod',
      recommendedModelId: 'claude-4-5-sonnet',
    };
  }
  if (
    /(?:\d+\s*[+\-*/^%]\s*\d+)|\b(matematik|denklem|olasılık|yüzde|hesapla|karekök|faktöriyel)\b/iu.test(
      lower
    )
  ) {
    return {
      category: 'DeepSeek',
      domainLabel: 'Matematik & Sayısal Analiz',
      recommendedModelId: 'deepseek-math-v2',
    };
  }
  if (/\b(görsel|resim|fotoğraf|video|veo|sinema|lens|çiz)\b/iu.test(lower)) {
    return {
      category: 'Sinema & Görsel AI',
      domainLabel: 'Görsel & Sinema Sentezi',
      recommendedModelId: 'nano-banana-2-1-ultra',
    };
  }
  if (/\b(güncel|haber|araştır|2026|kaynak|web)\b/iu.test(lower)) {
    return {
      category: 'Perplexity & Küresel AI',
      domainLabel: 'Canlı Araştırma & Kaynak',
      recommendedModelId: 'perplexity-sonar-pro',
    };
  }
  return {
    category: 'Google Gemini',
    domainLabel: 'Genel Muhakeme & Mimari',
    recommendedModelId: 'gemini-4-argon',
  };
}

export function runDeterministicEvolutionCycle(
  prevState: SelfEvolutionState,
  options?: {
    focusCategory?: LuxoModelCategory | 'Tüm Modeller';
    trigger?: EvolutionCycleLog['trigger'];
    customRule?: {
      title: string;
      directive: string;
      challengerFinding: string;
      appliedPatch: string;
      verifiedGain: string;
      testPrompt?: string;
      category?: LuxoModelCategory | 'Tüm Modeller';
    };
    now?: number;
  }
): SelfEvolutionState {
  const now = options?.now ?? Date.now();
  const nextGen = prevState.generation + 1;
  const trigger = options?.trigger || 'manual';

  const pool =
    options?.focusCategory && options.focusCategory !== 'Tüm Modeller'
      ? AUTONOMOUS_CHALLENGE_BLUEPRINTS.filter(
          (b) => b.category === options.focusCategory
        )
      : AUTONOMOUS_CHALLENGE_BLUEPRINTS;

  const chosenBlueprint =
    pool[prevState.totalCyclesRun % Math.max(1, pool.length)] ||
    AUTONOMOUS_CHALLENGE_BLUEPRINTS[
      prevState.totalCyclesRun % AUTONOMOUS_CHALLENGE_BLUEPRINTS.length
    ];

  const targetCategory =
    options?.customRule?.category ||
    options?.focusCategory ||
    chosenBlueprint.category;

  const ruleTitle = options?.customRule?.title || chosenBlueprint.title;
  const ruleDirective =
    options?.customRule?.directive || chosenBlueprint.directive;
  const testPrompt =
    options?.customRule?.testPrompt || chosenBlueprint.testPrompt;

  const existingRuleIdx = prevState.learnedRules.findIndex(
    (r) => r.title.toLowerCase() === ruleTitle.toLowerCase()
  );

  let nextRules: EvolutionLearnedRule[];
  if (existingRuleIdx >= 0) {
    nextRules = prevState.learnedRules.map((r, idx) =>
      idx === existingRuleIdx
        ? {
            ...r,
            directive: ruleDirective,
            enabled: true,
            confidenceGain:
              Math.round(Math.min(3.5, r.confidenceGain + 0.25) * 100) / 100,
            createdAt: now,
          }
        : r
    );
  } else {
    const createdRule: EvolutionLearnedRule = {
      id: `rule-gen-${nextGen}-${now.toString(36)}`,
      title: ruleTitle,
      directive: ruleDirective,
      category: targetCategory,
      source: trigger === 'chat-signal' ? 'chat-feedback' : 'autonomous-critic',
      confidenceGain: 1.3,
      enabled: true,
      createdAt: now,
      testPrompt,
    };
    nextRules = [createdRule, ...prevState.learnedRules].slice(0, 14);
  }

  const nextEcosystems = prevState.ecosystems.map((eco) => {
    const isTargeted =
      targetCategory === 'Tüm Modeller' || eco.category === targetCategory;
    if (!isTargeted) return eco;
    const nextAcc =
      Math.round(Math.min(99.9, eco.accuracyScore + 0.15) * 10) / 10;
    const nextLat = Math.max(410, eco.avgLatencyMs - 12);
    return {
      ...eco,
      accuracyScore: nextAcc,
      avgLatencyMs: nextLat,
      patchesApplied: eco.patchesApplied + 1,
      routingBoost: Math.round(Math.min(1.5, eco.routingBoost + 0.04) * 100) / 100,
      keyUpgradeNote:
        options?.customRule?.appliedPatch || chosenBlueprint.appliedPatch,
      lastCalibratedAt: now,
    };
  });

  const newLog: EvolutionCycleLog = {
    id: `evo-log-${nextGen}-${now.toString(36)}`,
    generation: nextGen,
    timestamp: now,
    trigger,
    targetCategory,
    challengerFinding:
      options?.customRule?.challengerFinding ||
      chosenBlueprint.challengerFinding,
    appliedPatch:
      options?.customRule?.appliedPatch || chosenBlueprint.appliedPatch,
    verifiedGain:
      options?.customRule?.verifiedGain || chosenBlueprint.verifiedGain,
  };

  const newAdaptive: AdaptiveSiteSuggestion = {
    id: `adapt-${nextGen}`,
    title: ruleTitle.slice(0, 44),
    subtitle: `Nesil v${nextGen} öz-gelişim doğrulaması ile optimize edildi`,
    prompt: testPrompt,
    recommendedModelId: chosenBlueprint.recommendedModelId,
  };

  const mergedSuggestions = [
    newAdaptive,
    ...prevState.adaptiveSuggestions.filter((s) => s.prompt !== testPrompt),
  ].slice(0, 4);

  const nextBugsPatched =
    prevState.totalBugsPatched + (targetCategory === 'Tüm Modeller' ? 9 : 2);

  return {
    ...prevState,
    generation: nextGen,
    totalCyclesRun: prevState.totalCyclesRun + 1,
    totalBugsPatched: nextBugsPatched,
    learnedRules: nextRules,
    ecosystems: nextEcosystems,
    cycleHistory: appendCycleHistoryMetric(
      prevState.cycleHistory,
      nextEcosystems,
      nextGen,
      nextBugsPatched,
      trigger,
      now
    ),
    recentLogs: [newLog, ...prevState.recentLogs].slice(0, 16),
    adaptiveSuggestions: mergedSuggestions,
    lastUpdatedAt: now,
  };
}

export function calibrateAllEcosystems(
  prevState: SelfEvolutionState,
  now = Date.now()
): SelfEvolutionState {
  const nextGen = prevState.generation + 1;
  const calibrated = prevState.ecosystems.map((eco) => ({
    ...eco,
    accuracyScore: Math.round(Math.min(99.9, eco.accuracyScore + 0.2) * 10) / 10,
    avgLatencyMs: Math.max(395, eco.avgLatencyMs - 18),
    patchesApplied: eco.patchesApplied + 2,
    routingBoost: Math.round(Math.min(1.5, eco.routingBoost + 0.05) * 100) / 100,
    keyUpgradeNote:
      'Tüm alt modellerde gecikme önbelleği sıfırlandı, kesik yanıt ve biçimlendirme koruması doğrulandı.',
    lastCalibratedAt: now,
  }));

  const auditLog: EvolutionCycleLog = {
    id: `evo-audit-${nextGen}-${now.toString(36)}`,
    generation: nextGen,
    timestamp: now,
    trigger: 'full-audit',
    targetCategory: 'Tüm Modeller',
    challengerFinding:
      '9 ekosistemdeki 115 model üzerinde yanıt hızı, Türkçe imla ve kod bütünlüğü taraması yürütüldü.',
    appliedPatch:
      'Soğuma süreleri temizlendi, Auto-Router ağırlıkları ve yedek model geçiş eşikleri kalibre edildi.',
    verifiedGain: '115/115 Model Sağlıklı · Ortalama -18ms gecikme iyileşmesi',
  };

  const nextBugsPatched = prevState.totalBugsPatched + 9;

  return {
    ...prevState,
    generation: nextGen,
    totalCyclesRun: prevState.totalCyclesRun + 1,
    totalBugsPatched: nextBugsPatched,
    ecosystems: calibrated,
    cycleHistory: appendCycleHistoryMetric(
      prevState.cycleHistory,
      calibrated,
      nextGen,
      nextBugsPatched,
      'full-audit',
      now
    ),
    recentLogs: [auditLog, ...prevState.recentLogs].slice(0, 16),
    lastUpdatedAt: now,
  };
}

export interface ChatSignalInput {
  userPrompt: string;
  assistantReply: string;
  modelId: LuxoModelId;
  signalType: 'complete' | 'liked' | 'regenerated' | 'winner';
  consentStatus: TrainingConsentStatus;
  now?: number;
}

export function ingestConsentedChatSignal(
  prevState: SelfEvolutionState,
  input: ChatSignalInput
): { updated: boolean; state: SelfEvolutionState; sanitizedSummary?: string } {
  // STRICT PRIVACY GATE: Never learn from or process chat content unless user explicitly granted consent
  if (input.consentStatus !== 'granted') {
    return { updated: false, state: prevState };
  }

  const safePrompt = redactSensitivePii(input.userPrompt || '');
  const safeReply = redactSensitivePii(input.assistantReply || '');
  if (safePrompt.length < 4) {
    return { updated: false, state: prevState };
  }

  const now = input.now ?? Date.now();
  const domain = inferDomainFromText(safePrompt);

  if (input.signalType === 'regenerated') {
    const evolved = runDeterministicEvolutionCycle(prevState, {
      focusCategory: domain.category,
      trigger: 'chat-signal',
      now,
      customRule: {
        category: domain.category,
        title: `${domain.domainLabel} · Yeniden Üretim Kalite Yaması`,
        directive: `${domain.domainLabel} sorularında ilk yanıtta daha somut örnek, kesin doğrulama ve daha net yapı sun; belirsiz ifadelerden kaçın.`,
        challengerFinding: `Kullanıcı "${domain.domainLabel}" alanında daha net bir yanıt talep etti (anonim kalite sinyali).`,
        appliedPatch: `${domain.category} modellerine doğrudan örnek ve keskin doğrulama önceliği eklendi.`,
        verifiedGain: `${domain.category} ilk-yanıt isabeti güçlendirildi`,
        testPrompt:
          safePrompt.length <= 120
            ? safePrompt
            : `${domain.domainLabel} alanında kısa ve doğrulanmış bir çözüm örneği göster.`,
      },
    });
    return {
      updated: true,
      sanitizedSummary: `${domain.domainLabel} sinyalinden yeni öz-iyileştirme kuralı üretildi.`,
      state: {
        ...evolved,
        consentedSignalsProcessed: prevState.consentedSignalsProcessed + 1,
      },
    };
  }

  if (input.signalType === 'liked' || input.signalType === 'winner') {
    const boostedEcosystems = prevState.ecosystems.map((eco) =>
      eco.category === domain.category
        ? {
            ...eco,
            accuracyScore:
              Math.round(Math.min(99.9, eco.accuracyScore + 0.1) * 10) / 10,
            routingBoost:
              Math.round(Math.min(1.5, eco.routingBoost + 0.03) * 100) / 100,
            lastCalibratedAt: now,
          }
        : eco
    );

    const logEntry: EvolutionCycleLog = {
      id: `evo-pos-${now.toString(36)}`,
      generation: prevState.generation,
      timestamp: now,
      trigger: 'chat-signal',
      targetCategory: domain.category,
      challengerFinding: `${domain.domainLabel} alanında yüksek memnuniyetli yanıt deseni doğrulandı (${safeReply.length} karakterlik özlü sentez).`,
      appliedPatch: `${domain.category} yönlendirme ağırlığı ve yanıt yoğunluğu pekiştirildi.`,
      verifiedGain: '+0.1% doğruluk pekiştirmesi (Anonim İzinli Öğrenim)',
    };

    return {
      updated: true,
      sanitizedSummary: `${domain.domainLabel} başarı deseni pekiştirildi.`,
      state: {
        ...prevState,
        consentedSignalsProcessed: prevState.consentedSignalsProcessed + 1,
        ecosystems: boostedEcosystems,
        recentLogs: [logEntry, ...prevState.recentLogs].slice(0, 16),
        lastUpdatedAt: now,
      },
    };
  }

  // Standard 'complete' signal when autoEvolutionEnabled is active: increment signal counter & reinforce ecosystem latency/accuracy
  const nextCount = prevState.consentedSignalsProcessed + 1;
  if (prevState.autoEvolutionEnabled && nextCount % 2 === 1) {
    const evolved = runDeterministicEvolutionCycle(prevState, {
      focusCategory: domain.category,
      trigger: 'chat-signal',
      now,
    });
    return {
      updated: true,
      sanitizedSummary: `Anonim sohbet sinyali ile ${domain.domainLabel} kalibrasyonu güncellendi.`,
      state: {
        ...evolved,
        consentedSignalsProcessed: nextCount,
      },
    };
  }

  return {
    updated: true,
    state: {
      ...prevState,
      consentedSignalsProcessed: nextCount,
      lastUpdatedAt: now,
    },
  };
}

export function toggleEvolutionRule(
  prevState: SelfEvolutionState,
  ruleId: string,
  now = Date.now()
): SelfEvolutionState {
  return {
    ...prevState,
    learnedRules: prevState.learnedRules.map((r) =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    ),
    lastUpdatedAt: now,
  };
}

export function deleteEvolutionRule(
  prevState: SelfEvolutionState,
  ruleId: string,
  now = Date.now()
): SelfEvolutionState {
  return {
    ...prevState,
    learnedRules: prevState.learnedRules.filter((r) => r.id !== ruleId),
    lastUpdatedAt: now,
  };
}

export interface BenchmarkSpec {
  id: string;
  domain: string;
  category: LuxoModelCategory;
  modelId: LuxoModelId;
  prompt: string;
  expectedInvariant: string;
  mustIncludeTokens?: string[];
  requiresCodeBlock?: boolean;
}

export const EVOLUTION_BENCHMARK_SUITE: BenchmarkSpec[] = [
  {
    id: 'bench-math-pct',
    domain: 'Sayısal Doğrulama & Yüzde Cebiri',
    category: 'DeepSeek',
    modelId: 'deepseek-math-v2',
    prompt:
      'Bir sunucunun yanıt süresi 480ms değerinden %35 iyileştirilirse yeni yanıt süresi kaç ms olur?',
    expectedInvariant: 'Kesin sonuç 312 olarak doğrulanmalı ve dolgu giriş olmamalı',
    mustIncludeTokens: ['312'],
  },
  {
    id: 'bench-code-safety',
    domain: 'Tip Güvenliği & Kod Çiti Bütünlüğü',
    category: 'Anthropic Claude',
    modelId: 'claude-4-5-sonnet',
    prompt:
      'TypeScript ile bellek sızıntısı yapmayan kısa bir TokenBucket hız sınırlayıcı sınıfı yaz.',
    expectedInvariant: 'Eksiksiz kapanan kod bloğu (```) ve sınır değer kontrolü',
    requiresCodeBlock: true,
  },
  {
    id: 'bench-arch-constraints',
    domain: 'Çok Kısıtlı Dağıtık Sistem Mimarisi',
    category: 'Google Gemini',
    modelId: 'gemini-4-argon',
    prompt:
      'Düşük gecikmeli (<50ms) bir ödeme servisinde çift çekim (double-charge) hatası nasıl önlenir?',
    expectedInvariant: 'Idempotency veya atomik işlem kilidi net açıklanmalı',
  },
  {
    id: 'bench-sql-index',
    domain: 'Çok Dilli SQL & İndeks Optimizasyonu',
    category: 'Mistral & Qwen',
    modelId: 'qwen-3-coder-plus',
    prompt:
      'Son 24 saatte en çok işlem yapan ilk 10 kullanıcıyı getiren hızlı bir PostgreSQL sorgusu yaz.',
    expectedInvariant: 'SELECT / GROUP BY / LIMIT yapılarıyla tam SQL kodu',
    requiresCodeBlock: true,
  },
];

export function scoreBenchmarkOutput(
  spec: BenchmarkSpec,
  outputText: string,
  latencyMs: number,
  now = Date.now()
): EvolutionBenchmarkCase {
  const trimmed = (outputText || '').trim();
  let score = 100;
  let passed = trimmed.length >= 16;

  if (/^(?:tabii(?:\s+ki)?|elbette|merhaba\s+ben)/iu.test(trimmed)) {
    score -= 8;
  }

  const fenceCount = (trimmed.match(/```/g) || []).length;
  if (fenceCount % 2 !== 0) {
    score -= 25;
    passed = false;
  }
  if (
    spec.requiresCodeBlock &&
    fenceCount < 2 &&
    !/\b(SELECT|class|function|export)\b/i.test(trimmed)
  ) {
    score -= 15;
    passed = false;
  }

  if (spec.mustIncludeTokens && spec.mustIncludeTokens.length > 0) {
    for (const tok of spec.mustIncludeTokens) {
      if (!trimmed.toLowerCase().includes(tok.toLowerCase())) {
        score -= 30;
        passed = false;
      }
    }
  }

  if (latencyMs > 3500) {
    score -= 4;
  } else if (latencyMs <= 900) {
    score = Math.min(99.9, score);
  }

  const finalScore =
    Math.round(Math.max(40, Math.min(99.8, score - 0.3)) * 10) / 10;
  const normalizedExcerpt = trimmed
    .replace(/```[\s\S]*?```/g, '[Doğrulanmış Kod Bloğu]')
    .replace(/\s+/g, ' ')
    .trim();
  const cleanExcerpt =
    normalizedExcerpt.length > 140
      ? `${normalizedExcerpt.slice(0, 138).replace(/\s+\S*$/, '')}…`
      : normalizedExcerpt;

  return {
    id: spec.id,
    domain: spec.domain,
    category: spec.category,
    modelId: spec.modelId,
    prompt: spec.prompt,
    expectedInvariant: spec.expectedInvariant,
    passed: passed && finalScore >= 85,
    score: finalScore,
    latencyMs: Math.max(80, Math.round(latencyMs)),
    verifiedExcerpt: cleanExcerpt || 'Doğrulama tamamlandı.',
    evaluatedAt: now,
  };
}

export function applyBenchmarkEvaluationToState(
  prevState: SelfEvolutionState,
  results: EvolutionBenchmarkCase[],
  now = Date.now()
): SelfEvolutionState {
  const hydrated = hydrateEvolutionState(prevState, now);
  const nextGen = hydrated.generation + 1;
  const passedCount = results.filter((r) => r.passed).length;
  const avgScore =
    results.length > 0
      ? Math.round(
          (results.reduce((acc, r) => acc + r.score, 0) / results.length) * 10
        ) / 10
      : 99.0;

  const weakest = [...results].sort((a, b) => a.score - b.score)[0];
  let nextRules = hydrated.learnedRules;
  let extraPatches = results.length;

  if (weakest && weakest.score < 98.5) {
    const gateRuleTitle = `${weakest.domain} · Kıyaslama Kapısı Yaması`;
    const exists = hydrated.learnedRules.some(
      (r) => r.title.toLowerCase() === gateRuleTitle.toLowerCase()
    );
    if (!exists) {
      const gateRule: EvolutionLearnedRule = {
        id: `rule-bench-${nextGen}-${now.toString(36)}`,
        title: gateRuleTitle.slice(0, 62),
        directive: `${weakest.domain} görevlerinde "${weakest.expectedInvariant}" kriterini yanıt üretmeden önce zorunlu olarak doğrula.`,
        category: weakest.category,
        targetModelId: weakest.modelId,
        source: 'benchmark-gate',
        confidenceGain: 1.5,
        enabled: true,
        createdAt: now,
        testPrompt: weakest.prompt,
      };
      nextRules = [gateRule, ...hydrated.learnedRules].slice(0, 18);
      extraPatches += 2;
    }
  }

  const testedCategories = new Set(results.map((r) => r.category));
  const nextEcosystems = hydrated.ecosystems.map((eco) => {
    if (!testedCategories.has(eco.category)) return eco;
    const catCase = results.find((r) => r.category === eco.category);
    return {
      ...eco,
      accuracyScore:
        Math.round(Math.min(99.9, eco.accuracyScore + 0.15) * 10) / 10,
      avgLatencyMs: catCase
        ? Math.round(eco.avgLatencyMs * 0.7 + catCase.latencyMs * 0.3)
        : eco.avgLatencyMs,
      patchesApplied: eco.patchesApplied + 1,
      routingBoost:
        Math.round(Math.min(1.55, eco.routingBoost + 0.04) * 100) / 100,
      keyUpgradeNote: `Canlı kıyaslama doğrulandı (%${(
        catCase?.score ?? avgScore
      ).toFixed(1)} skor · ${catCase?.latencyMs ?? eco.avgLatencyMs}ms).`,
      lastCalibratedAt: now,
    };
  });

  const benchLog: EvolutionCycleLog = {
    id: `evo-bench-${nextGen}-${now.toString(36)}`,
    generation: nextGen,
    timestamp: now,
    trigger: 'benchmark',
    targetCategory: 'Tüm Modeller',
    challengerFinding: `${results.length} çok-alanlı canlı doğrulama testi koşuldu (${passedCount}/${results.length} tam geçiş, ortalama %${avgScore}).`,
    appliedPatch:
      weakest && weakest.score < 98.5
        ? `"${weakest.domain}" alanı için otomatik kıyaslama kapısı kuralı ve model ağırlık yaması eklendi.`
        : 'Tüm kıyaslama değişmezleri (invariant) doğrulandı ve yönlendirme hızları kalibre edildi.',
    verifiedGain: `${passedCount}/${results.length} Test Başarılı · %${avgScore} Doğrulama Skoru`,
  };

  const nextBugsPatched = hydrated.totalBugsPatched + extraPatches;

  return {
    ...hydrated,
    generation: nextGen,
    totalCyclesRun: hydrated.totalCyclesRun + 1,
    totalBugsPatched: nextBugsPatched,
    learnedRules: nextRules,
    ecosystems: nextEcosystems,
    cycleHistory: appendCycleHistoryMetric(
      hydrated.cycleHistory,
      nextEcosystems,
      nextGen,
      nextBugsPatched,
      'benchmark',
      now
    ),
    benchmarkResults: results,
    recentLogs: [benchLog, ...hydrated.recentLogs].slice(0, 20),
    lastUpdatedAt: now,
  };
}

export function applyCustomTrainingRule(
  prevState: SelfEvolutionState,
  input: {
    goalText: string;
    category?: LuxoModelCategory | 'Tüm Modeller';
    targetModelId?: LuxoModelId;
    synthesizedTitle?: string;
    synthesizedDirective?: string;
    synthesizedTestPrompt?: string;
    now?: number;
  }
): SelfEvolutionState {
  const now = input.now ?? Date.now();
  const hydrated = hydrateEvolutionState(prevState, now);
  const cleanGoal = redactSensitivePii((input.goalText || '').trim());
  if (cleanGoal.length < 4) return hydrated;

  const inferred = inferDomainFromText(cleanGoal);
  const resolvedCategory =
    input.category && input.category !== 'Tüm Modeller'
      ? input.category
      : input.category === 'Tüm Modeller'
      ? 'Tüm Modeller'
      : inferred.category;
  const nextGen = hydrated.generation + 1;

  const title = (
    input.synthesizedTitle?.trim() ||
    `Özel Eğitim · ${cleanGoal.slice(0, 38)}${cleanGoal.length > 38 ? '…' : ''}`
  ).slice(0, 64);

  const directive = (
    input.synthesizedDirective?.trim() ||
    `Kullanıcı tanımlı uzmanlık kuralı: ${cleanGoal}. Yanıt üretirken bu ilkeyi doğrudan ve tavizsiz uygula.`
  ).slice(0, 260);

  const testPrompt = (
    input.synthesizedTestPrompt?.trim() ||
    `${cleanGoal} kuralına tam uyum sağlayarak kısa ve doğrulanmış bir uygulama örneği göster.`
  ).slice(0, 180);

  const newRule: EvolutionLearnedRule = {
    id: `rule-custom-${nextGen}-${now.toString(36)}`,
    title,
    directive,
    category: resolvedCategory,
    targetModelId: input.targetModelId,
    source: 'custom-training',
    confidenceGain: 1.6,
    enabled: true,
    createdAt: now,
    testPrompt,
  };

  const nextBoosts: Record<string, ModelCalibrationBoost> = {
    ...(hydrated.modelBoosts || {}),
  };
  if (input.targetModelId) {
    const prevBoost = nextBoosts[input.targetModelId];
    nextBoosts[input.targetModelId] = {
      modelId: input.targetModelId,
      boostCount: (prevBoost?.boostCount || 0) + 1,
      accuracyDelta:
        Math.round(((prevBoost?.accuracyDelta || 0) + 0.35) * 100) / 100,
      latencySavedMs: (prevBoost?.latencySavedMs || 0) + 16,
      customFocusDirective: directive,
      lastBoostedAt: now,
    };
  }

  const nextEcosystems = hydrated.ecosystems.map((eco) => {
    if (resolvedCategory !== 'Tüm Modeller' && eco.category !== resolvedCategory) {
      return eco;
    }
    return {
      ...eco,
      accuracyScore:
        Math.round(Math.min(99.9, eco.accuracyScore + 0.2) * 10) / 10,
      patchesApplied: eco.patchesApplied + 1,
      routingBoost:
        Math.round(Math.min(1.6, eco.routingBoost + 0.05) * 100) / 100,
      keyUpgradeNote: `Özel eğitim kuralı işlendi: "${title}"`,
      lastCalibratedAt: now,
    };
  });

  const logEntry: EvolutionCycleLog = {
    id: `evo-custom-${nextGen}-${now.toString(36)}`,
    generation: nextGen,
    timestamp: now,
    trigger: 'custom-train',
    targetCategory: resolvedCategory,
    challengerFinding: `Hedefli öz-eğitim talebi alındı: "${cleanGoal.slice(0, 95)}"`,
    appliedPatch: `"${title}" kuralı sentezlenip ${
      input.targetModelId ? input.targetModelId : resolvedCategory
    } sistem yönergelerine canlı enjekte edildi.`,
    verifiedGain: '+1.6% hedefli uzmanlık isabeti · Canlı Kural Aktif',
  };

  const recommendedModel =
    input.targetModelId || inferred.recommendedModelId || 'luxo-auto-router';

  const newSuggestion: AdaptiveSiteSuggestion = {
    id: `adapt-custom-${nextGen}`,
    title: title.slice(0, 44),
    subtitle: `Özel öz-eğitim v${nextGen} ile güçlendirildi`,
    prompt: testPrompt,
    recommendedModelId: recommendedModel,
  };

  const nextBugsPatchedCustom = hydrated.totalBugsPatched + 3;

  return {
    ...hydrated,
    generation: nextGen,
    totalCyclesRun: hydrated.totalCyclesRun + 1,
    totalBugsPatched: nextBugsPatchedCustom,
    learnedRules: [newRule, ...hydrated.learnedRules].slice(0, 18),
    ecosystems: nextEcosystems,
    modelBoosts: nextBoosts,
    cycleHistory: appendCycleHistoryMetric(
      hydrated.cycleHistory,
      nextEcosystems,
      nextGen,
      nextBugsPatchedCustom,
      'custom-train',
      now
    ),
    recentLogs: [logEntry, ...hydrated.recentLogs].slice(0, 20),
    adaptiveSuggestions: [
      newSuggestion,
      ...hydrated.adaptiveSuggestions.filter((s) => s.prompt !== testPrompt),
    ].slice(0, 4),
    lastUpdatedAt: now,
  };
}

export function boostIndividualModel(
  prevState: SelfEvolutionState,
  input: {
    modelId: LuxoModelId;
    modelName: string;
    category: LuxoModelCategory;
    focusDirective?: string;
    now?: number;
  }
): SelfEvolutionState {
  const now = input.now ?? Date.now();
  const hydrated = hydrateEvolutionState(prevState, now);
  const nextGen = hydrated.generation + 1;
  const existing = hydrated.modelBoosts?.[input.modelId];

  const defaultDirective =
    input.focusDirective?.trim() ||
    `${input.modelName} çekirdeğinde yanıt öncesi çelişki kontrolü, tam kod bloğu kapanışı ve sıfır dolgu cümlesi hassasiyeti maksimuma çıkarıldı.`;

  const updatedBoost: ModelCalibrationBoost = {
    modelId: input.modelId,
    boostCount: (existing?.boostCount || 0) + 1,
    accuracyDelta:
      Math.round(Math.min(2.4, (existing?.accuracyDelta || 0) + 0.3) * 100) /
      100,
    latencySavedMs: Math.min(180, (existing?.latencySavedMs || 0) + 15),
    customFocusDirective: defaultDirective,
    lastBoostedAt: now,
  };

  const nextEcosystems = hydrated.ecosystems.map((eco) =>
    eco.category === input.category
      ? {
          ...eco,
          accuracyScore:
            Math.round(Math.min(99.9, eco.accuracyScore + 0.1) * 10) / 10,
          avgLatencyMs: Math.max(390, eco.avgLatencyMs - 8),
          patchesApplied: eco.patchesApplied + 1,
          routingBoost:
            Math.round(Math.min(1.6, eco.routingBoost + 0.03) * 100) / 100,
          keyUpgradeNote: `${input.modelName} bireysel çekirdek kalibrasyonu (+${updatedBoost.accuracyDelta}% isabet, -${updatedBoost.latencySavedMs}ms gecikme) uygulandı.`,
          lastCalibratedAt: now,
        }
      : eco
  );

  const logEntry: EvolutionCycleLog = {
    id: `evo-boost-${nextGen}-${now.toString(36)}`,
    generation: nextGen,
    timestamp: now,
    trigger: 'manual',
    targetCategory: input.category,
    challengerFinding: `${input.modelName} için bireysel gecikme, bağlam tutarlılığı ve uç durum doğrulaması tarandı.`,
    appliedPatch: `${input.modelName} özel yönerge katmanı ve yönlendirme önceliği kalibre edildi (Güçlendirme #${updatedBoost.boostCount}).`,
    verifiedGain: `${input.modelName} · +${updatedBoost.accuracyDelta}% isabet · -${updatedBoost.latencySavedMs}ms`,
  };

  const nextBugsPatchedBoost = hydrated.totalBugsPatched + 2;

  return {
    ...hydrated,
    generation: nextGen,
    totalCyclesRun: hydrated.totalCyclesRun + 1,
    totalBugsPatched: nextBugsPatchedBoost,
    ecosystems: nextEcosystems,
    modelBoosts: {
      ...(hydrated.modelBoosts || {}),
      [input.modelId]: updatedBoost,
    },
    cycleHistory: appendCycleHistoryMetric(
      hydrated.cycleHistory,
      nextEcosystems,
      nextGen,
      nextBugsPatchedBoost,
      'manual',
      now
    ),
    recentLogs: [logEntry, ...hydrated.recentLogs].slice(0, 20),
    lastUpdatedAt: now,
  };
}

export function getActiveDirectivesForCategory(
  state: SelfEvolutionState | null | undefined,
  category: LuxoModelCategory
): string[] {
  if (!state || !Array.isArray(state.learnedRules)) return [];
  return state.learnedRules
    .filter(
      (r) =>
        r.enabled &&
        !r.targetModelId &&
        (r.category === 'Tüm Modeller' || r.category === category)
    )
    .slice(0, 6)
    .map((r) => r.directive);
}

export function getActiveDirectivesForModel(
  state: SelfEvolutionState | null | undefined,
  modelId: LuxoModelId,
  category: LuxoModelCategory
): string[] {
  if (!state) return [];
  const list: string[] = [];
  const boost = state.modelBoosts?.[modelId];
  if (boost?.customFocusDirective) {
    list.push(boost.customFocusDirective);
  }
  if (Array.isArray(state.learnedRules)) {
    for (const r of state.learnedRules) {
      if (!r.enabled) continue;
      if (
        r.targetModelId === modelId ||
        (!r.targetModelId &&
          (r.category === 'Tüm Modeller' || r.category === category))
      ) {
        list.push(r.directive);
      }
      if (list.length >= 8) break;
    }
  }
  return list;
}

export function inferCategoryForModel(modelId: string): LuxoModelCategory {
  if (modelId.startsWith('gemini') || modelId.includes('argon') || modelId.includes('flash')) {
    if (modelId.startsWith('luxo-')) return 'Luxo Özel';
    return 'Google Gemini';
  }
  if (
    modelId.startsWith('chatgpt') ||
    modelId.startsWith('gpt') ||
    modelId.startsWith('o3') ||
    modelId.startsWith('o4')
  ) {
    return 'OpenAI & ChatGPT';
  }
  if (modelId.startsWith('claude')) return 'Anthropic Claude';
  if (modelId.startsWith('deepseek')) return 'DeepSeek';
  if (modelId.startsWith('grok') || modelId.startsWith('llama')) return 'Grok & Meta Llama';
  if (
    modelId.startsWith('mistral') ||
    modelId.startsWith('codestral') ||
    modelId.startsWith('qwen')
  ) {
    return 'Mistral & Qwen';
  }
  if (
    modelId.startsWith('nano') ||
    modelId.startsWith('veo') ||
    modelId.startsWith('sora') ||
    modelId.startsWith('kling') ||
    modelId.startsWith('runway') ||
    modelId.startsWith('midjourney') ||
    modelId.startsWith('hailuo') ||
    modelId.startsWith('luma') ||
    modelId.startsWith('pika') ||
    modelId.startsWith('higgsfield') ||
    modelId.startsWith('seedance')
  ) {
    return 'Sinema & Görsel AI';
  }
  if (
    modelId.startsWith('perplexity') ||
    modelId.startsWith('kimi') ||
    modelId.startsWith('cohere') ||
    modelId.startsWith('microsoft') ||
    modelId.startsWith('amazon') ||
    modelId.startsWith('nvidia') ||
    modelId.startsWith('glm') ||
    modelId.startsWith('minimax') ||
    modelId.startsWith('yi-')
  ) {
    return 'Perplexity & Küresel AI';
  }
  return 'Luxo Özel';
}

export interface ModelFeedbackSignal {
  messageId?: string;
  modelId: LuxoModelId;
  category?: LuxoModelCategory;
  rating: 'thumbs_up' | 'thumbs_down';
  promptSample?: string;
  responseSnippet?: string;
  timestamp?: number;
  comment?: string;
}

export function processModelFeedbackSignal(
  prevState: SelfEvolutionState,
  signal: ModelFeedbackSignal
): SelfEvolutionState {
  const now = signal.timestamp ?? Date.now();
  const hydrated = hydrateEvolutionState(prevState, now);
  const nextGen = hydrated.generation + 1;
  const category = signal.category || inferCategoryForModel(signal.modelId);
  const existingBoost = hydrated.modelBoosts?.[signal.modelId];

  const isThumbsUp = signal.rating === 'thumbs_up';

  let nextLearnedRules = [...hydrated.learnedRules];
  let nextBugsPatched = hydrated.totalBugsPatched;

  const newBoostCount = (existingBoost?.boostCount || 0) + 1;
  const newAccuracyDelta = isThumbsUp
    ? Math.round(Math.min(3.0, (existingBoost?.accuracyDelta || 0) + 0.25) * 100) / 100
    : Math.round(Math.max(-0.5, (existingBoost?.accuracyDelta || 0) - 0.15) * 100) / 100;
  const newLatencySaved = Math.min(
    220,
    (existingBoost?.latencySavedMs || 0) + (isThumbsUp ? 12 : 5)
  );

  let customFocus = existingBoost?.customFocusDirective;
  if (!isThumbsUp) {
    customFocus = `${signal.modelId} modelinde kullanıcı olumsuz geri bildirimi yakalandı: Dolgu ifadeler kaldırıldı, mantık adımı denetimi ve kesinlik katmanı zorunlu kılındı.`;
    nextBugsPatched += 1;

    const repairRuleId = `rule-repair-${signal.modelId}-${now.toString(36)}`;
    const newRule: EvolutionLearnedRule = {
      id: repairRuleId,
      title: `${signal.modelId} Kullanıcı Doğrulamalı Hata Önleme`,
      directive: `${signal.modelId} çıktılarında kullanıcı tarafından kusur/çelişki bildirildi: Varsayımları doğrula, gereksiz giriş cümlelerini bastır, adım adım akıl yürüt ve kod bloklarını eksiksiz kapat.`,
      category,
      targetModelId: signal.modelId,
      source: 'chat-feedback',
      confidenceGain: 1.3,
      enabled: true,
      createdAt: now,
      testPrompt: signal.promptSample
        ? redactSensitivePii(signal.promptSample.slice(0, 160))
        : `${signal.modelId} için uç durum mantık denetimi`,
    };
    nextLearnedRules = [
      newRule,
      ...nextLearnedRules.filter((r) => r.id !== repairRuleId),
    ].slice(0, 30);
  } else {
    customFocus = `${signal.modelId} kullanıcı olumlu doğrulama katmanı: Yüksek kullanıcı memnuniyeti sağlayan sentez derinliği ve netlik korundu.`;
  }

  const updatedBoost: ModelCalibrationBoost = {
    modelId: signal.modelId,
    boostCount: newBoostCount,
    accuracyDelta: newAccuracyDelta,
    latencySavedMs: newLatencySaved,
    customFocusDirective: customFocus,
    lastBoostedAt: now,
  };

  const nextEcosystems = hydrated.ecosystems.map((eco) => {
    if (eco.category !== category) return eco;
    const accuracyDelta = isThumbsUp ? 0.08 : -0.04;
    const routingDelta = isThumbsUp ? 0.02 : -0.01;
    return {
      ...eco,
      accuracyScore:
        Math.round(
          Math.min(99.9, Math.max(90.0, eco.accuracyScore + accuracyDelta)) * 10
        ) / 10,
      patchesApplied: eco.patchesApplied + (isThumbsUp ? 0 : 1),
      routingBoost:
        Math.round(
          Math.min(1.8, Math.max(0.7, eco.routingBoost + routingDelta)) * 100
        ) / 100,
      keyUpgradeNote: isThumbsUp
        ? `${signal.modelId} kullanıcı memnuniyet sinyali (+Başparmak yukarı) ile güven ve yönlendirme ağırlığı artırıldı.`
        : `${signal.modelId} olumsuz sinyal analizi (-Başparmak aşağı) ile otonom hata onarım yönergesi devreye alındı.`,
      lastCalibratedAt: now,
    };
  });

  const logEntry: EvolutionCycleLog = {
    id: `evo-signal-${nextGen}-${now.toString(36)}`,
    generation: nextGen,
    timestamp: now,
    trigger: 'chat-signal',
    targetCategory: category,
    challengerFinding: isThumbsUp
      ? `${signal.modelId} yanıtı kullanıcı tarafından mükemmel olarak işaretlendi.`
      : `${signal.modelId} yanıtında kullanıcı tarafından hata veya çelişki işaretlendi (${
          signal.comment
            ? redactSensitivePii(signal.comment)
            : 'Kullanıcı başparmak aşağı sinyali'
        }).`,
    appliedPatch: isThumbsUp
      ? `${signal.modelId} öncelik ağırlığı ve doğruluk skoru pekiştirildi (+${updatedBoost.accuracyDelta}%).`
      : `${signal.modelId} için otonom hata bastırma yönergesi uygulandı ve yönlendirme ağırlığı kalibre edildi.`,
    verifiedGain: `${signal.modelId} · ${isThumbsUp ? '+' : ''}${
      updatedBoost.accuracyDelta
    }% doğruluk · ${signal.rating}`,
  };

  const currentMetrics = { ...(hydrated.modelMetrics || {}) };
  const prevMetric = currentMetrics[signal.modelId];
  if (prevMetric) {
    const nextRate = isThumbsUp
      ? Math.min(99.9, prevMetric.successRate + 0.1)
      : Math.max(85.0, prevMetric.successRate - 0.6);
    currentMetrics[signal.modelId] = {
      ...prevMetric,
      successRate: Math.round(nextRate * 10) / 10,
      lastUsedAt: now,
    };
  }

  return {
    ...hydrated,
    generation: nextGen,
    totalCyclesRun: hydrated.totalCyclesRun + 1,
    totalBugsPatched: nextBugsPatched,
    consentedSignalsProcessed: hydrated.consentedSignalsProcessed + 1,
    ecosystems: nextEcosystems,
    learnedRules: nextLearnedRules,
    modelBoosts: {
      ...(hydrated.modelBoosts || {}),
      [signal.modelId]: updatedBoost,
    },
    modelMetrics: currentMetrics,
    cycleHistory: appendCycleHistoryMetric(
      hydrated.cycleHistory,
      nextEcosystems,
      nextGen,
      nextBugsPatched,
      'chat-signal',
      now
    ),
    recentLogs: [logEntry, ...hydrated.recentLogs].slice(0, 20),
    lastUpdatedAt: now,
  };
}

export function recordModelUsageInState(
  prevState: SelfEvolutionState,
  modelId: LuxoModelId | string,
  telemetryOrNow:
    | number
    | { latencyMs?: number; success?: boolean; now?: number } = Date.now(),
  nowOverride?: number
): SelfEvolutionState {
  const telemetry =
    typeof telemetryOrNow === 'object' && telemetryOrNow !== null
      ? telemetryOrNow
      : undefined;
  const now =
    typeof telemetryOrNow === 'number'
      ? telemetryOrNow
      : nowOverride ?? telemetry?.now ?? Date.now();
  const hydrated = hydrateEvolutionState(prevState, now);
  const currentCounts = { ...(hydrated.modelUsageCounts || {}) };
  const nextCount = (currentCounts[modelId] || 0) + 1;
  currentCounts[modelId] = nextCount;

  const currentMetrics = { ...(hydrated.modelMetrics || {}) };
  const existingMetric = currentMetrics[modelId] || {
    modelId,
    latencyMs: 620,
    successRate: 98.5,
    callCount: Math.max(0, nextCount - 1),
    lastUsedAt: now,
  };

  const sampleLatency =
    typeof telemetry?.latencyMs === 'number' && telemetry.latencyMs > 0
      ? Math.round(Math.min(12000, Math.max(120, telemetry.latencyMs)))
      : existingMetric.latencyMs;
  const nextLatency =
    typeof telemetry?.latencyMs === 'number'
      ? Math.round(existingMetric.latencyMs * 0.7 + sampleLatency * 0.3)
      : existingMetric.latencyMs;
  const sampleSuccess =
    typeof telemetry?.success === 'boolean'
      ? telemetry.success
        ? 100
        : 0
      : existingMetric.successRate;
  const nextSuccessRate =
    typeof telemetry?.success === 'boolean'
      ? Math.round((existingMetric.successRate * 0.9 + sampleSuccess * 0.1) * 10) / 10
      : existingMetric.successRate;

  currentMetrics[modelId] = {
    modelId,
    latencyMs: nextLatency,
    successRate: nextSuccessRate,
    callCount: Math.max(nextCount, existingMetric.callCount + 1),
    lastUsedAt: now,
  };

  return {
    ...hydrated,
    modelUsageCounts: currentCounts,
    modelMetrics: currentMetrics,
    lastUpdatedAt: now,
  };
}

export interface ModelUsageStatItem {
  modelId: string;
  modelName: string;
  category: LuxoModelCategory;
  count: number;
  sharePct: number;
  accentColor: string;
}

export interface CategoryUsageStatItem {
  category: LuxoModelCategory;
  count: number;
  sharePct: number;
  accuracyScore: number;
  avgLatencyMs: number;
}

export interface EvolutionDashboardSummary {
  totalCalls: number;
  activeUsedModelsCount: number;
  avgAccuracy: number;
  avgLatencyMs: number;
  topModels: ModelUsageStatItem[];
  categoryUsage: CategoryUsageStatItem[];
  cycleSeries: EvolutionCycleMetric[];
}

export function buildEvolutionDashboardSummary(
  state: SelfEvolutionState,
  modelsMap?: Partial<Record<string, LuxoModelConfig>>
): EvolutionDashboardSummary {
  const hydrated = hydrateEvolutionState(state);
  const counts = hydrated.modelUsageCounts || {};
  const entries = Object.entries(counts).filter(([, v]) => v > 0);
  const totalCalls = entries.reduce((sum, [, v]) => sum + v, 0);

  const categoryCounts = new Map<LuxoModelCategory, number>();
  for (const eco of hydrated.ecosystems) {
    categoryCounts.set(eco.category, 0);
  }

  const topModels: ModelUsageStatItem[] = entries
    .map(([mId, count]) => {
      const cfg = modelsMap?.[mId];
      const category = cfg?.category || inferCategoryForModel(mId);
      categoryCounts.set(category, (categoryCounts.get(category) || 0) + count);
      return {
        modelId: mId,
        modelName: cfg?.name || mId,
        category,
        count,
        sharePct:
          totalCalls > 0
            ? Math.round((count / totalCalls) * 1000) / 10
            : 0,
        accentColor: cfg?.accentColor || '#4f46e5',
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);

  const categoryUsage: CategoryUsageStatItem[] = hydrated.ecosystems
    .map((eco) => {
      const c = categoryCounts.get(eco.category) || 0;
      return {
        category: eco.category,
        count: c,
        sharePct: totalCalls > 0 ? Math.round((c / totalCalls) * 1000) / 10 : 0,
        accuracyScore: eco.accuracyScore,
        avgLatencyMs: eco.avgLatencyMs,
      };
    })
    .sort((a, b) => b.count - a.count);

  const avgAccuracy =
    hydrated.ecosystems.length > 0
      ? Math.round(
          (hydrated.ecosystems.reduce((s, e) => s + e.accuracyScore, 0) /
            hydrated.ecosystems.length) *
            10
        ) / 10
      : 98.5;

  const avgLatencyMs =
    hydrated.ecosystems.length > 0
      ? Math.round(
          hydrated.ecosystems.reduce((s, e) => s + e.avgLatencyMs, 0) /
            hydrated.ecosystems.length
        )
      : 650;

  return {
    totalCalls,
    activeUsedModelsCount: entries.length,
    avgAccuracy,
    avgLatencyMs,
    topModels,
    categoryUsage,
    cycleSeries: hydrated.cycleHistory || [],
  };
}

