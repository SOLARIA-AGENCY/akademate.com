/**
 * Socket.io Module Index
 *
 * Exports Socket.io server and emitter utilities.
 */

export { getSocketServer, startServer } from './server';

export {
  emitDashboardMetrics,
  emitDashboardKPI,
  emitNewActivity,
  emitUserNotification,
  emitCourseProgress,
  emitPoints,
  emitBadge,
  emitCreateActivity,
  emitUpdateActivity,
  emitDeleteActivity,
} from './emitter';
