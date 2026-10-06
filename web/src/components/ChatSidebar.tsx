import React, { useState } from 'react';
import { Search, Plus, Settings, Shield, Lock, Flame, Circle, Eye, EyeOff } from 'lucide-react';
import { ChatSummary, User } from '@shared/types';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

interface ChatSidebarProps {
  chats: ChatSummary[];
  activeChatId: string | null;
  onSelectChat: (chat: ChatSummary) => void;
  onOpenNewChat: () => void;
  onOpenSettings: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onOpenNewChat,
  onOpenSettings,
}) => {
  const { user } = useAuth();
  const { showRawCiphertext, toggleShowRawCiphertext } = useSettings();
  const [filterQuery, setFilterQuery] = useState('');

  const filteredChats = chats.filter((c) =>
    c.otherUser?.username.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <aside className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-cyber-panel border-r border-cyber-border shrink-0 select-none">
      {/* Top Header */}
      <div className="p-4 border-b border-cyber-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan shadow-neon-cyan/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-cyber-text font-mono tracking-tight flex items-center gap-1.5">
              SecureChat
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30">
                E2EE
              </span>
            </h1>
            <p className="text-[11px] text-cyber-muted font-mono">Zero-Knowledge Relay</p>
          </div>
        </div>

        <button
          onClick={onOpenNewChat}
          className="p-2.5 rounded-xl bg-cyber-card hover:bg-cyber-cyan/10 border border-cyber-border hover:border-cyber-cyan/40 text-cyber-cyan transition-all flex items-center gap-1 text-xs font-mono"
          title="Start new encrypted chat"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3">
        <div className="relative">
          <Search className="w-4 h-4 text-cyber-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter chats..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-cyber-card border border-cyber-border text-cyber-text placeholder:text-cyber-muted text-xs focus:outline-none focus:border-cyber-cyan/60 font-mono transition-colors"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center text-cyber-muted">
            <Lock className="w-8 h-8 mx-auto mb-2 text-cyber-border-light" />
            <p className="text-xs font-mono">No conversations found</p>
            <button
              onClick={onOpenNewChat}
              className="mt-3 text-xs text-cyber-cyan hover:underline font-mono"
            >
              Start an encrypted chat
            </button>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isSelected = chat.id === activeChatId;
            const otherUser = chat.otherUser;

            return (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat)}
                className={`w-full p-3 rounded-xl text-left flex items-center gap-3 transition-all ${
                  isSelected
                    ? 'bg-cyber-card border border-cyber-cyan/50 shadow-neon-cyan/10'
                    : 'bg-transparent hover:bg-cyber-card/60 border border-transparent'
                }`}
              >
                {/* Avatar with online dot */}
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-xl bg-cyber-card border border-cyber-border-light flex items-center justify-center font-mono font-bold text-cyber-cyan text-sm">
                    {otherUser?.username?.slice(0, 2).toUpperCase() || '??'}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-cyber-panel ${
                      otherUser?.isOnline ? 'bg-cyber-emerald shadow-neon-emerald' : 'bg-gray-600'
                    }`}
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-cyber-text font-mono truncate">
                      {otherUser?.username || 'Unknown User'}
                    </span>
                    {chat.lastMessage && (
                      <span className="text-[10px] text-cyber-muted font-mono shrink-0 ml-1">
                        {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-1 text-xs text-cyber-muted font-mono">
                    <p className="truncate text-xs flex items-center gap-1 text-cyber-muted">
                      <Lock className="w-2.5 h-2.5 shrink-0 text-cyber-cyan/60" />
                      <span className="truncate">
                        {chat.lastMessage ? 'Encrypted payload' : 'No messages yet'}
                      </span>
                    </p>

                    {chat.disappearingSeconds && (
                      <span className="text-cyber-amber shrink-0 flex items-center gap-0.5" title={`Disappearing: ${chat.disappearingSeconds}s`}>
                        <Flame className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* User Footer with Settings & Demo Mode toggle */}
      <div className="p-3 border-t border-cyber-border bg-cyber-card/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-cyber-border-light flex items-center justify-center font-mono font-bold text-cyber-cyan text-xs shrink-0">
            {user?.username?.slice(0, 2).toUpperCase() || 'ME'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-cyber-text font-mono truncate">{user?.username}</p>
            <p className="text-[10px] text-cyber-emerald flex items-center gap-1 font-mono">
              <Circle className="w-1.5 h-1.5 fill-cyber-emerald" /> E2EE Ready
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Quick toggle raw ciphertext button */}
          <button
            onClick={toggleShowRawCiphertext}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              showRawCiphertext
                ? 'bg-cyber-cyan/20 border-cyber-cyan text-cyber-cyan shadow-neon-cyan/20'
                : 'bg-cyber-card border-cyber-border text-cyber-muted hover:text-cyber-text'
            }`}
            title={showRawCiphertext ? 'Raw ciphertext ON (Demo Mode)' : 'Raw ciphertext OFF'}
          >
            {showRawCiphertext ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-cyber-card hover:bg-cyber-border-light border border-cyber-border text-cyber-muted hover:text-cyber-text transition-colors"
            title="App settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
