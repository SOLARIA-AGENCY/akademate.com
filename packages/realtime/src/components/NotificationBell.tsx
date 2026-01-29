'use client';

/**
 * NotificationBell Component
 *
 * Displays notification bell icon with unread count badge.
 * Opens dropdown panel with recent notifications.
 */

import { useState, useRef, useEffect } from 'react';
import type { NotificationPayload, AlertPayload } from '../types/payloads';

// ============================================================================
// TYPES
// ============================================================================

export interface NotificationBellProps {
  notifications: NotificationPayload[];
  unreadCount: number;
  currentAlert?: AlertPayload | null;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismissAlert?: () => void;
  onNotificationClick?: (notification: NotificationPayload) => void;
  className?: string;
  maxVisible?: number;
}

// ============================================================================
// ICON COMPONENTS
// ============================================================================

function BellIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="w-4 h-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

// ============================================================================
// NOTIFICATION ITEM
// ============================================================================

interface NotificationItemProps {
  notification: NotificationPayload;
  onMarkAsRead: (id: string) => void;
  onClick?: (notification: NotificationPayload) => void;
}

function NotificationItem({ notification, onMarkAsRead, onClick }: NotificationItemProps) {
  const typeColors = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    message: 'bg-purple-500',
  };

  const typeIcons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    message: '💬',
  };

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    onClick?.(notification);
  };

  const timeAgo = getTimeAgo(notification.timestamp);

  return (
    <div
      role="button"
      tabIndex={0}
      className={`
        p-3 border-b border-border/50 cursor-pointer transition-colors
        hover:bg-muted/50
        ${!notification.read ? 'bg-primary/5' : ''}
      `}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
    >
      <div className="flex gap-3">
        <div
          className={`
            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
            ${typeColors[notification.type as keyof typeof typeColors] || 'bg-gray-500'}
            text-white text-sm
          `}
        >
          {typeIcons[notification.type as keyof typeof typeIcons] || 'ℹ️'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm font-medium truncate ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
              {notification.title}
            </p>
            {!notification.read && (
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" />
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">{timeAgo}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER
// ============================================================================

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins}m`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Hace ${diffDays}d`;

  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function NotificationBell({
  notifications,
  unreadCount,
  currentAlert,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismissAlert,
  onNotificationClick,
  className = '',
  maxVisible = 5,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const visibleNotifications = notifications.slice(0, maxVisible);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Alert Banner */}
      {currentAlert && (
        <div
          className={`
            absolute -top-16 right-0 w-72 p-3 rounded-lg shadow-lg z-50
            ${currentAlert.severity === 'critical' ? 'bg-red-500 text-white' :
              currentAlert.severity === 'warning' ? 'bg-yellow-500 text-black' :
              'bg-blue-500 text-white'}
          `}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="font-medium text-sm">{currentAlert.title}</p>
              <p className="text-xs opacity-90">{currentAlert.message}</p>
            </div>
            {onDismissAlert && (
              <button
                onClick={onDismissAlert}
                className="text-current opacity-70 hover:opacity-100"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-muted/50 transition-colors text-foreground"
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
      >
        <BellIcon className={`w-5 h-5 ${unreadCount > 0 ? 'animate-pulse' : ''}`} />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold bg-red-500 text-white rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h3 className="font-semibold text-foreground">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <CheckIcon />
                Marcar todo como leído
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {visibleNotifications.length === 0 ? (
              <div className="p-6 text-center">
                <BellIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No hay notificaciones</p>
              </div>
            ) : (
              visibleNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={onMarkAsRead}
                  onClick={onNotificationClick}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > maxVisible && (
            <div className="p-2 border-t border-border text-center">
              <button className="text-xs text-primary hover:underline">
                Ver todas ({notifications.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
