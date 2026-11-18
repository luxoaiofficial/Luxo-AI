import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addArticleComment,
  addForumReply,
  BLOG_ARTICLES,
  calculateWebPerfProjection,
  createForumThread,
  createInitialCommunityState,
  ENGAGEMENT_INTEGRATION_BLUEPRINTS,
  ENGAGEMENT_QUIZ_QUESTIONS,
  FOUR_PILLAR_SITE_AUDIT,
  generateRobotsTxt,
  generateSitemapXml,
  gradeQuizAnswers,
  moderateArticleComment,
  reactToArticle,
  replyArticleComment,
  scorePageMetaTags,
  SEO_CONTENT_BLUEPRINTS,
  TARGET_AUDIENCE_SEGMENTS,
  upvoteForumThread,
  voteArticleComment,
  voteInPoll,
} from './seoPerfEngagementEngine';

test('scorePageMetaTags awards 100 when title, description, canonical, JSON-LD, sitemap, and OG match standards', () => {
  const optimal = scorePageMetaTags({
    title: 'Luxo AI – 112 Yapay Zeka Modeli, 4K Görsel & Video Stüdyo',
    description:
      '112 yapay zeka modeliyle sohbet edin, kod yazın, Nano Banana ile 4K görsel ve Google Veo 3 ile sinematik video üretin. Hızlı ve ücretsiz deneyin.',
    canonicalUrl: 'https://ais-pre-fudupxh6ld5rvvbfz5qwt4-705459740809.europe-west2.run.app/',
    hasJsonLd: true,
    hasRobots: true,
    hasSitemap: true,
    hasOgImage: true,
  });
  assert.equal(optimal.score, 100);
  assert.ok(optimal.checks.every((c) => c.passed));

  const weak = scorePageMetaTags({
    title: 'App',
    description: 'Kısa',
    canonicalUrl: '',
    hasJsonLd: false,
    hasRobots: false,
    hasSitemap: false,
    hasOgImage: false,
  });
  assert.ok(weak.score < 30);
});

test('generateSitemapXml and generateRobotsTxt output valid standards-compliant crawl files', () => {
  const xml = generateSitemapXml(
    'https://example.run.app',
    [
      {
        locPath: '/?view=hub&thread=test-1',
        lastmodIso: '2026-11-02',
        changefreq: 'daily',
        priority: '0.7',
      },
    ],
    '2026-11-02'
  );
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(xml.includes('<loc>https://example.run.app/?view=hub</loc>'));
  assert.ok(xml.includes('<loc>https://example.run.app/?view=hub&amp;thread=test-1</loc>'));

  const robots = generateRobotsTxt('https://example.run.app/');
  assert.ok(robots.includes('Allow: /'));
  assert.ok(robots.includes('Sitemap: https://example.run.app/sitemap.xml'));
});

test('calculateWebPerfProjection computes deterministic latency, bandwidth, and CWV improvements', () => {
  const baseline = calculateWebPerfProjection({
    dailyVisitors: 10000,
    avgPromptTokens: 800,
    cacheHitRatePct: 0,
    imageWebpSavingsPct: 0,
    brotliEnabled: false,
    modelTier: 'flash-3-8',
  });
  const optimized = calculateWebPerfProjection({
    dailyVisitors: 10000,
    avgPromptTokens: 800,
    cacheHitRatePct: 45,
    imageWebpSavingsPct: 60,
    brotliEnabled: true,
    modelTier: 'flash-3-8',
  });

  assert.ok(optimized.effectiveMedianLatencyMs < baseline.effectiveMedianLatencyMs);
  assert.ok(optimized.monthlyBandwidthSavedGb > baseline.monthlyBandwidthSavedGb);
  assert.ok(optimized.estimatedLcpSec < baseline.estimatedLcpSec);
  assert.equal(optimized.estimatedCls, '0.00');
});

test('Forum thread creation validates inputs, redacts PII, and supports upvotes, replies, polls, and quiz grading', () => {
  const base = createInitialCommunityState(1_700_000_000_000);
  const invalid = createForumThread(base, {
    title: 'Kısa',
    category: 'SEO & Büyüme',
    body: 'Kısa',
  });
  assert.equal(invalid.created, null);
  assert.ok(invalid.error);

  const valid = createForumThread(base, {
    title: 'Teknik SEO ve Brotli sıkıştırma sonuçları',
    category: 'SEO & Büyüme',
    authorName: 'ali@example.com',
    body: 'Brotli sıkıştırma sonrasında sayfa açılış hızımız yarı yarıya iyileşti, iletişim: test@gmail.com',
    now: 1_700_000_010_000,
  });
  assert.ok(valid.created);
  assert.ok(!valid.created!.body.includes('test@gmail.com'));
  assert.ok(!valid.created!.authorName.includes('ali@example.com'));

  const upvoted = upvoteForumThread(valid.state, valid.created!.id);
  assert.equal(upvoted.threads[0].upvotes, 2);

  const replied = addForumReply(upvoted, {
    threadId: valid.created!.id,
    authorName: 'Uzman',
    body: 'Immutable önbellek başlığını da mutlaka ekleyin.',
  });
  assert.equal(replied.state.threads[0].replies.length, 1);

  const pollId = replied.state.polls[0].id;
  const optId = replied.state.polls[0].options[0].id;
  const prevVotes = replied.state.polls[0].options[0].votes;
  const voted = voteInPoll(replied.state, pollId, optId);
  assert.equal(voted.polls[0].options[0].votes, prevVotes + 1);

  const allCorrect: Record<string, number> = {};
  for (const q of ENGAGEMENT_QUIZ_QUESTIONS) {
    allCorrect[q.id] = q.correctIndex;
  }
  const graded = gradeQuizAnswers(allCorrect);
  assert.equal(graded.scorePct, 100);
  assert.equal(graded.correctCount, ENGAGEMENT_QUIZ_QUESTIONS.length);
});

test('Four-pillar audit, target audience segments, SEO content blueprints, and article comment/reaction reducers are valid', () => {
  assert.equal(FOUR_PILLAR_SITE_AUDIT.length, 4);
  const totalShare = TARGET_AUDIENCE_SEGMENTS.reduce((acc, s) => acc + s.sharePct, 0);
  assert.equal(totalShare, 100);
  assert.ok(SEO_CONTENT_BLUEPRINTS.length >= 5);
  assert.equal(ENGAGEMENT_INTEGRATION_BLUEPRINTS.length, 4);

  const base = createInitialCommunityState(1_700_000_000_000);
  const targetArticleId = BLOG_ARTICLES[0].id;
  const shortComment = addArticleComment(base, {
    articleId: targetArticleId,
    body: 'ok',
  });
  assert.equal(shortComment.comment, null);
  assert.ok(shortComment.error);

  const addedComment = addArticleComment(base, {
    articleId: targetArticleId,
    authorName: 'okur@test.com',
    body: 'Çok faydalı bir SEO ve hız makalesi olmuş, e-posta: deneme@example.com',
  });
  assert.ok(addedComment.comment);
  assert.ok(!addedComment.comment!.body.includes('deneme@example.com'));
  assert.ok(!addedComment.comment!.authorName.includes('okur@test.com'));

  const beforeReactions = addedComment.state.articleReactions[targetArticleId] || 0;
  const reacted = reactToArticle(addedComment.state, targetArticleId);
  assert.equal(reacted.articleReactions[targetArticleId], beforeReactions + 1);

  // Upvote comment
  const commentId = addedComment.comment!.id;
  const upvotedCommentState = voteArticleComment(reacted, targetArticleId, commentId, 'up');
  const upvotedComment = upvotedCommentState.articleComments[targetArticleId].find((c) => c.id === commentId);
  assert.equal(upvotedComment?.helpfulCount, 2);

  // Downvote comment
  const downvotedCommentState = voteArticleComment(upvotedCommentState, targetArticleId, commentId, 'down');
  const downvotedComment = downvotedCommentState.articleComments[targetArticleId].find((c) => c.id === commentId);
  assert.equal(downvotedComment?.downvotes, 1);

  // Reply to comment
  const replyResult = replyArticleComment(downvotedCommentState, {
    articleId: targetArticleId,
    parentId: commentId,
    authorName: 'Cevaplayan Uzman',
    body: 'Kesinlikle katılıyorum, sunucu tarafı cache de kritik.',
  });
  assert.ok(replyResult.comment);
  assert.equal(replyResult.comment!.parentId, commentId);

  // Admin moderation: pin, hide, and delete
  const pinnedState = moderateArticleComment(replyResult.state, targetArticleId, commentId, 'pin');
  assert.equal(pinnedState.articleComments[targetArticleId].find((c) => c.id === commentId)?.isPinned, true);

  const hiddenState = moderateArticleComment(pinnedState, targetArticleId, commentId, 'hide', 'Uygunsuz içerik');
  assert.equal(hiddenState.articleComments[targetArticleId].find((c) => c.id === commentId)?.isModerated, true);

  const deletedState = moderateArticleComment(hiddenState, targetArticleId, commentId, 'delete');
  assert.equal(deletedState.articleComments[targetArticleId].some((c) => c.id === commentId), false);
});

