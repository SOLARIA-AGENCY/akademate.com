/**
 * Socket.io Event Emission Hooks
 *
 * afterChange hooks that emit Socket.io events when LMS data changes.
 * Used to provide real-time updates to connected clients (Campus, Dashboards).
 */

import type { CollectionAfterChangeHook } from 'payload';
import { getSocketServer } from '../socket/server';
import { getTenantRoom, getUserRoom } from '@akademate/realtime';
import type {
  ProgressPayload,
  GamificationPayload,
  NotificationPayload,
  ActivityPayload,
  CoursePayload,
} from '@akademate/realtime';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Base interface for all Payload documents
 */
interface PayloadBaseDocument {
  id: string | number;
  tenant?: number | { id?: number };
  user?: string | { id?: string | number };
}

/**
 * Reference object that may contain an ID
 */
interface PayloadReference {
  id?: string | number;
}

/**
 * Enrollment reference with user and courseRun
 */
interface EnrollmentReference extends PayloadReference {
  user?: string | { id?: string | number };
  courseRun?: {
    course?: PayloadReference;
  };
}

/**
 * Lesson progress document structure
 */
interface LessonProgressDocument extends PayloadBaseDocument {
  enrollment?: string | EnrollmentReference;
  lesson?: string | PayloadReference;
  isCompleted?: boolean;
}

/**
 * Enrollment document structure
 */
interface EnrollmentDocument extends PayloadBaseDocument {
  status?: string;
  courseRun?: {
    course?: PayloadReference;
  };
  certificateUrl?: string;
}

/**
 * Submission reference structure
 */
interface SubmissionReference extends PayloadReference {
  enrollment?: {
    user?: string | { id?: string | number };
  };
  assignment?: {
    title?: string;
  };
}

/**
 * Grade document structure
 */
interface GradeDocument extends PayloadBaseDocument {
  submission?: SubmissionReference;
  score?: number;
  maxScore?: number;
  isPass?: boolean;
}

/**
 * Submission document structure
 */
interface SubmissionDocument extends PayloadBaseDocument {
  status?: string;
  enrollment?: {
    user?: string | { id?: string | number };
  };
}

/**
 * Course document structure
 */
interface CourseDocument extends PayloadBaseDocument {
  title?: string;
  slug?: string;
  isPublished?: boolean;
}

/**
 * Badge reference structure
 */
interface BadgeReference extends PayloadReference {
  name?: string;
  icon?: string;
}

/**
 * User badge document structure
 */
interface UserBadgeDocument extends PayloadBaseDocument {
  badge?: BadgeReference;
}

/**
 * Points transaction document structure
 */
interface PointsTransactionDocument extends PayloadBaseDocument {
  points?: number;
  reason?: string;
}

/**
 * Streak document structure
 */
interface StreakDocument extends PayloadBaseDocument {
  currentStreak?: number;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if a value is an object with potential properties
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Safely get string value from unknown
 */
function toSafeString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
}

/**
 * Safely get number value from unknown
 */
function toSafeNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Safely get the socket server instance
 */
function getIO() {
  const io = getSocketServer();
  if (!io) {
    console.warn('[SocketHook] Socket server not available');
  }
  return io;
}

/**
 * Extract tenant ID from document
 */
function getTenantId(doc: PayloadBaseDocument): number | null {
  if (typeof doc.tenant === 'number') return doc.tenant;
  if (isRecord(doc.tenant)) {
    const id = (doc.tenant as { id?: number }).id;
    return typeof id === 'number' ? id : null;
  }
  return null;
}

/**
 * Extract user ID from document
 */
function getUserId(doc: PayloadBaseDocument): string | null {
  if (typeof doc.user === 'string') return doc.user;
  if (isRecord(doc.user)) {
    const id = (doc.user as { id?: string | number }).id;
    return id !== undefined ? String(id) : null;
  }
  return null;
}

/**
 * Extract user ID from a user field (string or object)
 */
function extractUserId(user: string | { id?: string | number } | undefined): string | null {
  if (typeof user === 'string') return user;
  if (isRecord(user)) {
    const id = (user as { id?: string | number }).id;
    return id !== undefined ? String(id) : null;
  }
  return null;
}

/**
 * Extract ID from a reference (string or object with id)
 */
function extractId(ref: string | PayloadReference | undefined): string {
  if (typeof ref === 'string') return ref;
  if (isRecord(ref)) {
    const id = (ref as PayloadReference).id;
    return id !== undefined ? String(id) : '';
  }
  return '';
}

// ============================================================================
// LESSON PROGRESS HOOKS
// ============================================================================

/**
 * Emit progress:updated event when lesson progress changes
 */
export const emitLessonProgressUpdate: CollectionAfterChangeHook<LessonProgressDocument> = ({
  doc,
  previousDoc,
}) => {
  const io = getIO();
  if (!io) return doc;

  const tenantId = getTenantId(doc);
  if (!tenantId) {
    console.warn('[SocketHook] No tenant ID found for lesson progress');
    return doc;
  }

  // Get enrollment details to find user
  let userId: string | null = null;
  let enrollmentId: string | null = null;
  let courseId: string | null = null;

  const enrollment = doc.enrollment;
  if (isRecord(enrollment)) {
    const enrollmentRef = enrollment as EnrollmentReference;
    enrollmentId = extractId(enrollmentRef);
    userId = extractUserId(enrollmentRef.user);
    if (isRecord(enrollmentRef.courseRun)) {
      const courseRun = enrollmentRef.courseRun;
      if (isRecord(courseRun.course)) {
        courseId = extractId(courseRun.course);
      }
    }
  } else if (typeof enrollment === 'string') {
    enrollmentId = enrollment;
  }

  // Build progress payload
  const lessonId = extractId(doc.lesson);
  const isCompleted = doc.isCompleted === true;

  const payload: ProgressPayload = {
    tenantId,
    userId: userId ?? '',
    enrollmentId: enrollmentId ?? '',
    courseId: courseId ?? '',
    lessonId,
    progressPercent: isCompleted ? 100 : 0,
    status: isCompleted ? 'completed' : 'in_progress',
    timestamp: new Date().toISOString(),
  };

  // Emit to tenant room for dashboard metrics
  const tenantRoom = getTenantRoom(tenantId, 'lms');
  io.to(tenantRoom).emit('progress:updated', payload);

  // Check if lesson was just completed
  const wasCompleted = isCompleted && previousDoc?.isCompleted !== true;

  if (wasCompleted) {
    io.to(tenantRoom).emit('progress:lesson-completed', payload);
    console.log(`[SocketHook] Emitted progress:lesson-completed for lesson ${lessonId}`);
  }

  console.log(`[SocketHook] Emitted progress:updated to ${tenantRoom}`);
  return doc;
};

// ============================================================================
// ENROLLMENT HOOKS
// ============================================================================

/**
 * Emit enrollment events when enrollment status changes
 */
export const emitEnrollmentUpdate: CollectionAfterChangeHook<EnrollmentDocument> = ({
  doc,
  previousDoc,
  operation,
}) => {
  const io = getIO();
  if (!io) return doc;

  const tenantId = getTenantId(doc);
  if (!tenantId) return doc;

  const userId = getUserId(doc);
  const enrollmentId = String(doc.id);
  const status = toSafeString(doc.status, 'pending');
  const previousStatus = previousDoc?.status;

  // Only emit on status changes or new enrollments
  if (operation === 'create' || status !== previousStatus) {
    const tenantRoom = getTenantRoom(tenantId, 'lms');

    // Emit activity for new enrollment
    if (operation === 'create' || status === 'active') {
      const activity: ActivityPayload = {
        id: `enrollment-${enrollmentId}`,
        type: 'enrollment',
        tenantId,
        title: operation === 'create' ? 'Nueva Matricula' : 'Matricula Activada',
        description: `Estudiante matriculado en curso`,
        entityType: 'enrollment',
        entityId: enrollmentId,
        userId: userId ?? undefined,
        timestamp: new Date().toISOString(),
        metadata: {
          enrollmentId,
          status,
        },
      };

      io.to(tenantRoom).emit('activity:new', activity);
      console.log(`[SocketHook] Emitted activity:new for enrollment ${enrollmentId}`);
    }

    // Check for course completion
    if (status === 'completed' && previousStatus !== 'completed') {
      // Get course info
      let courseId: string | null = null;
      if (isRecord(doc.courseRun)) {
        const courseRun = doc.courseRun;
        if (isRecord(courseRun.course)) {
          courseId = extractId(courseRun.course);
        }
      }

      const progressPayload: ProgressPayload = {
        tenantId,
        userId: userId ?? '',
        enrollmentId,
        courseId: courseId ?? '',
        progressPercent: 100,
        status: 'completed',
        certificateUrl: typeof doc.certificateUrl === 'string' ? doc.certificateUrl : undefined,
        timestamp: new Date().toISOString(),
      };

      io.to(tenantRoom).emit('progress:course-completed', progressPayload);

      // Also notify the user
      if (userId) {
        const userRoom = getUserRoom(userId, 'notifications');

        // Send notification
        const notification: NotificationPayload = {
          id: `course-complete-${enrollmentId}`,
          type: 'success',
          title: 'Curso Completado!',
          message: 'Has completado el curso exitosamente. Tu certificado esta listo.',
          timestamp: new Date().toISOString(),
          read: false,
          tenantId,
          userId,
          actionUrl: `/certificados/${enrollmentId}`,
          actionLabel: 'Ver Certificado',
        };

        io.to(userRoom).emit('notification:push', notification);
      }

      console.log(`[SocketHook] Emitted progress:course-completed for enrollment ${enrollmentId}`);
    }
  }

  return doc;
};

// ============================================================================
// GRADE HOOKS
// ============================================================================

/**
 * Emit notification when a grade is posted
 */
export const emitGradeUpdate: CollectionAfterChangeHook<GradeDocument> = ({
  doc,
  previousDoc,
  operation,
}) => {
  const io = getIO();
  if (!io) return doc;

  const tenantId = getTenantId(doc);
  if (!tenantId) return doc;

  // Only emit on new grades or score changes
  const isNewGrade = operation === 'create';
  const scoreChanged = previousDoc && doc.score !== previousDoc.score;

  if (!isNewGrade && !scoreChanged) return doc;

  // Get submission and enrollment info
  let userId: string | null = null;
  let assignmentTitle = 'Tarea';

  const submission = doc.submission;
  if (isRecord(submission)) {
    const submissionRef = submission as SubmissionReference;

    if (isRecord(submissionRef.enrollment)) {
      userId = extractUserId(submissionRef.enrollment.user);
    }

    if (isRecord(submissionRef.assignment)) {
      assignmentTitle = toSafeString(submissionRef.assignment.title, 'Tarea');
    }
  }

  if (userId) {
    const userRoom = getUserRoom(userId, 'notifications');

    const score = toSafeNumber(doc.score, 0);
    const maxScore = toSafeNumber(doc.maxScore, 100);
    const percentage = Math.round((score / maxScore) * 100);
    const passed = doc.isPass === true;

    const notification: NotificationPayload = {
      id: `grade-${String(doc.id)}`,
      type: passed ? 'success' : 'warning',
      title: 'Calificacion Publicada',
      message: `${assignmentTitle}: ${score}/${maxScore} (${percentage}%)${passed ? ' - Aprobado!' : ''}`,
      timestamp: new Date().toISOString(),
      read: false,
      tenantId,
      userId,
    };

    io.to(userRoom).emit('notification:push', notification);
    console.log(`[SocketHook] Emitted notification:push for grade to user ${userId}`);

    // If passed with perfect score, emit gamification event
    if (passed && percentage === 100) {
      const gamificationRoom = getTenantRoom(tenantId, 'gamification');
      const gamificationPayload: GamificationPayload = {
        tenantId,
        userId,
        points: 50,
        totalPoints: 0, // Will be calculated by client
        badge: {
          id: `perfect-${String(doc.id)}`,
          name: 'Perfecto',
          description: 'Score perfecto en una tarea',
          icon: 'star',
        },
        reason: 'Perfect score on assignment',
        timestamp: new Date().toISOString(),
      };

      io.to(gamificationRoom).emit('gamification:badge-unlocked', gamificationPayload);
    }
  }

  return doc;
};

// ============================================================================
// SUBMISSION HOOKS
// ============================================================================

/**
 * Emit notification when submission status changes
 */
export const emitSubmissionUpdate: CollectionAfterChangeHook<SubmissionDocument> = ({
  doc,
  previousDoc,
}) => {
  const io = getIO();
  if (!io) return doc;

  const tenantId = getTenantId(doc);
  if (!tenantId) return doc;

  const status = toSafeString(doc.status, 'draft');
  const previousStatus = previousDoc?.status;

  // Only emit on status changes
  if (status === previousStatus) return doc;

  // Get enrollment to find user
  let userId: string | null = null;

  const enrollment = doc.enrollment;
  if (isRecord(enrollment)) {
    userId = extractUserId(enrollment.user);
  }

  if (!userId) return doc;

  // Notify user about submission status changes
  const statusMessages: Record<string, { type: NotificationPayload['type']; message: string }> = {
    submitted: { type: 'success', message: 'Tu entrega ha sido recibida y esta en revision.' },
    grading: { type: 'info', message: 'Tu entrega esta siendo calificada.' },
    graded: { type: 'success', message: 'Tu entrega ha sido calificada!' },
    returned: { type: 'warning', message: 'Tu entrega ha sido devuelta para revision.' },
  };

  const statusInfo = statusMessages[status];
  if (!statusInfo) return doc;

  const userRoom = getUserRoom(userId, 'notifications');

  const notification: NotificationPayload = {
    id: `submission-${String(doc.id)}-${status}`,
    type: statusInfo.type,
    title: 'Actualizacion de Entrega',
    message: statusInfo.message,
    timestamp: new Date().toISOString(),
    read: false,
    tenantId,
    userId,
  };

  io.to(userRoom).emit('notification:push', notification);
  console.log(`[SocketHook] Emitted notification:push for submission ${String(doc.id)} to user ${userId}`);

  // If just submitted, also emit activity for dashboard
  if (status === 'submitted') {
    const tenantRoom = getTenantRoom(tenantId, 'lms');

    const activity: ActivityPayload = {
      id: `submission-${String(doc.id)}`,
      type: 'enrollment', // Using enrollment as closest match
      tenantId,
      title: 'Nueva Entrega',
      description: 'Un estudiante ha enviado una tarea para revision.',
      entityType: 'submission',
      entityId: String(doc.id),
      userId,
      timestamp: new Date().toISOString(),
      metadata: {
        submissionId: String(doc.id),
        status,
      },
    };

    io.to(tenantRoom).emit('activity:new', activity);
  }

  return doc;
};

// ============================================================================
// MODULE/COURSE HOOKS
// ============================================================================

/**
 * Emit course update events (for publishing, updates)
 */
export const emitCourseUpdate: CollectionAfterChangeHook<CourseDocument> = ({
  doc,
  previousDoc,
  operation,
}) => {
  const io = getIO();
  if (!io) return doc;

  const tenantId = getTenantId(doc);
  if (!tenantId) return doc;

  const tenantRoom = getTenantRoom(tenantId, 'courses');
  const isPublished = doc.isPublished === true;
  const wasPublished = previousDoc?.isPublished === true;

  // Course was just published
  if (isPublished && !wasPublished) {
    const coursePayload: CoursePayload = {
      id: String(doc.id),
      tenantId,
      title: toSafeString(doc.title),
      slug: toSafeString(doc.slug),
      status: 'published',
      action: 'published',
      timestamp: new Date().toISOString(),
    };

    io.to(tenantRoom).emit('course:published', coursePayload);
    console.log(`[SocketHook] Emitted course:published for ${toSafeString(doc.title)}`);
  }

  // Course updated
  if (operation === 'update') {
    const coursePayload: CoursePayload = {
      id: String(doc.id),
      tenantId,
      title: toSafeString(doc.title),
      slug: toSafeString(doc.slug),
      status: isPublished ? 'published' : 'draft',
      action: 'updated',
      timestamp: new Date().toISOString(),
    };

    io.to(tenantRoom).emit('course:updated', coursePayload);
  }

  return doc;
};

// ============================================================================
// GAMIFICATION HOOKS
// ============================================================================

/**
 * Emit badge unlocked event when user earns a badge
 */
export const emitBadgeEarned: CollectionAfterChangeHook<UserBadgeDocument> = ({
  doc,
  operation,
}) => {
  // Only emit on new badge earned
  if (operation !== 'create') return doc;

  const io = getIO();
  if (!io) return doc;

  const tenantId = getTenantId(doc);
  if (!tenantId) return doc;

  const userId = getUserId(doc);
  if (!userId) return doc;

  // Get badge details
  let badgeName = 'Badge';
  let badgeIcon = 'star';

  const badge = doc.badge;
  if (isRecord(badge)) {
    const badgeRef = badge as BadgeReference;
    badgeName = toSafeString(badgeRef.name, 'Badge');
    badgeIcon = toSafeString(badgeRef.icon, 'star');
  }

  const payload: GamificationPayload = {
    tenantId,
    userId,
    totalPoints: 0, // Will be calculated by client
    badge: {
      id: String(doc.id),
      name: badgeName,
      description: `Earned ${badgeName}`,
      icon: badgeIcon,
    },
    timestamp: new Date().toISOString(),
  };

  // Emit to tenant gamification room
  const gamificationRoom = getTenantRoom(tenantId, 'gamification');
  io.to(gamificationRoom).emit('gamification:badge-unlocked', payload);

  // Also notify user
  const notification: NotificationPayload = {
    id: `badge-${String(doc.id)}`,
    type: 'success',
    title: 'Badge Desbloqueado!',
    message: `Has obtenido el badge: ${badgeName}`,
    timestamp: new Date().toISOString(),
    read: false,
    tenantId,
    userId,
  };
  io.to(getUserRoom(userId, 'notifications')).emit('notification:push', notification);

  console.log(`[SocketHook] Emitted gamification:badge-unlocked for user ${userId}`);
  return doc;
};

/**
 * Emit points earned event when points transaction is created
 */
export const emitPointsEarned: CollectionAfterChangeHook<PointsTransactionDocument> = ({
  doc,
  operation,
}) => {
  // Only emit on new transactions
  if (operation !== 'create') return doc;

  const io = getIO();
  if (!io) return doc;

  const tenantId = getTenantId(doc);
  if (!tenantId) return doc;

  const userId = getUserId(doc);
  if (!userId) return doc;

  const points = toSafeNumber(doc.points, 0);
  const reason = toSafeString(doc.reason, 'Puntos ganados');

  if (points <= 0) return doc; // Only emit for positive points

  const payload: GamificationPayload = {
    tenantId,
    userId,
    points,
    totalPoints: 0, // Will be calculated by client
    reason,
    timestamp: new Date().toISOString(),
  };

  // Emit to tenant gamification room
  const gamificationRoom = getTenantRoom(tenantId, 'gamification');
  io.to(gamificationRoom).emit('gamification:points-earned', payload);

  console.log(`[SocketHook] Emitted gamification:points-earned (+${points}) for user ${userId}`);
  return doc;
};

/**
 * Emit streak update event
 */
export const emitStreakUpdate: CollectionAfterChangeHook<StreakDocument> = ({
  doc,
  previousDoc,
}) => {
  const io = getIO();
  if (!io) return doc;

  const tenantId = getTenantId(doc);
  if (!tenantId) return doc;

  const userId = getUserId(doc);
  if (!userId) return doc;

  const currentStreak = toSafeNumber(doc.currentStreak, 0);
  const previousStreak = toSafeNumber(previousDoc?.currentStreak, 0);

  // Only emit if streak changed
  if (currentStreak === previousStreak) return doc;

  const payload: GamificationPayload = {
    tenantId,
    userId,
    totalPoints: 0,
    reason: `Streak update: ${currentStreak} days`,
    timestamp: new Date().toISOString(),
  };

  const gamificationRoom = getTenantRoom(tenantId, 'gamification');
  io.to(gamificationRoom).emit('gamification:points-earned', payload);

  // If streak milestone (7, 14, 30 days), send notification
  if ([7, 14, 30, 60, 100].includes(currentStreak) && currentStreak > previousStreak) {
    const notification: NotificationPayload = {
      id: `streak-${String(doc.id)}-${currentStreak}`,
      type: 'success',
      title: `Racha de ${currentStreak} dias!`,
      message: 'Sigue asi para ganar mas puntos y badges.',
      timestamp: new Date().toISOString(),
      read: false,
      tenantId,
      userId,
    };
    io.to(getUserRoom(userId, 'notifications')).emit('notification:push', notification);
  }

  console.log(`[SocketHook] Emitted streak update (${previousStreak} -> ${currentStreak}) for user ${userId}`);
  return doc;
};

// ============================================================================
// EXPORT ALL HOOKS
// ============================================================================

export const socketHooks = {
  lessonProgress: { afterChange: [emitLessonProgressUpdate] },
  enrollments: { afterChange: [emitEnrollmentUpdate] },
  grades: { afterChange: [emitGradeUpdate] },
  submissions: { afterChange: [emitSubmissionUpdate] },
  courses: { afterChange: [emitCourseUpdate] },
  userBadges: { afterChange: [emitBadgeEarned] },
  pointsTransactions: { afterChange: [emitPointsEarned] },
  userStreaks: { afterChange: [emitStreakUpdate] },
};
