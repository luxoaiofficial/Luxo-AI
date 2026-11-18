import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  MessageSquare,
  Settings2,
  Sparkles,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-react';
import type {
  AppNotification,
  AppView,
  NotificationCategory,
  NotificationPreferences,
} from '../types/luxo';
import {
  filterNotifications,
  formatRelativeNotificationTime,
  getUnreadNotificationCount,
} from '../utils/notificationEngine';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  preferences: NotificationPreferences;
  onUpdatePreferences: (partial: Partial<NotificationPreferences>) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearRead: () => void;
  onNavigateView: (view: AppView) => void;
}

const CATEGORY_META: Record<
  NotificationCategory,
  { label: string; icon: React.ReactNode }
> = {
  message: {
    label: 'Mesajlar',
    icon: <MessageSquare className="w-3.5 h-3.5 text-blue-500" />,
  },
  post_activity: {
    label: 'Gönderi Etkinliği',
    icon: <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />,
  },
  system_update: {
    label: 'Sistem Güncellemesi',
    icon: <Sparkles className="w-3.5 h-3.5 text-indigo-500" />,
  },
};

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  preferences,
  onUpdatePreferences,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearRead,
  onNavigateView,
}) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'prefs'>('feed');
  const [categoryFilter, setCategoryFilter] = useState<
    NotificationCategory | 'all'
  >('all');
  const [unreadOnly, setUnreadOnly] = useState(false);

  if (!isOpen) return null;

  const unreadCount = getUnreadNotificationCount(notifications, preferences);
  const visibleItems = filterNotifications(notifications, {
    category: categoryFilter,
    unreadOnly,
    prefs: preferences,
    respectPreferences: true,
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Bildirim Merkezi"
      data-testid="notification-center-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
    >
      <div className="w-full max-w-lg bg-white dark:bg-[#202123] rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <span>Bildirim Merkezi</span>
                <span
                  data-testid="notification-modal-unread-count"
                  className="text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400 tabular-nums"
                >
                  ({unreadCount} okunmamış)
                </span>
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Mesajlar, gönderi etkileşimleri ve sistem güncellemeleri
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Bildirim Merkezini Kapat"
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-5 pt-3 pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            data-testid="notif-tab-feed"
            onClick={() => setActiveTab('feed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'feed'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            Bildirimler
          </button>
          <button
            type="button"
            data-testid="notif-tab-prefs"
            onClick={() => setActiveTab('prefs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'prefs'
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Bildirim Tercihleri</span>
          </button>
        </div>

        {activeTab === 'feed' ? (
          <>
            {/* Filter & Bulk Action Row */}
            <div className="px-5 py-2.5 bg-neutral-50 dark:bg-[#18181b] border-b border-neutral-200/70 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {(
                  [
                    { id: 'all', label: 'Tümü' },
                    { id: 'message', label: 'Mesajlar' },
                    { id: 'post_activity', label: 'Gönderi' },
                    { id: 'system_update', label: 'Sistem' },
                  ] as const
                ).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryFilter(c.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer whitespace-nowrap transition ${
                      categoryFilter === c.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setUnreadOnly((u) => !u)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer whitespace-nowrap transition ${
                    unreadOnly
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  Okunmamış
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-testid="notif-mark-all-read-btn"
                  onClick={onMarkAllAsRead}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Tümünü Oku</span>
                </button>
                <button
                  type="button"
                  onClick={onClearRead}
                  className="text-[11px] font-semibold text-neutral-500 hover:text-red-500 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  title="Okunmuş bildirimleri temizle"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {visibleItems.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <Bell className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto" />
                  <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                    Gösterilecek bildirim bulunmuyor.
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    Filtreleri değiştirebilir veya Bildirim Tercihlerinden kategorileri açabilirsiniz.
                  </p>
                </div>
              ) : (
                visibleItems.map((item) => {
                  const meta = CATEGORY_META[item.category];
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (!item.read) onMarkAsRead(item.id);
                        if (item.targetView) {
                          onNavigateView(item.targetView);
                          onClose();
                        }
                      }}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                        item.read
                          ? 'bg-white dark:bg-[#18181b] border-neutral-200/80 dark:border-neutral-800 opacity-80'
                          : 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/50'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 mt-0.5">
                        {meta.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-neutral-400 shrink-0 tabular-nums">
                            {formatRelativeNotificationTime(item.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5 leading-relaxed">
                          {item.body}
                        </p>
                        <div className="flex items-center justify-between mt-1.5 text-[10px] text-neutral-500">
                          <span>{meta.label}</span>
                          {!item.read && (
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              Yeni
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Hangi etkinlikler için anlık bildirim almak istediğinizi seçin. Tercihleriniz tarayıcınızda otomatik kaydedilir.
            </p>

            <div className="divide-y divide-neutral-100 dark:divide-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-[#18181b]">
              {[
                {
                  key: 'messagesEnabled' as const,
                  title: 'Yeni Mesaj Bildirimleri',
                  desc: 'Asistan yanıtları ve canlı ortak çalışma odası mesajları',
                  testId: 'pref-toggle-messages',
                },
                {
                  key: 'postActivityEnabled' as const,
                  title: 'Gönderi & Yorum Etkinliği',
                  desc: 'Blog makalesi yorumları, yanıtlar ve olumlu oylar',
                  testId: 'pref-toggle-post-activity',
                },
                {
                  key: 'systemUpdatesEnabled' as const,
                  title: 'Sistem & Evrim Güncellemeleri',
                  desc: 'Otonom gelişim turları, model kalibrasyonları ve güvenlik notları',
                  testId: 'pref-toggle-system-updates',
                },
                {
                  key: 'soundEnabled' as const,
                  title: 'Bildirim Ses Sinyali',
                  desc: 'Önemli uyarılar geldiğinde hafif sesli geri bildirim',
                  testId: 'pref-toggle-sound',
                },
              ].map((row) => {
                const enabled = Boolean(preferences[row.key]);
                return (
                  <div
                    key={row.key}
                    className="flex items-center justify-between gap-3 p-4"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-neutral-900 dark:text-white">
                        {row.title}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {row.desc}
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      data-testid={row.testId}
                      onClick={() =>
                        onUpdatePreferences({ [row.key]: !enabled })
                      }
                      className={`w-11 h-6 rounded-full transition relative cursor-pointer shrink-0 ${
                        enabled
                          ? 'bg-blue-600'
                          : 'bg-neutral-300 dark:bg-neutral-700'
                      }`}
                      aria-label={row.title}
                    >
                      <span
                        className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                          enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-[#18181b] flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-neutral-900 dark:text-white">
                  Bildirim Teslim Sıklığı
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Anlık veya toplu özet görünümü
                </div>
              </div>
              <select
                value={preferences.digestMode}
                onChange={(e) =>
                  onUpdatePreferences({
                    digestMode: e.target.value as 'instant' | 'daily',
                  })
                }
                aria-label="Bildirim Teslim Sıklığı"
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#202123] border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer outline-none"
              >
                <option value="instant">Anlık</option>
                <option value="daily">Günlük Özet</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
