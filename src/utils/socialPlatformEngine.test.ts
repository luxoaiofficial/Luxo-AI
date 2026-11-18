import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendRoomMessage,
  buildGeneralFeedItems,
  buildMonthlyCalendarGrid,
  createGeneralFeedPost,
  createInitialSocialPlatformState,
  createPlatformAnnouncement,
  createPlatformEvent,
  createPrivateChatRoom,
  ensureUserInitializedInState,
  getOrCreateDirectMessageRoom,
  listVisibleRoomsForUser,
  mutateFriendship,
  toggleFavoriteItem,
  toggleFollowUser,
  upsertSocialProfile,
} from './socialPlatformEngine';

test('RBAC blocks non-admins from creating events and announcements, allows admins with validation', () => {
  const initial = createInitialSocialPlatformState();

  const deniedEvent = createPlatformEvent(initial, 'member', {
    title: 'Yetkisiz Etkinlik Denemesi',
    description: 'Üye rolüyle etkinlik oluşturma engellenmelidir.',
    category: 'Atölye (Workshop)',
    dateIso: '2026-11-15',
    startTime: '18:00',
    location: 'Çevrimiçi',
    createdByUid: 'user_1',
    createdByName: 'Üye',
  });
  assert.equal(deniedEvent.ok, false);
  if (!deniedEvent.ok) {
    assert.equal(deniedEvent.code, 'FORBIDDEN');
  }

  const invalidAdminEvent = createPlatformEvent(initial, 'admin', {
    title: 'Kısa',
    description: 'Geçerli uzunlukta açıklama metni.',
    category: 'Atölye (Workshop)',
    dateIso: '2026-11-15',
    startTime: '18:00',
    location: 'Çevrimiçi',
    createdByUid: 'admin_1',
    createdByName: 'Yönetici',
  });
  assert.equal(invalidAdminEvent.ok, false);

  const createdEvent = createPlatformEvent(initial, 'admin', {
    title: 'Aralık Bulut Mimarisi Çalıştayı',
    description:
      'Yüksek erişilebilirlikli çok bölgeli servis mimarisi ve gerçek zamanlı senkronizasyon oturumu.',
    category: 'Konferans & Zirve',
    dateIso: '2026-11-28',
    startTime: '19:00',
    endTime: '21:00',
    location: 'İstanbul & Canlı Yayın',
    speakerName: 'Selin Kaya',
    capacity: 300,
    createdByUid: 'admin_1',
    createdByName: 'Yönetici',
  });
  assert.equal(createdEvent.ok, true);
  if (createdEvent.ok) {
    assert.equal(createdEvent.state.events.length, initial.events.length + 1);
    assert.equal(createdEvent.event.dateIso, '2026-11-28');
  }

  const deniedAnn = createPlatformAnnouncement(initial, 'member', {
    title: 'Yetkisiz Duyuru Başlığı',
    summary: 'Üye rolü duyuru ekleyememelidir.',
    priority: 'Önemli',
    createdByUid: 'user_1',
    createdByName: 'Üye',
  });
  assert.equal(deniedAnn.ok, false);

  const createdAnn = createPlatformAnnouncement(initial, 'admin', {
    title: 'Yeni Özel Oda Şema Doğrulaması Aktif',
    summary:
      'Tüm özel sohbet odalarında üye sınırı ve gerçek zamanlı mesaj idempotency kontrolü devreye alındı.',
    priority: 'Önemli',
    pinned: true,
    createdByUid: 'admin_1',
    createdByName: 'Yönetici',
  });
  assert.equal(createdAnn.ok, true);
  if (createdAnn.ok) {
    assert.equal(createdAnn.state.announcements[0].id, createdAnn.announcement.id);
  }
});

test('Monthly calendar grid produces 42 cells (Monday-first) and maps November 2026 events accurately', () => {
  const initial = createInitialSocialPlatformState();
  // November 2026 -> monthZeroIndexed = 10
  const grid = buildMonthlyCalendarGrid(2026, 10, initial.events, '2026-11-02');
  assert.equal(grid.length, 42);
  // 2026-11-01 is a Sunday, so Monday-first grid starts on 2026-10-26 and index 6 is 2026-11-01
  assert.equal(grid[0].dateIso, '2026-10-26');
  assert.equal(grid[6].dateIso, '2026-11-01');
  assert.equal(grid[7].dateIso, '2026-11-02');
  assert.equal(grid[7].isToday, true);

  const nov6 = grid.find((c) => c.dateIso === '2026-11-06');
  assert.ok(nov6);
  assert.equal(nov6.events.length, 1);
  assert.equal(nov6.events[0].id, 'evt_nov_summit');
});

test('Favorites toggle idempotently for events and announcements per user', () => {
  let state = ensureUserInitializedInState(createInitialSocialPlatformState(), {
    uid: 'user_test',
    displayName: 'Deniz Aksoy',
  });

  const fav1 = toggleFavoriteItem(state, 'user_test', 'event', 'evt_nov_summit');
  assert.equal(fav1.favorited, true);
  assert.ok(fav1.state.graphs.user_test.favoriteEventIds.includes('evt_nov_summit'));

  const fav2 = toggleFavoriteItem(fav1.state, 'user_test', 'event', 'evt_nov_summit');
  assert.equal(fav2.favorited, false);
  assert.ok(!fav2.state.graphs.user_test.favoriteEventIds.includes('evt_nov_summit'));

  const annFav = toggleFavoriteItem(
    fav2.state,
    'user_test',
    'announcement',
    'ann_realtime_hub'
  );
  assert.equal(annFav.favorited, true);
  assert.ok(
    annFav.state.graphs.user_test.favoriteAnnouncementIds.includes('ann_realtime_hub')
  );
});

test('User profile upsert redacts PII, bounds interests to 10, and updates follow & friend graphs', () => {
  let state = ensureUserInitializedInState(createInitialSocialPlatformState(), {
    uid: 'user_alpha',
    displayName: 'Caner Özkan',
  });

  const updated = upsertSocialProfile(state, {
    uid: 'user_alpha',
    displayName: 'Caner Özkan',
    roleTitle: 'Kıdemli Yazılım Mühendisi',
    bio: 'İletişim için gizli@ornek.com yerine platform içi mesajlaşmayı kullanın.',
    interests: [
      'TypeScript',
      'Yapay Zeka',
      'TypeScript',
      'A1',
      'B2',
      'C3',
      'D4',
      'E5',
      'F6',
      'G7',
      'H8',
      'I9',
      'J10',
    ],
    avatarUrl: 'preset:mert',
  });

  assert.equal(updated.ok, true);
  if (!updated.ok) return;
  assert.ok(!updated.profile.bio.includes('gizli@ornek.com'));
  assert.ok(updated.profile.bio.includes('[e-posta gizlendi]'));
  assert.equal(updated.profile.interests.length, 10);
  assert.equal(updated.profile.avatarUrl, 'preset:mert');
  state = updated.state;

  // Toggle follow on member_kerem
  const followRes = toggleFollowUser(state, 'user_alpha', 'member_kerem');
  assert.equal(followRes.isFollowing, true);
  assert.ok(followRes.state.graphs.user_alpha.followingUids.includes('member_kerem'));
  assert.ok(followRes.state.graphs.member_kerem.followerUids.includes('user_alpha'));

  // Accept incoming seeded friend request from member_elif & add member_mert
  const acceptElif = mutateFriendship(
    followRes.state,
    'user_alpha',
    'member_elif',
    'accept'
  );
  assert.equal(acceptElif.isFriend, true);
  assert.ok(acceptElif.state.graphs.user_alpha.friendUids.includes('member_elif'));
  assert.ok(
    !acceptElif.state.graphs.user_alpha.incomingFriendRequests.includes('member_elif')
  );
});

test('Private chat rooms and 1:1 DMs enforce membership isolation and idempotent message delivery', () => {
  let state = ensureUserInitializedInState(createInitialSocialPlatformState(), {
    uid: 'user_owner',
    displayName: 'Zeynep Koç',
  });
  state = ensureUserInitializedInState(state, {
    uid: 'user_outsider',
    displayName: 'Dış Kullanıcı',
  });

  // Create private room with member_selin and member_mert
  const roomRes = createPrivateChatRoom(state, {
    name: 'Çekirdek Mimari Odası',
    topic: 'Sadece davetli üyeler için özel tasarım tartışması',
    roomType: 'private-room',
    ownerUid: 'user_owner',
    invitedMemberUids: ['member_selin', 'member_mert'],
  });
  assert.equal(roomRes.ok, true);
  if (!roomRes.ok) return;
  state = roomRes.state;

  // Visible to owner & invited member, invisible to outsider
  assert.ok(
    listVisibleRoomsForUser(state, 'user_owner').some((r) => r.id === roomRes.room.id)
  );
  assert.ok(
    listVisibleRoomsForUser(state, 'member_selin').some(
      (r) => r.id === roomRes.room.id
    )
  );
  assert.ok(
    !listVisibleRoomsForUser(state, 'user_outsider').some(
      (r) => r.id === roomRes.room.id
    )
  );

  // Outsider cannot post into private room
  const outsiderAttempt = appendRoomMessage(state, {
    roomId: roomRes.room.id,
    senderUid: 'user_outsider',
    content: 'İzinsiz mesaj girişimi',
  });
  assert.equal(outsiderAttempt.ok, false);
  if (!outsiderAttempt.ok) {
    assert.equal(outsiderAttempt.code, 'FORBIDDEN');
  }

  // Member posts idempotently
  const msg1 = appendRoomMessage(state, {
    id: 'msg_fixed_101',
    roomId: roomRes.room.id,
    senderUid: 'user_owner',
    content: 'Merhaba ekip, özel oda bağlantımız aktif.',
  });
  assert.equal(msg1.ok, true);
  if (!msg1.ok) return;
  const countAfterFirst = msg1.state.messagesByRoom[roomRes.room.id].length;

  const msgDuplicate = appendRoomMessage(msg1.state, {
    id: 'msg_fixed_101',
    roomId: roomRes.room.id,
    senderUid: 'user_owner',
    content: 'Merhaba ekip, özel oda bağlantımız aktif.',
  });
  assert.equal(msgDuplicate.ok, true);
  if (msgDuplicate.ok) {
    assert.equal(
      msgDuplicate.state.messagesByRoom[roomRes.room.id].length,
      countAfterFirst
    );
  }

  // Direct 1:1 room is deterministic regardless of participant order
  const dmA = getOrCreateDirectMessageRoom(
    msg1.state,
    'user_owner',
    'member_selin'
  );
  assert.equal(dmA.ok, true);
  if (!dmA.ok) return;
  const dmB = getOrCreateDirectMessageRoom(dmA.state, 'member_selin', 'user_owner');
  assert.equal(dmB.ok, true);
  if (dmB.ok) {
    assert.equal(dmA.room.id, dmB.room.id);
  }
});

test('createGeneralFeedPost enforces admin RBAC, validates title/date/description/eventType, and posts into buildGeneralFeedItems', () => {
  const initial = createInitialSocialPlatformState(1_793_635_200_000);

  const memberBlocked = createGeneralFeedPost(initial, 'member', {
    title: 'Yetkisiz Akış Paylaşımı',
    dateIso: '2026-11-24',
    description: 'Normal üye genel akışa yönetici formu ile içerik ekleyemez.',
    eventType: 'Konferans & Zirve',
    createdByUid: 'user_1',
    createdByName: 'Üye',
  });
  assert.equal(memberBlocked.ok, false);
  if (!memberBlocked.ok) {
    assert.equal(memberBlocked.code, 'FORBIDDEN');
  }

  const invalidDate = createGeneralFeedPost(initial, 'admin', {
    title: 'Geçerli Başlık Metni',
    dateIso: '',
    description: 'Geçerli uzunlukta açıklama metni girildi.',
    eventType: 'Atölye (Workshop)',
    createdByUid: 'admin_1',
    createdByName: 'Yönetici',
  });
  assert.equal(invalidDate.ok, false);

  const postedEvent = createGeneralFeedPost(
    initial,
    'admin',
    {
      title: 'Aralık Çoklu Model Sistem Tasarımı Zirvesi',
      dateIso: '2026-12-04',
      description:
        'Gerçek zamanlı model yönlendirme ve düşük gecikmeli doğrulama mimarileri üzerine canlı oturum.',
      eventType: 'Konferans & Zirve',
      createdByUid: 'admin_1',
      createdByName: 'Platform Yönetimi',
    },
    1_793_700_000_000
  );
  assert.equal(postedEvent.ok, true);
  if (!postedEvent.ok) return;

  const postedAnnouncement = createGeneralFeedPost(
    postedEvent.state,
    'admin',
    {
      title: 'Genel Akış ve Yönetici Yayın Aracı Devrede',
      dateIso: '2026-11-22',
      description:
        'Yetkili yöneticiler artık tek form üzerinden hem takvim etkinliği hem de resmi duyuru yayınlayabilir.',
      eventType: 'Resmi Duyuru · Önemli',
      createdByUid: 'admin_1',
      createdByName: 'Platform Yönetimi',
    },
    1_793_700_050_000
  );
  assert.equal(postedAnnouncement.ok, true);
  if (!postedAnnouncement.ok) return;

  const feed = buildGeneralFeedItems(
    postedAnnouncement.state.events,
    postedAnnouncement.state.announcements
  );
  assert.equal(feed[0].title, 'Genel Akış ve Yönetici Yayın Aracı Devrede');
  assert.equal(feed[0].dateIso, '2026-11-22');
  assert.equal(feed[1].title, 'Aralık Çoklu Model Sistem Tasarımı Zirvesi');
  assert.equal(feed[1].eventType, 'Konferans & Zirve');
});

