export type PlatformUserRole = 'member' | 'admin';

export type EventCategory =
  | 'Konferans & Zirve'
  | 'Atölye (Workshop)'
  | 'Topluluk Buluşması'
  | 'Canlı Yayın & Lansman';

export type AnnouncementPriority = 'Önemli' | 'Güncelleme' | 'Topluluk';

export type SocialRoomType = 'direct' | 'private-room' | 'public-room';

export interface PlatformEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  dateIso: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location: string;
  speakerName: string;
  capacity: number;
  createdByUid: string;
  createdByName: string;
  status: 'published' | 'archived';
  createdAt: number;
}

export type FeedContentType =
  | EventCategory
  | 'Resmi Duyuru · Önemli'
  | 'Platform Güncellemesi'
  | 'Topluluk Duyurusu';

export interface PlatformAnnouncement {
  id: string;
  title: string;
  summary: string;
  priority: AnnouncementPriority;
  tag: string;
  pinned: boolean;
  dateIso?: string; // YYYY-MM-DD
  createdByUid: string;
  createdByName: string;
  status: 'published' | 'archived';
  createdAt: number;
}

export interface GeneralFeedItem {
  id: string;
  kind: 'event' | 'announcement';
  title: string;
  dateIso: string;
  eventType: string;
  description: string;
  secondaryMeta: string;
  pinned: boolean;
  createdByName: string;
  createdAt: number;
}

export interface SocialUserProfile {
  uid: string;
  displayName: string;
  handle: string;
  roleTitle: string;
  bio: string;
  interests: string[];
  avatarUrl: string;
  avatarInitials: string;
  isOnline: boolean;
  updatedAt: number;
}

export interface UserSocialGraph {
  followingUids: string[];
  followerUids: string[];
  friendUids: string[];
  incomingFriendRequests: string[];
  outgoingFriendRequests: string[];
  favoriteEventIds: string[];
  favoriteAnnouncementIds: string[];
}

export interface SocialChatRoom {
  id: string;
  name: string;
  topic: string;
  roomType: SocialRoomType;
  ownerUid: string;
  memberUids: string[];
  createdAt: number;
  updatedAt: number;
}

export interface SocialRoomMessage {
  id: string;
  roomId: string;
  senderUid: string;
  senderName: string;
  senderAvatarUrl: string;
  content: string;
  createdAt: number;
}

export interface SocialPlatformState {
  events: PlatformEvent[];
  announcements: PlatformAnnouncement[];
  profiles: Record<string, SocialUserProfile>;
  graphs: Record<string, UserSocialGraph>;
  rooms: SocialChatRoom[];
  messagesByRoom: Record<string, SocialRoomMessage[]>;
  lastUpdatedAt: number;
}

export interface CalendarDayCell {
  dateIso: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  events: PlatformEvent[];
}

export const EVENT_CATEGORIES: readonly EventCategory[] = [
  'Konferans & Zirve',
  'Atölye (Workshop)',
  'Topluluk Buluşması',
  'Canlı Yayın & Lansman',
];

export const ANNOUNCEMENT_PRIORITIES: readonly AnnouncementPriority[] = [
  'Önemli',
  'Güncelleme',
  'Topluluk',
];

export const FEED_CONTENT_TYPES: readonly {
  value: FeedContentType;
  label: string;
  kind: 'event' | 'announcement';
}[] = [
  {
    value: 'Konferans & Zirve',
    label: 'Etkinlik · Konferans & Zirve',
    kind: 'event',
  },
  {
    value: 'Atölye (Workshop)',
    label: 'Etkinlik · Atölye (Workshop)',
    kind: 'event',
  },
  {
    value: 'Topluluk Buluşması',
    label: 'Etkinlik · Topluluk Buluşması',
    kind: 'event',
  },
  {
    value: 'Canlı Yayın & Lansman',
    label: 'Etkinlik · Canlı Yayın & Lansman',
    kind: 'event',
  },
  {
    value: 'Resmi Duyuru · Önemli',
    label: 'Duyuru · Resmi & Önemli Duyuru',
    kind: 'announcement',
  },
  {
    value: 'Platform Güncellemesi',
    label: 'Duyuru · Platform Güncellemesi',
    kind: 'announcement',
  },
  {
    value: 'Topluluk Duyurusu',
    label: 'Duyuru · Topluluk Duyurusu',
    kind: 'announcement',
  },
];

export const SUGGESTED_INTEREST_TAGS: readonly string[] = [
  'Yapay Zeka',
  'TypeScript',
  'Dağıtık Sistemler',
  'UI/UX Tasarım',
  'Sinematik Video',
  'Web Performansı',
  'Açık Kaynak',
  'Veri Bilimi',
  'Siber Güvenlik',
  'Mobil Mimari',
];

const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]+$/;
const DATE_ISO_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const TIME_HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export function sanitizePlatformId(raw: string, fallbackPrefix = 'usr'): string {
  const cleaned = String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 96);
  if (cleaned.length >= 2 && SAFE_ID_REGEX.test(cleaned)) {
    return cleaned;
  }
  return `${fallbackPrefix}_${Date.now()}`;
}

export function normalizeHandle(raw: string, fallbackName = 'kullanici'): string {
  const source = (raw || fallbackName)
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9_]/g, '');
  const trimmed = source.slice(0, 24);
  return trimmed.length >= 3 ? trimmed : `${trimmed || 'uye'}_luxo`.slice(0, 24);
}

export function computeInitials(name: string): string {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'LX';
  const joined = parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
  return (joined || 'LX').slice(0, 4);
}

export function redactSocialTextPii(text: string): string {
  return String(text || '')
    .replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      '[e-posta gizlendi]'
    )
    .replace(
      /\b(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)\d{3}[\s-]?\d{2}[\s-]?\d{2}\b/g,
      '[telefon gizlendi]'
    )
    .trim();
}

export function createEmptyGraph(): UserSocialGraph {
  return {
    followingUids: [],
    followerUids: [],
    friendUids: [],
    incomingFriendRequests: [],
    outgoingFriendRequests: [],
    favoriteEventIds: [],
    favoriteAnnouncementIds: [],
  };
}

function uniqueStrings(items: readonly string[], maxLen = 200): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const v = String(item || '').trim();
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
    if (out.length >= maxLen) break;
  }
  return out;
}

export function createInitialSocialPlatformState(
  now = 1793635200000 // 2026-11-02 UTC anchor
): SocialPlatformState {
  const profiles: Record<string, SocialUserProfile> = {
    member_selin: {
      uid: 'member_selin',
      displayName: 'Selin Kaya',
      handle: 'selin_kaya',
      roleTitle: 'Baş Sistem Mimarı',
      bio: 'Gerçek zamanlı dağıtık sistemler, düşük gecikmeli WebSocket ağları ve yüksek erişilebilirlikli bulut mimarileri üzerine çalışıyorum.',
      interests: ['Dağıtık Sistemler', 'TypeScript', 'Web Performansı', 'Yapay Zeka'],
      avatarUrl: 'preset:selin',
      avatarInitials: 'SK',
      isOnline: true,
      updatedAt: now - 3600_000,
    },
    member_mert: {
      uid: 'member_mert',
      displayName: 'Mert Demir',
      handle: 'mert_demir',
      roleTitle: 'Kıdemli Yapay Zeka Mühendisi',
      bio: 'Çoklu model yönlendirme, sembolik doğrulama katmanları ve üretim ortamında model kalibrasyonu geliştiriyorum.',
      interests: ['Yapay Zeka', 'Veri Bilimi', 'Açık Kaynak', 'TypeScript'],
      avatarUrl: 'preset:mert',
      avatarInitials: 'MD',
      isOnline: true,
      updatedAt: now - 7200_000,
    },
    member_elif: {
      uid: 'member_elif',
      displayName: 'Elif Yılmaz',
      handle: 'elif_yilmaz',
      roleTitle: 'Ürün ve Etkileşim Tasarımcısı',
      bio: 'Erişilebilirlik odaklı tasarım sistemleri, tipografik hiyerarşi ve karmaşık veri arayüzlerinin sadeleştirilmesiyle ilgileniyorum.',
      interests: ['UI/UX Tasarım', 'Sinematik Video', 'Web Performansı'],
      avatarUrl: 'preset:elif',
      avatarInitials: 'EY',
      isOnline: false,
      updatedAt: now - 10800_000,
    },
    member_kerem: {
      uid: 'member_kerem',
      displayName: 'Kerem Aydın',
      handle: 'kerem_aydin',
      roleTitle: 'Güvenlik ve Altyapı Araştırmacısı',
      bio: 'Sıfır güven erişim kuralları, uçtan uca şema doğrulama ve yüksek trafikli servislerde önbellek stratejileri tasarlıyorum.',
      interests: ['Siber Güvenlik', 'Dağıtık Sistemler', 'Açık Kaynak'],
      avatarUrl: 'preset:kerem',
      avatarInitials: 'KA',
      isOnline: true,
      updatedAt: now - 14400_000,
    },
  };

  const graphs: Record<string, UserSocialGraph> = {
    member_selin: {
      followingUids: ['member_mert', 'member_elif'],
      followerUids: ['member_mert', 'member_kerem'],
      friendUids: ['member_mert'],
      incomingFriendRequests: [],
      outgoingFriendRequests: [],
      favoriteEventIds: ['evt_nov_summit'],
      favoriteAnnouncementIds: ['ann_realtime_hub'],
    },
    member_mert: {
      followingUids: ['member_selin', 'member_kerem'],
      followerUids: ['member_selin'],
      friendUids: ['member_selin'],
      incomingFriendRequests: [],
      outgoingFriendRequests: [],
      favoriteEventIds: ['evt_workshop_ts'],
      favoriteAnnouncementIds: [],
    },
    member_elif: {
      followingUids: ['member_selin'],
      followerUids: ['member_selin'],
      friendUids: [],
      incomingFriendRequests: [],
      outgoingFriendRequests: [],
      favoriteEventIds: ['evt_design_critique'],
      favoriteAnnouncementIds: ['ann_calendar_launch'],
    },
    member_kerem: {
      followingUids: ['member_selin'],
      followerUids: ['member_mert'],
      friendUids: [],
      incomingFriendRequests: [],
      outgoingFriendRequests: [],
      favoriteEventIds: [],
      favoriteAnnouncementIds: [],
    },
  };

  const events: PlatformEvent[] = [
    {
      id: 'evt_nov_summit',
      title: 'Luxo AI Sistem Mimarisi ve Çoklu Model Zirvesi',
      description:
        '112 model yönlendirme katmanı, deterministik doğrulama ve düşük gecikmeli akış mimarisinin canlı demolarla inceleneceği teknik zirve.',
      category: 'Konferans & Zirve',
      dateIso: '2026-11-06',
      startTime: '19:00',
      endTime: '21:00',
      location: 'Çevrimiçi Canlı Yayın · Ana Sahne',
      speakerName: 'Selin Kaya & Mert Demir',
      capacity: 450,
      createdByUid: 'member_selin',
      createdByName: 'Selin Kaya',
      status: 'published',
      createdAt: now - 86_400_000 * 3,
    },
    {
      id: 'evt_workshop_ts',
      title: 'Uygulamalı Gerçek Zamanlı WebSocket ve Güvenlik Kuralları Atölyesi',
      description:
        'Çok kullanıcılı sohbet odalarında sunucu otoriteli durum yönetimi, idempotent olay işleme ve sıfır güven şema doğrulaması atölyesi.',
      category: 'Atölye (Workshop)',
      dateIso: '2026-11-12',
      startTime: '18:30',
      endTime: '20:30',
      location: 'İstanbul Levent Mühendislik Stüdyosu & Hibrit',
      speakerName: 'Kerem Aydın',
      capacity: 120,
      createdByUid: 'member_kerem',
      createdByName: 'Kerem Aydın',
      status: 'published',
      createdAt: now - 86_400_000 * 2,
    },
    {
      id: 'evt_design_critique',
      title: 'Arayüz Hiyerarşisi, Tipografi ve Erişilebilirlik Buluşması',
      description:
        'Veri yoğun üretkenlik uygulamalarında bilişsel yükü azaltma, klavye navigasyonu ve kontrast kalibrasyonu üzerine interaktif oturum.',
      category: 'Topluluk Buluşması',
      dateIso: '2026-11-19',
      startTime: '20:00',
      endTime: '21:30',
      location: 'Çevrimiçi Tasarım Odası',
      speakerName: 'Elif Yılmaz',
      capacity: 200,
      createdByUid: 'member_elif',
      createdByName: 'Elif Yılmaz',
      status: 'published',
      createdAt: now - 86_400_000,
    },
    {
      id: 'evt_veo_cinema',
      title: '4K Sinematik Video ve Kamera Hareketi Lansmanı',
      description:
        'Kamera hızı, yatay pan ve dikey tilt parametreleriyle sahne kompozisyonu oluşturma teknikleri ve topluluk gösterimi.',
      category: 'Canlı Yayın & Lansman',
      dateIso: '2026-11-26',
      startTime: '19:30',
      endTime: '21:00',
      location: 'Çevrimiçi Stüdyo Yayını',
      speakerName: 'Mert Demir',
      capacity: 600,
      createdByUid: 'member_mert',
      createdByName: 'Mert Demir',
      status: 'published',
      createdAt: now - 43_200_000,
    },
  ];

  const announcements: PlatformAnnouncement[] = [
    {
      id: 'ann_realtime_hub',
      title: 'Özel Sohbet Odaları, Arkadaş Listesi ve Kullanıcı Profilleri Yayında',
      summary:
        'Artık profilinizi biyografi, ilgi alanları ve stüdyo portreleriyle özelleştirebilir, üyeleri takip edebilir ve arkadaşlarınızla özel sohbet odaları kurabilirsiniz.',
      priority: 'Önemli',
      tag: 'Platform Sürümü',
      pinned: true,
      createdByUid: 'member_selin',
      createdByName: 'Platform Yönetimi',
      status: 'published',
      createdAt: now - 7_200_000,
    },
    {
      id: 'ann_calendar_launch',
      title: 'Kasım 2026 Teknik Atölye ve Topluluk Takvimi Açıldı',
      summary:
        'Kasım ayı boyunca gerçekleşecek tüm mimari zirveleri, tasarım buluşmalarını ve atölyeleri takvim üzerinden inceleyip favorilerinize kaydedebilirsiniz.',
      priority: 'Güncelleme',
      tag: 'Etkinlik Takvimi',
      pinned: false,
      createdByUid: 'member_elif',
      createdByName: 'Etkinlik Ekibi',
      status: 'published',
      createdAt: now - 28_800_000,
    },
    {
      id: 'ann_brotli_perf',
      title: 'Brotli Sıkıştırma ve Önbellek Katmanı Güncellemesi Tamamlandı',
      summary:
        'Statik varlık önbellekleme politikası ve dinamik yanıt sıkıştırması ile ilk yükleme boyutu %79.5 oranında düşürüldü.',
      priority: 'Topluluk',
      tag: 'Altyapı',
      pinned: false,
      createdByUid: 'member_kerem',
      createdByName: 'Altyapı Ekibi',
      status: 'published',
      createdAt: now - 64_800_000,
    },
  ];

  const rooms: SocialChatRoom[] = [
    {
      id: 'room_general_engineering',
      name: 'Genel Mühendislik & Mimari',
      topic: 'Sistem tasarımı, performans ve açık teknik paylaşımlar',
      roomType: 'public-room',
      ownerUid: 'member_selin',
      memberUids: ['member_selin', 'member_mert', 'member_elif', 'member_kerem'],
      createdAt: now - 86_400_000 * 4,
      updatedAt: now - 1_800_000,
    },
    {
      id: 'room_design_cinema',
      name: 'Tasarım & Görsel Sentez',
      topic: 'Arayüz tipografisi, 4K sahne üretimi ve kullanıcı deneyimi',
      roomType: 'public-room',
      ownerUid: 'member_elif',
      memberUids: ['member_elif', 'member_selin', 'member_mert'],
      createdAt: now - 86_400_000 * 2,
      updatedAt: now - 3_600_000,
    },
  ];

  const messagesByRoom: Record<string, SocialRoomMessage[]> = {
    room_general_engineering: [
      {
        id: 'msg_seed_1',
        roomId: 'room_general_engineering',
        senderUid: 'member_selin',
        senderName: 'Selin Kaya',
        senderAvatarUrl: 'preset:selin',
        content:
          'Hoş geldiniz! 6 Kasım zirvesi öncesinde gerçek zamanlı oda senkronizasyonu ve önbellek katmanı notlarını burada paylaşıyoruz.',
        createdAt: now - 3_600_000,
      },
      {
        id: 'msg_seed_2',
        roomId: 'room_general_engineering',
        senderUid: 'member_mert',
        senderName: 'Mert Demir',
        senderAvatarUrl: 'preset:mert',
        content:
          'Özel bir çalışma konusu için sol panelden arkadaşlarınızı davet ederek doğrudan özel sohbet odası da açabilirsiniz.',
        createdAt: now - 1_800_000,
      },
    ],
    room_design_cinema: [
      {
        id: 'msg_seed_3',
        roomId: 'room_design_cinema',
        senderUid: 'member_elif',
        senderName: 'Elif Yılmaz',
        senderAvatarUrl: 'preset:elif',
        content:
          'Yeni takvim ve profil kartlarında tekil yüzey derinliği ile okunabilirliği test ettik; geri bildirimlerinizi bekliyorum.',
        createdAt: now - 3_600_000,
      },
    ],
  };

  return {
    events,
    announcements,
    profiles,
    graphs,
    rooms,
    messagesByRoom,
    lastUpdatedAt: now,
  };
}

export function hydrateSocialPlatformState(
  raw: Partial<SocialPlatformState> | null | undefined
): SocialPlatformState {
  const fallback = createInitialSocialPlatformState();
  if (!raw || typeof raw !== 'object') return fallback;
  return {
    events:
      Array.isArray(raw.events) && raw.events.length > 0
        ? raw.events
        : fallback.events,
    announcements:
      Array.isArray(raw.announcements) && raw.announcements.length > 0
        ? raw.announcements
        : fallback.announcements,
    profiles:
      raw.profiles && typeof raw.profiles === 'object'
        ? { ...fallback.profiles, ...raw.profiles }
        : fallback.profiles,
    graphs:
      raw.graphs && typeof raw.graphs === 'object'
        ? { ...fallback.graphs, ...raw.graphs }
        : fallback.graphs,
    rooms:
      Array.isArray(raw.rooms) && raw.rooms.length > 0 ? raw.rooms : fallback.rooms,
    messagesByRoom:
      raw.messagesByRoom && typeof raw.messagesByRoom === 'object'
        ? { ...fallback.messagesByRoom, ...raw.messagesByRoom }
        : fallback.messagesByRoom,
    lastUpdatedAt:
      typeof raw.lastUpdatedAt === 'number' ? raw.lastUpdatedAt : Date.now(),
  };
}

export function ensureUserInitializedInState(
  state: SocialPlatformState,
  input: {
    uid: string;
    displayName: string;
    avatarUrl?: string;
  },
  now = Date.now()
): SocialPlatformState {
  const uid = sanitizePlatformId(input.uid, 'usr');
  const existingProfile = state.profiles[uid];
  const existingGraph = state.graphs[uid];

  if (existingProfile && existingGraph) {
    return state;
  }

  const cleanName =
    redactSocialTextPii(input.displayName || 'Topluluk Üyesi').slice(0, 80) ||
    'Topluluk Üyesi';

  const nextProfile: SocialUserProfile = existingProfile || {
    uid,
    displayName: cleanName,
    handle: normalizeHandle(cleanName),
    roleTitle: 'Ürün & Yazılım Geliştirici',
    bio: 'Yapay zeka sistemleri, gerçek zamanlı web mimarisi ve ürün geliştirme üzerine çalışıyorum.',
    interests: ['Yapay Zeka', 'TypeScript', 'UI/UX Tasarım'],
    avatarUrl: input.avatarUrl || 'preset:selin',
    avatarInitials: computeInitials(cleanName),
    isOnline: true,
    updatedAt: now,
  };

  // Seed 1 mutual friend (Selin) + 1 incoming friend request (Elif) so friend list & incoming request acceptance work out-of-the-box
  const nextGraph: UserSocialGraph = existingGraph || {
    followingUids: ['member_selin'],
    followerUids: ['member_selin', 'member_elif'],
    friendUids: ['member_selin'],
    incomingFriendRequests: ['member_elif'],
    outgoingFriendRequests: [],
    favoriteEventIds: [],
    favoriteAnnouncementIds: [],
  };

  const selinGraph = state.graphs.member_selin || createEmptyGraph();
  const updatedSelinGraph: UserSocialGraph = {
    ...selinGraph,
    friendUids: uniqueStrings([...selinGraph.friendUids, uid]),
    followerUids: uniqueStrings([...selinGraph.followerUids, uid]),
    followingUids: uniqueStrings([...selinGraph.followingUids, uid]),
  };

  return {
    ...state,
    profiles: {
      ...state.profiles,
      [uid]: nextProfile,
    },
    graphs: {
      ...state.graphs,
      [uid]: nextGraph,
      member_selin: updatedSelinGraph,
    },
    lastUpdatedAt: now,
  };
}

export function buildMonthlyCalendarGrid(
  year: number,
  monthZeroIndexed: number,
  events: readonly PlatformEvent[],
  todayIso = '2026-11-02'
): CalendarDayCell[] {
  const firstOfMonth = new Date(Date.UTC(year, monthZeroIndexed, 1));
  // Convert Sunday=0..Saturday=6 into Monday=0..Sunday=6
  const startWeekdayMondayFirst = (firstOfMonth.getUTCDay() + 6) % 7;
  const gridStartDate = new Date(
    Date.UTC(year, monthZeroIndexed, 1 - startWeekdayMondayFirst)
  );

  const eventsByDate = new Map<string, PlatformEvent[]>();
  for (const ev of events) {
    if (ev.status !== 'published') continue;
    const bucket = eventsByDate.get(ev.dateIso) || [];
    bucket.push(ev);
    eventsByDate.set(ev.dateIso, bucket);
  }
  for (const list of eventsByDate.values()) {
    list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  const cells: CalendarDayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(
      Date.UTC(
        gridStartDate.getUTCFullYear(),
        gridStartDate.getUTCMonth(),
        gridStartDate.getUTCDate() + i
      )
    );
    const yyyy = cellDate.getUTCFullYear();
    const mm = String(cellDate.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(cellDate.getUTCDate()).padStart(2, '0');
    const dateIso = `${yyyy}-${mm}-${dd}`;
    cells.push({
      dateIso,
      dayNumber: cellDate.getUTCDate(),
      inCurrentMonth:
        cellDate.getUTCFullYear() === year &&
        cellDate.getUTCMonth() === monthZeroIndexed,
      isToday: dateIso === todayIso,
      events: eventsByDate.get(dateIso) || [],
    });
  }
  return cells;
}

export function createPlatformEvent(
  state: SocialPlatformState,
  actorRole: PlatformUserRole,
  input: {
    title: string;
    description: string;
    category: EventCategory;
    dateIso: string;
    startTime: string;
    endTime?: string;
    location: string;
    speakerName?: string;
    capacity?: number;
    createdByUid: string;
    createdByName: string;
  },
  now = Date.now()
):
  | { ok: true; state: SocialPlatformState; event: PlatformEvent }
  | { ok: false; code: 'FORBIDDEN' | 'VALIDATION'; error: string } {
  if (actorRole !== 'admin') {
    return {
      ok: false,
      code: 'FORBIDDEN',
      error: 'Yalnızca yöneticiler yeni etkinlik ekleyebilir.',
    };
  }

  const title = redactSocialTextPii(input.title);
  const description = redactSocialTextPii(input.description);
  const location = redactSocialTextPii(input.location);
  const speakerName =
    redactSocialTextPii(input.speakerName || input.createdByName || 'Platform Ekibi') ||
    'Platform Ekibi';
  const dateIso = String(input.dateIso || '').trim();
  const startTime = String(input.startTime || '').trim();
  const endTime = String(input.endTime || '20:30').trim();

  if (title.length < 5) {
    return {
      ok: false,
      code: 'VALIDATION',
      error: 'Etkinlik başlığı en az 5 karakter olmalıdır.',
    };
  }
  if (description.length < 12) {
    return {
      ok: false,
      code: 'VALIDATION',
      error: 'Etkinlik açıklaması en az 12 karakter olmalıdır.',
    };
  }
  if (!DATE_ISO_REGEX.test(dateIso)) {
    return {
      ok: false,
      code: 'VALIDATION',
      error: 'Geçerli bir etkinlik tarihi (YYYY-AA-GG) seçiniz.',
    };
  }
  if (!TIME_HHMM_REGEX.test(startTime)) {
    return {
      ok: false,
      code: 'VALIDATION',
      error: 'Geçerli bir başlangıç saati (SS:DD) giriniz.',
    };
  }
  if (location.length < 3) {
    return {
      ok: false,
      code: 'VALIDATION',
      error: 'Etkinlik konumu veya yayın bağlantısı en az 3 karakter olmalıdır.',
    };
  }

  const category: EventCategory = EVENT_CATEGORIES.includes(input.category)
    ? input.category
    : 'Konferans & Zirve';

  const capacityRaw = Number(input.capacity ?? 150);
  const capacity = Number.isFinite(capacityRaw)
    ? Math.min(10_000, Math.max(10, Math.round(capacityRaw)))
    : 150;

  const event: PlatformEvent = {
    id: `evt_${now}_${Math.random().toString(36).slice(2, 6)}`,
    title: title.slice(0, 120),
    description: description.slice(0, 1500),
    category,
    dateIso,
    startTime,
    endTime: TIME_HHMM_REGEX.test(endTime) ? endTime : '20:30',
    location: location.slice(0, 140),
    speakerName: speakerName.slice(0, 80),
    capacity,
    createdByUid: sanitizePlatformId(input.createdByUid, 'usr'),
    createdByName: redactSocialTextPii(input.createdByName || 'Yönetici').slice(0, 80),
    status: 'published',
    createdAt: now,
  };

  const nextEvents = [...state.events, event].sort((a, b) => {
    const cmp = a.dateIso.localeCompare(b.dateIso);
    return cmp !== 0 ? cmp : a.startTime.localeCompare(b.startTime);
  });

  return {
    ok: true,
    event,
    state: {
      ...state,
      events: nextEvents,
      lastUpdatedAt: now,
    },
  };
}

export function createPlatformAnnouncement(
  state: SocialPlatformState,
  actorRole: PlatformUserRole,
  input: {
    title: string;
    summary: string;
    priority: AnnouncementPriority;
    tag?: string;
    pinned?: boolean;
    dateIso?: string;
    createdByUid: string;
    createdByName: string;
  },
  now = Date.now()
):
  | { ok: true; state: SocialPlatformState; announcement: PlatformAnnouncement }
  | { ok: false; code: 'FORBIDDEN' | 'VALIDATION'; error: string } {
  if (actorRole !== 'admin') {
    return {
      ok: false,
      code: 'FORBIDDEN',
      error: 'Yalnızca yöneticiler yeni duyuru yayınlayabilir.',
    };
  }

  const title = redactSocialTextPii(input.title);
  const summary = redactSocialTextPii(input.summary);
  const tag = redactSocialTextPii(input.tag || 'Genel Duyuru') || 'Genel Duyuru';
  const rawDateIso = String(input.dateIso || '').trim();

  if (title.length < 5) {
    return {
      ok: false,
      code: 'VALIDATION',
      error: 'Duyuru başlığı en az 5 karakter olmalıdır.',
    };
  }
  if (summary.length < 12) {
    return {
      ok: false,
      code: 'VALIDATION',
      error: 'Duyuru metni en az 12 karakter olmalıdır.',
    };
  }
  if (rawDateIso && !DATE_ISO_REGEX.test(rawDateIso)) {
    return {
      ok: false,
      code: 'VALIDATION',
      error: 'Geçerli bir yayın tarihi (YYYY-AA-GG) seçiniz.',
    };
  }

  const priority: AnnouncementPriority = ANNOUNCEMENT_PRIORITIES.includes(
    input.priority
  )
    ? input.priority
    : 'Güncelleme';

  const fallbackDateIso = new Date(now).toISOString().slice(0, 10);

  const announcement: PlatformAnnouncement = {
    id: `ann_${now}_${Math.random().toString(36).slice(2, 6)}`,
    title: title.slice(0, 120),
    summary: summary.slice(0, 1500),
    priority,
    tag: tag.slice(0, 40),
    pinned: Boolean(input.pinned),
    dateIso: rawDateIso || fallbackDateIso,
    createdByUid: sanitizePlatformId(input.createdByUid, 'usr'),
    createdByName: redactSocialTextPii(input.createdByName || 'Yönetici').slice(0, 80),
    status: 'published',
    createdAt: now,
  };

  const nextAnnouncements = [announcement, ...state.announcements].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.createdAt - a.createdAt;
  });

  return {
    ok: true,
    announcement,
    state: {
      ...state,
      announcements: nextAnnouncements,
      lastUpdatedAt: now,
    },
  };
}

export function createGeneralFeedPost(
  state: SocialPlatformState,
  actorRole: PlatformUserRole,
  input: {
    title: string;
    dateIso: string;
    description: string;
    eventType: FeedContentType;
    startTime?: string;
    endTime?: string;
    location?: string;
    speakerName?: string;
    capacity?: number;
    pinned?: boolean;
    createdByUid: string;
    createdByName: string;
  },
  now = Date.now()
):
  | {
      ok: true;
      kind: 'event' | 'announcement';
      state: SocialPlatformState;
      event?: PlatformEvent;
      announcement?: PlatformAnnouncement;
    }
  | { ok: false; code: 'FORBIDDEN' | 'VALIDATION'; error: string } {
  if (actorRole !== 'admin') {
    return {
      ok: false,
      code: 'FORBIDDEN',
      error: 'Yalnızca yetkili yöneticiler genel akışta içerik yayınlayabilir.',
    };
  }

  const trimmedTitle = redactSocialTextPii(input.title || '');
  const trimmedDesc = redactSocialTextPii(input.description || '');
  const trimmedDate = String(input.dateIso || '').trim();

  if (trimmedTitle.length < 5) {
    return {
      ok: false,
      code: 'VALIDATION',
      error: 'Başlık alanı zorunludur ve en az 5 karakter olmalıdır.',
    };
  }
  if (!DATE_ISO_REGEX.test(trimmedDate)) {
    return {
      ok: false,
      code: 'VALIDATION',
      error: 'Lütfen geçerli bir tarih (YYYY-AA-GG) seçiniz.',
    };
  }
  if (trimmedDesc.length < 12) {
    return {
      ok: false,
      code: 'VALIDATION',
      error: 'Açıklama alanı zorunludur ve en az 12 karakter olmalıdır.',
    };
  }

  const isEventCategory = (EVENT_CATEGORIES as readonly string[]).includes(
    input.eventType
  );

  if (isEventCategory) {
    const evtOutcome = createPlatformEvent(
      state,
      actorRole,
      {
        title: trimmedTitle,
        description: trimmedDesc,
        category: input.eventType as EventCategory,
        dateIso: trimmedDate,
        startTime: String(input.startTime || '19:00').trim() || '19:00',
        endTime: String(input.endTime || '20:30').trim() || '20:30',
        location:
          redactSocialTextPii(input.location || 'Çevrimiçi Canlı Yayın') ||
          'Çevrimiçi Canlı Yayın',
        speakerName: input.speakerName,
        capacity: input.capacity ?? 250,
        createdByUid: input.createdByUid,
        createdByName: input.createdByName,
      },
      now
    );
    if (!evtOutcome.ok) return evtOutcome;
    return {
      ok: true,
      kind: 'event',
      state: evtOutcome.state,
      event: evtOutcome.event,
    };
  }

  const priorityMap: Record<string, AnnouncementPriority> = {
    'Resmi Duyuru · Önemli': 'Önemli',
    'Platform Güncellemesi': 'Güncelleme',
    'Topluluk Duyurusu': 'Topluluk',
  };
  const priority = priorityMap[input.eventType] || 'Önemli';
  const annOutcome = createPlatformAnnouncement(
    state,
    actorRole,
    {
      title: trimmedTitle,
      summary: trimmedDesc,
      priority,
      tag: input.eventType,
      pinned: input.pinned ?? priority === 'Önemli',
      dateIso: trimmedDate,
      createdByUid: input.createdByUid,
      createdByName: input.createdByName,
    },
    now
  );
  if (!annOutcome.ok) return annOutcome;
  return {
    ok: true,
    kind: 'announcement',
    state: annOutcome.state,
    announcement: annOutcome.announcement,
  };
}

export function buildGeneralFeedItems(
  events: readonly PlatformEvent[],
  announcements: readonly PlatformAnnouncement[]
): GeneralFeedItem[] {
  const items: GeneralFeedItem[] = [];

  for (const ev of events) {
    if (ev.status !== 'published') continue;
    items.push({
      id: ev.id,
      kind: 'event',
      title: ev.title,
      dateIso: ev.dateIso,
      eventType: ev.category,
      description: ev.description,
      secondaryMeta: `${ev.startTime}–${ev.endTime} · ${ev.location}`,
      pinned: false,
      createdByName: ev.createdByName,
      createdAt: ev.createdAt,
    });
  }

  for (const ann of announcements) {
    if (ann.status !== 'published') continue;
    const derivedDate =
      ann.dateIso && DATE_ISO_REGEX.test(ann.dateIso)
        ? ann.dateIso
        : new Date(ann.createdAt).toISOString().slice(0, 10);
    items.push({
      id: ann.id,
      kind: 'announcement',
      title: ann.title,
      dateIso: derivedDate,
      eventType: `${ann.priority} Duyuru · ${ann.tag}`,
      description: ann.summary,
      secondaryMeta: ann.pinned ? 'Sabitlenen Resmi Duyuru' : ann.tag,
      pinned: ann.pinned,
      createdByName: ann.createdByName,
      createdAt: ann.createdAt,
    });
  }

  return items.sort((a, b) => {
    if (b.createdAt !== a.createdAt) {
      return b.createdAt - a.createdAt;
    }
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.dateIso.localeCompare(a.dateIso);
  });
}

export function toggleFavoriteItem(
  state: SocialPlatformState,
  rawUid: string,
  targetType: 'event' | 'announcement',
  targetId: string,
  now = Date.now()
): { state: SocialPlatformState; favorited: boolean } {
  const uid = sanitizePlatformId(rawUid, 'usr');
  const cleanTargetId = String(targetId || '').trim();
  if (!cleanTargetId) {
    return { state, favorited: false };
  }

  const currentGraph = state.graphs[uid] || createEmptyGraph();
  const listKey =
    targetType === 'event' ? 'favoriteEventIds' : 'favoriteAnnouncementIds';
  const existing = currentGraph[listKey];
  const alreadyIn = existing.includes(cleanTargetId);
  const nextList = alreadyIn
    ? existing.filter((id) => id !== cleanTargetId)
    : [cleanTargetId, ...existing];

  return {
    favorited: !alreadyIn,
    state: {
      ...state,
      graphs: {
        ...state.graphs,
        [uid]: {
          ...currentGraph,
          [listKey]: nextList,
        },
      },
      lastUpdatedAt: now,
    },
  };
}

export function upsertSocialProfile(
  state: SocialPlatformState,
  input: {
    uid: string;
    displayName: string;
    handle?: string;
    roleTitle?: string;
    bio: string;
    interests: string[];
    avatarUrl?: string;
  },
  now = Date.now()
):
  | { ok: true; state: SocialPlatformState; profile: SocialUserProfile }
  | { ok: false; error: string } {
  const uid = sanitizePlatformId(input.uid, 'usr');
  const displayName = redactSocialTextPii(input.displayName);
  const bio = redactSocialTextPii(input.bio);
  const roleTitle = redactSocialTextPii(
    input.roleTitle || state.profiles[uid]?.roleTitle || 'Topluluk Üyesi'
  );

  if (displayName.length < 2) {
    return {
      ok: false,
      error: 'Görünen ad en az 2 karakter olmalıdır.',
    };
  }
  if (bio.length > 280) {
    return {
      ok: false,
      error: 'Biyografi en fazla 280 karakter olabilir.',
    };
  }

  const cleanedInterests = uniqueStrings(
    (input.interests || [])
      .map((item) => redactSocialTextPii(item).slice(0, 32))
      .filter((item) => item.length >= 2),
    10
  );

  const rawAvatar = String(input.avatarUrl ?? state.profiles[uid]?.avatarUrl ?? '').trim();
  const safeAvatarUrl =
    rawAvatar.startsWith('preset:') ||
    rawAvatar.startsWith('/uploads/avatars/') ||
    /^https?:\/\//i.test(rawAvatar)
      ? rawAvatar.slice(0, 500)
      : 'preset:selin';

  const profile: SocialUserProfile = {
    uid,
    displayName: displayName.slice(0, 80),
    handle: normalizeHandle(input.handle || displayName, displayName),
    roleTitle: (roleTitle || 'Topluluk Üyesi').slice(0, 80),
    bio: bio.slice(0, 280),
    interests: cleanedInterests,
    avatarUrl: safeAvatarUrl,
    avatarInitials: computeInitials(displayName),
    isOnline: true,
    updatedAt: now,
  };

  return {
    ok: true,
    profile,
    state: {
      ...state,
      profiles: {
        ...state.profiles,
        [uid]: profile,
      },
      graphs: {
        ...state.graphs,
        [uid]: state.graphs[uid] || createEmptyGraph(),
      },
      lastUpdatedAt: now,
    },
  };
}

export function toggleFollowUser(
  state: SocialPlatformState,
  rawActorUid: string,
  rawTargetUid: string,
  now = Date.now()
): { state: SocialPlatformState; isFollowing: boolean } {
  const actorUid = sanitizePlatformId(rawActorUid, 'usr');
  const targetUid = sanitizePlatformId(rawTargetUid, 'usr');
  if (actorUid === targetUid || !state.profiles[targetUid]) {
    return { state, isFollowing: false };
  }

  const actorGraph = state.graphs[actorUid] || createEmptyGraph();
  const targetGraph = state.graphs[targetUid] || createEmptyGraph();
  const currentlyFollowing = actorGraph.followingUids.includes(targetUid);

  const nextActorFollowing = currentlyFollowing
    ? actorGraph.followingUids.filter((id) => id !== targetUid)
    : uniqueStrings([...actorGraph.followingUids, targetUid]);

  const nextTargetFollowers = currentlyFollowing
    ? targetGraph.followerUids.filter((id) => id !== actorUid)
    : uniqueStrings([...targetGraph.followerUids, actorUid]);

  return {
    isFollowing: !currentlyFollowing,
    state: {
      ...state,
      graphs: {
        ...state.graphs,
        [actorUid]: {
          ...actorGraph,
          followingUids: nextActorFollowing,
        },
        [targetUid]: {
          ...targetGraph,
          followerUids: nextTargetFollowers,
        },
      },
      lastUpdatedAt: now,
    },
  };
}

export function mutateFriendship(
  state: SocialPlatformState,
  rawActorUid: string,
  rawTargetUid: string,
  action: 'add' | 'accept' | 'reject' | 'remove',
  now = Date.now()
): { state: SocialPlatformState; isFriend: boolean } {
  const actorUid = sanitizePlatformId(rawActorUid, 'usr');
  const targetUid = sanitizePlatformId(rawTargetUid, 'usr');
  if (actorUid === targetUid || !state.profiles[targetUid]) {
    return { state, isFriend: false };
  }

  const actorGraph = state.graphs[actorUid] || createEmptyGraph();
  const targetGraph = state.graphs[targetUid] || createEmptyGraph();

  if (action === 'add' || action === 'accept') {
    const nextActor: UserSocialGraph = {
      ...actorGraph,
      friendUids: uniqueStrings([...actorGraph.friendUids, targetUid]),
      followingUids: uniqueStrings([...actorGraph.followingUids, targetUid]),
      incomingFriendRequests: actorGraph.incomingFriendRequests.filter(
        (id) => id !== targetUid
      ),
      outgoingFriendRequests: actorGraph.outgoingFriendRequests.filter(
        (id) => id !== targetUid
      ),
    };
    const nextTarget: UserSocialGraph = {
      ...targetGraph,
      friendUids: uniqueStrings([...targetGraph.friendUids, actorUid]),
      followerUids: uniqueStrings([...targetGraph.followerUids, actorUid]),
      incomingFriendRequests: targetGraph.incomingFriendRequests.filter(
        (id) => id !== actorUid
      ),
      outgoingFriendRequests: targetGraph.outgoingFriendRequests.filter(
        (id) => id !== actorUid
      ),
    };
    return {
      isFriend: true,
      state: {
        ...state,
        graphs: {
          ...state.graphs,
          [actorUid]: nextActor,
          [targetUid]: nextTarget,
        },
        lastUpdatedAt: now,
      },
    };
  }

  if (action === 'reject') {
    return {
      isFriend: actorGraph.friendUids.includes(targetUid),
      state: {
        ...state,
        graphs: {
          ...state.graphs,
          [actorUid]: {
            ...actorGraph,
            incomingFriendRequests: actorGraph.incomingFriendRequests.filter(
              (id) => id !== targetUid
            ),
          },
          [targetUid]: {
            ...targetGraph,
            outgoingFriendRequests: targetGraph.outgoingFriendRequests.filter(
              (id) => id !== actorUid
            ),
          },
        },
        lastUpdatedAt: now,
      },
    };
  }

  // remove
  return {
    isFriend: false,
    state: {
      ...state,
      graphs: {
        ...state.graphs,
        [actorUid]: {
          ...actorGraph,
          friendUids: actorGraph.friendUids.filter((id) => id !== targetUid),
        },
        [targetUid]: {
          ...targetGraph,
          friendUids: targetGraph.friendUids.filter((id) => id !== actorUid),
        },
      },
      lastUpdatedAt: now,
    },
  };
}

export function buildDirectRoomId(uidA: string, uidB: string): string {
  const pair = [
    sanitizePlatformId(uidA, 'usr'),
    sanitizePlatformId(uidB, 'usr'),
  ].sort();
  return `dm_${pair[0]}__${pair[1]}`.slice(0, 120);
}

export function getOrCreateDirectMessageRoom(
  state: SocialPlatformState,
  rawUidA: string,
  rawUidB: string,
  now = Date.now()
):
  | { ok: true; state: SocialPlatformState; room: SocialChatRoom }
  | { ok: false; error: string } {
  const uidA = sanitizePlatformId(rawUidA, 'usr');
  const uidB = sanitizePlatformId(rawUidB, 'usr');
  if (uidA === uidB) {
    return { ok: false, error: 'Kendinizle doğrudan mesaj odası açamazsınız.' };
  }
  const peerProfile = state.profiles[uidB];
  if (!peerProfile) {
    return { ok: false, error: 'Hedef kullanıcı profili bulunamadı.' };
  }

  const roomId = buildDirectRoomId(uidA, uidB);
  const existing = state.rooms.find((r) => r.id === roomId);
  if (existing) {
    return { ok: true, state, room: existing };
  }

  const actorName = state.profiles[uidA]?.displayName || 'Üye';
  const room: SocialChatRoom = {
    id: roomId,
    name: `${actorName} & ${peerProfile.displayName}`,
    topic: 'Birebir özel mesajlaşma',
    roomType: 'direct',
    ownerUid: uidA,
    memberUids: [uidA, uidB],
    createdAt: now,
    updatedAt: now,
  };

  return {
    ok: true,
    room,
    state: {
      ...state,
      rooms: [room, ...state.rooms],
      messagesByRoom: {
        ...state.messagesByRoom,
        [roomId]: state.messagesByRoom[roomId] || [],
      },
      lastUpdatedAt: now,
    },
  };
}

export function createPrivateChatRoom(
  state: SocialPlatformState,
  input: {
    id?: string;
    name: string;
    topic?: string;
    roomType?: 'private-room' | 'public-room';
    ownerUid: string;
    invitedMemberUids: string[];
  },
  now = Date.now()
):
  | { ok: true; state: SocialPlatformState; room: SocialChatRoom }
  | { ok: false; error: string } {
  const ownerUid = sanitizePlatformId(input.ownerUid, 'usr');
  const name = redactSocialTextPii(input.name);
  const topic = redactSocialTextPii(input.topic || 'Özel çalışma ve sohbet odası');

  if (name.length < 3) {
    return {
      ok: false,
      error: 'Sohbet odası adı en az 3 karakter olmalıdır.',
    };
  }
  if (name.length > 80) {
    return {
      ok: false,
      error: 'Sohbet odası adı en fazla 80 karakter olabilir.',
    };
  }

  const validInvited = (input.invitedMemberUids || [])
    .map((id) => sanitizePlatformId(id, 'usr'))
    .filter((id) => id !== ownerUid && Boolean(state.profiles[id]));

  const memberUids = uniqueStrings([ownerUid, ...validInvited], 10);
  const roomType: SocialRoomType =
    input.roomType === 'public-room' ? 'public-room' : 'private-room';

  const roomId = input.id
    ? sanitizePlatformId(input.id, 'room')
    : `room_${now}_${Math.random().toString(36).slice(2, 6)}`;

  const existingIdx = state.rooms.findIndex((r) => r.id === roomId);
  if (existingIdx >= 0) {
    return { ok: true, state, room: state.rooms[existingIdx] };
  }

  const room: SocialChatRoom = {
    id: roomId,
    name,
    topic: topic.slice(0, 200),
    roomType,
    ownerUid,
    memberUids,
    createdAt: now,
    updatedAt: now,
  };

  const welcomeMsg: SocialRoomMessage = {
    id: `msg_${now}_init`,
    roomId,
    senderUid: ownerUid,
    senderName: state.profiles[ownerUid]?.displayName || 'Oda Kurucusu',
    senderAvatarUrl: state.profiles[ownerUid]?.avatarUrl || 'preset:selin',
    content: `"${name}" odası oluşturuldu. Üyeler: ${memberUids.length} kişi.`,
    createdAt: now,
  };

  return {
    ok: true,
    room,
    state: {
      ...state,
      rooms: [room, ...state.rooms],
      messagesByRoom: {
        ...state.messagesByRoom,
        [roomId]: [welcomeMsg],
      },
      lastUpdatedAt: now,
    },
  };
}

export function appendRoomMessage(
  state: SocialPlatformState,
  input: {
    id?: string;
    roomId: string;
    senderUid: string;
    content: string;
  },
  now = Date.now()
):
  | { ok: true; state: SocialPlatformState; message: SocialRoomMessage }
  | { ok: false; code: 'NOT_FOUND' | 'FORBIDDEN' | 'VALIDATION'; error: string } {
  const roomId = sanitizePlatformId(input.roomId, 'room');
  const senderUid = sanitizePlatformId(input.senderUid, 'usr');
  const room = state.rooms.find((r) => r.id === roomId);

  if (!room) {
    return {
      ok: false,
      code: 'NOT_FOUND',
      error: 'Sohbet odası bulunamadı.',
    };
  }

  if (room.roomType !== 'public-room' && !room.memberUids.includes(senderUid)) {
    return {
      ok: false,
      code: 'FORBIDDEN',
      error: 'Bu özel sohbet odasına mesaj gönderme yetkiniz bulunmuyor.',
    };
  }

  const content = redactSocialTextPii(input.content);
  if (content.length < 1) {
    return {
      ok: false,
      code: 'VALIDATION',
      error: 'Boş mesaj gönderilemez.',
    };
  }
  if (content.length > 2000) {
    return {
      ok: false,
      code: 'VALIDATION',
      error: 'Mesaj uzunluğu 2000 karakteri aşamaz.',
    };
  }

  const existingList = state.messagesByRoom[roomId] || [];
  const msgId = input.id
    ? sanitizePlatformId(input.id, 'msg')
    : `msg_${now}_${Math.random().toString(36).slice(2, 6)}`;

  // Idempotent guard against duplicate WebSocket/HTTP delivery
  const duplicate = existingList.find((m) => m.id === msgId);
  if (duplicate) {
    return { ok: true, state, message: duplicate };
  }

  const senderProfile = state.profiles[senderUid];
  const message: SocialRoomMessage = {
    id: msgId,
    roomId,
    senderUid,
    senderName: senderProfile?.displayName || 'Topluluk Üyesi',
    senderAvatarUrl: senderProfile?.avatarUrl || 'preset:selin',
    content,
    createdAt: now,
  };

  const nextRoomList = [...existingList, message].slice(-250);
  const nextRooms = state.rooms
    .map((r) =>
      r.id === roomId
        ? {
            ...r,
            memberUids:
              r.roomType === 'public-room'
                ? uniqueStrings([...r.memberUids, senderUid], 50)
                : r.memberUids,
            updatedAt: now,
          }
        : r
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return {
    ok: true,
    message,
    state: {
      ...state,
      rooms: nextRooms,
      messagesByRoom: {
        ...state.messagesByRoom,
        [roomId]: nextRoomList,
      },
      lastUpdatedAt: now,
    },
  };
}

export function listVisibleRoomsForUser(
  state: SocialPlatformState,
  rawUid: string
): SocialChatRoom[] {
  const uid = sanitizePlatformId(rawUid, 'usr');
  return state.rooms.filter(
    (room) => room.roomType === 'public-room' || room.memberUids.includes(uid)
  );
}
