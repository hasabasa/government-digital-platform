import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Certificate, ncaLayerService } from '../../services/ncalayer.service';
import { Shield, Download, RefreshCw, User, Building, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

interface ECPSelectorProps {
  onCertificateSelect: (certificate: Certificate, signature: string) => void;
  isLoading?: boolean;
}

export const ECPSelector: React.FC<ECPSelectorProps> = ({
  onCertificateSelect,
  isLoading = false
}) => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [ncaLayerInstalled, setNcaLayerInstalled] = useState<boolean | null>(null);
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [signingInProgress, setSigningInProgress] = useState(false);

  useEffect(() => {
    checkNCALayer();
  }, []);

  const checkNCALayer = async () => {
    try {
      const installed = await ncaLayerService.isInstalled();
      setNcaLayerInstalled(installed);
      
      if (installed) {
        await loadCertificates();
      }
    } catch (error) {
      console.error('Ошибка проверки NCALayer:', error);
      setNcaLayerInstalled(false);
    }
  };

  const loadCertificates = async () => {
    setLoadingCertificates(true);
    try {
      const certs = await ncaLayerService.getCertificates();
      setCertificates(certs);
      
      if (certs.length === 0) {
        toast.error('Сертификаты ЭЦП не найдены');
      }
    } catch (error) {
      console.error('Ошибка загрузки сертификатов:', error);
      toast.error('Не удалось загрузить сертификаты');
    } finally {
      setLoadingCertificates(false);
    }
  };

  const handleCertificateSelect = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
  };

  const handleLoadFromFile = async () => {
    try {
      // Создаем input для выбора файла
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.p12,.pfx,.jks';
      input.multiple = false;
      
      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        
        try {
          setLoadingCertificates(true);
          
          // Запрашиваем пароль у пользователя
          const password = prompt(`Введите пароль для файла "${file.name}"`);
          if (!password) {
            toast.error('Пароль не введен');
            return;
          }
          
          // Читаем файл как base64
          const base64 = await fileToBase64(file);
          
          // Загружаем сертификат через NCALayer
          const loadedCertificates = await ncaLayerService.loadCertificateFromFile(base64, password);
          
          if (loadedCertificates.length > 0) {
            setCertificates(prev => [...prev, ...loadedCertificates]);
            toast.success(`Загружен сертификат: ${loadedCertificates[0].fullName}`);
          } else {
            toast.error('Не удалось загрузить сертификат из файла');
          }
          
        } catch (error: any) {
          console.error('Ошибка загрузки сертификата:', error);
          if (error.message.includes('пароль') || error.message.includes('password')) {
            toast.error('Неверный пароль файла сертификата');
          } else {
            toast.error('Ошибка загрузки файла сертификата');
          }
        } finally {
          setLoadingCertificates(false);
        }
      };
      
      input.click();
    } catch (error) {
      console.error('Ошибка при выборе файла:', error);
      toast.error('Ошибка при выборе файла');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Убираем префикс data:...;base64,
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
    });
  };

  const handleTestConnection = async () => {
    try {
      setLoadingCertificates(true);
      console.log('🔍 Начинаем тестирование NCALayer...');
      
      const isInstalled = await ncaLayerService.isInstalled();
      console.log('📊 Результат проверки установки:', isInstalled);
      
      if (isInstalled) {
        toast.success('✅ NCALayer подключен и работает!');
        console.log('✅ NCALayer работает корректно');
        
        // Дополнительная проверка - попробуем получить сертификаты
        try {
          const certs = await ncaLayerService.getCertificates();
          console.log('📋 Получено сертификатов:', certs.length);
          toast.success(`Найдено сертификатов: ${certs.length}`);
        } catch (certError: any) {
          console.warn('⚠️ Ошибка получения сертификатов:', certError);
          toast.error(`NCALayer работает, но сертификаты не найдены: ${certError.message}`);
        }
      } else {
        toast.error('❌ NCALayer не подключен');
        console.error('❌ NCALayer недоступен');
      }
    } catch (error: any) {
      console.error('❌ Ошибка тестирования:', error);
      toast.error(`Ошибка проверки: ${error.message}`);
    } finally {
      setLoadingCertificates(false);
    }
  };

  const handleResetConnection = async () => {
    try {
      console.log('🔄 Пользователь запросил сброс соединения');
      
      // Сбрасываем соединение
      ncaLayerService.disconnect();
      
      // Очищаем список сертификатов
      setCertificates([]);
      setSelectedCertificate(null);
      
      toast.success('🔄 Соединение сброшено. Попробуйте заново.');
      console.log('✅ Соединение успешно сброшено');
      
    } catch (error: any) {
      console.error('❌ Ошибка сброса соединения:', error);
      toast.error(`Ошибка сброса: ${error.message}`);
    }
  };

  const handleSignAndLogin = async () => {
    if (!selectedCertificate) {
      toast.error('Выберите сертификат');
      return;
    }

    setSigningInProgress(true);
    try {
      // Создаем данные для подписи
      const authData = ncaLayerService.createAuthData();
      
      // Подписываем данные
      const signatureResult = await ncaLayerService.signData(
        authData,
        selectedCertificate.id
      );

      // Передаем результат родительскому компоненту
      onCertificateSelect(selectedCertificate, signatureResult.signature);
      
    } catch (error: any) {
      console.error('Ошибка подписи:', error);
      
      if (error.message.includes('отменен') || error.message.includes('cancelled')) {
        toast.error('Подпись отменена пользователем');
      } else if (error.message.includes('пароль') || error.message.includes('password')) {
        toast.error('Неверный пароль сертификата');
      } else {
        toast.error('Ошибка при подписи данных');
      }
    } finally {
      setSigningInProgress(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ru-RU');
    } catch {
      return dateString;
    }
  };

  const isExpired = (validTo: string) => {
    try {
      return new Date(validTo) < new Date();
    } catch {
      return false;
    }
  };

  // Если NCALayer не установлен
  if (ncaLayerInstalled === false) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
            <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            NCALayer не установлен
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Для работы с ЭЦП необходимо установить программу NCALayer от НУЦ РК
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={() => window.open('https://pki.gov.kz/ncalayer/', '_blank')}
              variant="primary"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Скачать NCALayer
            </Button>
            
            <Button
              onClick={checkNCALayer}
              variant="ghost"
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Проверить снова
            </Button>
            
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="font-medium mb-2">📋 Инструкция по установке:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Скачайте NCALayer с официального сайта НУЦ РК</li>
                <li>Установите программу и перезапустите браузер</li>
                <li>Подключите USB-токен или загрузите файлы ЭЦП</li>
                <li>Нажмите "Проверить снова"</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Если проверяем NCALayer
  if (ncaLayerInstalled === null) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
            <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Проверка установки NCALayer...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Выберите сертификат ЭЦП
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Выберите действующий сертификат для входа в систему
        </p>
      </div>

      {/* Кнопки управления сертификатами */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          onClick={loadCertificates}
          variant="ghost"
          size="sm"
          disabled={loadingCertificates}
          className="text-xs"
        >
          <RefreshCw className={`w-3 h-3 mr-1 ${loadingCertificates ? 'animate-spin' : ''}`} />
          Обновить список
        </Button>
        
        <Button
          onClick={handleLoadFromFile}
          variant="ghost"
          size="sm"
          className="text-xs"
        >
          📁 Загрузить из файла
        </Button>

        <Button
          onClick={handleTestConnection}
          variant="ghost"
          size="sm"
          className="text-xs"
        >
          🔍 Проверить NCALayer
        </Button>

        <Button
          onClick={handleResetConnection}
          variant="ghost"
          size="sm"
          className="text-xs text-orange-600"
        >
          🔄 Сбросить соединение
        </Button>
      </div>

      {/* Список сертификатов */}
      <div className="space-y-3 mb-6">
        {loadingCertificates ? (
          <div className="text-center py-8">
            <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500">Загрузка сертификатов...</p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 mb-3">Сертификаты не найдены</p>
            
            <div className="text-xs text-gray-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mt-3">
              <p className="font-medium mb-2">💡 Где найти сертификаты:</p>
              <ul className="text-left space-y-1">
                <li>• Подключите USB-токен</li>
                <li>• Загрузите файл .p12 или .pfx</li>
                <li>• Проверьте папку "Загрузки"</li>
                <li>• Обычно файлы называются: cert.p12, your_name.pfx</li>
              </ul>
            </div>

            <div className="text-xs text-gray-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-3 mt-3">
              <p className="font-medium mb-2">🔧 Если ничего не помогает:</p>
              <ul className="text-left space-y-1">
                <li>1. Нажмите <strong>"🔍 Проверить NCALayer"</strong></li>
                <li>2. Откройте <strong>Developer Tools (F12)</strong></li>
                <li>3. Смотрите логи в <strong>Console</strong></li>
                <li>4. Ищите сообщения с эмодзи: ✅❌🔍📨</li>
              </ul>
            </div>
          </div>
        ) : (
          certificates.map((certificate) => {
            const expired = isExpired(certificate.validTo);
            const isSelected = selectedCertificate?.id === certificate.id;
            
            return (
              <div
                key={certificate.id}
                onClick={() => !expired && handleCertificateSelect(certificate)}
                className={`
                  p-4 rounded-lg border cursor-pointer transition-all
                  ${expired ? 
                    'border-red-200 bg-red-50 dark:bg-red-900/10 cursor-not-allowed opacity-60' :
                    isSelected ? 
                      'border-primary bg-primary/10 dark:bg-primary/20' :
                      'border-gray-200 dark:border-gray-600 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
              >
                <div className="flex items-start space-x-3">
                  <div className={`
                    p-2 rounded-lg
                    ${expired ? 'bg-red-100 dark:bg-red-900/20' : 'bg-green-100 dark:bg-green-900/20'}
                  `}>
                    <Shield className={`w-4 h-4 ${expired ? 'text-red-600' : 'text-green-600'}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {certificate.fullName || 'Неизвестно'}
                      </h4>
                      {expired && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Просрочен
                        </span>
                      )}
                    </div>
                    
                    {certificate.organization && (
                      <div className="flex items-center space-x-2 mb-1">
                        <Building className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {certificate.organization}
                        </p>
                      </div>
                    )}
                    
                    {certificate.position && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">
                        {certificate.position}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        до {formatDate(certificate.validTo)}
                      </p>
                    </div>
                    
                    {certificate.iin && (
                      <p className="text-xs text-gray-400 mt-1">
                        ИИН: {certificate.iin}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Кнопка входа */}
      <Button
        onClick={handleSignAndLogin}
        variant="primary"
        size="lg"
        fullWidth
        disabled={!selectedCertificate || signingInProgress || isLoading}
        loading={signingInProgress || isLoading}
      >
        {signingInProgress ? 'Подпись данных...' : 'Войти в систему'}
      </Button>

      {/* Дополнительная информация */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          При входе будет создана электронная подпись для подтверждения личности
        </p>
        <p className="text-xs text-gray-400">
          Поддерживаются форматы: .p12, .pfx, .jks | USB-токены: KAZTOKEN, eToken
        </p>
      </div>
    </div>
  );
};
