import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Clock, Check, X, Flame } from 'lucide-react';

interface DisappearingTimerModalProps {
  isOpen: boolean;
  currentSeconds: number | null | undefined;
  onSelectTimer: (seconds: number | null) => void;
  onClose: () => void;
}

const TIMER_OPTIONS = [
  { label: 'Off', seconds: null, description: 'Messages stay in chat indefinitely' },
  { label: '10 Seconds', seconds: 10, description: 'Rapid burn (recommended for live recruiter demos)' },
  { label: '30 Seconds', seconds: 30, description: 'Short-lived ephemeral messages' },
  { label: '5 Minutes', seconds: 300, description: 'Ideal for brief confidential exchanges' },
  { label: '1 Hour', seconds: 3600, description: 'Disappears after one hour' },
  { label: '24 Hours', seconds: 86400, description: 'Standard day-long auto delete' },
];

export const DisappearingTimerModal: React.FC<DisappearingTimerModalProps> = ({
  isOpen,
  currentSeconds,
  onSelectTimer,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl bg-cyber-panel border border-cyber-border-light shadow-2xl"
        >
          <div className="h-1.5 w-full bg-gradient-to-r from-cyber-amber via-cyber-danger to-cyber-amber" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-cyber-muted hover:text-cyber-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyber-amber/10 border border-cyber-amber/30 text-cyber-amber">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-cyber-text font-mono flex items-center gap-2">
                  Disappearing Messages
                </h3>
                <p className="text-xs text-cyber-muted">
                  Auto-purges ciphertext from database and screens upon expiry
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {TIMER_OPTIONS.map((opt) => {
                const isSelected = currentSeconds === opt.seconds;
                return (
                  <button
                    key={opt.label}
                    onClick={() => {
                      onSelectTimer(opt.seconds);
                      onClose();
                    }}
                    className={`w-full p-3 rounded-xl text-left border flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-cyber-card border-cyber-cyan shadow-neon-cyan/20'
                        : 'bg-cyber-card/50 border-cyber-border/60 hover:bg-cyber-card hover:border-cyber-border-light'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold font-mono ${isSelected ? 'text-cyber-cyan' : 'text-cyber-text'}`}>
                          {opt.label}
                        </span>
                        {opt.seconds === 10 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyber-amber/20 text-cyber-amber border border-cyber-amber/30">
                            Demo Mode
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-cyber-muted mt-0.5">{opt.description}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-cyber-cyan shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
