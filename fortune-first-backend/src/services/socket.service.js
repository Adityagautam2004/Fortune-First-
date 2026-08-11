const db = require('../models/db');
const { verifyAccessToken } = require('../utils/auth.utils');

const setupSocket = (io) => {
  // Authentication Middleware for WebSockets
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = verifyAccessToken(token);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🟢 User Connected: ${socket.user.name} (${socket.user.userId})`);

    // Join the global board group chat
    socket.join('group_all');

    // Handle typing indicators
    socket.on('typing_start', (room) => {
      socket.to(room).emit('user_typing', { userId: socket.user.userId, name: socket.user.name });
    });

    socket.on('typing_stop', (room) => {
      socket.to(room).emit('user_typing_stop', { userId: socket.user.userId });
    });

    // Handle incoming messages
    socket.on('send_message', async (data) => {
      const { conversationId, content } = data; // e.g., conversationId = 'group_all'
      
      try {
        // 1. Persist to PostgreSQL
        const msgRes = await db.query(
          `INSERT INTO chat_messages (sender_id, conversation_id, content, read_by)
           VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
          [socket.user.userId, conversationId, content, [socket.user.userId]]
        );

        const messagePayload = {
          id: msgRes.rows[0].id,
          sender_id: socket.user.userId,
          sender_name: socket.user.name,
          conversation_id: conversationId,
          content,
          created_at: msgRes.rows[0].created_at
        };

        // 2. Broadcast in real-time
        io.to(conversationId).emit('receive_message', messagePayload);
      } catch (error) {
        console.error('Message Persistence Error:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔴 User Disconnected: ${socket.user.name}`);
    });
  });
};

module.exports = setupSocket;