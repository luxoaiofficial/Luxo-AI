import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatMessage, LuxoModelId } from '../types/luxo';
import {
  applySharedCodeDelta,
  applySharedDocDelta,
  CollabParticipant,
  CollabRoomSnapshot,
  CollabSharedCode,
  CollabSharedDoc,
  CollabSurface,
  createInitialSharedCode,
  createInitialSharedDoc,
  DEFAULT_COLLAB_ROOM_ID,
  parseRoomIdFromSearch,
  pickParticipantColor,
  sanitizeCollabRoomId,
  upsertSharedMessage,
} from '../utils/collabState';

interface UseRealtimeCollabOptions {
  userName: string;
  activeModelId: LuxoModelId;
  activeSurface: CollabSurface;
  onRemoteChatMessage?: (msg: ChatMessage, senderClientId: string) => void;
  onRoomInitMessages?: (messages: ChatMessage[], roomId: string) => void;
}

export interface RealtimeCollabController {
  roomId: string;
  isConnected: boolean;
  clientId: string;
  myColor: string;
  participants: CollabParticipant[];
  sharedDoc: CollabSharedDoc;
  sharedCode: CollabSharedCode;
  sharedMessages: ChatMessage[];
  changeRoom: (nextRoomId: string) => void;
  updateSharedDoc: (delta: { title?: string; content?: string }) => void;
  updateSharedCode: (delta: {
    mode?: 'web' | 'js-console';
    html?: string;
    css?: string;
    js?: string;
  }) => void;
  broadcastChatMessage: (message: ChatMessage) => void;
  updatePresence: (partial: {
    activeSurface?: CollabSurface;
    activeTab?: 'html' | 'css' | 'js';
    activeModelId?: LuxoModelId;
    cursorOffset?: number;
    isTyping?: boolean;
  }) => void;
}

function getOrCreateTabClientId(): string {
  try {
    const existing = sessionStorage.getItem('luxo_collab_client_id');
    if (existing && existing.length >= 6) return existing;
    const created = `tab_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 7)}`;
    sessionStorage.setItem('luxo_collab_client_id', created);
    return created;
  } catch {
    return `tab_${Math.random().toString(36).slice(2, 9)}`;
  }
}

export function useRealtimeCollab({
  userName,
  activeModelId,
  activeSurface,
  onRemoteChatMessage,
  onRoomInitMessages,
}: UseRealtimeCollabOptions): RealtimeCollabController {
  const [clientId] = useState<string>(() => getOrCreateTabClientId());
  const myColor = pickParticipantColor(clientId);

  const [roomId, setRoomId] = useState<string>(() => {
    if (typeof window === 'undefined') return DEFAULT_COLLAB_ROOM_ID;
    return (
      parseRoomIdFromSearch(window.location.search) || DEFAULT_COLLAB_ROOM_ID
    );
  });

  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<CollabParticipant[]>([]);
  const [sharedDoc, setSharedDoc] = useState<CollabSharedDoc>(() =>
    createInitialSharedDoc(roomId)
  );
  const [sharedCode, setSharedCode] = useState<CollabSharedCode>(() =>
    createInitialSharedCode()
  );
  const [sharedMessages, setSharedMessages] = useState<ChatMessage[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const pendingPayloadsRef = useRef<string[]>([]);
  const roomIdRef = useRef(roomId);
  roomIdRef.current = roomId;

  const userNameRef = useRef(userName);
  userNameRef.current = userName;

  const activeModelRef = useRef(activeModelId);
  activeModelRef.current = activeModelId;

  const activeSurfaceRef = useRef(activeSurface);
  activeSurfaceRef.current = activeSurface;

  const onRemoteChatRef = useRef(onRemoteChatMessage);
  onRemoteChatRef.current = onRemoteChatMessage;

  const onRoomInitMessagesRef = useRef(onRoomInitMessages);
  onRoomInitMessagesRef.current = onRoomInitMessages;

  const sendRawPayload = useCallback((payload: Record<string, unknown>) => {
    const encoded = JSON.stringify(payload);
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(encoded);
    } else {
      pendingPayloadsRef.current = [
        ...pendingPayloadsRef.current.slice(-24),
        encoded,
      ];
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let disposed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const connectSocket = () => {
      if (disposed) return;
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${proto}//${window.location.host}/ws/collab`;
      let socket: WebSocket;
      try {
        socket = new WebSocket(wsUrl);
      } catch {
        reconnectTimer = setTimeout(connectSocket, 1800);
        return;
      }

      wsRef.current = socket;

      socket.onopen = () => {
        if (disposed) {
          socket.close();
          return;
        }
        attempt = 0;
        setIsConnected(true);
        const displayLabel =
          userNameRef.current === 'Misafir Kullanıcı'
            ? `Katılımcı-${clientId.slice(-4).toUpperCase()}`
            : userNameRef.current;

        socket.send(
          JSON.stringify({
            type: 'room:join',
            roomId: roomIdRef.current,
            clientId,
            name: displayLabel,
            activeSurface: activeSurfaceRef.current,
            activeModelId: activeModelRef.current,
          })
        );

        if (pendingPayloadsRef.current.length > 0) {
          const queued = [...pendingPayloadsRef.current];
          pendingPayloadsRef.current = [];
          for (const item of queued) {
            socket.send(item);
          }
        }
      };

      socket.onmessage = (event) => {
        if (disposed) return;
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(String(event.data)) as Record<string, unknown>;
        } catch {
          return;
        }

        const type = String(data.type || '');

        if (type === 'room:init' && data.snapshot) {
          const snap = data.snapshot as CollabRoomSnapshot;
          setParticipants(snap.participants || []);
          if (snap.sharedDoc) setSharedDoc(snap.sharedDoc);
          if (snap.sharedCode) setSharedCode(snap.sharedCode);
          if (Array.isArray(snap.sharedMessages)) {
            setSharedMessages(snap.sharedMessages);
            if (snap.sharedMessages.length > 0) {
              onRoomInitMessagesRef.current?.(snap.sharedMessages, snap.roomId);
            }
          }
          return;
        }

        if (type === 'presence:sync' && Array.isArray(data.participants)) {
          setParticipants(data.participants as CollabParticipant[]);
          return;
        }

        if (type === 'doc:updated' && data.sharedDoc) {
          const incomingDoc = data.sharedDoc as CollabSharedDoc;
          const senderId = String(data.senderClientId || '');
          if (senderId !== clientId) {
            setSharedDoc(incomingDoc);
          } else {
            // Confirm server version number without overwriting active cursor text
            setSharedDoc((prev) => ({
              ...prev,
              version: incomingDoc.version,
              updatedAt: incomingDoc.updatedAt,
              updatedBy: incomingDoc.updatedBy,
              updatedByClientId: incomingDoc.updatedByClientId,
            }));
          }
          return;
        }

        if (type === 'code:updated' && data.sharedCode) {
          const incomingCode = data.sharedCode as CollabSharedCode;
          const senderId = String(data.senderClientId || '');
          if (senderId !== clientId) {
            setSharedCode(incomingCode);
          } else {
            setSharedCode((prev) => ({
              ...prev,
              version: incomingCode.version,
              updatedAt: incomingCode.updatedAt,
              updatedBy: incomingCode.updatedBy,
              updatedByClientId: incomingCode.updatedByClientId,
            }));
          }
          return;
        }

        if (type === 'chat:upserted' && data.message) {
          const msg = data.message as ChatMessage;
          const senderId = String(data.senderClientId || '');
          setSharedMessages((prev) => upsertSharedMessage(prev, msg));
          if (senderId !== clientId) {
            onRemoteChatRef.current?.(msg, senderId);
          }
        }
      };

      socket.onclose = () => {
        if (disposed) return;
        setIsConnected(false);
        attempt += 1;
        const backoff = Math.min(4000, 700 * attempt);
        reconnectTimer = setTimeout(connectSocket, backoff);
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    connectSocket();

    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [clientId]);

  const updatePresence = useCallback(
    (partial: {
      activeSurface?: CollabSurface;
      activeTab?: 'html' | 'css' | 'js';
      activeModelId?: LuxoModelId;
      cursorOffset?: number;
      isTyping?: boolean;
    }) => {
      const displayLabel =
        userNameRef.current === 'Misafir Kullanıcı'
          ? `Katılımcı-${clientId.slice(-4).toUpperCase()}`
          : userNameRef.current;

      sendRawPayload({
        type: 'presence:update',
        roomId: roomIdRef.current,
        name: displayLabel,
        ...partial,
      });
    },
    [clientId, sendRawPayload]
  );

  // Sync user name, surface, or active model changes to peers
  useEffect(() => {
    updatePresence({
      activeSurface,
      activeModelId,
    });
  }, [userName, activeSurface, activeModelId, updatePresence]);

  const changeRoom = useCallback(
    (rawNextRoom: string) => {
      const nextRoom = sanitizeCollabRoomId(rawNextRoom);
      setRoomId(nextRoom);
      roomIdRef.current = nextRoom;

      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('room', nextRoom);
        window.history.replaceState({}, '', url.toString());
      }

      const displayLabel =
        userNameRef.current === 'Misafir Kullanıcı'
          ? `Katılımcı-${clientId.slice(-4).toUpperCase()}`
          : userNameRef.current;

      sendRawPayload({
        type: 'room:join',
        roomId: nextRoom,
        clientId,
        name: displayLabel,
        activeSurface: activeSurfaceRef.current,
        activeModelId: activeModelRef.current,
      });
    },
    [clientId, sendRawPayload]
  );

  const updateSharedDoc = useCallback(
    (delta: { title?: string; content?: string }) => {
      const displayLabel =
        userNameRef.current === 'Misafir Kullanıcı'
          ? `Katılımcı-${clientId.slice(-4).toUpperCase()}`
          : userNameRef.current;

      setSharedDoc((prev) =>
        applySharedDocDelta(prev, {
          ...delta,
          updatedBy: displayLabel,
          updatedByClientId: clientId,
          updatedAt: Date.now(),
        })
      );

      sendRawPayload({
        type: 'doc:update',
        roomId: roomIdRef.current,
        clientId,
        updatedBy: displayLabel,
        ...delta,
      });
    },
    [clientId, sendRawPayload]
  );

  const updateSharedCode = useCallback(
    (delta: {
      mode?: 'web' | 'js-console';
      html?: string;
      css?: string;
      js?: string;
    }) => {
      const displayLabel =
        userNameRef.current === 'Misafir Kullanıcı'
          ? `Katılımcı-${clientId.slice(-4).toUpperCase()}`
          : userNameRef.current;

      setSharedCode((prev) =>
        applySharedCodeDelta(prev, {
          ...delta,
          updatedBy: displayLabel,
          updatedByClientId: clientId,
          updatedAt: Date.now(),
        })
      );

      sendRawPayload({
        type: 'code:update',
        roomId: roomIdRef.current,
        clientId,
        updatedBy: displayLabel,
        ...delta,
      });
    },
    [clientId, sendRawPayload]
  );

  const broadcastChatMessage = useCallback(
    (message: ChatMessage) => {
      const displayLabel =
        userNameRef.current === 'Misafir Kullanıcı'
          ? `Katılımcı-${clientId.slice(-4).toUpperCase()}`
          : userNameRef.current;

      const enriched: ChatMessage = {
        ...message,
        authorName:
          message.role === 'user'
            ? message.authorName || displayLabel
            : message.authorName,
        authorColor:
          message.role === 'user'
            ? message.authorColor || myColor
            : message.authorColor,
      };

      setSharedMessages((prev) => upsertSharedMessage(prev, enriched));

      sendRawPayload({
        type: 'chat:upsert',
        roomId: roomIdRef.current,
        clientId,
        message: enriched,
      });
    },
    [clientId, myColor, sendRawPayload]
  );

  return {
    roomId,
    isConnected,
    clientId,
    myColor,
    participants,
    sharedDoc,
    sharedCode,
    sharedMessages,
    changeRoom,
    updateSharedDoc,
    updateSharedCode,
    broadcastChatMessage,
    updatePresence,
  };
}
