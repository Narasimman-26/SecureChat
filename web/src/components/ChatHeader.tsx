import React from 'react';
import { Lock, Timer, ArrowLeft, ShieldCheck, Flame, Circle } from 'lucide-react';
import { User } from '@shared/types';

interface ChatHeaderProps {
  otherUser: User | null;
  disappearingSeconds?: number | null;
  isPeerTyping?: boolean;
  onBackToSidebar?: () => void;
  onOpenEncryptionInfo: () => void;
  onOpenDisappearingModal: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  otherUser,
  disappearingSeconds,
  isPeerTyping,
  onBackToSidebar,
  onOpenEncryptionInfo,
  onOpenDisappearingModal,
}) => {
  if (!otherUser) return null;

  return (
    <div className="h-16 px-4 border-b border-cyber-border bg-cyber-panel/90 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
      {/* Left: Avatar & User details */}
      <div className="flex items-center gap-3">
        {onBackToSidebar && (
          <button
            onClick={onBackToSidebar}
            className="md:hidden p-2 -ml-1 text-cyber-muted hover:text-cyber-cyan transition-colors"
            title="Back to conversations"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Avatar with status indicator */}
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyber-border-light to-cyber-card flex items-center justify-center font-mono font-bold text-cyber-cyan border border-cyber-cyan/30">
            {otherUser.username.slice(0, 2).toUpperCase()}
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-cyber-bg ${
              otherUser.isOnline ? 'bg-cyber-emerald shadow-neon-emerald' : 'bg-gray-500'
            }`}
          />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-cyber-text font-mono leading-none">
              {otherUser.username}
            </h2>
          </div>

          <div className="text-xs font-mono mt-1 flex items-center gap-1.5">
            {isPeerTyping ? (
              <span className="text-cyber-cyan animate-pulse flex items-center gap-1">
                <span>typing</span>
                <span className="animate-bounce">.</span>
                <span className="animate-bounce [animation-delay:0.2s]">.</span>
                <span className="animate-bounce [animation-delay:0.4s]">.</span>
              </span>
            ) : otherUser.isOnline ? (
              <span className="text-cyber-emerald flex items-center gap-1">
                <Circle className="w-2 h-2 fill-cyber-emerald" /> Online
              </span>
            ) : (
              <span className="text-cyber-muted">
                {otherUser.lastSeen
                  ? `Last seen ${new Date(otherUser.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Offline'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Actions: E2EE Lock Badge & Disappearing Timer */}
      <div className="flex items-center gap-2">
        {/* Disappearing Timer button */}
        <button
          onClick={onOpenDisappearingModal}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-all ${
            disappearingSeconds
              ? 'bg-cyber-amber/10 border-cyber-amber/40 text-cyber-amber hover:bg-cyber-amber/20'
              : 'bg-cyber-card border-cyber-border text-cyber-muted hover:text-cyber-text hover:border-cyber-border-light'
          }`}
          title="Disappearing messages timer"
        >
          {disappearingSeconds ? (
            <>
              <Flame className="w-3.5 h-3.5 animate-pulse text-cyber-amber" />
              <span>{disappearingSeconds}s</span>
            </>
          ) : (
            <>
              <Timer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Timer</span>
            </>
          )}
        </button>

        {/* Lock badge: End-to-end encrypted */}
        <button
          onClick={onOpenEncryptionInfo}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan hover:bg-cyber-cyan/20 shadow-neon-cyan/10 transition-all font-mono text-xs"
          title="Click to view cryptographic verification"
        >
          <Lock className="w-3.5 h-3.5 text-cyber-cyan" />
          <span className="font-semibold hidden sm:inline">End-to-End Encrypted</span>
          <span className="font-semibold sm:hidden">E2EE</span>
        </button>
      </div>
    </div>
  );
};
