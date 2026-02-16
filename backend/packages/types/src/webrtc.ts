import { z } from 'zod';
import { BaseEntitySchema } from './common';

// Enums для WebRTC и звонков
export const CallTypeSchema = z.enum([
  'audio',
  'video', 
  'screen_share',
  'conference'
]);

export type CallType = z.infer<typeof CallTypeSchema>;

export const CallStatusSchema = z.enum([
  'pending',
  'active', 
  'ended',
  'missed',
  'declined',
  'failed'
]);

export type CallStatus = z.infer<typeof CallStatusSchema>;

export const ParticipantStatusSchema = z.enum([
  'invited',
  'joined',
  'left',
  'declined', 
  'failed'
]);

export type ParticipantStatus = z.infer<typeof ParticipantStatusSchema>;

export const RecordingStatusSchema = z.enum([
  'not_started',
  'recording',
  'paused',
  'stopped',
  'processing',
  'ready',
  'failed'
]);

export type RecordingStatus = z.infer<typeof RecordingStatusSchema>;

export const ConnectionQualitySchema = z.enum([
  'excellent',
  'good',
  'poor',
  'very_poor'
]);

export type ConnectionQuality = z.infer<typeof ConnectionQualitySchema>;

export const SecurityLevelSchema = z.enum([
  'normal',
  'high',
  'restricted'
]);

export type SecurityLevel = z.infer<typeof SecurityLevelSchema>;

// WebRTC Configuration schemas
export const MediaDeviceSchema = z.object({
  deviceId: z.string(),
  label: z.string(),
  kind: z.enum(['audioinput', 'videoinput', 'audiooutput']),
  groupId: z.string().optional(),
});

export type MediaDevice = z.infer<typeof MediaDeviceSchema>;

export const WebRTCSettingsSchema = z.object({
  audio: z.object({
    enabled: z.boolean().default(true),
    deviceId: z.string().optional(),
    echoCancellation: z.boolean().default(true),
    noiseSuppression: z.boolean().default(true),
    autoGainControl: z.boolean().default(true),
    sampleRate: z.number().optional(),
    channelCount: z.number().default(1),
  }),
  video: z.object({
    enabled: z.boolean().default(true),
    deviceId: z.string().optional(),
    width: z.number().default(1280),
    height: z.number().default(720),
    frameRate: z.number().default(30),
    facingMode: z.enum(['user', 'environment']).default('user'),
  }),
  screen: z.object({
    enabled: z.boolean().default(false),
    cursor: z.enum(['always', 'motion', 'never']).default('motion'),
    audio: z.boolean().default(false),
  }),
});

export type WebRTCSettings = z.infer<typeof WebRTCSettingsSchema>;

export const QualitySettingsSchema = z.object({
  video: z.object({
    maxBitrate: z.number().default(2000000), // 2 Mbps
    maxWidth: z.number().default(1920),
    maxHeight: z.number().default(1080),
    maxFramerate: z.number().default(30),
  }),
  audio: z.object({
    maxBitrate: z.number().default(128000), // 128 kbps
    sampleRate: z.number().default(48000),
    channels: z.number().default(2),
  }),
  simulcast: z.boolean().default(true),
  adaptiveBitrate: z.boolean().default(true),
});

export type QualitySettings = z.infer<typeof QualitySettingsSchema>;

export const NetworkStatsSchema = z.object({
  rtt: z.number().optional(), // Round trip time in ms
  jitter: z.number().optional(),
  packetsLost: z.number().default(0),
  packetsSent: z.number().default(0),
  packetsReceived: z.number().default(0),
  bytesReceived: z.number().default(0),
  bytesSent: z.number().default(0),
  bitrate: z.object({
    audio: z.number().optional(),
    video: z.number().optional(),
  }).optional(),
  connectionState: z.enum(['new', 'connecting', 'connected', 'disconnected', 'failed']).optional(),
  lastUpdated: z.date(),
});

export type NetworkStats = z.infer<typeof NetworkStatsSchema>;

export const DeviceInfoSchema = z.object({
  platform: z.string(),
  browser: z.object({
    name: z.string(),
    version: z.string(),
  }),
  os: z.object({
    name: z.string(),
    version: z.string(),
  }),
  device: z.object({
    type: z.enum(['desktop', 'tablet', 'mobile']),
    model: z.string().optional(),
  }),
  capabilities: z.object({
    supportsVideo: z.boolean(),
    supportsAudio: z.boolean(),
    supportsScreenShare: z.boolean(),
    supportsRecording: z.boolean(),
  }),
});

export type DeviceInfo = z.infer<typeof DeviceInfoSchema>;

// Main schemas
export const CallSchema = BaseEntitySchema.extend({
  type: CallTypeSchema,
  status: CallStatusSchema.default('pending'),
  
  // Participants
  initiatorId: z.string().uuid(),
  organizationId: z.string().uuid().optional(),
  chatId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  
  // Mediasoup configuration
  mediasoupRoomId: z.string().optional(),
  mediasoupRouterRtpCapabilities: z.record(z.any()).optional(),
  maxParticipants: z.number().int().default(50),
  
  // Call metadata
  title: z.string().max(200).optional(),
  description: z.string().optional(),
  scheduledAt: z.date().optional(),
  startedAt: z.date().optional(),
  endedAt: z.date().optional(),
  duration: z.number().int().optional(),
  
  // Recording
  isRecorded: z.boolean().default(false),
  recordingStatus: RecordingStatusSchema.default('not_started'),
  recordingUrl: z.string().optional(),
  recordingSize: z.number().int().optional(),
  
  // Settings
  requiresApproval: z.boolean().default(false),
  isPrivate: z.boolean().default(false),
  allowScreenShare: z.boolean().default(true),
  allowChat: z.boolean().default(true),
  
  // Security
  securityLevel: SecurityLevelSchema.default('normal'),
  allowedRoles: z.array(z.string()).optional(),
  restrictedUsers: z.array(z.string().uuid()).optional(),
  
  // Technical
  webrtcSettings: WebRTCSettingsSchema.optional(),
  qualitySettings: QualitySettingsSchema.optional(),
  networkStats: NetworkStatsSchema.optional(),
  
  // Metadata
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

export type Call = z.infer<typeof CallSchema>;

export const CallParticipantSchema = BaseEntitySchema.extend({
  callId: z.string().uuid(),
  userId: z.string().uuid(),
  
  // Status and timing
  status: ParticipantStatusSchema.default('invited'),
  joinedAt: z.date().optional(),
  leftAt: z.date().optional(),
  duration: z.number().int().optional(),
  
  // WebRTC details
  mediasoupTransportId: z.string().optional(),
  mediasoupProducerIds: z.array(z.string()).optional(),
  mediasoupConsumerIds: z.array(z.string()).optional(),
  
  // Connection quality
  connectionQuality: ConnectionQualitySchema.optional(),
  networkStats: NetworkStatsSchema.optional(),
  
  // Media state
  hasVideo: z.boolean().default(false),
  hasAudio: z.boolean().default(true),
  hasScreenShare: z.boolean().default(false),
  isMuted: z.boolean().default(false),
  isVideoOff: z.boolean().default(false),
  
  // Permissions
  canSpeak: z.boolean().default(true),
  canShare: z.boolean().default(true),
  isModerator: z.boolean().default(false),
  
  // Device info
  deviceInfo: DeviceInfoSchema.optional(),
  browserInfo: z.record(z.any()).optional(),
});

export type CallParticipant = z.infer<typeof CallParticipantSchema>;

export const WebRTCRoomSchema = BaseEntitySchema.extend({
  roomId: z.string().max(100),
  mediasoupWorkerId: z.string().optional(),
  mediasoupRouterId: z.string().optional(),
  
  maxParticipants: z.number().int().default(50),
  currentParticipants: z.number().int().default(0),
  
  routerRtpCapabilities: z.record(z.any()).optional(),
  supportedCodecs: z.array(z.string()).optional(),
  
  isActive: z.boolean().default(true),
  closedAt: z.date().optional(),
  callId: z.string().uuid().optional(),
});

export type WebRTCRoom = z.infer<typeof WebRTCRoomSchema>;

export const CallRecordingSchema = BaseEntitySchema.extend({
  callId: z.string().uuid(),
  
  filename: z.string().optional(),
  filePath: z.string().optional(),
  fileSize: z.number().int().optional(),
  duration: z.number().int().optional(),
  format: z.string().max(10).default('mp4'),
  
  status: RecordingStatusSchema.default('not_started'),
  startedAt: z.date().optional(),
  stoppedAt: z.date().optional(),
  processedAt: z.date().optional(),
  
  videoQuality: z.string().max(20).optional(),
  audioQuality: z.string().max(20).optional(),
  
  isPublic: z.boolean().default(false),
  allowedUsers: z.array(z.string().uuid()).optional(),
  downloadCount: z.number().int().default(0),
  
  metadata: z.record(z.any()).optional(),
});

export type CallRecording = z.infer<typeof CallRecordingSchema>;

// Request schemas for API
export const CreateCallRequestSchema = z.object({
  type: CallTypeSchema,
  title: z.string().max(200).optional(),
  description: z.string().optional(),
  participantIds: z.array(z.string().uuid()),
  organizationId: z.string().uuid().optional(),
  chatId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  scheduledAt: z.date().optional(),
  maxParticipants: z.number().int().min(2).max(200).default(50),
  isRecorded: z.boolean().default(false),
  requiresApproval: z.boolean().default(false),
  isPrivate: z.boolean().default(false),
  allowScreenShare: z.boolean().default(true),
  allowChat: z.boolean().default(true),
  securityLevel: SecurityLevelSchema.default('normal'),
  webrtcSettings: WebRTCSettingsSchema.optional(),
  qualitySettings: QualitySettingsSchema.optional(),
});

export type CreateCallRequest = z.infer<typeof CreateCallRequestSchema>;

export const UpdateCallRequestSchema = CreateCallRequestSchema.partial().extend({
  status: CallStatusSchema.optional(),
});

export type UpdateCallRequest = z.infer<typeof UpdateCallRequestSchema>;

export const JoinCallRequestSchema = z.object({
  webrtcSettings: WebRTCSettingsSchema.optional(),
  deviceInfo: DeviceInfoSchema.optional(),
});

export type JoinCallRequest = z.infer<typeof JoinCallRequestSchema>;

export const UpdateParticipantRequestSchema = z.object({
  isMuted: z.boolean().optional(),
  isVideoOff: z.boolean().optional(),
  hasScreenShare: z.boolean().optional(),
  connectionQuality: ConnectionQualitySchema.optional(),
  networkStats: NetworkStatsSchema.optional(),
});

export type UpdateParticipantRequest = z.infer<typeof UpdateParticipantRequestSchema>;

export const CallFiltersSchema = z.object({
  type: z.array(CallTypeSchema).optional(),
  status: z.array(CallStatusSchema).optional(),
  initiatorId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
  participantId: z.string().uuid().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  isRecorded: z.boolean().optional(),
  securityLevel: z.array(SecurityLevelSchema).optional(),
  search: z.string().optional(),
});

export type CallFilters = z.infer<typeof CallFiltersSchema>;

// Extended response schemas
export const CallWithDetailsSchema = CallSchema.extend({
  initiator: z.object({
    id: z.string().uuid(),
    firstName: z.string(),
    lastName: z.string(),
    position: z.string().optional(),
  }),
  organization: z.object({
    id: z.string().uuid(),
    name: z.string(),
    type: z.string(),
  }).optional(),
  participants: z.array(CallParticipantSchema.extend({
    user: z.object({
      id: z.string().uuid(),
      firstName: z.string(),
      lastName: z.string(),
      position: z.string().optional(),
    }),
  })),
  recordings: z.array(CallRecordingSchema).optional(),
  room: WebRTCRoomSchema.optional(),
  canJoin: z.boolean(),
  canModerate: z.boolean(),
  canRecord: z.boolean(),
  isOngoing: z.boolean(),
});

export type CallWithDetails = z.infer<typeof CallWithDetailsSchema>;

export const CallStatsSchema = z.object({
  totalCalls: z.number().int(),
  activeCalls: z.number().int(),
  totalDuration: z.number().int(), // in seconds
  averageDuration: z.number(),
  totalParticipants: z.number().int(),
  averageParticipants: z.number(),
  byType: z.record(CallTypeSchema, z.number().int()),
  byStatus: z.record(CallStatusSchema, z.number().int()),
  recordedCalls: z.number().int(),
  qualityDistribution: z.record(ConnectionQualitySchema, z.number().int()),
  dailyTrends: z.array(z.object({
    date: z.string(),
    calls: z.number().int(),
    duration: z.number().int(),
    participants: z.number().int(),
  })),
});

export type CallStats = z.infer<typeof CallStatsSchema>;

// Mediasoup specific schemas
export const MediasoupTransportOptionsSchema = z.object({
  id: z.string(),
  iceParameters: z.object({
    usernameFragment: z.string(),
    password: z.string(),
    iceLite: z.boolean().optional(),
  }),
  iceCandidates: z.array(z.object({
    foundation: z.string(),
    priority: z.number(),
    ip: z.string(),
    port: z.number(),
    type: z.string(),
    protocol: z.string(),
  })),
  dtlsParameters: z.object({
    role: z.enum(['auto', 'client', 'server']),
    fingerprints: z.array(z.object({
      algorithm: z.string(),
      value: z.string(),
    })),
  }),
  sctpParameters: z.object({
    port: z.number(),
    OS: z.number(),
    MIS: z.number(),
    maxMessageSize: z.number(),
  }).optional(),
});

export type MediasoupTransportOptions = z.infer<typeof MediasoupTransportOptionsSchema>;

export const MediasoupProducerOptionsSchema = z.object({
  kind: z.enum(['audio', 'video']),
  rtpParameters: z.record(z.any()),
  appData: z.record(z.any()).optional(),
});

export type MediasoupProducerOptions = z.infer<typeof MediasoupProducerOptionsSchema>;

export const MediasoupConsumerOptionsSchema = z.object({
  producerId: z.string(),
  rtpCapabilities: z.record(z.any()),
  appData: z.record(z.any()).optional(),
});

export type MediasoupConsumerOptions = z.infer<typeof MediasoupConsumerOptionsSchema>;

// WebSocket event schemas for WebRTC calls
export const WebRTCSocketEventSchema = z.object({
  type: z.enum([
    'call-created',
    'call-updated',
    'call-ended',
    'participant-joined',
    'participant-left',
    'participant-updated',
    'media-state-changed',
    'recording-started',
    'recording-stopped',
    'connection-quality-changed',
    'error'
  ]),
  callId: z.string().uuid(),
  data: z.record(z.any()),
  timestamp: z.date(),
});

export type WebRTCSocketEvent = z.infer<typeof WebRTCSocketEventSchema>;
