import type { LuxoModelId } from '../types/luxo.ts';

export type SearchItemCategory =
  | 'action'
  | 'model'
  | 'chat'
  | 'library'
  | 'project'
  | 'community'
  | 'event';

export type SearchDateRange = 'all' | '24h' | '7d' | '30d';
export type SearchSortBy =
  | 'relevance'
  | 'date_desc'
  | 'date_asc'
  | 'rating_desc'
  | 'title_asc';

export interface SearchableItem {
  id: string;
  title: string;
  subtitle: string;
  category: SearchItemCategory;
  timestamp: number;
  keywords: string[];
  tags?: string[];
  ratingAvg?: number;
  ratingCount?: number;
  publishedIso?: string;
  badge?: string;
  modelId?: LuxoModelId;
  actionId?: string;
  chatId?: string;
  isLocked?: boolean;
  accentColor?: string;
}

export interface SearchQueryOptions {
  query: string;
  category: SearchItemCategory | 'all';
  dateRange: SearchDateRange;
  sortBy: SearchSortBy;
  tag?: string;
  dateFrom?: string;
  dateTo?: string;
  minRating?: number;
  now?: number;
}

export interface SearchSuggestion {
  text: string;
  category: SearchItemCategory;
  matchCount: number;
}

export interface RankedSearchResult {
  item: SearchableItem;
  score: number;
}

const DATE_WINDOW_MS: Record<Exclude<SearchDateRange, 'all'>, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

function scoreItemMatch(item: SearchableItem, tokens: string[], rawQuery: string): number {
  if (tokens.length === 0) {
    return 10;
  }

  const titleLower = item.title.toLowerCase();
  const subLower = item.subtitle.toLowerCase();
  const badgeLower = (item.badge || '').toLowerCase();
  const kwLower = item.keywords.map((k) => k.toLowerCase());
  const tagsLower = (item.tags || []).map((t) => t.toLowerCase());

  if (titleLower === rawQuery) return 120;

  let score = 0;
  for (const token of tokens) {
    let tokenMatched = false;
    if (titleLower.startsWith(token)) {
      score += 42;
      tokenMatched = true;
    } else if (titleLower.includes(token)) {
      score += 28;
      tokenMatched = true;
    }

    if (badgeLower.includes(token)) {
      score += 18;
      tokenMatched = true;
    }

    if (tagsLower.some((tg) => tg.includes(token))) {
      score += 16;
      tokenMatched = true;
    }

    if (kwLower.some((kw) => kw.includes(token))) {
      score += 14;
      tokenMatched = true;
    }

    if (subLower.includes(token)) {
      score += 10;
      tokenMatched = true;
    }

    if (!tokenMatched) {
      return 0;
    }
  }

  // Slight recency tie-breaker
  return score;
}

function parseBoundaryMs(isoDate: string | undefined, endOfDay: boolean): number | null {
  const clean = (isoDate || '').trim();
  if (!clean) return null;
  const parsed = Date.parse(endOfDay ? `${clean}T23:59:59.999Z` : `${clean}T00:00:00.000Z`);
  return Number.isFinite(parsed) ? parsed : null;
}

export function executeEnhancedSearch(
  items: SearchableItem[],
  options: SearchQueryOptions
): RankedSearchResult[] {
  const now = options.now ?? Date.now();
  const cleanQuery = (options.query || '').trim().toLowerCase();
  const tokens = cleanQuery.split(/\s+/).filter(Boolean);
  const targetTag = (options.tag || '').trim().toLowerCase();
  const minRating =
    typeof options.minRating === 'number' && options.minRating > 0
      ? options.minRating
      : 0;

  const windowMs =
    options.dateRange === 'all' ? null : DATE_WINDOW_MS[options.dateRange];
  const fromMs = parseBoundaryMs(options.dateFrom, false);
  const toMs = parseBoundaryMs(options.dateTo, true);

  const matched: RankedSearchResult[] = [];

  for (const item of items) {
    if (options.category !== 'all' && item.category !== options.category) {
      continue;
    }
    const itemDateMs = item.publishedIso
      ? parseBoundaryMs(item.publishedIso, false) ?? item.timestamp
      : item.timestamp;
    if (windowMs !== null && now - itemDateMs > windowMs) {
      continue;
    }
    if (fromMs !== null && itemDateMs < fromMs) {
      continue;
    }
    if (toMs !== null && itemDateMs > toMs) {
      continue;
    }
    if (targetTag && targetTag !== 'all') {
      const combinedTags = [...(item.tags || []), ...item.keywords].map((t) =>
        t.toLowerCase()
      );
      if (!combinedTags.some((t) => t === targetTag || t.includes(targetTag))) {
        continue;
      }
    }
    if (minRating > 0 && (item.ratingAvg ?? 0) < minRating) {
      continue;
    }

    const score = scoreItemMatch(item, tokens, cleanQuery);
    if (score <= 0) continue;

    matched.push({ item, score });
  }

  matched.sort((a, b) => {
    if (options.sortBy === 'date_desc') {
      return b.item.timestamp - a.item.timestamp || b.score - a.score;
    }
    if (options.sortBy === 'date_asc') {
      return a.item.timestamp - b.item.timestamp || b.score - a.score;
    }
    if (options.sortBy === 'rating_desc') {
      const diff = (b.item.ratingAvg ?? 0) - (a.item.ratingAvg ?? 0);
      if (diff !== 0) return diff;
      return (b.item.ratingCount ?? 0) - (a.item.ratingCount ?? 0) || b.score - a.score;
    }
    if (options.sortBy === 'title_asc') {
      return a.item.title.localeCompare(b.item.title, 'tr');
    }
    // relevance
    if (b.score !== a.score) return b.score - a.score;
    return b.item.timestamp - a.item.timestamp;
  });

  return matched;
}

export function extractAvailableTags(
  items: SearchableItem[],
  limit = 14
): string[] {
  const freq = new Map<string, { label: string; count: number }>();
  for (const item of items) {
    const rawTags = item.tags && item.tags.length > 0 ? item.tags : item.keywords.slice(0, 3);
    for (const raw of rawTags) {
      const clean = raw.trim();
      if (clean.length < 2) continue;
      const key = clean.toLowerCase();
      const existing = freq.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        freq.set(key, { label: clean, count: 1 });
      }
    }
  }
  return Array.from(freq.values())
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'tr'))
    .slice(0, limit)
    .map((entry) => entry.label);
}

export function buildSearchSuggestions(
  items: SearchableItem[],
  query: string,
  limit = 6
): SearchSuggestion[] {
  const clean = (query || '').trim().toLowerCase();

  if (!clean) {
    const popularSeeds: SearchSuggestion[] = [
      { text: 'Gemini 4 Carbon', category: 'model', matchCount: 1 },
      { text: 'Gemini 4 Neon', category: 'model', matchCount: 1 },
      { text: 'GitHub', category: 'action', matchCount: 1 },
      { text: 'Anket', category: 'community', matchCount: 1 },
      { text: 'Forum', category: 'community', matchCount: 1 },
      { text: 'SEO', category: 'community', matchCount: 1 },
    ];
    return popularSeeds.slice(0, limit);
  }

  const seen = new Map<string, SearchSuggestion>();

  for (const item of items) {
    const candidates = [item.title, ...(item.tags || []), ...item.keywords];
    for (const rawCand of candidates) {
      const cand = rawCand.trim();
      if (cand.length < 2) continue;
      const lower = cand.toLowerCase();
      if (!lower.includes(clean)) continue;
      if (lower === clean) continue;

      const key = lower;
      const existing = seen.get(key);
      if (existing) {
        existing.matchCount += 1;
      } else {
        seen.set(key, {
          text: cand.slice(0, 40),
          category: item.category,
          matchCount: 1,
        });
      }
    }
  }

  return Array.from(seen.values())
    .sort((a, b) => {
      const aStarts = a.text.toLowerCase().startsWith(clean) ? 1 : 0;
      const bStarts = b.text.toLowerCase().startsWith(clean) ? 1 : 0;
      if (bStarts !== aStarts) return bStarts - aStarts;
      return b.matchCount - a.matchCount || a.text.localeCompare(b.text, 'tr');
    })
    .slice(0, limit);
}

export interface MatchSegment {
  text: string;
  matched: boolean;
}

export function highlightMatchSegments(text: string, rawQuery: string): MatchSegment[] {
  const source = text || '';
  const tokens = Array.from(
    new Set(
      (rawQuery || '')
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length >= 2)
    )
  ).sort((a, b) => b.length - a.length);

  if (tokens.length === 0 || !source) {
    return [{ text: source, matched: false }];
  }

  const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = source.split(regex);
  const tokenSet = new Set(tokens);

  return parts
    .filter((p) => p.length > 0)
    .map((part) => ({
      text: part,
      matched: tokenSet.has(part.toLowerCase()),
    }));
}

