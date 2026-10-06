import React, { useState, useEffect, useRef } from 'react';
import { Send, Lock, Shield, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { ChatSummary, DecryptedMessage, Message, User, SensitivityCheckResult } from '@shared/types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { deriveChatKey, encryptMessage, decryptMessage } from '../crypto';
import { detectSensitiveContent } from '../utils/sensitivity';
import { ChatSidebar } from '../components/ChatSidebar';
import { ChatHeader } from '../components/ChatHeader';
import { MessageBubble } from '../components/MessageBubble';
import { SensitivityModal } from '../components/SensitivityModal';
import { EncryptionInfoModal } from '../components/EncryptionInfoModal';
import { DisappearingTimerModal } from '../components/DisappearingTimerModal';
import { NewChatModal } from '../components/NewChatModal';
import { SettingsModal } from './SettingsModal';

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeChat, setActiveChat] = useState<ChatSummary | null>(null);
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isPeerTyping, setIsPeerTyping] = useState(false);

  // Cached derived AES-GCM CryptoKeys per chatId
  const chatKeysRef = useRef<Map<string, CryptoKey>>(new Map());

  // Modals state
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEncryptionInfoOpen, setIsEncryptionInfoOpen] = useState(false);
  const [isDisappearingModalOpen, setIsDisappearingModalOpen] = useState(false);

  // Sensitivity modal state
  const [pendingSensitiveSend, setPendingSensitiveSend] = useState<SensitivityCheckResult | null>(null);
  const [isSensitivityModalOpen, setIsSensitivityModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Load user's conversations
  const loadChats = async () => {
    try {
      const chatList = await api.getChats();
      setChats(chatList);
      if (chatList.length > 0 && !activeChat) {
        setActiveChat(chatList[0]);
      }
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  // 2. Derive or retrieve AES-256-GCM key for active chat
  const getOrDeriveChatKey = async (chat: ChatSummary): Promise<CryptoKey> => {
    if (chatKeysRef.current.has(chat.id)) {
      return chatKeysRef.current.get(chat.id)!;
    }

    if (!chat.otherUser?.publicKey) {
      throw new Error('Peer public key unavailable for key exchange');
    }

    const key = await deriveChatKey(chat.otherUser.publicKey);
    chatKeysRef.current.set(chat.id, key);
    return key;
  };

  // 3. Load & decrypt messages for active chat
  useEffect(() => {
    if (!activeChat) return;

    let isSubscribed = true;
    const fetchAndDecrypt = async () => {
      setIsLoadingMessages(true);
      try {
        const { messages: rawMessages, disappearingSeconds } = await api.getMessages(activeChat.id);
        if (disappearingSeconds !== undefined) {
          setActiveChat((prev) => (prev ? { ...prev, disappearingSeconds } : null));
        }

        const aesKey = await getOrDeriveChatKey(activeChat);

        const decryptedList: DecryptedMessage[] = await Promise.all(
          rawMessages.map(async (msg) => {
            try {
              const plaintext = await decryptMessage(msg.ciphertext, msg.iv, aesKey);
              return { ...msg, plaintext, decryptionError: false };
            } catch (err) {
              return { ...msg, decryptionError: true };
            }
          })
        );

        if (isSubscribed) {
          setMessages(decryptedList);
          setTimeout(scrollToBottom, 50);

          // Mark unread messages as read
          const socket = socketService.getSocket();
          if (socket && user) {
            rawMessages.forEach((m) => {
              if (m.receiverId === user.id && m.status !== 'read') {
                socket.emit('message_read', {
                  messageId: m.id,
                  chatId: activeChat.id,
                  senderId: m.senderId,
                });
              }
            });
          }
        }
      } catch (err) {
        console.error('Failed to load or decrypt messages:', err);
      } finally {
        if (isSubscribed) setIsLoadingMessages(false);
      }
    };

    fetchAndDecrypt();

    return () => {
      isSubscribed = false;
    };
  }, [activeChat?.id]);

  // 4. Socket.io Event Listeners
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket || !user) return;

    const handleNewMessage = async (msg: Message) => {
      // If message is for the currently active chat, decrypt and append
      if (activeChat && msg.chatId === activeChat.id) {
        try {
          const aesKey = await getOrDeriveChatKey(activeChat);
          let plaintext = '';
          let decryptionError = false;
          try {
            plaintext = await decryptMessage(msg.ciphertext, msg.iv, aesKey);
          } catch {
            decryptionError = true;
          }

          const decrypted: DecryptedMessage = { ...msg, plaintext, decryptionError };
          setMessages((prev) => [...prev, decrypted]);
          setTimeout(scrollToBottom, 50);

          // Emit read receipt
          socket.emit('message_read', {
            messageId: msg.id,
            chatId: msg.chatId,
            senderId: msg.senderId,
          });
        } catch (err) {
          console.error('Failed to decrypt inbound message:', err);
        }
      } else {
        // Refresh sidebar chats to reflect latest message snippet
        loadChats();
      }
    };

    const handleStatusUpdate = ({
      messageId,
      status,
    }: {
      messageId: string;
      chatId: string;
      status: any;
    }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status } : m))
      );
    };

    const handleUserTyping = ({
      chatId,
      userId,
      isTyping,
    }: {
      chatId: string;
      userId: string;
      isTyping: boolean;
    }) => {
      if (activeChat && activeChat.id === chatId && userId === activeChat.otherUser?.id) {
        setIsPeerTyping(isTyping);
      }
    };

    const handleUserPresence = ({
      userId,
      isOnline,
    }: {
      userId: string;
      isOnline: boolean;
    }) => {
      setChats((prev) =>
        prev.map((c) =>
          c.otherUser?.id === userId
            ? { ...c, otherUser: { ...c.otherUser, isOnline } }
            : c
        )
      );
      if (activeChat?.otherUser?.id === userId) {
        setActiveChat((prev) =>
          prev ? { ...prev, otherUser: { ...prev.otherUser, isOnline } } : null
        );
      }
    };

    const handleDisappearingUpdated = ({
      chatId,
      seconds,
    }: {
      chatId: string;
      seconds: number | null;
    }) => {
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, disappearingSeconds: seconds } : c))
      );
      if (activeChat && activeChat.id === chatId) {
        setActiveChat((prev) => (prev ? { ...prev, disappearingSeconds: seconds } : null));
      }
    };

    const handleMessageExpired = ({ messageId }: { messageId: string; chatId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_status_update', handleStatusUpdate);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_presence', handleUserPresence);
    socket.on('disappearing_timer_updated', handleDisappearingUpdated);
    socket.on('message_expired', handleMessageExpired);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_status_update', handleStatusUpdate);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_presence', handleUserPresence);
      socket.off('disappearing_timer_updated', handleDisappearingUpdated);
      socket.off('message_expired', handleMessageExpired);
    };
  }, [activeChat?.id, user]);

  // Handle typing input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    const socket = socketService.getSocket();
    if (!socket || !activeChat || !user) return;

    socket.emit('typing_start', {
      chatId: activeChat.id,
      receiverId: activeChat.otherUser.id,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', {
        chatId: activeChat.id,
        receiverId: activeChat.otherUser.id,
      });
    }, 1500);
  };

  // Perform actual encryption & dispatch
  const executeSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || !activeChat || !user) return;

    try {
      const aesKey = await getOrDeriveChatKey(activeChat);

      // Encrypt message locally with fresh IV
      const { ciphertext, iv } = await encryptMessage(textToSend.trim(), aesKey);

      const expiresAt = activeChat.disappearingSeconds
        ? Date.now() + activeChat.disappearingSeconds * 1000
        : null;

      const socket = socketService.getSocket();
      if (!socket) throw new Error('Socket not connected');

      // Optimistic local entry
      const optimisticMsg: DecryptedMessage = {
        id: 'temp-' + Date.now(),
        chatId: activeChat.id,
        senderId: user.id,
        receiverId: activeChat.otherUser.id,
        ciphertext,
        iv,
        plaintext: textToSend.trim(),
        createdAt: Date.now(),
        expiresAt,
        status: 'sent',
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      setInputText('');
      setTimeout(scrollToBottom, 50);

      // Dispatch ciphertext to socket relay
      socket.emit(
        'send_message',
        {
          chatId: activeChat.id,
          receiverId: activeChat.otherUser.id,
          ciphertext,
          iv,
          expiresAt,
        },
        (res) => {
          if (res.status === 'ok') {
            setMessages((prev) =>
              prev.map((m) => (m.id === optimisticMsg.id ? { ...m, id: res.message.id, status: res.message.status } : m))
            );
          }
        }
      );
    } catch (err) {
      console.error('Failed to encrypt or send message:', err);
    }
  };

  // Send message trigger (with Sensitive-Content Warning check)
  const handleSendTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Feature 4: Detect sensitive information before sending
    const sensitivity = detectSensitiveContent(inputText);
    if (sensitivity.isSensitive) {
      setPendingSensitiveSend(sensitivity);
      setIsSensitivityModalOpen(true);
      return;
    }

    executeSendMessage(inputText);
  };

  const handleConfirmSensitiveSend = () => {
    setIsSensitivityModalOpen(false);
    executeSendMessage(inputText);
    setPendingSensitiveSend(null);
  };

  const handleUpdateDisappearingTimer = async (seconds: number | null) => {
    if (!activeChat) return;
    try {
      await api.updateDisappearingTimer(activeChat.id, seconds);
      setActiveChat((prev) => (prev ? { ...prev, disappearingSeconds: seconds } : null));

      const socket = socketService.getSocket();
      if (socket) {
        socket.emit('set_disappearing_timer', {
          chatId: activeChat.id,
          receiverId: activeChat.otherUser.id,
          seconds,
        });
      }
    } catch (err) {
      console.error('Failed to update disappearing timer:', err);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-cyber-bg font-sans">
      {/* Sidebar: Chats list */}
      <div className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-auto h-full`}>
        <ChatSidebar
          chats={chats}
          activeChatId={activeChat?.id || null}
          onSelectChat={(chat) => setActiveChat(chat)}
          onOpenNewChat={() => setIsNewChatOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </div>

      {/* Main Chat Area */}
      <div className={`${activeChat ? 'flex' : 'hidden md:flex'} flex-1 h-full flex-col bg-cyber-bg overflow-hidden relative`}>
        {activeChat ? (
          <>
            <ChatHeader
              otherUser={activeChat.otherUser}
              disappearingSeconds={activeChat.disappearingSeconds}
              isPeerTyping={isPeerTyping}
              onBackToSidebar={() => setActiveChat(null)}
              onOpenEncryptionInfo={() => setIsEncryptionInfoOpen(true)}
              onOpenDisappearingModal={() => setIsDisappearingModalOpen(true)}
            />

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {isLoadingMessages ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-cyber-muted font-mono text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin text-cyber-cyan" />
                  <span>Deriving shared ECDH key & decrypting messages...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-cyber-muted">
                  <Shield className="w-12 h-12 mb-3 text-cyber-cyan/40" />
                  <h3 className="text-base font-bold text-cyber-text font-mono">
                    Zero-Knowledge Channel Established
                  </h3>
                  <p className="text-xs text-cyber-muted max-w-sm mt-1 font-mono">
                    Your device and {activeChat.otherUser.username}'s device agreed on a 256-bit AES key via ECDH P-256. Messages sent here are encrypted before leaving your browser.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isMe={msg.senderId === user?.id}
                    onExpire={(msgId) => {
                      setMessages((prev) => prev.filter((m) => m.id !== msgId));
                    }}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form Bar */}
            <form onSubmit={handleSendTrigger} className="p-3 bg-cyber-panel/90 border-t border-cyber-border backdrop-blur-md">
              <div className="relative flex items-center gap-2 max-w-4xl mx-auto">
                <input
                  type="text"
                  placeholder="Type an end-to-end encrypted message..."
                  value={inputText}
                  onChange={handleInputChange}
                  className="flex-1 py-3 pl-4 pr-12 rounded-xl bg-cyber-card border border-cyber-border-light text-cyber-text placeholder:text-cyber-muted text-sm focus:outline-none focus:border-cyber-cyan/70 font-mono transition-colors"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="px-4 py-3 rounded-xl bg-cyber-cyan text-cyber-bg font-bold hover:bg-cyber-cyan/90 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-neon-cyan flex items-center justify-center"
                  title="Encrypt & Send"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Empty State when no conversation is selected */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="p-4 rounded-2xl bg-cyber-panel border border-cyber-cyan/30 shadow-neon-cyan/20 mb-4">
              <Shield className="w-14 h-14 text-cyber-cyan" />
            </div>
            <h2 className="text-xl font-bold text-cyber-text font-mono">
              SecureChat Terminal Ready
            </h2>
            <p className="text-sm text-cyber-muted max-w-md mt-2 font-mono">
              End-to-end encrypted messaging with client-side Web Crypto API. Select a conversation from the sidebar or start a new encrypted channel.
            </p>
            <button
              onClick={() => setIsNewChatOpen(true)}
              className="mt-6 px-5 py-2.5 rounded-xl bg-cyber-cyan text-cyber-bg font-bold font-mono text-xs hover:bg-cyber-cyan/90 transition-all shadow-neon-cyan"
            >
              + Start Encrypted Chat
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <SensitivityModal
        isOpen={isSensitivityModalOpen}
        sensitivityResult={pendingSensitiveSend}
        onConfirmSend={handleConfirmSensitiveSend}
        onCancel={() => setIsSensitivityModalOpen(false)}
      />

      <EncryptionInfoModal
        isOpen={isEncryptionInfoOpen}
        onClose={() => setIsEncryptionInfoOpen(false)}
        otherUser={activeChat?.otherUser || null}
      />

      <DisappearingTimerModal
        isOpen={isDisappearingModalOpen}
        currentSeconds={activeChat?.disappearingSeconds}
        onSelectTimer={handleUpdateDisappearingTimer}
        onClose={() => setIsDisappearingModalOpen(false)}
      />

      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onSelectChat={(chat) => {
          setActiveChat(chat);
          loadChats();
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
