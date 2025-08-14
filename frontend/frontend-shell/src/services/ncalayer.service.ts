/**
 * Сервис для работы с NCALayer - программой для интеграции с ЭЦП
 * Документация: https://pki.gov.kz/
 */

import { mockCertificates, createMockSignature, isMockMode } from './mock-certificates';

export interface Certificate {
  id: string;
  subjectName: string;
  issuerName: string;
  serialNumber: string;
  validFrom: string;
  validTo: string;
  keyUsage: string[];
  iin?: string;
  bin?: string;
  email?: string;
  fullName?: string;
  organization?: string;
  position?: string;
}

export interface NCALayerResponse {
  code: number;
  message: string;
  result?: any;
}

export interface SignatureResult {
  signature: string;
  certificate: string;
  certificateChain: string[];
}

class NCALayerService {
  private readonly WS_URL = 'wss://127.0.0.1:13579/';
  private ws: WebSocket | null = null;
  private requestId = 0;
  private pendingRequests = new Map<number, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }>();

  /**
   * Проверяет, установлен ли NCALayer
   */
  async isInstalled(): Promise<boolean> {
    // В mock режиме считаем что NCALayer "установлен"
    if (isMockMode()) {
      console.log('🔧 [MOCK] Работаем в mock режиме - эмулируем NCALayer');
      return true;
    }

    // Если уже подключены, возвращаем true
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('✅ NCALayer уже подключен');
      return true;
    }

    try {
      console.log('🔍 Проверяем установку NCALayer...');
      
      // Пробуем подключиться через WebSocket
      const testWs = new WebSocket(this.WS_URL);
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log('⏰ Таймаут проверки NCALayer (2 сек)');
          testWs.close();
          resolve(false);
        }, 2000); // Уменьшили таймаут

        testWs.onopen = () => {
          console.log('✅ NCALayer найден и работает');
          clearTimeout(timeout);
          testWs.close();
          resolve(true);
        };

        testWs.onerror = (error) => {
          console.warn('❌ NCALayer не отвечает:', error);
          clearTimeout(timeout);
          resolve(false);
        };

        testWs.onclose = () => {
          console.log('🔌 Тестовое подключение закрыто');
        };
      });
    } catch (error) {
      console.warn('❌ Ошибка проверки NCALayer:', error);
      return false;
    }
  }

  /**
   * Устанавливает WebSocket соединение с NCALayer
   */
  private async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('📡 Используем существующее подключение к NCALayer');
      return;
    }

    // Закрываем старое соединение если оно есть
    if (this.ws) {
      console.log('🔌 Закрываем старое подключение');
      this.ws.close();
      this.ws = null;
    }

    return new Promise((resolve, reject) => {
      console.log('🔗 Создаем новое WebSocket подключение к NCALayer...');
      this.ws = new WebSocket(this.WS_URL);

      this.ws.onopen = () => {
        console.log('✅ NCALayer WebSocket подключен');
        resolve();
      };

      this.ws.onerror = (error) => {
        console.error('❌ Ошибка WebSocket:', error);
        reject(new Error('Не удалось подключиться к NCALayer'));
      };

      this.ws.onmessage = (event) => {
        try {
          console.log(`📨 Получен ответ от NCALayer:`, event.data);
          const response = JSON.parse(event.data);
          const { id, ...result } = response;
          
          const pendingRequest = this.pendingRequests.get(id);
          if (pendingRequest) {
            console.log(`✅ Обрабатываем ответ для запроса #${id}:`, result);
            this.pendingRequests.delete(id);
            
            if (result.code === 200) {
              console.log(`✅ Успешный ответ #${id}`);
              pendingRequest.resolve(result);
            } else {
              console.error(`❌ Ошибка в ответе #${id}:`, result);
              pendingRequest.reject(new Error(result.message || 'Ошибка NCALayer'));
            }
          } else {
            console.warn(`⚠️ Получен ответ для неизвестного запроса #${id}`);
          }
        } catch (error) {
          console.error('❌ Ошибка парсинга ответа NCALayer:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`🔌 NCALayer WebSocket отключен (код: ${event.code})`);
        this.ws = null;
        
        // Отклоняем все ожидающие запросы
        this.pendingRequests.forEach((request, id) => {
          console.log(`❌ Отклоняем запрос #${id} из-за отключения`);
          request.reject(new Error('Соединение с NCALayer потеряно'));
        });
        this.pendingRequests.clear();
      };

      // Таймаут подключения
      setTimeout(() => {
        if (this.ws?.readyState !== WebSocket.OPEN) {
          console.error('⏰ Таймаут подключения к NCALayer (5 сек)');
          reject(new Error('Таймаут подключения к NCALayer'));
        }
      }, 5000);
    });
  }

  /**
   * Отправляет запрос в NCALayer
   */
  private async sendRequest(method: string, params: any = {}): Promise<any> {
    console.log(`🚀 Отправка запроса к NCALayer:`, { method, params });
    
    await this.connect();

    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      
      this.pendingRequests.set(id, { resolve, reject });

      const request = {
        id,
        method,
        params
      };

      console.log(`📤 Отправляем запрос #${id}:`, request);

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(request));
        console.log(`✅ Запрос #${id} отправлен успешно`);
      } else {
        console.error(`❌ WebSocket не подключен для запроса #${id}`);
        this.pendingRequests.delete(id);
        reject(new Error('WebSocket не подключен'));
      }

      // Таймаут запроса (уменьшили до 10 секунд)
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          console.error(`⏰ Таймаут запроса #${id} к NCALayer (10 сек)`);
          this.pendingRequests.delete(id);
          reject(new Error('Таймаут запроса к NCALayer'));
        }
      }, 10000);
    });
  }

  /**
   * Принудительно сбрасывает все соединения
   */
  public disconnect(): void {
    console.log('🔄 Принудительный сброс соединений NCALayer');
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    // Отклоняем все ожидающие запросы
    this.pendingRequests.forEach((request, id) => {
      console.log(`❌ Отклоняем запрос #${id} при сбросе`);
      request.reject(new Error('Соединение сброшено'));
    });
    this.pendingRequests.clear();
    
    console.log('✅ Все соединения и запросы очищены');
  }

  /**
   * Получает список доступных сертификатов
   */
  async getCertificates(): Promise<Certificate[]> {
    // В mock режиме возвращаем тестовые сертификаты
    if (isMockMode()) {
      console.log('🔧 [MOCK] Возвращаем mock сертификаты');
      // Имитируем задержку сети
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockCertificates;
    }

    console.log('🔍 Загрузка сертификатов из NCALayer...');
    
    try {
      // Проверяем, что NCALayer доступен
      const isConnected = await this.isInstalled();
      if (!isConnected) {
        console.error('❌ NCALayer не подключен');
        throw new Error('NCALayer не подключен. Убедитесь что приложение запущено.');
      }

      console.log('✅ NCALayer подключен, запрашиваем сертификаты...');
      
      const response = await this.sendRequest('X509.getCertificates', {
        allowedStorages: ['PKCS12', 'JKS', 'AKS'],
        currentUserOnly: true
      });

      console.log('📋 Получен ответ от NCALayer:', response);

      if (!response || !response.result) {
        console.warn('⚠️ Пустой ответ от NCALayer');
        return [];
      }

      const certificates = response.result.map((cert: any) => this.parseCertificate(cert));
      console.log(`✅ Найдено сертификатов: ${certificates.length}`);
      
      return certificates;
    } catch (error: any) {
      console.error('❌ Ошибка получения сертификатов:', error);
      
      if (error.message?.includes('WebSocket')) {
        throw new Error('Не удается подключиться к NCALayer. Убедитесь что приложение запущено.');
      } else if (error.message?.includes('timeout')) {
        throw new Error('Время ожидания ответа от NCALayer истекло.');
      } else {
        throw new Error(`Ошибка загрузки сертификатов: ${error.message}`);
      }
    }
  }

  /**
   * Загружает сертификат из файла
   */
  async loadCertificateFromFile(base64Data: string, password: string): Promise<Certificate[]> {
    // В mock режиме создаем фиктивный сертификат
    if (isMockMode()) {
      console.log('Создаем mock сертификат из файла');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockCert: Certificate = {
        id: `file-cert-${Date.now()}`,
        subjectName: 'CN=Сертификат из файла,SERIALNUMBER=IIN999888777666,O=Загружено из файла',
        issuerName: 'CN=НУЦ РК,O=Национальный удостоверяющий центр РК',
        serialNumber: Date.now().toString(),
        validFrom: new Date().toISOString(),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        keyUsage: ['digital_signature', 'non_repudiation'],
        iin: '999888777666',
        fullName: 'Сертификат из файла',
        organization: 'Загружено из файла',
        position: 'Тестовый сертификат',
        email: 'file@test.kz'
      };
      
      return [mockCert];
    }

    try {
      const response = await this.sendRequest('X509.loadKeyStore', {
        data: base64Data,
        password: password,
        alias: '', // Автоматический выбор
        storageType: 'PKCS12'
      });

      if (response.result && response.result.length > 0) {
        return response.result.map((cert: any) => this.parseCertificate(cert));
      } else {
        throw new Error('Сертификаты не найдены в файле');
      }
    } catch (error: any) {
      console.error('Ошибка загрузки сертификата из файла:', error);
      
      if (error.message.includes('password') || error.message.includes('пароль')) {
        throw new Error('Неверный пароль файла сертификата');
      } else if (error.message.includes('format') || error.message.includes('формат')) {
        throw new Error('Неподдерживаемый формат файла');
      } else {
        throw new Error('Не удалось загрузить сертификат из файла');
      }
    }
  }

  /**
   * Парсит данные сертификата
   */
  private parseCertificate(certData: any): Certificate {
    const subject = this.parseDistinguishedName(certData.subjectName || '');
    this.parseDistinguishedName(certData.issuerName || ''); // Парсим информацию об издателе

    return {
      id: certData.id || '',
      subjectName: certData.subjectName || '',
      issuerName: certData.issuerName || '',
      serialNumber: certData.serialNumber || '',
      validFrom: certData.validFrom || '',
      validTo: certData.validTo || '',
      keyUsage: certData.keyUsage || [],
      iin: subject.SERIALNUMBER || subject.IIN,
      bin: subject.BIN,
      email: subject.EMAILADDRESS || subject.E,
      fullName: `${subject.SURNAME || ''} ${subject.GIVENNAME || ''}`.trim() || subject.CN,
      organization: subject.O,
      position: subject.T
    };
  }

  /**
   * Парсит Distinguished Name из сертификата
   */
  private parseDistinguishedName(dn: string): Record<string, string> {
    const result: Record<string, string> = {};
    
    // Парсим строку вида "CN=Иванов Иван Иванович,SERIALNUMBER=IIN123456789012,E=ivan@example.com"
    const parts = dn.split(',');
    
    for (const part of parts) {
      const [key, ...valueParts] = part.trim().split('=');
      if (key && valueParts.length > 0) {
        result[key.trim()] = valueParts.join('=').trim();
      }
    }
    
    return result;
  }

  /**
   * Подписывает данные выбранным сертификатом
   */
  async signData(data: string, certificateId: string, password?: string): Promise<SignatureResult> {
    // В mock режиме создаем фиктивную подпись
    if (isMockMode()) {
      console.log('Создаем mock подпись для сертификата:', certificateId);
      
      // Имитируем задержку подписи
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockSignature = createMockSignature(certificateId, data);
      
      return {
        signature: mockSignature,
        certificate: 'MOCK-CERTIFICATE-DATA',
        certificateChain: ['MOCK-CHAIN-CERT-1', 'MOCK-CHAIN-CERT-2']
      };
    }

    try {
      const response = await this.sendRequest('X509.signData', {
        data: btoa(data), // Кодируем в base64
        certificateId,
        password: password || '',
        signingFormat: 'CMS'
      });

      return {
        signature: response.result.signature,
        certificate: response.result.certificate,
        certificateChain: response.result.certificateChain || []
      };
    } catch (error) {
      console.error('Ошибка подписи данных:', error);
      throw new Error('Не удалось подписать данные');
    }
  }

  /**
   * Создает данные для аутентификации
   */
  createAuthData(): string {
    return JSON.stringify({
      timestamp: Date.now(),
      nonce: this.generateNonce(),
      action: 'login',
      service: 'gov-platform'
    });
  }

  /**
   * Генерирует случайную строку
   */
  private generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Получает URL для скачивания NCALayer
   */
  getDownloadUrl(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('windows')) {
      return 'https://pki.gov.kz/ncalayer/NCALayer-windows.msi';
    } else if (userAgent.includes('mac')) {
      return 'https://pki.gov.kz/ncalayer/NCALayer-macos.pkg';
    } else if (userAgent.includes('linux')) {
      return 'https://pki.gov.kz/ncalayer/NCALayer-linux.deb';
    }
    
    return 'https://pki.gov.kz/ncalayer/';
  }
}

export const ncaLayerService = new NCALayerService();
