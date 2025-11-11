import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * OfflineIndicator - Zobrazuje sa keď používateľ nemá pripojenie
 */
function OfflineIndicator() {
  const { darkMode } = useTheme();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Zobraziť banner na 3 sekundy keď sa obnoví pripojenie
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 py-2 px-4 text-center text-sm font-medium animate-slide-in ${
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-red-500 text-white'
      }`}
    >
      {isOnline ? (
        <>
          <i className="fas fa-wifi mr-2"></i>
          Pripojenie obnovené
        </>
      ) : (
        <>
          <i className="fas fa-wifi-slash mr-2"></i>
          Ste offline - niektoré funkcie nemusia fungovať
        </>
      )}
    </div>
  );
}

export default OfflineIndicator;
