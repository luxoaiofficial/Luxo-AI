import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSearchSuggestions,
  executeEnhancedSearch,
  extractAvailableTags,
  highlightMatchSegments,
  type SearchableItem,
} from './searchEngine.ts';

const now = 1_750_000_000_000;
const DAY_MS = 24 * 60 * 60 * 1000;

const SAMPLE_ITEMS: SearchableItem[] = [
  {
    id: 'm1',
    title: 'Gemini 4 Argon',
    subtitle: 'Ultra hızlı ve derin muhakeme modeli',
    category: 'model',
    timestamp: now - 2 * 60 * 60 * 1000,
    keywords: ['google', 'argon', 'kod'],
    badge: 'ARENA #1',
  },
  {
    id: 'm2',
    title: 'Claude 4.5 Sonnet',
    subtitle: 'Kod mimarisi ve güvenli TypeScript üretimi',
    category: 'model',
    timestamp: now - 3 * DAY_MS,
    keywords: ['anthropic', 'kod'],
    badge: 'KOD LİDERİ',
  },
  {
    id: 'c1',
    title: 'React Performans Optimizasyonu Sohbeti',
    subtitle: 'Lazy loading ve INP iyileştirme notları',
    category: 'chat',
    timestamp: now - 10 * 60 * 1000,
    keywords: ['react', 'performans', 'sohbet'],
  },
  {
    id: 'com1',
    title: 'Teknik SEO Checklist 2026',
    subtitle: 'Schema.org, sitemap ve Core Web Vitals',
    category: 'community',
    timestamp: now - 20 * DAY_MS,
    keywords: ['seo', 'blog', 'web'],
  },
];

test('executeEnhancedSearch filters by query, category, and date range and sorts accurately', () => {
  const byQuery = executeEnhancedSearch(SAMPLE_ITEMS, {
    query: 'kod',
    category: 'all',
    dateRange: 'all',
    sortBy: 'relevance',
    now,
  });
  assert.equal(byQuery.length, 2);

  const last24h = executeEnhancedSearch(SAMPLE_ITEMS, {
    query: '',
    category: 'all',
    dateRange: '24h',
    sortBy: 'date_desc',
    now,
  });
  assert.equal(last24h.length, 2);
  assert.equal(last24h[0].item.id, 'c1');

  const alphaSorted = executeEnhancedSearch(SAMPLE_ITEMS, {
    query: '',
    category: 'all',
    dateRange: 'all',
    sortBy: 'title_asc',
    now,
  });
  assert.equal(alphaSorted[0].item.title, 'Claude 4.5 Sonnet');

  const onlyModels = executeEnhancedSearch(SAMPLE_ITEMS, {
    query: '',
    category: 'model',
    dateRange: 'all',
    sortBy: 'relevance',
    now,
  });
  assert.equal(onlyModels.length, 2);
});

test('buildSearchSuggestions returns prefix-ranked autocomplete suggestions', () => {
  const suggestions = buildSearchSuggestions(SAMPLE_ITEMS, 'gem', 4);
  assert.ok(suggestions.length >= 1);
  assert.equal(suggestions[0].text, 'Gemini 4 Argon');

  const emptySuggestions = buildSearchSuggestions(SAMPLE_ITEMS, '', 4);
  assert.equal(emptySuggestions.length, 4);
});

test('highlightMatchSegments splits query tokens case-insensitively', () => {
  const segs = highlightMatchSegments('GitHub CI/CD Yayınlama', 'github');
  assert.equal(segs.some((s) => s.matched && s.text.toLowerCase() === 'github'), true);
  assert.equal(highlightMatchSegments('Gemini 4 Argon', '').length, 1);
});

test('executeEnhancedSearch filters by tag, publishedIso range, minRating and sorts by rating_desc', () => {
  const richItems: SearchableItem[] = [
    {
      id: 'b1',
      title: 'Carbon Hızlı API Tasarımı',
      subtitle: 'Düşük gecikmeli servis rehberi',
      category: 'community',
      timestamp: now - DAY_MS,
      publishedIso: '2026-10-15',
      keywords: ['api', 'carbon'],
      tags: ['Performans', 'Backend'],
      ratingAvg: 4.8,
      ratingCount: 12,
    },
    {
      id: 'b2',
      title: 'Neon Hızlı Özet Rehberi',
      subtitle: 'Kenar bilişim notları',
      category: 'community',
      timestamp: now - 5 * DAY_MS,
      publishedIso: '2026-11-02',
      keywords: ['neon', 'edge'],
      tags: ['Performans', 'Edge'],
      ratingAvg: 3.4,
      ratingCount: 5,
    },
    {
      id: 'b3',
      title: 'Gelişmiş SEO Mimarisi',
      subtitle: 'Schema ve Core Web Vitals',
      category: 'community',
      timestamp: now - 10 * DAY_MS,
      publishedIso: '2026-11-12',
      keywords: ['seo'],
      tags: ['SEO', 'Edge'],
      ratingAvg: 4.9,
      ratingCount: 20,
    },
  ];

  const tags = extractAvailableTags(richItems);
  assert.ok(tags.includes('Performans'));
  assert.ok(tags.includes('Edge'));

  const byTagAndRating = executeEnhancedSearch(richItems, {
    query: '',
    category: 'all',
    dateRange: 'all',
    tag: 'Performans',
    minRating: 4,
    sortBy: 'relevance',
    now,
  });
  assert.equal(byTagAndRating.length, 1);
  assert.equal(byTagAndRating[0].item.id, 'b1');

  const byPublishWindow = executeEnhancedSearch(richItems, {
    query: '',
    category: 'all',
    dateRange: 'all',
    dateFrom: '2026-11-01',
    dateTo: '2026-11-15',
    sortBy: 'rating_desc',
    now,
  });
  assert.equal(byPublishWindow.length, 2);
  assert.equal(byPublishWindow[0].item.id, 'b3');
  assert.equal(byPublishWindow[1].item.id, 'b2');
});
