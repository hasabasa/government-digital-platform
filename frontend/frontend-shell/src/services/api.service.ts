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

  // Auth endpoints — email/password
  async registerByEmail(data: { email: string; password: string; firstName: string; lastName: string }) {
    const response = await this.api.post('/auth/register', data);
    return response.data;
  }

  async loginByEmail(data: { email: string; password: string }) {
    const response = await this.api.post('/auth/login-email', data);
    return response.data;
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

  async addContact(contactUserId: string, note?: string) {
    const response = await this.api.post('/users/contacts', { contactUserId, note });
    return response.data;
  }

  async getPendingContacts(page = 1, limit = 20) {
    const response = await this.api.get(`/users/contacts/pending?page=${page}&limit=${limit}`);
    return response.data;
  }

  async acceptContact(contactId: string) {
    const response = await this.api.put(`/users/contacts/${contactId}/accept`);
    return response.data;
  }

  async declineContact(contactId: string) {
    const response = await this.api.delete(`/users/contacts/${contactId}/decline`);
    return response.data;
  }

  async removeContact(contactUserId: string) {
    const response = await this.api.delete(`/users/contacts/${contactUserId}`);
    return response.data;
  }

  async blockContact(contactUserId: string) {
    const response = await this.api.post(`/users/contacts/${contactUserId}/block`);
    return response.data;
  }

  async getUsers(page = 1, limit = 20) {
    const response = await this.api.get(`/users/list?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getUserById(userId: string) {
    const response = await this.api.get(`/users/${userId}`);
    return response.data;
  }

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('isPublic', 'true');

    // Upload file
    const uploadResponse = await this.api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const fileId = uploadResponse.data?.data?.id || uploadResponse.data?.id;

    // Generate URL
    const urlResponse = await this.api.post(`/files/${fileId}/url`);
    const avatarUrl = urlResponse.data?.data?.url || urlResponse.data?.url;

    // Update profile with avatar URL
    await this.updateUserProfile({ avatar: avatarUrl });

    return { fileId, avatarUrl };
  }

  async getFileDownloadUrl(fileId: string) {
    const response = await this.api.post(`/files/${fileId}/url`);
    return response.data;
  }

  async getFilePreview(fileId: string, size: 'small' | 'medium' | 'large' = 'medium') {
    const response = await this.api.get(`/files/${fileId}/preview?size=${size}`, {
      responseType: 'blob',
    });
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

  async sendMessage(data: { chatId: string; content: string; type?: string; fileId?: string }) {
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

  // Task endpoints
  async getTasks(filters?: Record<string, any>) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });
    }
    const response = await this.api.get(`/tasks?${params}`);
    return response.data;
  }

  async getTaskById(taskId: string) {
    const response = await this.api.get(`/tasks/${taskId}`);
    return response.data;
  }

  async createTask(data: any) {
    const response = await this.api.post('/tasks', data);
    return response.data;
  }

  async updateTask(taskId: string, data: any) {
    const response = await this.api.put(`/tasks/${taskId}`, data);
    return response.data;
  }

  async deleteTask(taskId: string) {
    const response = await this.api.delete(`/tasks/${taskId}`);
    return response.data;
  }

  // Call endpoints
  async getCalls() {
    const response = await this.api.get('/calls');
    return response.data;
  }

  async initiateCall(data: { type: string; participantIds: string[]; title?: string }) {
    const response = await this.api.post('/calls', data);
    return response.data;
  }

  // Finance endpoints
  async getFinanceDashboard() {
    const response = await this.api.get('/finance/dashboard');
    return response.data;
  }

  async getTransactions(filters?: Record<string, any>) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });
    }
    const response = await this.api.get(`/finance/transactions?${params}`);
    return response.data;
  }

  async createTransaction(data: any) {
    const response = await this.api.post('/finance/transactions', data);
    return response.data;
  }

  // CRM endpoints
  async getCrmLeads(filters?: Record<string, any>) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') params.append(key, String(value));
      });
    }
    const response = await this.api.get(`/crm/leads?${params}`);
    return response.data;
  }

  async getCrmLeadById(leadId: string) {
    const response = await this.api.get(`/crm/leads/${leadId}`);
    return response.data;
  }

  async createCrmLead(data: any) {
    const response = await this.api.post('/crm/leads', data);
    return response.data;
  }

  async updateCrmLead(leadId: string, data: any) {
    const response = await this.api.put(`/crm/leads/${leadId}`, data);
    return response.data;
  }

  async deleteCrmLead(leadId: string) {
    const response = await this.api.delete(`/crm/leads/${leadId}`);
    return response.data;
  }

  async moveCrmLeadStage(leadId: string, data: { toStage: string; comment?: string }) {
    const response = await this.api.post(`/crm/leads/${leadId}/move`, data);
    return response.data;
  }

  async getCrmLeadHistory(leadId: string) {
    const response = await this.api.get(`/crm/leads/${leadId}/history`);
    return response.data;
  }

  async getCrmDashboard() {
    const response = await this.api.get('/crm/dashboard');
    return response.data;
  }

  async getCrmManagerStats() {
    const response = await this.api.get('/crm/dashboard/managers');
    return response.data;
  }

  async getCrmSalesPlans() {
    const response = await this.api.get('/crm/plans');
    return response.data;
  }

  async createCrmSalesPlan(data: any) {
    const response = await this.api.post('/crm/plans', data);
    return response.data;
  }

  async updateCrmSalesPlan(planId: string, data: any) {
    const response = await this.api.put(`/crm/plans/${planId}`, data);
    return response.data;
  }

  async deleteCrmSalesPlan(planId: string) {
    const response = await this.api.delete(`/crm/plans/${planId}`);
    return response.data;
  }

  async getCrmAccessList() {
    const response = await this.api.get('/crm/access');
    return response.data;
  }

  async grantCrmAccess(userId: string) {
    const response = await this.api.post('/crm/access', { userId });
    return response.data;
  }

  async revokeCrmAccess(userId: string) {
    const response = await this.api.delete(`/crm/access/${userId}`);
    return response.data;
  }

  async checkCrmAccess() {
    const response = await this.api.get('/crm/access/check');
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
