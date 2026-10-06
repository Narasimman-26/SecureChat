import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@shared/types';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import {
  generateIdentityKeyPair,
  getIdentityPrivateKey,
  getIdentityPublicKey,
  storeKeyInVault,
} from '../crypto';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPrivateKeyInVault: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('securechat_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasPrivateKeyInVault, setHasPrivateKeyInVault] = useState<boolean>(false);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('securechat_token');
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const { user } = await api.getMe();
        setUser(user);
        setToken(savedToken);
        socketService.connect(savedToken);

        // Check if device has the private key in hardware/IndexedDB vault
        const privKey = await getIdentityPrivateKey();
        setHasPrivateKeyInVault(!!privKey);
      } catch (err) {
        console.warn('Session expired or invalid, logging out', err);
        localStorage.removeItem('securechat_token');
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const signup = async (email: string, username: string, password: string) => {
    setIsLoading(true);
    try {
      // 1. Generate hardware-isolated ECDH P-256 keypair in the browser
      const { publicKeyJwk } = await generateIdentityKeyPair();

      // 2. Register account with public key
      const res = await api.signup({
        email,
        username,
        password,
        publicKey: publicKeyJwk,
      });

      localStorage.setItem('securechat_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setHasPrivateKeyInVault(true);

      // 3. Connect real-time socket gateway
      socketService.connect(res.token);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      localStorage.setItem('securechat_token', res.token);
      setToken(res.token);
      setUser(res.user);

      // Check if this browser already holds the non-extractable private key
      let privKey = await getIdentityPrivateKey();
      if (!privKey) {
        // If logging in on a new device/browser without keys, generate a fresh keypair
        const { publicKeyJwk } = await generateIdentityKeyPair();
        setHasPrivateKeyInVault(true);
      } else {
        setHasPrivateKeyInVault(true);
      }

      socketService.connect(res.token);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    socketService.disconnect();
    localStorage.removeItem('securechat_token');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        signup,
        logout,
        hasPrivateKeyInVault,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
