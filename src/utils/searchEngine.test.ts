import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSearchSuggestions,
  executeEnhancedSearch,
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
