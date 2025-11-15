import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLocation, Link } from 'react-router-dom';

const APP_VERSION = 'v0005';

function Layout({ children }) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const location = useLocation();

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar for desktop */}
        <Sidebar className="hidden md:flex" />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <Header setShowMobileMenu={setShowMobileMenu} />

          {/* Content Area */}
          <main className={`flex-1 overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {children}
          </main>

          {/* Mobile Bottom Navigation */}
          <MobileNav />
        </div>

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <MobileMenu setShowMobileMenu={setShowMobileMenu} />
        )}
      </div>
    </div>
  );
}

// Sidebar Component
function Sidebar({ className = "" }) {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const location = useLocation();

  const menuItems = [
    { id: '/', icon: 'fas fa-home', label: 'Nástenka' },
    { id: '/chat', icon: 'fas fa-comments', label: 'Chat' },
    { id: '/calendar', icon: 'fas fa-calendar', label: 'Kalendár' },
    { id: '/albums', icon: 'fas fa-images', label: 'Albumy' },
    { id: '/family', icon: 'fas fa-users', label: 'Rodina' },
    { id: '/settings', icon: 'fas fa-cog', label: 'Nastavenia' },
  ];

  return (
    <div className={`${className} w-64 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm flex-col`}>
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center`}>
            <i className="fas fa-home text-indigo-600 mr-2"></i>
            Naša Rodina
          </h1>
          <p className={`text-xs mt-1 ml-7 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {APP_VERSION}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map(item => (
            <Link
              key={item.id}
              to={item.id}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.id
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                  : `${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`
              }`}
            >
              <i className={`${item.icon} w-5 h-5 mr-3`}></i>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* User Profile */}
      <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center">
          <img
            src={user?.avatar}
            alt={user?.name}
            className="w-10 h-10 rounded-full mr-3"
          />
          <div className="flex-1">
            <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {user?.name}
            </p>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {user?.role === 'admin' ? 'Administrátor' : 'Člen'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Header Component
function Header({ setShowMobileMenu }) {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  return (
    <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b`}>
      <div className="flex items-center justify-between px-4 py-3">
        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => setShowMobileMenu(true)}
        >
          <i className={`fas fa-bars ${darkMode ? 'text-white' : 'text-gray-600'}`}></i>
        </button>

        {/* Mobile Logo */}
        <div className="md:hidden">
          <h1 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center`}>
            <i className="fas fa-home text-indigo-600 mr-2"></i>
            Naša Rodina
          </h1>
        </div>

        {/* Desktop content */}
        <div className="hidden md:flex items-center space-x-4 ml-auto">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-8 h-8 rounded-full"
            />
            <button
              onClick={logout}
              className={`px-3 py-1 text-sm rounded-lg ${darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              Odhlásiť
            </button>
          </div>
        </div>

        {/* Mobile logout button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={logout}
        >
          <i className={`fas fa-sign-out-alt ${darkMode ? 'text-white' : 'text-gray-600'}`}></i>
        </button>
      </div>
    </header>
  );
}

// Mobile Navigation Component
function MobileNav() {
  const { darkMode } = useTheme();
  const location = useLocation();

  const menuItems = [
    { id: '/', icon: 'fas fa-home', label: 'Domov' },
    { id: '/chat', icon: 'fas fa-comments', label: 'Chat' },
    { id: '/calendar', icon: 'fas fa-calendar', label: 'Kalendár' },
    { id: '/family', icon: 'fas fa-users', label: 'Rodina' },
  ];

  return (
    <div className={`md:hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t`}>
      <div className="flex justify-around py-2">
        {menuItems.map(item => (
          <Link
            key={item.id}
            to={item.id}
            className={`flex flex-col items-center py-2 px-3 rounded-lg text-xs ${
              location.pathname === item.id
                ? 'text-indigo-600 dark:text-indigo-400'
                : `${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`
            }`}
          >
            <i className={`${item.icon} text-lg mb-1`}></i>
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

// Mobile Menu Component
function MobileMenu({ setShowMobileMenu }) {
  const { user } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const location = useLocation();

  const menuItems = [
    { id: '/', icon: 'fas fa-home', label: 'Nástenka' },
    { id: '/chat', icon: 'fas fa-comments', label: 'Chat' },
    { id: '/calendar', icon: 'fas fa-calendar', label: 'Kalendár' },
    { id: '/albums', icon: 'fas fa-images', label: 'Albumy' },
    { id: '/family', icon: 'fas fa-users', label: 'Rodina' },
    { id: '/settings', icon: 'fas fa-cog', label: 'Nastavenia' },
  ];

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowMobileMenu(false)}></div>
      <div className={`fixed left-0 top-0 bottom-0 w-64 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} flex items-center`}>
              <i className="fas fa-home text-indigo-600 mr-2"></i>
              Naša Rodina
            </h1>
            <p className={`text-xs mt-1 ml-7 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {APP_VERSION}
            </p>
          </div>
          <button
            onClick={() => setShowMobileMenu(false)}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {menuItems.map(item => (
              <Link
                key={item.id}
                to={item.id}
                onClick={() => setShowMobileMenu(false)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.id
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                    : `${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`
                }`}
              >
                <i className={`${item.icon} w-5 h-5 mr-3`}></i>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Theme Toggle */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={toggleTheme}
              className={`flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium ${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
            >
              <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'} w-5 h-5 mr-3`}></i>
              {darkMode ? 'Svetlý režim' : 'Tmavý režim'}
            </button>
          </div>
        </nav>

        {/* User Profile */}
        <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center">
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-10 h-10 rounded-full mr-3"
            />
            <div className="flex-1">
              <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {user?.name}
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {user?.role === 'admin' ? 'Administrátor' : 'Člen'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Layout;