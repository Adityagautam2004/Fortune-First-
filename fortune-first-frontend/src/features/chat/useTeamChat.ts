'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import api, { getAccessToken } from '@/lib/api';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  profile_picture_url?: string | null;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
  read_by?: string[];
}

export interface ActiveConversation {
  id: string;
  label: string;
  memberId?: string; // undefined for the group channel
}

export const GROUP_CHANNEL: ActiveConversation = { id: 'group_all', label: 'Team Channel' };

// Must match the backend's room-naming convention in socket.service.js exactly —
// UUIDs use hyphens (never underscores) so splitting 'dm_<a>_<b>' on '_' is safe.
export function dmRoomId(idA: string, idB: string) {
  return `dm_${[idA, idB].sort().join('_')}`;
}

export function useTeamChat(basePath: 'admin' | 'board', currentUserId: string | undefined) {
  const [contacts, setContacts] = useState<TeamMember[]>([]);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [conversation, setConversation] = useState<ActiveConversation>(GROUP_CHANNEL);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const conversationRef = useRef(conversation.id);

  useEffect(() => {
    conversationRef.current = conversation.id;
  }, [conversation.id]);

  useEffect(() => {
    api
      .get(`/${basePath}/chat/contacts`)
      .then((res) => setContacts(res.data.data))
      .catch((error) => console.error('Failed to load chat contacts', error));
  }, [basePath]);

  // One socket connection for the life of the page — switching conversations
  // just changes which room it's listening to, not the connection itself.
  useEffect(() => {
    if (!currentUserId) return;

    const token = getAccessToken();
    const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000', {
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('online_users', (ids: string[]) => setOnlineIds(new Set(ids)));
    socket.on('user_online', ({ userId }: { userId: string }) =>
      setOnlineIds((prev) => new Set(prev).add(userId))
    );
    socket.on('user_offline', ({ userId }: { userId: string }) =>
      setOnlineIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      })
    );
    socket.on('receive_message', (message: ChatMessage & { conversation_id: string }) => {
      if (message.conversation_id !== conversationRef.current) return;
      setMessages((prev) => [...prev, message]);
    });
    socket.on('user_typing', ({ userId, name }: { userId: string; name: string }) => {
      if (userId === currentUserId) return;
      setTypingUser(name);
    });
    socket.on('user_typing_stop', () => setTypingUser(null));
    socket.on(
      'messages_read',
      ({ conversationId, userId, messageIds }: { conversationId: string; userId: string; messageIds: string[] }) => {
        if (conversationId !== conversationRef.current) return;
        setMessages((prev) =>
          prev.map((m) => (messageIds.includes(m.id) ? { ...m, read_by: [...(m.read_by || []), userId] } : m))
        );
      }
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId]);

  // Reload history + join the room whenever the active conversation changes
  useEffect(() => {
    setMessages([]);
    setTypingUser(null);

    api
      .get(`/${basePath}/chat/${conversation.id}`)
      .then((res) => setMessages(res.data.data))
      .catch((error) => console.error('Failed to load chat history', error));

    const socket = socketRef.current;
    if (!socket || conversation.id === 'group_all') return undefined;

    socket.emit('join_room', conversation.id);
    return () => {
      socket.emit('leave_room', conversation.id);
    };
  }, [basePath, conversation.id]);

  // Mark anything from someone else as read once it's on screen
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !currentUserId) return;
    const unreadIds = messages
      .filter((m) => m.sender_id !== currentUserId && !(m.read_by || []).includes(currentUserId))
      .map((m) => m.id);
    if (unreadIds.length > 0) {
      socket.emit('mark_read', { conversationId: conversation.id, messageIds: unreadIds });
    }
  }, [messages, conversation.id, currentUserId]);

  const selectContact = useCallback(
    (member: TeamMember) => {
      if (!currentUserId) return;
      setConversation({ id: dmRoomId(currentUserId, member.id), label: member.name, memberId: member.id });
    },
    [currentUserId]
  );

  const selectGroup = useCallback(() => setConversation(GROUP_CHANNEL), []);

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim() || !socketRef.current) return;
      socketRef.current.emit('send_message', { conversationId: conversation.id, content });
    },
    [conversation.id]
  );

  const notifyTyping = useCallback(
    (typing: boolean) => {
      socketRef.current?.emit(typing ? 'typing_start' : 'typing_stop', conversation.id);
    },
    [conversation.id]
  );

  return {
    contacts,
    onlineIds,
    conversation,
    messages,
    typingUser,
    selectContact,
    selectGroup,
    sendMessage,
    notifyTyping,
  };
}
