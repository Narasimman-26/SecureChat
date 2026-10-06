import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  showRawCiphertext: boolean;
  setShowRawCiphertext: (val: boolean) => void;
  toggleShowRawCiphertext: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showRawCiphertext, setShowRawCiphertextState] = useState<boolean>(() => {
    const saved = localStorage.getItem('securechat_show_raw_cipher');
    return saved === 'true';
  });

  const setShowRawCiphertext = (val: boolean) => {
    setShowRawCiphertextState(val);
    localStorage.setItem('securechat_show_raw_cipher', val ? 'true' : 'false');
  };

  const toggleShowRawCiphertext = () => {
    setShowRawCiphertext(!showRawCiphertext);
  };

  return (
    <SettingsContext.Provider
      value={{
        showRawCiphertext,
        setShowRawCiphertext,
        toggleShowRawCiphertext,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
