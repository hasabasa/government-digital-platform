import { Request, Response } from 'express';
import { WebRTCService } from '../services/webrtc.service';
import { CreateCallRequestSchema } from '@cube-demper/types';
import { z } from 'zod';

export class CallController {
  private webrtcService: WebRTCService;

  constructor() {
    this.webrtcService = new WebRTCService();
  }

  // Get user's calls
  getCalls = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const calls = await this.webrtcService.getCalls(userId);
      
      res.json({
        success: true,
        data: calls,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Create new call (only for managers)
  createCall = async (req: Request, res: Response) => {
    try {
      const validatedData = CreateCallRequestSchema.parse(req.body);
      const initiatorId = req.user?.id;

      if (!initiatorId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const call = await this.webrtcService.createCall({
        ...validatedData,
        initiatorId,
      });

      res.status(201).json({
        success: true,
        data: call,
        message: 'Call created successfully. Participants will be notified.',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      } else {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  };

  // Join call
  joinCall = async (req: Request, res: Response) => {
    try {
      const { callId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const participant = await this.webrtcService.joinCall(callId, userId);
      
      res.json({
        success: true,
        data: participant,
        message: 'Successfully joined the call',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Leave call
  leaveCall = async (req: Request, res: Response) => {
    try {
      const { callId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      await this.webrtcService.leaveCall(callId, userId);
      
      res.json({
        success: true,
        message: 'Successfully left the call',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // End call (only for moderators)
  endCall = async (req: Request, res: Response) => {
    try {
      const { callId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      await this.webrtcService.endCall(callId, userId);
      
      res.json({
        success: true,
        message: 'Call ended successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Health check
  health = async (req: Request, res: Response) => {
    res.json({
      success: true,
      service: 'call-service',
      timestamp: new Date().toISOString(),
    });
  };
}
