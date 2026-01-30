'use client';

/**
 * SocketProvider
 *
 * React context provider for Socket.io connection management.
 * Provides socket instance and connection status to all children.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { io } from 'socket.io-client';
import type { TypedSocket, ConnectionStatus } from '../hooks/useSocket';
import { getAutoJoinRooms } from '../types/rooms';

// ============================================================================
// TYPES
// ============================================================================

export interface SocketContextValue {
  /** Socket instance (null if not connected) */
  socket: TypedSocket | null;

  /** Current connection status */
  status: ConnectionStatus;

  /** Whether socket is connected */
  isConnected: boolean;

  /** Current tenant ID */
  tenantId: number | null;

  /** Current user ID */
  userId: string | null;

  /** User role */
  role: string | null;

  /** Connect to socket server */
  connect: () => void;

  /** Disconnect from socket server */
  disconnect: () => void;

  /** Subscribe to a room */
  subscribe: (room: string) => Promise<boolean>;

  /** Unsubscribe from a room */
  unsubscribe: (room: string) => void;
}

export interface SocketProviderProps {
  children: ReactNode;

  /** Socket.io server URL (defaults to current origin) */
  url?: string;

  /** Socket.io path (defaults to /socket.io) */
  path?: string;

  /** Tenant ID for multi-tenant isolation */
  tenantId: number;

  /** User ID for user-specific rooms */
  userId: string;

  /** User role for authorization */
  role: string;

  /** JWT token for authentication */
  token: string;

  /** Auto-connect on mount */
  autoConnect?: boolean;

  /** Enable debug logging */
  debug?: boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const SocketContext = createContext<SocketContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export function SocketProvider({
  children,
  url,
  path = '/socket.io',
  tenantId,
  userId,
  role,
  token,
  autoConnect = true,
  debug = false,
}: SocketProviderProps) {
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  // ──────────────────────────────────────────────────────────────────────────
  // Debug Logger
  // ──────────────────────────────────────────────────────────────────────────

  const log = useCallback(
    (...args: unknown[]) => {
      if (debug) {
        console.log('[SocketProvider]', ...args);
      }
    },
    [debug]
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Connect
  // ──────────────────────────────────────────────────────────────────────────

  const connect = useCallback(() => {
    if (socket?.connected) {
      log('Already connected');
      return;
    }

    log('Connecting...', { url, tenantId, userId, role });
    setStatus('connecting');

    const newSocket = io(url ?? '', {
      path,
      auth: { token },
      query: {
        tenantId: String(tenantId),
        userId,
        role,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    }) as TypedSocket;

    // Connection events
    newSocket.on('connect', () => {
      log('Connected', { id: newSocket.id });
      setStatus('connected');

      // Auto-join rooms based on role
      const autoRooms = getAutoJoinRooms(tenantId, userId, role);
      autoRooms.forEach((room) => {
        newSocket.emit('subscribe:room', room, (success: boolean) => {
          log('Auto-joined room:', room, success ? '✓' : '✗');
        });
      });
    });

    newSocket.on('disconnect', (reason) => {
      log('Disconnected:', reason);
      setStatus('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      log('Connection error:', error.message);
      setStatus('error');
    });

    newSocket.io.on('reconnect_attempt', (attempt) => {
      log('Reconnecting... attempt', attempt);
      setStatus('reconnecting');
    });

    newSocket.io.on('reconnect', () => {
      log('Reconnected');
      setStatus('connected');
    });

    newSocket.io.on('reconnect_failed', () => {
      log('Reconnection failed');
      setStatus('error');
    });

    setSocket(newSocket);
  }, [socket, url, path, token, tenantId, userId, role, log]);

  // ──────────────────────────────────────────────────────────────────────────
  // Disconnect
  // ──────────────────────────────────────────────────────────────────────────

  const disconnect = useCallback(() => {
    if (socket) {
      log('Disconnecting...');
      socket.disconnect();
      setSocket(null);
      setStatus('disconnected');
    }
  }, [socket, log]);

  // ──────────────────────────────────────────────────────────────────────────
  // Subscribe / Unsubscribe
  // ──────────────────────────────────────────────────────────────────────────

  const subscribe = useCallback(
    (room: string): Promise<boolean> => {
      return new Promise((resolve) => {
        if (!socket?.connected) {
          log('Cannot subscribe - not connected');
          resolve(false);
          return;
        }

        socket.emit('subscribe:room', room, (success: boolean) => {
          log('Subscribe to room:', room, success ? '✓' : '✗');
          resolve(success);
        });
      });
    },
    [socket, log]
  );

  const unsubscribe = useCallback(
    (room: string) => {
      if (socket?.connected) {
        socket.emit('unsubscribe:room', room);
        log('Unsubscribed from room:', room);
      }
    },
    [socket, log]
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Auto-connect on mount
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (autoConnect && token) {
      connect();
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
    // Only run on mount/unmount
     
  }, [autoConnect, token]);

  // ──────────────────────────────────────────────────────────────────────────
  // Reconnect when auth changes
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (socket?.connected && token) {
      log('Auth changed, reconnecting...');
      disconnect();
      connect();
    }
     
  }, [tenantId, userId, role, token]);

  // ──────────────────────────────────────────────────────────────────────────
  // Context Value
  // ──────────────────────────────────────────────────────────────────────────

  const value = useMemo<SocketContextValue>(
    () => ({
      socket,
      status,
      isConnected: status === 'connected',
      tenantId,
      userId,
      role,
      connect,
      disconnect,
      subscribe,
      unsubscribe,
    }),
    [socket, status, tenantId, userId, role, connect, disconnect, subscribe, unsubscribe]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useSocketContext(): SocketContextValue {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }

  return context;
}

// ============================================================================
// OPTIONAL HOOK (returns null if not in provider)
// ============================================================================

export function useSocketContextOptional(): SocketContextValue | null {
  return useContext(SocketContext);
}
