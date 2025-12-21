/**
 * Types Index
 *
 * Re-exports all type definitions for easy importing.
 */

// Events
export type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from './events';

// Payloads
export type {
  BasePayload,
  MetricsPayload,
  KPIChangePayload,
  ActivityType,
  ActivityPayload,
  ServiceStatus,
  SystemStatusPayload,
  IncidentSeverity,
  IncidentStatus,
  IncidentPayload,
  NotificationType,
  NotificationPayload,
  AlertPayload,
  CoursePayload,
  ConvocationCapacityPayload,
  ProgressPayload,
  GamificationPayload,
  LeaderboardPayload,
  SessionPayload,
  PresencePayload,
} from './payloads';

// Rooms
export type { RoomType } from './rooms';
export {
  getTenantRoom,
  getUserRoom,
  getSystemRoom,
  parseRoom,
  canJoinRoom,
  getAutoJoinRooms,
  getDashboardRooms,
  getLMSRooms,
} from './rooms';
