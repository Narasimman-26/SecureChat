import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, AlertTriangle, Key, CreditCard, Hash, Phone, Lock, X } from 'lucide-react';
import { SensitivityCheckResult, SensitiveIssueType } from '@shared/types';

interface SensitivityModalProps {
  isOpen: boolean;
  sensitivityResult: SensitivityCheckResult | null;
  onConfirmSend: () => void;
  onCancel: () => void;
}

const getIssueIcon = (type: SensitiveIssueType) => {
  switch (type) {
    case 'password':
      return <Key className="w-5 h-5 text-cyber-amber" />;
    case 'credit_card':
      return <CreditCard className="w-5 h-5 text-cyber-danger" />;
    case 'otp':
      return <Hash className="w-5 h-5 text-cyber-amber" />;
    case 'phone':
      return <Phone className="w-5 h-5 text-cyber-cyan" />;
  }
};

export const SensitivityModal: React.FC<SensitivityModalProps> = ({
  isOpen,
  sensitivityResult,
  onConfirmSend,
  onCancel,
}) => {
  if (!isOpen || !sensitivityResult) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-cyber-panel border border-cyber-danger/40 shadow-neon-danger"
        >
          {/* Top glowing bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-cyber-danger via-cyber-amber to-cyber-danger animate-pulse" />

          {/* Close button */}
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-cyber-muted hover:text-cyber-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-cyber-danger/10 border border-cyber-danger/30 text-cyber-danger">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-cyber-text font-mono">
                    Sensitive Content Warning
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-cyber-danger/20 text-cyber-danger border border-cyber-danger/30">
                    AI Guard
                  </span>
                </div>
                <p className="mt-1 text-sm text-cyber-muted">
                  Client-side security filters detected sensitive credentials or personal data in your draft.
                </p>
              </div>
            </div>

            {/* Issues List */}
            <div className="mt-5 space-y-3">
              {sensitivityResult.issues.map((issue, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-cyber-card/80 border border-cyber-border-light/40 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {getIssueIcon(issue.type)}
                      <span className="text-sm font-semibold text-cyber-text">
                        {issue.label}
                      </span>
                    </div>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-black/60 text-cyber-amber border border-cyber-amber/20">
                      {issue.matchedPreview}
                    </span>
                  </div>
                  <p className="text-xs text-cyber-muted pl-7">
                    {issue.recommendation}
                  </p>
                </div>
              ))}
            </div>

            {/* Zero-knowledge reassurance box */}
            <div className="mt-4 p-3 rounded-lg bg-cyber-cyan/5 border border-cyber-cyan/20 flex items-center gap-2.5 text-xs text-cyber-cyan-muted">
              <Lock className="w-4 h-4 shrink-0 text-cyber-cyan" />
              <span>
                Even if sent, your message is encrypted with <strong>AES-256-GCM</strong>. Neither our server nor database can read it.
              </span>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-cyber-border-light text-cyber-text font-medium text-sm hover:bg-cyber-card transition-all"
              >
                Cancel & Edit
              </button>
              <button
                type="button"
                onClick={onConfirmSend}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyber-danger hover:bg-cyber-danger/90 text-white font-semibold text-sm shadow-neon-danger transition-all flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                Send Encrypted Anyway
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
