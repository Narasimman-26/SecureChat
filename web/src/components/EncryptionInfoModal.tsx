import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, Key, Database, Cpu, X, CheckCircle2 } from 'lucide-react';
import { User } from '@shared/types';

interface EncryptionInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  otherUser: User | null;
}

export const EncryptionInfoModal: React.FC<EncryptionInfoModalProps> = ({
  isOpen,
  onClose,
  otherUser,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-cyber-panel border border-cyber-cyan/30 shadow-neon-cyan"
        >
          {/* Neon top line */}
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
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-cyber-text font-mono flex items-center gap-2">
                  End-to-End Encryption
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyber-emerald/10 text-cyber-emerald border border-cyber-emerald/30">
                    Active
                  </span>
                </h3>
                <p className="text-xs text-cyber-muted">
                  Cryptographic verification for conversation with {otherUser?.username || 'Peer'}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3.5 text-sm">
              <div className="p-3.5 rounded-xl bg-cyber-card border border-cyber-border-light flex gap-3">
                <Key className="w-5 h-5 text-cyber-cyan shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-cyber-text text-sm">ECDH P-256 Key Agreement</h4>
                  <p className="text-xs text-cyber-muted mt-0.5">
                    Elliptic-curve Diffie-Hellman generates a shared secret mathematically on-device. The shared key never crosses the network.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-cyber-card border border-cyber-border-light flex gap-3">
                <Lock className="w-5 h-5 text-cyber-emerald shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-cyber-text text-sm">AES-256-GCM Authenticated Encryption</h4>
                  <p className="text-xs text-cyber-muted mt-0.5">
                    Messages are encrypted with military-grade 256-bit Galois/Counter Mode with fresh 96-bit IVs. Tampering causes instant cryptographic rejection.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-cyber-card border border-cyber-border-light flex gap-3">
                <Cpu className="w-5 h-5 text-cyber-cyan shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-cyber-text text-sm">Non-Extractable Hardware Storage</h4>
                  <p className="text-xs text-cyber-muted mt-0.5">
                    Private keys are stored in IndexedDB with <code>extractable: false</code>. Even XSS scripts cannot read the raw private key bytes.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-cyber-card border border-cyber-border-light flex gap-3">
                <Database className="w-5 h-5 text-cyber-amber shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-cyber-text text-sm">Zero-Knowledge Database</h4>
                  <p className="text-xs text-cyber-muted mt-0.5">
                    Firebase Firestore & Node.js relay only receive and persist ciphertext blobs. Plaintext is 100% blind to the server.
                  </p>
                </div>
              </div>
            </div>

            {/* Public key fingerprint */}
            {otherUser?.publicKey && (
              <div className="mt-4 p-3 rounded-xl bg-black/50 border border-cyber-border">
                <span className="text-[11px] font-mono text-cyber-muted uppercase tracking-wider block">
                  Peer Public Key Fingerprint
                </span>
                <p className="text-xs font-mono text-cyber-cyan break-all mt-1 line-clamp-2">
                  {otherUser.publicKey.slice(0, 80)}...
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-cyber-cyan hover:bg-cyber-cyan/90 text-cyber-bg font-bold text-sm shadow-neon-cyan transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Got it
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
