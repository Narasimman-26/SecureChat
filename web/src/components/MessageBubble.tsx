import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCheck, Lock, AlertTriangle, Copy, Terminal, Timer, Shield } from 'lucide-react';
import { DecryptedMessage } from '@shared/types';
import { useSettings } from '../context/SettingsContext';

interface MessageBubbleProps {
  message: DecryptedMessage;
  isMe: boolean;
  onExpire?: (messageId: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMe,
  onExpire,
}) => {
  const { showRawCiphertext } = useSettings();
  const [copied, setCopied] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(() => {
    if (!message.expiresAt) return null;
    const diff = Math.max(0, Math.floor((message.expiresAt - Date.now()) / 1000));
    return diff;
  });

  // Countdown timer for disappearing messages
  useEffect(() => {
    if (!message.expiresAt) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((message.expiresAt! - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        if (onExpire) {
          onExpire(message.id);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [message.expiresAt, message.id, onExpire]);

  const copyCiphertext = () => {
    navigator.clipboard.writeText(message.ciphertext);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (secondsRemaining !== null && secondsRemaining <= 0) {
    return null; // Dissolved
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, filter: 'blur(10px)', transition: { duration: 0.35 } }}
      transition={{ duration: 0.2 }}
      className={`flex flex-col my-1.5 ${isMe ? 'items-end' : 'items-start'} w-full max-w-full`}
    >
      <div
        className={`relative group max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 transition-all ${
          isMe
            ? 'bg-cyber-panel/90 border border-cyber-cyan/40 text-cyber-text shadow-sm rounded-tr-sm hover:border-cyber-cyan/70'
            : 'bg-cyber-card/90 border border-cyber-border-light text-cyber-text rounded-tl-sm hover:border-cyber-border-light/80'
        }`}
      >
        {/* Disappearing timer badge if applicable */}
        {secondsRemaining !== null && (
          <div className="flex items-center gap-1.5 text-[11px] font-mono mb-1.5 text-cyber-amber bg-cyber-amber/10 px-2 py-0.5 rounded-md border border-cyber-amber/30 w-fit">
            <Timer className="w-3.5 h-3.5 animate-pulse" />
            <span>Disappearing in {secondsRemaining}s</span>
          </div>
        )}

        {/* Plaintext or Decryption Error */}
        {message.decryptionError ? (
          <div className="flex items-center gap-2 text-cyber-danger py-1">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="text-sm font-mono italic">
              Authentication Tag Failed (Tampered or Missing Key)
            </span>
          </div>
        ) : (
          <p className="text-sm sm:text-base leading-relaxed break-words whitespace-pre-wrap">
            {message.plaintext || message.ciphertext}
          </p>
        )}

        {/* Raw Ciphertext Demo Panel (When Settings Toggle ON) */}
        {showRawCiphertext && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 pt-2.5 border-t border-cyber-border/70 text-xs font-mono"
          >
            <div className="flex items-center justify-between text-[11px] text-cyber-cyan mb-1.5">
              <span className="flex items-center gap-1 font-semibold">
                <Lock className="w-3 h-3 text-cyber-cyan" />
                RAW CIPHERTEXT (AES-256-GCM)
              </span>
              <button
                type="button"
                onClick={copyCiphertext}
                className="hover:text-white transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/40 border border-cyber-cyan/30"
                title="Copy raw ciphertext"
              >
                <Copy className="w-2.5 h-2.5" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            
            <div className="bg-black/60 rounded p-2 text-[11px] text-cyber-muted break-all border border-cyber-border/50 max-h-24 overflow-y-auto select-all">
              <span className="text-cyber-cyan/70 select-none">ct: </span>
              {message.ciphertext}
            </div>

            <div className="mt-1 flex items-center justify-between text-[10px] text-cyber-muted px-0.5">
              <span>
                <strong className="text-cyber-cyan/70 font-normal">IV:</strong> {message.iv.slice(0, 14)}...
              </span>
              <span className="text-cyber-emerald flex items-center gap-0.5">
                <Shield className="w-2.5 h-2.5" /> 256-bit GCM
              </span>
            </div>
          </motion.div>
        )}

        {/* Message Meta: Time & Status Ticks */}
        <div className="flex items-center justify-end gap-1.5 mt-1 text-[11px] text-cyber-muted font-mono select-none">
          <span>{formattedTime}</span>
          {isMe && (
            <span className="flex items-center ml-0.5">
              {message.status === 'sent' && (
                <span title="Sent to server">
                  <Check className="w-3.5 h-3.5 text-cyber-muted" />
                </span>
              )}
              {message.status === 'delivered' && (
                <span title="Delivered to peer">
                  <CheckCheck className="w-3.5 h-3.5 text-cyber-cyan-muted" />
                </span>
              )}
              {message.status === 'read' && (
                <span title="Read by peer">
                  <CheckCheck className="w-3.5 h-3.5 text-cyber-cyan glow-cyan" />
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};
