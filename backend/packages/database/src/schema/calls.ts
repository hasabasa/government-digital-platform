import { pgTable, uuid, varchar, timestamp, boolean, integer, jsonb, pgEnum, text } from 'drizzle-orm/pg-core';
import { users } from './users';
import { companyStructure } from './company';

export const callTypeEnum = pgEnum('call_type', ['audio', 'video', 'screen_share', 'conference']);
export const callStatusEnum = pgEnum('call_status', ['pending', 'active', 'ended', 'missed', 'declined', 'failed']);
export const participantStatusEnum = pgEnum('participant_status', ['invited', 'joined', 'left', 'declined', 'failed']);
export const recordingStatusEnum = pgEnum('recording_status', ['not_started', 'recording', 'paused', 'stopped', 'processing', 'ready', 'failed']);

export const calls = pgTable('calls', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: callTypeEnum('type').notNull(),
  status: callStatusEnum('status').default('pending'),
  
  // Call participants
  initiatorId: uuid('initiator_id').notNull().references(() => users.id),
  organizationId: uuid('organization_id').references(() => companyStructure.id),
  chatId: uuid('chat_id'),
  groupId: uuid('group_id'),
  
  // WebRTC/Mediasoup configuration
  mediasoupRoomId: varchar('mediasoup_room_id', { length: 100 }),
  mediasoupRouterRtpCapabilities: jsonb('mediasoup_router_rtp_capabilities'),
  maxParticipants: integer('max_participants').default(50),
  
  // Call metadata
  title: varchar('title', { length: 200 }),
  description: text('description'),
  scheduledAt: timestamp('scheduled_at'),
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  duration: integer('duration'), // seconds
  
  // Recording
  isRecorded: boolean('is_recorded').default(false),
  recordingStatus: recordingStatusEnum('recording_status').default('not_started'),
  recordingUrl: varchar('recording_url'),
  recordingSize: integer('recording_size'), // bytes
  
  // Call settings
  requiresApproval: boolean('requires_approval').default(false),
  isPrivate: boolean('is_private').default(false),
  allowScreenShare: boolean('allow_screen_share').default(true),
  allowChat: boolean('allow_chat').default(true),
  
  // Google Meet integration
  googleMeetLink: varchar('google_meet_link', { length: 500 }),

  // Technical details
  webrtcSettings: jsonb('webrtc_settings'),
  qualitySettings: jsonb('quality_settings'),
  networkStats: jsonb('network_stats'),
  
  // Additional metadata
  metadata: jsonb('metadata'),
  tags: jsonb('tags').default([]),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Participants table for detailed tracking
export const callParticipants = pgTable('call_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  callId: uuid('call_id').notNull().references(() => calls.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  
  // Participant status and timing
  status: participantStatusEnum('status').default('invited'),
  joinedAt: timestamp('joined_at'),
  leftAt: timestamp('left_at'),
  duration: integer('duration'), // seconds in call
  
  // WebRTC connection details
  mediasoupTransportId: varchar('mediasoup_transport_id'),
  mediasoupProducerIds: jsonb('mediasoup_producer_ids').default([]),
  mediasoupConsumerIds: jsonb('mediasoup_consumer_ids').default([]),
  
  // Connection quality
  connectionQuality: varchar('connection_quality', { length: 20 }), // excellent, good, poor, very_poor
  networkStats: jsonb('network_stats'),
  
  // Participant capabilities and settings
  hasVideo: boolean('has_video').default(false),
  hasAudio: boolean('has_audio').default(true),
  hasScreenShare: boolean('has_screen_share').default(false),
  isMuted: boolean('is_muted').default(false),
  isVideoOff: boolean('is_video_off').default(false),
  
  // Permissions
  canSpeak: boolean('can_speak').default(true),
  canShare: boolean('can_share').default(true),
  isModerator: boolean('is_moderator').default(false),
  
  // Device information
  deviceInfo: jsonb('device_info'),
  browserInfo: jsonb('browser_info'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// WebRTC rooms for mediasoup integration
export const webrtcRooms = pgTable('webrtc_rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: varchar('room_id', { length: 100 }).notNull().unique(),
  mediasoupWorkerId: varchar('mediasoup_worker_id'),
  mediasoupRouterId: varchar('mediasoup_router_id'),
  
  // Room configuration
  maxParticipants: integer('max_participants').default(50),
  currentParticipants: integer('current_participants').default(0),
  
  // Media capabilities
  routerRtpCapabilities: jsonb('router_rtp_capabilities'),
  supportedCodecs: jsonb('supported_codecs'),
  
  // Room status
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  closedAt: timestamp('closed_at'),
  
  // Associated call
  callId: uuid('call_id').references(() => calls.id),
});

// Call recordings metadata
export const callRecordings = pgTable('call_recordings', {
  id: uuid('id').primaryKey().defaultRandom(),
  callId: uuid('call_id').notNull().references(() => calls.id),
  
  // Recording details
  filename: varchar('filename'),
  filePath: varchar('file_path'),
  fileSize: integer('file_size'), // bytes
  duration: integer('duration'), // seconds
  format: varchar('format', { length: 10 }).default('mp4'),
  
  // Recording status and processing
  status: recordingStatusEnum('status').default('not_started'),
  startedAt: timestamp('started_at'),
  stoppedAt: timestamp('stopped_at'),
  processedAt: timestamp('processed_at'),
  
  // Recording quality and settings
  videoQuality: varchar('video_quality', { length: 20 }), // 480p, 720p, 1080p
  audioQuality: varchar('audio_quality', { length: 20 }), // low, medium, high
  
  // Access control
  isPublic: boolean('is_public').default(false),
  allowedUsers: jsonb('allowed_users').default([]),
  downloadCount: integer('download_count').default(0),
  
  // Metadata
  metadata: jsonb('metadata'),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Export types
export type Call = typeof calls.$inferSelect;
export type InsertCall = typeof calls.$inferInsert;

export type CallParticipant = typeof callParticipants.$inferSelect;
export type InsertCallParticipant = typeof callParticipants.$inferInsert;

export type WebRTCRoom = typeof webrtcRooms.$inferSelect;
export type InsertWebRTCRoom = typeof webrtcRooms.$inferInsert;

export type CallRecording = typeof callRecordings.$inferSelect;
export type InsertCallRecording = typeof callRecordings.$inferInsert;
