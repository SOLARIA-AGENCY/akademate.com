/**
 * Socket.io Event Payloads
 *
 * Type definitions for all event payloads.
 * Each payload is designed to be self-contained with all necessary data.
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

export interface BasePayload {
  /** Event timestamp */
  timestamp: string;

  /** Tenant ID for filtering */
  tenantId: number;
}

// ============================================================================
// METRICS PAYLOADS
// ============================================================================

export interface MetricsPayload extends BasePayload {
  metrics: {
    courses: number;
    students: number;
    leads: number;
    teachers: number;
    campuses: number;
    convocations: number;
  };
  trends?: {
    courses: number;
    students: number;
    leads: number;
  };
}

export interface KPIChangePayload extends BasePayload {
  /** KPI key (courses, students, leads, etc.) */
  key: string;

  /** New value */
  value: number;

  /** Previous value */
  previousValue: number;

  /** Change delta */
  delta: number;

  /** Trend direction */
  trend: 'up' | 'down' | 'stable';
}

// ============================================================================
// ACTIVITY PAYLOADS
// ============================================================================

export type ActivityType =
  | 'enrollment'
  | 'course_created'
  | 'course_published'
  | 'lead_created'
  | 'staff_added'
  | 'payment_received'
  | 'convocation_opened'
  | 'user_registered';

export interface ActivityPayload extends BasePayload {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  entityType: string;
  entityId: string;
  userId?: string;
  userName?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// SYSTEM STATUS PAYLOADS
// ============================================================================

export type ServiceStatus = 'operational' | 'degraded' | 'down' | 'maintenance';

export interface SystemStatusPayload extends BasePayload {
  services: {
    name: string;
    status: ServiceStatus;
    latency?: number;
    uptime?: number;
    lastChecked: string;
    details?: string;
  }[];
  overallStatus: ServiceStatus;
}

export type IncidentSeverity = 'minor' | 'major' | 'critical';
export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved';

export interface IncidentPayload extends BasePayload {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affectedServices: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

// ============================================================================
// NOTIFICATION PAYLOADS
// ============================================================================

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'enrollment'
  | 'payment'
  | 'course'
  | 'progress'
  | 'system';

export interface NotificationPayload extends BasePayload {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  read: boolean;
  userId: string;
  metadata?: Record<string, unknown>;
}

export interface AlertPayload extends BasePayload {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  actionUrl?: string;
  dismissible: boolean;
  expiresAt?: string;
}

// ============================================================================
// COURSE PAYLOADS
// ============================================================================

export interface CoursePayload extends BasePayload {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  action: 'created' | 'updated' | 'published' | 'archived';
  updatedBy?: string;
}

export interface ConvocationCapacityPayload extends BasePayload {
  id: string;
  courseId: string;
  title: string;
  code: string;
  enrolled: number;
  capacity: number;
  available: number;
  percentFilled: number;
  warning: boolean;
  startDate: string;
}

// ============================================================================
// LMS PROGRESS PAYLOADS
// ============================================================================

export interface ProgressPayload extends BasePayload {
  userId: string;
  enrollmentId: string;
  courseId: string;

  /** For lesson/module completion */
  lessonId?: string;
  moduleId?: string;

  /** Progress percentage */
  progressPercent: number;

  /** Completion status */
  status: 'not_started' | 'in_progress' | 'completed';

  /** Total lessons/modules */
  totalLessons?: number;
  completedLessons?: number;

  /** Certificate URL (for course completion) */
  certificateUrl?: string;
}

// ============================================================================
// GAMIFICATION PAYLOADS
// ============================================================================

export interface GamificationPayload extends BasePayload {
  userId: string;

  /** Points earned in this event */
  points?: number;

  /** Total points after event */
  totalPoints: number;

  /** Badge info (for badge-unlocked) */
  badge?: {
    id: string;
    name: string;
    icon: string;
    description: string;
  };

  /** Level info (for level-up) */
  level?: {
    current: number;
    previous: number;
    name: string;
    rewards?: string[];
  };

  /** Reason for points */
  reason?: string;
}

export interface LeaderboardPayload extends BasePayload {
  userId: string;

  /** Current position */
  position: number;

  /** Previous position */
  previousPosition: number;

  /** Position change */
  delta: number;

  /** User info */
  userName: string;
  userAvatar?: string;

  /** Points */
  points: number;

  /** Top 10 leaderboard snapshot */
  leaderboard?: {
    position: number;
    userId: string;
    userName: string;
    userAvatar?: string;
    points: number;
  }[];
}

// ============================================================================
// SESSION PAYLOADS
// ============================================================================

export interface SessionPayload extends BasePayload {
  courseId: string;
  courseTitle: string;
  instructorId: string;
  instructorName: string;

  /** Session start time */
  startsAt: string;

  /** Minutes until start (for starting) */
  startsIn?: number;

  /** Join URL (for live) */
  joinUrl?: string;

  /** Recording URL (for ended) */
  recordingUrl?: string;

  /** Participants count (for live) */
  participants?: number;
}

// ============================================================================
// PRESENCE PAYLOADS
// ============================================================================

export interface PresencePayload extends BasePayload {
  userId: string;
  userName?: string;
  userAvatar?: string;
  role?: string;
  page?: string;
  status: 'online' | 'away' | 'offline';
}
