/**
 * Socket.io Event Types
 *
 * Defines all events between server and clients for real-time communication.
 * Events are organized by domain: metrics, activities, system, notifications, etc.
 */

import type {
  MetricsPayload,
  KPIChangePayload,
  ActivityPayload,
  SystemStatusPayload,
  IncidentPayload,
  NotificationPayload,
  AlertPayload,
  CoursePayload,
  ConvocationCapacityPayload,
  ProgressPayload,
  GamificationPayload,
  LeaderboardPayload,
  PresencePayload,
  SessionPayload,
} from './payloads';

// ============================================================================
// SERVER TO CLIENT EVENTS
// ============================================================================

/**
 * Events emitted from server to connected clients
 */
export interface ServerToClientEvents {
  // ─────────────────────────────────────────────────────────────────────────
  // Dashboard Metrics
  // ─────────────────────────────────────────────────────────────────────────

  /** Full metrics update (periodic or on-demand) */
  'metrics:update': (data: MetricsPayload) => void;

  /** Single KPI value changed */
  'metrics:kpi-change': (data: KPIChangePayload) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Activities Feed
  // ─────────────────────────────────────────────────────────────────────────

  /** New activity logged */
  'activity:new': (data: ActivityPayload) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // System Status
  // ─────────────────────────────────────────────────────────────────────────

  /** Service status update */
  'system:status': (data: SystemStatusPayload) => void;

  /** New incident reported */
  'system:incident': (data: IncidentPayload) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Notifications
  // ─────────────────────────────────────────────────────────────────────────

  /** Push notification to user */
  'notification:push': (data: NotificationPayload) => void;

  /** Alert notification (higher priority) */
  'notification:alert': (data: AlertPayload) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Courses & Convocations
  // ─────────────────────────────────────────────────────────────────────────

  /** Course created or updated */
  'course:updated': (data: CoursePayload) => void;

  /** Course published */
  'course:published': (data: CoursePayload) => void;

  /** Convocation capacity warning */
  'convocation:capacity': (data: ConvocationCapacityPayload) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // LMS Progress
  // ─────────────────────────────────────────────────────────────────────────

  /** Student progress updated */
  'progress:updated': (data: ProgressPayload) => void;

  /** Lesson completed */
  'progress:lesson-completed': (data: ProgressPayload) => void;

  /** Module completed */
  'progress:module-completed': (data: ProgressPayload) => void;

  /** Course completed */
  'progress:course-completed': (data: ProgressPayload) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Gamification
  // ─────────────────────────────────────────────────────────────────────────

  /** Points earned */
  'gamification:points-earned': (data: GamificationPayload) => void;

  /** Badge unlocked */
  'gamification:badge-unlocked': (data: GamificationPayload) => void;

  /** Level up */
  'gamification:level-up': (data: GamificationPayload) => void;

  /** Leaderboard position changed */
  'leaderboard:update': (data: LeaderboardPayload) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Live Sessions
  // ─────────────────────────────────────────────────────────────────────────

  /** Session starting soon */
  'session:starting': (data: SessionPayload) => void;

  /** Session is live now */
  'session:live': (data: SessionPayload) => void;

  /** Session ended */
  'session:ended': (data: SessionPayload) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Presence
  // ─────────────────────────────────────────────────────────────────────────

  /** User came online */
  'presence:online': (data: PresencePayload) => void;

  /** User went offline */
  'presence:offline': (data: PresencePayload) => void;

  /** User came online (with details) */
  'presence:user-online': (data: { userId: string; role: string; timestamp: string }) => void;

  /** User went offline (with details) */
  'presence:user-offline': (data: { userId: string; timestamp: string }) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Connection
  // ─────────────────────────────────────────────────────────────────────────

  /** Connection error */
  'error': (data: { code: string; message: string }) => void;
}

// ============================================================================
// CLIENT TO SERVER EVENTS
// ============================================================================

/**
 * Events emitted from clients to server
 */
export interface ClientToServerEvents {
  // ─────────────────────────────────────────────────────────────────────────
  // Room Management
  // ─────────────────────────────────────────────────────────────────────────

  /** Subscribe to a room */
  'subscribe:room': (room: string, callback?: (success: boolean) => void) => void;

  /** Unsubscribe from a room */
  'unsubscribe:room': (room: string) => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Presence
  // ─────────────────────────────────────────────────────────────────────────

  /** Report active page */
  'presence:active': (page: string) => void;

  /** Heartbeat ping */
  'presence:ping': () => void;

  // ─────────────────────────────────────────────────────────────────────────
  // Notifications
  // ─────────────────────────────────────────────────────────────────────────

  /** Mark notification as read */
  'notification:read': (notificationId: string) => void;

  /** Mark all notifications as read */
  'notification:read-all': () => void;
}

// ============================================================================
// INTER-SERVER EVENTS (for scaling with Redis adapter)
// ============================================================================

export interface InterServerEvents {
  /** Ping between server instances */
  ping: () => void;
}

// ============================================================================
// SOCKET DATA (attached to socket instance)
// ============================================================================

export interface SocketData {
  /** User ID from JWT */
  userId: string;

  /** Tenant ID for multi-tenancy isolation */
  tenantId: number;

  /** Primary user role */
  role: string;

  /** All user roles */
  roles?: string[];

  /** Whether user is authenticated */
  authenticated: boolean;

  /** Connected at timestamp */
  connectedAt?: Date;

  /** Last activity timestamp */
  lastActivity?: Date;

  /** Current page (for presence) */
  currentPage?: string;
}
