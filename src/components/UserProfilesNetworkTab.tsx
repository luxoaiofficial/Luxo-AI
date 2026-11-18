import React, { useMemo, useRef, useState } from 'react';
import {
  Check,
  MessageSquare,
  Plus,
  Search,
  Upload,
  UserCheck,
  UserMinus,
  UserPlus,
  X,
} from 'lucide-react';
import {
  SUGGESTED_INTEREST_TAGS,
  type SocialUserProfile,
  type UserSocialGraph,
} from '../utils/socialPlatformEngine';
import { SocialAvatar, STUDIO_AVATAR_PRESETS } from './SocialAvatar';

type DirectoryFilter = 'all' | 'friends' | 'following' | 'requests';

function resizeImageFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Dosya okunamadı.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Görsel çözümlenemedi.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const targetSize = 256;
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Tuval başlatılamadı.'));
          return;
        }
        const minSide = Math.min(img.width, img.height);
        const sx = Math.max(0, (img.width - minSide) / 2);
        const sy = Math.max(0, (img.height - minSide) / 2);
        ctx.drawImage(
          img,
          sx,
          sy,
          minSide,
          minSide,
          0,
          0,
          targetSize,
          targetSize
        );
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

interface UserProfilesNetworkTabProps {
  currentUid: string;
  profiles: Record<string, SocialUserProfile>;
  graphs: Record<string, UserSocialGraph>;
  onlineUids: string[];
  onSaveProfile: (input: {
    displayName: string;
    roleTitle: string;
    bio: string;
    interests: string[];
    avatarUrl: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  onUploadAvatarDataUrl: (
    dataUrl: string
  ) => Promise<{ ok: boolean; avatarUrl?: string; error?: string }>;
  onToggleFollow: (targetUid: string) => Promise<void>;
  onMutateFriend: (
    targetUid: string,
    action: 'add' | 'accept' | 'reject' | 'remove'
  ) => Promise<void>;
  onStartDirectMessage: (targetUid: string) => Promise<void>;
}

export const UserProfilesNetworkTab: React.FC<UserProfilesNetworkTabProps> = ({
  currentUid,
  profiles,
  graphs,
  onlineUids,
  onSaveProfile,
  onUploadAvatarDataUrl,
  onToggleFollow,
  onMutateFriend,
  onStartDirectMessage,
}) => {
  const myProfile = profiles[currentUid];
  const myGraph: UserSocialGraph = graphs[currentUid] || {
    followingUids: [],
    followerUids: [],
    friendUids: [],
    incomingFriendRequests: [],
    outgoingFriendRequests: [],
    favoriteEventIds: [],
    favoriteAnnouncementIds: [],
  };

  const [displayName, setDisplayName] = useState(
    myProfile?.displayName || 'Topluluk Üyesi'
  );
  const [roleTitle, setRoleTitle] = useState(
    myProfile?.roleTitle || 'Ürün & Yazılım Geliştirici'
  );
  const [bio, setBio] = useState(
    myProfile?.bio ||
      'Yapay zeka sistemleri, gerçek zamanlı web mimarisi ve ürün geliştirme üzerine çalışıyorum.'
  );
  const [interests, setInterests] = useState<string[]>(
    myProfile?.interests || ['Yapay Zeka', 'TypeScript', 'UI/UX Tasarım']
  );
  const [customInterest, setCustomInterest] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(
    myProfile?.avatarUrl || 'preset:selin'
  );
  const [customAvatarUrlInput, setCustomAvatarUrlInput] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [directoryFilter, setDirectoryFilter] =
    useState<DirectoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleToggleInterest = (tag: string) => {
    setInterests((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      }
      if (prev.length >= 10) return prev;
      return [...prev, tag];
    });
  };

  const handleAddCustomInterest = () => {
    const cleaned = customInterest.trim().slice(0, 32);
    if (cleaned.length < 2) return;
    if (!interests.includes(cleaned) && interests.length < 10) {
      setInterests((prev) => [...prev, cleaned]);
    }
    setCustomInterest('');
  };

  const handleAvatarFileSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileError(null);
    setProfileStatus(null);
    setIsUploadingAvatar(true);
    try {
      const resizedDataUrl = await resizeImageFileToDataUrl(file);
      const uploaded = await onUploadAvatarDataUrl(resizedDataUrl);
      if (!uploaded.ok || !uploaded.avatarUrl) {
        setProfileError(uploaded.error || 'Profil resmi yüklenemedi.');
      } else {
        setAvatarUrl(uploaded.avatarUrl);
        setProfileStatus('Profil resmi yüklendi. Kaydet düğmesiyle profilinize uygulayın.');
      }
    } catch {
      setProfileError('Seçilen görsel dosyası işlenemedi.');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileStatus(null);
    setIsSaving(true);
    try {
      const resolvedAvatar = customAvatarUrlInput.trim()
        ? customAvatarUrlInput.trim()
        : avatarUrl;
      const res = await onSaveProfile({
        displayName,
        roleTitle,
        bio,
        interests,
        avatarUrl: resolvedAvatar,
      });
      if (!res.ok) {
        setProfileError(res.error || 'Profil güncellenemedi.');
      } else {
        if (customAvatarUrlInput.trim()) {
          setAvatarUrl(customAvatarUrlInput.trim());
          setCustomAvatarUrlInput('');
        }
        setProfileStatus('Profil bilgileriniz, ilgi alanlarınız ve resminiz kaydedildi.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const peerProfiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return Object.values(profiles)
      .filter((p) => p.uid !== currentUid)
      .filter((p) => {
        if (directoryFilter === 'friends') {
          return myGraph.friendUids.includes(p.uid);
        }
        if (directoryFilter === 'following') {
          return myGraph.followingUids.includes(p.uid);
        }
        if (directoryFilter === 'requests') {
          return myGraph.incomingFriendRequests.includes(p.uid);
        }
        return true;
      })
      .filter((p) => {
        if (!q) return true;
        return (
          p.displayName.toLowerCase().includes(q) ||
          p.roleTitle.toLowerCase().includes(q) ||
          p.bio.toLowerCase().includes(q) ||
          p.interests.some((i) => i.toLowerCase().includes(q))
        );
      });
  }, [profiles, currentUid, directoryFilter, myGraph, searchQuery]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* Left 5 Columns: Personal User Profile Card & Editor */}
      <section className="xl:col-span-5 p-5 rounded-2xl bg-white dark:bg-[#1e1f23] border border-neutral-200 dark:border-neutral-800 space-y-5">
        <div className="flex items-start gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <SocialAvatar
            avatarUrl={customAvatarUrlInput.trim() || avatarUrl}
            name={displayName}
            sizeClassName="w-16 h-16"
            textClassName="text-lg"
            isOnline={true}
          />
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white truncate">
              {myProfile?.displayName || displayName}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
              @{myProfile?.handle || 'kullanici'} ·{' '}
              {myProfile?.roleTitle || roleTitle}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300 pt-1 tabular-nums">
              <span data-testid="my-friends-count">
                <strong className="font-semibold text-neutral-900 dark:text-white">
                  {myGraph.friendUids.length}
                </strong>{' '}
                Arkadaş
              </span>
              <span aria-hidden="true">·</span>
              <span data-testid="my-following-count">
                <strong className="font-semibold text-neutral-900 dark:text-white">
                  {myGraph.followingUids.length}
                </strong>{' '}
                Takip Edilen
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <strong className="font-semibold text-neutral-900 dark:text-white">
                  {myGraph.followerUids.length}
                </strong>{' '}
                Takipçi
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProfileSubmit} className="space-y-4">
          {profileError && (
            <p
              role="alert"
              className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl px-3 py-2"
            >
              {profileError}
            </p>
          )}
          {profileStatus && (
            <p
              role="status"
              className="text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl px-3 py-2"
            >
              {profileStatus}
            </p>
          )}

          {/* Avatar Selection & Upload */}
          <div className="space-y-2">
            <span className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Profil Resmi Seçimi veya Yükleme
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              {STUDIO_AVATAR_PRESETS.map((preset) => {
                const selected =
                  !customAvatarUrlInput.trim() && avatarUrl === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setAvatarUrl(preset.id);
                      setCustomAvatarUrlInput('');
                    }}
                    aria-label={preset.label}
                    className={`p-0.5 rounded-full border-2 transition cursor-pointer ${
                      selected
                        ? 'border-blue-600'
                        : 'border-transparent hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <SocialAvatar
                      avatarUrl={preset.id}
                      name={preset.label}
                      sizeClassName="w-11 h-11"
                    />
                  </button>
                );
              })}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarFileSelected}
                className="hidden"
              />
              <button
                type="button"
                disabled={isUploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-800 dark:text-neutral-200 transition cursor-pointer whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>
                  {isUploadingAvatar ? 'Yükleniyor...' : ' Görsel Yükle'}
                </span>
              </button>
            </div>

            <input
              type="url"
              value={customAvatarUrlInput}
              onChange={(e) => setCustomAvatarUrlInput(e.target.value)}
              placeholder="Veya HTTPS profil resmi bağlantısı yapıştırın..."
              aria-label="Profil resmi bağlantısı"
              className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="profile-display-name"
                className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1"
              >
                Görünen Ad
              </label>
              <input
                id="profile-display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="profile-role-title"
                className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1"
              >
                Unvan / Uzmanlık Alanı
              </label>
              <input
                id="profile-role-title"
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="profile-bio-input"
                className="text-xs font-medium text-neutral-700 dark:text-neutral-300"
              >
                Biyografi
              </label>
              <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
                {bio.length}/280
              </span>
            </div>
            <textarea
              id="profile-bio-input"
              rows={3}
              maxLength={280}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Çalıştığınız projeleri, odak alanlarınızı ve topluluk ilgi konularınızı kısaca paylaşın..."
              className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white resize-none focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Interests Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                İlgi Alanları
              </span>
              <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
                {interests.length}/10 seçili
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_INTEREST_TAGS.map((tag) => {
                const active = interests.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleInterest(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            {/* Custom added interests outside suggested list */}
            {interests.some((i) => !SUGGESTED_INTEREST_TAGS.includes(i)) && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {interests
                  .filter((i) => !SUGGESTED_INTEREST_TAGS.includes(i))
                  .map((custom) => (
                    <button
                      key={custom}
                      type="button"
                      onClick={() => handleToggleInterest(custom)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-600 text-white cursor-pointer"
                    >
                      <span>{custom}</span>
                      <X className="w-3 h-3" />
                    </button>
                  ))}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomInterest();
                  }
                }}
                placeholder="Özel ilgi alanı ekle (Örn: Rust, Grafik Motorları)"
                aria-label="Özel ilgi alanı ekle"
                className="flex-1 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddCustomInterest}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ekle</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Kaydediliyor...' : 'Profili Kaydet'}</span>
          </button>
        </form>
      </section>

      {/* Right 7 Columns: Member Directory, Follow & Friends List */}
      <section className="xl:col-span-7 space-y-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1e1f23] border border-neutral-200 dark:border-neutral-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div
              role="group"
              aria-label="Üye ve Arkadaş Listesi Filtreleri"
              className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
            >
              <button
                type="button"
                onClick={() => setDirectoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                  directoryFilter === 'all'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Tüm Üyeler
              </button>
              <button
                type="button"
                data-testid="filter-friends-tab"
                onClick={() => setDirectoryFilter('friends')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                  directoryFilter === 'friends'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Arkadaşlarım ({myGraph.friendUids.length})
              </button>
              <button
                type="button"
                onClick={() => setDirectoryFilter('following')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                  directoryFilter === 'following'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Takip Ettiklerim ({myGraph.followingUids.length})
              </button>
              <button
                type="button"
                onClick={() => setDirectoryFilter('requests')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                  directoryFilter === 'requests'
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                Gelen İstekler ({myGraph.incomingFriendRequests.length})
              </button>
            </div>

            <div className="relative min-w-[210px]">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Üye, uzmanlık veya ilgi ara..."
                aria-label="Üye veya ilgi alanı ara"
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {peerProfiles.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#1e1f23] border border-neutral-200 dark:border-neutral-800 text-center space-y-2">
            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              Bu görünümde gösterilecek kullanıcı bulunamadı.
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Tüm Üyeler sekmesine geçerek yeni kişileri takip edebilir veya arkadaş listenize ekleyebilirsiniz.
            </p>
            {directoryFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setDirectoryFilter('all')}
                className="mt-1 px-3.5 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold cursor-pointer"
              >
                Tüm Üyeleri Göster
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3" data-testid="member-directory-list">
            {peerProfiles.map((peer) => {
              const peerGraph = graphs[peer.uid];
              const isFollowing = myGraph.followingUids.includes(peer.uid);
              const isFriend = myGraph.friendUids.includes(peer.uid);
              const hasIncomingRequest =
                myGraph.incomingFriendRequests.includes(peer.uid);
              const isOnline =
                onlineUids.includes(peer.uid) || Boolean(peer.isOnline);
              const followerCount = peerGraph?.followerUids.length ?? 0;

              return (
                <article
                  key={peer.uid}
                  className="p-5 rounded-2xl bg-white dark:bg-[#1e1f23] border border-neutral-200 dark:border-neutral-800 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <SocialAvatar
                        avatarUrl={peer.avatarUrl}
                        name={peer.displayName}
                        sizeClassName="w-12 h-12"
                        textClassName="text-sm"
                        isOnline={isOnline}
                      />
                      <div className="min-w-0 space-y-0.5">
                        <h3 className="text-base font-semibold text-neutral-900 dark:text-white truncate">
                          {peer.displayName}
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                          @{peer.handle} · {peer.roleTitle} · {followerCount}{' '}
                          takipçi
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onToggleFollow(peer.uid)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                          isFollowing
                            ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                            : 'bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        {isFollowing ? 'Takip Ediliyor' : 'Takip Et'}
                      </button>

                      {hasIncomingRequest ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onMutateFriend(peer.uid, 'accept')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>İsteği Onayla</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onMutateFriend(peer.uid, 'reject')}
                            className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-red-600 transition cursor-pointer whitespace-nowrap"
                          >
                            Reddet
                          </button>
                        </>
                      ) : isFriend ? (
                        <button
                          type="button"
                          onClick={() => onMutateFriend(peer.uid, 'remove')}
                          aria-label={`${peer.displayName} kişisini arkadaş listesinden çıkar`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-700 dark:text-emerald-300 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          <span>Arkadaşlarda</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onMutateFriend(peer.uid, 'add')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Arkadaş Ekle</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onStartDirectMessage(peer.uid)}
                        aria-label={`${peer.displayName} ile mesajlaş`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Mesaj Gönder</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                    {peer.bio}
                  </p>

                  {peer.interests.length > 0 && (
                    <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-xs text-neutral-500 dark:text-neutral-400">
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">
                        İlgi Alanları:{' '}
                      </span>
                      <span>{peer.interests.join(' · ')}</span>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
