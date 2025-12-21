/**
 * @fileoverview useGamification Hook Tests
 * Tests for real-time gamification tracking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useGamification } from '../useGamification';

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

describe('useGamification', () => {
  let mockSocket: ReturnType<typeof createMockSocket>;

  const mockGamificationData = {
    userId: 'user-123',
    points: 1500,
    level: 5,
    levelProgress: 60,
    pointsToNextLevel: 200,
    currentStreak: 7,
    longestStreak: 12,
    badges: [
      {
        id: 'badge-1',
        name: 'First Steps',
        description: 'Complete your first lesson',
        icon: '🎯',
        earnedAt: '2024-01-01T00:00:00Z',
        rarity: 'common',
      },
    ],
    recentAchievements: [],
    rank: 15,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket = createMockSocket();
    mockSocketContext = null;

    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          gamification: mockGamificationData,
          leaderboard: [
            { userId: 'user-1', userName: 'Alice', points: 2000, level: 7, rank: 1 },
            { userId: 'user-123', userName: 'You', points: 1500, level: 5, rank: 2 },
          ],
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
        useGamification({ userId: 'user-123' })
      );

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeNull();
    });

    it('should fetch gamification on mount', async () => {
      const { result } = renderHook(() =>
        useGamification({ userId: 'user-123' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/lms/gamification?userId=user-123')
      );
    });

    it('should set data after successful fetch', async () => {
      const { result } = renderHook(() =>
        useGamification({ userId: 'user-123' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBeTruthy();
      expect(result.current.data?.points).toBe(1500);
      expect(result.current.data?.level).toBe(5);
    });

    it('should fetch with courseId filter', async () => {
      renderHook(() =>
        useGamification({ userId: 'user-123', courseId: 'course-456' })
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringMatching(/userId=user-123.*courseId=course-456|courseId=course-456.*userId=user-123/)
        );
      });
    });

    it('should not fetch without userId', async () => {
      const { result } = renderHook(() => useGamification({}));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // LEADERBOARD
  // ============================================================================

  describe('Leaderboard', () => {
    it('should load leaderboard data', async () => {
      const { result } = renderHook(() =>
        useGamification({ userId: 'user-123' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.leaderboard).toHaveLength(2);
      expect(result.current.leaderboard[0].rank).toBe(1);
    });

    it('should include user in leaderboard', async () => {
      const { result } = renderHook(() =>
        useGamification({ userId: 'user-123' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const userEntry = result.current.leaderboard.find(e => e.userId === 'user-123');
      expect(userEntry).toBeDefined();
      expect(userEntry?.rank).toBe(2);
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle fetch error gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        useGamification({ userId: 'user-123' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should use default gamification
      expect(result.current.data).toBeTruthy();
      expect(result.current.data?.points).toBe(0);
    });

    it('should handle non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const { result } = renderHook(() =>
        useGamification({ userId: 'user-123' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBeNull();
    });
  });

  // ============================================================================
  // ANIMATIONS
  // ============================================================================

  describe('Points Animations', () => {
    it('should start with no pending animations', async () => {
      const { result } = renderHook(() =>
        useGamification({ userId: 'user-123' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.pendingAnimations).toHaveLength(0);
    });

    it('should dismiss animation by id', async () => {
      mockSocketContext = { socket: mockSocket, isConnected: true };

      const { result } = renderHook(() =>
        useGamification({ userId: 'user-123', showAnimations: true })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Simulate receiving points:awarded event
      const onCall = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'points:awarded'
      );

      if (onCall) {
        const handler = onCall[1];
        act(() => {
          handler({
            userId: 'user-123',
            points: 100,
            reason: 'Lesson completed',
            newTotal: 1600,
          });
        });

        // Should have animation
        expect(result.current.pendingAnimations.length).toBeGreaterThan(0);

        const animationId = result.current.pendingAnimations[0].id;

        act(() => {
          result.current.dismissAnimation(animationId);
        });

        expect(result.current.pendingAnimations).toHaveLength(0);
      }
    });

    it('should auto-dismiss animations after timeout', async () => {
      vi.useFakeTimers();
      mockSocketContext = { socket: mockSocket, isConnected: true };

      const { result } = renderHook(() =>
        useGamification({ userId: 'user-123', showAnimations: true })
      );

      // Manually trigger initial fetch completion
      await vi.runAllTimersAsync();

      const onCall = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'points:awarded'
      );

      if (onCall) {
        const handler = onCall[1];
        act(() => {
          handler({
            userId: 'user-123',
            points: 50,
            reason: 'Quiz completed',
            newTotal: 1550,
          });
        });

        expect(result.current.pendingAnimations.length).toBeGreaterThan(0);

        // Fast-forward 3 seconds
        await act(async () => {
          await vi.advanceTimersByTimeAsync(3000);
        });

        expect(result.current.pendingAnimations).toHaveLength(0);
      }

      vi.useRealTimers();
    });

    it('should not create animations when disabled', async () => {
      mockSocketContext = { socket: mockSocket, isConnected: true };

      const { result } = renderHook(() =>
        useGamification({ userId: 'user-123', showAnimations: false })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const onCall = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'points:awarded'
      );

      if (onCall) {
        const handler = onCall[1];
        act(() => {
          handler({
            userId: 'user-123',
            points: 100,
            reason: 'Test',
            newTotal: 1600,
          });
        });

        expect(result.current.pendingAnimations).toHaveLength(0);
      }
    });
  });

  // ============================================================================
  // REAL-TIME EVENTS
  // ============================================================================

  describe('Real-time Events', () => {
    describe('points:awarded', () => {
      it('should update points on event', async () => {
        mockSocketContext = { socket: mockSocket, isConnected: true };

        const { result } = renderHook(() =>
          useGamification({ userId: 'user-123' })
        );

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        const onCall = mockSocket.on.mock.calls.find(
          (call: any[]) => call[0] === 'points:awarded'
        );
        expect(onCall).toBeDefined();

        const handler = onCall![1];

        act(() => {
          handler({
            userId: 'user-123',
            points: 100,
            reason: 'Lesson completed',
            newTotal: 1600,
            level: 5,
            levelProgress: 80,
          });
        });

        expect(result.current.data?.points).toBe(1600);
        expect(result.current.data?.levelProgress).toBe(80);
      });

      it('should ignore events for other users', async () => {
        mockSocketContext = { socket: mockSocket, isConnected: true };

        const { result } = renderHook(() =>
          useGamification({ userId: 'user-123' })
        );

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        const originalPoints = result.current.data?.points;

        const onCall = mockSocket.on.mock.calls.find(
          (call: any[]) => call[0] === 'points:awarded'
        );
        const handler = onCall![1];

        act(() => {
          handler({
            userId: 'other-user',
            points: 500,
            reason: 'Test',
            newTotal: 3000,
          });
        });

        expect(result.current.data?.points).toBe(originalPoints);
      });
    });

    describe('badge:earned', () => {
      it('should add badge on event', async () => {
        mockSocketContext = { socket: mockSocket, isConnected: true };

        const { result } = renderHook(() =>
          useGamification({ userId: 'user-123' })
        );

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        const initialBadgeCount = result.current.data?.badges.length || 0;

        const onCall = mockSocket.on.mock.calls.find(
          (call: any[]) => call[0] === 'badge:earned'
        );
        const handler = onCall![1];

        act(() => {
          handler({
            userId: 'user-123',
            badge: {
              id: 'badge-new',
              name: 'Speed Demon',
              description: 'Complete a lesson in under 5 minutes',
              icon: '⚡',
              earnedAt: new Date().toISOString(),
              rarity: 'rare',
            },
          });
        });

        expect(result.current.data?.badges.length).toBe(initialBadgeCount + 1);
        expect(result.current.data?.badges.some(b => b.id === 'badge-new')).toBe(true);
      });
    });

    describe('level:up', () => {
      it('should update level on event', async () => {
        mockSocketContext = { socket: mockSocket, isConnected: true };

        const { result } = renderHook(() =>
          useGamification({ userId: 'user-123' })
        );

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        const onCall = mockSocket.on.mock.calls.find(
          (call: any[]) => call[0] === 'level:up'
        );
        const handler = onCall![1];

        act(() => {
          handler({
            userId: 'user-123',
            newLevel: 6,
            pointsToNextLevel: 300,
          });
        });

        expect(result.current.data?.level).toBe(6);
        expect(result.current.data?.levelProgress).toBe(0);
        expect(result.current.data?.pointsToNextLevel).toBe(300);
      });
    });

    describe('streak:updated', () => {
      it('should update streak on event', async () => {
        mockSocketContext = { socket: mockSocket, isConnected: true };

        const { result } = renderHook(() =>
          useGamification({ userId: 'user-123' })
        );

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        const onCall = mockSocket.on.mock.calls.find(
          (call: any[]) => call[0] === 'streak:updated'
        );
        const handler = onCall![1];

        act(() => {
          handler({
            userId: 'user-123',
            currentStreak: 8,
            longestStreak: 12,
          });
        });

        expect(result.current.data?.currentStreak).toBe(8);
      });

      it('should show animation for new record streak', async () => {
        mockSocketContext = { socket: mockSocket, isConnected: true };

        const { result } = renderHook(() =>
          useGamification({ userId: 'user-123', showAnimations: true })
        );

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        const onCall = mockSocket.on.mock.calls.find(
          (call: any[]) => call[0] === 'streak:updated'
        );
        const handler = onCall![1];

        act(() => {
          handler({
            userId: 'user-123',
            currentStreak: 15,
            longestStreak: 15, // New record
          });
        });

        expect(result.current.pendingAnimations.some(a => a.reason.includes('Racha'))).toBe(true);
      });
    });

    describe('leaderboard:updated', () => {
      it('should update leaderboard on event', async () => {
        mockSocketContext = { socket: mockSocket, isConnected: true };

        const { result } = renderHook(() =>
          useGamification({ userId: 'user-123' })
        );

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        const onCall = mockSocket.on.mock.calls.find(
          (call: any[]) => call[0] === 'leaderboard:updated'
        );
        const handler = onCall![1];

        const newLeaderboard = [
          { userId: 'user-123', userName: 'You', points: 2500, level: 8, rank: 1 },
          { userId: 'user-1', userName: 'Alice', points: 2000, level: 7, rank: 2 },
        ];

        act(() => {
          handler({ leaderboard: newLeaderboard });
        });

        expect(result.current.leaderboard).toHaveLength(2);
        expect(result.current.leaderboard[0].rank).toBe(1);
        expect(result.current.leaderboard[0].userId).toBe('user-123');
      });
    });
  });

  // ============================================================================
  // SUBSCRIPTIONS
  // ============================================================================

  describe('Socket Subscriptions', () => {
    it('should subscribe to user gamification room', async () => {
      mockSocketContext = { socket: mockSocket, isConnected: true };

      renderHook(() =>
        useGamification({ userId: 'user-123', enableRealtime: true })
      );

      await waitFor(() => {
        expect(mockSocket.emit).toHaveBeenCalledWith(
          'subscribe:room',
          'user:user-123:gamification',
          expect.any(Function)
        );
      });
    });

    it('should subscribe to course leaderboard when courseId provided', async () => {
      mockSocketContext = { socket: mockSocket, isConnected: true };

      renderHook(() =>
        useGamification({ userId: 'user-123', courseId: 'course-456', enableRealtime: true })
      );

      await waitFor(() => {
        expect(mockSocket.emit).toHaveBeenCalledWith(
          'subscribe:room',
          'course:course-456:leaderboard',
          expect.any(Function)
        );
      });
    });

    it('should subscribe to global leaderboard when no courseId', async () => {
      mockSocketContext = { socket: mockSocket, isConnected: true };

      renderHook(() =>
        useGamification({ userId: 'user-123', enableRealtime: true })
      );

      await waitFor(() => {
        expect(mockSocket.emit).toHaveBeenCalledWith(
          'subscribe:room',
          'global:leaderboard',
          expect.any(Function)
        );
      });
    });

    it('should not subscribe when enableRealtime is false', async () => {
      mockSocketContext = { socket: mockSocket, isConnected: true };

      renderHook(() =>
        useGamification({ userId: 'user-123', enableRealtime: false })
      );

      await new Promise((r) => setTimeout(r, 100));

      expect(mockSocket.emit).not.toHaveBeenCalledWith(
        'subscribe:room',
        expect.any(String),
        expect.any(Function)
      );
    });

    it('should unsubscribe on unmount', async () => {
      mockSocketContext = { socket: mockSocket, isConnected: true };

      const { unmount } = renderHook(() =>
        useGamification({ userId: 'user-123', enableRealtime: true })
      );

      await waitFor(() => {
        expect(mockSocket.on).toHaveBeenCalled();
      });

      unmount();

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'unsubscribe:room',
        'user:user-123:gamification'
      );
      expect(mockSocket.off).toHaveBeenCalledWith('points:awarded', expect.any(Function));
      expect(mockSocket.off).toHaveBeenCalledWith('badge:earned', expect.any(Function));
      expect(mockSocket.off).toHaveBeenCalledWith('level:up', expect.any(Function));
      expect(mockSocket.off).toHaveBeenCalledWith('streak:updated', expect.any(Function));
      expect(mockSocket.off).toHaveBeenCalledWith('leaderboard:updated', expect.any(Function));
    });
  });

  // ============================================================================
  // REFRESH
  // ============================================================================

  describe('refresh', () => {
    it('should re-fetch gamification data', async () => {
      const { result } = renderHook(() =>
        useGamification({ userId: 'user-123' })
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
  });

  // ============================================================================
  // CONNECTION STATUS
  // ============================================================================

  describe('Connection Status', () => {
    it('should report disconnected when no socket', async () => {
      mockSocketContext = null;

      const { result } = renderHook(() =>
        useGamification({ userId: 'user-123' })
      );

      expect(result.current.isConnected).toBe(false);
    });

    it('should report connected when socket is connected', async () => {
      mockSocketContext = { socket: mockSocket, isConnected: true };

      const { result } = renderHook(() =>
        useGamification({ userId: 'user-123' })
      );

      expect(result.current.isConnected).toBe(true);
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle userId change', async () => {
      const { result, rerender } = renderHook(
        ({ userId }) => useGamification({ userId }),
        { initialProps: { userId: 'user-123' } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      rerender({ userId: 'user-456' });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining('userId=user-456')
      );
    });

    it('should handle empty gamification response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ gamification: null }),
      });

      const { result } = renderHook(() =>
        useGamification({ userId: 'user-123' })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should use default values
      expect(result.current.data?.points).toBe(0);
      expect(result.current.data?.level).toBe(1);
    });
  });
});
