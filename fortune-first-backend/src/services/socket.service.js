const db = require('../models/db');
const { verifyAccessToken } = require('../utils/auth.utils');

// userId -> Set of live socket ids. A user can have this open in multiple tabs,
// so "online" means "at least one socket still connected", not "exactly one".
const onlineUsers = new Map();

// Team chat only has two kinds of rooms: the always-on 'group_all' channel and
// 1:1 DMs named 'dm_<idA>_<idB>' (UUIDs use hyphens, never underscores, so
// splitting on '_' safely yields exactly 3 parts). A socket may only join/send
// to a DM room it's actually a party to.
const isAuthorizedForRoom = (userId, room) => {
  if (room === 'group_all') return true;
  if (typeof room === 'string' && room.startsWith('dm_')) {
    const parts = room.split('_');
    return parts.length === 3 && (parts[1] === userId || parts[2] === userId);
  }
  return false;
};

const setupSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = verifyAccessToken(token);
      if (decoded.role === 'customer') return next(new Error('Chat is staff-only'));
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.userId;
    console.log(`🟢 User Connected: ${socket.user.name} (${userId})`);
    socket.join('group_all');

    const wasOffline = !onlineUsers.has(userId);
    if (wasOffline) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    // Tell the newly-connected socket who's already online, and tell everyone
    // else this user just came online (only on their first tab/connection).
    socket.emit('online_users', Array.from(onlineUsers.keys()));
    if (wasOffline) {
      socket.to('group_all').emit('user_online', { userId, name: socket.user.name });
    }

    socket.on('join_room', (room) => {
      if (isAuthorizedForRoom(userId, room)) socket.join(room);
    });

    socket.on('leave_room', (room) => {
      if (room !== 'group_all') socket.leave(room);
    });

    socket.on('typing_start', (room) => {
      socket.to(room).emit('user_typing', { userId, name: socket.user.name });
    });

    socket.on('typing_stop', (room) => {
      socket.to(room).emit('user_typing_stop', { userId });
    });

    socket.on('send_message', async (data) => {
      const { conversationId, content } = data || {};
      if (!isAuthorizedForRoom(userId, conversationId) || !content?.trim()) return;
      try {
        // Sending implies joining — otherwise the sender's own reply in a DM
        // they haven't explicitly join_room'd yet would never reach them.
        socket.join(conversationId);
        const msgRes = await db.query(
          `INSERT INTO chat_messages (sender_id, conversation_id, content, read_by)
           VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
          [userId, conversationId, content, [userId]]
        );
        const messagePayload = {
          id: msgRes.rows[0].id, sender_id: userId, sender_name: socket.user.name,
          conversation_id: conversationId, content, created_at: msgRes.rows[0].created_at
        };
        io.to(conversationId).emit('receive_message', messagePayload);
      } catch (error) {
        console.error('Message Persistence Error:', error);
      }
    });

    socket.on('mark_read', async ({ conversationId, messageIds } = {}) => {
      if (!isAuthorizedForRoom(userId, conversationId) || !Array.isArray(messageIds) || messageIds.length === 0) return;
      try {
        await db.query(
          `UPDATE chat_messages SET read_by = array_append(read_by, $1)
           WHERE id = ANY($2::uuid[]) AND NOT ($1 = ANY(read_by))`,
          [userId, messageIds]
        );
        socket.to(conversationId).emit('messages_read', { conversationId, userId, messageIds });
      } catch (error) {
        console.error('Mark Read Error:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔴 User Disconnected: ${socket.user.name}`);
      const sockets = onlineUsers.get(userId);
      if (!sockets) return;
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        onlineUsers.delete(userId);
        socket.to('group_all').emit('user_offline', { userId });
      }
    });
  });
};

module.exports = setupSocket;
