import type { ChatThread } from '../types/luxo';
import { LUXO_MODELS, sanitizeLuxoBrand } from './luxoLogic';

export interface SidebarChatSearchResult {
  chat: ChatThread;
  matchedIn: 'title' | 'message' | 'model';
  matchCount: number;
  snippet?: {
    before: string;
    match: string;
    after: string;
    role: 'user' | 'assistant' | 'system';
  };
}

function foldForSearch(input: string): string {
  return (input || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/i̇/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

function countOccurrences(haystackLower: string, needleLower: string): number {
  if (!needleLower) return 0;
  let count = 0;
  let pos = 0;
  while (pos <= haystackLower.length - needleLower.length) {
    const found = haystackLower.indexOf(needleLower, pos);
    if (found === -1) break;
    count += 1;
    pos = found + needleLower.length;
  }
  return count;
}

function findBestMatchIndex(
  text: string,
  rawNeedleLower: string,
  foldedNeedle: string
): { index: number; length: number } | null {
  const lower = text.toLocaleLowerCase('tr-TR');
  const exactIdx = lower.indexOf(rawNeedleLower);
  if (exactIdx !== -1) {
    return { index: exactIdx, length: rawNeedleLower.length };
  }
  const foldedText = foldForSearch(text);
  const foldedIdx = foldedText.indexOf(foldedNeedle);
  if (foldedIdx !== -1) {
    return { index: foldedIdx, length: foldedNeedle.length };
  }
  return null;
}

function buildSnippet(
  rawText: string,
  matchIdx: number,
  matchLen: number,
  role: 'user' | 'assistant' | 'system'
): SidebarChatSearchResult['snippet'] {
  const normalized = sanitizeLuxoBrand(rawText).replace(/\s+/g, ' ').trim();
  if (!normalized) return undefined;

  const safeIdx = Math.max(0, Math.min(matchIdx, normalized.length - 1));
  const safeEnd = Math.min(normalized.length, safeIdx + Math.max(1, matchLen));
  const radiusBefore = 28;
  const radiusAfter = 56;
  const start = Math.max(0, safeIdx - radiusBefore);
  const end = Math.min(normalized.length, safeEnd + radiusAfter);

  const prefix = start > 0 ? '…' : '';
  const suffix = end < normalized.length ? '…' : '';

  return {
    before: `${prefix}${normalized.slice(start, safeIdx)}`,
    match: normalized.slice(safeIdx, safeEnd),
    after: `${normalized.slice(safeEnd, end)}${suffix}`,
    role,
  };
}

export function searchSidebarChats(
  chats: ChatThread[],
  rawQuery: string
): SidebarChatSearchResult[] {
  const query = (rawQuery || '').trim();
  if (!query) {
    return chats.map((chat) => ({
      chat,
      matchedIn: 'title',
      matchCount: 0,
    }));
  }

  const rawLower = query.toLocaleLowerCase('tr-TR');
  const foldedQuery = foldForSearch(query);
  const results: SidebarChatSearchResult[] = [];

  for (const chat of chats) {
    const cleanTitle = sanitizeLuxoBrand(chat.title || 'Sohbet');
    const titleHit = findBestMatchIndex(cleanTitle, rawLower, foldedQuery);
    const titleMatches = countOccurrences(
      foldForSearch(cleanTitle),
      foldedQuery
    );

    const modelName = LUXO_MODELS[chat.modelId]?.name || chat.modelId || '';
    const modelMatches = countOccurrences(foldForSearch(modelName), foldedQuery);

    let msgMatchesTotal = 0;
    let bestSnippet: SidebarChatSearchResult['snippet'] | undefined;

    for (const msg of chat.messages || []) {
      const cleanBody = sanitizeLuxoBrand(msg.content || '').replace(/\s+/g, ' ').trim();
      const bodyCount = countOccurrences(foldForSearch(cleanBody), foldedQuery);
      if (bodyCount > 0) {
        msgMatchesTotal += bodyCount;
        if (!bestSnippet) {
          const hit = findBestMatchIndex(cleanBody, rawLower, foldedQuery);
          if (hit) {
            bestSnippet = buildSnippet(cleanBody, hit.index, hit.length, msg.role);
          }
        }
      }

      if (msg.attachmentName) {
        const attCount = countOccurrences(
          foldForSearch(msg.attachmentName),
          foldedQuery
        );
        if (attCount > 0) {
          msgMatchesTotal += attCount;
          if (!bestSnippet) {
            const hit = findBestMatchIndex(
              msg.attachmentName,
              rawLower,
              foldedQuery
            );
            if (hit) {
              bestSnippet = buildSnippet(
                msg.attachmentName,
                hit.index,
                hit.length,
                msg.role
              );
            }
          }
        }
      }

      for (const cmp of msg.comparisonResponses || []) {
        const cleanCmp = sanitizeLuxoBrand(cmp.content || '')
          .replace(/\s+/g, ' ')
          .trim();
        const cmpCount = countOccurrences(foldForSearch(cleanCmp), foldedQuery);
        if (cmpCount > 0) {
          msgMatchesTotal += cmpCount;
          if (!bestSnippet) {
            const hit = findBestMatchIndex(cleanCmp, rawLower, foldedQuery);
            if (hit) {
              bestSnippet = buildSnippet(
                cleanCmp,
                hit.index,
                hit.length,
                'assistant'
              );
            }
          }
        }
      }
    }

    const totalMatches = titleMatches + msgMatchesTotal + modelMatches;
    if (totalMatches === 0 && !titleHit && !bestSnippet) {
      continue;
    }

    const matchedIn: SidebarChatSearchResult['matchedIn'] =
      titleHit || titleMatches > 0
        ? 'title'
        : msgMatchesTotal > 0 || bestSnippet
        ? 'message'
        : 'model';

    results.push({
      chat,
      matchedIn,
      matchCount: Math.max(1, totalMatches),
      snippet: bestSnippet,
    });
  }

  return results.sort((a, b) => {
    const scoreA =
      (a.matchedIn === 'title' ? 100 : a.matchedIn === 'message' ? 50 : 10) +
      a.matchCount;
    const scoreB =
      (b.matchedIn === 'title' ? 100 : b.matchedIn === 'message' ? 50 : 10) +
      b.matchCount;
    if (scoreA !== scoreB) return scoreB - scoreA;
    return (b.chat.updatedAt || 0) - (a.chat.updatedAt || 0);
  });
}
