'use client';

/**
 * useSocket Hook
 *
 * Base hook for Socket.io connection management.
 * Handles connection, reconnection, and room subscriptions.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from '../types/events';

// ============================================================================
// TYPES
// ============================================================================

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

export interface UseSocketOptions {
  /** Socket.io server URL */
  url?: string;

  /** JWT token for authentication */
  token?: string;

  /** Tenant ID for room isolation */
  tenantId?: number;

  /** Auto-connect on mount */
  autoConnect?: boolean;

  /** Reconnection attempts */
  reconnectionAttempts?: number;

  /** Reconnection delay in ms */
  reconnectionDelay?: number;

  /** Rooms to auto-join on connect */
  autoJoinRooms?: string[];

  /** Callback when connected */
  onConnect?: () => void;

  /** Callback when disconnected */
  onDisconnect?: (reason: string) => void;

  /** Callback on error */
  onError?: (error: Error) => void;
}

export interface UseSocketReturn {
  /** Socket instance */
  socket: TypedSocket | null;

  /** Connection status */
  status: ConnectionStatus;

  /** Whether connected */
  isConnected: boolean;

  /** Connect to server */
  connect: () => void;

  /** Disconnect from server */
  disconnect: () => void;

  /** Subscribe to a room */
  subscribe: (room: string) => Promise<boolean>;

  /** Unsubscribe from a room */
  unsubscribe: (room: string) => void;

  /** Currently subscribed rooms */
  rooms: Set<string>;

  /** Last error */
  error: Error | null;
}

// ============================================================================
// HOOK
// ============================================================================

export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const {
    url = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3009',
    token,
    tenantId,
    autoConnect = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
    autoJoinRooms = [],
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const [rooms, setRooms] = useState<Set<string>>(new Set());

  const socketRef = useRef<TypedSocket | null>(null);
  const mountedRef = useRef(true);

  // ──────────────────────────────────────────────────────────────────────────
  // Connect
  // ──────────────────────────────────────────────────────────────────────────

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    setStatus('connecting');
    setError(null);

    const newSocket = io(url, {
      auth: {
        token,
        tenantId,
      },
      reconnectionAttempts,
      reconnectionDelay,
      transports: ['websocket', 'polling'],
      autoConnect: true,
    }) as TypedSocket;

    // Connection events
    newSocket.on('connect', () => {
      if (!mountedRef.current) return;

      setStatus('connected');
      setError(null);

      // Auto-join rooms
      autoJoinRooms.forEach((room) => {
        newSocket.emit('subscribe:room', room);
      });

      onConnect?.();
    });

    newSocket.on('disconnect', (reason) => {
      if (!mountedRef.current) return;

      setStatus('disconnected');
      setRooms(new Set());
      onDisconnect?.(reason);
    });

    newSocket.on('connect_error', (err) => {
      if (!mountedRef.current) return;

      setStatus('error');
      setError(err);
      onError?.(err);
    });

    newSocket.on('error', (data) => {
      if (!mountedRef.current) return;

      const err = new Error(data.message);
      setError(err);
      onError?.(err);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  }, [
    url,
    token,
    tenantId,
    reconnectionAttempts,
    reconnectionDelay,
    autoJoinRooms,
    onConnect,
    onDisconnect,
    onError,
  ]);

  // ──────────────────────────────────────────────────────────────────────────
  // Disconnect
  // ──────────────────────────────────────────────────────────────────────────

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setStatus('disconnected');
      setRooms(new Set());
    }
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // Subscribe to Room
  // ──────────────────────────────────────────────────────────────────────────

  const subscribe = useCallback(async (room: string): Promise<boolean> => {
    if (!socketRef.current?.connected) {
      return false;
    }

    return new Promise((resolve) => {
      socketRef.current!.emit('subscribe:room', room, (success: boolean) => {
        if (success && mountedRef.current) {
          setRooms((prev) => new Set(prev).add(room));
        }
        resolve(success);
      });
    });
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // Unsubscribe from Room
  // ──────────────────────────────────────────────────────────────────────────

  const unsubscribe = useCallback((room: string): void => {
    if (!socketRef.current?.connected) return;

    socketRef.current.emit('unsubscribe:room', room);
    setRooms((prev) => {
      const next = new Set(prev);
      next.delete(room);
      return next;
    });
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // Lifecycle
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;

    if (autoConnect && token) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [autoConnect, token, connect, disconnect]);

  return {
    socket,
    status,
    isConnected: status === 'connected',
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    rooms,
    error,
  };
}
