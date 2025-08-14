import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { apiService } from '../services/api.service';
import { ECPSelector } from '../components/auth/ECPSelector';
import { EGovMobileAuth } from '../components/auth/EGovMobileAuth';
import { Certificate } from '../services/ncalayer.service';
import { Shield, Smartphone, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';

type AuthMethod = 'ecp' | 'mobile';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth, setLoading, setError, isLoading, error } = useAuthStore();
  const [authMethod, setAuthMethod] = useState<AuthMethod>('ecp');

  const handleCertificateSelect = async (certificate: Certificate, signature: string) => {
    setLoading(true);
    setError(null);

    try {
      // Отправляем данные ЭЦП на сервер для аутентификации
      const response = await apiService.loginWithECP({
        certificate: {
          id: certificate.id,
          subjectName: certificate.subjectName,
          issuerName: certificate.issuerName,
          serialNumber: certificate.serialNumber,
          validFrom: certificate.validFrom,
          validTo: certificate.validTo,
          iin: certificate.iin,
          fullName: certificate.fullName,
          organization: certificate.organization,
          position: certificate.position,
          email: certificate.email
        },
        signature,
        timestamp: Date.now()
      });

      const { user, token, refreshToken } = response.data;
      setAuth(user, token, refreshToken);
      
      toast.success(`Добро пожаловать, ${certificate.fullName}!`);
      navigate('/');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Ошибка аутентификации по ЭЦП';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleMobileAuthSuccess = async (userData: any) => {
    setLoading(true);
    setError(null);

    try {
      // Отправляем данные мобильной аутентификации на сервер
      const response = await apiService.loginWithEGovMobile(userData);
      
      const { user, token, refreshToken } = response.data;
      setAuth(user, token, refreshToken);
      
      toast.success(`Добро пожаловать, ${userData.fullName}!`);
      navigate('/');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Ошибка аутентификации через eGov Mobile';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthMethodCancel = () => {
    setError(null);
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Платформа госслужащих
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Выберите способ входа в систему
          </p>
        </div>

        {/* Переключатель методов аутентификации */}
        <div className="mb-6">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setAuthMethod('ecp')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                authMethod === 'ecp'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Monitor className="w-4 h-4" />
              ЭЦП на ПК
            </button>
            <button
              onClick={() => setAuthMethod('mobile')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                authMethod === 'mobile'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              eGov Mobile
            </button>
          </div>
        </div>

        {/* Форма аутентификации */}
        {authMethod === 'ecp' ? (
          <ECPSelector 
            onCertificateSelect={handleCertificateSelect}
            isLoading={isLoading}
          />
        ) : (
          <EGovMobileAuth
            onAuthSuccess={handleMobileAuthSuccess}
            onCancel={handleAuthMethodCancel}
            isLoading={isLoading}
          />
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© 2024 Платформа госслужащих</p>
          <p className="mt-1">
            <a href="#" className="hover:text-primary transition-colors">
              Техническая поддержка
            </a>
            {' • '}
            <a href="#" className="hover:text-primary transition-colors">
              Документация
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
