/**
 * @fileoverview Campus API Client Tests
 * Tests for LMS API integration functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchProgress,
  updateLessonProgress,
  fetchModules,
  fetchLessons,
  fetchGamification,
  fetchEnrollments,
  fetchEnrollmentDetail,
  fetchModuleDetail,
} from '../api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Campus API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // PROGRESS API
  // ============================================================================

  describe('fetchProgress', () => {
    const mockProgressData = {
      enrollmentId: 'enroll-123',
      userId: 'user-456',
      courseRunId: 'run-789',
      status: 'in_progress',
      completedLessons: 5,
      totalLessons: 10,
      progressPercent: 50,
      totalTimeSpentMinutes: 120,
      lastAccessAt: '2024-01-15T10:00:00Z',
      lessonProgress: [],
    };

    it('should fetch progress data successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockProgressData }),
      });

      const result = await fetchProgress('enroll-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/lms/progress?enrollmentId=enroll-123')
      );
      expect(result).toEqual(mockProgressData);
    });

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false, error: 'Enrollment not found' }),
      });

      await expect(fetchProgress('invalid')).rejects.toThrow('Enrollment not found');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchProgress('enroll-123')).rejects.toThrow('Network error');
    });
  });

  describe('updateLessonProgress', () => {
    it('should update lesson progress successfully', async () => {
      const updateData = {
        enrollmentId: 'enroll-123',
        lessonId: 'lesson-456',
        isCompleted: true,
        timeSpent: 300,
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: { id: 'progress-789' } }),
      });

      const result = await updateLessonProgress(updateData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/lms/progress'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        })
      );
      expect(result).toEqual({ id: 'progress-789' });
    });

    it('should update video position', async () => {
      const updateData = {
        enrollmentId: 'enroll-123',
        lessonId: 'lesson-456',
        lastPosition: 180, // 3 minutes
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: { lastPosition: 180 } }),
      });

      const result = await updateLessonProgress(updateData);

      expect(result).toEqual({ lastPosition: 180 });
    });

    it('should throw error on validation failure', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false, error: 'Invalid lessonId' }),
      });

      await expect(
        updateLessonProgress({ enrollmentId: 'enroll-123', lessonId: '' })
      ).rejects.toThrow('Invalid lessonId');
    });
  });

  // ============================================================================
  // CONTENT API
  // ============================================================================

  describe('fetchModules', () => {
    const mockModulesData = {
      courseId: 'course-123',
      modules: [
        { id: 'mod-1', title: 'Module 1', order: 1, isPublished: true },
        { id: 'mod-2', title: 'Module 2', order: 2, isPublished: true },
      ],
      totalModules: 2,
    };

    it('should fetch modules for a course', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockModulesData }),
      });

      const result = await fetchModules('course-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/lms/content?courseId=course-123')
      );
      expect(result.modules).toHaveLength(2);
      expect(result.totalModules).toBe(2);
    });

    it('should throw error for invalid course', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false, error: 'Course not found' }),
      });

      await expect(fetchModules('invalid')).rejects.toThrow('Course not found');
    });
  });

  describe('fetchLessons', () => {
    const mockLessonsData = {
      moduleId: 'mod-123',
      lessons: [
        { id: 'les-1', title: 'Lesson 1', type: 'video', order: 1 },
        { id: 'les-2', title: 'Lesson 2', type: 'text', order: 2 },
        { id: 'les-3', title: 'Quiz 1', type: 'quiz', order: 3 },
      ],
      totalLessons: 3,
    };

    it('should fetch lessons for a module', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockLessonsData }),
      });

      const result = await fetchLessons('mod-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/lms/content?moduleId=mod-123')
      );
      expect(result.lessons).toHaveLength(3);
    });

    it('should include different lesson types', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockLessonsData }),
      });

      const result = await fetchLessons('mod-123');

      const types = result.lessons!.map((l: any) => l.type);
      expect(types).toContain('video');
      expect(types).toContain('text');
      expect(types).toContain('quiz');
    });
  });

  // ============================================================================
  // GAMIFICATION API
  // ============================================================================

  describe('fetchGamification', () => {
    const mockGamificationData = {
      userId: 'user-123',
      badges: [
        { id: 'badge-1', name: 'First Course', icon: '🏆' },
        { id: 'badge-2', name: '7-Day Streak', icon: '🔥' },
      ],
      totalBadges: 2,
      totalPoints: 1500,
      recentTransactions: [
        { id: 'tx-1', points: 100, reason: 'Lesson completed' },
      ],
      streak: {
        currentStreak: 5,
        longestStreak: 12,
        lastActivityAt: '2024-01-15T10:00:00Z',
      },
    };

    it('should fetch gamification data', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockGamificationData }),
      });

      const result = await fetchGamification('user-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/lms/gamification?userId=user-123')
      );
      expect(result.totalPoints).toBe(1500);
      expect(result.badges).toHaveLength(2);
    });

    it('should include streak information', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockGamificationData }),
      });

      const result = await fetchGamification('user-123');

      expect(result.streak.currentStreak).toBe(5);
      expect(result.streak.longestStreak).toBe(12);
    });

    it('should handle user with no badges', async () => {
      const emptyData = {
        ...mockGamificationData,
        badges: [],
        totalBadges: 0,
        totalPoints: 0,
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: emptyData }),
      });

      const result = await fetchGamification('new-user');

      expect(result.badges).toHaveLength(0);
      expect(result.totalPoints).toBe(0);
    });
  });

  // ============================================================================
  // ENROLLMENT API
  // ============================================================================

  describe('fetchEnrollments', () => {
    const mockEnrollments = [
      {
        id: 'enroll-1',
        status: 'active',
        enrolledAt: '2024-01-01T00:00:00Z',
        courseRun: {
          id: 'run-1',
          title: 'Spring 2024',
          course: { id: 'course-1', title: 'Web Development', thumbnail: null },
        },
        progress: { completed: 3, total: 10, percent: 30 },
      },
      {
        id: 'enroll-2',
        status: 'completed',
        enrolledAt: '2023-06-01T00:00:00Z',
        courseRun: {
          id: 'run-2',
          title: 'Summer 2023',
          course: { id: 'course-2', title: 'JavaScript Basics', thumbnail: null },
        },
        progress: { completed: 8, total: 8, percent: 100 },
      },
    ];

    it('should fetch all enrollments', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockEnrollments,
            meta: { total: 2, page: 1, limit: 10 },
          }),
      });

      const result = await fetchEnrollments();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/lms/enrollments'),
        expect.objectContaining({ credentials: 'include' })
      );
      expect(result.data).toHaveLength(2);
    });

    it('should filter by status', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: [mockEnrollments[0]],
            meta: { total: 1 },
          }),
      });

      const result = await fetchEnrollments({ status: 'active' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=active'),
        expect.any(Object)
      );
      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe('active');
    });

    it('should support pagination', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: [],
            meta: { total: 25, page: 3, limit: 10 },
          }),
      });

      await fetchEnrollments({ page: 3, limit: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/page=3.*limit=10|limit=10.*page=3/),
        expect.any(Object)
      );
    });

    it('should filter by userId', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            data: mockEnrollments,
            meta: { total: 2 },
          }),
      });

      await fetchEnrollments({ userId: 'user-123' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('userId=user-123'),
        expect.any(Object)
      );
    });
  });

  describe('fetchEnrollmentDetail', () => {
    const mockEnrollmentDetail = {
      enrollment: {
        id: 'enroll-123',
        status: 'active',
        enrolledAt: '2024-01-01T00:00:00Z',
        startedAt: '2024-01-02T00:00:00Z',
      },
      course: {
        id: 'course-1',
        title: 'Web Development',
        slug: 'web-development',
        description: 'Learn web development',
      },
      courseRun: {
        id: 'run-1',
        title: 'Spring 2024',
        startDate: '2024-01-01',
        endDate: '2024-06-30',
        status: 'active',
      },
      modules: [
        {
          id: 'mod-1',
          title: 'Introduction',
          order: 1,
          lessons: [
            { id: 'les-1', title: 'Welcome', order: 1, progress: { status: 'completed', progressPercent: 100 } },
            { id: 'les-2', title: 'Setup', order: 2, progress: { status: 'in_progress', progressPercent: 50 } },
          ],
          lessonsCount: 2,
        },
      ],
      progress: {
        totalModules: 1,
        totalLessons: 2,
        completedLessons: 1,
        progressPercent: 50,
        status: 'in_progress',
      },
    };

    it('should fetch enrollment detail', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockEnrollmentDetail }),
      });

      const result = await fetchEnrollmentDetail('enroll-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/lms/enrollments/enroll-123'),
        expect.objectContaining({ credentials: 'include' })
      );
      expect(result.enrollment.id).toBe('enroll-123');
      expect(result.modules).toHaveLength(1);
    });

    it('should include course information', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockEnrollmentDetail }),
      });

      const result = await fetchEnrollmentDetail('enroll-123');

      expect(result.course?.title).toBe('Web Development');
      expect(result.courseRun?.title).toBe('Spring 2024');
    });

    it('should include module lessons with progress', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockEnrollmentDetail }),
      });

      const result = await fetchEnrollmentDetail('enroll-123');

      const firstModule = result.modules[0];
      expect(firstModule.lessons).toHaveLength(2);
      expect(firstModule.lessons[0].progress.status).toBe('completed');
    });

    it('should throw error for invalid enrollment', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false, error: 'Enrollment not found' }),
      });

      await expect(fetchEnrollmentDetail('invalid')).rejects.toThrow('Enrollment not found');
    });
  });

  describe('fetchModuleDetail', () => {
    const mockModuleDetail = {
      id: 'mod-123',
      title: 'JavaScript Fundamentals',
      description: 'Learn JavaScript basics',
      order: 1,
      lessons: [
        { id: 'les-1', title: 'Variables', type: 'video', duration: 600 },
        { id: 'les-2', title: 'Functions', type: 'video', duration: 900 },
      ],
      materials: [
        { id: 'mat-1', title: 'Slides', type: 'pdf' },
      ],
    };

    it('should fetch module detail without enrollment', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockModuleDetail }),
      });

      const result = await fetchModuleDetail('mod-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/lms/modules/mod-123'),
        expect.objectContaining({ credentials: 'include' })
      );
      expect(result.title).toBe('JavaScript Fundamentals');
    });

    it('should fetch module detail with enrollment context', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockModuleDetail }),
      });

      await fetchModuleDetail('mod-123', 'enroll-456');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('enrollmentId=enroll-456'),
        expect.any(Object)
      );
    });

    it('should include lessons and materials', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockModuleDetail }),
      });

      const result = await fetchModuleDetail('mod-123');

      expect(result.lessons).toHaveLength(2);
      expect(result.materials).toHaveLength(1);
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle network timeout', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'));

      await expect(fetchProgress('enroll-123')).rejects.toThrow('Request timeout');
    });

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.reject(new Error('Unexpected token')),
      });

      await expect(fetchProgress('enroll-123')).rejects.toThrow('Unexpected token');
    });

    it('should handle server error (500)', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false, error: 'Internal server error' }),
      });

      await expect(fetchEnrollments()).rejects.toThrow('Internal server error');
    });

    it('should handle unauthorized error', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false, error: 'Unauthorized' }),
      });

      await expect(fetchEnrollments()).rejects.toThrow('Unauthorized');
    });
  });

  // ============================================================================
  // API BASE URL
  // ============================================================================

  describe('API Base URL', () => {
    it('should use default localhost URL', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: {} }),
      });

      await fetchProgress('test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/^http:\/\/localhost:\d+\/api/),
      );
    });

    it('should include credentials for enrollment endpoints', async () => {
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: [], meta: {} }),
      });

      await fetchEnrollments();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ credentials: 'include' })
      );
    });
  });
});

// ============================================================================
// TYPE TESTS (compile-time validation)
// ============================================================================

describe('Type Definitions', () => {
  it('should export ProgressData interface', () => {
    const progress: import('../api').ProgressData = {
      enrollmentId: 'e1',
      userId: 'u1',
      courseRunId: 'cr1',
      status: 'active',
      completedLessons: 0,
      totalLessons: 10,
      progressPercent: 0,
      totalTimeSpentMinutes: 0,
      lastAccessAt: null,
      lessonProgress: [],
    };
    expect(progress).toBeDefined();
  });

  it('should export ModuleData interface', () => {
    const module: import('../api').ModuleData = {
      id: 'm1',
      title: 'Test Module',
      slug: 'test-module',
      order: 1,
      isPublished: true,
    };
    expect(module).toBeDefined();
  });

  it('should export LessonData interface', () => {
    const lesson: import('../api').LessonData = {
      id: 'l1',
      title: 'Test Lesson',
      slug: 'test-lesson',
      type: 'video',
      order: 1,
      isPublished: true,
      isFree: false,
    };
    expect(lesson).toBeDefined();
  });

  it('should export GamificationData interface', () => {
    const gamification: import('../api').GamificationData = {
      userId: 'u1',
      badges: [],
      totalBadges: 0,
      totalPoints: 0,
      recentTransactions: [],
      streak: { currentStreak: 0, longestStreak: 0 },
    };
    expect(gamification).toBeDefined();
  });

  it('should export EnrollmentData interface', () => {
    const enrollment: import('../api').EnrollmentData = {
      id: 'e1',
      status: 'active',
      enrolledAt: '2024-01-01',
      courseRun: null,
      progress: { completed: 0, total: 10, percent: 0 },
    };
    expect(enrollment).toBeDefined();
  });
});
