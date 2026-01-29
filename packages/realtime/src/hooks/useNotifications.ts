'use client';

/**
 * useNotifications Hook
 *
 * Subscribe to user-specific push notifications.
 * Provides real-time notification delivery and management.
 */

import { useEffect, useState, useCallback } from 'react';
import type { TypedSocket } from './useSocket';
import type { NotificationPayload, AlertPayload } from '../types/payloads';
import { getUserRoom } from '../types/rooms';

// ============================================================================
// TYPES
// ============================================================================

export interface UseNotificationsOptions {
  /** Socket instance from useSocket */
  socket: TypedSocket | null;

  /** User ID for user-specific room */
  userId: string;

  /** Maximum notifications to keep */
  maxNotifications?: number;

  /** Initial notifications (from API) */
  initialNotifications?: NotificationPayload[];

  /** Callback when new notification arrives */
  onNotification?: (notification: NotificationPayload) => void;

  /** Callback when alert arrives */
  onAlert?: (alert: AlertPayload) => void;
}

export interface UseNotificationsReturn {
  /** All notifications */
  notifications: NotificationPayload[];

  /** Unread count */
  unreadCount: number;

  /** Current alert (if any) */
  currentAlert: AlertPayload | null;

  /** Whether subscribed */
  isSubscribed: boolean;

  /** Mark notification as read */
  markAsRead: (id: string) => void;

  /** Mark all as read */
  markAllAsRead: () => void;

  /** Dismiss current alert */
  dismissAlert: () => void;

  /** Clear all notifications */
  clear: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useNotifications(
  options: UseNotificationsOptions
): UseNotificationsReturn {
  const {
    socket,
    userId,
    maxNotifications = 100,
    initialNotifications = [],
    onNotification,
    onAlert,
  } = options;

  const [notifications, setNotifications] =
    useState<NotificationPayload[]>(initialNotifications);
  const [currentAlert, setCurrentAlert] = useState<AlertPayload | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // ──────────────────────────────────────────────────────────────────────────
  // Computed Values
  // ──────────────────────────────────────────────────────────────────────────

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ──────────────────────────────────────────────────────────────────────────
  // Handle New Notification
  // ──────────────────────────────────────────────────────────────────────────

  const handleNotification = useCallback(
    (data: NotificationPayload) => {
      if (data.userId !== userId) return;

      setNotifications((prev) => {
        // Check for duplicate
        if (prev.some((n) => n.id === data.id)) {
          return prev;
        }
        return [data, ...prev].slice(0, maxNotifications);
      });

      onNotification?.(data);
    },
    [userId, maxNotifications, onNotification]
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Handle Alert
  // ──────────────────────────────────────────────────────────────────────────

  const handleAlert = useCallback(
    (data: AlertPayload) => {
      setCurrentAlert(data);
      onAlert?.(data);

      // Auto-dismiss if expiry set
      if (data.expiresAt) {
        const expiresIn = new Date(data.expiresAt).getTime() - Date.now();
        if (expiresIn > 0) {
          setTimeout(() => {
            setCurrentAlert((current) =>
              current?.id === data.id ? null : current
            );
          }, expiresIn);
        }
      }
    },
    [onAlert]
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Actions
  // ──────────────────────────────────────────────────────────────────────────

  const markAsRead = useCallback(
    (id: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );

      // Notify server
      socket?.emit('notification:read', id);
    },
    [socket]
  );

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    // Notify server
    socket?.emit('notification:read-all');
  }, [socket]);

  const dismissAlert = useCallback(() => {
    setCurrentAlert(null);
  }, []);

  const clear = useCallback(() => {
    setNotifications([]);
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // Subscribe to Room & Events
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!socket?.connected || !userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Valid sync with external socket state
      setIsSubscribed(false);
      return;
    }

    const notificationsRoom = getUserRoom(userId, 'notifications');
    const alertsRoom = getUserRoom(userId, 'alerts');

    // Subscribe to user rooms
    socket.emit('subscribe:room', notificationsRoom, (success: boolean) => {
      if (success) {
        socket.emit('subscribe:room', alertsRoom);
        setIsSubscribed(true);
      }
    });

    // Listen for events
    socket.on('notification:push', handleNotification);
    socket.on('notification:alert', handleAlert);

    return () => {
      socket.emit('unsubscribe:room', notificationsRoom);
      socket.emit('unsubscribe:room', alertsRoom);
      socket.off('notification:push', handleNotification);
      socket.off('notification:alert', handleAlert);
      setIsSubscribed(false);
    };
  }, [socket, userId, handleNotification, handleAlert]);

  return {
    notifications,
    unreadCount,
    currentAlert,
    isSubscribed,
    markAsRead,
    markAllAsRead,
    dismissAlert,
    clear,
  };
}
