import assert from 'node:assert/strict';
import test from 'node:test';
import {
  appendNotification,
  clearReadNotifications,
  createInitialNotifications,
  createNotification,
  DEFAULT_NOTIFICATION_PREFERENCES,
  filterNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  normalizeNotificationPreferences,
} from './notificationEngine.ts';

test('notification preferences filter feed and unread count', () => {
  const now = 1_750_000_000_000;
  const seed = createInitialNotifications(now);
  assert.equal(getUnreadNotificationCount(seed, DEFAULT_NOTIFICATION_PREFERENCES), 2);

  const noPostActivityPrefs = normalizeNotificationPreferences({
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    postActivityEnabled: false,
  });

  assert.equal(getUnreadNotificationCount(seed, noPostActivityPrefs), 1);

  const filtered = filterNotifications(seed, {
    category: 'all',
    prefs: noPostActivityPrefs,
    respectPreferences: true,
  });
  assert.ok(filtered.every((n) => n.category !== 'post_activity'));

  const suppressed = appendNotification(
    seed,
    createNotification({
      category: 'post_activity',
      title: 'Yeni yorum',
      body: 'Test',
      now,
    }),
    noPostActivityPrefs
  );
  assert.equal(suppressed.length, seed.length);
});

test('markNotificationAsRead, markAllNotificationsAsRead, and clearReadNotifications update state', () => {
  const seed = createInitialNotifications(1_750_000_000_000);
  const firstUnread = seed.find((n) => !n.read);
  assert.ok(firstUnread);

  const afterSingleRead = markNotificationAsRead(seed, firstUnread.id);
  assert.equal(getUnreadNotificationCount(afterSingleRead, DEFAULT_NOTIFICATION_PREFERENCES), 1);

  const onlyUnread = clearReadNotifications(afterSingleRead);
  assert.equal(onlyUnread.length, 1);
  assert.equal(onlyUnread[0].read, false);

  const allRead = markAllNotificationsAsRead(seed);
  assert.equal(getUnreadNotificationCount(allRead, DEFAULT_NOTIFICATION_PREFERENCES), 0);
});
