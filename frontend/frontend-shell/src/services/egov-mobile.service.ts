/**
 * Сервис для работы с eGov Mobile аутентификацией
 */

export interface EGovMobileAuthRequest {
  sessionId: string;
  qrData: string;
  deepLink: string;
  expiresAt: number;
}

export interface EGovMobileAuthResult {
  success: boolean;
  userData?: {
    iin: string;
    fullName: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    email?: string;
    organization?: string;
    position?: string;
    avatar?: string;
  };
  error?: string;
}

export class EGovMobileService {
  private static instance: EGovMobileService;
  private baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8080';
  
  // Состояние текущей сессии
  private currentSession: EGovMobileAuthRequest | null = null;
  private pollInterval: NodeJS.Timeout | null = null;

  public static getInstance(): EGovMobileService {
    if (!EGovMobileService.instance) {
      EGovMobileService.instance = new EGovMobileService();
    }
    return EGovMobileService.instance;
  }

  /**
   * Инициирует процесс аутентификации через eGov Mobile
   */
  async initializeAuth(): Promise<EGovMobileAuthRequest> {
    try {
      console.log('🚀 Инициализация eGov Mobile аутентификации...');
      
      const response = await fetch(`${this.baseUrl}/api/v1/auth/egov-mobile/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: Date.now(),
          clientInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ошибка инициализации: ${response.status}`);
      }

      const authRequest: EGovMobileAuthRequest = await response.json();
      
      this.currentSession = authRequest;
      console.log('✅ eGov Mobile сессия создана:', authRequest.sessionId);
      
      return authRequest;
    } catch (error: any) {
      console.error('❌ Ошибка инициализации eGov Mobile:', error);
      throw new Error(`Не удалось инициализировать eGov Mobile: ${error.message}`);
    }
  }

  /**
   * Начинает polling статуса аутентификации
   */
  startPolling(sessionId: string, onResult: (result: EGovMobileAuthResult) => void): void {
    console.log('🔄 Начинаем polling статуса аутентификации...');
    
    this.stopPolling(); // Останавливаем предыдущий polling если есть
    
    this.pollInterval = setInterval(async () => {
      try {
        const result = await this.checkAuthStatus(sessionId);
        
        if (result.success || result.error) {
          console.log('✅ Получен финальный результат:', result);
          this.stopPolling();
          onResult(result);
        }
      } catch (error: any) {
        console.error('❌ Ошибка polling:', error);
        this.stopPolling();
        onResult({
          success: false,
          error: `Ошибка проверки статуса: ${error.message}`
        });
      }
    }, 2000); // Проверяем каждые 2 секунды
  }

  /**
   * Останавливает polling
   */
  stopPolling(): void {
    if (this.pollInterval) {
      console.log('⏹️ Останавливаем polling');
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Проверяет статус аутентификации
   */
  private async checkAuthStatus(sessionId: string): Promise<EGovMobileAuthResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/auth/egov-mobile/status/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Ошибка проверки статуса: ${response.status}`);
      }

      const result: EGovMobileAuthResult = await response.json();
      return result;
    } catch (error: any) {
      console.error('❌ Ошибка проверки статуса:', error);
      throw error;
    }
  }

  /**
   * Отменяет текущую сессию аутентификации
   */
  async cancelAuth(sessionId: string): Promise<void> {
    try {
      console.log('🚫 Отмена eGov Mobile аутентификации...');
      
      this.stopPolling();
      
      await fetch(`${this.baseUrl}/api/v1/auth/egov-mobile/cancel/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      this.currentSession = null;
      console.log('✅ Аутентификация отменена');
    } catch (error: any) {
      console.error('❌ Ошибка отмены:', error);
      // Не бросаем ошибку, так как отмена не критична
    }
  }

  /**
   * Генерирует URL для deeplink
   */
  generateDeepLink(qrData: string): string {
    // Формат deeplink для eGov Mobile
    const encodedData = encodeURIComponent(qrData);
    return `egov://auth?data=${encodedData}`;
  }

  /**
   * Проверяет, истекла ли сессия
   */
  isSessionExpired(session: EGovMobileAuthRequest): boolean {
    return Date.now() > session.expiresAt;
  }

  /**
   * Получает текущую сессию
   */
  getCurrentSession(): EGovMobileAuthRequest | null {
    return this.currentSession;
  }

  /**
   * Очищает текущую сессию
   */
  clearSession(): void {
    this.stopPolling();
    this.currentSession = null;
  }
}

export const egovMobileService = EGovMobileService.getInstance();
