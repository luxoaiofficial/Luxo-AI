import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateUnlockCode,
  canAccessModel,
  calculateGuestRemainingMessages,
  parseMarkdownBlocks,
  buildSystemPrompt,
  generateLocalSmartResponse,
  generateProceduralArtwork,
  GUEST_MESSAGE_LIMIT,
  LUXO_MODEL_CATEGORIES,
  LUXO_MODEL_IDS,
  LUXO_MODELS,
  LUXO_VOICES,
  NANO_BANANA_MODELS,
  NANO_LENS_PRESETS,
  SYNTHESIS_MODES,
  enhanceUserPrompt,
  enhanceMediaPrompt,
  buildSocialShareLinks,
  parseShareParams,
  buildOpenGraphMeta,
  getVoiceOption,
  sanitizeLuxoBrand,
  cleanAssistantResponse,
  buildConsensusFusionPrompt,
  resolvePublicAppUrl,
  resolveLiveShareOrigin,
  isPrivateDevPreviewOrigin,
  isCinemaDirectorModel,
  isVideoIntentPrompt,
  isDirectVideoCreationRequest,
  isDirectImageCreationRequest,
  shouldGenerateVideoInChat,
  shouldGenerateImageInChat,
  normalizeCinematicMotion,
  describeCinematicMotion,
  resolveAutoRoutedModel,
  evaluateSafeMathExpression,
  foldTurkishDiacritics,
  verifyAndRepairModelOutput,
  INITIAL_VISUALS,
} from './luxoLogic';
import {
  detectSceneArchetype,
  buildDefaultSceneSpec,
  synthesizeAmbientScoreWav,
  resolveVideoRenderMetrics,
} from './videoEngine';
import { parseVisualPrompt } from './visualSceneComposer';
import {
  extractCleanEnglishKeywords,
  resolveDiffusionDimensions,
  translateTurkishVisualTermsDeterministic,
} from './photorealisticMediaEngine';

test('validateUnlockCode recognizes Plus VIP and Go Helper developer passwords', () => {
  assert.equal(validateUnlockCode('serpilmurat123'), 'dev_full');
  assert.equal(validateUnlockCode('  serpilmurat123  '), 'dev_full');
  assert.equal(validateUnlockCode('serpil123'), 'dev_helper');
  assert.equal(validateUnlockCode('wrong-pass'), 'invalid');
  assert.equal(validateUnlockCode(''), 'invalid');
});

test('LUXO_MODELS includes Gemini 4 Argon unlocked for both guests and signed-in users', () => {
  assert.ok(LUXO_MODELS['gemini-4-argon']);
  assert.equal(LUXO_MODELS['gemini-4-argon'].name, 'Gemini 4 Argon');
  assert.equal(LUXO_MODELS['gemini-4-argon'].contextWindow, '2M Token');
  const guestUser = {
    isGuest: true,
    isUnlockedDev: false,
    isUnlockedDevHelper: false,
  };
  assert.deepEqual(canAccessModel('gemini-4-argon', guestUser), {
    allowed: true,
  });
});

test('LUXO_VOICES includes 10 neural voices with prebuilt Gemini voice mappings', () => {
  assert.equal(LUXO_VOICES.length, 10);
  const newVoices = LUXO_VOICES.filter((v) => v.isNew);
  assert.equal(newVoices.length, 5);
  for (const voice of LUXO_VOICES) {
    assert.ok(voice.geminiVoice.length > 0);
    assert.ok(voice.acousticStyle.length > 0);
  }
  assert.equal(getVoiceOption('Nova').name, 'Nova');
  assert.equal(getVoiceOption('UnknownVoice').name, 'Breeze');
});

test('NANO_BANANA_MODELS and SYNTHESIS_MODES expose complete configurations', () => {
  assert.equal(NANO_BANANA_MODELS.length, 3);
  assert.equal(NANO_BANANA_MODELS[0].id, 'gemini-nano-banana-2.1');
  assert.equal(NANO_BANANA_MODELS[0].supports4K, true);
  assert.equal(SYNTHESIS_MODES.length, 4);
});

test('sanitizeLuxoBrand redacts gmail PII while preserving global AI model names', () => {
  const raw =
    'Merhaba ChatGPT, Claude, DeepSeek ve Higgsfield ekibi, ornek.kullanici@gmail.com adresine yazın.';
  const cleaned = sanitizeLuxoBrand(raw);
  assert.equal(cleaned.includes('@gmail.com'), false);
  assert.ok(cleaned.includes('Luxo Destek Merkezi'));
  assert.ok(cleaned.includes('ChatGPT'));
  assert.ok(cleaned.includes('Claude'));
  assert.ok(cleaned.includes('DeepSeek'));
  assert.ok(cleaned.includes('Higgsfield'));
});

test('canAccessModel enforces guest, Go, and Plus tier permissions accurately', () => {
  const guestUser = {
    isGuest: true,
    isUnlockedDev: false,
    isUnlockedDevHelper: false,
  };
  assert.deepEqual(canAccessModel('luxo-flash', guestUser), { allowed: true });
  assert.deepEqual(canAccessModel('luxo-argon', guestUser), {
    allowed: false,
    reason: 'guest',
  });

  const regularLoggedIn = {
    isGuest: false,
    isUnlockedDev: false,
    isUnlockedDevHelper: false,
  };
  assert.deepEqual(canAccessModel('luxo-argon', regularLoggedIn), {
    allowed: true,
  });
  assert.deepEqual(canAccessModel('luxo-ultra', regularLoggedIn), {
    allowed: true,
  });
  assert.deepEqual(canAccessModel('luxo-dev-helper', regularLoggedIn), {
    allowed: false,
    reason: 'dev_helper_locked',
  });
  assert.deepEqual(canAccessModel('luxo-dev', regularLoggedIn), {
    allowed: false,
    reason: 'dev_locked',
  });

  const goUser = {
    isGuest: false,
    isUnlockedDev: false,
    isUnlockedDevHelper: true,
  };
  assert.deepEqual(canAccessModel('luxo-dev-helper', goUser), {
    allowed: true,
  });
  assert.deepEqual(canAccessModel('luxo-dev', goUser), {
    allowed: false,
    reason: 'dev_locked',
  });

  const plusUser = {
    isGuest: false,
    isUnlockedDev: true,
    isUnlockedDevHelper: false,
  };
  assert.deepEqual(canAccessModel('luxo-dev-helper', plusUser), {
    allowed: true,
  });
  assert.deepEqual(canAccessModel('luxo-dev', plusUser), { allowed: true });
});

test('calculateGuestRemainingMessages tracks remaining quota for guests and unlimited for signed-in users', () => {
  assert.equal(GUEST_MESSAGE_LIMIT, 100);
  assert.equal(
    calculateGuestRemainingMessages({ isGuest: true, guestMessageCount: 0 }),
    100
  );
  assert.equal(
    calculateGuestRemainingMessages({ isGuest: true, guestMessageCount: 5 }),
    95
  );
  assert.equal(
    calculateGuestRemainingMessages({ isGuest: true, guestMessageCount: 120 }),
    0
  );
  assert.equal(
    calculateGuestRemainingMessages({ isGuest: false, guestMessageCount: 10 }),
    Infinity
  );
});

test('parseMarkdownBlocks splits prose and fenced code blocks cleanly', () => {
  const sample =
    'Merhaba dünya\n```typescript\nconst x: number = 42;\n```\nSonuç paragrafı.';
  const parsed = parseMarkdownBlocks(sample);
  assert.equal(parsed.length, 3);
  assert.equal(parsed[0].type, 'text');
  assert.equal(parsed[1].type, 'code');
  assert.equal(parsed[1].lang, 'typescript');
  assert.ok(parsed[1].code?.includes('const x: number = 42;'));
  assert.equal(parsed[2].type, 'text');
});

test('buildSystemPrompt incorporates custom preferences, synthesisMode, memory, deep reasoning, and Luxo identity rules', () => {
  const prompt = buildSystemPrompt('gemini-4-argon', {
    customTone: 'Profesyonel',
    memoryItems: ['Kullanıcı TypeScript tercih eder'],
    projectContext: 'Mikroservis API',
    customInstructions: 'Kısa ve net yanıt ver.',
    deepReasoning: true,
    synthesisMode: 'uzman-mimari',
  });
  assert.ok(prompt.includes('Gemini 4 Argon'));
  assert.ok(prompt.includes('Profesyonel'));
  assert.ok(prompt.includes('Kullanıcı TypeScript tercih eder'));
  assert.ok(prompt.includes('Mikroservis API'));
  assert.ok(prompt.includes('Derin Akıl Yürütme & Öz-Doğrulama Aktif'));
  assert.ok(prompt.includes('Başmühendis & Mimari'));
});

test('enhanceUserPrompt and enhanceMediaPrompt enrich prompts cleanly without leaking emails', () => {
  const chatEnhanced = enhanceUserPrompt(
    'Mikroservis hız sınırlayıcı yaz test@gmail.com',
    'uzman-mimari'
  );
  assert.ok(chatEnhanced.includes('modüler mimari'));
  assert.equal(chatEnhanced.includes('@gmail.com'), false);

  const videoEnhanced = enhanceMediaPrompt(
    'Gece vakti İstanbul Boğazı üzerinde uçan dron',
    'video',
    'Sinematik',
    'Drone Yükselişi'
  );
  assert.ok(videoEnhanced.includes('Drone Yükselişi'));
  assert.ok(videoEnhanced.includes('24fps'));
});

test('Social share URL builder, parser, and OpenGraph meta generator work end-to-end', () => {
  const payload = {
    title: 'Gemini 4 Argon Dağıtık Mimari Analizi',
    excerpt: 'Yüksek erişilebilirlikli kayan pencere hız sınırlayıcı sentezi ve O(1) bellek doğrulaması.',
    contentType: 'chat' as const,
    badge: 'GEMINI 4 ARGON · LUXO AI',
  };

  const links = buildSocialShareLinks('https://example.run.app', payload);
  assert.ok(links.shareUrl.startsWith('https://example.run.app/?share=1'));
  assert.ok(links.twitter.includes('twitter.com/intent/tweet'));
  assert.ok(links.facebook.includes('facebook.com/sharer/sharer.php'));
  assert.ok(links.linkedin.includes('linkedin.com/sharing/share-offsite'));
  assert.ok(links.whatsapp.includes('api.whatsapp.com/send'));
  assert.ok(links.reddit.includes('reddit.com/submit'));
  assert.ok(links.telegram.includes('t.me/share/url'));

  const urlObj = new URL(links.shareUrl);
  const parsed = parseShareParams(urlObj.search);
  assert.ok(parsed);
  assert.equal(parsed?.title, payload.title);
  assert.equal(parsed?.contentType, 'chat');

  const og = buildOpenGraphMeta('https://example.run.app', parsed);
  assert.ok(og.title.includes('Luxo AI'));
  assert.ok(og.ogImageUrl.includes('/api/og-image?'));
  assert.ok(og.description.length >= 40 && og.description.length <= 160);
});

test('generateLocalSmartResponse and generateProceduralArtwork return rich valid outputs across aspect ratios', () => {
  const res = generateLocalSmartResponse(
    'React hız sınırlayıcı kodu yaz',
    'gemini-4-argon',
    {
      webSearch: true,
      deepReasoning: true,
      synthesisMode: 'uzman-mimari',
    }
  );
  assert.ok(res.text.includes('Gemini 4 Argon'));
  assert.ok(res.thinkingSteps.length >= 4);
  assert.ok(res.citations && res.citations.length > 0);
  assert.ok(
    Array.isArray(res.followUpSuggestions) && res.followUpSuggestions.length >= 3
  );

  for (const ratio of ['1:1', '16:9', '9:16', '3:4', '4:3'] as const) {
    const art = generateProceduralArtwork('Siberpunk İstasyon', 'Siberpunk', ratio);
    assert.ok(art.startsWith('data:image/svg+xml;utf8,'));
  }
});

test('resolvePublicAppUrl converts private ais-dev URLs into public ais-pre URLs', () => {
  assert.equal(
    resolvePublicAppUrl(
      'https://ais-dev-fudupxh6ld5rvvbfz5qwt4-705459740809.europe-west2.run.app/'
    ),
    'https://ais-pre-fudupxh6ld5rvvbfz5qwt4-705459740809.europe-west2.run.app'
  );
  assert.equal(
    resolvePublicAppUrl(
      'https://ais-pre-fudupxh6ld5rvvbfz5qwt4-705459740809.europe-west2.run.app'
    ),
    'https://ais-pre-fudupxh6ld5rvvbfz5qwt4-705459740809.europe-west2.run.app'
  );
  assert.equal(
    resolvePublicAppUrl('http://localhost:3000/'),
    'http://localhost:3000'
  );
  const devShareLinks = buildSocialShareLinks(
    'https://ais-dev-fudupxh6ld5rvvbfz5qwt4-705459740809.europe-west2.run.app',
    {
      title: 'Test Video Paylaşımı',
      excerpt: 'Nano Banana ve Google Veo ile üretilmiş MP4 video.',
      contentType: 'video',
    }
  );
  assert.ok(
    devShareLinks.shareUrl.startsWith(
      'https://ais-pre-fudupxh6ld5rvvbfz5qwt4-705459740809.europe-west2.run.app/?share=1'
    )
  );

  const liveDevOrigin = resolveLiveShareOrigin(
    'https://ais-dev-fudupxh6ld5rvvbfz5qwt4-705459740809.europe-west2.run.app/'
  );
  assert.equal(
    liveDevOrigin,
    'https://ais-dev-fudupxh6ld5rvvbfz5qwt4-705459740809.europe-west2.run.app'
  );
  const preservedDevLinks = buildSocialShareLinks(
    liveDevOrigin,
    {
      title: 'Canlı Önizleme Paylaşımı',
      excerpt: 'Kısa ve öz yanıt paylaşımı.',
      contentType: 'chat',
    },
    { preserveOrigin: true }
  );
  assert.ok(
    preservedDevLinks.shareUrl.startsWith(
      'https://ais-dev-fudupxh6ld5rvvbfz5qwt4-705459740809.europe-west2.run.app/?share=1'
    )
  );
  assert.equal(
    isPrivateDevPreviewOrigin(
      'https://ais-dev-fudupxh6ld5rvvbfz5qwt4-705459740809.europe-west2.run.app'
    ),
    true
  );
  assert.equal(
    isPrivateDevPreviewOrigin(
      'https://ais-pre-fudupxh6ld5rvvbfz5qwt4-705459740809.europe-west2.run.app'
    ),
    false
  );
});

test('cleanAssistantResponse enforces concise length, strips robotic self-intros, Argon Studio mentions, and decorative symbols', () => {
  const dirty =
    'Claude 4 Sonnet olarak yanıt veriyorum. ### ✦ ⚡ Başlık\n> Önemli not: *detaylı* açıklama.\nBu kodu Argon Kod Stüdyosu içinde canlı çalıştırabilir veya Stüdyoda Aç butonuna tıklayabilirsiniz. Doğrudan ve sade cevap burada yer alıyor.';
  const cleaned = cleanAssistantResponse(dirty);
  assert.equal(/olarak\s+yanıt\s+veriyorum/iu.test(cleaned), false);
  assert.equal(/argon\s+kod\s+stüdyo|stüdyoda\s+aç/iu.test(cleaned), false);
  assert.equal(/[✦⚡#>*]/.test(cleaned), false);
  assert.ok(cleaned.includes('Doğrudan ve sade cevap burada yer alıyor.'));

  const overlyLong = Array.from(
    { length: 25 },
    (_, i) => `Bu cümle numara ${i + 1} olup test amacıyla uzatılmıştır.`
  ).join(' ');
  const capped = cleanAssistantResponse(overlyLong);
  assert.ok(capped.length <= 680);
  assert.ok(capped.endsWith('.'));

  const fusion = buildConsensusFusionPrompt(
    'Önbellek stratejisi nedir?',
    'gemini-4-argon',
    'Redis ve bellek içi önbellek birlikte kullanılmalıdır.',
    'claude-4-sonnet',
    'Kısa süreli TTL ve istek birleştirme gecikmeyi düşürür.'
  );
  assert.ok(fusion.includes('Gemini 4 Argon'));
  assert.ok(fusion.includes('Claude 4 Sonnet'));
});

test('isVideoIntentPrompt and isDirectVideoCreationRequest accurately classify Turkish video prompts', () => {
  assert.equal(
    isVideoIntentPrompt('Gece İstanbul Boğazı üzerinde uçan araba videosu'),
    true
  );
  assert.equal(isVideoIntentPrompt('Fütüristik şehirde drone uçuşu'), true);
  assert.equal(
    isVideoIntentPrompt('Kristal kubbeli botanik uzay istasyonu 4K fotoğraf'),
    false
  );

  assert.equal(
    isDirectVideoCreationRequest(
      'Bana okyanus kıyısında uçan dron videosu üret'
    ),
    true
  );
  assert.equal(
    isDirectVideoCreationRequest('Nano Banana ile siberpunk animasyon oluştur'),
    true
  );
  assert.equal(
    isDirectVideoCreationRequest('H.264 video sıkıştırma algoritması nedir?'),
    false
  );
});

test('videoEngine scene archetypes, default specs, and WAV score synthesis work deterministically', () => {
  assert.equal(
    detectSceneArchetype('İstanbul Boğazı köprü silüeti', 'Sinematik'),
    'bosphorus'
  );
  assert.equal(
    detectSceneArchetype('Mavi biyolüminesan okyanus dalgaları', 'Sinematik'),
    'ocean'
  );
  assert.equal(
    detectSceneArchetype('Kuantum işlemci ve robotik kol', 'Fotogerçekçi'),
    'robotics'
  );

  const spec = buildDefaultSceneSpec(
    'Altın saatte İstanbul Boğazı üzerinde uçuş',
    'Siberpunk'
  );
  assert.equal(spec.archetype, 'bosphorus');
  assert.match(spec.skyTop, /^#[0-9a-fA-F]{6}$/);

  const wavBuf = synthesizeAmbientScoreWav(2);
  assert.equal(wavBuf.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wavBuf.toString('ascii', 8, 12), 'WAVE');
  assert.equal(wavBuf.length, 44 + 24000 * 2 * 2);

  const showcaseVideo = INITIAL_VISUALS.find((v) => v.mediaType === 'video');
  assert.ok(showcaseVideo);
  assert.equal(showcaseVideo?.videoUrl, '/api/videos/showcase-veo.mp4');
});

test('All 115 selectable AI models across 9 provider ecosystems (10 tabs), Nano Banana panoramic ratios, and High-Fidelity 4K 60fps video metrics work end-to-end', () => {
  assert.equal(LUXO_MODEL_IDS.length, 115);
  assert.equal(LUXO_MODEL_CATEGORIES.length, 10);
  assert.ok(LUXO_MODELS['gemini-4-hydrogen']);
  assert.ok(LUXO_MODELS['gemini-4-carbon']);
  assert.ok(LUXO_MODELS['gemini-4-neon']);
  assert.equal(LUXO_MODELS['gemini-4-hydrogen'].name, 'Gemini 4 Hydrogen');
  assert.ok(buildSystemPrompt('gemini-4-hydrogen').includes('HYDROGEN'));

  const guestUser = {
    isGuest: true,
    isUnlockedDev: false,
    isUnlockedDevHelper: false,
  };
  const lockedOnlyIds = new Set([
    'luxo-ultra',
    'luxo-argon',
    'luxo-dev-helper',
    'luxo-dev',
  ]);

  for (const mId of LUXO_MODEL_IDS) {
    assert.ok(LUXO_MODELS[mId], `Missing model ${mId}`);
    assert.ok(LUXO_MODELS[mId].id.length <= 30, `Model ID too long: ${mId}`);
    assert.equal(
      /olarak\s+yanıt\s+veriyorum/iu.test(LUXO_MODELS[mId].systemInstruction),
      false,
      `System instruction must not force robotic intro: ${mId}`
    );
    if (!lockedOnlyIds.has(mId)) {
      assert.deepEqual(canAccessModel(mId, guestUser), { allowed: true });
    }
  }

  assert.equal(isCinemaDirectorModel('runway-gen-4'), true);
  assert.equal(isCinemaDirectorModel('kling-2-master'), true);
  assert.equal(isCinemaDirectorModel('gpt-4-5-orion'), false);

  // Verify distinct model-specific outputs for side-by-side comparison
  const claudeCode = generateLocalSmartResponse(
    'TypeScript akış kontrolcüsü kodu yaz',
    'claude-3-7-sonnet'
  );
  const deepseekCode = generateLocalSmartResponse(
    'TypeScript akış kontrolcüsü kodu yaz',
    'deepseek-coder-v3'
  );
  const runwayScene = generateLocalSmartResponse(
    'Yağmurlu neon sokakta sinematik sahne planla',
    'runway-gen-4'
  );
  assert.ok(claudeCode.text.includes('Claude 3.7 Sonnet'));
  assert.ok(deepseekCode.text.includes('DeepSeek Coder V3'));
  assert.notEqual(claudeCode.text, deepseekCode.text);
  assert.ok(runwayScene.text.includes('Runway Gen-4'));

  // Verify Nano Banana panoramic ratios & optical lens presets
  assert.equal(NANO_LENS_PRESETS.length, 5);
  assert.equal(NANO_BANANA_MODELS[0].supportsPanoramic, true);
  for (const pano of ['4:1', '1:4', '8:1', '1:8'] as const) {
    const svg = generateProceduralArtwork(
      'Panoramik İstanbul Boğazı',
      'Sinematik',
      pano
    );
    assert.ok(svg.startsWith('data:image/svg+xml;utf8,'));
  }

  // Verify High-Fidelity 4K + 60fps frame interpolation prompt & render metrics
  const hiFiPrompt = enhanceMediaPrompt(
    'Okyanus üzerinde sinematik uçuş',
    'video',
    'Sinematik',
    'Sinematik Drone Akışı',
    {
      highFidelity: true,
      lensPreset: 'imax-anamorphic',
      negativePrompt: 'bulanıklık, filigran',
    }
  );
  assert.ok(hiFiPrompt.includes('4K UHD'));
  assert.ok(hiFiPrompt.includes('60fps'));
  assert.ok(hiFiPrompt.includes('IMAX'));
  assert.ok(hiFiPrompt.includes('bulanıklık'));

  const stdMetrics = resolveVideoRenderMetrics({
    aspectRatio: '16:9',
    highFidelity: false,
    frameInterpolation: false,
  });
  assert.equal(stdMetrics.width, 1280);
  assert.equal(stdMetrics.height, 720);
  assert.equal(stdMetrics.fps, 24);
  assert.equal(stdMetrics.interpolated, false);

  const hiFiMetrics = resolveVideoRenderMetrics({
    aspectRatio: '16:9',
    highFidelity: true,
    frameInterpolation: true,
  });
  assert.equal(hiFiMetrics.width, 1920);
  assert.equal(hiFiMetrics.height, 1080);
  assert.equal(hiFiMetrics.fps, 60);
  assert.equal(hiFiMetrics.crf, '18');
  assert.equal(hiFiMetrics.interpolated, true);

  const portraitHiFi = resolveVideoRenderMetrics({
    aspectRatio: '9:16',
    highFidelity: true,
    frameInterpolation: true,
  });
  assert.equal(portraitHiFi.width, 1080);
  assert.equal(portraitHiFi.height, 1920);
  assert.equal(portraitHiFi.fps, 60);
});

test('Luxo Auto-Router, deterministic math evaluator, direct image intent, and semantic Nano Banana / Veo scene composer match exact prompt subjects and colors', () => {
  // Auto-Router domain routing
  assert.equal(
    resolveAutoRoutedModel('TypeScript ile önbellek sınıfı kodu yaz').targetModelId,
    'claude-4-5-sonnet'
  );
  assert.equal(
    resolveAutoRoutedModel('2450 sayısının %18 kaçtır?').targetModelId,
    'deepseek-math-v2'
  );
  assert.equal(
    resolveAutoRoutedModel('Sinematik drone kamera sahne planla').targetModelId,
    'veo-3-cinema-pro'
  );
  assert.equal(
    resolveAutoRoutedModel('2026 güncel yapay zeka gelişmelerini araştır').targetModelId,
    'perplexity-sonar-pro'
  );

  // Deterministic math solver
  const pct = evaluateSafeMathExpression("2500'ün %18'i kaç eder?");
  assert.ok(pct);
  assert.equal(pct?.result, '450');

  const arith = evaluateSafeMathExpression('(12 + 8) * 5 - 14 kaçtır?');
  assert.ok(arith);
  assert.equal(arith?.result, '86');

  const autoMathRes = generateLocalSmartResponse(
    '(15 + 25) * 3 kaç eder?',
    'luxo-auto-router'
  );
  assert.ok(autoMathRes.text.includes('120'));
  assert.equal(autoMathRes.routedModelId, 'deepseek-math-v2');

  // Direct image creation intent vs technical question
  assert.equal(
    isDirectImageCreationRequest('Bana kırmızı bir spor araba resmi çiz'),
    true
  );
  assert.equal(
    isDirectImageCreationRequest('Pencere kenarında sevimli turuncu kedi görseli oluştur'),
    true
  );
  assert.equal(
    isDirectImageCreationRequest('PNG ve JPEG sıkıştırma farkı nedir?'),
    false
  );

  // Prompt-faithful visual scene composer (subjects, colors, environments)
  const carScene = parseVisualPrompt(
    'Gece yağmurlu neon sokakta kırmızı spor araba',
    'Siberpunk'
  );
  assert.equal(carScene.subject, 'car');
  assert.equal(carScene.subjectColor, '#ef4444');
  assert.equal(carScene.weather, 'rain');
  assert.equal(carScene.timeOfDay, 'neon_night');

  const catScene = parseVisualPrompt(
    'Güneşli pencere kenarında sevimli turuncu kedi',
    'Fotogerçekçi'
  );
  assert.equal(catScene.subject, 'cat');
  assert.equal(catScene.subjectColor, '#f97316');
  assert.equal(catScene.environment, 'cafe');

  const astroScene = parseVisualPrompt(
    'Derin uzayda süzülen beyaz astronot ve gezegenler',
    'Sinematik'
  );
  assert.equal(astroScene.subject, 'astronaut');
  assert.equal(astroScene.environment, 'space');

  const carSvg = decodeURIComponent(
    generateProceduralArtwork(
      'Gece neon bulvarda kırmızı spor araba',
      'Sinematik',
      '16:9'
    )
  );
  assert.ok(carSvg.includes('#ef4444'));
  assert.ok(carSvg.includes('<svg'));

  // Photorealistic Media Engine translation, clean search keywords, dimensions, and real showcase assets
  const catDiffPrompt = translateTurkishVisualTermsDeterministic(
    'Pencere kenarında sevimli turuncu kedi fotoğrafı oluştur',
    'Fotogerçekçi',
    'image'
  );
  assert.ok(/ginger orange/i.test(catDiffPrompt));
  assert.ok(/\bcat\b/i.test(catDiffPrompt));
  assert.ok(/window/i.test(catDiffPrompt));
  assert.ok(/DSLR photograph/i.test(catDiffPrompt));

  const alpsDiffPrompt = translateTurkishVisualTermsDeterministic(
    'Karlı Alpler zirvesinde altın saat gün batımı ve çam ormanı',
    'Sinematik',
    'video',
    'Sinematik Drone Akışı'
  );
  assert.ok(/Alps mountains/i.test(alpsDiffPrompt));
  assert.ok(/pine forest/i.test(alpsDiffPrompt));
  assert.ok(/drone/i.test(alpsDiffPrompt));

  const cleanKw = extractCleanEnglishKeywords(alpsDiffPrompt);
  assert.ok(/alps/i.test(cleanKw));
  assert.equal(/[^a-z\s]/.test(cleanKw), false);

  assert.deepEqual(resolveDiffusionDimensions('16:9'), {
    width: 1280,
    height: 736,
  });
  assert.deepEqual(resolveDiffusionDimensions('9:16'), {
    width: 736,
    height: 1280,
  });
  assert.deepEqual(resolveDiffusionDimensions('8:1'), {
    width: 1344,
    height: 256,
  });

  // Verify INITIAL_VISUALS showcase gallery uses real JPEG photographs & real MP4 video (never cartoon SVGs)
  for (const item of INITIAL_VISUALS) {
    assert.equal(item.dataUrl.startsWith('data:image/svg'), false);
    assert.ok(item.dataUrl.endsWith('.jpg'));
  }

  // Verify Cinematic Motion Controller clamping, descriptions, and direct Chat model media routing
  const clampedMotion = normalizeCinematicMotion({
    cameraSpeed: 9.5,
    pan: -240,
    tilt: 145,
  });
  assert.deepEqual(clampedMotion, {
    cameraSpeed: 2.5,
    pan: -100,
    tilt: 90,
  });

  const motionDesc = describeCinematicMotion({
    cameraSpeed: 1.5,
    pan: 45,
    tilt: 30,
  });
  assert.ok(motionDesc.summaryTr.includes('1.50x'));
  assert.ok(motionDesc.summaryTr.includes('+45°'));
  assert.ok(motionDesc.summaryTr.includes('+30°'));
  assert.ok(motionDesc.promptDirectiveEn.includes('pan right (45 degrees)'));
  assert.ok(motionDesc.promptDirectiveEn.includes('tilt upward (+30 degrees)'));

  // Direct Chat media synthesis routing for Nano Banana & Google Veo models + shorthand prompts
  assert.equal(
    shouldGenerateImageInChat('Güneşli sahilde kırmızı spor araba', 'nano-banana-2-1-ultra'),
    true
  );
  assert.equal(
    shouldGenerateImageInChat('turuncu kedi çiz', 'luxo-auto-router'),
    true
  );
  assert.equal(
    shouldGenerateVideoInChat('Gece İstanbul Boğazı köprüsü', 'veo-3-1-ultra-cinema'),
    true
  );
  assert.equal(
    shouldGenerateVideoInChat('İstanbul Boğazı videosu', 'luxo-auto-router'),
    true
  );
  assert.equal(
    shouldGenerateVideoInChat('Google Veo 3 nedir?', 'veo-3-1-ultra-cinema'),
    false
  );

  // Verify 7 new flagship models & ASCII diacritic-free Turkish mobile keyboard support
  for (const newModelId of [
    'chatgpt-5-2-pro',
    'gpt-image-2-ultra',
    'claude-4-6-opus',
    'deepseek-v3-2-exp',
    'qwen-image-edit-pro',
    'wan-2-2-cinema-ultra',
    'kling-2-5-turbo',
  ] as const) {
    assert.ok(LUXO_MODELS[newModelId], `Missing flagship model ${newModelId}`);
  }
  assert.equal(
    foldTurkishDiacritics('İstanbul Boğazı Görseli Çiz'),
    'istanbul bogazi gorseli ciz'
  );
  assert.equal(
    isDirectImageCreationRequest('mars yuzeyinde yuruyen kirmizi astronot gorseli olustur'),
    true
  );
  assert.equal(isDirectImageCreationRequest('sapka takan kedi ciz'), true);
  assert.equal(
    isDirectVideoCreationRequest('istanbul bogazi gun batimi video uret'),
    true
  );
  assert.equal(
    shouldGenerateImageInChat('kirmizi astronot mars yuzeyinde', 'gpt-image-2-ultra'),
    true
  );
  assert.equal(
    shouldGenerateVideoInChat('istanbul bogazi uzerinde ucus', 'wan-2-2-cinema-ultra'),
    true
  );
  const marsDiff = translateTurkishVisualTermsDeterministic(
    'mars yuzeyinde kirmizi astronot gorseli olustur',
    'Fotogerçekçi',
    'image'
  );
  assert.ok(/crimson red/i.test(marsDiff));
  assert.ok(/mars/i.test(marsDiff));
  assert.ok(/astronaut/i.test(marsDiff));
});

test('Fuzzy Turkish typo normalization handles "Yazjli" intelligently and eliminates canned boilerplate across distinct model personas', () => {
  const yazjliReply = generateLocalSmartResponse('Yazjli', 'gemini-3-8-flash');
  assert.equal(
    yazjliReply.text.includes('problemi doğrudan ölçülebilir tek bir hedefe indirgeyip'),
    false
  );
  assert.ok(yazjliReply.text.includes('Yazılım'));
  assert.ok(yazjliReply.text.includes('Yazılı'));
  assert.ok(
    yazjliReply.thinkingSteps.some((s) => s.includes('Yazım düzeltmesi algılandı'))
  );

  // Verify different AI ecosystems generate structurally and tonally distinct outputs
  const prompt = 'Mikroservis mimarisi ile monolitik mimari farkı nedir?';
  const geminiOut = generateLocalSmartResponse(prompt, 'gemini-3-8-flash');
  const claudeOut = generateLocalSmartResponse(prompt, 'claude-4-5-sonnet');
  const openaiO3Out = generateLocalSmartResponse(prompt, 'openai-o3');
  const deepseekOut = generateLocalSmartResponse(prompt, 'deepseek-r2');
  const grokOut = generateLocalSmartResponse(prompt, 'grok-4-heavy');
  const perplexityOut = generateLocalSmartResponse(prompt, 'perplexity-sonar-pro');

  assert.notEqual(geminiOut.text, claudeOut.text);
  assert.notEqual(claudeOut.text, openaiO3Out.text);
  assert.notEqual(openaiO3Out.text, deepseekOut.text);
  assert.notEqual(deepseekOut.text, grokOut.text);
  assert.notEqual(grokOut.text, perplexityOut.text);

  assert.ok(claudeOut.text.includes('Buradaki temel nokta'));
  assert.ok(openaiO3Out.text.includes('Problem Çerçevesi'));
  assert.ok(deepseekOut.text.includes('[Adım 1'));
  assert.ok(grokOut.text.includes('İşin özü şu:'));
  assert.ok(perplexityOut.text.includes('Araştırma Özeti:'));

  // Verify system prompts carry distinct authentic ecosystem directives
  assert.ok(
    buildSystemPrompt('claude-4-5-sonnet').includes('Anthropic Claude')
  );
  assert.ok(buildSystemPrompt('grok-4-heavy').includes('xAI Grok'));
  assert.ok(buildSystemPrompt('deepseek-r2').includes('DeepSeek'));
});

test('Linear & quadratic equation solver, multi-turn context inheritance, coder sub-specialization, editorial drafts, and verified site URLs work across all models', () => {
  // 1. Algebraic linear & quadratic equations
  const linear = evaluateSafeMathExpression('2x + 7 = 31 denklemini çöz');
  assert.ok(linear);
  assert.equal(linear?.result, 'x = 12');

  const quadratic = evaluateSafeMathExpression('x^2 - 5x + 6 = 0 köklerini bul');
  assert.ok(quadratic);
  assert.ok(quadratic?.result.includes('2') && quadratic?.result.includes('3'));

  // 2. Multi-turn follow-up resolution via conversationHistory
  const followUpTests = generateLocalSmartResponse(
    'Bunun için kapsamlı birim testleri yaz',
    'codestral-25',
    {
      conversationHistory: [
        { role: 'user', content: 'TypeScript hız sınırlayıcı (rate limiter) sınıfı tasarla' },
        { role: 'assistant', content: 'Token bucket tabanlı hız sınırlayıcı sınıfı hazırlandı.' },
      ],
    }
  );
  assert.ok(followUpTests.text.includes('node:test'));
  assert.ok(followUpTests.text.includes('assert'));

  // 3. Coder specialist sub-specialization in buildSystemPrompt & local engine
  const codestralSys = buildSystemPrompt('codestral-25');
  assert.ok(codestralSys.includes('KOD UZMANLIĞI'));
  const mathProverSys = buildSystemPrompt('deepseek-prover-v2');
  assert.ok(mathProverSys.includes('FORMEL MUHAKEME'));

  // 4. Ready-to-use official Turkish petition (dilekçe) draft
  const petition = generateLocalSmartResponse(
    'Üniversite mazeret sınavı için resmi dilekçe örneği yaz',
    'chatgpt-5-2-pro'
  );
  assert.ok(petition.text.includes('Konu:'));
  assert.ok(petition.text.toLowerCase().includes('arz ederim'));

  // 5. Verified permanent site URL inquiry & zero dead docs.luxo.ai citations
  const siteUrlReply = generateLocalSmartResponse(
    'Güncel çalışan site adresi nedir?',
    'gemini-4-argon',
    { webSearch: true }
  );
  assert.ok(
    siteUrlReply.text.includes(
      'https://ais-pre-fudupxh6ld5rvvbfz5qwt4-705459740809.europe-west2.run.app/'
    )
  );
  for (const cite of siteUrlReply.citations || []) {
    assert.equal(cite.url.includes('docs.luxo.ai'), false);
  }
});

test('All 115 models support precision tuning options and verifyAndRepairModelOutput auto-closes unclosed code fences', () => {
  assert.equal(LUXO_MODEL_IDS.length, 115);
  assert.ok(LUXO_MODELS['gemini-4-hydrogen']);

  const hydrogenSys = buildSystemPrompt('gemini-4-hydrogen', {
    reasoningLevel: 'deep',
    responseConciseness: 'detailed',
    codeStrictness: 'explained',
    autoVerifyOutputs: true,
  });
  assert.ok(hydrogenSys.includes('Gemini 4 Hydrogen'));
  assert.ok(hydrogenSys.includes('Yanıt Yoğunluğu (Detaylı Analiz)'));
  assert.ok(hydrogenSys.includes('Kod Kalite Modu (Eğitici Açıklamalı)'));
  assert.ok(hydrogenSys.includes('Otonom Çıktı Denetimi Açık'));

  const fastSys = buildSystemPrompt('luxo-flash', {
    reasoningLevel: 'fast',
    responseConciseness: 'concise',
    codeStrictness: 'production',
  });
  assert.ok(fastSys.includes('Hızlı Çevik Yanıt Modu Aktif'));
  assert.ok(fastSys.includes('Yanıt Yoğunluğu (Kısa & Öz)'));
  assert.ok(fastSys.includes('Kod Kalite Modu (Üretim Standardı)'));

  const brokenCode = 'Örnek TypeScript kodu:\n```ts\nconst x: number = 42;';
  const repaired = verifyAndRepairModelOutput(brokenCode, {
    allowLong: true,
    autoVerify: true,
  });
  const fences = repaired.match(/```/g) || [];
  assert.equal(fences.length, 2);
  assert.ok(repaired.endsWith('```'));
});
