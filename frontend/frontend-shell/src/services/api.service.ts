import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '../stores/auth.store';
import toast from 'react-hot-toast';

class ApiService {
  private api: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: string) => void;
    reject: (error: any) => void;
  }> = [];

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.api(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = useAuthStore.getState().refreshToken;
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            const response = await this.api.post('/auth/refresh', {
              refreshToken,
            });

            const { token: newToken, refreshToken: newRefreshToken } = response.data.data;
            const { user } = useAuthStore.getState();

            if (user) {
              useAuthStore.getState().setAuth(user, newToken, newRefreshToken);
            }

            // Process failed queue
            this.failedQueue.forEach(({ resolve }) => {
              resolve(newToken);
            });
            this.failedQueue = [];

            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout user
            useAuthStore.getState().logout();
            this.failedQueue.forEach(({ reject }) => {
              reject(refreshError);
            });
            this.failedQueue = [];

            toast.error('Сессия истекла. Пожалуйста, войдите снова.');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle other errors
        if (error.response?.data?.error) {
          const errorMessage = error.response.data.error;
          if (error.response.status >= 500) {
            toast.error('Ошибка сервера. Попробуйте позже.');
          } else if (error.response.status !== 401) {
            toast.error(errorMessage);
          }
        } else if (error.message === 'Network Error') {
          toast.error('Ошибка сети. Проверьте соединение.');
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: { email: string; digitalSignature: string }) {
    const response = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async loginWithECP(ecpData: {
    certificate: {
      id: string;
      subjectName: string;
      issuerName: string;
      serialNumber: string;
      validFrom: string;
      validTo: string;
      iin?: string;
      fullName?: string;
      organization?: string;
      position?: string;
      email?: string;
    };
    signature: string;
    timestamp: number;
  }) {
    const response = await this.api.post('/auth/login-ecp', ecpData);
    return response.data;
  }

  async loginWithEGovMobile(userData: {
    iin: string;
    fullName: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    email?: string;
    organization?: string;
    position?: string;
    avatar?: string;
  }) {
    const response = await this.api.post('/auth/login-egov-mobile', userData);
    return response;
  }

  async refresh(refreshToken: string) {
    const response = await this.api.post('/auth/refresh', { refreshToken });
    return response.data;
  }

  async logout() {
    const response = await this.api.post('/auth/logout');
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  // User endpoints
  async getUserProfile() {
    const response = await this.api.get('/users/profile');
    return response.data;
  }

  async updateUserProfile(data: any) {
    const response = await this.api.put('/users/profile', data);
    return response.data;
  }

  async searchUsers(query: string) {
    const response = await this.api.get(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  async getUserContacts() {
    const response = await this.api.get('/users/contacts/list');
    return response.data;
  }

  async addContact(userId: string) {
    const response = await this.api.post('/users/contacts', { userId });
    return response.data;
  }

  // Chat endpoints
  async getUserChats(page = 1, limit = 20) {
    const response = await this.api.get(`/chats/user?page=${page}&limit=${limit}`);
    return response.data;
  }

  async createChat(data: { type: string; name?: string; participantIds: string[] }) {
    const response = await this.api.post('/chats', data);
    return response.data;
  }

  async getChatMessages(chatId: string, page = 1, limit = 50) {
    const response = await this.api.get(`/chats/${chatId}/messages?page=${page}&limit=${limit}`);
    return response.data;
  }

  async sendMessage(data: { chatId: string; content: string; type?: string }) {
    const response = await this.api.post('/chats/messages', data);
    return response.data;
  }

  // File endpoints
  async uploadFile(file: File, options?: { description?: string; isPublic?: boolean }) {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.description) {
      formData.append('description', options.description);
    }
    if (options?.isPublic !== undefined) {
      formData.append('isPublic', options.isPublic.toString());
    }

    const response = await this.api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getUserFiles(page = 1, limit = 20, type?: string) {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (type) params.append('type', type);
    
    const response = await this.api.get(`/files/user?${params}`);
    return response.data;
  }

  async getFileInfo(fileId: string) {
    const response = await this.api.get(`/files/${fileId}`);
    return response.data;
  }

  async generateFileUrl(fileId: string, expiresIn?: number) {
    const params = expiresIn ? `?expiresIn=${expiresIn}` : '';
    const response = await this.api.post(`/files/${fileId}/url${params}`);
    return response.data;
  }

  async deleteFile(fileId: string) {
    const response = await this.api.delete(`/files/${fileId}`);
    return response.data;
  }

  // Generic request method
  async request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.request(config);
  }

  // Get API instance for custom requests
  getApi(): AxiosInstance {
    return this.api;
  }
}

export const apiService = new ApiService();
