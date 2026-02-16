// Basic types for the application
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  role: 'admin' | 'manager' | 'employee';
  organizationId?: string;
  organization?: string;
  position?: string;
  avatar?: string;
  isOnline?: boolean;
  phone?: string;
  bio?: string;
  statusMessage?: string;
  lastLoginAt?: string;
}

export interface Chat {
  id: string;
  name?: string;
  type: 'direct' | 'group' | 'channel';
  participants: string[];
  participantCount?: number;
  subscriberCount?: number;
  avatar?: string;
  isPrivate?: boolean;
  isPinned?: boolean;
  lastMessage?: Message;
  lastMessageAt?: Date;
  unreadCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  type: 'text' | 'file' | 'image' | 'video' | 'audio' | 'system';
  fileId?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileMimeType?: string;
  replyToId?: string;
  isEdited?: boolean;
  isDeleted?: boolean;
  readBy?: Array<{ userId: string; readAt: string }>;
  metadata?: Record<string, any>;
  editedAt?: Date;
  createdAt: Date;
}

export interface Contact {
  id: string;
  userId: string;
  contactUserId: string;
  status: 'pending' | 'accepted' | 'blocked';
  note?: string;
  user?: User;
  createdAt: Date;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: User[];
  admins: string[];
  avatar?: string;
  isPrivate: boolean;
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'assigned' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigneeId?: string;
  createdBy: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string;
  createdAt: Date;
}
