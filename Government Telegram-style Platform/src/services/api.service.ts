import { 
  LoginCredentials, 
  LoginResponse, 
  User, 
  Chat, 
  Message, 
  Task, 
  Order, 
  Report, 
  Attachment,
  Contact,
  SearchFilters,
  PaginatedResponse,
  ApiResponse
} from '../types';

class ApiService {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1';
    this.loadTokens();
  }

  private loadTokens() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  private saveTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401 && this.refreshToken) {
        // Try to refresh token
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the original request
          headers.Authorization = `Bearer ${this.accessToken}`;
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          });
          
          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }
          
          return await retryResponse.json();
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (response.ok) {
        const data: LoginResponse = await response.json();
        this.saveTokens(data.accessToken, data.refreshToken || this.refreshToken!);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    this.clearTokens();
    return false;
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.accessToken && response.refreshToken) {
      this.saveTokens(response.accessToken, response.refreshToken);
    }
    
    return response;
  }

  async loginWithECP(certificateData: any): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login-ecp', {
      method: 'POST',
      body: JSON.stringify(certificateData),
    });
    
    if (response.accessToken && response.refreshToken) {
      this.saveTokens(response.accessToken, response.refreshToken);
    }
    
    return response;
  }

  async loginWithEGovMobile(sessionId: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login-egov-mobile', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
    
    if (response.accessToken && response.refreshToken) {
      this.saveTokens(response.accessToken, response.refreshToken);
    }
    
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.clearTokens();
    }
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // User methods
  async getUserProfile(): Promise<User> {
    return this.request<User>('/users/profile');
  }

  async updateUserProfile(profileData: Partial<User>): Promise<User> {
    return this.request<User>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async searchUsers(filters: SearchFilters): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
    
    return this.request<PaginatedResponse<User>>(`/users/search?${params.toString()}`);
  }

  async getUserById(id: string): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  // Contact methods
  async getContacts(): Promise<Contact[]> {
    return this.request<Contact[]>('/users/contacts/list');
  }

  async addContact(contactId: string): Promise<Contact> {
    return this.request<Contact>('/users/contacts', {
      method: 'POST',
      body: JSON.stringify({ contactId }),
    });
  }

  async removeContact(contactId: string): Promise<void> {
    return this.request<void>(`/users/contacts/${contactId}`, {
      method: 'DELETE',
    });
  }

  // Chat methods
  async getChats(): Promise<Chat[]> {
    return this.request<Chat[]>('/chats/user');
  }

  async getChatById(id: string): Promise<Chat> {
    return this.request<Chat>(`/chats/${id}`);
  }

  async createChat(chatData: Partial<Chat>): Promise<Chat> {
    return this.request<Chat>('/chats', {
      method: 'POST',
      body: JSON.stringify(chatData),
    });
  }

  async updateChat(id: string, chatData: Partial<Chat>): Promise<Chat> {
    return this.request<Chat>(`/chats/${id}`, {
      method: 'PUT',
      body: JSON.stringify(chatData),
    });
  }

  async deleteChat(id: string): Promise<void> {
    return this.request<void>(`/chats/${id}`, {
      method: 'DELETE',
    });
  }

  async getChatMessages(chatId: string, page: number = 1, limit: number = 50): Promise<PaginatedResponse<Message>> {
    return this.request<PaginatedResponse<Message>>(`/chats/${chatId}/messages?page=${page}&limit=${limit}`);
  }

  async sendMessage(messageData: Partial<Message>): Promise<Message> {
    return this.request<Message>('/chats/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async updateMessage(id: string, messageData: Partial<Message>): Promise<Message> {
    return this.request<Message>(`/chats/messages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(messageData),
    });
  }

  async deleteMessage(id: string): Promise<void> {
    return this.request<void>(`/chats/messages/${id}`, {
      method: 'DELETE',
    });
  }

  // Task methods
  async getTasks(filters?: Partial<SearchFilters>): Promise<PaginatedResponse<Task>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    return this.request<PaginatedResponse<Task>>(`/tasks?${params.toString()}`);
  }

  async getTaskById(id: string): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`);
  }

  async createTask(taskData: Partial<Task>): Promise<Task> {
    return this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(id: string, taskData: Partial<Task>): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  }

  async deleteTask(id: string): Promise<void> {
    return this.request<void>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async updateTaskStatus(id: string, status: string): Promise<Task> {
    return this.request<Task>(`/tasks/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async addTaskComment(taskId: string, commentData: Partial<any>): Promise<any> {
    return this.request<any>(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  }

  async getTaskComments(taskId: string): Promise<any[]> {
    return this.request<any[]>(`/tasks/${taskId}/comments`);
  }

  async addTaskAttachment(taskId: string, file: File): Promise<Attachment> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request<Attachment>(`/tasks/${taskId}/attachments`, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  // Order methods
  async getOrders(filters?: Partial<SearchFilters>): Promise<PaginatedResponse<Order>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    return this.request<PaginatedResponse<Order>>(`/orders?${params.toString()}`);
  }

  async getOrderById(id: string): Promise<Order> {
    return this.request<Order>(`/orders/${id}`);
  }

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    return this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async updateOrder(id: string, orderData: Partial<Order>): Promise<Order> {
    return this.request<Order>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
  }

  async deleteOrder(id: string): Promise<void> {
    return this.request<void>(`/orders/${id}`, {
      method: 'DELETE',
    });
  }

  // Report methods
  async getReports(filters?: Partial<SearchFilters>): Promise<PaginatedResponse<Report>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    return this.request<PaginatedResponse<Report>>(`/reports?${params.toString()}`);
  }

  async getReportById(id: string): Promise<Report> {
    return this.request<Report>(`/reports/${id}`);
  }

  async createReport(reportData: Partial<Report>): Promise<Report> {
    return this.request<Report>('/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  async updateReport(id: string, reportData: Partial<Report>): Promise<Report> {
    return this.request<Report>(`/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reportData),
    });
  }

  async deleteReport(id: string): Promise<void> {
    return this.request<void>(`/reports/${id}`, {
      method: 'DELETE',
    });
  }

  // File methods
  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<Attachment> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request<Attachment>('/files/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  async uploadMultipleFiles(files: File[], onProgress?: (progress: number) => void): Promise<Attachment[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    return this.request<Attachment[]>('/files/upload-multiple', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  async getUserFiles(): Promise<Attachment[]> {
    return this.request<Attachment[]>('/files/user');
  }

  async getFileById(id: string): Promise<Attachment> {
    return this.request<Attachment>(`/files/${id}`);
  }

  async downloadFile(id: string): Promise<Blob> {
    const response = await fetch(`${this.baseURL}/files/${id}/download`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.blob();
  }

  async getFilePreview(id: string): Promise<string> {
    return this.request<string>(`/files/${id}/preview`);
  }

  async getFileUrl(id: string): Promise<{ url: string; expiresAt: Date }> {
    return this.request<{ url: string; expiresAt: Date }>(`/files/${id}/url`, {
      method: 'POST',
    });
  }

  async deleteFile(id: string): Promise<void> {
    return this.request<void>(`/files/${id}`, {
      method: 'DELETE',
    });
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }
}

export const apiService = new ApiService();
export default apiService;
