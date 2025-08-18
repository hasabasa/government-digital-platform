// User types
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  role: UserRole;
  organization: string;
  position: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
  permissions: Permission[];
}

export type UserRole = 'minister' | 'department_head' | 'division_head' | 'employee';

export interface Permission {
  id: string;
  name: string;
  description: string;
}

// Authentication types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

// Chat types
export interface Chat {
  id: string;
  name: string;
  type: 'private' | 'group' | 'channel';
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  sender: User;
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'voice' | 'video' | 'reaction';
  attachments?: Attachment[];
  reactions?: Reaction[];
  replyTo?: Message;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  duration?: number; // for audio/video
}

export interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  user: User;
  createdAt: Date;
}

// Task types
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  assignee: User;
  creatorId: string;
  creator: User;
  dueDate?: Date;
  attachments: Attachment[];
  comments: TaskComment[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  user: User;
  content: string;
  attachments: Attachment[];
  createdAt: Date;
  updatedAt: Date;
}

// Order types
export interface Order {
  id: string;
  title: string;
  content: string;
  type: OrderType;
  priority: OrderPriority;
  issuerId: string;
  issuer: User;
  recipients: User[];
  status: OrderStatus;
  dueDate?: Date;
  attachments: Attachment[];
  createdAt: Date;
  updatedAt: Date;
}

export type OrderType = 'instruction' | 'directive' | 'decision' | 'announcement';
export type OrderPriority = 'low' | 'medium' | 'high' | 'critical';
export type OrderStatus = 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';

// Report types
export interface Report {
  id: string;
  title: string;
  content: string;
  type: ReportType;
  status: ReportStatus;
  authorId: string;
  author: User;
  assignees?: User[];
  attachments: Attachment[];
  comments: ReportComment[];
  createdAt: Date;
  updatedAt: Date;
}

export type ReportType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'incident' | 'achievement';
export type ReportStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'completed';

export interface ReportComment {
  id: string;
  reportId: string;
  userId: string;
  user: User;
  content: string;
  attachments: Attachment[];
  createdAt: Date;
  updatedAt: Date;
}

// File types
export interface FileUpload {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

// WebSocket event types
export interface WebSocketEvent {
  type: string;
  payload: any;
  timestamp: Date;
}

export interface ChatEvent extends WebSocketEvent {
  type: 'message:new' | 'message:deleted' | 'message:updated' | 'typing:start' | 'typing:stop';
  payload: {
    chatId: string;
    message?: Message;
    userId?: string;
  };
}

export interface TaskEvent extends WebSocketEvent {
  type: 'task:created' | 'task:updated' | 'task:deleted' | 'task:status_changed';
  payload: {
    taskId: string;
    task?: Task;
    status?: TaskStatus;
  };
}

export interface ReportEvent extends WebSocketEvent {
  type: 'report:created' | 'report:updated' | 'report:deleted' | 'report:status_changed';
  payload: {
    reportId: string;
    report?: Report;
    status?: ReportStatus;
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Search types
export interface SearchFilters {
  query: string;
  type?: 'users' | 'chats' | 'tasks' | 'orders' | 'reports';
  role?: UserRole;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Contact types
export interface Contact {
  id: string;
  userId: string;
  contactId: string;
  contact: User;
  isFavorite: boolean;
  notes?: string;
  createdAt: Date;
}
