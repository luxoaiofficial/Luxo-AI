import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Rss,
  ShieldCheck,
} from 'lucide-react';
import {
  buildGeneralFeedItems,
  buildMonthlyCalendarGrid,
  EVENT_CATEGORIES,
  type EventCategory,
  type PlatformAnnouncement,
  type PlatformEvent,
  type PlatformUserRole,
} from '../utils/socialPlatformEngine';
import { QuickSocialShareButtons } from './SocialShareBar';
import { ContentRatingAndComments } from './ContentRatingAndComments';

const MONTH_NAMES_TR = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

const WEEKDAY_HEADERS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function formatTurkishDateLabel(dateIso: string): string {
  const parts = dateIso.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) {
    return dateIso;
  }
  const [y, m, d] = parts;
  const monthName = MONTH_NAMES_TR[m - 1] || '';
  return `${d} ${monthName} ${y}`;
}

interface CalendarAnnouncementsTabProps {
  events: PlatformEvent[];
  announcements: PlatformAnnouncement[];
  favoriteEventIds: string[];
  favoriteAnnouncementIds: string[];
  actorRole: PlatformUserRole;
  isVerifiedAdminAccount: boolean;
  onChangeActorRole: (role: PlatformUserRole) => void;
  onToggleFavorite: (
    targetType: 'event' | 'announcement',
    targetId: string
  ) => Promise<void>;
  adminCreateForm?: React.ReactNode;
}

export const CalendarAnnouncementsTab: React.FC<CalendarAnnouncementsTabProps> = ({
  events,
  announcements,
  favoriteEventIds,
  favoriteAnnouncementIds,
  actorRole,
  isVerifiedAdminAccount,
  onChangeActorRole,
  onToggleFavorite,
  adminCreateForm,
}) => {
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(10); // 0-indexed: 10 = Kasım 2026
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'Tümü' | EventCategory>(
    'Tümü'
  );
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const calendarCells = useMemo(
    () => buildMonthlyCalendarGrid(viewYear, viewMonth, events),
    [viewYear, viewMonth, events]
  );

  const generalFeedItems = useMemo(() => {
    const merged = buildGeneralFeedItems(events, announcements);
    return merged.filter((item) => {
      if (selectedDateIso && item.dateIso !== selectedDateIso) return false;
      if (categoryFilter !== 'Tümü') {
        if (item.kind !== 'event' || item.eventType !== categoryFilter) {
          return false;
        }
      }
      if (onlyFavorites) {
        const isFav =
          item.kind === 'event'
            ? favoriteEventIds.includes(item.id)
            : favoriteAnnouncementIds.includes(item.id);
        if (!isFav) return false;
      }
      return true;
    });
  }, [
    events,
    announcements,
    selectedDateIso,
    categoryFilter,
    onlyFavorites,
    favoriteEventIds,
    favoriteAnnouncementIds,
  ]);

  const totalFavoritesCount =
    favoriteEventIds.length + favoriteAnnouncementIds.length;

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (ev.status !== 'published') return false;
      if (selectedDateIso && ev.dateIso !== selectedDateIso) return false;
      if (categoryFilter !== 'Tümü' && ev.category !== categoryFilter) {
        return false;
      }
      if (onlyFavorites && !favoriteEventIds.includes(ev.id)) return false;
      return true;
    });
  }, [events, selectedDateIso, categoryFilter, onlyFavorites, favoriteEventIds]);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((ann) => {
      if (ann.status !== 'published') return false;
      if (onlyFavorites && !favoriteAnnouncementIds.includes(ann.id)) {
        return false;
      }
      return true;
    });
  }, [announcements, onlyFavorites, favoriteAnnouncementIds]);

  const handlePrevMonth = () => {
    setSelectedDateIso(null);
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    setSelectedDateIso(null);
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar: View Filters + Role Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Görünüm Filtresi"
            className="inline-flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
          >
            <button
              type="button"
              onClick={() => setOnlyFavorites(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                !onlyFavorites
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Tüm Kayıtlar
            </button>
            <button
              type="button"
              data-testid="filter-favorites-btn"
              onClick={() => setOnlyFavorites(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                onlyFavorites
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Favorilerim ({totalFavoritesCount})
            </button>
          </div>

          <select
            aria-label="Etkinlik kategorisi filtresi"
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as 'Tümü' | EventCategory)
            }
            className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-800 dark:text-neutral-200 focus:outline-hidden"
          >
            <option value="Tümü">Tüm Kategoriler</option>
            {EVENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {selectedDateIso && (
            <button
              type="button"
              onClick={() => setSelectedDateIso(null)}
              className="px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              Seçili Gün: {formatTurkishDateLabel(selectedDateIso)} · Sıfırla
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
            Yetki Görünümü:
          </span>
          <div
            role="group"
            aria-label="Rol Seçici"
            className="inline-flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
          >
            <button
              type="button"
              onClick={() => onChangeActorRole('member')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                actorRole === 'member'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Üye Görünümü
            </button>
            <button
              type="button"
              data-testid="switch-admin-mode-btn"
              onClick={() => onChangeActorRole('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                actorRole === 'admin'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                Yönetici Modu{isVerifiedAdminAccount ? ' (Doğrulandı)' : ''}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin-Only Create Event/Announcement Form */}
      {actorRole === 'admin' && adminCreateForm}

      {/* Unified General Feed (Genel Akış) */}
      <section aria-label="Genel Akış" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <Rss className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Genel Akış (Etkinlik & Duyurular)</span>
          </h2>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
            {generalFeedItems.length} içerik yayında
          </span>
        </div>

        {generalFeedItems.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1e1f23] border border-neutral-200 dark:border-neutral-800 text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Seçili filtreyle eşleşen genel akış kaydı bulunamadı.
            </p>
          </div>
        ) : (
          <div
            data-testid="general-feed-list"
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {generalFeedItems.slice(0, 6).map((item) => {
              const isFav =
                item.kind === 'event'
                  ? favoriteEventIds.includes(item.id)
                  : favoriteAnnouncementIds.includes(item.id);
              return (
                <article
                  key={`${item.kind}_${item.id}`}
                  className="p-5 rounded-2xl bg-white dark:bg-[#1e1f23] border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                          <span
                            className={`font-semibold ${
                              item.kind === 'event'
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {item.eventType}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{formatTurkishDateLabel(item.dateIso)}</span>
                          {item.pinned && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                                Sabitlendi
                              </span>
                            </>
                          )}
                        </div>
                        <h3 className="text-base font-semibold text-neutral-900 dark:text-white leading-snug">
                          {item.title}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleFavorite(item.kind, item.id)}
                        aria-label={
                          isFav
                            ? `${item.title} kaydını favorilerden çıkar`
                            : `${item.title} kaydını favorilere ekle`
                        }
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                          isFav
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                            : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <Bookmark
                          className={`w-3.5 h-3.5 ${
                            isFav ? 'fill-current' : ''
                          }`}
                        />
                        <span>{isFav ? 'Favorilerde' : 'Favori'}</span>
                      </button>
                    </div>

                    <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-2.5 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                    <span>{item.secondaryMeta}</span>
                    <span>Yayınlayan: {item.createdByName}</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <QuickSocialShareButtons
                      compact
                      payload={{
                        title: item.title,
                        excerpt: item.description,
                        contentType: 'chat',
                        badge: `${item.eventType} · LUXO TOPLULUK`,
                      }}
                    />
                  </div>
                  <ContentRatingAndComments
                    compact
                    contentKey={`${item.kind === 'event' ? 'event' : 'ann'}:${item.id}`}
                    contentTitle={item.title}
                  />
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Main Split Grid: Left = Monthly Calendar + Events, Right = Announcements */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Interactive Monthly Calendar + Event List */}
        <section className="xl:col-span-7 space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1e1f23] border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {MONTH_NAMES_TR[viewMonth]} {viewYear} Etkinlik Takvimi
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Gün seçerek o tarihteki oturumları filtreleyebilirsiniz
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="Önceki Ay"
                  className="w-9 h-9 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="Sonraki Ay"
                  className="w-9 h-9 rounded-xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAY_HEADERS_TR.map((dayName) => (
                <div
                  key={dayName}
                  className="py-1.5 text-center text-xs font-medium text-neutral-500 dark:text-neutral-400"
                >
                  {dayName}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((cell) => {
                const isSelected = selectedDateIso === cell.dateIso;
                const hasEvents = cell.events.length > 0;
                return (
                  <button
                    key={cell.dateIso}
                    type="button"
                    onClick={() =>
                      setSelectedDateIso((prev) =>
                        prev === cell.dateIso ? null : cell.dateIso
                      )
                    }
                    aria-label={`${formatTurkishDateLabel(cell.dateIso)}${
                      hasEvents ? `, ${cell.events.length} etkinlik` : ''
                    }`}
                    className={`min-h-[58px] p-1.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer tabular-nums ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : cell.inCurrentMonth
                        ? 'bg-neutral-50/70 dark:bg-neutral-900/60 border-neutral-200/70 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 hover:border-neutral-300 dark:hover:border-neutral-700'
                        : 'bg-transparent border-transparent text-neutral-400 dark:text-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-semibold ${
                          cell.isToday && !isSelected
                            ? 'text-blue-600 dark:text-blue-400 underline underline-offset-4'
                            : ''
                        }`}
                      >
                        {cell.dayNumber}
                      </span>
                      {hasEvents && (
                        <span
                          className={`text-[11px] font-mono ${
                            isSelected
                              ? 'text-blue-100'
                              : 'text-blue-600 dark:text-blue-400 font-semibold'
                          }`}
                        >
                          {cell.events.length}
                        </span>
                      )}
                    </div>
                    {hasEvents && (
                      <div
                        className={`text-[10px] leading-tight truncate w-full ${
                          isSelected
                            ? 'text-white/90'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {cell.events[0].startTime} {cell.events[0].title}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upcoming / Filtered Events Feed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Planlanan Etkinlikler</span>
              </h3>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                {filteredEvents.length} etkinlik listeleniyor
              </span>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white dark:bg-[#1e1f23] border border-neutral-200 dark:border-neutral-800 text-center space-y-2">
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  Seçili filtreyle eşleşen etkinlik bulunmuyor.
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Tüm etkinlikleri görmek için tarih veya favori filtresini sıfırlayabilirsiniz.
                </p>
                {(selectedDateIso || onlyFavorites || categoryFilter !== 'Tümü') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDateIso(null);
                      setOnlyFavorites(false);
                      setCategoryFilter('Tümü');
                    }}
                    className="mt-1 px-3.5 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold cursor-pointer"
                  >
                    Filtreleri Temizle
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3" data-testid="events-list">
                {filteredEvents.map((ev) => {
                  const isFav = favoriteEventIds.includes(ev.id);
                  return (
                    <article
                      key={ev.id}
                      className="p-5 rounded-2xl bg-white dark:bg-[#1e1f23] border border-neutral-200 dark:border-neutral-800 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                              {ev.category}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{formatTurkishDateLabel(ev.dateIso)}</span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {ev.startTime}–{ev.endTime}
                            </span>
                          </div>
                          <h4 className="text-base font-semibold text-neutral-900 dark:text-white">
                            {ev.title}
                          </h4>
                        </div>

                        <button
                          type="button"
                          onClick={() => onToggleFavorite('event', ev.id)}
                          aria-label={
                            isFav
                              ? `${ev.title} etkinliğini favorilerden çıkar`
                              : `${ev.title} etkinliğini favorilere ekle`
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                            isFav
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                              : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                          }`}
                        >
                          <Bookmark
                            className={`w-3.5 h-3.5 ${
                              isFav ? 'fill-current' : ''
                            }`}
                          />
                          <span>{isFav ? 'Favorilerde' : 'Favorilere Ekle'}</span>
                        </button>
                      </div>

                      <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                        {ev.description}
                      </p>

                      <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>Konum: {ev.location}</span>
                          <span aria-hidden="true">·</span>
                          <span>Konuşmacı: {ev.speakerName}</span>
                          <span aria-hidden="true">·</span>
                          <span>Kontenjan: {ev.capacity} kişi</span>
                        </div>
                        <QuickSocialShareButtons
                          compact
                          payload={{
                            title: ev.title,
                            excerpt: ev.description,
                            contentType: 'chat',
                            badge: `ETKİNLİK · ${ev.category}`,
                          }}
                        />
                      </div>
                      <ContentRatingAndComments
                        compact
                        contentKey={`event:${ev.id}`}
                        contentTitle={ev.title}
                      />
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Right 5 Columns: Official Announcements Feed */}
        <section className="xl:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Resmi Duyurular</span>
            </h2>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
              {filteredAnnouncements.length} duyuru
            </span>
          </div>

          {filteredAnnouncements.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#1e1f23] border border-neutral-200 dark:border-neutral-800 text-center space-y-2">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                Henüz favorilere eklenmiş duyuru bulunmuyor.
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Duyuru kartlarındaki yer imi düğmesiyle önemli duyuruları kaydedebilirsiniz.
              </p>
            </div>
          ) : (
            <div className="space-y-3" data-testid="announcements-list">
              {filteredAnnouncements.map((ann) => {
                const isFav = favoriteAnnouncementIds.includes(ann.id);
                const priorityColor =
                  ann.priority === 'Önemli'
                    ? 'text-red-600 dark:text-red-400'
                    : ann.priority === 'Güncelleme'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-emerald-600 dark:text-emerald-400';

                return (
                  <article
                    key={ann.id}
                    className="p-5 rounded-2xl bg-white dark:bg-[#1e1f23] border border-neutral-200 dark:border-neutral-800 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                          <span className={`font-semibold ${priorityColor}`}>
                            {ann.priority}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{ann.tag}</span>
                          {ann.pinned && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-medium text-neutral-700 dark:text-neutral-300">
                                Sabitlendi
                              </span>
                            </>
                          )}
                        </div>
                        <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                          {ann.title}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleFavorite('announcement', ann.id)}
                        aria-label={
                          isFav
                            ? `${ann.title} duyurusunu favorilerden çıkar`
                            : `${ann.title} duyurusunu favorilere ekle`
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                          isFav
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                            : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <Bookmark
                          className={`w-3.5 h-3.5 ${
                            isFav ? 'fill-current' : ''
                          }`}
                        />
                        <span>{isFav ? 'Favorilerde' : 'Favorilere Ekle'}</span>
                      </button>
                    </div>

                    <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      {ann.summary}
                    </p>

                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                      <span>Yayınlayan: {ann.createdByName}</span>
                      <div className="flex items-center gap-2">
                        <span>
                          {new Date(ann.createdAt).toLocaleDateString('tr-TR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <QuickSocialShareButtons
                          compact
                          payload={{
                            title: ann.title,
                            excerpt: ann.summary,
                            contentType: 'chat',
                            badge: `DUYURU · ${ann.priority}`,
                          }}
                        />
                      </div>
                    </div>
                    <ContentRatingAndComments
                      compact
                      contentKey={`ann:${ann.id}`}
                      contentTitle={ann.title}
                    />
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
