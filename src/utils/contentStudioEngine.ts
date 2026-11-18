import type { LuxoModelId } from '../types/luxo.ts';
import { redactSensitivePii } from './selfEvolutionEngine.ts';
import type { BlogArticle } from './seoPerfEngagementEngine.ts';

export type ContentStudioTone =
  | 'Profesyonel & Kurumsal'
  | 'Teknik & Mühendislik'
  | 'Dönüşüm & Büyüme Odaklı'
  | 'Eğitici & Adım Adım';

export type ContentStudioIntent = 'Bilgi' | 'Ticari' | 'İşlemsel';

export interface BlogTitleCandidate {
  id: string;
  title: string;
  angle: 'Rehber' | 'Karşılaştırma' | 'Vaka Analizi' | 'Uygulama Şablonu';
  charLength: number;
  estimatedCtrPct: number;
}

export interface MetaDescriptionCandidate {
  id: string;
  description: string;
  ctaFocus: string;
  charLength: number;
  inOptimalRange: boolean;
}

export interface ContentStudioAiPack {
  topic: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  blogTitles: BlogTitleCandidate[];
  metaDescriptions: MetaDescriptionCandidate[];
  suggestedSlug: string;
  suggestedSummary: string;
  suggestedSections: { heading: string; content: string }[];
}

export interface ContentEntrySeoAudit {
  overallScore: number;
  titleLength: number;
  titleOptimal: boolean;
  metaDescriptionLength: number;
  metaDescriptionOptimal: boolean;
  slugValid: boolean;
  wordCount: number;
  readTimeMin: number;
  keywordInTitle: boolean;
  keywordInMeta: boolean;
  keywordDensityPct: number;
  warnings: string[];
}

export interface ContentStudioPublishInput {
  id?: string;
  title: string;
  slug?: string;
  metaTitle?: string;
  metaDescription: string;
  focusKeyword: string;
  category: BlogArticle['category'];
  tone: ContentStudioTone;
  status: 'published' | 'draft';
  authorName?: string;
  summary?: string;
  bodyText: string;
  publishedIso?: string;
  recommendedModelId?: LuxoModelId;
  now?: number;
}

export interface PublishedStudioArticle extends BlogArticle {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  tone: ContentStudioTone;
  status: 'published' | 'draft';
  authorName: string;
  bodyText: string;
  seoScore: number;
  createdAt: number;
  updatedAt: number;
  isStudioEntry: true;
}

export function slugifyStudioText(text: string): string {
  return (text || '')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

const DANGLING_TURKISH_TAIL_RE =
  /\s+(?:ve|ile|için|icin|veya|de|da|bir|bu|en|gibi|olarak|olan|üzere|uzere)$/i;

function truncateWordsCleanly(raw: string, maxLen: number): string {
  const clean = raw.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  const sliced = clean.slice(0, maxLen + 1);
  const lastSpace = sliced.lastIndexOf(' ');
  let cut = (lastSpace > 8 ? sliced.slice(0, lastSpace) : clean.slice(0, maxLen))
    .replace(/[.,;:\-–]+$/, '')
    .trim();
  while (DANGLING_TURKISH_TAIL_RE.test(cut) && cut.length > 14) {
    cut = cut.replace(DANGLING_TURKISH_TAIL_RE, '').replace(/[.,;:\-–]+$/, '').trim();
  }
  return cut;
}

function fitCharRange(
  raw: string,
  minLen: number,
  maxLen: number,
  suffixFallback: string,
  ensurePeriod = false
): string {
  let clean = raw.replace(/\s+/g, ' ').trim();
  if (clean.length < minLen) {
    clean = `${clean} ${suffixFallback}`.replace(/\s+/g, ' ').trim();
  }
  if (clean.length <= maxLen) {
    if (ensurePeriod && !/[.!?]$/.test(clean) && clean.length + 1 <= maxLen) {
      return `${clean}.`;
    }
    return clean;
  }
  const budget = ensurePeriod ? maxLen - 1 : maxLen;
  const truncated = truncateWordsCleanly(clean, budget);
  return ensurePeriod && !/[.!?]$/.test(truncated) ? `${truncated}.` : truncated;
}

export function generateDeterministicContentPack(input: {
  topic: string;
  focusKeyword?: string;
  audience?: string;
  tone?: ContentStudioTone;
  intent?: ContentStudioIntent;
}): ContentStudioAiPack {
  const cleanTopic = redactSensitivePii((input.topic || '').trim()).slice(0, 140) || 'Web Performansı ve Teknik SEO';
  const rawKeyword = redactSensitivePii((input.focusKeyword || '').trim()).slice(0, 80);
  const primaryKeyword = (rawKeyword || cleanTopic).toLowerCase();
  const audienceLabel = redactSensitivePii((input.audience || 'Geliştiriciler & Dijital Ekipler').trim()).slice(0, 80);
  const tone = input.tone || 'Profesyonel & Kurumsal';
  const intent = input.intent || 'Bilgi';

  const capTopic = cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1);
  const shortCore = truncateWordsCleanly(capTopic, 36);

  const rawTitles: { raw: string; angle: BlogTitleCandidate['angle']; ctr: number }[] = [
    {
      raw: `${shortCore} Rehberi: 2026 Uygulama Adımları`,
      angle: 'Rehber',
      ctr: 21.4,
    },
    {
      raw: `${shortCore} Karşılaştırması: Hız ve Maliyet`,
      angle: 'Karşılaştırma',
      ctr: 24.2,
    },
    {
      raw: `Adım Adım ${shortCore}: Doğrulanmış Mimari`,
      angle: 'Uygulama Şablonu',
      ctr: 19.8,
    },
    {
      raw: `${shortCore} Vaka Analizi: Organik Büyüme`,
      angle: 'Vaka Analizi',
      ctr: 22.9,
    },
  ];

  const blogTitles: BlogTitleCandidate[] = rawTitles.map((item, idx) => {
    const fitted = fitCharRange(item.raw, 34, 62, '| Luxo AI', false);
    return {
      id: `bt-${idx + 1}`,
      title: fitted,
      angle: item.angle,
      charLength: fitted.length,
      estimatedCtrPct: item.ctr,
    };
  });

  const actionTail =
    intent === 'İşlemsel'
      ? 'Canlı araçları hemen deneyin ve sitenize uygulayın.'
      : intent === 'Ticari'
      ? 'Kıyaslama metriklerini inceleyin ve doğru çözümü seçin.'
      : 'Teknik kontrol listesini ve uygulama adımlarını hemen inceleyin.';

  const descTopic = truncateWordsCleanly(capTopic, 52);
  const rawDescs: { raw: string; cta: string }[] = [
    {
      raw: `${descTopic} sürecinde arama görünürlüğünü ve sayfa hızını artıran stratejiler. ${actionTail}`,
      cta: 'Strateji & Eylem Çağrısı',
    },
    {
      raw: `${audienceLabel} için ${primaryKeyword} rehberiyle teknik darboğazları çözün ve dönüşümü artırın. ${actionTail}`,
      cta: 'Hedef Kitle & Çözüm Odaklı',
    },
    {
      raw: `Ölçülebilir ${primaryKeyword} metrikleri ve yapısal veri şemaları tek rehberde. ${actionTail}`,
      cta: 'Veri & Kanıt Odaklı',
    },
  ];

  const metaDescriptions: MetaDescriptionCandidate[] = rawDescs.map((d, idx) => {
    const fitted = fitCharRange(
      d.raw,
      122,
      156,
      'Doğrulanmış adımları hemen uygulayın.',
      true
    );
    return {
      id: `md-${idx + 1}`,
      description: fitted,
      ctaFocus: d.cta,
      charLength: fitted.length,
      inOptimalRange: fitted.length >= 120 && fitted.length <= 160,
    };
  });

  const toneLead =
    tone === 'Teknik & Mühendislik'
      ? 'Sistem darboğazlarını somut metriklerle (TTFB, LCP, INP ve indeksleme bütçesi) ölçerek doğrudan uygulanabilir mimari adımlar sunar.'
      : tone === 'Dönüşüm & Büyüme Odaklı'
      ? 'Arama niyetini yüksek tıklama oranı (CTR) ve sayfa içi dönüşüm hunisiyle birleştiren büyüme adımlarını özetler.'
      : tone === 'Eğitici & Adım Adım'
      ? 'Temel kavramlardan başlayarak her adımı kontrol listeleri ve anlaşılır örneklerle sadeleştirir.'
      : 'Kurumsal kalite standartlarına uygun, sürdürülebilir ve ölçülebilir uygulama çerçevesi sağlar.';

  const suggestedSummary = fitCharRange(
    `${capTopic} alanında ${audienceLabel.toLowerCase()} için hazırlanan bu rehber; ${primaryKeyword} odağında arama görünürlüğünü, hız performansını ve kullanıcı etkileşimini güçlendirir.`,
    110,
    240,
    toneLead,
    true
  );

  const suggestedSections: { heading: string; content: string }[] = [
    {
      heading: `01. ${capTopic} Temel Prensipleri ve Arama Niyeti`,
      content: `${capTopic} stratejisinde ilk adım, hedef kitlenin (${audienceLabel}) gerçek arama niyetini doğru karşılamaktır. "${primaryKeyword}" sorgusunda kullanıcılar yüzeysel tanımlar yerine doğrudan uygulanabilir adımlar ve doğrulanmış metrikler bekler. ${toneLead}`,
    },
    {
      heading: '02. Teknik Uygulama, Meta Etiket ve Yapısal Veri Standartları',
      content: `Sayfa başlığının 30–60 karakter, meta açıklamasının ise 120–160 karakter aralığında tutulması Google masaüstü ve mobil sonuçlarında kırpılmayı önler. Kanonik URL, OpenGraph sosyal paylaşım kartı ve Schema.org JSON-LD işaretlemesi birlikte çalıştığında organik tıklama oranı belirgin şekilde yükselir.`,
    },
    {
      heading: '03. Performans Ölçümü ve Sürekli İyileştirme Kontrol Listesi',
      content: `İçerik yayına alındıktan sonra Core Web Vitals (LCP, INP, CLS), hemen çıkma oranı ve makale altı okuyucu etkileşimleri düzenli izlenmelidir. Okuyucu yorumları ve canlı anket geri bildirimleriyle güncellenen sayfalar arama sonuçlarında kalıcı otorite kazanır.`,
    },
  ];

  const secondaryKeywords = [
    primaryKeyword,
    primaryKeyword.includes('rehber') ? `${primaryKeyword} adımları` : `${primaryKeyword} rehberi`,
    primaryKeyword.includes('optimizasyon') ? `${primaryKeyword} kontrol listesi` : `${primaryKeyword} optimizasyonu`,
    primaryKeyword.includes('örnek') ? `${primaryKeyword} şablonları` : `${primaryKeyword} örnekleri`,
    `en iyi ${primaryKeyword} stratejileri`,
  ].slice(0, 5);

  return {
    topic: cleanTopic,
    primaryKeyword,
    secondaryKeywords,
    blogTitles,
    metaDescriptions,
    suggestedSlug: slugifyStudioText(blogTitles[0]?.title || cleanTopic) || 'yeni-icerik',
    suggestedSummary,
    suggestedSections,
  };
}

export function parseBodyTextIntoSections(
  bodyText: string,
  fallbackTitle: string
): { heading: string; content: string }[] {
  const cleaned = redactSensitivePii((bodyText || '').trim());
  if (!cleaned) return [];

  const lines = cleaned.split(/\r?\n/);
  const sections: { heading: string; content: string }[] = [];
  let currentHeading = '';
  let currentBuffer: string[] = [];

  const flush = () => {
    const content = currentBuffer.join('\n').trim();
    if (content) {
      sections.push({
        heading:
          currentHeading ||
          `0${sections.length + 1}. ${sections.length === 0 ? 'Genel Çerçeve & Uygulama' : fallbackTitle}`,
        content,
      });
    }
    currentBuffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const headingMatch = line.match(/^(?:#{1,3}\s+|(\d{1,2}[.)]\s+))(.{4,110})$/);
    if (headingMatch && (!headingMatch[1] || line.length < 95)) {
      flush();
      const prefix = headingMatch[1] ? headingMatch[1] : '';
      currentHeading = `${prefix}${headingMatch[2]}`.trim();
    } else {
      currentBuffer.push(rawLine);
    }
  }
  flush();

  if (sections.length === 0) {
    return [
      {
        heading: `01. ${fallbackTitle}`,
        content: cleaned,
      },
    ];
  }

  return sections.slice(0, 12);
}

export function evaluateContentEntrySeo(input: {
  title: string;
  metaDescription: string;
  slug: string;
  focusKeyword: string;
  bodyText: string;
}): ContentEntrySeoAudit {
  const title = (input.title || '').trim();
  const meta = (input.metaDescription || '').trim();
  const slug = slugifyStudioText(input.slug || title);
  const kw = (input.focusKeyword || '').trim().toLowerCase();
  const body = (input.bodyText || '').trim();

  const words = body ? body.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const readTimeMin = Math.max(1, Math.round(wordCount / 180));

  const titleLen = title.length;
  const metaLen = meta.length;
  const titleOptimal = titleLen >= 30 && titleLen <= 65;
  const metaDescriptionOptimal = metaLen >= 115 && metaLen <= 162;
  const slugValid = slug.length >= 4 && /^[a-z0-9-]+$/.test(slug);

  const keywordInTitle = kw.length >= 2 ? title.toLowerCase().includes(kw) : titleLen >= 10;
  const keywordInMeta = kw.length >= 2 ? meta.toLowerCase().includes(kw) : metaLen >= 50;

  let kwOccurrences = 0;
  if (kw.length >= 2 && body.length > 0) {
    const lowerBody = body.toLowerCase();
    let idx = 0;
    while ((idx = lowerBody.indexOf(kw, idx)) !== -1) {
      kwOccurrences += 1;
      idx += kw.length;
    }
  }
  const kwWordSpan = Math.max(1, kw.split(/\s+/).filter(Boolean).length);
  const keywordDensityPct =
    wordCount > 0
      ? Math.round(((kwOccurrences * kwWordSpan) / wordCount) * 1000) / 10
      : 0;

  let score = 0;
  const warnings: string[] = [];

  if (titleOptimal) {
    score += 24;
  } else {
    if (titleLen >= 15) score += 12;
    warnings.push(`Başlık uzunluğu ${titleLen} karakter (ideal: 30–60 karakter).`);
  }

  if (metaDescriptionOptimal) {
    score += 24;
  } else {
    if (metaLen >= 60) score += 12;
    warnings.push(`Meta açıklama ${metaLen} karakter (ideal: 120–158 karakter).`);
  }

  if (slugValid) {
    score += 12;
  } else {
    warnings.push('Kalıcı bağlantı (slug) en az 4 karakter ve tire ayrılmış olmalıdır.');
  }

  if (keywordInTitle) {
    score += 14;
  } else {
    warnings.push('Odak anahtar kelimeyi sayfa başlığında geçirin.');
  }

  if (keywordInMeta) {
    score += 12;
  } else {
    warnings.push('Odak anahtar kelimeyi meta açıklamada doğal biçimde kullanın.');
  }

  if (wordCount >= 60) {
    score += 14;
  } else if (wordCount >= 25) {
    score += 8;
    warnings.push('Arama derinliği için gövde içeriğini en az 60 kelimeye çıkarmanız önerilir.');
  } else {
    warnings.push('İçerik gövdesi çok kısa (en az 25–60 kelime girin).');
  }

  return {
    overallScore: Math.min(100, Math.max(0, score)),
    titleLength: titleLen,
    titleOptimal,
    metaDescriptionLength: metaLen,
    metaDescriptionOptimal,
    slugValid,
    wordCount,
    readTimeMin,
    keywordInTitle,
    keywordInMeta,
    keywordDensityPct,
    warnings,
  };
}

export function createInitialStudioArticles(now = Date.now()): PublishedStudioArticle[] {
  const sampleBody = [
    '## 01. İçerik Stüdyosu ve Dinamik Site Haritası Entegrasyonu',
    'Modern web platformlarında içerik üretimi ile teknik SEO kuralları aynı anda doğrulanmalıdır. Başlık uzunluğu, meta açıklama tıklama çağrısı ve kanonik URL uyumu yayın öncesi kontrol edildiğinde organik görünürlük ilk günden itibaren güçlenir.',
    '',
    '## 02. Doğrudan Yayınlama ve Okuyucu Etkileşimi',
    'İçerik Stüdyosu üzerinden yayınlanan her yazı anında Mühendislik Blogu akışına, dinamik /sitemap.xml haritasına ve okuyucu yorum sistemine bağlanır.',
  ].join('\n');

  const title = 'SEO Uyumlu İçerik Üretimi ve Anlık Site Haritası İndeksleme Rehberi';
  const metaDescription =
    'SEO uyumlu blog başlığı, meta açıklama ve yapısal içerik girişiyle web sitenizin organik arama trafiğini ve tıklama oranını hemen artırın.';
  const focusKeyword = 'seo uyumlu içerik üretimi';
  const audit = evaluateContentEntrySeo({
    title,
    metaDescription,
    slug: slugifyStudioText(title),
    focusKeyword,
    bodyText: sampleBody,
  });

  return [
    {
      id: 'studio-art-seed-1',
      slug: slugifyStudioText(title),
      title,
      metaTitle: title,
      metaDescription,
      focusKeyword,
      category: 'Teknik SEO',
      tone: 'Profesyonel & Kurumsal',
      status: 'published',
      authorName: 'İçerik Stüdyosu Editörü',
      readTimeMin: audit.readTimeMin,
      publishedIso: new Date(now).toISOString().slice(0, 10),
      summary: metaDescription,
      sections: parseBodyTextIntoSections(sampleBody, title),
      bodyText: sampleBody,
      actionPrompt: `"${title}" makalesindeki adımları kendi web sitemiz için somut bir haftalık içerik planına dönüştür.`,
      recommendedModelId: 'gemini-4-argon',
      seoScore: audit.overallScore,
      createdAt: now - 3_600_000,
      updatedAt: now - 3_600_000,
      isStudioEntry: true,
    },
  ];
}

export function normalizeStudioIsoDate(
  rawDate: string | undefined,
  fallbackNow: number
): string {
  const cleaned = (rawDate || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    const parsed = Date.parse(`${cleaned}T00:00:00Z`);
    if (Number.isFinite(parsed)) {
      return cleaned;
    }
  }
  return new Date(fallbackNow).toISOString().slice(0, 10);
}

export function validateAndBuildStudioArticle(
  existingArticles: PublishedStudioArticle[],
  input: ContentStudioPublishInput
): {
  article: PublishedStudioArticle | null;
  articles: PublishedStudioArticle[];
  error?: string;
} {
  const now = input.now ?? Date.now();
  const cleanTitle = redactSensitivePii((input.title || '').trim()).slice(0, 140);
  const rawMetaDesc = redactSensitivePii((input.metaDescription || '').trim()).slice(0, 220);
  const cleanKeyword = redactSensitivePii((input.focusKeyword || '').trim()).slice(0, 80);
  const cleanBody = redactSensitivePii((input.bodyText || '').trim()).slice(0, 15_000);
  const cleanAuthor = redactSensitivePii(
    (input.authorName || 'Site Editörü').trim() || 'Site Editörü'
  ).slice(0, 48);

  if (cleanTitle.length < 8) {
    return {
      article: null,
      articles: existingArticles,
      error: 'Blog başlığı en az 8 karakter olmalıdır.',
    };
  }
  if (cleanBody.length < 40) {
    return {
      article: null,
      articles: existingArticles,
      error: 'İçerik gövdesi doğrudan yayın için en az 40 karakter olmalıdır.',
    };
  }

  // If user omitted metaDescription, auto-derive a valid 120-156 char snippet from body/title
  const cleanMetaDesc =
    rawMetaDesc.length > 0
      ? rawMetaDesc
      : fitCharRange(
          cleanBody.replace(/#+\s+/g, '').replace(/\s+/g, ' ').trim(),
          60,
          156,
          `— ${cleanTitle}`,
          true
        );

  if (cleanMetaDesc.length < 30) {
    return {
      article: null,
      articles: existingArticles,
      error: 'SEO meta açıklaması en az 30 karakter olmalıdır (önerilen: 120–158 karakter).',
    };
  }

  const validCategories: BlogArticle['category'][] = [
    'Teknik SEO',
    'Web Performansı',
    'AI Mimarisi',
    'UI/UX Tasarım',
  ];
  const category: BlogArticle['category'] = validCategories.includes(input.category)
    ? input.category
    : 'Teknik SEO';

  const baseSlug =
    slugifyStudioText(input.slug || cleanTitle) || `icerik-${now.toString(36)}`;
  const editingId = (input.id || '').trim();

  const slugTaken = existingArticles.some(
    (a) => a.slug === baseSlug && a.id !== editingId
  );
  const finalSlug = slugTaken ? `${baseSlug}-${now.toString(36).slice(-4)}` : baseSlug;

  const audit = evaluateContentEntrySeo({
    title: cleanTitle,
    metaDescription: cleanMetaDesc,
    slug: finalSlug,
    focusKeyword: cleanKeyword || cleanTitle.split(/\s+/).slice(0, 2).join(' '),
    bodyText: cleanBody,
  });

  const cleanSummary = redactSensitivePii((input.summary || '').trim()).slice(0, 320) || cleanMetaDesc;
  const sections = parseBodyTextIntoSections(cleanBody, cleanTitle);
  const existingMatch = editingId
    ? existingArticles.find((a) => a.id === editingId)
    : undefined;

  const resolvedPublishedIso = input.publishedIso
    ? normalizeStudioIsoDate(input.publishedIso, now)
    : existingMatch?.publishedIso || new Date(now).toISOString().slice(0, 10);

  const built: PublishedStudioArticle = {
    id: existingMatch?.id || `studio-art-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    slug: finalSlug,
    title: cleanTitle,
    metaTitle: redactSensitivePii((input.metaTitle || cleanTitle).trim()).slice(0, 70) || cleanTitle,
    metaDescription: cleanMetaDesc,
    focusKeyword: cleanKeyword || cleanTitle.toLowerCase().slice(0, 48),
    category,
    tone: input.tone || 'Profesyonel & Kurumsal',
    status: input.status === 'draft' ? 'draft' : 'published',
    authorName: cleanAuthor,
    readTimeMin: audit.readTimeMin,
    publishedIso: resolvedPublishedIso,
    summary: cleanSummary,
    sections,
    bodyText: cleanBody,
    actionPrompt: `"${cleanTitle}" başlıklı içeriğimizi teknik derinlik, örnekler ve dönüşüm odaklı alt başlıklarla genişlet.`,
    recommendedModelId: input.recommendedModelId || 'gemini-4-argon',
    seoScore: audit.overallScore,
    createdAt: existingMatch?.createdAt || now,
    updatedAt: now,
    isStudioEntry: true,
  };

  const nextList = existingMatch
    ? existingArticles.map((a) => (a.id === built.id ? built : a))
    : [built, ...existingArticles].slice(0, 50);

  return {
    article: built,
    articles: nextList,
  };
}

export function removeStudioArticleById(
  existingArticles: PublishedStudioArticle[],
  articleId: string
): PublishedStudioArticle[] {
  return existingArticles.filter((a) => a.id !== articleId);
}
