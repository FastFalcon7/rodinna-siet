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
  const { login, register } = useAuth();
  const { darkMode } = useTheme();

  useEffect(() => {
    // Skontroluj či existujú používatelia
    const checkUsers = async () => {
      try {
        const users = await getAllUsers();
        setIsFirstUser(users.length === 0);
        if (users.length === 0) {
          setIsLogin(false); // Ak neexistujú používatelia, zobraz registračný formulár
        }
      } catch (error) {
        console.log('Chyba pri kontrole používateľov:', error);
        // Ak sa nedá pripojiť k Firestore, predpokladáme že je to prvý používateľ
        setIsFirstUser(true);
        setIsLogin(false);
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
      } else {
        await register(email, password, name, isFirstUser);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md slide-in">
        <div className="text-center mb-8">
          <i className="fas fa-home text-5xl text-indigo-600 mb-4"></i>
          <h1 className="text-3xl font-bold text-gray-800">Naša Rodina</h1>
          <p className="text-gray-600 mt-2">Súkromná rodinná sociálna sieť</p>
          {isFirstUser && (
            <div className="mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded text-sm">
              <i className="fas fa-crown mr-2"></i>
              Vytvárate prvý účet - budete administrátor
            </div>
          )}
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

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200"
          >
            {isLogin ? 'Prihlásiť sa' : 'Registrovať sa'}
          </button>
        </form>

        {!loading && !isFirstUser && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-600 hover:text-indigo-800 text-sm"
            >
              {isLogin ? 'Nemáte účet? Registrujte sa' : 'Už máte účet? Prihláste sa'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginScreen;