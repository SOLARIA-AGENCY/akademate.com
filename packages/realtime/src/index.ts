/**
 * @akademate/realtime
 *
 * Shared Socket.io infrastructure for real-time features across Akademate.
 *
 * @example Client-side usage
 * ```tsx
 * import { SocketProvider, useMetrics, useActivities } from '@akademate/realtime';
 *
 * function App() {
 *   return (
 *     <SocketProvider
 *       tenantId={1}
 *       userId="user-123"
 *       role="admin"
 *       token={authToken}
 *     >
 *       <Dashboard />
 *     </SocketProvider>
 *   );
 * }
 *
 * function Dashboard() {
 *   const { socket } = useSocketContext();
 *   const { metrics, trends } = useMetrics({ socket, tenantId: 1 });
 *   const { activities } = useActivities({ socket, tenantId: 1 });
 *   // ...
 * }
 * ```
 *
 * @example Server-side usage
 * ```ts
 * import { createSocketServer } from '@akademate/realtime/server';
 * import { Server } from 'http';
 *
 * const httpServer = new Server(app);
 * const io = createSocketServer(httpServer, {
 *   jwtSecret: process.env.JWT_SECRET!,
 * });
 * ```
 */

// ============================================================================
// CONTEXT
// ============================================================================

export {
  SocketProvider,
  useSocketContext,
  useSocketContextOptional,
  type SocketContextValue,
  type SocketProviderProps,
} from './context';

// ============================================================================
// HOOKS
// ============================================================================

export {
  // useSocket
  useSocket,
  type TypedSocket,
  type ConnectionStatus,
  type UseSocketOptions,
  type UseSocketReturn,
  // useMetrics
  useMetrics,
  type DashboardMetrics,
  type MetricsTrends,
  type UseMetricsOptions,
  type UseMetricsReturn,
  // useSystemStatus
  useSystemStatus,
  type ServiceInfo,
  type UseSystemStatusOptions,
  type UseSystemStatusReturn,
  // useActivities
  useActivities,
  type UseActivitiesOptions,
  type UseActivitiesReturn,
  // useNotifications
  useNotifications,
  type UseNotificationsOptions,
  type UseNotificationsReturn,
} from './hooks';

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Events
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  // Payloads
  MetricsPayload,
  KPIChangePayload,
  ActivityPayload,
  ActivityType,
  SystemStatusPayload,
  ServiceStatus,
  IncidentPayload,
  NotificationPayload,
  NotificationType,
  AlertPayload,
  CoursePayload,
  ConvocationCapacityPayload,
  ProgressPayload,
  GamificationPayload,
  LeaderboardPayload,
  SessionPayload,
  PresencePayload,
  // Rooms
  RoomType,
} from './types';

// Room utilities
export {
  getTenantRoom,
  getUserRoom,
  getSystemRoom,
  parseRoom,
  canJoinRoom,
  getAutoJoinRooms,
  getDashboardRooms,
  getLMSRooms,
} from './types';

// ============================================================================
// COMPONENTS
// ============================================================================

export {
  NotificationBell,
  NotificationToast,
  NotificationToastContainer,
  type NotificationBellProps,
  type ToastNotification,
  type NotificationToastProps,
  type NotificationToastContainerProps,
} from './components';
