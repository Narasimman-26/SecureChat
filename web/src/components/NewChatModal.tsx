import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, X, Lock, Check } from 'lucide-react';
import { User, ChatSummary } from '@shared/types';
import { api } from '../services/api';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (chat: ChatSummary) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  onClose,
  onSelectChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    try {
      const results = await api.searchUsers(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        setError('No users found matching that username or email');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartChat = async (user: User) => {
    try {
      const { chat } = await api.startChat(user.id);
      onSelectChat(chat);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create chat session');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl bg-cyber-panel border border-cyber-border-light shadow-2xl"
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-cyber-cyan via-cyber-emerald to-cyber-cyan" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-cyber-muted hover:text-cyber-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-cyber-text font-mono">
                  Start Encrypted Chat
                </h3>
                <p className="text-xs text-cyber-muted">
                  Search registered users to perform ECDH key exchange
                </p>
              </div>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="mt-5">
              <div className="relative">
                <Search className="w-4 h-4 text-cyber-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Enter username or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-cyber-card border border-cyber-border-light text-cyber-text placeholder:text-cyber-muted text-sm focus:outline-none focus:border-cyber-cyan font-mono"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-cyber-cyan text-cyber-bg font-bold text-xs hover:bg-cyber-cyan/90 transition-all disabled:opacity-50"
                >
                  {isSearching ? '...' : 'Search'}
                </button>
              </div>
            </form>

            {error && (
              <p className="mt-3 text-xs text-cyber-danger font-mono bg-cyber-danger/10 p-2.5 rounded-lg border border-cyber-danger/20">
                {error}
              </p>
            )}

            {/* Results List */}
            <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleStartChat(u)}
                  className="w-full p-3 rounded-xl bg-cyber-card/60 hover:bg-cyber-card border border-cyber-border/60 hover:border-cyber-cyan/50 text-left flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyber-border-light flex items-center justify-center font-mono font-bold text-cyber-cyan text-xs">
                      {u.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-cyber-text font-mono group-hover:text-cyber-cyan transition-colors">
                        {u.username}
                      </h4>
                      <p className="text-xs text-cyber-muted">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-cyber-cyan font-mono">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Connect</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
