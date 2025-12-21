/**
 * @fileoverview useCourseProgress Hook Tests
 * Tests for real-time course progress tracking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCourseProgress } from '../useCourseProgress';

// Mock socket context
vi.mock('@akademate/realtime/context', () => ({
  useSocketContextOptional: () => mockSocketContext,
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Socket mock
let mockSocketContext: {
  socket: any;
  isConnected: boolean;
} | null = null;

const createMockSocket = () => ({
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
});

describe('useCourseProgress', () => {
  let mockSocket: ReturnType<typeof createMockSocket>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket = createMockSocket();
    mockSocketContext = null;

    // Default successful API response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          progress: {
            enrollmentId: 'enroll-123',
            courseId: 'course-456',
            overallProgress: 50,
            modulesCompleted: 1,
            modulesTotal: 2,
            lessonsCompleted: 5,
            lessonsTotal: 10,
            timeSpent: 3600,
            lastActivity: '2024-01-15T10:00:00Z',
            modules: [],
            lessons: {},
          },
        }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  describe('Initialization', () => {
    it('should start with loading state', () => {
      const { result } = renderHook(() =>
        useCourseProgress({ enrollmentId: 'enroll-123' })
      );

      expect(result.current.loading).toBe(true);
      expect(result.current.progress).toBeNull();
    });

    it('should fetch progress on mount', async () => {
      const { result } = renderHook(() =>
        useCourseProgress({ enrollmentId: 'enroll-123' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/lms/progress?enrollmentId=enroll-123')
      );
    });

    it('should set progress after successful fetch', async () => {
      const { result } = renderHook(() =>
        useCourseProgress({ enrollmentId: 'enroll-123' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.progress).toBeTruthy();
      expect(result.current.progress?.enrollmentId).toBe('enroll-123');
      expect(result.current.progress?.overallProgress).toBe(50);
    });

    it('should not fetch if enrollmentId is empty', async () => {
      renderHook(() => useCourseProgress({ enrollmentId: '' }));

      // Wait a bit to ensure no fetch was made
      await new Promise((r) => setTimeout(r, 100));

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle fetch error gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        useCourseProgress({ enrollmentId: 'enroll-123' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.progress).toBeNull();
    });

    it('should handle non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const { result } = renderHook(() =>
        useCourseProgress({ enrollmentId: 'invalid' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.progress).toBeNull();
    });
  });

  // ============================================================================
  // CONNECTION STATUS
  // ============================================================================

  describe('Connection Status', () => {
    it('should report disconnected when no socket context', async () => {
      mockSocketContext = null;

      const { result } = renderHook(() =>
        useCourseProgress({ enrollmentId: 'enroll-123' })
      );

      expect(result.current.isConnected).toBe(false);
    });

    it('should report connected when socket is connected', async () => {
      mockSocketContext = {
        socket: mockSocket,
        isConnected: true,
      };

      const { result } = renderHook(() =>
        useCourseProgress({ enrollmentId: 'enroll-123' })
      );

      expect(result.current.isConnected).toBe(true);
    });
  });

  // ============================================================================
  // LESSON PROGRESS UPDATES
  // ============================================================================

  describe('updateLessonProgress', () => {
    it('should perform optimistic update', async () => {
      mockSocketContext = { socket: mockSocket, isConnected: true };

      const { result } = renderHook(() =>
        useCourseProgress({ enrollmentId: 'enroll-123' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateLessonProgress('lesson-1', {
          progressPercent: 75,
          timeSpent: 300,
        });
      });

      expect(result.current.progress?.lessons['lesson-1']).toBeDefined();
      expect(result.current.progress?.lessons['lesson-1'].progressPercent).toBe(75);
    });

    it('should emit socket event when connected', async () => {
      mockSocketContext = { socket: mockSocket, isConnected: true };

      const { result } = renderHook(() =>
        useCourseProgress({ enrollmentId: 'enroll-123' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateLessonProgress('lesson-1', { progressPercent: 50 });
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('progress:update', {
        enrollmentId: 'enroll-123',
        lessonId: 'lesson-1',
        progressPercent: 50,
      });
    });

    it('should not emit when disconnected', async () => {
      mockSocketContext = { socket: mockSocket, isConnected: false };

      const { result } = renderHook(() =>
        useCourseProgress({ enrollmentId: 'enroll-123' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateLessonProgress('lesson-1', { progressPercent: 50 });
      });

      // Should only have subscribe:room emit from initialization
      expect(mockSocket.emit).not.toHaveBeenCalledWith('progress:update', expect.any(Object));
    });

    it('should update lastUpdate timestamp', async () => {
      const { result } = renderHook(() =>
        useCourseProgress({ enrollmentId: 'enroll-123' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const beforeUpdate = result.current.lastUpdate;

      // Wait a tick
      await new Promise((r) => setTimeout(r, 10));

      act(() => {
        result.current.updateLessonProgress('lesson-1', { progressPercent: 50 });
      });

      expect(result.current.lastUpdate).not.toEqual(beforeUpdate);
    });
  });

  // ============================================================================
  // MARK LESSON COMPLETE
  // ============================================================================

  describe('markLessonComplete', () => {
    it('should set lesson as completed with 100% progress', async () => {
      mockSocketContext = { socket: mockSocket, isConnected: true };

      const { result } = renderHook(() =>
        useCourseProgress({ enrollmentId: 'enroll-123' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.markLessonComplete('lesson-1');
      });

      expect(result.current.progress?.lessons['lesson-1'].completed).toBe(true);
      expect(result.current.progress?.lessons['lesson-1'].progressPercent).toBe(100);
    });

    it('should emit lesson:completed event', async () => {
      mockSocketContext = { socket: mockSocket, isConnected: true };

      const { result } = renderHook(() =>
        useCourseProgress({ enrollmentId: 'enroll-123' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.markLessonComplete('lesson-1');
      });

      expect(mockSocket.emit).toHaveBeenCalledWith('lesson:completed', {
        enrollmentId: 'enroll-123',
        lessonId: 'lesson-1',
        completedAt: expect.any(String),
      });
    });

    it('should recalculate overall progress', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            progress: {
              enrollmentId: 'enroll-123',
              courseId: 'course-456',
              overallProgress: 0,
              lessonsCompleted: 0,
              lessonsTotal: 2,
              lessons: {},
            },
          }),
      });

      mockSocketContext = { socket: mockSocket, isConnected: true };

      const { result } = renderHook(() =>
        useCourseProgress({ enrollmentId: 'enroll-123' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.markLessonComplete('lesson-1');
      });

      expect(result.current.progress?.lessonsCompleted).toBe(1);
    });
  });

  // ============================================================================
  // REFRESH
  // ============================================================================

  describe('refresh', () => {
    it('should re-fetch progress data', async () => {
      const { result } = renderHook(() =>
        useCourseProgress({ enrollmentId: 'enroll-123' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.refresh();
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    it('should set loading state during refresh', async () => {
      const { result } = renderHook(() =>
        useCourseProgress({ enrollmentId: 'enroll-123' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Delay the response
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ progress: null }),
                }),
              100
            )
          )
      );

      act(() => {
        result.current.refresh();
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  describe('Real-time Subscriptions', () => {
    it('should subscribe to progress room when socket connected', async () => {
      mockSocketContext = { socket: mockSocket, isConnected: true };

      renderHook(() =>
        useCourseProgress({ enrollmentId: 'enroll-123', enableRealtime: true })
      );

      await waitFor(() => {
        expect(mockSocket.emit).toHaveBeenCalledWith(
          'subscribe:room',
          'enrollment:enroll-123:progress',
          expect.any(Function)
        );
      });
    });

    it('should not subscribe when enableRealtime is false', async () => {
      mockSocketContext = { socket: mockSocket, isConnected: true };

      renderHook(() =>
        useCourseProgress({ enrollmentId: 'enroll-123', enableRealtime: false })
      );

      // Wait a bit
      await new Promise((r) => setTimeout(r, 100));

      expect(mockSocket.emit).not.toHaveBeenCalledWith(
        'subscribe:room',
        expect.any(String),
        expect.any(Function)
      );
    });

    it('should listen for progress:updated events', async () => {
      mockSocketContext = { socket: mockSocket, isConnected: true };

      renderHook(() =>
        useCourseProgress({ enrollmentId: 'enroll-123', enableRealtime: true })
      );

      await waitFor(() => {
        expect(mockSocket.on).toHaveBeenCalledWith(
          'progress:updated',
          expect.any(Function)
        );
      });
    });

    it('should unsubscribe on unmount', async () => {
      mockSocketContext = { socket: mockSocket, isConnected: true };

      const { unmount } = renderHook(() =>
        useCourseProgress({ enrollmentId: 'enroll-123', enableRealtime: true })
      );

      await waitFor(() => {
        expect(mockSocket.on).toHaveBeenCalled();
      });

      unmount();

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'unsubscribe:room',
        'enrollment:enroll-123:progress'
      );
      expect(mockSocket.off).toHaveBeenCalledWith(
        'progress:updated',
        expect.any(Function)
      );
    });
  });

  // ============================================================================
  // REAL-TIME UPDATES
  // ============================================================================

  describe('Real-time Update Handling', () => {
    it('should update progress on progress:updated event', async () => {
      mockSocketContext = { socket: mockSocket, isConnected: true };

      const { result } = renderHook(() =>
        useCourseProgress({ enrollmentId: 'enroll-123', enableRealtime: true })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Get the handler registered for progress:updated
      const onCall = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'progress:updated'
      );
      expect(onCall).toBeDefined();

      const handler = onCall![1];

      // Simulate receiving a real-time update
      act(() => {
        handler({
          enrollmentId: 'enroll-123',
          progress: {
            overallProgress: 75,
            lessonsCompleted: 7,
          },
        });
      });

      expect(result.current.progress?.overallProgress).toBe(75);
      expect(result.current.progress?.lessonsCompleted).toBe(7);
    });

    it('should update lesson progress on lesson-specific update', async () => {
      mockSocketContext = { socket: mockSocket, isConnected: true };

      const { result } = renderHook(() =>
        useCourseProgress({ enrollmentId: 'enroll-123', enableRealtime: true })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const onCall = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'progress:updated'
      );
      const handler = onCall![1];

      act(() => {
        handler({
          enrollmentId: 'enroll-123',
          lessonId: 'lesson-5',
          lessonProgress: {
            completed: true,
            progressPercent: 100,
          },
        });
      });

      expect(result.current.progress?.lessons['lesson-5']).toBeDefined();
      expect(result.current.progress?.lessons['lesson-5'].completed).toBe(true);
    });

    it('should ignore updates for different enrollment', async () => {
      mockSocketContext = { socket: mockSocket, isConnected: true };

      const { result } = renderHook(() =>
        useCourseProgress({ enrollmentId: 'enroll-123', enableRealtime: true })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const originalProgress = result.current.progress?.overallProgress;

      const onCall = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'progress:updated'
      );
      const handler = onCall![1];

      act(() => {
        handler({
          enrollmentId: 'different-enrollment',
          progress: { overallProgress: 100 },
        });
      });

      expect(result.current.progress?.overallProgress).toBe(originalProgress);
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle missing socket gracefully', async () => {
      mockSocketContext = null;

      const { result } = renderHook(() =>
        useCourseProgress({ enrollmentId: 'enroll-123' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should work without socket
      act(() => {
        result.current.updateLessonProgress('lesson-1', { progressPercent: 50 });
      });

      expect(result.current.progress?.lessons['lesson-1']).toBeDefined();
    });

    it('should handle empty progress response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ progress: null }),
      });

      const { result } = renderHook(() =>
        useCourseProgress({ enrollmentId: 'enroll-123' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.progress).toBeNull();
    });

    it('should handle enrollmentId change', async () => {
      const { result, rerender } = renderHook(
        ({ enrollmentId }) => useCourseProgress({ enrollmentId }),
        { initialProps: { enrollmentId: 'enroll-123' } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Change enrollment
      rerender({ enrollmentId: 'enroll-456' });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining('enrollmentId=enroll-456')
      );
    });
  });
});
