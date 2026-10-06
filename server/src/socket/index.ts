import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { db, MessageRecord } from '../db/firestore.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

export function setupSocketIO(io: Server) {
  // Authentication middleware for Socket.io
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as { id: string; email: string };
      socket.userId = decoded.id;
      socket.userEmail = decoded.email;
      next();
    } catch (err) {
      next(new Error('Invalid socket authentication token'));
    }
  });

  // Keep track of connected sockets per user
  const userSocketMap = new Map<string, Set<string>>();

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    socket.join(`user:${userId}`);

    // Update connected sockets count
    const existingSockets = userSocketMap.get(userId) || new Set<string>();
    existingSockets.add(socket.id);
    userSocketMap.set(userId, existingSockets);

    // Update presence
    await db.updateUserPresence(userId, true);
    io.emit('user_presence', { userId, isOnline: true });

    // Handle send_message
    socket.on('send_message', async (data, callback) => {
      try {
        const { chatId, receiverId, ciphertext, iv, expiresAt } = data;
        if (!chatId || !receiverId || !ciphertext || !iv) {
          if (callback) callback({ status: 'error', error: 'Missing message parameters' });
          return;
        }

        const chat = await db.getChatById(chatId);
        if (!chat || !chat.participants.includes(userId)) {
          if (callback) callback({ status: 'error', error: 'Unauthorized chat' });
          return;
        }

        const isReceiverOnline = (userSocketMap.get(receiverId)?.size || 0) > 0;
        const initialStatus = isReceiverOnline ? 'delivered' : 'sent';

        const messageRecord: MessageRecord = {
          id: uuidv4(),
          chatId,
          senderId: userId,
          receiverId,
          ciphertext,
          iv,
          createdAt: Date.now(),
          expiresAt: expiresAt || null,
          status: initialStatus,
        };

        await db.saveMessage(messageRecord);

        // Notify receiver
        io.to(`user:${receiverId}`).emit('new_message', messageRecord);

        if (callback) {
          callback({ status: 'ok', message: messageRecord });
        }
      } catch (err) {
        console.error('Socket send_message error:', err);
        if (callback) callback({ status: 'error', error: 'Failed to process message' });
      }
    });

    // Handle delivery receipt
    socket.on('message_delivered', async ({ messageId, chatId, senderId }) => {
      try {
        await db.updateMessageStatus(messageId, 'delivered');
        io.to(`user:${senderId}`).emit('message_status_update', {
          messageId,
          chatId,
          status: 'delivered',
        });
      } catch (err) {
        console.error('message_delivered error:', err);
      }
    });

    // Handle read receipt
    socket.on('message_read', async ({ messageId, chatId, senderId }) => {
      try {
        await db.updateMessageStatus(messageId, 'read');
        io.to(`user:${senderId}`).emit('message_status_update', {
          messageId,
          chatId,
          status: 'read',
        });
      } catch (err) {
        console.error('message_read error:', err);
      }
    });

    // Typing start
    socket.on('typing_start', ({ chatId, receiverId }) => {
      io.to(`user:${receiverId}`).emit('user_typing', {
        chatId,
        userId,
        isTyping: true,
      });
    });

    // Typing stop
    socket.on('typing_stop', ({ chatId, receiverId }) => {
      io.to(`user:${receiverId}`).emit('user_typing', {
        chatId,
        userId,
        isTyping: false,
      });
    });

    // Update disappearing timer
    socket.on('set_disappearing_timer', async ({ chatId, receiverId, seconds }) => {
      try {
        await db.updateChatDisappearing(chatId, seconds);
        io.to(`user:${receiverId}`).emit('disappearing_timer_updated', {
          chatId,
          seconds,
          updatedBy: userId,
        });
      } catch (err) {
        console.error('set_disappearing_timer error:', err);
      }
    });

    // Disconnect handler
    socket.on('disconnect', async () => {
      const sockets = userSocketMap.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSocketMap.delete(userId);
          await db.updateUserPresence(userId, false);
          io.emit('user_presence', { userId, isOnline: false, lastSeen: Date.now() });
        }
      }
    });
  });

  // Background pruning for expired disappearing messages
  setInterval(async () => {
    try {
      const expiredList = await db.pruneExpiredMessages();
      for (const item of expiredList) {
        io.emit('message_expired', { messageId: item.id, chatId: item.chatId });
      }
    } catch (err) {
      console.error('Expired message pruning error:', err);
    }
  }, 4000);
}
