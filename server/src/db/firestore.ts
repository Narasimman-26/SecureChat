import admin from 'firebase-admin';
import { config } from '../config.js';
import { v4 as uuidv4 } from 'uuid';

export interface UserRecord {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  publicKey: string;
  createdAt: number;
  isOnline?: boolean;
  lastSeen?: number;
}

export interface ChatRecord {
  id: string;
  participants: [string, string];
  disappearingSeconds?: number | null;
  updatedAt: number;
}

export interface MessageRecord {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  ciphertext: string; // ONLY CIPHERTEXT IS EVER STORED
  iv: string;         // AES-GCM 12-byte initialization vector in base64
  createdAt: number;
  expiresAt?: number | null;
  status: 'sent' | 'delivered' | 'read';
}

class FirestoreDatabase {
  private isLiveFirestore = false;
  private db: admin.firestore.Firestore | null = null;

  // In-memory fallback stores
  private memUsers: Map<string, UserRecord> = new Map();
  private memChats: Map<string, ChatRecord> = new Map();
  private memMessages: Map<string, MessageRecord> = new Map();

  constructor() {
    this.init();
  }

  private init() {
    if (config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey) {
      try {
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: config.firebase.projectId,
              clientEmail: config.firebase.clientEmail,
              privateKey: config.firebase.privateKey,
            }),
          });
        }
        this.db = admin.firestore();
        this.isLiveFirestore = true;
        console.log('⚡ [Database] Connected to live Google Cloud Firestore.');
      } catch (err) {
        console.warn('⚠️ [Database] Failed to initialize Firebase Admin SDK. Falling back to local store.', err);
        this.isLiveFirestore = false;
      }
    } else {
      console.log('ℹ️ [Database] Running in Local Zero-Config Store. Provide Firebase credentials in .env to connect to live Cloud Firestore.');
    }
  }

  // USERS
  async createUser(user: UserRecord): Promise<UserRecord> {
    if (this.isLiveFirestore && this.db) {
      await this.db.collection('users').doc(user.id).set(user);
      return user;
    }
    this.memUsers.set(user.id, user);
    return user;
  }

  async getUserByEmail(email: string): Promise<UserRecord | null> {
    const normalized = email.toLowerCase().trim();
    if (this.isLiveFirestore && this.db) {
      const snap = await this.db.collection('users').where('email', '==', normalized).limit(1).get();
      if (snap.empty) return null;
      return snap.docs[0].data() as UserRecord;
    }
    for (const u of this.memUsers.values()) {
      if (u.email.toLowerCase() === normalized) return u;
    }
    return null;
  }

  async getUserById(id: string): Promise<UserRecord | null> {
    if (this.isLiveFirestore && this.db) {
      const doc = await this.db.collection('users').doc(id).get();
      return doc.exists ? (doc.data() as UserRecord) : null;
    }
    return this.memUsers.get(id) || null;
  }

  async searchUsers(query: string, excludeUserId: string): Promise<Omit<UserRecord, 'passwordHash'>[]> {
    const q = query.toLowerCase().trim();
    const results: Omit<UserRecord, 'passwordHash'>[] = [];

    if (this.isLiveFirestore && this.db) {
      const snap = await this.db.collection('users').limit(30).get();
      snap.forEach((doc) => {
        const u = doc.data() as UserRecord;
        if (u.id !== excludeUserId && (u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))) {
          const { passwordHash: _, ...safeUser } = u;
          results.push(safeUser);
        }
      });
      return results;
    }

    for (const u of this.memUsers.values()) {
      if (u.id !== excludeUserId && (u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))) {
        const { passwordHash: _, ...safeUser } = u;
        results.push(safeUser);
      }
    }
    return results;
  }

  async updateUserPresence(id: string, isOnline: boolean): Promise<void> {
    const lastSeen = Date.now();
    if (this.isLiveFirestore && this.db) {
      await this.db.collection('users').doc(id).update({ isOnline, lastSeen }).catch(() => {});
      return;
    }
    const u = this.memUsers.get(id);
    if (u) {
      u.isOnline = isOnline;
      u.lastSeen = lastSeen;
    }
  }

  // CHATS
  async getOrCreateChat(user1Id: string, user2Id: string): Promise<ChatRecord> {
    // Deterministic lookup key or sorted participants
    const participants: [string, string] = [user1Id, user2Id].sort() as [string, string];

    if (this.isLiveFirestore && this.db) {
      const snap = await this.db.collection('chats')
        .where('participants', '==', participants)
        .limit(1)
        .get();

      if (!snap.empty) {
        return snap.docs[0].data() as ChatRecord;
      }

      const newChat: ChatRecord = {
        id: uuidv4(),
        participants,
        disappearingSeconds: null,
        updatedAt: Date.now(),
      };
      await this.db.collection('chats').doc(newChat.id).set(newChat);
      return newChat;
    }

    for (const chat of this.memChats.values()) {
      if (chat.participants[0] === participants[0] && chat.participants[1] === participants[1]) {
        return chat;
      }
    }

    const newChat: ChatRecord = {
      id: uuidv4(),
      participants,
      disappearingSeconds: null,
      updatedAt: Date.now(),
    };
    this.memChats.set(newChat.id, newChat);
    return newChat;
  }

  async getChatById(chatId: string): Promise<ChatRecord | null> {
    if (this.isLiveFirestore && this.db) {
      const doc = await this.db.collection('chats').doc(chatId).get();
      return doc.exists ? (doc.data() as ChatRecord) : null;
    }
    return this.memChats.get(chatId) || null;
  }

  async getUserChats(userId: string): Promise<ChatRecord[]> {
    if (this.isLiveFirestore && this.db) {
      const snap = await this.db.collection('chats')
        .where('participants', 'array-contains', userId)
        .get();
      return snap.docs.map((d) => d.data() as ChatRecord);
    }
    return Array.from(this.memChats.values()).filter((c) => c.participants.includes(userId));
  }

  async updateChatDisappearing(chatId: string, seconds: number | null): Promise<void> {
    if (this.isLiveFirestore && this.db) {
      await this.db.collection('chats').doc(chatId).update({ disappearingSeconds: seconds });
      return;
    }
    const c = this.memChats.get(chatId);
    if (c) c.disappearingSeconds = seconds;
  }

  async touchChat(chatId: string, timestamp: number): Promise<void> {
    if (this.isLiveFirestore && this.db) {
      await this.db.collection('chats').doc(chatId).update({ updatedAt: timestamp }).catch(() => {});
      return;
    }
    const c = this.memChats.get(chatId);
    if (c) c.updatedAt = timestamp;
  }

  // MESSAGES - STORE ONLY CIPHERTEXT
  async saveMessage(msg: MessageRecord): Promise<MessageRecord> {
    if (this.isLiveFirestore && this.db) {
      await this.db.collection('messages').doc(msg.id).set(msg);
      await this.touchChat(msg.chatId, msg.createdAt);
      return msg;
    }
    this.memMessages.set(msg.id, msg);
    await this.touchChat(msg.chatId, msg.createdAt);
    return msg;
  }

  async getChatMessages(chatId: string, limitCount = 100): Promise<MessageRecord[]> {
    const now = Date.now();
    if (this.isLiveFirestore && this.db) {
      const snap = await this.db.collection('messages')
        .where('chatId', '==', chatId)
        .orderBy('createdAt', 'asc')
        .limit(limitCount)
        .get();
      
      const msgs = snap.docs.map((d) => d.data() as MessageRecord);
      // Filter out any messages whose disappearing timer expired
      return msgs.filter((m) => !m.expiresAt || m.expiresAt > now);
    }

    const msgs = Array.from(this.memMessages.values())
      .filter((m) => m.chatId === chatId && (!m.expiresAt || m.expiresAt > now))
      .sort((a, b) => a.createdAt - b.createdAt);

    return msgs.slice(-limitCount);
  }

  async getLatestChatMessage(chatId: string): Promise<MessageRecord | null> {
    const msgs = await this.getChatMessages(chatId, 50);
    return msgs.length > 0 ? msgs[msgs.length - 1] : null;
  }

  async updateMessageStatus(messageId: string, status: 'delivered' | 'read'): Promise<void> {
    if (this.isLiveFirestore && this.db) {
      await this.db.collection('messages').doc(messageId).update({ status }).catch(() => {});
      return;
    }
    const m = this.memMessages.get(messageId);
    if (m) m.status = status;
  }

  async markChatMessagesAsRead(chatId: string, readerId: string): Promise<string[]> {
    const updatedIds: string[] = [];
    if (this.isLiveFirestore && this.db) {
      const snap = await this.db.collection('messages')
        .where('chatId', '==', chatId)
        .where('receiverId', '==', readerId)
        .where('status', '!=', 'read')
        .get();

      const batch = this.db.batch();
      snap.docs.forEach((d) => {
        batch.update(d.ref, { status: 'read' });
        updatedIds.push(d.id);
      });
      await batch.commit();
      return updatedIds;
    }

    for (const m of this.memMessages.values()) {
      if (m.chatId === chatId && m.receiverId === readerId && m.status !== 'read') {
        m.status = 'read';
        updatedIds.push(m.id);
      }
    }
    return updatedIds;
  }

  async pruneExpiredMessages(): Promise<{ id: string; chatId: string }[]> {
    const now = Date.now();
    const expired: { id: string; chatId: string }[] = [];

    if (this.isLiveFirestore && this.db) {
      const snap = await this.db.collection('messages')
        .where('expiresAt', '<=', now)
        .get();

      if (!snap.empty) {
        const batch = this.db.batch();
        snap.docs.forEach((d) => {
          const data = d.data() as MessageRecord;
          expired.push({ id: data.id, chatId: data.chatId });
          batch.delete(d.ref);
        });
        await batch.commit();
      }
      return expired;
    }

    for (const [id, m] of this.memMessages.entries()) {
      if (m.expiresAt && m.expiresAt <= now) {
        expired.push({ id: m.id, chatId: m.chatId });
        this.memMessages.delete(id);
      }
    }
    return expired;
  }
}

export const db = new FirestoreDatabase();
