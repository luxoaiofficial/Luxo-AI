import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Hash,
  Lock,
  MessageSquare,
  Plus,
  Send,
  Users,
  X,
} from 'lucide-react';
import {
  listVisibleRoomsForUser,
  type SocialChatRoom,
  type SocialRoomMessage,
  type SocialUserProfile,
} from '../utils/socialPlatformEngine';
import { SocialAvatar } from './SocialAvatar';

interface SocialMessagingTabProps {
  currentUid: string;
  profiles: Record<string, SocialUserProfile>;
  friendUids: string[];
  onlineUids: string[];
  rooms: SocialChatRoom[];
  messagesByRoom: Record<string, SocialRoomMessage[]>;
  activeRoomId: string;
  typingPeerName: string | null;
  isWsConnected: boolean;
  onSelectRoom: (roomId: string) => void;
  onCreatePrivateRoom: (input: {
    name: string;
    topic: string;
    roomType: 'private-room' | 'public-room';
    invitedMemberUids: string[];
  }) => Promise<{ ok: boolean; roomId?: string; error?: string }>;
  onSendMessage: (
    roomId: string,
    content: string
  ) => Promise<{ ok: boolean; error?: string }>;
  onTypingChange: (roomId: string, isTyping: boolean) => void;
  onOpenProfilesTab: () => void;
}

export const SocialMessagingTab: React.FC<SocialMessagingTabProps> = ({
  currentUid,
  profiles,
  friendUids,
  onlineUids,
  rooms,
  messagesByRoom,
  activeRoomId,
  typingPeerName,
  isWsConnected,
  onSelectRoom,
  onCreatePrivateRoom,
  onSendMessage,
  onTypingChange,
  onOpenProfilesTab,
}) => {
  const [draftMessage, setDraftMessage] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Create Private Room Modal / Drawer State
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomTopic, setNewRoomTopic] = useState('');
  const [newRoomType, setNewRoomType] = useState<'private-room' | 'public-room'>(
    'private-room'
  );
  const [invitedUids, setInvitedUids] = useState<string[]>(() =>
    friendUids.slice(0, 2)
  );
  const [roomError, setRoomError] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visibleRooms = useMemo(
    () => listVisibleRoomsForUser({ rooms } as never, currentUid),
    [rooms, currentUid]
  );

  const directRooms = useMemo(
    () => visibleRooms.filter((r) => r.roomType === 'direct'),
    [visibleRooms]
  );
  const privateRooms = useMemo(
    () => visibleRooms.filter((r) => r.roomType === 'private-room'),
    [visibleRooms]
  );
  const publicRooms = useMemo(
    () => visibleRooms.filter((r) => r.roomType === 'public-room'),
    [visibleRooms]
  );

  const activeRoom =
    visibleRooms.find((r) => r.id === activeRoomId) || visibleRooms[0] || null;

  const activeMessages = useMemo(
    () => (activeRoom ? messagesByRoom[activeRoom.id] || [] : []),
    [activeRoom, messagesByRoom]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, activeRoom?.id]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const selectablePeers = useMemo(() => {
    const allPeers = Object.values(profiles).filter((p) => p.uid !== currentUid);
    return allPeers.sort((a, b) => {
      const aFriend = friendUids.includes(a.uid) ? 0 : 1;
      const bFriend = friendUids.includes(b.uid) ? 0 : 1;
      if (aFriend !== bFriend) return aFriend - bFriend;
      return a.displayName.localeCompare(b.displayName, 'tr');
    });
  }, [profiles, currentUid, friendUids]);

  const resolveDirectRoomPeer = (room: SocialChatRoom): SocialUserProfile | null => {
    const peerUid = room.memberUids.find((id) => id !== currentUid);
    return peerUid ? profiles[peerUid] || null : null;
  };

  const handleToggleInvited = (uid: string) => {
    setInvitedUids((prev) =>
      prev.includes(uid)
        ? prev.filter((id) => id !== uid)
        : prev.length < 9
        ? [...prev, uid]
        : prev
    );
  };

  const handleCreateRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoomError(null);
    setIsCreatingRoom(true);
    try {
      const res = await onCreatePrivateRoom({
        name: newRoomName,
        topic: newRoomTopic,
        roomType: newRoomType,
        invitedMemberUids: invitedUids,
      });
      if (!res.ok) {
        setRoomError(res.error || 'Oda oluşturulamadı.');
      } else {
        setNewRoomName('');
        setNewRoomTopic('');
        setShowCreateRoom(false);
        if (res.roomId) {
          onSelectRoom(res.roomId);
        }
      }
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleSendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoom) return;
    setSendError(null);
    if (!draftMessage.trim()) {
      setSendError('Lütfen göndermek için bir mesaj yazın.');
      return;
    }
    setIsSending(true);
    try {
      const res = await onSendMessage(activeRoom.id, draftMessage);
      if (!res.ok) {
        setSendError(res.error || 'Mesaj gönderilemedi.');
      } else {
        setDraftMessage('');
        onTypingChange(activeRoom.id, false);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
      {/* Left 4 Columns: Rooms & Direct Messages Navigation */}
      <aside className="lg:col-span-4 rounded-2xl bg-white dark:bg-[#1e1f23] border border-neutral-200 dark:border-neutral-800 p-4 flex flex-col justify-between gap-4">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                Sohbet Odaları
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
                {visibleRooms.length} aktif kanal
              </p>
            </div>
            <button
              type="button"
              data-testid="open-create-room-btn"
              onClick={() => {
                setRoomError(null);
                setInvitedUids(friendUids.slice(0, 3));
                setShowCreateRoom((prev) => !prev);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Özel Oda Oluştur</span>
            </button>
          </div>

          {showCreateRoom && (
            <form
              onSubmit={handleCreateRoomSubmit}
              className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-neutral-900 dark:text-white">
                  Yeni Özel Sohbet Odası
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateRoom(false)}
                  aria-label="Oda oluşturma panelini kapat"
                  className="text-neutral-400 hover:text-neutral-800 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {roomError && (
                <p
                  role="alert"
                  className="text-xs font-medium text-red-600 dark:text-red-400"
                >
                  {roomError}
                </p>
              )}

              <div>
                <label
                  htmlFor="create-room-name"
                  className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                >
                  Oda Adı
                </label>
                <input
                  id="create-room-name"
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="Örn: Mimari Çekirdek Ekibi"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1e1f23] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="create-room-topic"
                  className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1"
                >
                  Oda Konusu (İsteğe Bağlı)
                </label>
                <input
                  id="create-room-topic"
                  type="text"
                  value={newRoomTopic}
                  onChange={(e) => setNewRoomTopic(e.target.value)}
                  placeholder="Örn: Dağıtık önbellek ve sürüm planlaması"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#1e1f23] border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div
                role="group"
                aria-label="Oda Gizlilik Türü"
                className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-white dark:bg-[#1e1f23] border border-neutral-200 dark:border-neutral-800"
              >
                <button
                  type="button"
                  onClick={() => setNewRoomType('private-room')}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    newRoomType === 'private-room'
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  Özel Oda
                </button>
                <button
                  type="button"
                  onClick={() => setNewRoomType('public-room')}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    newRoomType === 'public-room'
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  Açık Kanal
                </button>
              </div>

              {newRoomType === 'private-room' && (
                <div>
                  <span className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 tabular-nums">
                    Arkadaşlarını Davet Et ({invitedUids.length}/9)
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {selectablePeers.map((peer) => {
                      const checked = invitedUids.includes(peer.uid);
                      const isFriend = friendUids.includes(peer.uid);
                      return (
                        <label
                          key={peer.uid}
                          className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white dark:hover:bg-[#1e1f23] cursor-pointer text-xs"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleInvited(peer.uid)}
                              className="rounded border-neutral-300 dark:border-neutral-700 text-blue-600"
                            />
                            <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                              {peer.displayName}
                            </span>
                          </span>
                          {isFriend && (
                            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 shrink-0">
                              Arkadaş
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isCreatingRoom}
                className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer"
              >
                Odayı Oluştur ve Başlat
              </button>
            </form>
          )}

          {/* Direct Messages Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                Birebir Mesajlar
              </span>
              <button
                type="button"
                onClick={onOpenProfilesTab}
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Kişi Seç
              </button>
            </div>
            {directRooms.length === 0 ? (
              <p className="px-2 py-2 text-xs text-neutral-500 dark:text-neutral-400">
                Profiller sekmesinden bir arkadaşınıza tıklayarak birebir sohbet başlatabilirsiniz.
              </p>
            ) : (
              directRooms.map((room) => {
                const peer = resolveDirectRoomPeer(room);
                const isSelected = activeRoom?.id === room.id;
                const peerOnline = peer ? onlineUids.includes(peer.uid) : false;
                const count = (messagesByRoom[room.id] || []).length;
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => onSelectRoom(room.id)}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-200 border border-blue-500/30'
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/70 text-neutral-800 dark:text-neutral-200 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <SocialAvatar
                        avatarUrl={peer?.avatarUrl}
                        name={peer?.displayName || room.name}
                        sizeClassName="w-8 h-8"
                        textClassName="text-[11px]"
                        isOnline={peerOnline}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate">
                          {peer?.displayName || room.name}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                          {peer?.roleTitle || 'Birebir Mesaj'}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-400 tabular-nums shrink-0">
                      {count}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Private Rooms Section */}
          <div className="space-y-1.5">
            <div className="px-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              Özel Sohbet Odaları ({privateRooms.length})
            </div>
            {privateRooms.length === 0 ? (
              <p className="px-2 py-2 text-xs text-neutral-500 dark:text-neutral-400">
                Henüz özel oda yok. Arkadaşlarınızı davet ederek özel bir çalışma odası kurabilirsiniz.
              </p>
            ) : (
              privateRooms.map((room) => {
                const isSelected = activeRoom?.id === room.id;
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => onSelectRoom(room.id)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-200 border border-blue-500/30'
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/70 text-neutral-800 dark:text-neutral-200 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate">
                          {room.name}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate tabular-nums">
                          {room.memberUids.length} üye · Özel
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Public Channels Section */}
          <div className="space-y-1.5">
            <div className="px-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              Topluluk Kanalları
            </div>
            {publicRooms.map((room) => {
              const isSelected = activeRoom?.id === room.id;
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => onSelectRoom(room.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-left transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-200 border border-blue-500/30'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/70 text-neutral-800 dark:text-neutral-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Hash className="w-4 h-4 text-neutral-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">
                        {room.name}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                        {room.topic}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
          <span>Gerçek Zamanlı Soket</span>
          <span className="inline-flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300">
            <span
              className={`w-2 h-2 rounded-full ${
                isWsConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span>{isWsConnected ? 'Bağlı' : 'Yeniden Bağlanıyor'}</span>
          </span>
        </div>
      </aside>

      {/* Right 8 Columns: Active Chat Room Timeline & Composer */}
      <section className="lg:col-span-8 rounded-2xl bg-white dark:bg-[#1e1f23] border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden min-h-[600px]">
        {!activeRoom ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <MessageSquare className="w-8 h-8 text-neutral-400" />
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
              Sohbet Odası Seçilmedi
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm">
              Sol menüden bir kanal seçebilir veya arkadaşlarınızı davet ederek yeni bir özel sohbet odası oluşturabilirsiniz.
            </p>
          </div>
        ) : (
          <>
            {/* Room Header */}
            <header className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {activeRoom.roomType === 'private-room' ? (
                    <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  ) : activeRoom.roomType === 'direct' ? (
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  ) : (
                    <Hash className="w-4 h-4 text-neutral-500 shrink-0" />
                  )}
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-white truncate">
                    {activeRoom.roomType === 'direct'
                      ? resolveDirectRoomPeer(activeRoom)?.displayName ||
                        activeRoom.name
                      : activeRoom.name}
                  </h3>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate tabular-nums">
                  {activeRoom.roomType === 'private-room'
                    ? 'Özel Oda'
                    : activeRoom.roomType === 'direct'
                    ? 'Birebir Mesajlaşma'
                    : 'Açık Topluluk Kanalı'}{' '}
                  · {activeRoom.memberUids.length} katılımcı · {activeRoom.topic}
                </p>
              </div>

              <div className="flex items-center -space-x-2 shrink-0">
                {activeRoom.memberUids.slice(0, 5).map((mUid) => {
                  const prof = profiles[mUid];
                  return (
                    <SocialAvatar
                      key={mUid}
                      avatarUrl={prof?.avatarUrl}
                      name={prof?.displayName || mUid}
                      sizeClassName="w-8 h-8"
                      textClassName="text-[10px]"
                    />
                  );
                })}
              </div>
            </header>

            {/* Messages Timeline */}
            <div
              data-testid="social-messages-timeline"
              className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[460px]"
            >
              {activeMessages.length === 0 ? (
                <div className="py-16 text-center space-y-1.5">
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    Bu odada henüz mesaj yok.
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    İlk mesajı göndererek sohbeti başlatabilirsiniz.
                  </p>
                </div>
              ) : (
                activeMessages.map((msg) => {
                  const isMine = msg.senderUid === currentUid;
                  const liveSender = profiles[msg.senderUid];
                  const senderName =
                    liveSender?.displayName || msg.senderName || 'Üye';
                  const senderAvatar =
                    liveSender?.avatarUrl || msg.senderAvatarUrl;

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-3 ${
                        isMine ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <SocialAvatar
                        avatarUrl={senderAvatar}
                        name={senderName}
                        sizeClassName="w-9 h-9"
                        textClassName="text-xs"
                      />
                      <div
                        className={`max-w-[78%] space-y-1 ${
                          isMine ? 'items-end text-right' : 'items-start text-left'
                        }`}
                      >
                        <div
                          className={`flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 tabular-nums ${
                            isMine ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                            {senderName}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString('tr-TR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div
                          className={`inline-block px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words text-left ${
                            isMine
                              ? 'bg-blue-600 text-white'
                              : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 border border-neutral-200/70 dark:border-neutral-800'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Footer Composer */}
            <footer className="p-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
              {typingPeerName && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {typingPeerName} yazıyor...
                </p>
              )}
              {sendError && (
                <p
                  role="alert"
                  className="text-xs font-medium text-red-600 dark:text-red-400"
                >
                  {sendError}
                </p>
              )}
              <form onSubmit={handleSendSubmit} className="flex items-center gap-2.5">
                <label htmlFor="social-room-msg-input" className="sr-only">
                  Mesajınızı yazın
                </label>
                <input
                  id="social-room-msg-input"
                  type="text"
                  value={draftMessage}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDraftMessage(val);
                    if (sendError && val.trim()) setSendError(null);
                    onTypingChange(activeRoom.id, val.trim().length > 0);
                    if (typingTimeoutRef.current) {
                      clearTimeout(typingTimeoutRef.current);
                    }
                    typingTimeoutRef.current = setTimeout(() => {
                      onTypingChange(activeRoom.id, false);
                    }, 1800);
                  }}
                  placeholder={`${
                    activeRoom.roomType === 'direct'
                      ? resolveDirectRoomPeer(activeRoom)?.displayName ||
                        'Kullanıcıya'
                      : activeRoom.name
                  } odasına mesaj gönderin...`}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm text-neutral-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={isSending}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span>Gönder</span>
                </button>
              </form>
            </footer>
          </>
        )}
      </section>
    </div>
  );
};
