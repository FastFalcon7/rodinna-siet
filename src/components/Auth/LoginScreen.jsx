import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getAllUsers } from '../../services/userService';

function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isFirstUser, setIsFirstUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const { login, register, resetPassword } = useAuth();
  const { darkMode } = useTheme();

  useEffect(() => {
    // Načítaj uložený email z localStorage
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    // Skontroluj či existujú používatelia
    const checkUsers = async () => {
      try {
        const users = await getAllUsers();
        setIsFirstUser(users.length === 0);
        // Vždy zobraz prihlasovací formulár ako prvý
        setIsLogin(true);
      } catch (error) {
        console.log('Chyba pri kontrole používateľov:', error);
        setIsFirstUser(true);
        setIsLogin(true); // Aj pri chybe zobraz prihlasovací formulár
      } finally {
        setLoading(false);
      }
    };

    checkUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await login(email, password);
        // Ulož email do localStorage ak je zaškrtnuté "Zapamätať email"
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
      } else {
        await register(email, password, name, isFirstUser);
        // Pri registrácii tiež ulož email
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setResetMessage('');

    if (!resetEmail) {
      setError('Zadajte emailovú adresu');
      return;
    }

    try {
      await resetPassword(resetEmail);
      setResetMessage('Email na obnovenie hesla bol odoslaný. Skontrolujte si svoju schránku.');
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetEmail('');
        setResetMessage('');
      }, 3000);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('Používateľ s týmto emailom neexistuje');
      } else if (err.code === 'auth/invalid-email') {
        setError('Neplatný formát emailu');
      } else {
        setError('Chyba pri odosielaní emailu: ' + err.message);
      }
    }
  };

  // Modal pre obnovenie hesla
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md slide-in">
          <div className="text-center mb-6">
            <i className="fas fa-key text-5xl text-indigo-600 mb-4"></i>
            <h1 className="text-2xl font-bold text-gray-800">Zabudnuté heslo</h1>
            <p className="text-gray-600 mt-2">Zadajte email a pošleme vám odkaz na obnovenie hesla</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {resetMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {resetMessage}
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="vas@email.com"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200"
            >
              Odoslať email
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setError('');
                setResetMessage('');
                setResetEmail('');
              }}
              className="text-indigo-600 hover:text-indigo-800 text-sm"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Späť na prihlásenie
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md slide-in">
        <div className="text-center mb-8">
          <i className="fas fa-home text-5xl text-indigo-600 mb-4"></i>
          <h1 className="text-3xl font-bold text-gray-800">Naša Rodina</h1>
          <p className="text-gray-600 mt-2">Súkromná rodinná sociálna sieť</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meno
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Vaše meno"
                required={!isLogin}
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="vas@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Heslo
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          {/* Zapamätať email checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
              Zapamätať si email
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200"
          >
            {isLogin ? 'Prihlásiť sa' : 'Registrovať sa'}
          </button>
        </form>

        {!loading && (
          <div className="mt-6 text-center space-y-3">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-600 hover:text-indigo-800 text-sm block w-full"
            >
              {isLogin ? 'Nemáte účet? Registrujte sa' : 'Už máte účet? Prihláste sa'}
            </button>

            {isLogin && (
              <button
                onClick={() => setShowForgotPassword(true)}
                className="text-gray-600 hover:text-gray-800 text-sm block w-full"
              >
                <i className="fas fa-key mr-2"></i>
                Zabudli ste heslo?
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginScreen;