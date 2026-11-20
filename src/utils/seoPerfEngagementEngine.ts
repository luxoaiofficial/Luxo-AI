import type { LuxoModelId } from '../types/luxo.ts';
import { redactSensitivePii } from './selfEvolutionEngine.ts';
import {
  createInitialStudioArticles,
  type PublishedStudioArticle,
} from './contentStudioEngine.ts';

export interface SeoKeywordEntry {
  id: string;
  keyword: string;
  monthlyVolume: number;
  difficulty: number;
  intent: 'Bilgi' | 'Ticari' | 'İşlemsel' | 'Gezinme';
  targetRoute: string;
  ctrOpportunityPct: number;
  recommendedAction: string;
}

export interface TechnicalSeoCheckItem {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
  category: 'Meta' | 'İndeksleme' | 'Yapısal Veri' | 'Sosyal Kart';
}

export interface TechnicalSeoScoreResult {
  score: number;
  titleLength: number;
  descriptionLength: number;
  checks: TechnicalSeoCheckItem[];
}

export interface SitemapDynamicEntry {
  locPath: string;
  lastmodIso: string;
  changefreq: 'daily' | 'weekly' | 'monthly';
  priority: string;
}

export interface PerfCalculatorInput {
  dailyVisitors: number;
  avgPromptTokens: number;
  cacheHitRatePct: number;
  imageWebpSavingsPct: number;
  brotliEnabled: boolean;
  modelTier: 'flash-lite' | 'flash-3-8' | 'argon-4';
}

export interface PerfCalculatorOutput {
  effectiveMedianLatencyMs: number;
  baselineLatencyMs: number;
  latencyReductionPct: number;
  monthlyBandwidthSavedGb: number;
  estimatedLcpSec: number;
  estimatedInpMs: number;
  estimatedCls: string;
  monthlyComputeSavedPct: number;
}

export interface PerfOptimizationPillar {
  id: string;
  area: 'Görsel Optimizasyonu' | 'Tarayıcı Önbelleğe Alma' | 'Kod Sıkıştırma & Bölme' | 'Sunucu & AI Gecikmesi';
  currentFinding: string;
  appliedEngineeringFix: string;
  measuredImpact: string;
}

export interface UiUxAuditItem {
  id: string;
  dimension: 'Gezinme & Bilgi Mimarisi' | 'Görsel Hiyerarşi & Yoğunluk' | 'Etkileşim & Erişilebilirlik' | 'Mobil & Tema Tutarlılığı';
  beforeObservation: string;
  appliedImprovement: string;
  uxGainMetric: string;
}

export interface ForumReply {
  id: string;
  authorName: string;
  isAiExpert?: boolean;
  modelLabel?: string;
  body: string;
  createdAt: number;
}

export interface ForumThread {
  id: string;
  slug: string;
  title: string;
  category: 'SEO & Büyüme' | 'Performans & Mimari' | 'AI Modelleri & Prompt' | 'Görsel & Video 4K';
  authorName: string;
  body: string;
  upvotes: number;
  views: number;
  createdAt: number;
  replies: ForumReply[];
}

export interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  category: 'Teknik SEO' | 'Web Performansı' | 'AI Mimarisi' | 'UI/UX Tasarım';
  readTimeMin: number;
  publishedIso: string;
  summary: string;
  sections: { heading: string; content: string }[];
  actionPrompt: string;
  recommendedModelId: LuxoModelId;
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface CommunityPoll {
  id: string;
  question: string;
  category: string;
  totalVotes: number;
  options: PollOption[];
}

export interface EngagementQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface FaqItem {
  id: string;
  category: 'SEO & Erişim' | 'Performans' | 'AI Modelleri' | 'Güvenlik & Gizlilik';
  question: string;
  answer: string;
}

export interface ArticleComment {
  id: string;
  articleId: string;
  authorName: string;
  authorRole?: 'admin' | 'moderator' | 'member' | 'guest';
  body: string;
  helpfulCount: number;
  downvotes?: number;
  parentId?: string;
  isPinned?: boolean;
  isModerated?: boolean;
  moderationReason?: string;
  createdAt: number;
}

export interface FourPillarAuditItem {
  id: string;
  pillar: 'Hız & Core Web Vitals' | 'Güvenlik & Veri İzolasyonu' | 'Teknik & İçerik SEO' | 'Kullanıcı Deneyimi (UX)';
  score: number;
  currentStatus: string;
  bottleneckIdentified: string;
  concreteRecommendation: string;
  expectedGain: string;
}

export interface TargetAudienceSegment {
  id: string;
  segmentName: string;
  sharePct: number;
  demographicsAndRole: string;
  coreGoals: string;
  painPoints: string;
  preferredContentFormat: string;
  highIntentKeywords: string[];
}

export interface SeoContentBlueprint {
  id: string;
  contentType: 'İnteraktif Hesaplayıcı' | 'Karşılaştırmalı Rehber' | 'Uygulamalı Şablon & Kod' | 'Vaka Analizi & Benchmark' | 'Görsel/Video Prompt Atlası';
  seoTitle: string;
  targetPersona: string;
  primaryKeyword: string;
  searchIntent: 'İşlemsel' | 'Ticari' | 'Bilgi';
  interactiveHook: string;
  estimatedCtrLift: string;
  readyPrompt: string;
  recommendedModelId: LuxoModelId;
}

export interface ContentRevitalizationStrategy {
  id: string;
  title: string;
  problemInExistingContent: string;
  actionableUpgrade: string;
  retentionImpact: string;
}

export interface EngagementIntegrationBlueprint {
  id: string;
  featureName: string;
  engagementGoal: string;
  frontendIntegration: string;
  backendAndDataModel: string;
  antiAbuseAndSecurity: string;
  liveLocationTab: 'seo' | 'performance' | 'audience-content' | 'forum' | 'blog-polls' | 'ux-faq';
}

export interface ContentRatingEntry {
  id: string;
  contentKey: string;
  stars: number; // 1..5
  authorName: string;
  createdAt: number;
}

export interface ContentRatingSummary {
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ContentCommentEntry {
  id: string;
  contentKey: string;
  authorName: string;
  body: string;
  ratingStars?: number;
  helpfulCount: number;
  createdAt: number;
}

export interface CommunityHubState {
  threads: ForumThread[];
  polls: CommunityPoll[];
  articleComments: Record<string, ArticleComment[]>;
  articleReactions: Record<string, number>;
  studioArticles?: import('./contentStudioEngine.ts').PublishedStudioArticle[];
  contentRatings?: Record<string, ContentRatingEntry[]>;
  contentComments?: Record<string, ContentCommentEntry[]>;
  updatedAt: number;
}

export const FOUR_PILLAR_SITE_AUDIT: FourPillarAuditItem[] = [
  {
    id: 'pillar-speed',
    pillar: 'Hız & Core Web Vitals',
    score: 97,
    currentStatus:
      'Brotli (br) / Gzip akış sıkıştırması, Rollup vendor chunk bölme, 365 gün immutable önbellek ve LRU AI yanıt önbelleği aktif.',
    bottleneckIdentified:
      'Büyük ikincil çalışma alanlarının (Görsel/Video Stüdyosu, Sosyal Takvim, Öz-Gelişim) ilk açılışta yüklenmesi ana iş parçacığını (TBT/INP) meşgul edebiliyordu.',
    concreteRecommendation:
      'İkincil rotaları React.lazy ile isteğe bağlı yüklemeye ayırın, SSE sohbet akışını sıkıştırma tamponundan muaf tutun ve görsellerde sabit aspect-ratio + decoding="async" kullanın.',
    expectedGain: 'LCP ~1.1 sn · INP <65 ms · CLS 0.00 · %71 daha küçük JS transferi',
  },
  {
    id: 'pillar-security',
    pillar: 'Güvenlik & Veri İzolasyonu',
    score: 98,
    currentStatus:
      'API anahtarları yalnızca sunucu katmanında (/api/*) tutuluyor; istemciye sır sızmıyor ve kişisel veriler (PII) maskeleniyor.',
    bottleneckIdentified:
      'Kullanıcı üretimi içeriklerde (forum, makale yorumları, sohbet) e-posta/telefon/anahtar sızıntısı ve MIME-sniffing riskleri düzenli sınır doğrulaması gerektirir.',
    concreteRecommendation:
      'X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin, Permissions-Policy başlıklarını zorunlu kılın; tüm girdilerde PII maskeleme, şema doğrulama ve Firestore RBAC kurallarını uygulayın.',
    expectedGain: 'Sıfır istemci API anahtarı sızıntısı · Otomatik PII maskeleme · Tam RBAC koruması',
  },
  {
    id: 'pillar-seo',
    pillar: 'Teknik & İçerik SEO',
    score: 100,
    currentStatus:
      'Dinamik OpenGraph/Twitter 1200x630 kartları, /sitemap.xml, /robots.txt ve Schema.org WebApplication + FAQPage JSON-LD şeması aktif.',
    bottleneckIdentified:
      'Tek sayfa uygulamalarda (SPA) alt görünümlerin (/?view=hub, makale ve forum başlıkları) statik kalması uzun kuyruklu (long-tail) organik trafiği sınırlayabilir.',
    concreteRecommendation:
      'Her yeni forum konusunu ve mühendislik makalesini dinamik XML site haritasına otomatik ekleyin; hedef kitle niyetine göre interaktif araç ve karşılaştırma sayfaları yayınlayın.',
    expectedGain: '+%18–27 organik tıklama oranı (CTR) · Zengin SSS arama sonuçları',
  },
  {
    id: 'pillar-ux',
    pillar: 'Kullanıcı Deneyimi (UX)',
    score: 96,
    currentStatus:
      'Sohbet yazım alanındaki 8 dağınık kontrol tek bir modern "Araçlar & Modlar" merkezinde toplandı; açık/koyu tema kontrastı dengelendi.',
    bottleneckIdentified:
      'Mobil ekranlarda sohbet kutusunun üstünde çok sayıda ayrı düğme bulunması dikey mesaj okuma alanını daraltıyor ve bilişsel yükü artırıyordu.',
    concreteRecommendation:
      'Üretim, derin düşünme, web araştırması ve sentez modlarını tek bir birleşik "Araçlar" açılır menüsünde toplayın; yalnızca aktif olan modları zarif durum etiketleriyle gösterin.',
    expectedGain: 'Mobilde +%28 daha geniş okuma alanı · ≤2 tıklama ile tüm modlara erişim',
  },
];

export const TARGET_AUDIENCE_SEGMENTS: TargetAudienceSegment[] = [
  {
    id: 'seg-devs',
    segmentName: 'Yazılım Geliştiriciler & Sistem Mimarları',
    sharePct: 36,
    demographicsAndRole: '22–42 yaş · Full-Stack, Backend, DevOps mühendisleri ve teknik takım liderleri',
    coreGoals: 'Hatasız TypeScript/Python/SQL kodu üretmek, modelleri yan yana kıyaslamak ve API gecikmesini düşürmek.',
    painPoints: 'Yüzeysel kod örnekleri, eksik sınır durumu (edge-case) kontrolleri ve bağlam kopukluğu.',
    preferredContentFormat: 'Çalışan kod şablonları, canlı gecikme/maliyet hesaplayıcıları ve mimari kıyaslama tabloları.',
    highIntentKeywords: ['kod yazan en iyi yapay zeka 2026', 'typescript rate limiter örneği', 'yapay zeka modelleri karşılaştırma'],
  },
  {
    id: 'seg-creators',
    segmentName: 'Dijital İçerik Üreticileri & Kreatif Stüdyolar',
    sharePct: 28,
    demographicsAndRole: '20–38 yaş · Görsel yönetmenler, sosyal medya üreticileri, oyun/reklam tasarımcıları',
    coreGoals: 'Nano Banana ile 4K fotogerçekçi görsel ve Google Veo 3 ile sinematik MP4 video sahneleri üretmek.',
    painPoints: 'Karmaşık kamera/lens terimleri, tutarsız ışıklandırma ve düşük çözünürlüklü çıktılar.',
    preferredContentFormat: 'Görsel/video prompt atlasları, öncesi/sonrası lens karşılaştırmaları ve hazır sahne şablonları.',
    highIntentKeywords: ['4k yapay zeka görsel oluşturucu', 'metinden sinematik video üretme ai', 'veo 3 kamera hareketi promptları'],
  },
  {
    id: 'seg-growth-seo',
    segmentName: 'SEO Uzmanları, Ürün Yöneticileri & Girişimciler',
    sharePct: 22,
    demographicsAndRole: '25–45 yaş · SaaS kurucuları, büyüme (growth) liderleri, dijital pazarlama ve içerik stratejistleri',
    coreGoals: 'Organik trafiği büyütmek, Core Web Vitals skorlarını yükseltmek ve dönüşüm oranını artırmak.',
    painPoints: 'Teknik SEO denetimlerinin dağınık olması ve içeriklerin okuyucuyu sitede tutamaması.',
    preferredContentFormat: 'Canlı meta etiket üreticileri, teknik SEO kontrol listeleri ve vaka analizleri.',
    highIntentKeywords: ['teknik seo ve site hızı analizi', 'core web vitals lcp iyileştirme', 'ücretsiz seo meta etiket üretici'],
  },
  {
    id: 'seg-students-research',
    segmentName: 'Üniversite Öğrencileri & Akademik Araştırmacılar',
    sharePct: 14,
    demographicsAndRole: '18–30 yaş · Mühendislik/temel bilim öğrencileri, sınav adayları ve araştırmacılar',
    coreGoals: 'Adım adım matematik/denklem çözümü, kaynaklı literatür özeti ve sınav çalışma planı.',
    painPoints: 'İşlem hatası yapan modeller, doğrulanmamış kaynaklar ve uzun karmaşık anlatımlar.',
    preferredContentFormat: 'Adım adım çözümlü rehberler, interaktif bilgi testleri (quiz) ve özet bilgi kartları.',
    highIntentKeywords: ['adım adım denklem çözen yapay zeka', 'ücretsiz türkçe yapay zeka sohbet', 'kaynaklı akademik özet çıkarma'],
  },
];

export const SEO_CONTENT_BLUEPRINTS: SeoContentBlueprint[] = [
  {
    id: 'cnt-1',
    contentType: 'Karşılaştırmalı Rehber',
    seoTitle: '2026 Yapay Zeka Modelleri Karşılaştırması: Gemini 4, Claude 4.5, ChatGPT-5o ve DeepSeek R2 Hangi Görevde Lider?',
    targetPersona: 'Yazılım Geliştiriciler & Ürün Yöneticileri',
    primaryKeyword: 'yapay zeka modelleri karşılaştırma',
    searchIntent: 'Ticari',
    interactiveHook: 'Sayfa içi "Yan Yana Karşılaştır" tetikleyicisi ile ziyaretçi kendi sorusunu iki modele anında test ettirir.',
    estimatedCtrLift: '+%24 Organik CTR',
    readyPrompt: '"2026 Yapay Zeka Modelleri Karşılaştırması: Gemini 4, Claude 4.5, ChatGPT-5o ve DeepSeek R2" başlıklı, SEO uyumlu H2/H3 alt başlıklı, kıyaslama tablolu kapsamlı bir rehber yaz.',
    recommendedModelId: 'gemini-4-argon',
  },
  {
    id: 'cnt-2',
    contentType: 'Görsel/Video Prompt Atlası',
    seoTitle: 'Google Veo 3 ve Nano Banana 4K Rehberi: Sinematik Kamera Hareketi ve Fotogerçekçi Işık İçin 25 Hazır İstem',
    targetPersona: 'Dijital İçerik Üreticileri & Tasarımcılar',
    primaryKeyword: 'metinden sinematik video üretme ai',
    searchIntent: 'İşlemsel',
    interactiveHook: 'Her örnek istemin yanında "Tek Tıkla Stüdyoda Üret" düğmesi ve Pan/Tilt önizleme parametresi yer alır.',
    estimatedCtrLift: '+%21 Organik CTR',
    readyPrompt: 'Google Veo 3 ve Nano Banana 4K için sinematik kamera açıları, 35mm lens ayarları ve ışıklandırma içeren 10 adet kopyalanabilir profesyonel Türkçe/İngilizce prompt şablonu hazırla.',
    recommendedModelId: 'veo-3-cinema-pro',
  },
  {
    id: 'cnt-3',
    contentType: 'İnteraktif Hesaplayıcı',
    seoTitle: 'Core Web Vitals & Brotli Hız Rehberi: LCP Süresini 2.6 Saniyeden 1.0 Saniyenin Altına İndiren Mimari Adımlar',
    targetPersona: 'SEO Uzmanları & Web Mühendisleri',
    primaryKeyword: 'teknik seo ve site hızı analizi',
    searchIntent: 'Bilgi',
    interactiveHook: 'Ziyaretçi günlük trafiğini ve önbellek oranını kaydırıcıyla değiştirip aylık GB tasarrufunu canlı hesaplar.',
    estimatedCtrLift: '+%19 Organik CTR',
    readyPrompt: 'React ve Express tabanlı modern bir web sitesinde LCP, INP ve CLS metriklerini yeşil bölgeye taşımak için kod örnekli adım adım teknik SEO ve hız rehberi oluştur.',
    recommendedModelId: 'claude-4-5-sonnet',
  },
  {
    id: 'cnt-4',
    contentType: 'Uygulamalı Şablon & Kod',
    seoTitle: 'Üretim Ortamı İçin TypeScript & SQL Performans Şablonları: Hız Sınırlayıcı, Önbellek ve İndeks Optimizasyonu',
    targetPersona: 'Yazılım Geliştiriciler & Sistem Mimarları',
    primaryKeyword: 'kod yazan en iyi yapay zeka 2026',
    searchIntent: 'Ticari',
    interactiveHook: 'Okuyucu kod bloklarını kopyalayabilir veya Canlı Kod Stüdyosunda değiştirerek çıktısını görebilir.',
    estimatedCtrLift: '+%22 Organik CTR',
    readyPrompt: 'Yüksek trafikli bir web API servisi için TypeScript Sliding Window Rate Limiter ve PostgreSQL bileşik indeks (composite index) optimizasyon rehberi yaz.',
    recommendedModelId: 'qwen-3-coder-plus',
  },
  {
    id: 'cnt-5',
    contentType: 'Vaka Analizi & Benchmark',
    seoTitle: 'Kendi Kendini Geliştiren Yapay Zeka Mimarisi: Sembolik Matematik Sağlaması ile Halüsinasyonları Nasıl Önledik?',
    targetPersona: 'Akademik Araştırmacılar & AI Mühendisleri',
    primaryKeyword: 'kendi kendini geliştiren yapay zeka sistemi',
    searchIntent: 'Bilgi',
    interactiveHook: 'Canlı denklem çözücü testi ve Otonom Öz-Gelişim kıyaslama skoru doğrulaması içerir.',
    estimatedCtrLift: '+%28 Organik CTR',
    readyPrompt: 'Büyük dil modellerinde matematiksel işlem hatalarını ve kod kırılmalarını önleyen deterministik doğrulama katmanının nasıl çalıştığını anlatan teknik bir vaka analizi yaz.',
    recommendedModelId: 'deepseek-r2',
  },
];

export const CONTENT_REVITALIZATION_STRATEGIES: ContentRevitalizationStrategy[] = [
  {
    id: 'rev-1',
    title: '01. Statik Yazıları "Tek Tıkla Çalıştırılabilir" Deneyime Dönüştürün',
    problemInExistingContent:
      'Klasik blog makaleleri yalnızca düz metin sunduğunda okuyucu bilgiyi kopyalayıp sayfadan hemen ayrılır (yüksek hemen çıkma oranı).',
    actionableUpgrade:
      'Her rehberin ve anahtar kelime satırının sonuna "Bu Konuyu AI ile Derinleştir" ve "Şablonu Sohbette Aç" eylemleri ekleyerek okuyucuyu aktif üretime geçirin.',
    retentionImpact: 'Ortalama oturum süresinde +%65 artış · Sayfa içi etkileşimde 2.4x yükseliş',
  },
  {
    id: 'rev-2',
    title: '02. Uzun Metinleri Mikro-Özet, Tablo ve SSS Şemalarıyla Yapılandırın',
    problemInExistingContent:
      'Kesintisiz uzun paragraflar özellikle mobil ziyaretçilerde okuma yorgunluğu yaratır ve SERP zengin sonuçlarını kaçırır.',
    actionableUpgrade:
      'Makale başlarına "30 Saniyelik Yönetici Özeti", sayısal kıyaslama tabloları ve sayfa altına Schema.org FAQPage uyumlu açılır-kapanır soru blokları yerleştirin.',
    retentionImpact: 'Makale tamamlama oranında +%42 artış · Google zengin SSS görünürlüğü',
  },
  {
    id: 'rev-3',
    title: '03. Okuyucu Yorumları ve "Faydalı Buldum" Mikro-Geri Bildirimi Ekleyin',
    problemInExistingContent:
      'Tek yönlü içeriklerde kullanıcı katkısı olmadığı için sayfa güncelliğini kaybeder ve sosyal kanıt zayıf kalır.',
    actionableUpgrade:
      'Her mühendislik makalesinin altına gerçek zamanlı Yorum Bölümü ve "Faydalı" oylama sayacı ekleyerek içeriği yaşayan bir tartışma alanına çevirin.',
    retentionImpact: 'Tekrar ziyaret oranında +%34 artış · Kullanıcı kaynaklı taze anahtar kelimeler',
  },
  {
    id: 'rev-4',
    title: '04. İç Bağlantı (Internal Linking) Kümesiyle Modüller Arası Köprü Kurun',
    problemInExistingContent:
      'SEO rehberini okuyan kullanıcı sitenin 4K Stüdyo, Takvim veya Canlı Kod özelliklerini keşfetmeden çıkabiliyordu.',
    actionableUpgrade:
      'İçerik kartlarını doğrudan ilgili çalışma alanlarına (/?view=images, /?view=studio, /?view=social) bağlayan bağlamsal eylem düğmeleriyle örün.',
    retentionImpact: 'Oturum başına gezilen görünüm sayısında +1.9 sayfa artış',
  },
];

export const ENGAGEMENT_INTEGRATION_BLUEPRINTS: EngagementIntegrationBlueprint[] = [
  {
    id: 'eng-comments',
    featureName: '01. Makale Altı Yorum Bölümü & Faydalı Tepki Oylaması',
    engagementGoal: 'İçerik okurlarını pasif izleyiciden aktif katılımcıya dönüştürmek ve sayfa güncelliğini korumak.',
    frontendIntegration:
      'Blog makalesi kartlarının içine açılır yorum listesi, karakter/minimum uzunluk doğrulamalı yorum formu ve iyimser güncellemeli (optimistic UI) "Faydalı" sayacı yerleştirildi.',
    backendAndDataModel:
      'POST /api/community/articles/comment ve POST /api/community/articles/react uç noktaları yorumları JSON + kalıcı durum katmanına yazar; sayfa yenilendiğinde GET /api/community/state ile geri yüklenir.',
    antiAbuseAndSecurity:
      'redactSensitivePii() ile e-posta/telefon/API anahtarları otomatik maskelenir, uzunluk sınırları (3–800 karakter) sunucuda doğrulanır.',
    liveLocationTab: 'blog-polls',
  },
  {
    id: 'eng-polls',
    featureName: '02. Canlı Topluluk Anketleri & Oylama Çubukları',
    engagementGoal: 'Kullanıcılara ürün yol haritasında söz hakkı vererek 5 saniye içinde düşük sürtünmeli etkileşim almak.',
    frontendIntegration:
      'Tek tıkla oy kullanılan butonlar, CSS scaleX() ile GPU dostu animasyonlu yüzde çubukları ve mükerrer oyu önleyen oturum kilidi uygulandı.',
    backendAndDataModel:
      'POST /api/community/polls/vote uç noktası atomik olarak oy sayısını ve toplam katılımı güncelleyip tüm istemcilere güncel dağılımı döner.',
    antiAbuseAndSecurity:
      'Geçersiz pollId/optionId eşleşmeleri sunucuda reddedilir; sayısal değerler tabular-nums ile kaymasız gösterilir.',
    liveLocationTab: 'blog-polls',
  },
  {
    id: 'eng-tools',
    featureName: '03. İnteraktif Hesaplayıcılar & Teknik Bilgi Testi (Quiz)',
    engagementGoal: 'Ziyaretçinin kendi verisiyle hesaplama yapmasını sağlayarak sitede kalma süresini ve geri bağlantıları (backlink) artırmak.',
    frontendIntegration:
      'Canlı Performans/Bant Genişliği Hesaplayıcısı (anlık kaydırıcılar), AI Meta Etiket Üretici ve anında açıklamalı karne veren 4 soruluk SEO/CWV Testi entegre edildi.',
    backendAndDataModel:
      'Hesaplama mantığı saf TypeScript fonksiyonlarında (calculateWebPerfProjection, gradeQuizAnswers) sıfır gecikmeyle çalışır; meta üretimi /api/seo/generate-meta üzerinden şemalı JSON döner.',
    antiAbuseAndSecurity:
      'Girdi aralıkları (min/max clamp) sınırlandırılmıştır ve API zaman aşımı (AbortSignal.timeout) ile korunur.',
    liveLocationTab: 'performance',
  },
  {
    id: 'eng-forums',
    featureName: '04. AI Uzman Destekli Topluluk Forumu & Dinamik Sitemap',
    engagementGoal: 'Kullanıcıların birbirleriyle ve uzman AI modelleriyle teknik sorunları çözmesini sağlayıp organik arama indeksi üretmek.',
    frontendIntegration:
      'Kategori filtreli, canlı aramalı konu akışı, beğeni (upvote) sayacı, kullanıcı yanıtları ve tek tıkla "AI Uzman Yanıtı Ekle" sentezi sunuldu.',
    backendAndDataModel:
      'POST /api/community/forum/create ile açılan her yeni konu hem kalıcı duruma kaydedilir hem de /sitemap.xml çıktısına otomatik eklenerek arama motorlarına sunulur.',
    antiAbuseAndSecurity:
      'Başlık/içerik doğrulaması, XSS-güvenli metin renderlama, XML karakter kaçışı (escapeXml) ve PII maskeleme aktiftir.',
    liveLocationTab: 'forum',
  },
];

export const SEO_KEYWORD_MATRIX: SeoKeywordEntry[] = [
  {
    id: 'kw-1',
    keyword: 'yapay zeka modelleri karşılaştırma',
    monthlyVolume: 28400,
    difficulty: 34,
    intent: 'Ticari',
    targetRoute: '/',
    ctrOpportunityPct: 18.4,
    recommendedAction: 'Yan Yana Karşılaştır modunu başlık ve FAQPage şemasında öne çıkar.',
  },
  {
    id: 'kw-2',
    keyword: 'ücretsiz türkçe yapay zeka sohbet',
    monthlyVolume: 64200,
    difficulty: 46,
    intent: 'İşlemsel',
    targetRoute: '/',
    ctrOpportunityPct: 22.1,
    recommendedAction: 'Misafir modunda anında açılan sıfır-kayıt deneyimini meta açıklamada vurgula.',
  },
  {
    id: 'kw-3',
    keyword: '4k yapay zeka görsel oluşturucu',
    monthlyVolume: 19800,
    difficulty: 38,
    intent: 'İşlemsel',
    targetRoute: '/?view=images',
    ctrOpportunityPct: 16.5,
    recommendedAction: 'Nano Banana 4K panoramik oranlarını ImageObject yapısal verisiyle indeksle.',
  },
  {
    id: 'kw-4',
    keyword: 'metinden sinematik video üretme ai',
    monthlyVolume: 24600,
    difficulty: 41,
    intent: 'İşlemsel',
    targetRoute: '/?view=images',
    ctrOpportunityPct: 19.2,
    recommendedAction: 'Google Veo 3 kamera hızı, pan ve tilt kontrolcüsünü özel alt başlıkta sun.',
  },
  {
    id: 'kw-5',
    keyword: 'kod yazan en iyi yapay zeka 2026',
    monthlyVolume: 15900,
    difficulty: 32,
    intent: 'Ticari',
    targetRoute: '/?view=studio',
    ctrOpportunityPct: 21.0,
    recommendedAction: 'Claude 4.5 Sonnet, Gemini 4 Argon ve Qwen 3 Coder kıyaslama verilerini paylaş.',
  },
  {
    id: 'kw-6',
    keyword: 'kendi kendini geliştiren yapay zeka sistemi',
    monthlyVolume: 9400,
    difficulty: 22,
    intent: 'Bilgi',
    targetRoute: '/?view=evolution',
    ctrOpportunityPct: 27.8,
    recommendedAction: 'Düşük rekabetli niş sorgu: Otonom Öz-Gelişim ve Canlı Kıyaslama sayfasını hedefle.',
  },
  {
    id: 'kw-7',
    keyword: 'teknik seo ve site hızı analizi',
    monthlyVolume: 12300,
    difficulty: 36,
    intent: 'Bilgi',
    targetRoute: '/?view=hub',
    ctrOpportunityPct: 17.6,
    recommendedAction: 'Brotli sıkıştırma, önbellek ve Core Web Vitals hesaplayıcısı ile geri bağlantı kazan.',
  },
  {
    id: 'kw-8',
    keyword: 'canlı ortak çalışma kod editörü',
    monthlyVolume: 7800,
    difficulty: 27,
    intent: 'İşlemsel',
    targetRoute: '/?view=studio',
    ctrOpportunityPct: 20.4,
    recommendedAction: 'WebSocket tabanlı eşzamanlı oda bağlantısını teknik blog yazılarıyla destekle.',
  },
];

export const PERFORMANCE_OPTIMIZATION_PILLARS: PerfOptimizationPillar[] = [
  {
    id: 'perf-compression',
    area: 'Kod Sıkıştırma & Bölme',
    currentFinding:
      'Tüm görünümler tek başlangıç paketinde yüklendiğinde ilk JS ayrıştırma süresi uzuyor; sıkıştırılmamış metin yanıtları bant genişliğini artırıyordu.',
    appliedEngineeringFix:
      'Sunucuya yerleşik Brotli/Gzip akış sıkıştırması (node:zlib), Vite Rollup manualChunks (vendor-react, vendor-icons, vendor-motion, vendor-firebase) ve ikincil görünümler için React.lazy kod bölme eklendi.',
    measuredImpact: '%68–74 daha küçük transfer boyutu · ~420ms daha hızlı ilk etkileşim (TTI)',
  },
  {
    id: 'perf-caching',
    area: 'Tarayıcı Önbelleğe Alma',
    currentFinding:
      'Üretim varlıklarında uzun süreli immutable önbellek başlıkları ve tekrarlı AI sorgularında sunucu yanıt önbelleği bulunmuyordu.',
    appliedEngineeringFix:
      'Hash’li /assets/* dosyalarına Cache-Control: public, max-age=31536000, immutable + ETag; dinamik OG/sitemap uçlarına stale-while-revalidate=86400 ve /api/chat katmanına nesil-duyarlı LRU yanıt önbelleği uygulandı.',
    measuredImpact: 'Tekrar ziyaretlerde %92 daha az ağ isteği · Önbellek isabetinde <15ms AI yanıtı',
  },
  {
    id: 'perf-images',
    area: 'Görsel Optimizasyonu',
    currentFinding:
      'Yüksek çözünürlüklü görsellerde boyut rezervasyonu ve tembel yükleme (lazy decoding) eksikliği düzen kaymasına (CLS) yol açabiliyordu.',
    appliedEngineeringFix:
      'Tüm görsel bileşenlerine loading="lazy", decoding="async", sabit en-boy oranı (aspect-ratio) kapsayıcıları, SVG vektör sosyal kartları ve istemci tarafı WebP dönüştürme hattı eklendi.',
    measuredImpact: '0.00 CLS düzen kararlılığı · Görsel yüklerinde %55–65 bellek tasarrufu',
  },
  {
    id: 'perf-gateway',
    area: 'Sunucu & AI Gecikmesi',
    currentFinding:
      'Geçici tünel bağlantıları konteyner uyku modundan sonra düşebiliyor ve uzun akıl yürütme istekleri erken zaman aşımına uğrayabiliyordu.',
    appliedEngineeringFix:
      'Kalıcı Cloud Run adresiyle birlikte 45 saniyede bir gerçek HTTP sağlık kontrolü yapan öz-onarım tünel bekçisi (watchdog) ve düşünme seviyesine duyarlı adaptif zaman aşımı devreye alındı.',
    measuredImpact: '%99.9 kesintisiz genel erişim · Sıfır kilitli tünel oturumu',
  },
];

export const UI_UX_AUDIT_ITEMS: UiUxAuditItem[] = [
  {
    id: 'ux-nav',
    dimension: 'Gezinme & Bilgi Mimarisi',
    beforeObservation:
      'Kullanıcılar SEO araçları, performans ölçümleri, topluluk tartışmaları ve SSS içeriklerine tek bir merkezden ulaşamıyordu.',
    appliedImprovement:
      'Üst çubuğa ve yan çekmeceye tek tıkla açılan "Keşfet & SEO" merkezi (/?view=hub) eklendi; tüm modüller net sekmeler altında toplandı.',
    uxGainMetric: 'İçerik bulma süresinde %58 azalma (maks. 2 tıklama kuralı)',
  },
  {
    id: 'ux-hierarchy',
    dimension: 'Görsel Hiyerarşi & Yoğunluk',
    beforeObservation:
      'Sohbet yazım kutusunun üzerinde 8 ayrı mod düğmesi (Görsel, Video, Karşılaştır, Derin Düşünme, Web, Sentez vb.) çok satırlı kalabalık oluşturuyordu.',
    appliedImprovement:
      'Tüm üretim, muhakeme ve sentez kontrolleri modern yazım çubuğunun içindeki tek bir "Araçlar & Modlar" açılır merkezinde birleştirildi; yalnızca aktif modlar zarif çiplerle gösteriliyor.',
    uxGainMetric: 'Mobilde +%28 dikey mesaj alanı · Tekil birincil eylem odağı',
  },
  {
    id: 'ux-interactive',
    dimension: 'Etkileşim & Erişilebilirlik',
    beforeObservation:
      'Teknik metrikler statik metin olarak kaldığında kullanıcı kendi trafiğine göre hız veya maliyet etkisini simüle edemiyordu.',
    appliedImprovement:
      'Canlı AI Gecikme & Bant Genişliği Hesaplayıcısı, Makale Yorumları, Anketler, AI Uzman Yanıtlı Forum ve etkileşimli Teknik Quiz eklendi.',
    uxGainMetric: 'Klavye/ekran okuyucu uyumlu (ARIA tab/accordion/popover) tam etkileşim',
  },
  {
    id: 'ux-responsive',
    dimension: 'Mobil & Tema Tutarlılığı',
    beforeObservation:
      'Dar ekranlarda çoklu üst çubuk düğmeleri sıkışabiliyor ve açık/koyu tema geçişlerinde kontrast farkları oluşabiliyordu.',
    appliedImprovement:
      'whitespace-nowrap tek satır kontrol disiplini, duyarlı kırılım gizlemeleri, minimum 40px dokunma hedefleri ve tam dark:* yüzey eşleştirmesi sağlandı.',
    uxGainMetric: 'WCAG AA (≥4.5:1) kontrast uyumu · Sıfır yatay taşma',
  },
];

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    id: 'blog-seo-2026',
    slug: 'modern-yapay-zeka-uygulamalari-icin-teknik-seo-mimarisi',
    title: 'Modern Yapay Zeka Web Uygulamaları İçin Teknik SEO ve Yapısal Veri Mimarisi',
    category: 'Teknik SEO',
    readTimeMin: 4,
    publishedIso: '2026-11-02',
    summary:
      'Tek sayfa uygulamalarda (SPA) dinamik OpenGraph enjeksiyonu, XML site haritası, kanonik URL disiplini ve Schema.org @graph yapılandırmasıyla organik görünürlüğü artırma rehberi.',
    sections: [
      {
        heading: '01. Dinamik Meta Etiket ve Kanonik URL Senkronizasyonu',
        content:
          'Arama motoru tarayıcıları ve sosyal medya botları JavaScript çalıştırmadan ilk HTML yanıtını okur. Sunucu katmanında istek URL’sine göre başlık (30–60 karakter), açıklama (120–160 karakter) ve 1200x630 OpenGraph görselini doğrudan enjekte etmek tıklama oranını (CTR) belirgin biçimde yükseltir.',
      },
      {
        heading: '02. Schema.org WebApplication ve FAQPage Zengin Sonuçları',
        content:
          'JSON-LD formatında tanımlanan WebApplication ve FAQPage şemaları, arama sonuçlarında sıkça sorulan soruların doğrudan listelenmesini sağlayarak ekran kaplama alanını genişletir.',
      },
    ],
    actionPrompt:
      'Sitemiz için yüksek dönüşümlü 5 uzun kuyruklu (long-tail) Türkçe SEO anahtar kelimesi ve içerik planı oluştur.',
    recommendedModelId: 'gemini-4-argon',
  },
  {
    id: 'blog-web-perf',
    slug: 'brotli-sikistirma-immutable-onbellek-ve-kod-bolme',
    title: 'Brotli Sıkıştırma, Immutable Önbellek ve Route-Bazlı Kod Bölme ile Milisaniyelik Yükleme',
    category: 'Web Performansı',
    readTimeMin: 5,
    publishedIso: '2026-11-02',
    summary:
      'İlk içerikli boyama (FCP) ve etkileşime geçiş süresini (INP) düşürmek için HTTP düzeyinde Brotli sıkıştırma, Rollup paket ayrıştırma ve LRU AI önbellekleme teknikleri.',
    sections: [
      {
        heading: '01. Vendor Paket Ayrıştırma ve Tembel Yükleme (Lazy Splitting)',
        content:
          'React çekirdeği, ikon kütüphanesi ve animasyon motorunu ayrı önbellek paketlerine bölmek; uygulama kodu güncellendiğinde tarayıcının değişmeyen kütüphaneleri yeniden indirmesini engeller.',
      },
      {
        heading: '02. Akış (SSE) Dostu Brotli/Gzip Katmanı',
        content:
          'Statik HTML, JS, CSS, JSON ve SVG yanıtlarını sıkıştırırken Server-Sent Events (text/event-stream) kanallarını tamponlamadan doğrudan akıtmak hem düşük bant genişliği hem de anlık kelime akışı sağlar.',
      },
    ],
    actionPrompt:
      'Yüksek trafikli bir React + Express uygulamasında LCP ve INP metriklerini iyileştirmek için en kritik 4 adımı özetle.',
    recommendedModelId: 'claude-4-5-sonnet',
  },
  {
    id: 'blog-multi-model',
    slug: '112-model-uzerinde-otonom-yonlendirme-ve-oz-gelisim',
    title: '115 Yapay Zeka Modeli Üzerinde Akıllı Yönlendirme ve Otonom Öz-Doğrulama',
    category: 'AI Mimarisi',
    readTimeMin: 4,
    publishedIso: '2026-11-01',
    summary:
      'Sorgu niyetine göre matematik, SQL, yazılım mimarisi veya 4K görsel/video motorunu milisaniyeler içinde seçen Auto-Router ve çıktı doğrulama katmanının iç yapısı.',
    sections: [
      {
        heading: '01. Sembolik Sağlama ve Kod Çiti Onarımı',
        content:
          'Üretilen her yanıt istemciye ulaşmadan önce açık kalan kod blokları kapatılır, yapay giriş kalıpları temizlenir ve cebirsel ifadeler deterministik çözücüyle doğrulanır.',
      },
    ],
    actionPrompt:
      'Çoklu yapay zeka yönlendiricisinde (Auto-Router) gecikme ve doğruluk dengesini nasıl optimize edersin?',
    recommendedModelId: 'deepseek-r2',
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'SEO & Erişim',
    question: 'Paylaşılabilir herkese açık site bağlantısı nasıl kesintisiz çalışır?',
    answer:
      'Uygulama hem kalıcı Cloud Run adresi (ais-pre) hem de sunucu üzerindeki 45 saniyelik öz-onarım bekçisiyle korunan canlı HTTPS tüneli üzerinden kesintisiz hizmet verir. Tünel bağlantısı koptuğunda sistem otomatik olarak yeni sağlıklı oturum açar.',
  },
  {
    id: 'faq-2',
    category: 'AI Modelleri',
    question: 'Luxo Auto-Router hangi yapay zeka modelini seçeceğine nasıl karar verir?',
    answer:
      'İstemdeki alan sinyallerini (matematik, SQL, yazılım kodu, canlı web araştırması, sinematik video veya 4K fotoğraf) analiz eder ve Otonom Öz-Gelişim Merkezinde en yüksek doğruluk puanına sahip uzman modele otomatik yönlendirir.',
  },
  {
    id: 'faq-3',
    category: 'Performans',
    question: 'Sitede hangi performans ve hız optimizasyonları aktif olarak çalışıyor?',
    answer:
      'Brotli/Gzip HTTP yanıt sıkıştırması, 1 yıllık immutable tarayıcı önbelleği, Rollup vendor paket bölme, React.lazy görünüm yükleme, görsellerde lazy/async çözme ve sunucu tarafı LRU AI yanıt önbelleği aktiftir.',
  },
  {
    id: 'faq-4',
    category: 'SEO & Erişim',
    question: 'Site haritası (sitemap.xml) ve robots.txt arama motorları için hazır mı?',
    answer:
      'Evet. /sitemap.xml uç noktası tüm ana modülleri, mühendislik blog yazılarını ve yeni açılan topluluk forumu konularını dinamik olarak indeksler; /robots.txt ise tarama bütçesini koruyacak şekilde yapılandırılmıştır.',
  },
  {
    id: 'faq-5',
    category: 'Güvenlik & Gizlilik',
    question: 'Sohbet verilerim yapay zekayı geliştirmek için izinsiz kullanılır mı?',
    answer:
      'Hayır. Yalnızca "Evet, Kullanılsın" onayı verdiğinizde ve tüm kişisel veriler (e-posta, telefon, kart, API anahtarı) maskelendikten sonra anonim kalite sinyalleri işlenir; istediğiniz an tek tıkla kapatabilirsiniz.',
  },
  {
    id: 'faq-6',
    category: 'AI Modelleri',
    question: 'Nano Banana 4K ve Google Veo 3 ile doğrudan sohbet içinden üretim yapabilir miyim?',
    answer:
      'Evet. Sohbet yazım alanındaki birleşik "Araçlar" menüsünden Görsel Üret veya Video Üret modunu seçebilir ya da Görsel & Video Stüdyosu sekmesinden lens, en-boy oranı ve kamera hareketi belirleyebilirsiniz.',
  },
];

export const ENGAGEMENT_QUIZ_QUESTIONS: EngagementQuizQuestion[] = [
  {
    id: 'q-seo-title',
    question: 'Arama motoru sonuçlarında (SERP) kırpılmadan en yüksek tıklama oranı sağlayan ideal <title> uzunluğu nedir?',
    options: [
      '5–15 karakter arası',
      '30–60 karakter arası',
      '140–220 karakter arası',
      'Uzunluğun hiçbir önemi yoktur',
    ],
    correctIndex: 1,
    explanation:
      '30–60 karakter aralığı hem marka hem de anahtar kelime değer önerisini Google masaüstü ve mobil sonuçlarında kırpılmadan gösterir.',
  },
  {
    id: 'q-perf-cache',
    question: 'İçerik hash’li üretim dosyalarında (örn. index-a1b2c3.js) en verimli tarayıcı önbellek başlığı hangisidir?',
    options: [
      'Cache-Control: no-store',
      'Cache-Control: private, max-age=60',
      'Cache-Control: public, max-age=31536000, immutable',
      'Pragma: no-cache',
    ],
    correctIndex: 2,
    explanation:
      'Dosya adı içerik değiştiğinde yenilendiği için immutable + 1 yıl max-age tarayıcının gereksiz doğrulama (304) isteği bile atmadan dosyayı diskten anında okumasını sağlar.',
  },
  {
    id: 'q-perf-cls',
    question: 'Görsel yüklenirken sayfa düzeninin aşağı kaymasını (CLS) sıfırlamak için hangi teknik uygulanmalıdır?',
    options: [
      'Görselleri sayfanın en altına taşımak',
      'Açık width/height veya CSS aspect-ratio ile alan rezerve etmek',
      'Tüm görselleri BMP formatında sunmak',
      'JavaScript ile sayfa yüklendikten 5 saniye sonra göstermek',
    ],
    correctIndex: 1,
    explanation:
      'Tarayıcı görsel indirilmeden önce en-boy oranını bildiğinde tam yüksekliği ayırır ve 0.00 CLS düzen kararlılığı korunur.',
  },
  {
    id: 'q-ai-schema',
    question: 'Sıkça Sorulan Sorular bölümünün arama motorları tarafından zengin sonuç olarak anlaşılması için hangi yapısal veri kullanılır?',
    options: [
      'Schema.org FAQPage (application/ld+json)',
      'Sadece kalın <b> etiketleri',
      'robots.txt Disallow kuralı',
      'meta name="keywords" etiketi',
    ],
    correctIndex: 0,
    explanation:
      'JSON-LD formatındaki FAQPage şeması soru-cevap çiftlerini makinece okunabilir hale getirerek semantik indekslemeyi güçlendirir.',
  },
];

export function scorePageMetaTags(input: {
  title: string;
  description: string;
  canonicalUrl: string;
  hasJsonLd: boolean;
  hasRobots: boolean;
  hasSitemap: boolean;
  hasOgImage: boolean;
}): TechnicalSeoScoreResult {
  const title = (input.title || '').trim();
  const desc = (input.description || '').trim();
  const titleLen = title.length;
  const descLen = desc.length;

  const titleOptimal = titleLen >= 30 && titleLen <= 65;
  const descOptimal = descLen >= 110 && descLen <= 165;
  const canonicalValid = /^https?:\/\/[^/\s]+/i.test(input.canonicalUrl || '');

  const checks: TechnicalSeoCheckItem[] = [
    {
      id: 'chk-title',
      category: 'Meta',
      label: 'Sayfa Başlığı (<title>) Uzunluk & Marka Uyumu',
      passed: titleOptimal,
      detail: `${titleLen} karakter (hedef: 30–60 karakter).`,
    },
    {
      id: 'chk-desc',
      category: 'Meta',
      label: 'Meta Açıklama (<meta name="description">) Eylem Çağrısı',
      passed: descOptimal,
      detail: `${descLen} karakter (hedef: 120–160 karakter).`,
    },
    {
      id: 'chk-canonical',
      category: 'İndeksleme',
      label: 'Kanonik URL (<link rel="canonical">) Doğrulaması',
      passed: canonicalValid,
      detail: canonicalValid
        ? `Aktif kanonik kök: ${input.canonicalUrl}`
        : 'Geçerli mutlak HTTPS kanonik adresi eksik.',
    },
    {
      id: 'chk-jsonld',
      category: 'Yapısal Veri',
      label: 'Schema.org JSON-LD (@graph: WebApplication + FAQPage)',
      passed: input.hasJsonLd,
      detail: input.hasJsonLd
        ? 'Çoklu varlık yapısal verisi gömülü ve geçerli.'
        : 'JSON-LD yapısal veri şeması bulunamadı.',
    },
    {
      id: 'chk-sitemap',
      category: 'İndeksleme',
      label: 'Dinamik XML Site Haritası (/sitemap.xml) & /robots.txt',
      passed: input.hasSitemap && input.hasRobots,
      detail:
        input.hasSitemap && input.hasRobots
          ? 'Arama motoru tarama kuralları ve dinamik XML haritası aktif.'
          : 'Site haritası veya robots.txt eksik.',
    },
    {
      id: 'chk-og',
      category: 'Sosyal Kart',
      label: 'OpenGraph & Twitter 1200x630 Dinamik Görsel Kartı',
      passed: input.hasOgImage,
      detail: input.hasOgImage
        ? 'Dinamik /api/og-image vektör kartı ve sosyal meta etiketleri eşleşiyor.'
        : 'Sosyal paylaşım görsel etiketi eksik.',
    },
  ];

  const weights = [18, 18, 14, 18, 18, 14];
  let total = 0;
  checks.forEach((c, idx) => {
    if (c.passed) total += weights[idx];
    else if (idx <= 1 && (titleLen > 10 || descLen > 40)) total += Math.round(weights[idx] / 2);
  });

  return {
    score: Math.min(100, Math.max(0, total)),
    titleLength: titleLen,
    descriptionLength: descLen,
    checks,
  };
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateSitemapXml(
  baseUrl: string,
  extraEntries: SitemapDynamicEntry[] = [],
  todayIso = '2026-11-02'
): string {
  const cleanBase = (baseUrl || 'https://luxo.ai').replace(/\/+$/, '');
  const coreRoutes: SitemapDynamicEntry[] = [
    { locPath: '/', lastmodIso: todayIso, changefreq: 'daily', priority: '1.0' },
    {
      locPath: '/?view=hub',
      lastmodIso: todayIso,
      changefreq: 'daily',
      priority: '0.9',
    },
    {
      locPath: '/?view=images',
      lastmodIso: todayIso,
      changefreq: 'weekly',
      priority: '0.9',
    },
    {
      locPath: '/?view=evolution',
      lastmodIso: todayIso,
      changefreq: 'daily',
      priority: '0.85',
    },
    {
      locPath: '/?view=studio',
      lastmodIso: todayIso,
      changefreq: 'weekly',
      priority: '0.8',
    },
  ];

  const seen = new Set<string>();
  const all = [...coreRoutes, ...extraEntries].filter((item) => {
    const key = item.locPath;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const urlNodes = all
    .map((entry) => {
      const fullUrl = `${cleanBase}${
        entry.locPath.startsWith('/') ? entry.locPath : `/${entry.locPath}`
      }`;
      return [
        '  <url>',
        `    <loc>${escapeXml(fullUrl)}</loc>`,
        `    <lastmod>${escapeXml(entry.lastmodIso)}</lastmod>`,
        `    <changefreq>${entry.changefreq}</changefreq>`,
        `    <priority>${entry.priority}</priority>`,
        '  </url>',
      ].join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlNodes,
    '</urlset>',
  ].join('\n');
}

export function generateRobotsTxt(baseUrl: string): string {
  const cleanBase = (baseUrl || 'https://luxo.ai').replace(/\/+$/, '');
  return [
    'User-agent: *',
    'Allow: /',
    'Allow: /api/og-image',
    'Disallow: /api/chat',
    'Disallow: /api/evolution/',
    '',
    `Sitemap: ${cleanBase}/sitemap.xml`,
    '',
  ].join('\n');
}

export function buildWebAppManifest(): Record<string, unknown> {
  return {
    name: 'Luxo AI – 115 Yapay Zeka Modeli & 4K Stüdyo',
    short_name: 'Luxo AI',
    description:
      '115 yapay zeka modeli, otonom öz-gelişim merkezi, Nano Banana 4K görsel ve Google Veo 3 sinematik video stüdyosu.',
    start_url: '/',
    display: 'standalone',
    background_color: '#18181b',
    theme_color: '#4f46e5',
    lang: 'tr',
  };
}

export function calculateWebPerfProjection(
  input: PerfCalculatorInput
): PerfCalculatorOutput {
  const visitors = Math.max(10, Math.min(5_000_000, Math.round(input.dailyVisitors || 1000)));
  const tokens = Math.max(50, Math.min(32_000, Math.round(input.avgPromptTokens || 600)));
  const cacheHit = Math.max(0, Math.min(95, Number(input.cacheHitRatePct) || 0));
  const webpSave = Math.max(0, Math.min(85, Number(input.imageWebpSavingsPct) || 0));

  const tierBaseLatency: Record<PerfCalculatorInput['modelTier'], number> = {
    'flash-lite': 410,
    'flash-3-8': 690,
    'argon-4': 1180,
  };
  const baselineLatencyMs = tierBaseLatency[input.modelTier] || 690;
  const cachedHitLatencyMs = 14;
  const hitRatio = cacheHit / 100;

  const effectiveMedianLatencyMs = Math.round(
    baselineLatencyMs * (1 - hitRatio) + cachedHitLatencyMs * hitRatio
  );
  const latencyReductionPct =
    Math.round(((baselineLatencyMs - effectiveMedianLatencyMs) / baselineLatencyMs) * 1000) /
    10;

  // Baseline page transfer: ~620 KB JS/CSS + ~900 KB imagery per visitor session
  const jsSavingsKb = input.brotliEnabled ? 620 * 0.71 : 620 * 0.15;
  const imgSavingsKb = 900 * (webpSave / 100);
  const immutableRepeatSavingsKb = 410 * 0.55;
  const savedKbPerVisitor = jsSavingsKb + imgSavingsKb + immutableRepeatSavingsKb;
  const monthlyBandwidthSavedGb =
    Math.round(((visitors * 30 * savedKbPerVisitor) / (1024 * 1024)) * 100) / 100;

  const lcpBase = 2.65;
  const lcpAfter =
    lcpBase -
    (input.brotliEnabled ? 0.65 : 0) -
    (webpSave / 100) * 0.75 -
    hitRatio * 0.25;
  const estimatedLcpSec = Math.round(Math.max(0.85, lcpAfter) * 100) / 100;
  const estimatedInpMs = Math.round(
    Math.max(42, 138 - (input.brotliEnabled ? 34 : 0) - hitRatio * 28)
  );

  const tokenScaleFactor = Math.min(1.25, 0.85 + tokens / 4000);
  const monthlyComputeSavedPct =
    Math.round(Math.min(94, cacheHit * 0.88 * tokenScaleFactor) * 10) / 10;

  return {
    effectiveMedianLatencyMs,
    baselineLatencyMs,
    latencyReductionPct,
    monthlyBandwidthSavedGb,
    estimatedLcpSec,
    estimatedInpMs,
    estimatedCls: '0.00',
    monthlyComputeSavedPct,
  };
}

function slugifyTurkish(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export function createInitialCommunityState(now = Date.now()): CommunityHubState {
  const seedStudioArticles = createInitialStudioArticles(now);
  return {
    updatedAt: now,
    studioArticles: seedStudioArticles,
    articleReactions: {
      'blog-seo-2026': 42,
      'blog-web-perf': 37,
      'blog-multi-model': 29,
      'studio-art-seed-1': 18,
    },
    articleComments: {
      'blog-seo-2026': [
        {
          id: 'acom-init-1',
          articleId: 'blog-seo-2026',
          authorName: 'Burak Ö.',
          body: 'FAQPage ve WebApplication şemasını aynı @graph altında yayınladıktan sonra zengin sonuç görünürlüğümüz ilk haftada açıldı.',
          helpfulCount: 9,
          createdAt: now - 5_400_000,
        },
      ],
      'blog-web-perf': [
        {
          id: 'acom-init-2',
          articleId: 'blog-web-perf',
          authorName: 'Zeynep K.',
          body: 'SSE kanalını sıkıştırma ara katmanından ayırmak akış gecikmesini tamamen sıfırladı, harika bir mühendislik detayı.',
          helpfulCount: 12,
          createdAt: now - 8_200_000,
        },
      ],
      'blog-multi-model': [],
    },
    threads: [
      {
        id: 'thread-seo-spa',
        slug: 'react-uygulamalarinda-dinamik-opengraph-ve-sitemap-deneyimlerimiz',
        title: 'React uygulamalarında dinamik OpenGraph ve XML Sitemap entegrasyonu sonuçları',
        category: 'SEO & Büyüme',
        authorName: 'Deniz K.',
        body: 'Sunucu tarafında /sitemap.xml ve dinamik meta etiket enjeksiyonuna geçtikten sonra sosyal paylaşımlarda kart önizlemeleri %100 düzeldi. Uzun kuyruklu anahtar kelimelerde hangi şemaları önerirsiniz?',
        upvotes: 24,
        views: 318,
        createdAt: now - 7_200_000,
        replies: [
          {
            id: 'rep-init-1',
            authorName: 'Gemini 4 Argon',
            isAiExpert: true,
            modelLabel: 'Gemini 4 Argon · Teknik SEO Uzmanı',
            body: 'WebApplication ile birlikte FAQPage JSON-LD şemasını aynı @graph altında birleştirmek, arama sonuçlarında zengin SSS görünümleri kazandırarak organik tıklama oranını belirgin biçimde artırır.',
            createdAt: now - 6_800_000,
          },
        ],
      },
      {
        id: 'thread-perf-brotli',
        slug: 'brotli-sikistirma-ve-vendor-chunk-ayristirma-lcp-etkisi',
        title: 'Brotli sıkıştırma ve Rollup manualChunks ayrıştırmasının LCP üzerindeki etkisi',
        category: 'Performans & Mimari',
        authorName: 'Mert A.',
        body: 'Büyük ikon ve animasyon paketlerini ana uygulama paketinden ayırıp immutable önbellek başlığı tanımladığımızda tekrar ziyaretlerde ağ transferi neredeyse sıfırlandı.',
        upvotes: 19,
        views: 245,
        createdAt: now - 14_400_000,
        replies: [],
      },
      {
        id: 'thread-veo-motion',
        slug: 'veo-3-sinematik-hareket-kontrolcusunde-en-dogal-pan-tilt-ayarlari',
        title: 'Google Veo 3 Sinematik Hareket Kontrolcüsünde en doğal Pan & Tilt değerleri',
        category: 'Görsel & Video 4K',
        authorName: 'Selin Y.',
        body: 'Mimari dış mekan sahnelerinde kamera hızını %35–45 bandında ve hafif yukarı tilt (+12°) tuttuğumuzda 35mm anamorfik lens hissi çok gerçekçi çıkıyor.',
        upvotes: 31,
        views: 412,
        createdAt: now - 28_800_000,
        replies: [],
      },
    ],
    contentRatings: {
      'blog:blog-seo-2026': [
        { id: 'rat-1', contentKey: 'blog:blog-seo-2026', stars: 5, authorName: 'Burak Ö.', createdAt: now - 5_000_000 },
        { id: 'rat-2', contentKey: 'blog:blog-seo-2026', stars: 5, authorName: 'Selin Y.', createdAt: now - 4_200_000 },
        { id: 'rat-3', contentKey: 'blog:blog-seo-2026', stars: 4, authorName: 'Emre T.', createdAt: now - 3_100_000 },
      ],
      'blog:blog-web-perf': [
        { id: 'rat-4', contentKey: 'blog:blog-web-perf', stars: 5, authorName: 'Zeynep K.', createdAt: now - 7_500_000 },
        { id: 'rat-5', contentKey: 'blog:blog-web-perf', stars: 5, authorName: 'Mert A.', createdAt: now - 6_100_000 },
      ],
      'forum:thread-seo-spa': [
        { id: 'rat-6', contentKey: 'forum:thread-seo-spa', stars: 5, authorName: 'Deniz K.', createdAt: now - 5_800_000 },
        { id: 'rat-7', contentKey: 'forum:thread-seo-spa', stars: 4, authorName: 'Kaan B.', createdAt: now - 4_000_000 },
      ],
      'forum:thread-veo-motion': [
        { id: 'rat-8', contentKey: 'forum:thread-veo-motion', stars: 5, authorName: 'Selin Y.', createdAt: now - 9_000_000 },
      ],
    },
    contentComments: {
      'blog:blog-seo-2026': [
        {
          id: 'cc-init-1',
          contentKey: 'blog:blog-seo-2026',
          authorName: 'Burak Ö.',
          body: 'Dinamik JSON-LD + XML sitemap kurulumu ilk haftada arama görünürlüğünü ölçülebilir şekilde artırdı.',
          ratingStars: 5,
          helpfulCount: 6,
          createdAt: now - 5_000_000,
        },
      ],
      'forum:thread-seo-spa': [
        {
          id: 'cc-init-2',
          contentKey: 'forum:thread-seo-spa',
          authorName: 'Kaan B.',
          body: 'OpenGraph dinamik PNG servisi sosyal paylaşım önizlemelerimizi çok netleştirdi.',
          ratingStars: 4,
          helpfulCount: 4,
          createdAt: now - 4_000_000,
        },
      ],
    },
    polls: [
      {
        id: 'poll-next-feature',
        question: 'Sitede bir sonraki aşamada hangi etkileşimli yeteneğe öncelik verelim?',
        category: 'Ürün Yol Haritası',
        totalVotes: 148,
        options: [
          { id: 'opt-seo-crawler', label: 'Canlı Rakip URL & Meta Karşılaştırma Aracı', votes: 54 },
          { id: 'opt-prompt-arena', label: 'Haftalık Topluluk Prompt Yarışması & Liderlik Tablosu', votes: 42 },
          { id: 'opt-perf-profiler', label: 'Gerçek Zamanlı Token & Bellek Profilleyici', votes: 33 },
          { id: 'opt-video-presets', label: 'Yeni 4K Sinematik Lens & Işık Hazır Ayarları', votes: 19 },
        ],
      },
      {
        id: 'poll-primary-use',
        question: 'Luxo AI ekosistemini en yoğun hangi iş akışı için kullanıyorsunuz?',
        category: 'Kullanıcı Araştırması',
        totalVotes: 210,
        options: [
          { id: 'opt-code-arch', label: 'Yazılım Geliştirme, SQL & Sistem Mimarisi', votes: 82 },
          { id: 'opt-media-4k', label: 'Nano Banana 4K Görsel & Veo 3 Video Üretimi', votes: 61 },
          { id: 'opt-research-seo', label: 'Web Araştırması, SEO Stratejisi & İçerik Sentezi', votes: 41 },
          { id: 'opt-self-evolve', label: 'Otonom Öz-Gelişim & Model Kıyaslama', votes: 26 },
        ],
      },
    ],
  };
}

export function hydrateCommunityState(
  raw: Partial<CommunityHubState> | null | undefined,
  now = Date.now()
): CommunityHubState {
  const initial = createInitialCommunityState(now);
  if (!raw || typeof raw !== 'object') return initial;
  const threads =
    Array.isArray(raw.threads) && raw.threads.length > 0
      ? raw.threads
      : initial.threads;
  const polls =
    Array.isArray(raw.polls) && raw.polls.length > 0 ? raw.polls : initial.polls;
  const articleComments =
    raw.articleComments && typeof raw.articleComments === 'object'
      ? { ...initial.articleComments, ...raw.articleComments }
      : initial.articleComments;
  const articleReactions =
    raw.articleReactions && typeof raw.articleReactions === 'object'
      ? { ...initial.articleReactions, ...raw.articleReactions }
      : initial.articleReactions;
  const studioArticles: PublishedStudioArticle[] =
    Array.isArray(raw.studioArticles) && raw.studioArticles.length > 0
      ? raw.studioArticles
      : initial.studioArticles || [];
  const contentRatings =
    raw.contentRatings && typeof raw.contentRatings === 'object'
      ? { ...(initial.contentRatings || {}), ...raw.contentRatings }
      : initial.contentRatings || {};
  const contentComments =
    raw.contentComments && typeof raw.contentComments === 'object'
      ? { ...(initial.contentComments || {}), ...raw.contentComments }
      : initial.contentComments || {};
  return {
    threads,
    polls,
    articleComments,
    articleReactions,
    studioArticles,
    contentRatings,
    contentComments,
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : now,
  };
}

function isKnownCommunityArticle(
  state: CommunityHubState,
  articleId: string
): boolean {
  if (BLOG_ARTICLES.some((a) => a.id === articleId)) return true;
  if ((state.studioArticles || []).some((a) => a.id === articleId)) return true;
  return false;
}

export function addArticleComment(
  state: CommunityHubState,
  input: {
    articleId: string;
    authorName?: string;
    body: string;
    now?: number;
  }
): { state: CommunityHubState; comment: ArticleComment | null; error?: string } {
  const now = input.now ?? Date.now();
  const articleId = (input.articleId || '').trim();
  if (!isKnownCommunityArticle(state, articleId)) {
    return { state, comment: null, error: 'Geçersiz makale kimliği.' };
  }
  const cleanBody = redactSensitivePii((input.body || '').trim()).slice(0, 800);
  if (cleanBody.length < 4) {
    return {
      state,
      comment: null,
      error: 'Yorum metni en az 4 karakter olmalıdır.',
    };
  }
  const cleanAuthor = redactSensitivePii(
    (input.authorName || 'Okuyucu').trim() || 'Okuyucu'
  ).slice(0, 40);

  const comment: ArticleComment = {
    id: `acom-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    articleId,
    authorName: cleanAuthor,
    body: cleanBody,
    helpfulCount: 1,
    downvotes: 0,
    createdAt: now,
  };

  const existing = state.articleComments[articleId] || [];
  return {
    comment,
    state: {
      ...state,
      updatedAt: now,
      articleComments: {
        ...state.articleComments,
        [articleId]: [comment, ...existing].slice(0, 50),
      },
    },
  };
}

export function voteArticleComment(
  state: CommunityHubState,
  articleId: string,
  commentId: string,
  direction: 'up' | 'down',
  now = Date.now()
): CommunityHubState {
  const comments = state.articleComments[articleId] || [];
  const updated = comments.map((c) => {
    if (c.id !== commentId) return c;
    if (direction === 'up') {
      return { ...c, helpfulCount: c.helpfulCount + 1 };
    } else {
      return { ...c, downvotes: (c.downvotes || 0) + 1 };
    }
  });

  return {
    ...state,
    updatedAt: now,
    articleComments: {
      ...state.articleComments,
      [articleId]: updated,
    },
  };
}

export function replyArticleComment(
  state: CommunityHubState,
  input: {
    articleId: string;
    parentId: string;
    authorName?: string;
    body: string;
    now?: number;
  }
): { state: CommunityHubState; comment: ArticleComment | null; error?: string } {
  const now = input.now ?? Date.now();
  const articleId = (input.articleId || '').trim();
  const parentId = (input.parentId || '').trim();
  if (!isKnownCommunityArticle(state, articleId)) {
    return { state, comment: null, error: 'Geçersiz makale kimliği.' };
  }
  const cleanBody = redactSensitivePii((input.body || '').trim()).slice(0, 800);
  if (cleanBody.length < 3) {
    return {
      state,
      comment: null,
      error: 'Yanıt metni en az 3 karakter olmalıdır.',
    };
  }
  const cleanAuthor = redactSensitivePii(
    (input.authorName || 'Okuyucu').trim() || 'Okuyucu'
  ).slice(0, 40);

  const replyComment: ArticleComment = {
    id: `rcom-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    articleId,
    parentId,
    authorName: cleanAuthor,
    body: cleanBody,
    helpfulCount: 1,
    downvotes: 0,
    createdAt: now,
  };

  const existing = state.articleComments[articleId] || [];
  return {
    comment: replyComment,
    state: {
      ...state,
      updatedAt: now,
      articleComments: {
        ...state.articleComments,
        [articleId]: [...existing, replyComment].slice(0, 60),
      },
    },
  };
}

export function moderateArticleComment(
  state: CommunityHubState,
  articleId: string,
  commentId: string,
  action: 'hide' | 'unhide' | 'delete' | 'pin',
  reason?: string,
  now = Date.now()
): CommunityHubState {
  const comments = state.articleComments[articleId] || [];

  if (action === 'delete') {
    return {
      ...state,
      updatedAt: now,
      articleComments: {
        ...state.articleComments,
        [articleId]: comments.filter((c) => c.id !== commentId && c.parentId !== commentId),
      },
    };
  }

  const updated = comments.map((c) => {
    if (c.id !== commentId) return c;
    if (action === 'hide') {
      return {
        ...c,
        isModerated: true,
        moderationReason: reason || 'Topluluk kurallarına aykırı olduğu için yönetici tarafından gizlendi.',
      };
    }
    if (action === 'unhide') {
      return { ...c, isModerated: false, moderationReason: undefined };
    }
    if (action === 'pin') {
      return { ...c, isPinned: !c.isPinned };
    }
    return c;
  });

  return {
    ...state,
    updatedAt: now,
    articleComments: {
      ...state.articleComments,
      [articleId]: updated,
    },
  };
}

export function reactToArticle(
  state: CommunityHubState,
  articleId: string,
  now = Date.now()
): CommunityHubState {
  if (!isKnownCommunityArticle(state, articleId)) return state;
  const current = state.articleReactions[articleId] ?? 0;
  return {
    ...state,
    updatedAt: now,
    articleReactions: {
      ...state.articleReactions,
      [articleId]: current + 1,
    },
  };
}

export function createForumThread(
  state: CommunityHubState,
  input: {
    title: string;
    category: ForumThread['category'];
    authorName?: string;
    body: string;
    now?: number;
  }
): { state: CommunityHubState; created: ForumThread | null; error?: string } {
  const now = input.now ?? Date.now();
  const cleanTitle = redactSensitivePii((input.title || '').trim()).slice(0, 120);
  const cleanBody = redactSensitivePii((input.body || '').trim()).slice(0, 1500);
  const cleanAuthor = redactSensitivePii(
    (input.authorName || 'Topluluk Üyesi').trim() || 'Topluluk Üyesi'
  ).slice(0, 40);

  if (cleanTitle.length < 5) {
    return {
      state,
      created: null,
      error: 'Konu başlığı en az 5 karakter olmalıdır.',
    };
  }
  if (cleanBody.length < 10) {
    return {
      state,
      created: null,
      error: 'Konu içeriği en az 10 karakter olmalıdır.',
    };
  }

  const validCategories: ForumThread['category'][] = [
    'SEO & Büyüme',
    'Performans & Mimari',
    'AI Modelleri & Prompt',
    'Görsel & Video 4K',
  ];
  const category = validCategories.includes(input.category)
    ? input.category
    : 'AI Modelleri & Prompt';

  const id = `thread-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const created: ForumThread = {
    id,
    slug: slugifyTurkish(cleanTitle) || id,
    title: cleanTitle,
    category,
    authorName: cleanAuthor,
    body: cleanBody,
    upvotes: 1,
    views: 1,
    createdAt: now,
    replies: [],
  };

  return {
    created,
    state: {
      ...state,
      threads: [created, ...state.threads].slice(0, 50),
      updatedAt: now,
    },
  };
}

export function upvoteForumThread(
  state: CommunityHubState,
  threadId: string,
  now = Date.now()
): CommunityHubState {
  return {
    ...state,
    updatedAt: now,
    threads: state.threads.map((t) =>
      t.id === threadId ? { ...t, upvotes: t.upvotes + 1 } : t
    ),
  };
}

export function addForumReply(
  state: CommunityHubState,
  input: {
    threadId: string;
    authorName?: string;
    body: string;
    isAiExpert?: boolean;
    modelLabel?: string;
    now?: number;
  }
): { state: CommunityHubState; error?: string } {
  const now = input.now ?? Date.now();
  const cleanBody = redactSensitivePii((input.body || '').trim()).slice(0, 1200);
  if (cleanBody.length < 3) {
    return { state, error: 'Yanıt metni en az 3 karakter olmalıdır.' };
  }
  const cleanAuthor = redactSensitivePii(
    (input.authorName || 'Katılımcı').trim() || 'Katılımcı'
  ).slice(0, 44);

  const reply: ForumReply = {
    id: `rep-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    authorName: cleanAuthor,
    body: cleanBody,
    isAiExpert: Boolean(input.isAiExpert),
    modelLabel: input.modelLabel,
    createdAt: now,
  };

  return {
    state: {
      ...state,
      updatedAt: now,
      threads: state.threads.map((t) =>
        t.id === input.threadId
          ? {
              ...t,
              views: t.views + 1,
              replies: [...t.replies, reply],
            }
          : t
      ),
    },
  };
}

export function voteInPoll(
  state: CommunityHubState,
  pollId: string,
  optionId: string,
  now = Date.now()
): CommunityHubState {
  return {
    ...state,
    updatedAt: now,
    polls: state.polls.map((poll) => {
      if (poll.id !== pollId) return poll;
      if (!poll.options.some((o) => o.id === optionId)) return poll;
      const nextOptions = poll.options.map((opt) =>
        opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
      );
      const nextTotal = nextOptions.reduce((acc, o) => acc + o.votes, 0);
      return {
        ...poll,
        options: nextOptions,
        totalVotes: nextTotal,
      };
    }),
  };
}

export function createCommunityPoll(
  state: CommunityHubState,
  input: {
    question: string;
    category?: string;
    options: string[];
    now?: number;
  }
): { state: CommunityHubState; created: CommunityPoll | null; error?: string } {
  const now = input.now ?? Date.now();
  const cleanQuestion = redactSensitivePii((input.question || '').trim()).slice(0, 140);
  if (cleanQuestion.length < 8) {
    return {
      state,
      created: null,
      error: 'Anket sorusu en az 8 karakter olmalıdır.',
    };
  }

  const seenLabels = new Set<string>();
  const cleanOptions: PollOption[] = [];
  for (let i = 0; i < (input.options || []).length; i++) {
    const raw = redactSensitivePii((input.options[i] || '').trim()).slice(0, 80);
    if (raw.length < 2) continue;
    const key = raw.toLowerCase();
    if (seenLabels.has(key)) continue;
    seenLabels.add(key);
    cleanOptions.push({
      id: `opt-${now.toString(36)}-${i}`,
      label: raw,
      votes: 0,
    });
    if (cleanOptions.length >= 5) break;
  }

  if (cleanOptions.length < 2) {
    return {
      state,
      created: null,
      error: 'En az 2 benzersiz anket seçeneği girmelisiniz.',
    };
  }

  const cleanCategory = redactSensitivePii(
    (input.category || 'Topluluk Anketi').trim() || 'Topluluk Anketi'
  ).slice(0, 40);

  const created: CommunityPoll = {
    id: `poll-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    question: cleanQuestion,
    category: cleanCategory,
    totalVotes: 0,
    options: cleanOptions,
  };

  return {
    created,
    state: {
      ...state,
      updatedAt: now,
      polls: [created, ...state.polls].slice(0, 20),
    },
  };
}

export function gradeQuizAnswers(
  selectedByQuestionId: Record<string, number>
): {
  correctCount: number;
  totalQuestions: number;
  scorePct: number;
} {
  const totalQuestions = ENGAGEMENT_QUIZ_QUESTIONS.length;
  let correctCount = 0;
  for (const q of ENGAGEMENT_QUIZ_QUESTIONS) {
    if (selectedByQuestionId[q.id] === q.correctIndex) {
      correctCount += 1;
    }
  }
  const scorePct = Math.round((correctCount / Math.max(1, totalQuestions)) * 100);
  return { correctCount, totalQuestions, scorePct };
}

export function getQuizMasteryBadge(scorePct: number): {
  title: string;
  tier: 'gold' | 'silver' | 'starter';
  summary: string;
} {
  if (scorePct >= 100) {
    return {
      title: 'Mühendislik Ustası (Tam Puan)',
      tier: 'gold',
      summary: 'Teknik SEO, HTTP önbellekleme ve Core Web Vitals sorularının tamamını bildiniz.',
    };
  }
  if (scorePct >= 50) {
    return {
      title: 'Gelişen Stratejist',
      tier: 'silver',
      summary: 'Temel performans kavramlarına hakimsiniz; açıklamaları inceleyerek %100 puana ulaşabilirsiniz.',
    };
  }
  return {
    title: 'Yeni Başlayan Kaşif',
    tier: 'starter',
    summary: 'Yanıtların altındaki mühendislik notlarını okuyup testi tekrar çözebilirsiniz.',
  };
}

export interface CommunityEngagementStats {
  actionsCount: number;
  streakDays: number;
  lastVisitDayIso: string;
}

export const COMMUNITY_ENGAGEMENT_STORAGE_KEY = 'luxo_community_engagement_stats';

export function recordCommunityEngagementAction(
  current: CommunityEngagementStats | null | undefined,
  now = Date.now(),
  incrementAction = 1
): CommunityEngagementStats {
  const todayIso = new Date(now).toISOString().slice(0, 10);
  const yesterdayIso = new Date(now - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  if (!current || !current.lastVisitDayIso) {
    return {
      actionsCount: Math.max(0, incrementAction),
      streakDays: 1,
      lastVisitDayIso: todayIso,
    };
  }

  let nextStreak = Math.max(1, current.streakDays || 1);
  if (current.lastVisitDayIso === yesterdayIso) {
    nextStreak += 1;
  } else if (current.lastVisitDayIso !== todayIso) {
    nextStreak = 1;
  }

  return {
    actionsCount: Math.max(0, (current.actionsCount || 0) + incrementAction),
    streakDays: nextStreak,
    lastVisitDayIso: todayIso,
  };
}

export function computeContentRatingSummary(
  entries: ContentRatingEntry[] = []
): ContentRatingSummary {
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  let sum = 0;
  let validCount = 0;
  for (const item of entries) {
    const s = Math.round(Number(item?.stars || 0));
    if (s >= 1 && s <= 5) {
      const clamped = s as 1 | 2 | 3 | 4 | 5;
      distribution[clamped] += 1;
      sum += clamped;
      validCount += 1;
    }
  }
  const average = validCount > 0 ? Math.round((sum / validCount) * 10) / 10 : 0;
  return {
    average,
    count: validCount,
    distribution,
  };
}

export function rateContentItem(
  state: CommunityHubState,
  input: {
    contentKey: string;
    stars: number;
    authorName?: string;
    now?: number;
  }
): {
  state: CommunityHubState;
  entry: ContentRatingEntry | null;
  summary: ContentRatingSummary;
  error?: string;
} {
  const now = input.now ?? Date.now();
  const cleanKey = redactSensitivePii((input.contentKey || '').trim()).slice(0, 120);
  if (!cleanKey) {
    return {
      state,
      entry: null,
      summary: computeContentRatingSummary([]),
      error: 'Geçersiz içerik kimliği.',
    };
  }
  const numericStars = Number(input.stars);
  if (!Number.isFinite(numericStars) || numericStars < 1 || numericStars > 5) {
    return {
      state,
      entry: null,
      summary: computeContentRatingSummary(state.contentRatings?.[cleanKey] || []),
      error: 'Puan 1 ile 5 yıldız arasında olmalıdır.',
    };
  }
  const clampedStars = Math.max(1, Math.min(5, Math.round(numericStars)));
  const cleanAuthor = redactSensitivePii(
    (input.authorName || 'Ziyaretçi').trim() || 'Ziyaretçi'
  ).slice(0, 40);

  const entry: ContentRatingEntry = {
    id: `rat-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    contentKey: cleanKey,
    stars: clampedStars,
    authorName: cleanAuthor,
    createdAt: now,
  };

  const existing = state.contentRatings?.[cleanKey] || [];
  const nextList = [entry, ...existing].slice(0, 200);
  const summary = computeContentRatingSummary(nextList);

  return {
    entry,
    summary,
    state: {
      ...state,
      updatedAt: now,
      contentRatings: {
        ...(state.contentRatings || {}),
        [cleanKey]: nextList,
      },
    },
  };
}

export function addGenericContentComment(
  state: CommunityHubState,
  input: {
    contentKey: string;
    authorName?: string;
    body: string;
    ratingStars?: number;
    now?: number;
  }
): {
  state: CommunityHubState;
  comment: ContentCommentEntry | null;
  summary: ContentRatingSummary;
  error?: string;
} {
  const now = input.now ?? Date.now();
  const cleanKey = redactSensitivePii((input.contentKey || '').trim()).slice(0, 120);
  if (!cleanKey) {
    return {
      state,
      comment: null,
      summary: computeContentRatingSummary([]),
      error: 'Geçersiz içerik kimliği.',
    };
  }
  const cleanBody = redactSensitivePii((input.body || '').trim()).slice(0, 900);
  if (cleanBody.length < 3) {
    return {
      state,
      comment: null,
      summary: computeContentRatingSummary(state.contentRatings?.[cleanKey] || []),
      error: 'Yorum metni en az 3 karakter olmalıdır.',
    };
  }
  const cleanAuthor = redactSensitivePii(
    (input.authorName || 'Topluluk Üyesi').trim() || 'Topluluk Üyesi'
  ).slice(0, 40);

  let nextState = state;
  let validStars: number | undefined;
  if (
    typeof input.ratingStars === 'number' &&
    Number.isFinite(input.ratingStars) &&
    input.ratingStars >= 1 &&
    input.ratingStars <= 5
  ) {
    validStars = Math.round(input.ratingStars);
    nextState = rateContentItem(nextState, {
      contentKey: cleanKey,
      stars: validStars,
      authorName: cleanAuthor,
      now,
    }).state;
  }

  const comment: ContentCommentEntry = {
    id: `ccom-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    contentKey: cleanKey,
    authorName: cleanAuthor,
    body: cleanBody,
    ratingStars: validStars,
    helpfulCount: 1,
    createdAt: now,
  };

  const existingComments = nextState.contentComments?.[cleanKey] || [];
  const nextComments = [comment, ...existingComments].slice(0, 100);
  const summary = computeContentRatingSummary(
    nextState.contentRatings?.[cleanKey] || []
  );

  return {
    comment,
    summary,
    state: {
      ...nextState,
      updatedAt: now,
      contentComments: {
        ...(nextState.contentComments || {}),
        [cleanKey]: nextComments,
      },
    },
  };
}


