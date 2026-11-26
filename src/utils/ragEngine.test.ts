import test from 'node:test';
import assert from 'node:assert/strict';
import {
  chunkTextWithOverlap,
  cosineSimilarity,
  formatRagContextBlock,
  searchKnowledgeChunks,
} from './ragEngine';

test('chunkTextWithOverlap splits long text with overlap without losing content', () => {
  const source = Array.from({ length: 25 }, (_, i) => `Sentence number ${i + 1} explains Luxo RAG architecture.`).join(' ');
  const chunks = chunkTextWithOverlap(source, { maxChars: 240, overlapChars: 50 });
  assert.ok(chunks.length >= 4);
  assert.ok(chunks[0].includes('Sentence number 1'));
  assert.ok(chunks[chunks.length - 1].includes('Sentence number 25'));
});

test('searchKnowledgeChunks ranks vector matches first and falls back to lexical cleanly', () => {
  const chunks = [
    {
      id: 'c1',
      docId: 'doc1',
      docTitle: 'Security Guide',
      chunkIndex: 0,
      text: 'Zero Cost Mode strictly blocks paid API calls on the server.',
      embedding: [0.9, 0.1, 0.0],
      tokenEstimate: 14,
    },
    {
      id: 'c2',
      docId: 'doc2',
      docTitle: 'UI Notes',
      chunkIndex: 0,
      text: 'Sidebar collapses smoothly on desktop and drawer on mobile.',
      embedding: [0.0, 0.2, 0.9],
      tokenEstimate: 12,
    },
  ];

  assert.ok(cosineSimilarity([1, 0, 0], [0.9, 0.1, 0]) > 0.9);

  const vecResults = searchKnowledgeChunks({
    queryText: 'zero cost paid',
    queryEmbedding: [0.95, 0.05, 0.0],
    chunks,
    topK: 2,
  });
  assert.equal(vecResults[0].docId, 'doc1');
  assert.equal(vecResults[0].matchMode, 'vector');

  const lexResults = searchKnowledgeChunks({
    queryText: 'mobile drawer',
    chunks,
    topK: 2,
  });
  assert.equal(lexResults[0].docId, 'doc2');
  assert.equal(lexResults[0].matchMode, 'lexical-fallback');

  const formatted = formatRagContextBlock(lexResults);
  assert.ok(formatted.includes('UI Notes'));
});
