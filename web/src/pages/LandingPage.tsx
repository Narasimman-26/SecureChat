import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Lock,
  Key,
  Database,
  Cpu,
  AlertTriangle,
  Flame,
  ArrowRight,
  Github,
  CheckCircle2,
  Copy,
  Terminal,
  RefreshCw,
  Eye,
  Sliders,
} from 'lucide-react';
import {
  generateIdentityKeyPair,
  deriveChatKey,
  encryptMessage,
  decryptMessage,
  arrayBufferToBase64,
  base64ToArrayBuffer,
} from '../crypto';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  // Playground state
  const [playgroundInput, setPlaygroundInput] = useState('Top secret operative message #2026');
  const [playgroundCiphertext, setPlaygroundCiphertext] = useState('');
  const [playgroundIv, setPlaygroundIv] = useState('');
  const [playgroundDecrypted, setPlaygroundDecrypted] = useState('');
  const [isTampered, setIsTampered] = useState(false);
  const [tamperError, setTamperError] = useState<string | null>(null);
  const [playgroundKey, setPlaygroundKey] = useState<CryptoKey | null>(null);

  // Initialize playground crypto keys on mount
  useEffect(() => {
    const initPlayground = async () => {
      try {
        const alice = await generateIdentityKeyPair();
        const bob = await generateIdentityKeyPair();
        const derived = await deriveChatKey(bob.publicKeyJwk, alice.privateKey);
        setPlaygroundKey(derived);
      } catch (err) {
        console.error('Playground init error:', err);
      }
    };
    initPlayground();
  }, []);

  // Encrypt playground text whenever input or key changes
  useEffect(() => {
    if (!playgroundKey || !playgroundInput) return;

    let active = true;
    const runEncrypt = async () => {
      try {
        setIsTampered(false);
        setTamperError(null);
        const { ciphertext, iv } = await encryptMessage(playgroundInput, playgroundKey);
        if (active) {
          setPlaygroundCiphertext(ciphertext);
          setPlaygroundIv(iv);
          const decrypted = await decryptMessage(ciphertext, iv, playgroundKey);
          setPlaygroundDecrypted(decrypted);
        }
      } catch (err) {
        console.error('Playground encrypt error:', err);
      }
    };

    runEncrypt();
    return () => {
      active = false;
    };
  }, [playgroundInput, playgroundKey]);

  const handleTamperPlayground = async () => {
    if (!playgroundKey || !playgroundCiphertext) return;
    try {
      const rawBytes = base64ToArrayBuffer(playgroundCiphertext);
      rawBytes[0] ^= 0xff; // Flip first byte
      const tampered = arrayBufferToBase64(rawBytes);
      setPlaygroundCiphertext(tampered);
      setIsTampered(true);

      // Decryption must fail under Galois/Counter Mode
      try {
        await decryptMessage(tampered, playgroundIv, playgroundKey);
        setTamperError('Unexpected: deciphered despite tamper');
      } catch {
        setTamperError('AUTHENTICATION_TAG_MISMATCH: AES-GCM rejected tampered payload!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPlayground = async () => {
    if (!playgroundKey) return;
    setIsTampered(false);
    setTamperError(null);
    const { ciphertext, iv } = await encryptMessage(playgroundInput, playgroundKey);
    setPlaygroundCiphertext(ciphertext);
    setPlaygroundIv(iv);
    const decrypted = await decryptMessage(ciphertext, iv, playgroundKey);
    setPlaygroundDecrypted(decrypted);
  };

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text font-sans selection:bg-cyber-cyan/30 selection:text-cyber-cyan relative overflow-x-hidden">
      {/* Top Navbar */}
      <nav className="h-20 border-b border-cyber-border/80 bg-cyber-bg/90 backdrop-blur-md sticky top-0 z-40 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyber-panel border border-cyber-cyan/30 text-cyber-cyan shadow-neon-cyan/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="font-mono text-lg font-bold tracking-tight text-white flex items-center gap-2">
              SecureChat
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30 font-mono">
                v1.0 Demo
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 font-mono text-xs">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyber-panel border border-cyber-border text-cyber-muted hover:text-white hover:border-cyber-border-light transition-all"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">View on GitHub</span>
          </a>

          <button
            onClick={onLogin}
            className="px-4 py-2 rounded-xl border border-cyber-border-light hover:border-cyber-cyan text-cyber-text hover:text-cyber-cyan transition-all"
          >
            Log In
          </button>

          <button
            onClick={onGetStarted}
            className="px-5 py-2 rounded-xl bg-cyber-cyan text-cyber-bg font-bold shadow-neon-cyan hover:bg-cyber-cyan/90 transition-all flex items-center gap-1.5"
          >
            <span>Launch App</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 sm:px-12 pt-16 pb-20 max-w-7xl mx-auto text-center flex flex-col items-center">
        {/* Cyberpunk Glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyber-cyan/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute top-40 left-1/3 w-[400px] h-[300px] bg-cyber-emerald/10 blur-[150px] rounded-full pointer-events-none" />

        {/* Security badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyber-card border border-cyber-cyan/30 text-cyber-cyan text-xs font-mono mb-6 shadow-neon-cyan/10"
        >
          <Lock className="w-3.5 h-3.5 text-cyber-cyan" />
          <span>True Browser-Side Zero-Knowledge Encryption</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-mono tracking-tight leading-tight max-w-5xl"
        >
          Encrypted Real-Time Chat With{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan via-cyber-emerald to-cyber-cyan">
            Proactive AI Guard
          </span>
        </motion.h1>

        {/* Hero Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-cyber-muted max-w-3xl leading-relaxed"
        >
          Built with the native <strong>Web Crypto API</strong>, <strong>ECDH P-256</strong> per-chat key derivation, and <strong>AES-256-GCM</strong> cipher. Private keys stay non-extractable in browser IndexedDB. Firebase Firestore and the relay server strictly receive and persist ciphertext blobs.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center font-mono text-sm"
        >
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-cyber-cyan text-cyber-bg font-bold shadow-neon-cyan hover:bg-cyber-cyan/90 transition-all flex items-center justify-center gap-2"
          >
            <span>Start Encrypted Chat</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-cyber-card border border-cyber-border-light hover:border-cyber-cyan/50 text-cyber-text transition-all flex items-center justify-center gap-2"
          >
            <Github className="w-4 h-4 text-cyber-cyan" />
            <span>View Architecture on GitHub</span>
          </a>
        </motion.div>

        {/* Trust Badges Bar */}
        <div className="mt-14 pt-8 border-t border-cyber-border/60 w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4 text-left font-mono">
          <div className="p-3 rounded-xl bg-cyber-card/40 border border-cyber-border/50">
            <span className="text-cyber-cyan text-xs block font-bold">ECDH P-256</span>
            <span className="text-cyber-muted text-[11px]">Diffie-Hellman Exchange</span>
          </div>
          <div className="p-3 rounded-xl bg-cyber-card/40 border border-cyber-border/50">
            <span className="text-cyber-emerald text-xs block font-bold">AES-256-GCM</span>
            <span className="text-cyber-muted text-[11px]">Authenticated Cipher</span>
          </div>
          <div className="p-3 rounded-xl bg-cyber-card/40 border border-cyber-border/50">
            <span className="text-cyber-cyan text-xs block font-bold">Non-Extractable</span>
            <span className="text-cyber-muted text-[11px]">IndexedDB CryptoKey</span>
          </div>
          <div className="p-3 rounded-xl bg-cyber-card/40 border border-cyber-border/50">
            <span className="text-cyber-amber text-xs block font-bold">AI Heuristics</span>
            <span className="text-cyber-muted text-[11px]">Sensitive Data Warning</span>
          </div>
        </div>
      </section>

      {/* Feature 7: Live Encryption Playground */}
      <section className="px-6 sm:px-12 py-16 bg-cyber-panel/60 border-y border-cyber-border relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30">
              Interactive Cryptography Sandbox
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-mono text-white mt-3">
              Live Web Crypto API Playground
            </h2>
            <p className="text-xs sm:text-sm text-cyber-muted max-w-2xl mx-auto mt-2">
              Type anything in the input below to see real-time AES-256-GCM encryption with 12-byte initialization vectors and test tampering resistance.
            </p>
          </div>

          <div className="bg-cyber-card border border-cyber-border-light rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Input */}
            <div>
              <label className="block text-xs font-mono text-cyber-cyan mb-2 font-semibold flex items-center justify-between">
                <span>1. Plaintext Input (On-Device Browser Memory)</span>
                <span className="text-[11px] text-cyber-muted font-normal">Encrypted on keystroke</span>
              </label>
              <input
                type="text"
                value={playgroundInput}
                onChange={(e) => setPlaygroundInput(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-cyber-bg border border-cyber-border-light text-cyber-text text-sm font-mono focus:outline-none focus:border-cyber-cyan"
                placeholder="Type sample text to watch encryption..."
              />
            </div>

            {/* Ciphertext Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-cyber-emerald mb-2 font-semibold">
                  2. AES-256-GCM Ciphertext (Base64)
                </label>
                <div className="p-3.5 rounded-xl bg-black/70 border border-cyber-border font-mono text-xs text-cyber-emerald break-all min-h-[80px] select-all">
                  {playgroundCiphertext || '...'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-cyber-cyan mb-2 font-semibold">
                  3. Initialization Vector (12 Bytes IV)
                </label>
                <div className="p-3.5 rounded-xl bg-black/70 border border-cyber-border font-mono text-xs text-cyber-cyan break-all min-h-[80px] select-all">
                  {playgroundIv || '...'}
                </div>
              </div>
            </div>

            {/* Decrypted / Tamper section */}
            <div className="p-4 rounded-xl bg-cyber-panel border border-cyber-border-light flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-cyber-muted block mb-1">
                  4. Decrypted Verification Output:
                </span>
                {tamperError ? (
                  <span className="text-xs font-mono text-cyber-danger font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {tamperError}
                  </span>
                ) : (
                  <span className="text-sm font-mono text-white font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-cyber-emerald shrink-0" />
                    "{playgroundDecrypted}"
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleTamperPlayground}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-cyber-danger/20 border border-cyber-danger/40 text-cyber-danger text-xs font-mono hover:bg-cyber-danger/30 transition-all"
                  title="Flip 1 byte in ciphertext to verify auth tag failure"
                >
                  Tamper 1 Byte
                </button>
                <button
                  type="button"
                  onClick={handleResetPlayground}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-cyber-card border border-cyber-border text-cyber-muted hover:text-white text-xs font-mono transition-all flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* "How It Works" (3 Steps) */}
      <section className="px-6 sm:px-12 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyber-emerald/10 text-cyber-emerald border border-cyber-emerald/30">
            Security Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-mono text-white mt-3">
            How The Encryption Works
          </h2>
          <p className="text-sm text-cyber-muted max-w-xl mx-auto mt-2">
            A 3-step mathematical handshake where keys are negotiated client-to-client.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="p-6 rounded-2xl bg-cyber-panel border border-cyber-border-light relative group hover:border-cyber-cyan/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan flex items-center justify-center font-mono font-bold text-lg mb-4">
              01
            </div>
            <h3 className="text-lg font-bold font-mono text-white mb-2">
              Non-Extractable Keypairs
            </h3>
            <p className="text-xs text-cyber-muted leading-relaxed">
              When a user signs up, the browser executes <code>crypto.subtle.generateKey</code> with <code>extractable: false</code>. The private key resides in IndexedDB and can never be read or stolen by scripts.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-2xl bg-cyber-panel border border-cyber-border-light relative group hover:border-cyber-emerald/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-cyber-emerald/10 border border-cyber-emerald/30 text-cyber-emerald flex items-center justify-center font-mono font-bold text-lg mb-4">
              02
            </div>
            <h3 className="text-lg font-bold font-mono text-white mb-2">
              ECDH Key Agreement
            </h3>
            <p className="text-xs text-cyber-muted leading-relaxed">
              Alice and Bob share only their public keys. By running Elliptic-Curve Diffie-Hellman (P-256), both independently compute the exact same 256-bit symmetric key without transmitting it.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-2xl bg-cyber-panel border border-cyber-border-light relative group hover:border-cyber-cyan/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan flex items-center justify-center font-mono font-bold text-lg mb-4">
              03
            </div>
            <h3 className="text-lg font-bold font-mono text-white mb-2">
              AES-256-GCM Transport
            </h3>
            <p className="text-xs text-cyber-muted leading-relaxed">
              Each outgoing message is encrypted with a fresh random 96-bit IV. The server and Firestore only store the ciphertext and IV. Any in-transit alteration breaks authentication tags.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="px-6 sm:px-12 py-16 bg-cyber-panel/40 border-t border-cyber-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold font-mono text-white">
              Built For Zero-Trust Environments
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-cyber-card border border-cyber-border-light">
              <Shield className="w-6 h-6 text-cyber-cyan mb-3" />
              <h4 className="text-base font-bold font-mono text-white mb-1">
                AI Sensitive-Content Guard
              </h4>
              <p className="text-xs text-cyber-muted leading-relaxed">
                Flags credit cards (Luhn-checked), passwords, OTPs, and phone numbers before dispatch with an interactive warning modal.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-cyber-card border border-cyber-border-light">
              <Eye className="w-6 h-6 text-cyber-emerald mb-3" />
              <h4 className="text-base font-bold font-mono text-white mb-1">
                Raw Ciphertext Demo Toggle
              </h4>
              <p className="text-xs text-cyber-muted leading-relaxed">
                Recruiters can flip a switch in settings to view raw Base64 ciphertexts & IVs inside chat bubbles, verifying encryption on camera.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-cyber-card border border-cyber-border-light">
              <Flame className="w-6 h-6 text-cyber-amber mb-3" />
              <h4 className="text-base font-bold font-mono text-white mb-1">
                Disappearing Messages
              </h4>
              <p className="text-xs text-cyber-muted leading-relaxed">
                Customizable per-chat burn timer. Automatically dissolves bubbles on client displays and purges ciphertext from database records.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-cyber-card border border-cyber-border-light">
              <Cpu className="w-6 h-6 text-cyber-cyan mb-3" />
              <h4 className="text-base font-bold font-mono text-white mb-1">
                Hardware-Level IndexedDB
              </h4>
              <p className="text-xs text-cyber-muted leading-relaxed">
                Private keys are flagged non-extractable in browser memory, preventing extraction even in developer console sessions.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-cyber-card border border-cyber-border-light">
              <Terminal className="w-6 h-6 text-cyber-emerald mb-3" />
              <h4 className="text-base font-bold font-mono text-white mb-1">
                Socket.IO Real-Time Engine
              </h4>
              <p className="text-xs text-cyber-muted leading-relaxed">
                Typing indicators, delivery receipts, read confirmations, and instant presence without polling latency.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-cyber-card border border-cyber-border-light">
              <Database className="w-6 h-6 text-cyber-cyan mb-3" />
              <h4 className="text-base font-bold font-mono text-white mb-1">
                Zero-Knowledge Relay
              </h4>
              <p className="text-xs text-cyber-muted leading-relaxed">
                Plaintext never touches Node.js or Firebase Firestore. Total cryptographic privacy even under server seizure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 sm:px-12 border-t border-cyber-border max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-cyber-muted">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyber-cyan" />
          <span>SecureChat Demo © 2026. Designed for Portfolio & Recruiter Evaluation.</span>
        </div>

        <div className="flex items-center gap-6">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyber-cyan transition-colors"
          >
            GitHub Repository
          </a>
          <button onClick={onLogin} className="hover:text-cyber-cyan transition-colors">
            App Login
          </button>
        </div>
      </footer>
    </div>
  );
};
