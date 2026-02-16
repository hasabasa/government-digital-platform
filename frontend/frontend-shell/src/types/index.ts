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

// === CRM Types ===

export type FunnelStage = 'new' | 'contact' | 'negotiation' | 'proposal' | 'deal';
export type TrafficChannel = 'website' | 'instagram' | 'telegram' | 'whatsapp' | 'facebook' | 'referral' | 'cold_call' | 'exhibition' | 'advertisement' | 'partner' | 'other';
export type LeadResult = 'pending' | 'won' | 'lost' | 'deferred';
export type SalesPlanPeriod = 'monthly' | 'quarterly';

export interface CrmLead {
  id: string;
  firstName: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  trafficChannel: TrafficChannel;
  stage: FunnelStage;
  result: LeadResult;
  assignedTo?: string;
  dealAmount?: string;
  dealCurrency?: string;
  notes?: string;
  tags?: string[];
  lostReason?: string;
  nextContactDate?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CrmLeadHistory {
  id: string;
  leadId: string;
  changedBy: string;
  fromStage?: FunnelStage;
  toStage: FunnelStage;
  comment?: string;
  createdAt: string;
}

export interface CrmSalesPlan {
  id: string;
  managerId: string;
  period: SalesPlanPeriod;
  periodStart: string;
  periodEnd: string;
  targetAmount: string;
  targetCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrmAccessEntry {
  id: string;
  userId: string;
  grantedBy: string;
  isActive: boolean;
  grantedAt: string;
  revokedAt?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface CrmManagerStats {
  managerId: string;
  managerName: string;
  totalLeads: number;
  wonCount: number;
  lostCount: number;
  pendingCount: number;
  wonAmount: number;
  targetAmount: number;
  targetCount: number;
  amountProgress: number;
  countProgress: number;
}

export interface CrmDashboardData {
  funnel: Array<{ stage: FunnelStage; count: number; totalAmount: number }>;
  channels: Array<{ channel: TrafficChannel; count: number }>;
  results: Array<{ result: LeadResult; count: number; totalAmount: number }>;
  kpi: {
    totalLeads: number;
    wonDeals: number;
    wonAmount: number;
    lostDeals: number;
    conversionRate: number;
  };
}
