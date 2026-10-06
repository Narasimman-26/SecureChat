import { Router } from 'express';
import { db } from '../db/firestore.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

// List all chats for current user
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const currentUserId = req.user!.id;
    const rawChats = await db.getUserChats(currentUserId);

    const summaries = await Promise.all(
      rawChats.map(async (c) => {
        const otherUserId = c.participants.find((p) => p !== currentUserId) || currentUserId;
        const otherUser = await db.getUserById(otherUserId);
        const lastMessage = await db.getLatestChatMessage(c.id);

        const safeOtherUser = otherUser
          ? {
              id: otherUser.id,
              username: otherUser.username,
              email: otherUser.email,
              publicKey: otherUser.publicKey,
              createdAt: otherUser.createdAt,
              isOnline: otherUser.isOnline,
              lastSeen: otherUser.lastSeen,
            }
          : {
              id: otherUserId,
              username: 'Unknown User',
              email: '',
              publicKey: '',
              createdAt: Date.now(),
            };

        return {
          id: c.id,
          participants: c.participants,
          otherUser: safeOtherUser,
          lastMessage: lastMessage || undefined,
          disappearingSeconds: c.disappearingSeconds,
          updatedAt: c.updatedAt,
        };
      })
    );

    summaries.sort((a, b) => b.updatedAt - a.updatedAt);
    res.json({ chats: summaries });
  } catch (err) {
    console.error('Fetch chats error:', err);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Start or retrieve a chat with another user
const startChatSchema = z.object({
  participantId: z.string().min(1),
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const parse = startChatSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Participant ID is required' });
      return;
    }

    const currentUserId = req.user!.id;
    const { participantId } = parse.data;

    if (currentUserId === participantId) {
      res.status(400).json({ error: 'Cannot start chat with yourself' });
      return;
    }

    const otherUser = await db.getUserById(participantId);
    if (!otherUser) {
      res.status(404).json({ error: 'Target user not found' });
      return;
    }

    const chat = await db.getOrCreateChat(currentUserId, participantId);
    const lastMessage = await db.getLatestChatMessage(chat.id);

    const safeOtherUser = {
      id: otherUser.id,
      username: otherUser.username,
      email: otherUser.email,
      publicKey: otherUser.publicKey,
      createdAt: otherUser.createdAt,
      isOnline: otherUser.isOnline,
      lastSeen: otherUser.lastSeen,
    };

    res.json({
      chat: {
        id: chat.id,
        participants: chat.participants,
        otherUser: safeOtherUser,
        lastMessage: lastMessage || undefined,
        disappearingSeconds: chat.disappearingSeconds,
        updatedAt: chat.updatedAt,
      },
    });
  } catch (err) {
    console.error('Create chat error:', err);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// Get messages for a chat
router.get('/:chatId/messages', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const chatId = Array.isArray(req.params.chatId) ? req.params.chatId[0] : req.params.chatId;
    const currentUserId = req.user!.id;

    const chat = await db.getChatById(chatId);
    if (!chat || !chat.participants.includes(currentUserId)) {
      res.status(403).json({ error: 'Not authorized to view this chat' });
      return;
    }

    const messages = await db.getChatMessages(chatId, 100);
    res.json({ messages, disappearingSeconds: chat.disappearingSeconds });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

// Update disappearing message timer
const disappearingSchema = z.object({
  seconds: z.union([z.number().positive(), z.null()]),
});

router.patch('/:chatId/disappearing', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const chatId = Array.isArray(req.params.chatId) ? req.params.chatId[0] : req.params.chatId;
    const currentUserId = req.user!.id;

    const chat = await db.getChatById(chatId);
    if (!chat || !chat.participants.includes(currentUserId)) {
      res.status(403).json({ error: 'Not authorized for this chat' });
      return;
    }

    const parse = disappearingSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Invalid seconds value' });
      return;
    }

    await db.updateChatDisappearing(chatId, parse.data.seconds);
    res.json({ success: true, disappearingSeconds: parse.data.seconds });
  } catch (err) {
    console.error('Update disappearing timer error:', err);
    res.status(500).json({ error: 'Failed to update disappearing timer' });
  }
});

export default router;
