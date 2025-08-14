import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { toast } from 'react-hot-toast';
import { Smartphone, RefreshCw, X, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { egovMobileService, EGovMobileAuthRequest, EGovMobileAuthResult } from '../../services/egov-mobile.service';

interface EGovMobileAuthProps {
  onAuthSuccess: (userData: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const EGovMobileAuth: React.FC<EGovMobileAuthProps> = ({
  onAuthSuccess,
  onCancel,
  isLoading = false
}) => {
  const [authRequest, setAuthRequest] = useState<EGovMobileAuthRequest | null>(null);
  const [status, setStatus] = useState<'initializing' | 'waiting' | 'success' | 'error' | 'expired'>('initializing');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [error, setError] = useState<string>('');

  // Инициализация аутентификации
  const initializeAuth = async () => {
    try {
      setStatus('initializing');
      setError('');
      
      console.log('🚀 Инициализируем eGov Mobile аутентификацию...');
      const request = await egovMobileService.initializeAuth();
      
      setAuthRequest(request);
      setStatus('waiting');
      setTimeLeft(Math.max(0, request.expiresAt - Date.now()));
      
      // Начинаем polling
      egovMobileService.startPolling(request.sessionId, handleAuthResult);
      
      toast.success('QR-код сгенерирован! Отсканируйте его в приложении eGov Mobile');
      
    } catch (error: any) {
      console.error('❌ Ошибка инициализации:', error);
      setError(error.message);
      setStatus('error');
      toast.error(`Ошибка генерации QR-кода: ${error.message}`);
    }
  };

  // Обработка результата аутентификации
  const handleAuthResult = (result: EGovMobileAuthResult) => {
    console.log('📱 Результат eGov Mobile аутентификации:', result);
    
    if (result.success && result.userData) {
      setStatus('success');
      toast.success(`Добро пожаловать, ${result.userData.fullName}!`);
      onAuthSuccess(result.userData);
    } else if (result.error) {
      setStatus('error');
      setError(result.error);
      toast.error(`Ошибка аутентификации: ${result.error}`);
    }
  };

  // Отмена аутентификации
  const handleCancel = async () => {
    try {
      if (authRequest) {
        await egovMobileService.cancelAuth(authRequest.sessionId);
      }
      egovMobileService.clearSession();
      onCancel();
    } catch (error: any) {
      console.error('❌ Ошибка отмены:', error);
      onCancel(); // Все равно закрываем
    }
  };

  // Таймер обратного отсчета
  useEffect(() => {
    if (status === 'waiting' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1000;
          if (newTime <= 0) {
            setStatus('expired');
            egovMobileService.stopPolling();
            toast.error('Время ожидания истекло. Создайте новый QR-код.');
            return 0;
          }
          return newTime;
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [status, timeLeft]);

  // Инициализация при монтировании
  useEffect(() => {
    initializeAuth();
    
    // Cleanup при размонтировании
    return () => {
      egovMobileService.clearSession();
    };
  }, []);

  const formatTimeLeft = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'initializing':
        return <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />;
      case 'waiting':
        return <Clock className="w-6 h-6 text-orange-500" />;
      case 'success':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case 'error':
      case 'expired':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Smartphone className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'initializing':
        return 'Генерация QR-кода...';
      case 'waiting':
        return 'Ожидание сканирования QR-кода';
      case 'success':
        return 'Аутентификация успешна!';
      case 'error':
        return 'Ошибка аутентификации';
      case 'expired':
        return 'Время ожидания истекло';
      default:
        return 'Подготовка...';
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      {/* Заголовок */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-3">
          <Smartphone className="w-8 h-8 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold">eGov Mobile</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Вход через мобильное приложение
        </p>
      </div>

      {/* Статус */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-2">
          {getStatusIcon()}
        </div>
        <p className="text-sm font-medium">{getStatusText()}</p>
        {status === 'waiting' && timeLeft > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Осталось времени: {formatTimeLeft(timeLeft)}
          </p>
        )}
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>

      {/* QR-код */}
      {authRequest && (status === 'waiting' || status === 'initializing') && (
        <div className="mb-6">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200 text-center">
            {/* Здесь будет QR-код */}
            <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-3">
              <div className="text-center">
                <div className="w-32 h-32 bg-black mx-auto mb-2 rounded" style={{
                  backgroundImage: `url(https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(authRequest.qrData)})`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center'
                }}></div>
                <p className="text-xs text-gray-500">QR-код для сканирования</p>
              </div>
            </div>
          </div>
          
          {/* Инструкции */}
          <div className="text-xs text-gray-500 space-y-1 mt-4">
            <p className="font-medium">📱 Инструкция:</p>
            <p>1. Откройте приложение eGov Mobile</p>
            <p>2. Найдите функцию "Войти по QR-коду"</p>
            <p>3. Отсканируйте QR-код камерой телефона</p>
            <p>4. Подтвердите вход в приложении</p>
          </div>
        </div>
      )}

      {/* Кнопки действий */}
      <div className="flex gap-3">
        {(status === 'error' || status === 'expired') && (
          <Button
            onClick={initializeAuth}
            variant="primary"
            className="flex-1"
            disabled={isLoading}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Создать новый QR-код
          </Button>
        )}
        
        <Button
          onClick={handleCancel}
          variant="secondary"
          className="flex-1"
          disabled={isLoading}
          icon={<X className="w-4 h-4" />}
        >
          Отмена
        </Button>
      </div>

      {/* Альтернативный способ */}
      {authRequest && status === 'waiting' && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 mb-2">Нет камеры? Используйте прямую ссылку:</p>
          <a
            href={authRequest.deepLink}
            className="text-blue-600 hover:text-blue-800 text-xs underline"
            onClick={() => toast.info('Переходим в приложение eGov Mobile...')}
          >
            Открыть в eGov Mobile
          </a>
        </div>
      )}
    </div>
  );
};
