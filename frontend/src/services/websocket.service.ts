import { toast } from 'sonner';
import { WebSocketMessage, WebSocketEvent } from '@/types/api';
import { io, Socket } from 'socket.io-client';

export class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000;
  private baseURL: string;
  private eventHandlers: Map<WebSocketEvent, ((data: any) => void)[]> = new Map();

  constructor() {
    this.baseURL = import.meta.env.VITE_WS_URL || 'http://localhost:8000';
    this.connect();
  }

  connect() {
    try {
      this.socket = io(this.baseURL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectTimeout,
      });

      this.socket.on('connect', () => {
        console.log('Socket.IO connected');
        this.reconnectAttempts = 0;
      });

      this.socket.on('disconnect', () => {
        console.log('Socket.IO disconnected');
        this.handleReconnect();
      });

      this.socket.on('error', (error: Error) => {
        console.error('Socket.IO error:', error);
      });

      // Handle all events
      this.socket.onAny((event: string, data: unknown) => {
        this.handleMessage({ 
          event: event as WebSocketEvent, 
          data, 
          timestamp: new Date().toISOString() 
        });
      });
    } catch (error) {
      console.error('Failed to connect to Socket.IO:', error);
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, this.reconnectTimeout * this.reconnectAttempts);
    } else {
      toast.error('Failed to connect to WebSocket server');
    }
  }

  private handleMessage(message: WebSocketMessage<any>) {
    const handlers = this.eventHandlers.get(message.event);
    if (handlers) {
      handlers.forEach(handler => handler(message.data));
    }
  }

  on(event: WebSocketEvent, handler: (data: any) => void) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)?.push(handler);
  }

  off(event: WebSocketEvent, handler: (data: any) => void) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  send(event: WebSocketEvent, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket.IO is not connected');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
} 