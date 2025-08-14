import { z } from 'zod';
import { BaseEntitySchema } from './common';

export const CallTypeSchema = z.enum(['audio', 'video', 'screen_share']);

export type CallType = z.infer<typeof CallTypeSchema>;

export const CallStatusSchema = z.enum(['pending', 'active', 'ended', 'missed', 'declined']);

export type CallStatus = z.infer<typeof CallStatusSchema>;

export const CallSchema = BaseEntitySchema.extend({
  type: CallTypeSchema,
  status: CallStatusSchema.default('pending'),
  initiatorId: z.string().uuid(),
  chatId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  participants: z.array(z.object({
    userId: z.string().uuid(),
    joinedAt: z.date().optional(),
    leftAt: z.date().optional(),
    isMuted: z.boolean().default(false),
    isVideoEnabled: z.boolean().default(true),
    isScreenSharing: z.boolean().default(false),
  })).default([]),
  startedAt: z.date().optional(),
  endedAt: z.date().optional(),
  duration: z.number().optional(), // seconds
  recordingUrl: z.string().url().optional(),
  isRecorded: z.boolean().default(false),
  webrtcSettings: z.object({
    iceServers: z.array(z.object({
      urls: z.string(),
      username: z.string().optional(),
      credential: z.string().optional(),
    })).default([]),
    bandwidth: z.object({
      audio: z.number().default(64), // kbps
      video: z.number().default(1024), // kbps
    }),
    quality: z.enum(['low', 'medium', 'high']).default('medium'),
  }),
  metadata: z.record(z.any()).optional(),
});

export type Call = z.infer<typeof CallSchema>;

export const CallParticipantSchema = z.object({
  userId: z.string().uuid(),
  connectionId: z.string(),
  peerId: z.string(),
  mediaSettings: z.object({
    audio: z.object({
      enabled: z.boolean().default(true),
      muted: z.boolean().default(false),
      deviceId: z.string().optional(),
    }),
    video: z.object({
      enabled: z.boolean().default(true),
      hidden: z.boolean().default(false),
      deviceId: z.string().optional(),
      resolution: z.enum(['240p', '360p', '480p', '720p', '1080p']).default('720p'),
    }),
    screen: z.object({
      sharing: z.boolean().default(false),
      hasAudio: z.boolean().default(false),
    }),
  }),
  networkInfo: z.object({
    ip: z.string().optional(),
    region: z.string().optional(),
    latency: z.number().optional(),
    bandwidth: z.number().optional(),
  }).optional(),
});

export type CallParticipant = z.infer<typeof CallParticipantSchema>;

export const InitiateCallRequestSchema = z.object({
  type: CallTypeSchema,
  chatId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  participants: z.array(z.string().uuid()).min(1),
  isRecorded: z.boolean().default(false),
});

export type InitiateCallRequest = z.infer<typeof InitiateCallRequestSchema>;

export const JoinCallRequestSchema = z.object({
  callId: z.string().uuid(),
  mediaSettings: z.object({
    audio: z.boolean().default(true),
    video: z.boolean().default(true),
  }).optional(),
});

export type JoinCallRequest = z.infer<typeof JoinCallRequestSchema>;

export const CallSignalingEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('offer'),
    data: z.object({
      callId: z.string().uuid(),
      fromUserId: z.string().uuid(),
      toUserId: z.string().uuid(),
      sdp: z.string(),
    }),
  }),
  z.object({
    type: z.literal('answer'),
    data: z.object({
      callId: z.string().uuid(),
      fromUserId: z.string().uuid(),
      toUserId: z.string().uuid(),
      sdp: z.string(),
    }),
  }),
  z.object({
    type: z.literal('ice-candidate'),
    data: z.object({
      callId: z.string().uuid(),
      fromUserId: z.string().uuid(),
      toUserId: z.string().uuid(),
      candidate: z.string(),
      sdpMid: z.string().optional(),
      sdpMLineIndex: z.number().optional(),
    }),
  }),
  z.object({
    type: z.literal('participant-joined'),
    data: z.object({
      callId: z.string().uuid(),
      participant: CallParticipantSchema,
    }),
  }),
  z.object({
    type: z.literal('participant-left'),
    data: z.object({
      callId: z.string().uuid(),
      userId: z.string().uuid(),
    }),
  }),
  z.object({
    type: z.literal('media-changed'),
    data: z.object({
      callId: z.string().uuid(),
      userId: z.string().uuid(),
      mediaSettings: z.object({
        audio: z.boolean().optional(),
        video: z.boolean().optional(),
        screenShare: z.boolean().optional(),
      }),
    }),
  }),
]);

export type CallSignalingEvent = z.infer<typeof CallSignalingEventSchema>;
