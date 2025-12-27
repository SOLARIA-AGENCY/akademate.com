import type { CollectionConfig } from 'payload';

/**
 * UserBadges Collection - Earned Badges
 *
 * Records which users have earned which badges and when.
 *
 * Database: PostgreSQL table 'user_badges'
 *
 * Relationships:
 * - Many-to-One: UserBadge -> User (required)
 * - Many-to-One: UserBadge -> Badge (required)
 *
 * Unique Constraint: One record per user + badge combination
 *
 * Access Control:
 * - Read: All users (earned badges are public)
 * - Create: System/Admin only
 * - Delete: Admin only
 */
export const UserBadges: CollectionConfig = {
  slug: 'user-badges',

  labels: {
    singular: 'User Badge',
    plural: 'User Badges',
  },

  admin: {
    useAsTitle: 'id',
    defaultColumns: ['user', 'badge', 'earnedAt', 'createdAt'],
    group: 'Gamification',
    description: 'Badges earned by users',
  },

  access: {
    read: () => true, // Public - earned badges can be displayed
    create: ({ req: { user } }) => {
      if (!user) return false;
      return ['admin', 'gestor'].includes(user.role);
    },
    update: () => false, // Earned badges are immutable
    delete: ({ req: { user } }) => user?.role === 'admin',
  },

  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: {
        description: 'User who earned the badge',
      },
    },

    {
      name: 'badge',
      type: 'relationship',
      relationTo: 'badges',
      required: true,
      index: true,
      admin: {
        description: 'The badge that was earned',
      },
    },

    {
      name: 'earnedAt',
      type: 'date',
      required: true,
      admin: {
        description: 'When the badge was earned',
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm:ss',
        },
      },
    },

    {
      name: 'source',
      type: 'text',
      admin: {
        description: 'How the badge was earned (e.g., "course_completion", "manual")',
      },
    },

    {
      name: 'sourceId',
      type: 'text',
      admin: {
        description: 'Related entity ID (e.g., course ID, enrollment ID)',
      },
    },

    {
      name: 'notified',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the user has been notified',
        position: 'sidebar',
      },
    },
  ],

  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data;

        if (!data.earnedAt) {
          data.earnedAt = new Date().toISOString();
        }
        return data;
      },
    ],
  },

  timestamps: true,
};
