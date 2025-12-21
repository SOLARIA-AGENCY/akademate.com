/**
 * Socket.io Event Emission Hooks
 *
 * afterChange hooks that emit Socket.io events when LMS data changes.
 * Used to provide real-time updates to connected clients (Campus, Dashboards).
 */

import type {
  CollectionAfterChangeHook,
} from 'payload';
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
function getTenantId(doc: Record<string, unknown>): number | null {
  if (typeof doc.tenant === 'number') return doc.tenant;
  if (typeof doc.tenant === 'object' && doc.tenant !== null) {
    return (doc.tenant as { id?: number }).id ?? null;
  }
  return null;
}

/**
 * Extract user ID from document
 */
function getUserId(doc: Record<string, unknown>): string | null {
  if (typeof doc.user === 'string') return doc.user;
  if (typeof doc.user === 'object' && doc.user !== null) {
    return String((doc.user as { id?: string | number }).id ?? '');
  }
  return null;
}

// ============================================================================
// LESSON PROGRESS HOOKS
// ============================================================================

/**
 * Emit progress:updated event when lesson progress changes
 */
export const emitLessonProgressUpdate: CollectionAfterChangeHook = async ({
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

  if (typeof doc.enrollment === 'object' && doc.enrollment !== null) {
    const enrollment = doc.enrollment as Record<string, unknown>;
    enrollmentId = String(enrollment.id ?? '');
    userId = getUserId(enrollment);
    if (typeof enrollment.courseRun === 'object' && enrollment.courseRun !== null) {
      const courseRun = enrollment.courseRun as Record<string, unknown>;
      if (typeof courseRun.course === 'object' && courseRun.course !== null) {
        courseId = String((courseRun.course as { id?: string | number }).id ?? '');
      }
    }
  } else if (typeof doc.enrollment === 'string') {
    enrollmentId = doc.enrollment;
  }

  // Build progress payload
  const lessonId = typeof doc.lesson === 'object'
    ? String((doc.lesson as { id?: string | number }).id ?? '')
    : String(doc.lesson ?? '');

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
export const emitEnrollmentUpdate: CollectionAfterChangeHook = async ({
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
  const status = String(doc.status ?? 'pending');
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
      if (typeof doc.courseRun === 'object' && doc.courseRun !== null) {
        const courseRun = doc.courseRun as Record<string, unknown>;
        if (typeof courseRun.course === 'object' && courseRun.course !== null) {
          courseId = String((courseRun.course as { id?: string | number }).id ?? '');
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
export const emitGradeUpdate: CollectionAfterChangeHook = async ({
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

  if (typeof doc.submission === 'object' && doc.submission !== null) {
    const submission = doc.submission as Record<string, unknown>;

    if (typeof submission.enrollment === 'object' && submission.enrollment !== null) {
      const enrollment = submission.enrollment as Record<string, unknown>;
      userId = getUserId(enrollment);
    }

    if (typeof submission.assignment === 'object' && submission.assignment !== null) {
      const assignment = submission.assignment as Record<string, unknown>;
      assignmentTitle = String(assignment.title ?? 'Tarea');
    }
  }

  if (userId) {
    const userRoom = getUserRoom(userId, 'notifications');

    const score = Number(doc.score ?? 0);
    const maxScore = Number(doc.maxScore ?? 100);
    const percentage = Math.round((score / maxScore) * 100);
    const passed = doc.isPass === true;

    const notification: NotificationPayload = {
      id: `grade-${doc.id}`,
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
          id: `perfect-${doc.id}`,
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
export const emitSubmissionUpdate: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
}) => {
  const io = getIO();
  if (!io) return doc;

  const tenantId = getTenantId(doc);
  if (!tenantId) return doc;

  const status = String(doc.status ?? 'draft');
  const previousStatus = previousDoc?.status;

  // Only emit on status changes
  if (status === previousStatus) return doc;

  // Get enrollment to find user
  let userId: string | null = null;

  if (typeof doc.enrollment === 'object' && doc.enrollment !== null) {
    const enrollment = doc.enrollment as Record<string, unknown>;
    userId = getUserId(enrollment);
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
    id: `submission-${doc.id}-${status}`,
    type: statusInfo.type,
    title: 'Actualizacion de Entrega',
    message: statusInfo.message,
    timestamp: new Date().toISOString(),
    read: false,
    tenantId,
    userId,
  };

  io.to(userRoom).emit('notification:push', notification);
  console.log(`[SocketHook] Emitted notification:push for submission ${doc.id} to user ${userId}`);

  // If just submitted, also emit activity for dashboard
  if (status === 'submitted') {
    const tenantRoom = getTenantRoom(tenantId, 'lms');

    const activity: ActivityPayload = {
      id: `submission-${doc.id}`,
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
export const emitCourseUpdate: CollectionAfterChangeHook = async ({
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
      title: String(doc.title ?? ''),
      slug: String(doc.slug ?? ''),
      status: 'published',
      action: 'published',
      timestamp: new Date().toISOString(),
    };

    io.to(tenantRoom).emit('course:published', coursePayload);
    console.log(`[SocketHook] Emitted course:published for ${doc.title}`);
  }

  // Course updated
  if (operation === 'update') {
    const coursePayload: CoursePayload = {
      id: String(doc.id),
      tenantId,
      title: String(doc.title ?? ''),
      slug: String(doc.slug ?? ''),
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
export const emitBadgeEarned: CollectionAfterChangeHook = async ({
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

  if (typeof doc.badge === 'object' && doc.badge !== null) {
    const badge = doc.badge as Record<string, unknown>;
    badgeName = String(badge.name ?? 'Badge');
    badgeIcon = String(badge.icon ?? 'star');
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
    id: `badge-${doc.id}`,
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
export const emitPointsEarned: CollectionAfterChangeHook = async ({
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

  const points = Number(doc.points ?? 0);
  const reason = String(doc.reason ?? 'Puntos ganados');

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
export const emitStreakUpdate: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
}) => {
  const io = getIO();
  if (!io) return doc;

  const tenantId = getTenantId(doc);
  if (!tenantId) return doc;

  const userId = getUserId(doc);
  if (!userId) return doc;

  const currentStreak = Number(doc.currentStreak ?? 0);
  const previousStreak = Number(previousDoc?.currentStreak ?? 0);

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
      id: `streak-${doc.id}-${currentStreak}`,
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
