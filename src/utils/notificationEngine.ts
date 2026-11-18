import type {
  AppNotification,
  NotificationCategory,
  NotificationPreferences,
} from '../types/luxo.ts';

export const NOTIFICATION_STORAGE_KEY = 'luxo_notifications_v1';
export const NOTIFICATION_PREFS_STORAGE_KEY = 'luxo_notification_prefs_v1';

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  messagesEnabled: true,
  postActivityEnabled: true,
  systemUpdatesEnabled: true,
  soundEnabled: false,
  digestMode: 'instant',
};

export function normalizeNotificationPreferences(
  raw: Partial<NotificationPreferences> | null | undefined
): NotificationPreferences {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
  return {
    messagesEnabled:
      typeof raw.messagesEnabled === 'boolean' ? raw.messagesEnabled : true,
    postActivityEnabled:
      typeof raw.postActivityEnabled === 'boolean'
        ? raw.postActivityEnabled
        : true,
    systemUpdatesEnabled:
      typeof raw.systemUpdatesEnabled === 'boolean'
        ? raw.systemUpdatesEnabled
        : true,
    soundEnabled:
      typeof raw.soundEnabled === 'boolean' ? raw.soundEnabled : false,
    digestMode: raw.digestMode === 'daily' ? 'daily' : 'instant',
  };
}

export function isCategoryEnabledInPreferences(
  category: NotificationCategory,
  prefs: NotificationPreferences
): boolean {
  if (category === 'message') return prefs.messagesEnabled;
  if (category === 'post_activity') return prefs.postActivityEnabled;
  return prefs.systemUpdatesEnabled;
}

export function createInitialNotifications(
  now = Date.now()
): AppNotification[] {
  return [
    {
      id: 'notif-seed-sys-1',
      category: 'system_update',
      title: 'Otonom Gelişim v2 Güncellemesi',
      body: 'Gemini 4 Hydrogen dahil 113 yapay zeka modeli arasında yanıt kalitesi ve gecikme optimizasyonu etkinleştirildi.',
      createdAt: now - 18 * 60 * 1000,
      read: false,
      targetView: 'evolution',
    },
    {
      id: 'notif-seed-post-1',
      category: 'post_activity',
      title: 'Topluluk & Blog Etkinliği',
      body: 'Teknik SEO ve React Performans rehberinize yeni yorumlar ve olumlu oylar geldi.',
      createdAt: now - 45 * 60 * 1000,
      read: false,
      targetView: 'hub',
    },
    {
      id: 'notif-seed-msg-1',
      category: 'message',
      title: 'Canlı Çalışma Alanı Hazır',
      body: 'Gemini 4 Argon ve Argon Kod Stüdyosu sesli kod düzenleme için aktif.',
      createdAt: now - 2 * 60 * 60 * 1000,
      read: true,
      targetView: 'studio',
    },
  ];
}

export function createNotification(input: {
  category: NotificationCategory;
  title: string;
  body: string;
  targetView?: AppNotification['targetView'];
  now?: number;
}): AppNotification {
  const now = input.now ?? Date.now();
  return {
    id: `notif-${now}-${Math.random().toString(36).slice(2, 7)}`,
    category: input.category,
    title: input.title.trim().slice(0, 120),
    body: input.body.trim().slice(0, 320),
    createdAt: now,
    read: false,
    targetView: input.targetView,
  };
}

export function appendNotification(
  list: AppNotification[],
  item: AppNotification,
  prefs: NotificationPreferences,
  maxItems = 50
): AppNotification[] {
  if (!isCategoryEnabledInPreferences(item.category, prefs)) {
    return list;
  }
  return [item, ...list].slice(0, maxItems);
}

export function filterNotifications(
  items: AppNotification[],
  options: {
    category?: NotificationCategory | 'all';
    unreadOnly?: boolean;
    prefs?: NotificationPreferences;
    respectPreferences?: boolean;
  }
): AppNotification[] {
  const {
    category = 'all',
    unreadOnly = false,
    prefs = DEFAULT_NOTIFICATION_PREFERENCES,
    respectPreferences = true,
  } = options;

  return items.filter((item) => {
    if (respectPreferences && !isCategoryEnabledInPreferences(item.category, prefs)) {
      return false;
    }
    if (category !== 'all' && item.category !== category) {
      return false;
    }
    if (unreadOnly && item.read) {
      return false;
    }
    return true;
  });
}

export function getUnreadNotificationCount(
  items: AppNotification[],
  prefs: NotificationPreferences
): number {
  return items.filter(
    (item) => !item.read && isCategoryEnabledInPreferences(item.category, prefs)
  ).length;
}

export function markNotificationAsRead(
  items: AppNotification[],
  id: string
): AppNotification[] {
  return items.map((item) => (item.id === id ? { ...item, read: true } : item));
}

export function markAllNotificationsAsRead(
  items: AppNotification[]
): AppNotification[] {
  return items.map((item) => ({ ...item, read: true }));
}

export function clearReadNotifications(
  items: AppNotification[]
): AppNotification[] {
  return items.filter((item) => !item.read);
}

export function formatRelativeNotificationTime(
  createdAt: number,
  now = Date.now()
): string {
  const diffSec = Math.max(0, Math.floor((now - createdAt) / 1000));
  if (diffSec < 60) return 'Az önce';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} dk önce`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} sa önce`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} gün önce`;
}
