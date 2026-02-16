import { eq, and, or, sql, desc } from 'drizzle-orm';
import { db } from '@cube-demper/database';
import {
  calls,
  callParticipants,
  webrtcRooms,
  callRecordings,
  users,
  type Call,
  type CallParticipant,
  type WebRTCRoom,
  type InsertCall,
  type InsertCallParticipant,
  type InsertWebRTCRoom
} from '@cube-demper/database/schema';
import {
  CreateCallRequest,
  CallWithDetails,
  CallType,
  CallStatus,
  ParticipantStatus
} from '@cube-demper/types';
import { v4 as uuidv4 } from 'uuid';

type UserRole = 'admin' | 'manager' | 'employee';

export interface CallPermissions {
  canInitiateCalls: boolean;
  canJoinCalls: boolean;
  canModerate: boolean;
  canRecord: boolean;
}

export class WebRTCService {

  // Call Management
  async createCall(data: CreateCallRequest & { initiatorId: string }): Promise<Call> {
    // Check permissions
    const permissions = await this.getUserCallPermissions(data.initiatorId);
    if (!permissions.canInitiateCalls) {
      throw new Error('Permission denied: Cannot initiate calls');
    }

    // Create WebRTC room
    const roomId = `room_${uuidv4()}`;

    const callData: InsertCall = {
      ...data,
      mediasoupRoomId: roomId,
      status: 'pending',
    };

    const [created] = await db.insert(calls).values(callData).returning();

    // Create WebRTC room
    await this.createWebRTCRoom(roomId, created.id);

    // Add participants
    for (const participantId of data.participantIds) {
      await this.addParticipant(created.id, participantId);
    }

    return created;
  }

  async joinCall(callId: string, userId: string): Promise<CallParticipant> {
    // Check if user can join
    const canJoin = await this.canUserJoinCall(callId, userId);
    if (!canJoin) {
      throw new Error('Permission denied: Cannot join this call');
    }

    // Update participant status
    const [participant] = await db
      .update(callParticipants)
      .set({
        status: 'joined',
        joinedAt: new Date(),
      })
      .where(and(
        eq(callParticipants.callId, callId),
        eq(callParticipants.userId, userId)
      ))
      .returning();

    // Update call status to active if first participant
    const activeParticipants = await db
      .select({ count: sql`count(*)` })
      .from(callParticipants)
      .where(and(
        eq(callParticipants.callId, callId),
        eq(callParticipants.status, 'joined')
      ));

    if (parseInt(activeParticipants[0].count.toString()) === 1) {
      await db
        .update(calls)
        .set({
          status: 'active',
          startedAt: new Date(),
        })
        .where(eq(calls.id, callId));
    }

    return participant;
  }

  async leaveCall(callId: string, userId: string): Promise<void> {
    await db
      .update(callParticipants)
      .set({
        status: 'left',
        leftAt: new Date(),
      })
      .where(and(
        eq(callParticipants.callId, callId),
        eq(callParticipants.userId, userId)
      ));

    // Check if call should end
    await this.checkCallEnd(callId);
  }

  async endCall(callId: string, userId: string): Promise<void> {
    // Check if user can end call
    const canModerate = await this.canUserModerateCall(callId, userId);
    if (!canModerate) {
      throw new Error('Permission denied: Cannot end this call');
    }

    const endTime = new Date();

    await db
      .update(calls)
      .set({
        status: 'ended',
        endedAt: endTime,
      })
      .where(eq(calls.id, callId));

    // Update all active participants
    await db
      .update(callParticipants)
      .set({
        status: 'left',
        leftAt: endTime,
      })
      .where(and(
        eq(callParticipants.callId, callId),
        eq(callParticipants.status, 'joined')
      ));

    // Close WebRTC room
    await this.closeWebRTCRoom(callId);
  }

  // Permission Checks — simple role-based using users table directly
  private async getUserCallPermissions(userId: string): Promise<CallPermissions> {
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return {
        canInitiateCalls: false,
        canJoinCalls: false,
        canModerate: false,
        canRecord: false,
      };
    }

    const role = user.role as UserRole;

    // admin and manager can initiate, moderate, and record calls
    // all authenticated users can join calls they are invited to
    const isPrivileged = role === 'admin' || role === 'manager';

    return {
      canInitiateCalls: isPrivileged,
      canJoinCalls: true,
      canModerate: isPrivileged,
      canRecord: isPrivileged,
    };
  }

  private async canUserJoinCall(callId: string, userId: string): Promise<boolean> {
    // Any user who has been added as a participant can join
    const [participant] = await db
      .select()
      .from(callParticipants)
      .where(and(
        eq(callParticipants.callId, callId),
        eq(callParticipants.userId, userId)
      ))
      .limit(1);

    return !!participant;
  }

  private async canUserModerateCall(callId: string, userId: string): Promise<boolean> {
    const [call] = await db
      .select()
      .from(calls)
      .where(eq(calls.id, callId))
      .limit(1);

    if (!call) return false;

    // Call initiator can always moderate
    if (call.initiatorId === userId) return true;

    // Otherwise check role-based permissions
    const permissions = await this.getUserCallPermissions(userId);
    return permissions.canModerate;
  }

  // Helper methods
  private async createWebRTCRoom(roomId: string, callId: string): Promise<WebRTCRoom> {
    const roomData: InsertWebRTCRoom = {
      roomId,
      callId,
      isActive: true,
    };

    const [room] = await db.insert(webrtcRooms).values(roomData).returning();
    return room;
  }

  private async addParticipant(callId: string, userId: string): Promise<CallParticipant> {
    const participantData: InsertCallParticipant = {
      callId,
      userId,
      status: 'invited',
    };

    const [participant] = await db.insert(callParticipants).values(participantData).returning();
    return participant;
  }

  private async checkCallEnd(callId: string): Promise<void> {
    const activeParticipants = await db
      .select({ count: sql`count(*)` })
      .from(callParticipants)
      .where(and(
        eq(callParticipants.callId, callId),
        eq(callParticipants.status, 'joined')
      ));

    // If no active participants, end call
    if (parseInt(activeParticipants[0].count.toString()) === 0) {
      await db
        .update(calls)
        .set({
          status: 'ended',
          endedAt: new Date(),
        })
        .where(eq(calls.id, callId));

      await this.closeWebRTCRoom(callId);
    }
  }

  private async closeWebRTCRoom(callId: string): Promise<void> {
    await db
      .update(webrtcRooms)
      .set({
        isActive: false,
        closedAt: new Date(),
      })
      .where(eq(webrtcRooms.callId, callId));
  }

  // Get calls for a user
  async getCalls(userId: string): Promise<CallWithDetails[]> {
    const result = await db
      .select({
        call: calls,
        initiator: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(calls)
      .leftJoin(users, eq(calls.initiatorId, users.id))
      .leftJoin(callParticipants, eq(callParticipants.callId, calls.id))
      .where(or(
        eq(calls.initiatorId, userId),
        eq(callParticipants.userId, userId)
      ))
      .orderBy(desc(calls.createdAt))
      .limit(20);

    return result.map(row => ({
      ...row.call,
      initiator: row.initiator as any,
      participants: [],
      canJoin: true,
      canModerate: row.call.initiatorId === userId,
      canRecord: row.call.initiatorId === userId,
      isOngoing: row.call.status === 'active',
    }));
  }
}
