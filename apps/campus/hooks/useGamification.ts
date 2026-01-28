'use client';

/**
 * useGamification Hook
 *
 * Real-time gamification updates for Campus LMS.
 * Tracks points, badges, levels, streaks, and leaderboard.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSocketContextOptional } from '@akademate/realtime/context';

// ============================================================================
// TYPES
// ============================================================================

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Achievement {
  id: string;
  type: 'lesson_complete' | 'module_complete' | 'course_complete' | 'streak' | 'speed' | 'perfect';
  title: string;
  description: string;
  pointsAwarded: number;
  earnedAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  avatar?: string;
  points: number;
  level: number;
  rank: number;
}

export interface GamificationData {
  userId: string;
  points: number;
  level: number;
  levelProgress: number; // 0-100% to next level
  pointsToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  badges: Badge[];
  recentAchievements: Achievement[];
  rank?: number;
}

export interface PointsAnimation {
  id: string;
  points: number;
  reason: string;
  timestamp: Date;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

interface GamificationAPIResponse {
  gamification?: GamificationData;
  leaderboard?: LeaderboardEntry[];
}

// ============================================================================
// SOCKET EVENT PAYLOAD TYPES
// ============================================================================

interface PointsAwardedPayload {
  userId: string;
  points: number;
  reason: string;
  newTotal: number;
  level?: number;
  levelProgress?: number;
}

interface BadgeEarnedPayload {
  userId: string;
  badge: Badge;
}

interface LevelUpPayload {
  userId: string;
  newLevel: number;
  pointsToNextLevel: number;
}

interface StreakUpdatePayload {
  userId: string;
  currentStreak: number;
  longestStreak: number;
}

interface LeaderboardUpdatePayload {
  leaderboard: LeaderboardEntry[];
}

// Socket event handler type for gamification events
type GamificationEventHandler<T> = (payload: T) => void;

// Extended socket interface for gamification-specific events
interface GamificationSocket {
  on(event: 'points:awarded', handler: GamificationEventHandler<PointsAwardedPayload>): void;
  on(event: 'badge:earned', handler: GamificationEventHandler<BadgeEarnedPayload>): void;
  on(event: 'level:up', handler: GamificationEventHandler<LevelUpPayload>): void;
  on(event: 'streak:updated', handler: GamificationEventHandler<StreakUpdatePayload>): void;
  on(event: 'leaderboard:updated', handler: GamificationEventHandler<LeaderboardUpdatePayload>): void;
  off(event: 'points:awarded', handler: GamificationEventHandler<PointsAwardedPayload>): void;
  off(event: 'badge:earned', handler: GamificationEventHandler<BadgeEarnedPayload>): void;
  off(event: 'level:up', handler: GamificationEventHandler<LevelUpPayload>): void;
  off(event: 'streak:updated', handler: GamificationEventHandler<StreakUpdatePayload>): void;
  off(event: 'leaderboard:updated', handler: GamificationEventHandler<LeaderboardUpdatePayload>): void;
}

// ============================================================================
// HOOK
// ============================================================================

export interface UseGamificationOptions {
  userId?: string;
  courseId?: string;
  enableRealtime?: boolean;
  showAnimations?: boolean;
}

export interface UseGamificationReturn {
  data: GamificationData | null;
  leaderboard: LeaderboardEntry[];
  pendingAnimations: PointsAnimation[];
  loading: boolean;
  isConnected: boolean;
  lastUpdate: Date | null;
  dismissAnimation: (id: string) => void;
  refresh: () => void;
}

// Default empty gamification state
const DEFAULT_GAMIFICATION: GamificationData = {
  userId: '',
  points: 0,
  level: 1,
  levelProgress: 0,
  pointsToNextLevel: 100,
  currentStreak: 0,
  longestStreak: 0,
  badges: [],
  recentAchievements: [],
};

export function useGamification(
  options: UseGamificationOptions = {}
): UseGamificationReturn {
  const { userId, courseId, enableRealtime = true, showAnimations = true } = options;

  // Get socket context (optional - returns null if not in provider)
  const socketContext = useSocketContextOptional();
  const socket = socketContext?.socket ?? null;
  const isConnected = socketContext?.isConnected ?? false;

  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [data, setData] = useState<GamificationData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [pendingAnimations, setPendingAnimations] = useState<PointsAnimation[]>([]);

  // Fetch initial gamification data from API
  const fetchGamification = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({ userId });
      if (courseId) params.append('courseId', courseId);

      const response = await fetch(`/api/lms/gamification?${params}`);

      if (response.ok) {
        const result: GamificationAPIResponse = await response.json() as GamificationAPIResponse;
        setData(result.gamification ?? DEFAULT_GAMIFICATION);
        if (result.leaderboard) {
          setLeaderboard(result.leaderboard);
        }
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('[useGamification] Failed to fetch data:', error);
      setData(DEFAULT_GAMIFICATION);
    } finally {
      setLoading(false);
    }
  }, [userId, courseId]);

  // Manual refresh function
  const refresh = useCallback(() => {
    void fetchGamification();
  }, [fetchGamification]);

  // Dismiss a points animation
  const dismissAnimation = useCallback((id: string) => {
    setPendingAnimations((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Add points animation
  const addPointsAnimation = useCallback(
    (points: number, reason: string) => {
      if (!showAnimations) return;

      const animation: PointsAnimation = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        points,
        reason,
        timestamp: new Date(),
      };

      setPendingAnimations((prev) => [...prev, animation]);

      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        dismissAnimation(animation.id);
      }, 3000);
    },
    [showAnimations, dismissAnimation]
  );

  // Initialize - fetch gamification data
  useEffect(() => {
    void fetchGamification();
  }, [fetchGamification]);

  // Subscribe to real-time gamification updates
  useEffect(() => {
    if (!socket || !enableRealtime || !userId) return;

    const userRoom = `user:${userId}:gamification`;
    const leaderboardRoom = courseId ? `course:${courseId}:leaderboard` : 'global:leaderboard';

    // Subscribe to rooms
    socket.emit('subscribe:room', userRoom, (success: boolean) => {
      if (success) {
        console.log('[useGamification] Subscribed to user gamification updates');
      }
    });

    socket.emit('subscribe:room', leaderboardRoom, (success: boolean) => {
      if (success) {
        console.log('[useGamification] Subscribed to leaderboard updates');
      }
    });

    // Handle points awarded
    const handlePointsAwarded = (payload: PointsAwardedPayload) => {
      if (payload.userId !== userId) return;

      // Update data
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          points: payload.newTotal,
          level: payload.level ?? prev.level,
          levelProgress: payload.levelProgress ?? prev.levelProgress,
        };
      });

      // Show animation
      addPointsAnimation(payload.points, payload.reason);
      setLastUpdate(new Date());
    };

    // Handle badge earned
    const handleBadgeEarned = (payload: BadgeEarnedPayload) => {
      if (payload.userId !== userId) return;

      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          badges: [...prev.badges, payload.badge],
        };
      });

      // Show badge animation
      addPointsAnimation(0, `🏆 ${payload.badge.name}`);
      setLastUpdate(new Date());
    };

    // Handle level up
    const handleLevelUp = (payload: {
      userId: string;
      newLevel: number;
      pointsToNextLevel: number;
    }) => {
      if (payload.userId !== userId) return;

      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          level: payload.newLevel,
          levelProgress: 0,
          pointsToNextLevel: payload.pointsToNextLevel,
        };
      });

      // Show level up animation
      addPointsAnimation(0, `⬆️ ¡Nivel ${payload.newLevel}!`);
      setLastUpdate(new Date());
    };

    // Handle streak update
    const handleStreakUpdate = (payload: {
      userId: string;
      currentStreak: number;
      longestStreak: number;
    }) => {
      if (payload.userId !== userId) return;

      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          currentStreak: payload.currentStreak,
          longestStreak: payload.longestStreak,
        };
      });

      // Show streak animation if it's a new record
      if (payload.currentStreak > 0 && payload.currentStreak === payload.longestStreak) {
        addPointsAnimation(0, `🔥 ¡Racha de ${payload.currentStreak} días!`);
      }

      setLastUpdate(new Date());
    };

    // Handle leaderboard update
    const handleLeaderboardUpdate = (payload: {
      leaderboard: LeaderboardEntry[];
    }) => {
      setLeaderboard(payload.leaderboard);
      setLastUpdate(new Date());
    };

    // Register event listeners (cast to any for custom events not in strict types)
    const anySocket = socket as any;
    anySocket.on('points:awarded', handlePointsAwarded);
    anySocket.on('badge:earned', handleBadgeEarned);
    anySocket.on('level:up', handleLevelUp);
    anySocket.on('streak:updated', handleStreakUpdate);
    anySocket.on('leaderboard:updated', handleLeaderboardUpdate);

    return () => {
      socket.emit('unsubscribe:room', userRoom);
      socket.emit('unsubscribe:room', leaderboardRoom);
      anySocket.off('points:awarded', handlePointsAwarded);
      anySocket.off('badge:earned', handleBadgeEarned);
      anySocket.off('level:up', handleLevelUp);
      anySocket.off('streak:updated', handleStreakUpdate);
      anySocket.off('leaderboard:updated', handleLeaderboardUpdate);
    };
  }, [socket, enableRealtime, userId, courseId, addPointsAnimation]);

  return {
    data,
    leaderboard,
    pendingAnimations,
    loading,
    isConnected,
    lastUpdate,
    dismissAnimation,
    refresh,
  };
}
