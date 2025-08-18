import { WebSocketEvent, ChatEvent, TaskEvent, ReportEvent } from '../types';

type WebSocketMessageHandler = (event: WebSocketEvent) => void;
type ConnectionStatusHandler = (status: 'connected' | 'disconnected' | 'connecting' | 'error') => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: WebSocketMessageHandler[] = [];
  private connectionStatusHandlers: ConnectionStatusHandler[] = [];
  private isConnecting = false;
  private shouldReconnect = true;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Handle page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.shouldReconnect = false;
      } else {
        this.shouldReconnect = true;
        if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
          this.connect();
        }
      }
    });

    // Handle beforeunload
    window.addEventListener('beforeunload', () => {
      this.shouldReconnect = false;
      this.disconnect();
    });
  }

  connect(token?: string): Promise<void> {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    this.isConnecting = true;
    this.notifyConnectionStatus('connecting');

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8080/ws';
        const url = token ? `${wsUrl}?token=${token}` : wsUrl;
        
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.notifyConnectionStatus('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data: WebSocketEvent = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.notifyConnectionStatus('disconnected');
          
          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          this.notifyConnectionStatus('error');
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        this.notifyConnectionStatus('error');
        reject(error);
      }
    });
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Scheduling WebSocket reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (this.shouldReconnect && this.ws?.readyState === WebSocket.CLOSED) {
        this.connect();
      }
    }, delay);
  }

  disconnect() {
    this.shouldReconnect = false;
    this.isConnecting = false;
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.notifyConnectionStatus('disconnected');
  }

  private handleMessage(event: WebSocketEvent) {
    // Notify all message handlers
    this.messageHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in WebSocket message handler:', error);
      }
    });
  }

  // Send message to WebSocket
  send(event: WebSocketEvent): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(event));
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        return false;
      }
    }
    return false;
  }

  // Subscribe to WebSocket messages
  onMessage(handler: WebSocketMessageHandler): () => void {
    this.messageHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }

  // Subscribe to connection status changes
  onConnectionStatus(handler: ConnectionStatusHandler): () => void {
    this.connectionStatusHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = this.connectionStatusHandlers.indexOf(handler);
      if (index > -1) {
        this.connectionStatusHandlers.splice(index, 1);
      }
    };
  }

  private notifyConnectionStatus(status: 'connected' | 'disconnected' | 'connecting' | 'error') {
    this.connectionStatusHandlers.forEach(handler => {
      try {
        handler(status);
      } catch (error) {
        console.error('Error in connection status handler:', error);
      }
    });
  }

  // Utility methods for specific event types
  sendTypingStart(chatId: string): boolean {
    return this.send({
      type: 'typing:start',
      payload: { chatId },
      timestamp: new Date()
    });
  }

  sendTypingStop(chatId: string): boolean {
    return this.send({
      type: 'typing:stop',
      payload: { chatId },
      timestamp: new Date()
    });
  }

  sendPresenceUpdate(isOnline: boolean): boolean {
    return this.send({
      type: 'presence:update',
      payload: { isOnline },
      timestamp: new Date()
    });
  }

  // Check connection status
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
