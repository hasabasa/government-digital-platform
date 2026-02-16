import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { apiService } from '../services/api.service';
import { Lock, Mail, Eye, EyeOff, ArrowRight, UserPlus, LogIn, User } from 'lucide-react';
import toast from 'react-hot-toast';

type AuthTab = 'login' | 'register';

const DEMO_ACCOUNTS = [
  {
    email: 'khasenkhan@cube.kz',
    password: 'Khasen2025!',
    user: {
      id: 'user-1',
      email: 'khasenkhan@cube.kz',
      firstName: 'Хасенхан',
      lastName: 'Казимов',
      role: 'admin' as const,
      position: 'Управляющий партнёр',
      organization: 'Cube Demper',
    },
  },
  {
    email: 'adil@cube.kz',
    password: 'Adil2025!',
    user: {
      id: 'user-2',
      email: 'adil@cube.kz',
      firstName: 'Адиль',
      lastName: 'Хамитов',
      role: 'manager' as const,
      position: 'Партнёр',
      organization: 'Cube Demper',
    },
  },
  {
    email: 'azamat@cube.kz',
    password: 'Azamat2025!',
    user: {
      id: 'user-3',
      email: 'azamat@cube.kz',
      firstName: 'Азамат',
      lastName: 'Бекхалиев',
      role: 'manager' as const,
      position: 'Партнёр',
      organization: 'Cube Demper',
    },
  },
  {
    email: 'alpamys@cube.kz',
    password: 'Alpamys2025!',
    user: {
      id: 'user-4',
      email: 'alpamys@cube.kz',
      firstName: 'Алпамыс',
      lastName: 'Мақажан',
      role: 'employee' as const,
      position: 'Разработчик',
      organization: 'Cube Demper',
    },
  },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth, setLoading, isLoading } = useAuthStore();

  const [tab, setTab] = useState<AuthTab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Заполните email и пароль');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.loginByEmail({ email, password });
      const { accessToken, refreshToken, user } = response.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Добро пожаловать, ${user.firstName}!`);
      navigate('/');
    } catch {
      // Если бэкенд недоступен — проверяем демо-аккаунты
      const demo = DEMO_ACCOUNTS.find(
        (a) => a.email === email && a.password === password
      );
      if (demo) {
        setAuth(demo.user, 'demo-token', 'demo-refresh');
        toast.success(`Добро пожаловать, ${demo.user.firstName}!`);
        navigate('/');
      } else {
        toast.error('Неверный email или пароль');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName) {
      toast.error('Заполните все поля');
      return;
    }
    if (password.length < 6) {
      toast.error('Пароль минимум 6 символов');
      return;
    }

    setLoading(true);
    try {
      await apiService.registerByEmail({ email, password, firstName, lastName });
      toast.success('Регистрация успешна! Входим...');

      const response = await apiService.loginByEmail({ email, password });
      const { accessToken, refreshToken, user } = response.data;
      setAuth(user, accessToken, refreshToken);
      navigate('/');
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Ошибка регистрации';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e1621] flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-6">
          <img
            src={new URL('../assets/logo-white.svg', import.meta.url).href}
            alt="Cube Demper"
            className="h-14 mx-auto mb-3"
          />
          <p className="text-xs text-[#6c7883]">Платформа управления бизнесом</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#17212b] rounded-xl p-1 mb-5 border border-[#232e3c]">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'login'
              ? 'bg-[#3a73b8] text-white shadow-md'
              : 'text-[#6c7883] hover:text-white'
              }`}
          >
            <LogIn className="w-4 h-4" />
            Вход
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'register'
              ? 'bg-[#3a73b8] text-white shadow-md'
              : 'text-[#6c7883] hover:text-white'
              }`}
          >
            <UserPlus className="w-4 h-4" />
            Регистрация
          </button>
        </div>

        {/* Form */}
        <form onSubmit={tab === 'login' ? handleLogin : handleRegister} className="space-y-3">
          {tab === 'register' && (
            <>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c7883]" />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Имя"
                  className="w-full bg-[#17212b] border border-[#232e3c] rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-[#6c7883] focus:outline-none focus:border-[#3a73b8] transition-colors"
                />
              </div>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c7883]" />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Фамилия"
                  className="w-full bg-[#17212b] border border-[#232e3c] rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-[#6c7883] focus:outline-none focus:border-[#3a73b8] transition-colors"
                />
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c7883]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full bg-[#17212b] border border-[#232e3c] rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-[#6c7883] focus:outline-none focus:border-[#3a73b8] transition-colors"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c7883]" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              className="w-full bg-[#17212b] border border-[#232e3c] rounded-xl pl-10 pr-10 py-3 text-white placeholder:text-[#6c7883] focus:outline-none focus:border-[#3a73b8] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6c7883] hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-[#3a73b8] hover:bg-[#4a83c8] text-white font-medium py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {tab === 'login' ? 'Войти' : 'Создать аккаунт'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-[#4a5568]">
          <p>© 2025 Cube Business OS</p>
        </div>
      </div>
    </div>
  );
};
