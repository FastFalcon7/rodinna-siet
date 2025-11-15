import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { OnlineStatusProvider } from './contexts/OnlineStatusContext';

// Components
import LoginScreen from './components/Auth/LoginScreen';
import Layout from './components/Shared/Layout';
import Feed from './components/Feed/Feed';
import Chat from './components/Chat/Chat';
import Calendar from './components/Calendar/Calendar';
import Albums from './components/Albums/Albums';
import FamilyMembers from './components/FamilyMembers/FamilyMembers';
import Settings from './components/Settings/Settings';
import LoadingScreen from './components/Shared/LoadingScreen';
import CommandPalette from './components/Shared/CommandPalette';

function AppContent() {
  const { user, loading } = useAuth();
  const { darkMode } = useTheme();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Keyboard listener pre Cmd/Ctrl + K
  const handleKeyDown = useCallback((e) => {
    // Cmd (Mac) alebo Ctrl (Windows/Linux) + K
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsCommandPaletteOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    if (user) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [user, handleKeyDown]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/albums" element={<Albums />} />
          <Route path="/family" element={<FamilyMembers />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>

      {/* Command Palette - Global */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <OnlineStatusProvider>
          <AppContent />
        </OnlineStatusProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;