import type { CollectionConfig } from 'payload';

/**
 * UserStreaks Collection - Learning Streak Tracking
 *
 * Tracks consecutive day streaks for user engagement.
 * Each user has one streak record that gets updated daily.
 *
 * Database: PostgreSQL table 'user_streaks'
 *
 * Key Features:
 * - Current streak count
 * - Longest streak ever achieved
 * - Last activity timestamp
 * - Freeze count (grace days)
 *
 * Access Control:
 * - Read: All users (streaks can be displayed on leaderboards)
 * - Create/Update: System/Admin
 * - Delete: Admin only
 */
export const UserStreaks: CollectionConfig = {
  slug: 'user-streaks',

  labels: {
    singular: 'User Streak',
    plural: 'User Streaks',
  },

  admin: {
    useAsTitle: 'id',
    defaultColumns: ['user', 'currentStreak', 'longestStreak', 'lastActivityAt'],
    group: 'Gamification',
    description: 'User learning streak tracking',
  },

  access: {
    read: () => true, // Public for leaderboards
    create: ({ req: { user } }) => {
      if (!user) return false;
      return true; // Created automatically on first activity
    },
    update: ({ req: { user } }) => {
      if (!user) return false;
      return ['admin', 'gestor'].includes(user.role);
    },
    delete: ({ req: { user } }) => user?.role === 'admin',
  },

  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'User this streak belongs to',
      },
    },

    {
      name: 'currentStreak',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Current consecutive days streak',
      },
    },

    {
      name: 'longestStreak',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Longest streak ever achieved',
      },
    },

    {
      name: 'lastActivityAt',
      type: 'date',
      required: true,
      admin: {
        description: 'Last activity date for streak calculation',
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm:ss',
        },
      },
    },

    {
      name: 'streakFreezes',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Available streak freeze days (grace days)',
        position: 'sidebar',
      },
    },

    {
      name: 'totalActiveDays',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Total number of active days (all time)',
        position: 'sidebar',
      },
    },

    {
      name: 'streakHistory',
      type: 'json',
      admin: {
        description: 'History of past streaks (for analytics)',
      },
    },
  ],

  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data) return data;

        // Update longest streak if current exceeds it
        if (data.currentStreak > (data.longestStreak || 0)) {
          data.longestStreak = data.currentStreak;
        }
        return data;
      },
    ],
  },

  timestamps: true,
};
