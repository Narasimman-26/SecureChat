import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { ChatPage } from './pages/ChatPage';
import { Shield, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'landing' | 'login' | 'signup' | 'chat'>('landing');

  // Loading screen during initial JWT verification
  if (isLoading) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-cyber-bg text-cyber-text font-mono">
        <div className="relative mb-4">
          <div className="p-4 rounded-2xl bg-cyber-panel border border-cyber-cyan/40 shadow-neon-cyan/30">
            <Shield className="w-10 h-10 text-cyber-cyan animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-cyber-muted">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyber-cyan" />
          <span>Initializing SecureChat Vault...</span>
        </div>
      </div>
    );
  }

  // If user is authenticated and hasn't explicitly navigated back to landing, show Chat
  if (user && currentPage !== 'landing') {
    return <ChatPage />;
  }

  // Navigation pages
  if (currentPage === 'login') {
    return (
      <AuthPage
        initialMode="login"
        onSuccess={() => setCurrentPage('chat')}
        onNavigateLanding={() => setCurrentPage('landing')}
      />
    );
  }

  if (currentPage === 'signup') {
    return (
      <AuthPage
        initialMode="signup"
        onSuccess={() => setCurrentPage('chat')}
        onNavigateLanding={() => setCurrentPage('landing')}
      />
    );
  }

  return (
    <LandingPage
      onGetStarted={() => setCurrentPage(user ? 'chat' : 'signup')}
      onLogin={() => setCurrentPage(user ? 'chat' : 'login')}
    />
  );
};
