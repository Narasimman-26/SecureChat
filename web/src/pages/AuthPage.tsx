import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Key, Mail, User, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthPageProps {
  onSuccess: () => void;
  onNavigateLanding: () => void;
  initialMode?: 'login' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onSuccess,
  onNavigateLanding,
  initialMode = 'login',
}) => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cryptoProgressStep, setCryptoProgressStep] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        setCryptoProgressStep('Generating non-extractable ECDH P-256 keypair...');
        await new Promise((r) => setTimeout(r, 400));
        setCryptoProgressStep('Storing private key into IndexedDB Hardware Vault...');
        await new Promise((r) => setTimeout(r, 400));
        setCryptoProgressStep('Exporting public key & establishing account...');
        await signup(email, username, password);
      } else {
        await login(email, password);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
      setCryptoProgressStep(null);
    }
  };

  // Quick Demo Account Auto-Fill for Recruiters
  const fillDemoAccount = (demoUser: 'alice' | 'bob') => {
    if (demoUser === 'alice') {
      setEmail('alice@securechat.io');
      setUsername('alice');
      setPassword('secureAlice123!');
    } else {
      setEmail('bob@securechat.io');
      setUsername('bob');
      setPassword('secureBob123!');
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 bg-cyber-bg relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyber-cyan/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-cyber-emerald/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top brand button */}
      <button
        onClick={onNavigateLanding}
        className="mb-8 flex items-center gap-2 group text-cyber-muted hover:text-cyber-cyan transition-colors"
      >
        <div className="p-2 rounded-xl bg-cyber-panel border border-cyber-cyan/30 text-cyber-cyan group-hover:shadow-neon-cyan/40 transition-all">
          <Shield className="w-5 h-5" />
        </div>
        <span className="font-mono text-base font-bold text-cyber-text">
          SecureChat
        </span>
        <span className="text-xs font-mono text-cyber-cyan">← Back to Home</span>
      </button>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-cyber-panel/90 backdrop-blur-xl border border-cyber-border-light rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10"
      >
        {/* Neon top border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyber-cyan via-cyber-emerald to-cyber-cyan rounded-t-2xl" />

        {/* Tab Switcher */}
        <div className="flex p-1 bg-cyber-card rounded-xl border border-cyber-border mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-mono font-semibold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-cyber-cyan text-cyber-bg shadow-neon-cyan/20'
                : 'text-cyber-muted hover:text-cyber-text'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-mono font-semibold rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-cyber-cyan text-cyber-bg shadow-neon-cyan/20'
                : 'text-cyber-muted hover:text-cyber-text'
            }`}
          >
            Create Vault
          </button>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-cyber-text font-mono flex items-center gap-2">
            {mode === 'login' ? 'Access Secure Vault' : 'Initialize Device Keys'}
          </h2>
          <p className="text-xs text-cyber-muted mt-1">
            {mode === 'login'
              ? 'Enter your credentials to restore active zero-knowledge channels.'
              : 'Generates non-extractable ECDH P-256 keys locally in browser IndexedDB.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-cyber-danger/10 border border-cyber-danger/30 text-cyber-danger text-xs font-mono">
            {error}
          </div>
        )}

        {/* Progress indicator during keypair creation */}
        {cryptoProgressStep && (
          <div className="mb-4 p-3 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-xs font-mono flex items-center gap-2 animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin text-cyber-cyan" />
            <span>{cryptoProgressStep}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-mono text-cyber-muted mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-cyber-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. cipher_operative"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cyber-card border border-cyber-border-light text-cyber-text placeholder:text-cyber-muted text-sm focus:outline-none focus:border-cyber-cyan font-mono"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-cyber-muted mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-cyber-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="agent@securechat.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cyber-card border border-cyber-border-light text-cyber-text placeholder:text-cyber-muted text-sm focus:outline-none focus:border-cyber-cyan font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-cyber-muted mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-cyber-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cyber-card border border-cyber-border-light text-cyber-text placeholder:text-cyber-muted text-sm focus:outline-none focus:border-cyber-cyan font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 rounded-xl bg-cyber-cyan hover:bg-cyber-cyan/90 text-cyber-bg font-bold font-mono text-sm shadow-neon-cyan transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{mode === 'login' ? 'Unlock Session' : 'Generate Keys & Register'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast-Fill Section for Recruiters */}
        <div className="mt-6 pt-5 border-t border-cyber-border">
          <p className="text-[11px] font-mono text-cyber-muted mb-2 text-center">
            🚀 Recruiter Quick Test Accounts (Click to Fill):
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('alice')}
              className="py-1.5 px-2 rounded-lg bg-cyber-card hover:bg-cyber-border-light border border-cyber-border text-cyber-cyan text-xs font-mono text-center transition-colors"
            >
              Fill Alice
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('bob')}
              className="py-1.5 px-2 rounded-lg bg-cyber-card hover:bg-cyber-border-light border border-cyber-border text-cyber-emerald text-xs font-mono text-center transition-colors"
            >
              Fill Bob
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
