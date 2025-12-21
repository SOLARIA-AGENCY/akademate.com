/**
 * Hooks Index
 *
 * Re-exports all React hooks for Socket.io functionality.
 */

export { useSocket } from './useSocket';
export type {
  TypedSocket,
  ConnectionStatus,
  UseSocketOptions,
  UseSocketReturn,
} from './useSocket';

export { useMetrics } from './useMetrics';
export type {
  DashboardMetrics,
  MetricsTrends,
  UseMetricsOptions,
  UseMetricsReturn,
} from './useMetrics';

export { useSystemStatus } from './useSystemStatus';
export type {
  ServiceInfo,
  UseSystemStatusOptions,
  UseSystemStatusReturn,
} from './useSystemStatus';

export { useActivities } from './useActivities';
export type {
  UseActivitiesOptions,
  UseActivitiesReturn,
} from './useActivities';

export { useNotifications } from './useNotifications';
export type {
  UseNotificationsOptions,
  UseNotificationsReturn,
} from './useNotifications';
