'use client';

/**
 * useCourseProgress Hook
 *
 * Real-time course progress tracking for Campus LMS.
 * Subscribes to progress updates via WebSocket.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSocketContextOptional } from '@akademate/realtime/context';

// ============================================================================
// TYPES
// ============================================================================

export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  progressPercent: number;
  timeSpent: number; // seconds
  lastAccessed: string;
}

export interface ModuleProgress {
  moduleId: string;
  lessonsCompleted: number;
  lessonsTotal: number;
  progressPercent: number;
}

export interface CourseProgress {
  enrollmentId: string;
  courseId: string;
  overallProgress: number;
  modulesCompleted: number;
  modulesTotal: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  timeSpent: number; // total seconds
  lastActivity: string;
  modules: ModuleProgress[];
  lessons: Record<string, LessonProgress>;
}

// ============================================================================
// HOOK
// ============================================================================

export interface UseCourseProgressOptions {
  enrollmentId: string;
  enableRealtime?: boolean;
}

export interface UseCourseProgressReturn {
  progress: CourseProgress | null;
  loading: boolean;
  isConnected: boolean;
  lastUpdate: Date | null;
  updateLessonProgress: (lessonId: string, data: Partial<LessonProgress>) => void;
  markLessonComplete: (lessonId: string) => void;
  refresh: () => void;
}

export function useCourseProgress(
  options: UseCourseProgressOptions
): UseCourseProgressReturn {
  const { enrollmentId, enableRealtime = true } = options;

  // Get socket context (optional - returns null if not in provider)
  const socketContext = useSocketContextOptional();
  const socket = socketContext?.socket ?? null;
  const isConnected = socketContext?.isConnected ?? false;

  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);

  // Fetch initial progress from API
  const fetchProgress = useCallback(async () => {
    if (!enrollmentId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/lms/progress?enrollmentId=${enrollmentId}`);

      if (response.ok) {
        const data = await response.json();
        setProgress(data.progress || null);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('[useCourseProgress] Failed to fetch progress:', error);
    } finally {
      setLoading(false);
    }
  }, [enrollmentId]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Update lesson progress (optimistic + emit)
  const updateLessonProgress = useCallback(
    (lessonId: string, data: Partial<LessonProgress>) => {
      // Optimistic update
      setProgress((prev) => {
        if (!prev) return prev;

        const existingLesson = prev.lessons[lessonId] || {
          lessonId,
          completed: false,
          progressPercent: 0,
          timeSpent: 0,
          lastAccessed: new Date().toISOString(),
        };

        const updatedLesson: LessonProgress = {
          ...existingLesson,
          ...data,
          lessonId,
          completed: data.completed ?? existingLesson.completed,
          progressPercent: data.progressPercent ?? existingLesson.progressPercent,
          timeSpent: data.timeSpent ?? existingLesson.timeSpent,
          lastAccessed: new Date().toISOString(),
        };

        const updatedLessons = {
          ...prev.lessons,
          [lessonId]: updatedLesson,
        };

        // Recalculate totals
        const completedLessons = Object.values(updatedLessons).filter(l => l.completed).length;
        const totalLessons = Object.keys(updatedLessons).length;

        return {
          ...prev,
          lessons: updatedLessons,
          lessonsCompleted: completedLessons,
          overallProgress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
          lastActivity: new Date().toISOString(),
        };
      });

      // Emit to server (cast to any for custom events not in strict types)
      if (socket && isConnected) {
        (socket as any).emit('progress:update', {
          enrollmentId,
          lessonId,
          ...data,
        });
      }

      setLastUpdate(new Date());
    },
    [socket, isConnected, enrollmentId]
  );

  // Mark lesson as complete (convenience method)
  const markLessonComplete = useCallback(
    (lessonId: string) => {
      updateLessonProgress(lessonId, {
        completed: true,
        progressPercent: 100,
      });

      // Emit completion event for gamification (cast to any for custom events)
      if (socket && isConnected) {
        (socket as any).emit('lesson:completed', {
          enrollmentId,
          lessonId,
          completedAt: new Date().toISOString(),
        });
      }
    },
    [updateLessonProgress, socket, isConnected, enrollmentId]
  );

  // Initialize - fetch progress
  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Subscribe to real-time progress updates
  useEffect(() => {
    if (!socket || !enableRealtime || !enrollmentId) return;

    const room = `enrollment:${enrollmentId}:progress`;

    // Subscribe to enrollment progress room
    socket.emit('subscribe:room', room, (success: boolean) => {
      if (success) {
        console.log('[useCourseProgress] Subscribed to real-time updates');
      }
    });

    // Handle progress updates from server
    const handleProgressUpdate = (payload: {
      enrollmentId: string;
      lessonId?: string;
      progress?: Partial<CourseProgress>;
      lessonProgress?: Partial<LessonProgress>;
    }) => {
      if (payload.enrollmentId !== enrollmentId) return;

      setProgress((prev) => {
        if (!prev) return prev;

        // Update overall progress if provided
        if (payload.progress) {
          return {
            ...prev,
            ...payload.progress,
            lastActivity: new Date().toISOString(),
          };
        }

        // Update specific lesson progress
        if (payload.lessonId && payload.lessonProgress) {
          const existingLesson = prev.lessons[payload.lessonId] || {
            lessonId: payload.lessonId,
            completed: false,
            progressPercent: 0,
            timeSpent: 0,
            lastAccessed: new Date().toISOString(),
          };

          const updatedLesson: LessonProgress = {
            ...existingLesson,
            completed: payload.lessonProgress.completed ?? existingLesson.completed,
            progressPercent: payload.lessonProgress.progressPercent ?? existingLesson.progressPercent,
            timeSpent: payload.lessonProgress.timeSpent ?? existingLesson.timeSpent,
            lastAccessed: payload.lessonProgress.lastAccessed ?? new Date().toISOString(),
            lessonId: payload.lessonId,
          };

          return {
            ...prev,
            lessons: {
              ...prev.lessons,
              [payload.lessonId]: updatedLesson,
            },
            lastActivity: new Date().toISOString(),
          };
        }

        return prev;
      });

      setLastUpdate(new Date());
    };

    socket.on('progress:updated', handleProgressUpdate);

    return () => {
      socket.emit('unsubscribe:room', room);
      socket.off('progress:updated', handleProgressUpdate);
    };
  }, [socket, enableRealtime, enrollmentId]);

  return {
    progress,
    loading,
    isConnected,
    lastUpdate,
    updateLessonProgress,
    markLessonComplete,
    refresh,
  };
}
