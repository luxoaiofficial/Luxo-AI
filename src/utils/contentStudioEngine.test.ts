import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialStudioArticles,
  evaluateContentEntrySeo,
  generateDeterministicContentPack,
  parseBodyTextIntoSections,
  removeStudioArticleById,
  slugifyStudioText,
  validateAndBuildStudioArticle,
} from './contentStudioEngine';
import {
  addArticleComment,
  createInitialCommunityState,
  reactToArticle,
} from './seoPerfEngagementEngine';

test('slugifyStudioText converts Turkish characters into clean URL slugs', () => {
  assert.equal(
    slugifyStudioText('Çağdaş Web Siteleri İçin Örnek Şablon & Hız!'),
    'cagdas-web-siteleri-icin-ornek-sablon-hiz'
  );
});

test('generateDeterministicContentPack creates SEO-length blog titles, meta descriptions, and structured sections', () => {
  const pack = generateDeterministicContentPack({
    topic: 'E-ticaret Sitelerinde Core Web Vitals Hızlandırma',
    focusKeyword: 'core web vitals optimizasyonu',
    audience: 'Web Mühendisleri & SEO Uzmanları',
    tone: 'Teknik & Mühendislik',
    intent: 'Ticari',
  });

  assert.equal(pack.blogTitles.length, 4);
  for (const cand of pack.blogTitles) {
    assert.ok(cand.charLength >= 30 && cand.charLength <= 65);
    assert.ok(cand.estimatedCtrPct > 15);
  }

  assert.equal(pack.metaDescriptions.length, 3);
  for (const desc of pack.metaDescriptions) {
    assert.ok(desc.charLength >= 115 && desc.charLength <= 160);
    assert.equal(desc.inOptimalRange, true);
  }

  assert.ok(pack.suggestedSections.length >= 3);
  assert.equal(pack.primaryKeyword, 'core web vitals optimizasyonu');
  for (const kw of pack.secondaryKeywords) {
    assert.ok(!kw.includes('optimizasyonu optimizasyonu'));
  }

  const seoPack = generateDeterministicContentPack({
    topic: 'Kurumsal Web Sitelerinde Teknik SEO ve Hız Optimizasyonu',
    focusKeyword: 'teknik seo optimizasyonu',
  });
  assert.ok(seoPack.blogTitles[0].title.includes('Teknik SEO'));
  assert.ok(!seoPack.blogTitles[0].title.includes('Teknik SE '));
  for (const desc of seoPack.metaDescriptions) {
    assert.ok(desc.description.endsWith('.'));
  }
});

test('evaluateContentEntrySeo computes accurate SEO score, keyword match, and warnings', () => {
  const strongBody = Array.from(
    { length: 14 },
    () =>
      'Teknik seo denetimi ve sayfa hızı optimizasyonu organik arama görünürlüğünü doğrudan yükseltir.'
  ).join(' ');

  const optimal = evaluateContentEntrySeo({
    title: 'Teknik SEO Denetimi Rehberi: 2026 Hız ve İndeksleme Adımları',
    metaDescription:
      'Web sitenizde teknik seo denetimi, kanonik URL ve yapısal veri kurallarıyla organik tıklama oranını artıran uygulama rehberini hemen inceleyin.',
    slug: 'teknik-seo-denetimi-rehberi',
    focusKeyword: 'teknik seo denetimi',
    bodyText: strongBody,
  });

  assert.equal(optimal.overallScore, 100);
  assert.equal(optimal.titleOptimal, true);
  assert.equal(optimal.metaDescriptionOptimal, true);
  assert.equal(optimal.keywordInTitle, true);
  assert.equal(optimal.keywordInMeta, true);
  assert.equal(optimal.warnings.length, 0);

  const weak = evaluateContentEntrySeo({
    title: 'Kısa',
    metaDescription: 'Çok kısa meta',
    slug: 'ab',
    focusKeyword: 'bulunmayan terim',
    bodyText: 'Az kelime.',
  });
  assert.ok(weak.overallScore < 30);
  assert.ok(weak.warnings.length >= 4);
});

test('validateAndBuildStudioArticle enforces form validation, redacts PII, deduplicates slugs, and supports comments/reactions', () => {
  const initial = createInitialStudioArticles(1_760_000_000_000);
  assert.equal(initial.length, 1);

  const missingTitle = validateAndBuildStudioArticle(initial, {
    title: 'Kısa',
    metaDescription: 'Yeterince uzun bir meta açıklama metni buraya yazıldı ve kontrol edildi.',
    focusKeyword: 'seo',
    category: 'Teknik SEO',
    tone: 'Profesyonel & Kurumsal',
    status: 'published',
    bodyText: 'Bu gövde metni kırk karakter sınırını rahatlıkla geçecek uzunluktadır.',
  });
  assert.equal(missingTitle.article, null);
  assert.ok(missingTitle.error);

  const validPublish = validateAndBuildStudioArticle(initial, {
    title: 'Yapay Zeka Destekli Meta Açıklama Stratejileri 2026',
    metaDescription:
      'Arama motoru sonuçlarında tıklama oranını artıran meta açıklama stratejileri. İletişim: editor@gizli.com adresinden bize ulaşın.',
    focusKeyword: 'meta açıklama stratejileri',
    category: 'Teknik SEO',
    tone: 'Dönüşüm & Büyüme Odaklı',
    status: 'published',
    authorName: 'yazar@test.com',
    bodyText:
      '## 01. Meta Açıklama Temelleri\nDoğru kurgulanan meta açıklama stratejileri organik tıklama oranını belirgin biçimde artırır.\n\n## 02. Uygulama Adımları\nEylem çağrısı içeren 120-158 karakterlik özetler kullanın.',
    now: 1_760_000_050_000,
  });

  assert.ok(validPublish.article);
  assert.ok(!validPublish.article!.metaDescription.includes('editor@gizli.com'));
  assert.ok(!validPublish.article!.authorName.includes('yazar@test.com'));
  assert.equal(validPublish.article!.sections.length, 2);
  assert.equal(validPublish.articles.length, 2);

  // Duplicate slug collision check
  const duplicateSlug = validateAndBuildStudioArticle(validPublish.articles, {
    title: 'Yapay Zeka Destekli Meta Açıklama Stratejileri 2026',
    metaDescription:
      'İkinci içerik aynı başlıkla eklendiğinde kalıcı bağlantı çakışması otomatik olarak önlenir ve benzersiz ek alır.',
    focusKeyword: 'meta açıklama',
    category: 'Teknik SEO',
    tone: 'Profesyonel & Kurumsal',
    status: 'draft',
    bodyText:
      'İkinci makale gövdesi de kırk karakterden uzun olacak biçimde doğrulama katmanından geçirilir.',
    now: 1_760_000_090_000,
  });
  assert.ok(duplicateSlug.article);
  assert.notEqual(duplicateSlug.article!.slug, validPublish.article!.slug);

  // CommunityHubState integration: comments and reactions work on studio-published articles
  const hubState = {
    ...createInitialCommunityState(1_760_000_100_000),
    studioArticles: duplicateSlug.articles,
  };
  const commented = addArticleComment(hubState, {
    articleId: validPublish.article!.id,
    authorName: 'Deniz',
    body: 'Doğrudan yayınlanan bu rehber çok net olmuş.',
  });
  assert.ok(commented.comment);
  const reacted = reactToArticle(commented.state, validPublish.article!.id);
  assert.equal(reacted.articleReactions[validPublish.article!.id], 1);

  // Deletion check
  const afterDelete = removeStudioArticleById(
    duplicateSlug.articles,
    duplicateSlug.article!.id
  );
  assert.equal(afterDelete.length, 2);
});

test('parseBodyTextIntoSections extracts markdown and numbered headings cleanly', () => {
  const sections = parseBodyTextIntoSections(
    '## Birinci Bölüm\nİlk paragraf metni.\n\n2. İkinci Bölüm\nİkinci paragraf metni.',
    'Yedek Başlık'
  );
  assert.equal(sections.length, 2);
  assert.equal(sections[0].heading, 'Birinci Bölüm');
  assert.equal(sections[1].heading, '2. İkinci Bölüm');
});

test('validateAndBuildStudioArticle respects custom publication date, edit mode, and empty meta fallback', () => {
  const initial = createInitialStudioArticles(1_760_000_000_000);
  const created = validateAndBuildStudioArticle(initial, {
    title: 'Basit CMS Blog Yazısı Denemesi 2026',
    metaDescription: '',
    focusKeyword: 'cms blog',
    category: 'AI Mimarisi',
    tone: 'Profesyonel & Kurumsal',
    status: 'published',
    authorName: 'Deniz Kaya',
    publishedIso: '2026-05-14',
    bodyText:
      'Bu içerik basit CMS formundan başlık, içerik, yazar ve yayın tarihi seçilerek doğrudan oluşturuldu.',
  });

  assert.ok(created.article);
  assert.equal(created.article!.publishedIso, '2026-05-14');
  assert.equal(created.article!.authorName, 'Deniz Kaya');
  assert.ok(created.article!.metaDescription.length >= 30);

  const edited = validateAndBuildStudioArticle(created.articles, {
    id: created.article!.id,
    title: 'Güncellenmiş CMS Blog Yazısı 2026',
    metaDescription: created.article!.metaDescription,
    focusKeyword: 'cms blog',
    category: 'AI Mimarisi',
    tone: 'Profesyonel & Kurumsal',
    status: 'published',
    authorName: 'Deniz Kaya',
    publishedIso: '2026-06-01',
    bodyText:
      'Güncellenen içerik metni en az kırk karakter uzunluğunda olup düzenleme modunu doğrular.',
  });
  assert.ok(edited.article);
  assert.equal(edited.article!.id, created.article!.id);
  assert.equal(edited.article!.publishedIso, '2026-06-01');
  assert.equal(edited.article!.title, 'Güncellenmiş CMS Blog Yazısı 2026');
});
