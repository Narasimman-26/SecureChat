import { User, Message, ChatSummary } from '@shared/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('securechat_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async signup(data: { email: string; username: string; password: string; publicKey: string }): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Signup failed');
    return json;
  }

  async login(data: { email: string; password: string }): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Login failed');
    return json;
  }

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch profile');
    return json;
  }

  async searchUsers(query: string): Promise<User[]> {
    const res = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`, {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'User search failed');
    return json.users;
  }

  async getUserPublicKey(userId: string): Promise<{ id: string; username: string; publicKey: string }> {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/public-key`, {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch public key');
    return json;
  }

  async getChats(): Promise<ChatSummary[]> {
    const res = await fetch(`${API_BASE_URL}/chats`, {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to load chats');
    return json.chats;
  }

  async startChat(participantId: string): Promise<{ chat: ChatSummary }> {
    const res = await fetch(`${API_BASE_URL}/chats`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ participantId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to start chat');
    return json;
  }

  async getMessages(chatId: string): Promise<{ messages: Message[]; disappearingSeconds: number | null }> {
    const res = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to fetch messages');
    return json;
  }

  async updateDisappearingTimer(chatId: string, seconds: number | null): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/chats/${chatId}/disappearing`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ seconds }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update disappearing timer');
  }
}

export const api = new ApiService();
