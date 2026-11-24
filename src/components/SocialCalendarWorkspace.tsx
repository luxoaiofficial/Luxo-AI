import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  MessageSquare,
  UserCircle,
} from 'lucide-react';
import type { LuxoUser } from '../types/luxo';
import {
  type AnnouncementPriority,
  createEmptyGraph,
  createInitialSocialPlatformState,
  ensureUserInitializedInState,
  EVENT_CATEGORIES,
  type EventCategory,
  hydrateSocialPlatformState,
  normalizeHandle,
  type PlatformUserRole,
  sanitizePlatformId,
  type SocialPlatformState,
  type SocialRoomMessage,
} from '../utils/socialPlatformEngine';
import {
  createAnnouncementInFirestore,
  createEventInFirestore,
  isVerifiedFirebaseAdmin,
  syncPrivateRoomToFirestore,
  syncPublicSocialProfileToFirestore,
  syncRoomMessageToFirestore,
  syncSocialConnectionToFirestore,
  syncUserFavoriteToFirestore,
} from '../firebase';
import { CalendarAnnouncementsTab } from './CalendarAnnouncementsTab';
import {
  CreateEventAnnouncementForm,
  type CreateEventAnnouncementPayload,
} from './CreateEventAnnouncementForm';
import { SocialMessagingTab } from './SocialMessagingTab';
import { UserProfilesNetworkTab } from './UserProfilesNetworkTab';

export type SocialWorkspaceSection = 'calendar' | 'messages' | 'profiles';

const LOCAL_SOCIAL_ROLE_KEY = 'luxo_social_actor_role_v1';
const LOCAL_SOCIAL_UID_KEY = 'luxo_social_actor_uid_v1';

function resolveStableSocialUid(user: LuxoUser): string {
  if (!user.isGuest && user.id && user.id !== 'guest-init') {
    return sanitizePlatformId(user.id, 'usr');
  }
  const saved = localStorage.getItem(LOCAL_SOCIAL_UID_KEY);
  if (saved) {
    return sanitizePlatformId(saved, 'usr');
  }
  const fresh = `usr_${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(LOCAL_SOCIAL_UID_KEY, fresh);
  return fresh;
}

interface SocialCalendarWorkspaceProps {
  user: LuxoUser;
  onBack: () => void;
  onUpdateAppUser?: (updates: Partial<LuxoUser>) => void;
}

export const SocialCalendarWorkspace: React.FC<SocialCalendarWorkspaceProps> = ({
  user,
  onBack,
  onUpdateAppUser,
}) => {
  const currentUid = useMemo(() => resolveStableSocialUid(user), [user]);
  const verifiedAdmin = isVerifiedFirebaseAdmin();

  const [activeTab, setActiveTab] = useState<SocialWorkspaceSection>(() => {
    const params = new URLSearchParams(window.location.search);
    const sub = params.get('tab');
    if (sub === 'messages' || sub === 'profiles') return sub;
    return 'calendar';
  });

  const [actorRole, setActorRole] = useState<PlatformUserRole>(() => {
    if (isVerifiedFirebaseAdmin()) return 'admin';
    return localStorage.getItem(LOCAL_SOCIAL_ROLE_KEY) === 'admin'
      ? 'admin'
      : 'member';
  });

  const [platformState, setPlatformState] = useState<SocialPlatformState>(() =>
    ensureUserInitializedInState(createInitialSocialPlatformState(), {
      uid: currentUid,
      displayName:
        user.name && user.name !== 'Misafir Kullanıcı'
          ? user.name
          : 'Topluluk Üyesi',
      avatarUrl: user.avatarUrl,
    })
  );

  const [onlineUids, setOnlineUids] = useState<string[]>([
    'member_selin',
    'member_mert',
    'member_kerem',
    currentUid,
  ]);
  const [activeRoomId, setActiveRoomId] = useState<string>(
    'room_general_engineering'
  );
  const [typingByRoom, setTypingByRoom] = useState<Record<string, string>>({});
  const [isWsConnected, setIsWsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRoomRef = useRef(activeRoomId);
  activeRoomRef.current = activeRoomId;
  const [adminToken, setAdminToken] = useState<string>('');

  const ensureServerAdminToken = useCallback(async (): Promise<string> => {
    if (adminToken) return adminToken;
    try {
      const resp = await fetch('/api/social/admin-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: currentUid,
          displayName:
            user.name && user.name !== 'Misafir Kullanıcı'
              ? user.name
              : 'Platform Yönetimi',
        }),
      });
      const data = await resp.json();
      if (resp.ok && data?.ok && typeof data.adminToken === 'string') {
        setAdminToken(data.adminToken);
        return data.adminToken;
      }
    } catch {
      // fallback handled by server rejection
    }
    return '';
  }, [adminToken, currentUid, user.name]);

  useEffect(() => {
    if (verifiedAdmin && actorRole !== 'admin') {
      setActorRole('admin');
    }
  }, [verifiedAdmin, actorRole]);

  useEffect(() => {
    if (actorRole === 'admin' && !adminToken) {
      void ensureServerAdminToken();
    }
  }, [actorRole, adminToken, ensureServerAdminToken]);

  const handleChangeRole = (nextRole: PlatformUserRole) => {
    setActorRole(nextRole);
    localStorage.setItem(LOCAL_SOCIAL_ROLE_KEY, nextRole);
    if (nextRole === 'admin') {
      void ensureServerAdminToken();
    }
  };

  // Initial authoritative HTTP fetch
  useEffect(() => {
    const displayName =
      user.name && user.name !== 'Misafir Kullanıcı'
        ? user.name
        : 'Topluluk Üyesi';
    const qs = new URLSearchParams({
      uid: currentUid,
      name: displayName,
      ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}),
    });
    fetch(`/api/social/state?${qs.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.ok && data.state) {
          setPlatformState(hydrateSocialPlatformState(data.state));
          if (Array.isArray(data.onlineUids)) {
            setOnlineUids(data.onlineUids);
          }
        }
      })
      .catch(() => {});
  }, [currentUid, user.name, user.avatarUrl]);

  // Real-time WebSocket connection (/ws/social) with idempotent delta reconciliation & auto-reconnect
  useEffect(() => {
    let unmounted = false;

    const connect = () => {
      if (unmounted) return;
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socket = new WebSocket(`${proto}//${window.location.host}/ws/social`);
      wsRef.current = socket;

      socket.onopen = () => {
        if (unmounted) return;
        setIsWsConnected(true);
        const displayName =
          user.name && user.name !== 'Misafir Kullanıcı'
            ? user.name
            : 'Topluluk Üyesi';
        socket.send(
          JSON.stringify({
            type: 'social:join',
            uid: currentUid,
            displayName,
            avatarUrl: user.avatarUrl,
            activeRoomId: activeRoomRef.current,
          })
        );
      };

      socket.onmessage = (ev) => {
        try {
          const payload = JSON.parse(String(ev.data)) as Record<string, unknown>;
          const eventType = String(payload.type || '');

          if (eventType === 'social:init' || eventType === 'social:sync') {
            if (payload.state && typeof payload.state === 'object') {
              setPlatformState(
                hydrateSocialPlatformState(
                  payload.state as Partial<SocialPlatformState>
                )
              );
            }
            if (Array.isArray(payload.onlineUids)) {
              setOnlineUids(payload.onlineUids.map(String));
            }
            return;
          }

          if (eventType === 'social:presence' && Array.isArray(payload.onlineUids)) {
            setOnlineUids(payload.onlineUids.map(String));
            return;
          }

          if (eventType === 'social:typing') {
            const rId = String(payload.roomId || '');
            const peerName = String(payload.displayName || 'Üye');
            const isTyping = Boolean(payload.isTyping);
            setTypingByRoom((prev) => {
              const copy = { ...prev };
              if (isTyping) {
                copy[rId] = peerName;
              } else {
                delete copy[rId];
              }
              return copy;
            });
            return;
          }

          if (
            eventType === 'social:message' &&
            payload.message &&
            typeof payload.message === 'object'
          ) {
            const incomingMsg = payload.message as SocialRoomMessage;
            const rId = String(payload.roomId || incomingMsg.roomId || '');
            setPlatformState((prev) => {
              const existingList = prev.messagesByRoom[rId] || [];
              if (existingList.some((m) => m.id === incomingMsg.id)) {
                return prev;
              }
              return {
                ...prev,
                rooms: Array.isArray(payload.rooms)
                  ? (payload.rooms as SocialPlatformState['rooms'])
                  : prev.rooms,
                messagesByRoom: {
                  ...prev.messagesByRoom,
                  [rId]: [...existingList, incomingMsg].slice(-250),
                },
                lastUpdatedAt: Date.now(),
              };
            });
          }
        } catch {
          // ignore malformed frames
        }
      };

      socket.onclose = () => {
        setIsWsConnected(false);
        if (!unmounted) {
          reconnectTimerRef.current = setTimeout(connect, 2400);
        }
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    connect();

    const heartbeat = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25_000);

    return () => {
      unmounted = true;
      clearInterval(heartbeat);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [currentUid, user.name, user.avatarUrl]);

  const myGraph = platformState.graphs[currentUid] || createEmptyGraph();
  const myProfile = platformState.profiles[currentUid];

  const handleToggleFavorite = useCallback(
    async (targetType: 'event' | 'announcement', targetId: string) => {
      try {
        const resp = await fetch('/api/social/favorites/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: currentUid,
            displayName: myProfile?.displayName || user.name,
            targetType,
            targetId,
          }),
        });
        const data = await resp.json();
        if (data?.ok && data.state) {
          setPlatformState(hydrateSocialPlatformState(data.state));
          void syncUserFavoriteToFirestore(
            targetType,
            targetId,
            Boolean(data.favorited)
          ).catch(() => {});
        }
      } catch {
        // ignore network hiccup
      }
    },
    [currentUid, myProfile?.displayName, user.name]
  );

  const handleCreateEvent = useCallback(
    async (input: {
      title: string;
      description: string;
      category: EventCategory;
      dateIso: string;
      startTime: string;
      endTime: string;
      location: string;
      speakerName: string;
      capacity: number;
    }): Promise<{ ok: boolean; error?: string }> => {
      try {
        const token =
          actorRole === 'admin' ? await ensureServerAdminToken() : '';
        const resp = await fetch('/api/social/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'x-luxo-admin-token': token } : {}),
          },
          body: JSON.stringify({
            ...input,
            createdByUid: currentUid,
            createdByName: myProfile?.displayName || 'Platform Yönetimi',
          }),
        });
        const data = await resp.json();
        if (!resp.ok || !data?.ok) {
          return { ok: false, error: data?.error || 'Etkinlik oluşturulamadı.' };
        }
        setPlatformState(hydrateSocialPlatformState(data.state));
        if (data.event) {
          void createEventInFirestore(data.event).catch(() => {});
        }
        return { ok: true };
      } catch {
        return { ok: false, error: 'Sunucu bağlantısı kurulamadı.' };
      }
    },
    [actorRole, currentUid, ensureServerAdminToken, myProfile?.displayName]
  );

  const handleCreateAnnouncement = useCallback(
    async (input: {
      title: string;
      summary: string;
      priority: AnnouncementPriority;
      tag: string;
      pinned: boolean;
      dateIso?: string;
    }): Promise<{ ok: boolean; error?: string }> => {
      try {
        const token =
          actorRole === 'admin' ? await ensureServerAdminToken() : '';
        const resp = await fetch('/api/social/announcements', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'x-luxo-admin-token': token } : {}),
          },
          body: JSON.stringify({
            ...input,
            createdByUid: currentUid,
            createdByName: myProfile?.displayName || 'Platform Yönetimi',
          }),
        });
        const data = await resp.json();
        if (!resp.ok || !data?.ok) {
          return { ok: false, error: data?.error || 'Duyuru yayınlanamadı.' };
        }
        setPlatformState(hydrateSocialPlatformState(data.state));
        if (data.announcement) {
          void createAnnouncementInFirestore(data.announcement).catch(() => {});
        }
        return { ok: true };
      } catch {
        return { ok: false, error: 'Sunucu bağlantısı sağlanamadı.' };
      }
    },
    [actorRole, currentUid, ensureServerAdminToken, myProfile?.displayName]
  );

  const handleCreateFeedPost = useCallback(
    async (
      payload: CreateEventAnnouncementPayload
    ): Promise<{
      ok: boolean;
      kind?: 'event' | 'announcement';
      error?: string;
    }> => {
      if (actorRole !== 'admin') {
        return {
          ok: false,
          error: 'Yalnızca yetkili yöneticiler genel akışta içerik paylaşabilir.',
        };
      }

      const isEventCategory = (EVENT_CATEGORIES as readonly string[]).includes(
        payload.eventType
      );

      if (isEventCategory) {
        const res = await handleCreateEvent({
          title: payload.title,
          description: payload.description,
          category: payload.eventType as EventCategory,
          dateIso: payload.dateIso,
          startTime: payload.startTime || '19:00',
          endTime: payload.endTime || '20:30',
          location: payload.location || 'Çevrimiçi Canlı Yayın',
          speakerName: payload.speakerName,
          capacity: payload.capacity || 250,
        });
        return { ...res, kind: 'event' };
      }

      const priorityMap: Record<string, AnnouncementPriority> = {
        'Resmi Duyuru · Önemli': 'Önemli',
        'Platform Güncellemesi': 'Güncelleme',
        'Topluluk Duyurusu': 'Topluluk',
      };
      const priority: AnnouncementPriority =
        priorityMap[payload.eventType] || 'Önemli';

      const res = await handleCreateAnnouncement({
        title: payload.title,
        summary: payload.description,
        priority,
        tag: payload.eventType,
        pinned: payload.pinned,
        dateIso: payload.dateIso,
      });
      return { ...res, kind: 'announcement' };
    },
    [actorRole, handleCreateAnnouncement, handleCreateEvent]
  );

  const handleSaveProfile = useCallback(
    async (input: {
      displayName: string;
      roleTitle: string;
      bio: string;
      interests: string[];
      avatarUrl: string;
    }): Promise<{ ok: boolean; error?: string }> => {
      try {
        const resp = await fetch('/api/social/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: currentUid,
            handle: normalizeHandle(input.displayName),
            ...input,
          }),
        });
        const data = await resp.json();
        if (!resp.ok || !data?.ok) {
          return { ok: false, error: data?.error || 'Profil kaydedilemedi.' };
        }
        setPlatformState(hydrateSocialPlatformState(data.state));
        if (onUpdateAppUser && data.profile) {
          onUpdateAppUser({
            name: data.profile.displayName,
            avatarText: data.profile.avatarInitials,
            ...(data.profile.avatarUrl.startsWith('/uploads/') ||
            data.profile.avatarUrl.startsWith('http')
              ? { avatarUrl: data.profile.avatarUrl }
              : {}),
          });
        }
        if (data.profile) {
          void syncPublicSocialProfileToFirestore({
            displayName: data.profile.displayName,
            handle: data.profile.handle,
            roleTitle: data.profile.roleTitle,
            bio: data.profile.bio,
            avatarUrl: data.profile.avatarUrl,
            interests: data.profile.interests,
          }).catch(() => {});
        }
        return { ok: true };
      } catch {
        return { ok: false, error: 'Profil kaydedilirken hata oluştu.' };
      }
    },
    [currentUid, onUpdateAppUser]
  );

  const handleUploadAvatarDataUrl = useCallback(
    async (
      dataUrl: string
    ): Promise<{ ok: boolean; avatarUrl?: string; error?: string }> => {
      try {
        const resp = await fetch('/api/social/upload-avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl }),
        });
        const data = await resp.json();
        if (!resp.ok || !data?.ok) {
          return { ok: false, error: data?.error || 'Görsel yüklenemedi.' };
        }
        return { ok: true, avatarUrl: data.avatarUrl };
      } catch {
        return { ok: false, error: 'Yükleme servisine ulaşılamadı.' };
      }
    },
    []
  );

  const handleToggleFollow = useCallback(
    async (targetUid: string) => {
      try {
        const resp = await fetch('/api/social/follow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actorUid: currentUid,
            actorName: myProfile?.displayName || user.name,
            targetUid,
          }),
        });
        const data = await resp.json();
        if (data?.ok && data.state) {
          const hydrated = hydrateSocialPlatformState(data.state);
          setPlatformState(hydrated);
          const g = hydrated.graphs[currentUid] || createEmptyGraph();
          const f = g.followingUids.includes(targetUid);
          const fr = g.friendUids.includes(targetUid);
          const rel = f && fr ? 'both' : fr ? 'friend' : f ? 'following' : 'none';
          void syncSocialConnectionToFirestore(targetUid, rel).catch(() => {});
        }
      } catch {
        // ignore
      }
    },
    [currentUid, myProfile?.displayName, user.name]
  );

  const handleMutateFriend = useCallback(
    async (
      targetUid: string,
      action: 'add' | 'accept' | 'reject' | 'remove'
    ) => {
      try {
        const resp = await fetch('/api/social/friends', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actorUid: currentUid,
            actorName: myProfile?.displayName || user.name,
            targetUid,
            action,
          }),
        });
        const data = await resp.json();
        if (data?.ok && data.state) {
          const hydrated = hydrateSocialPlatformState(data.state);
          setPlatformState(hydrated);
          const g = hydrated.graphs[currentUid] || createEmptyGraph();
          const f = g.followingUids.includes(targetUid);
          const fr = g.friendUids.includes(targetUid);
          const rel = f && fr ? 'both' : fr ? 'friend' : f ? 'following' : 'none';
          void syncSocialConnectionToFirestore(targetUid, rel).catch(() => {});
        }
      } catch {
        // ignore
      }
    },
    [currentUid, myProfile?.displayName, user.name]
  );

  const handleStartDirectMessage = useCallback(
    async (targetUid: string) => {
      try {
        const resp = await fetch('/api/social/rooms/direct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actorUid: currentUid,
            actorName: myProfile?.displayName || user.name,
            targetUid,
          }),
        });
        const data = await resp.json();
        if (data?.ok && data.room) {
          if (data.state) {
            setPlatformState(hydrateSocialPlatformState(data.state));
          }
          setActiveRoomId(data.room.id);
          setActiveTab('messages');
          void syncPrivateRoomToFirestore({
            id: data.room.id,
            name: data.room.name,
            topic: data.room.topic,
            roomType: 'direct',
            memberUids: data.room.memberUids,
          }).catch(() => {});
        }
      } catch {
        // ignore
      }
    },
    [currentUid, myProfile?.displayName, user.name]
  );

  const handleCreatePrivateRoom = useCallback(
    async (input: {
      name: string;
      topic: string;
      roomType: 'private-room' | 'public-room';
      invitedMemberUids: string[];
    }): Promise<{ ok: boolean; roomId?: string; error?: string }> => {
      try {
        const resp = await fetch('/api/social/rooms/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ownerUid: currentUid,
            ownerName: myProfile?.displayName || user.name,
            ...input,
          }),
        });
        const data = await resp.json();
        if (!resp.ok || !data?.ok || !data.room) {
          return { ok: false, error: data?.error || 'Sohbet odası oluşturulamadı.' };
        }
        setPlatformState(hydrateSocialPlatformState(data.state));
        setActiveRoomId(data.room.id);
        if (data.room.roomType === 'private-room') {
          void syncPrivateRoomToFirestore({
            id: data.room.id,
            name: data.room.name,
            topic: data.room.topic,
            roomType: 'private-room',
            memberUids: data.room.memberUids,
          }).catch(() => {});
        }
        return { ok: true, roomId: data.room.id };
      } catch {
        return { ok: false, error: 'Sunucu bağlantısı sağlanamadı.' };
      }
    },
    [currentUid, myProfile?.displayName, user.name]
  );

  const handleSendRoomMessage = useCallback(
    async (
      roomId: string,
      content: string
    ): Promise<{ ok: boolean; error?: string }> => {
      const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      try {
        const resp = await fetch('/api/social/rooms/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: msgId,
            roomId,
            senderUid: currentUid,
            senderName: myProfile?.displayName || user.name,
            content,
          }),
        });
        const data = await resp.json();
        if (!resp.ok || !data?.ok) {
          return { ok: false, error: data?.error || 'Mesaj gönderilemedi.' };
        }
        if (data.state) {
          setPlatformState(hydrateSocialPlatformState(data.state));
        }
        const targetRoom = platformState.rooms.find((r) => r.id === roomId);
        if (targetRoom && targetRoom.roomType !== 'public-room' && data.message) {
          void syncRoomMessageToFirestore({
            roomId,
            messageId: data.message.id,
            senderName: data.message.senderName,
            content: data.message.content,
            visibleToUids: targetRoom.memberUids,
          }).catch(() => {});
        }
        return { ok: true };
      } catch {
        return { ok: false, error: 'Mesaj iletilemedi.' };
      }
    },
    [currentUid, myProfile?.displayName, user.name, platformState.rooms]
  );

  const handleTypingChange = useCallback((roomId: string, isTyping: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'typing:update',
          roomId,
          isTyping,
        })
      );
    }
  }, []);

  const handleSelectRoom = useCallback((roomId: string) => {
    setActiveRoomId(roomId);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'room:focus',
          roomId,
        })
      );
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-[#141518] text-neutral-900 dark:text-neutral-100 overflow-hidden">
      {/* Top 3-Zone Header */}
      <header className="flex items-center justify-between gap-2 sm:gap-6 px-3 sm:px-6 py-3 bg-white dark:bg-[#18181b] border-b border-neutral-200 dark:border-neutral-800 shrink-0 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sohbete Dön</span>
            <span className="sm:hidden">Geri</span>
          </button>
          <h1 className="text-sm sm:text-lg font-bold tracking-tight text-neutral-900 dark:text-white truncate min-w-0">
            Etkinlik Takvimi & Sosyal Ağ
          </h1>
        </div>

        {/* Center Segmented Section Switcher */}
        <nav
          aria-label="Sosyal Platform Bölümleri"
          className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
        >
          <button
            type="button"
            data-testid="social-tab-calendar"
            onClick={() => setActiveTab('calendar')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'calendar'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Takvim & Duyurular</span>
          </button>

          <button
            type="button"
            data-testid="social-tab-messages"
            onClick={() => setActiveTab('messages')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'messages'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Mesajlar & Özel Odalar</span>
          </button>

          <button
            type="button"
            data-testid="social-tab-profiles"
            onClick={() => setActiveTab('profiles')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
              activeTab === 'profiles'
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <UserCircle className="w-3.5 h-3.5" />
            <span>Profiller & Arkadaşlar ({myGraph.friendUids.length})</span>
          </button>
        </nav>

        {/* Right Zone: Live Connection & Quick Profile Action */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300 tabular-nums whitespace-nowrap">
            <span
              className={`w-2 h-2 rounded-full ${
                isWsConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span>{onlineUids.length} çevrimiçi</span>
          </span>
          <button
            type="button"
            onClick={() => setActiveTab('profiles')}
            className="px-3.5 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            Profilim
          </button>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex items-center gap-1 px-4 py-2 bg-white dark:bg-[#18181b] border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-blue-600 text-white'
              : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          Takvim & Duyurular
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('messages')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'messages'
              ? 'bg-blue-600 text-white'
              : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          Mesajlar & Odalar
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('profiles')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'profiles'
              ? 'bg-blue-600 text-white'
              : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          Profiller & Arkadaşlar
        </button>
      </div>

      {/* Main Scrollable Viewport */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'calendar' && (
            <CalendarAnnouncementsTab
              events={platformState.events}
              announcements={platformState.announcements}
              favoriteEventIds={myGraph.favoriteEventIds}
              favoriteAnnouncementIds={myGraph.favoriteAnnouncementIds}
              actorRole={actorRole}
              isVerifiedAdminAccount={verifiedAdmin}
              onChangeActorRole={handleChangeRole}
              onToggleFavorite={handleToggleFavorite}
              adminCreateForm={
                actorRole === 'admin' ? (
                  <CreateEventAnnouncementForm
                    actorRole={actorRole}
                    isVerifiedAdminAccount={verifiedAdmin}
                    onSubmitPost={handleCreateFeedPost}
                  />
                ) : null
              }
            />
          )}

          {activeTab === 'messages' && (
            <SocialMessagingTab
              currentUid={currentUid}
              profiles={platformState.profiles}
              friendUids={myGraph.friendUids}
              onlineUids={onlineUids}
              rooms={platformState.rooms}
              messagesByRoom={platformState.messagesByRoom}
              activeRoomId={activeRoomId}
              typingPeerName={typingByRoom[activeRoomId] || null}
              isWsConnected={isWsConnected}
              onSelectRoom={handleSelectRoom}
              onCreatePrivateRoom={handleCreatePrivateRoom}
              onSendMessage={handleSendRoomMessage}
              onTypingChange={handleTypingChange}
              onOpenProfilesTab={() => setActiveTab('profiles')}
            />
          )}

          {activeTab === 'profiles' && (
            <UserProfilesNetworkTab
              currentUid={currentUid}
              profiles={platformState.profiles}
              graphs={platformState.graphs}
              onlineUids={onlineUids}
              onSaveProfile={handleSaveProfile}
              onUploadAvatarDataUrl={handleUploadAvatarDataUrl}
              onToggleFollow={handleToggleFollow}
              onMutateFriend={handleMutateFriend}
              onStartDirectMessage={handleStartDirectMessage}
            />
          )}
        </div>
      </main>
    </div>
  );
};
