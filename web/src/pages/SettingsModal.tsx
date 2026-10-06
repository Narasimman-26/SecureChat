import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Eye, EyeOff, ShieldCheck, Cpu, Key, Copy, Check, X, LogOut } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { showRawCiphertext, toggleShowRawCiphertext } = useSettings();
  const { user, logout, hasPrivateKeyInVault } = useAuth();
  const [copiedKey, setCopiedKey] = useState(false);

  if (!isOpen) return null;

  const handleCopyKey = () => {
    if (user?.publicKey) {
      navigator.clipboard.writeText(user.publicKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-cyber-panel border border-cyber-border-light shadow-2xl"
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
              <div className="p-3 rounded-xl bg-cyber-card border border-cyber-border-light text-cyber-cyan">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-cyber-text font-mono">
                  App & Security Settings
                </h3>
                <p className="text-xs text-cyber-muted">
                  Configure cryptographic inspection and demo preferences
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {/* Feature 5: Demo Toggle "Show raw encrypted data" */}
              <div className="p-4 rounded-xl bg-cyber-card border border-cyber-border-light flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan shrink-0 mt-0.5">
                    {showRawCiphertext ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-cyber-text font-mono">
                        Show Raw Encrypted Data
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30">
                        Demo Mode
                      </span>
                    </div>
                    <p className="text-xs text-cyber-muted mt-1 leading-relaxed">
                      Render the underlying AES-256-GCM ciphertext, initialization vector (IV), and auth tags inside each message bubble. Essential for recruiters and video walkthroughs!
                    </p>
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  type="button"
                  onClick={toggleShowRawCiphertext}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                    showRawCiphertext ? 'bg-cyber-cyan' : 'bg-cyber-border'
                  }`}
                >
                  <motion.div
                    animate={{ x: showRawCiphertext ? 24 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-5 h-5 rounded-full bg-cyber-bg shadow-md"
                  />
                </button>
              </div>

              {/* Hardware / Browser Vault Status */}
              <div className="p-4 rounded-xl bg-cyber-card/60 border border-cyber-border-light space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-cyber-text">
                    <Cpu className="w-4 h-4 text-cyber-emerald" />
                    <span>IndexedDB Hardware Isolation</span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyber-emerald/10 text-cyber-emerald border border-cyber-emerald/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Non-Extractable
                  </span>
                </div>
                <p className="text-xs text-cyber-muted">
                  Your private key was generated with Web Crypto API <code>extractable: false</code>. It cannot be extracted by JavaScript or logged over the network.
                </p>

                {/* User Public Key */}
                {user?.publicKey && (
                  <div className="pt-2 border-t border-cyber-border/60">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-cyber-muted font-mono flex items-center gap-1">
                        <Key className="w-3 h-3 text-cyber-cyan" /> Your Public Key (P-256 JWK):
                      </span>
                      <button
                        onClick={handleCopyKey}
                        className="text-cyber-cyan hover:underline flex items-center gap-1"
                      >
                        {copiedKey ? <Check className="w-3 h-3 text-cyber-emerald" /> : <Copy className="w-3 h-3" />}
                        {copiedKey ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="p-2 rounded bg-black/60 font-mono text-[10px] text-cyber-cyan/80 break-all max-h-16 overflow-y-auto border border-cyber-border">
                      {user.publicKey}
                    </div>
                  </div>
                )}
              </div>

              {/* Account section */}
              <div className="p-4 rounded-xl bg-cyber-card/40 border border-cyber-border flex items-center justify-between">
                <div>
                  <span className="text-xs text-cyber-muted font-mono block">Logged in as:</span>
                  <span className="text-sm font-bold text-cyber-text font-mono">{user?.username}</span>
                  <span className="text-xs text-cyber-muted block">{user?.email}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-cyber-danger/10 border border-cyber-danger/30 text-cyber-danger hover:bg-cyber-danger/20 font-mono text-xs flex items-center gap-2 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
