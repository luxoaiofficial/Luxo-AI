import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildChatPdfDocumentModel,
  buildSafePdfFilename,
  generateChatPdfBlob,
  splitMarkdownForPdf,
} from './chatPdfExporter';
import type { ChatThread } from '../types/luxo';

test('buildSafePdfFilename transliterates Turkish characters cleanly and appends .pdf', () => {
  assert.equal(
    buildSafePdfFilename('Şehir Planlama & Öğrenci Başarı Analizi'),
    'Sehir_Planlama_Ogrenci_Basari_Analizi.pdf'
  );
  assert.equal(buildSafePdfFilename('   '), 'luxo_sohbet.pdf');
});

test('splitMarkdownForPdf separates prose paragraphs and fenced code blocks cleanly', () => {
  const blocks = splitMarkdownForPdf(
    'Önce mimariyi özetleyelim.\n\n```typescript\nconst ok = true;\n```\n\nSonraki adım.'
  );
  assert.equal(blocks.length, 3);
  assert.equal(blocks[0].kind, 'paragraph');
  assert.equal(blocks[1].kind, 'code');
  assert.equal(blocks[1].language, 'TYPESCRIPT');
  assert.ok(blocks[1].text.includes('const ok = true;'));
  assert.equal(blocks[2].kind, 'paragraph');
});

test('generateChatPdfBlob produces a real binary %PDF document blob for multi-turn chats', async () => {
  const sampleChat: ChatThread = {
    id: 'pdf-test-1',
    title: 'Örnek Türkçe Sohbet Dışa Aktarımı',
    modelId: 'gemini-4-hydrogen',
    createdAt: 1700000000000,
    updatedAt: 1700000005000,
    messages: [
      {
        id: 'u1',
        role: 'user',
        content: 'TypeScript ile hızlı bir LRU önbellek sınıfı yaz.',
        timestamp: 1700000000000,
      },
      {
        id: 'a1',
        role: 'assistant',
        content:
          'İşte üretim kalitesinde örnek:\n\n```ts\nexport class Cache { size = 0; }\n```',
        timestamp: 1700000004000,
        modelId: 'gemini-4-hydrogen',
      },
    ],
  };

  const model = buildChatPdfDocumentModel(sampleChat);
  assert.equal(model.filename, 'Ornek_Turkce_Sohbet_Disa_Aktarimi.pdf');
  assert.equal(model.turns.length, 2);

  const out = generateChatPdfBlob(sampleChat);
  assert.ok(out.filename.endsWith('.pdf'));
  assert.ok(out.pageCount >= 1);
  assert.ok(out.blob.size > 400);

  const headerBytes = new TextDecoder().decode(
    await out.blob.slice(0, 8).arrayBuffer()
  );
  assert.ok(headerBytes.startsWith('%PDF-'));
});
