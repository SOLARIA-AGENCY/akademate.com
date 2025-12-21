'use client';

/**
 * NotificationToast Component
 *
 * Displays toast notifications that slide in from the top-right.
 * Auto-dismisses after a configurable duration.
 */

import React, { useEffect, useState } from 'react';
import type { NotificationPayload } from '../types/payloads';

// ============================================================================
// TYPES
// ============================================================================

export interface ToastNotification extends NotificationPayload {
  dismissedAt?: number;
}

export interface NotificationToastProps {
  notification: ToastNotification;
  duration?: number;
  onDismiss: (id: string) => void;
  onClick?: (notification: ToastNotification) => void;
}

export interface NotificationToastContainerProps {
  notifications: ToastNotification[];
  duration?: number;
  onDismiss: (id: string) => void;
  onClick?: (notification: ToastNotification) => void;
  maxVisible?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

// ============================================================================
// PROGRESS BAR COMPONENT
// ============================================================================

function ProgressBar({ duration, colorClass }: { duration: number; colorClass: string }) {
  const [width, setWidth] = useState(100);

  useEffect(() => {
    // Start shrinking immediately
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setWidth(remaining);

      if (remaining > 0) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [duration]);

  return (
    <div
      className={`h-full ${colorClass}`}
      style={{
        width: `${width}%`,
        transition: 'width 50ms linear',
      }}
    />
  );
}

// ============================================================================
// SINGLE TOAST
// ============================================================================

export function NotificationToast({
  notification,
  duration = 5000,
  onDismiss,
  onClick,
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Enter animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Auto dismiss
    const dismissTimer = setTimeout(() => {
      setIsLeaving(true);
    }, duration - 300);

    const removeTimer = setTimeout(() => {
      onDismiss(notification.id);
    }, duration);

    return () => {
      clearTimeout(dismissTimer);
      clearTimeout(removeTimer);
    };
  }, [duration, notification.id, onDismiss]);

  const handleClick = () => {
    onClick?.(notification);
    setIsLeaving(true);
    setTimeout(() => onDismiss(notification.id), 200);
  };

  const typeStyles = {
    info: {
      bg: 'bg-blue-500/10 border-blue-500/30',
      icon: 'bg-blue-500',
      iconEmoji: 'ℹ️',
    },
    success: {
      bg: 'bg-green-500/10 border-green-500/30',
      icon: 'bg-green-500',
      iconEmoji: '✅',
    },
    warning: {
      bg: 'bg-yellow-500/10 border-yellow-500/30',
      icon: 'bg-yellow-500',
      iconEmoji: '⚠️',
    },
    error: {
      bg: 'bg-red-500/10 border-red-500/30',
      icon: 'bg-red-500',
      iconEmoji: '❌',
    },
    message: {
      bg: 'bg-purple-500/10 border-purple-500/30',
      icon: 'bg-purple-500',
      iconEmoji: '💬',
    },
  };

  const style = typeStyles[notification.type as keyof typeof typeStyles] || typeStyles.info;

  return (
    <div
      className={`
        transform transition-all duration-300 ease-out cursor-pointer
        ${isVisible && !isLeaving
          ? 'translate-x-0 opacity-100'
          : 'translate-x-4 opacity-0'}
        ${style.bg}
        border rounded-xl p-4 shadow-lg backdrop-blur-sm
        max-w-sm w-full
      `}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        <div
          className={`
            flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
            ${style.icon} text-white text-lg
          `}
        >
          {style.iconEmoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-foreground text-sm">{notification.title}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsLeaving(true);
                setTimeout(() => onDismiss(notification.id), 200);
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>
          {notification.actionLabel && (
            <button className="text-xs text-primary hover:underline mt-2">
              {notification.actionLabel} →
            </button>
          )}
        </div>
      </div>

      {/* Progress bar for auto-dismiss */}
      <div className="mt-3 h-0.5 bg-muted/30 rounded-full overflow-hidden">
        <ProgressBar duration={duration} colorClass={style.icon} />
      </div>
    </div>
  );
}

// ============================================================================
// TOAST CONTAINER
// ============================================================================

export function NotificationToastContainer({
  notifications,
  duration = 5000,
  onDismiss,
  onClick,
  maxVisible = 3,
  position = 'top-right',
}: NotificationToastContainerProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  const visibleNotifications = notifications.slice(0, maxVisible);

  if (visibleNotifications.length === 0) return null;

  return (
    <div className={`fixed ${positionClasses[position]} z-50 flex flex-col gap-2`}>
      {visibleNotifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          duration={duration}
          onDismiss={onDismiss}
          onClick={onClick}
        />
      ))}
    </div>
  );
}
