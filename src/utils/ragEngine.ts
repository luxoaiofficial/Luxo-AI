export interface KnowledgeChunkRecord {
  id: string;
  docId: string;
  docTitle: string;
  chunkIndex: number;
  text: string;
  embedding?: number[];
  tokenEstimate: number;
}

export interface KnowledgeSearchResult {
  chunkId: string;
  docId: string;
  docTitle: string;
  chunkIndex: number;
  text: string;
  score: number;
  matchMode: 'vector' | 'lexical-fallback';
}

export function normalizeDocumentText(raw: string): string {
  return String(raw || '')
    .replace(/\r\n/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function chunkTextWithOverlap(
  text: string,
  options: { maxChars?: number; overlapChars?: number } = {}
): string[] {
  const maxChars = Math.max(200, Math.min(4000, options.maxChars ?? 900));
  const overlapChars = Math.max(0, Math.min(Math.floor(maxChars / 2), options.overlapChars ?? 160));
  const clean = normalizeDocumentText(text);
  if (!clean) return [];
  if (clean.length <= maxChars) return [clean];

  const chunks: string[] = [];
  let cursor = 0;

  while (cursor < clean.length) {
    let end = Math.min(clean.length, cursor + maxChars);
    if (end < clean.length) {
      const slice = clean.slice(cursor, end);
      const lastParagraph = slice.lastIndexOf('\n\n');
      const lastPeriod = slice.lastIndexOf('. ');
      const lastSpace = slice.lastIndexOf(' ');
      if (lastParagraph > maxChars * 0.45) {
        end = cursor + lastParagraph + 2;
      } else if (lastPeriod > maxChars * 0.55) {
        end = cursor + lastPeriod + 2;
      } else if (lastSpace > maxChars * 0.65) {
        end = cursor + lastSpace + 1;
      }
    }

    const piece = clean.slice(cursor, end).trim();
    if (piece) {
      chunks.push(piece);
    }

    if (end >= clean.length) break;
    const nextCursor = Math.max(cursor + 1, end - overlapChars);
    cursor = nextCursor;
  }

  return chunks;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || a.length !== b.length) {
    return 0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    const va = a[i];
    const vb = b[i];
    dot += va * vb;
    normA += va * va;
    normB += vb * vb;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function tokenizeWords(input: string): string[] {
  return String(input || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

export function lexicalSimilarityScore(queryText: string, chunkText: string): number {
  const qTokens = Array.from(new Set(tokenizeWords(queryText)));
  if (qTokens.length === 0) return 0;
  const chunkLower = chunkText.toLowerCase();
  const cTokens = tokenizeWords(chunkText);
  if (cTokens.length === 0) return 0;

  let hitScore = 0;
  for (const qt of qTokens) {
    let tf = 0;
    for (const ct of cTokens) {
      if (ct === qt) tf += 1;
      else if (ct.includes(qt) || qt.includes(ct)) tf += 0.45;
    }
    if (tf > 0) {
      hitScore += (tf * 1.8) / (tf + 0.8);
    }
  }

  const phraseBonus = chunkLower.includes(queryText.trim().toLowerCase()) ? 0.35 : 0;
  return Math.min(1, hitScore / qTokens.length + phraseBonus);
}

export function searchKnowledgeChunks(params: {
  queryText: string;
  queryEmbedding?: number[];
  chunks: KnowledgeChunkRecord[];
  docIdsFilter?: string[];
  topK?: number;
}): KnowledgeSearchResult[] {
  const topK = Math.max(1, Math.min(12, params.topK ?? 4));
  const filterSet =
    params.docIdsFilter && params.docIdsFilter.length > 0
      ? new Set(params.docIdsFilter)
      : null;

  const candidates = filterSet
    ? params.chunks.filter((c) => filterSet.has(c.docId))
    : params.chunks;

  const scored: KnowledgeSearchResult[] = candidates
    .map((chunk) => {
      const canVector =
        Array.isArray(params.queryEmbedding) &&
        params.queryEmbedding.length > 0 &&
        Array.isArray(chunk.embedding) &&
        chunk.embedding.length === params.queryEmbedding.length;

      const lexScore = lexicalSimilarityScore(params.queryText, chunk.text);
      if (canVector) {
        const vecScore = cosineSimilarity(params.queryEmbedding!, chunk.embedding!);
        const combined = Math.max(0, vecScore * 0.85 + lexScore * 0.15);
        return {
          chunkId: chunk.id,
          docId: chunk.docId,
          docTitle: chunk.docTitle,
          chunkIndex: chunk.chunkIndex,
          text: chunk.text,
          score: Number(combined.toFixed(4)),
          matchMode: 'vector' as const,
        };
      }

      return {
        chunkId: chunk.id,
        docId: chunk.docId,
        docTitle: chunk.docTitle,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        score: Number(lexScore.toFixed(4)),
        matchMode: 'lexical-fallback' as const,
      };
    })
    .filter((item) => item.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}

export function formatRagContextBlock(results: KnowledgeSearchResult[]): string {
  if (!results || results.length === 0) return '';
  const blocks = results.map(
    (r, idx) =>
      `[Source ${idx + 1}: ${r.docTitle} · Chunk #${r.chunkIndex + 1} · Relevance ${Math.round(
        r.score * 100
      )}%]\n${r.text}`
  );
  return `Grounded Knowledge Base Context (cite the source title when using facts from these excerpts):\n\n${blocks.join(
    '\n\n---\n\n'
  )}`;
}
