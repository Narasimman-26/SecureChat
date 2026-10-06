export interface User {
  id: string;
  email: string;
  username: string;
  publicKey: string; // Base64 or JWK JSON string representation of ECDH P-256 public key
  createdAt: number;
  isOnline?: boolean;
  lastSeen?: number;
  avatarSeed?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface EncryptedPayload {
  ciphertext: string; // Base64 encoded AES-256-GCM encrypted bytes
  iv: string;         // Base64 encoded 12-byte initialization vector
}

export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  ciphertext: string;
  iv: string;
  createdAt: number;
  expiresAt?: number | null;
  status: MessageStatus;
}

export interface DecryptedMessage extends Message {
  plaintext?: string;
  decryptionError?: boolean;
  isExpired?: boolean;
}

export interface ChatSummary {
  id: string;
  participants: [string, string];
  otherUser: User;
  lastMessage?: Message;
  unreadCount: number;
  disappearingSeconds?: number | null;
  updatedAt: number;
}

export type SensitiveIssueType = 'password' | 'otp' | 'credit_card' | 'phone';

export interface SensitiveIssue {
  type: SensitiveIssueType;
  label: string;
  matchedPreview: string;
  recommendation: string;
}

export interface SensitivityCheckResult {
  isSensitive: boolean;
  issues: SensitiveIssue[];
}

export interface SendMessagePayload {
  chatId: string;
  receiverId: string;
  ciphertext: string;
  iv: string;
  expiresAt?: number | null;
}

// Socket.io Events
export interface ClientToServerEvents {
  send_message: (
    data: SendMessagePayload,
    callback: (res: { status: 'ok'; message: Message } | { status: 'error'; error: string }) => void
  ) => void;
  message_delivered: (data: { messageId: string; chatId: string; senderId: string }) => void;
  message_read: (data: { messageId: string; chatId: string; senderId: string }) => void;
  typing_start: (data: { chatId: string; receiverId: string }) => void;
  typing_stop: (data: { chatId: string; receiverId: string }) => void;
  set_disappearing_timer: (data: { chatId: string; receiverId: string; seconds: number | null }) => void;
}

export interface ServerToClientEvents {
  new_message: (message: Message) => void;
  message_status_update: (data: { messageId: string; chatId: string; status: MessageStatus }) => void;
  user_typing: (data: { chatId: string; userId: string; isTyping: boolean }) => void;
  user_presence: (data: { userId: string; isOnline: boolean; lastSeen?: number }) => void;
  disappearing_timer_updated: (data: { chatId: string; seconds: number | null; updatedBy: string }) => void;
  message_expired: (data: { messageId: string; chatId: string }) => void;
}
