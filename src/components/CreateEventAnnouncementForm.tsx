import React, { useState } from 'react';
import { CalendarPlus, Megaphone, ShieldCheck } from 'lucide-react';
import {
  EVENT_CATEGORIES,
  FEED_CONTENT_TYPES,
  type FeedContentType,
  type PlatformUserRole,
} from '../utils/socialPlatformEngine';

export interface CreateEventAnnouncementPayload {
  title: string;
  dateIso: string;
  description: string;
  eventType: FeedContentType;
  startTime: string;
  endTime: string;
  location: string;
  speakerName: string;
  capacity: number;
  pinned: boolean;
}

interface CreateEventAnnouncementFormProps {
  actorRole: PlatformUserRole;
  isVerifiedAdminAccount: boolean;
  onSubmitPost: (
    payload: CreateEventAnnouncementPayload
  ) => Promise<{ ok: boolean; kind?: 'event' | 'announcement'; error?: string }>;
}

const DATE_ISO_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export const CreateEventAnnouncementForm: React.FC<
  CreateEventAnnouncementFormProps
> = ({ actorRole, isVerifiedAdminAccount, onSubmitPost }) => {
  const [title, setTitle] = useState('');
  const [dateIso, setDateIso] = useState('2026-11-21');
  const [eventType, setEventType] =
    useState<FeedContentType>('Konferans & Zirve');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('20:30');
  const [location, setLocation] = useState('Çevrimiçi Canlı Yayın');
  const [speakerName, setSpeakerName] = useState('');
  const [capacity, setCapacity] = useState(250);
  const [pinned, setPinned] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Strict admin-only authorization gate
  if (actorRole !== 'admin') {
    return null;
  }

  const isEventSelected = (EVENT_CATEGORIES as readonly string[]).includes(
    eventType
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanTitle = title.trim();
    const cleanDate = dateIso.trim();
    const cleanDesc = description.trim();

    if (cleanTitle.length < 5) {
      setErrorMsg('Başlık alanı zorunludur ve en az 5 karakter olmalıdır.');
      return;
    }
    if (!DATE_ISO_PATTERN.test(cleanDate)) {
      setErrorMsg('Lütfen geçerli bir tarih (YYYY-AA-GG) seçiniz.');
      return;
    }
    if (cleanDesc.length < 12) {
      setErrorMsg('Açıklama alanı zorunludur ve en az 12 karakter olmalıdır.');
      return;
    }
    if (isEventSelected && location.trim().length < 3) {
      setErrorMsg('Etkinlik konumu veya yayın kanalı en az 3 karakter olmalıdır.');
      return;
    }

    setIsSubmitting(true);
    try {
      const outcome = await onSubmitPost({
        title: cleanTitle,
        dateIso: cleanDate,
        description: cleanDesc,
        eventType,
        startTime,
        endTime,
        location: location.trim(),
        speakerName: speakerName.trim(),
        capacity,
        pinned,
      });

      if (!outcome.ok) {
        setErrorMsg(outcome.error || 'İçerik genel akışta yayınlanamadı.');
        return;
      }

      setTitle('');
      setDescription('');
      setSpeakerName('');
      setSuccessMsg(
        isEventSelected
          ? 'Yeni etkinlik oluşturuldu; genel akışa ve aylık takvime eklendi.'
          : 'Yeni duyuru oluşturuldu ve genel akışta yayınlandı.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      aria-label="Yönetici Etkinlik ve Duyuru Oluşturma Formu"
      data-testid="admin-create-event-announcement-form"
      className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#1e1f23] border border-neutral-200 dark:border-neutral-800 space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white">
            Etkinlik veya Duyuru Oluştur
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Yayınlanan kayıtlar anında genel akışa, aylık takvime ve tüm bağlı üyelere düşer
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>
            Yönetici Yetkisi Aktif
            {isVerifiedAdminAccount ? ' · Doğrulanmış Hesap' : ''}
          </span>
        </div>
      </div>

      {errorMsg && (
        <p
          role="alert"
          data-testid="create-feed-form-error"
          className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl px-3.5 py-2.5"
        >
          {errorMsg}
        </p>
      )}

      {successMsg && (
        <p
          role="status"
          data-testid="create-feed-form-success"
          className="text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl px-3.5 py-2.5"
        >
          {successMsg}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Core Required Fields: Title, Date, Event Type */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5">
            <label
              htmlFor="create-feed-title"
              className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
            >
              Başlık (Title)
            </label>
            <input
              id="create-feed-title"
              name="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Aralık 2026 Çoklu Model Mimarisi Zirvesi"
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-3">
            <label
              htmlFor="create-feed-date"
              className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
            >
              Tarih (Date)
            </label>
            <input
              id="create-feed-date"
              name="date"
              type="date"
              value={dateIso}
              onChange={(e) => setDateIso(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-900 dark:text-white tabular-nums focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-4">
            <label
              htmlFor="create-feed-type"
              className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
            >
              Etkinlik / İçerik Türü (Event Type)
            </label>
            <select
              id="create-feed-type"
              name="eventType"
              value={eventType}
              onChange={(e) => setEventType(e.target.value as FeedContentType)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-hidden focus:border-blue-500"
            >
              <optgroup label="Takvim Etkinlik Türleri">
                {FEED_CONTENT_TYPES.filter((t) => t.kind === 'event').map(
                  (opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  )
                )}
              </optgroup>
              <optgroup label="Resmi Duyuru Türleri">
                {FEED_CONTENT_TYPES.filter((t) => t.kind === 'announcement').map(
                  (opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  )
                )}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Core Required Field: Description */}
        <div>
          <label
            htmlFor="create-feed-description"
            className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
          >
            Açıklama (Description)
          </label>
          <textarea
            id="create-feed-description"
            name="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Genel akışta görünecek etkinlik kapsamını, gündem maddelerini veya duyuru detaylarını yazın..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-900 dark:text-white resize-none focus:outline-hidden focus:border-blue-500"
          />
        </div>

        {/* Contextual Schedule / Pin Details */}
        {isEventSelected ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
            <div>
              <label
                htmlFor="create-feed-start"
                className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1"
              >
                Başlangıç Saati
              </label>
              <input
                id="create-feed-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white tabular-nums focus:outline-hidden"
              />
            </div>

            <div>
              <label
                htmlFor="create-feed-end"
                className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1"
              >
                Bitiş Saati
              </label>
              <input
                id="create-feed-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white tabular-nums focus:outline-hidden"
              />
            </div>

            <div className="lg:col-span-2">
              <label
                htmlFor="create-feed-location"
                className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1"
              >
                Konum veya Yayın Kanalı
              </label>
              <input
                id="create-feed-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Çevrimiçi Canlı Yayın veya Salon"
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-hidden"
              />
            </div>

            <div>
              <label
                htmlFor="create-feed-capacity"
                className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1"
              >
                Kontenjan / Konuşmacı
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  id="create-feed-capacity"
                  aria-label="Etkinlik Kontenjanı"
                  type="number"
                  min={10}
                  max={10000}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white tabular-nums focus:outline-hidden"
                />
                <input
                  id="create-feed-speaker"
                  aria-label="Konuşmacı Adı"
                  type="text"
                  value={speakerName}
                  onChange={(e) => setSpeakerName(e.target.value)}
                  placeholder="Konuşmacı"
                  className="w-full px-2.5 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-1">
            <label className="inline-flex items-center gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="rounded border-neutral-300 dark:border-neutral-700 text-blue-600 focus:ring-blue-500"
              />
              <span>Duyuruyu panonun ve genel akışın üst bölümünde öne çıkar</span>
            </label>
          </div>
        )}

        <div className="flex items-center justify-end pt-1">
          <button
            type="submit"
            disabled={isSubmitting}
            data-testid="submit-feed-post-btn"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold transition cursor-pointer whitespace-nowrap"
          >
            {isEventSelected ? (
              <CalendarPlus className="w-4 h-4" />
            ) : (
              <Megaphone className="w-4 h-4" />
            )}
            <span>
              {isEventSelected
                ? 'Etkinliği Genel Akışta Yayınla'
                : 'Duyuruyu Genel Akışta Yayınla'}
            </span>
          </button>
        </div>
      </form>
    </section>
  );
};
