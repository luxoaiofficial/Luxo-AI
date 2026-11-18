import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applySharedCodeDelta,
  applySharedDocDelta,
  buildCollabRoomUrl,
  createInitialSharedCode,
  createInitialSharedDoc,
  DEFAULT_COLLAB_ROOM_ID,
  parseRoomIdFromSearch,
  pickParticipantColor,
  sanitizeCollabRoomId,
  upsertSharedMessage,
} from './collabState';
import { ChatMessage } from '../types/luxo';

test('sanitizeCollabRoomId normalizes Turkish characters and invalid symbols safely', () => {
  assert.equal(sanitizeCollabRoomId('  Ürün Tasarım Odası! 2026  '), 'urun-tasarim-odasi-2026');
  assert.equal(sanitizeCollabRoomId(''), DEFAULT_COLLAB_ROOM_ID);
  assert.equal(sanitizeCollabRoomId('!'), DEFAULT_COLLAB_ROOM_ID);
});

test('parseRoomIdFromSearch and buildCollabRoomUrl construct public shareable room links', () => {
  assert.equal(parseRoomIdFromSearch('?autostart=1&room=Ekip_Odasi'), 'ekip_odasi');
  assert.equal(parseRoomIdFromSearch('?autostart=1'), null);

  const url = buildCollabRoomUrl(
    'https://ais-dev-fudupxh6ld5rvvbfz5qwt4-705459740809.europe-west2.run.app/',
    'Mimarî Ekip'
  );
  assert.equal(
    url,
    'https://ais-pre-fudupxh6ld5rvvbfz5qwt4-705459740809.europe-west2.run.app/?autostart=1&room=mimari-ekip'
  );
});

test('applySharedDocDelta and applySharedCodeDelta increment version deterministically and skip no-op updates', () => {
  const doc0 = createInitialSharedDoc('ekip-1');
  const docNoOp = applySharedDocDelta(doc0, {
    title: doc0.title,
    content: doc0.content,
  });
  assert.equal(docNoOp.version, doc0.version);

  const doc1 = applySharedDocDelta(doc0, {
    title: 'Yeni Sprint Planı',
    content: 'İletişim gizli@gmail.com yerine ekip kanalı.',
    updatedBy: 'Murat',
    updatedByClientId: 'tab_1',
    updatedAt: 1700000000000,
  });
  assert.equal(doc1.version, doc0.version + 1);
  assert.equal(doc1.title, 'Yeni Sprint Planı');
  assert.equal(doc1.content.includes('@gmail.com'), false);
  assert.equal(doc1.updatedBy, 'Murat');

  const code0 = createInitialSharedCode();
  const codeNoOp = applySharedCodeDelta(code0, { html: code0.html });
  assert.equal(codeNoOp.version, code0.version);

  const code1 = applySharedCodeDelta(code0, {
    html: '<h1>Canlı Ortak Kod</h1>',
    updatedBy: 'Ayşe',
    updatedByClientId: 'tab_2',
  });
  assert.equal(code1.version, code0.version + 1);
  assert.equal(code1.html, '<h1>Canlı Ortak Kod</h1>');
});

test('upsertSharedMessage is idempotent on duplicate IDs and strips heavy inlineAttachment blobs', () => {
  const msg1: ChatMessage = {
    id: 'msg_101',
    role: 'user',
    content: 'Merhaba ekip',
    timestamp: 1000,
    inlineAttachment: {
      mimeType: 'image/png',
      data: 'base64blob',
      name: 'test.png',
    },
  };

  const list1 = upsertSharedMessage([], msg1);
  assert.equal(list1.length, 1);
  assert.equal(list1[0].inlineAttachment, undefined);

  // Re-applying updated streaming content with same ID updates in place without duplicating
  const list2 = upsertSharedMessage(list1, {
    ...msg1,
    content: 'Merhaba ekip (güncellendi)',
  });
  assert.equal(list2.length, 1);
  assert.equal(list2[0].content, 'Merhaba ekip (güncellendi)');

  assert.match(pickParticipantColor('tab_abc123'), /^#[0-9a-fA-F]{6}$/);
});
