import test from 'node:test';
import assert from 'node:assert/strict';
import { searchSidebarChats } from './sidebarChatSearch';
import type { ChatThread } from '../types/luxo';

const SAMPLE_CHATS: ChatThread[] = [
  {
    id: 'chat-cache',
    title: 'Dağıtık Sistem Tasarımı',
    modelId: 'gemini-4-argon',
    createdAt: 1000,
    updatedAt: 2000,
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Redis singleflight stratejisi nasıl kurulur?',
        timestamp: 1000,
      },
      {
        id: 'm2',
        role: 'assistant',
        content:
          'İstek birleştirme (singleflight) önbellek izdihamını önlemek için aynı anahtara gelen eşzamanlı sorguları tek bir arka uç çağrısında birleştirir.',
        timestamp: 1500,
      },
    ],
  },
  {
    id: 'chat-sql',
    title: 'PostgreSQL İndeks Optimizasyonu',
    modelId: 'qwen-3-coder-plus',
    createdAt: 1200,
    updatedAt: 3000,
    messages: [
      {
        id: 'm3',
        role: 'user',
        content: 'B-Tree ve GIN indeksleri ne zaman tercih edilir?',
        timestamp: 1200,
      },
      {
        id: 'm4',
        role: 'assistant',
        content:
          'JSONB sütunlarında ve tam metin aramalarında GIN indeksi dramatik hız kazancı sağlar.',
        timestamp: 2500,
        comparisonResponses: [
          {
            modelId: 'claude-4-5-sonnet',
            content: 'Kısmi indeksler (partial index) yazma maliyetini düşürür.',
            isStreaming: false,
          },
        ],
      },
    ],
  },
];

test('searchSidebarChats returns all chats when query is empty', () => {
  const res = searchSidebarChats(SAMPLE_CHATS, '   ');
  assert.equal(res.length, 2);
});

test('searchSidebarChats matches inside past message content even when title does not match', () => {
  const res = searchSidebarChats(SAMPLE_CHATS, 'singleflight');
  assert.equal(res.length, 1);
  assert.equal(res[0].chat.id, 'chat-cache');
  assert.equal(res[0].matchedIn, 'message');
  assert.equal(res[0].matchCount, 2);
  assert.ok(res[0].snippet?.match.toLowerCase().includes('singleflight'));
});

test('searchSidebarChats matches Turkish characters diacritic-insensitively inside comparisonResponses', () => {
  const res = searchSidebarChats(SAMPLE_CHATS, 'kismi indeks');
  assert.equal(res.length, 1);
  assert.equal(res[0].chat.id, 'chat-sql');
  assert.equal(res[0].matchedIn, 'message');
  assert.ok(res[0].snippet?.before !== undefined);
});

test('searchSidebarChats prioritizes title hits ahead of body-only hits and filters mismatches', () => {
  const none = searchSidebarChats(SAMPLE_CHATS, 'tamamıyla_alakasız_token_xyz');
  assert.equal(none.length, 0);

  const sqlTitle = searchSidebarChats(SAMPLE_CHATS, 'PostgreSQL');
  assert.equal(sqlTitle.length, 1);
  assert.equal(sqlTitle[0].matchedIn, 'title');
});
