import type { CollectionConfig } from 'payload';

/**
 * PointsTransactions Collection - Points Ledger
 *
 * Records all point transactions (earned and spent) for gamification.
 * This creates an immutable ledger of all point activity.
 *
 * Database: PostgreSQL table 'points_transactions'
 *
 * Key Features:
 * - Tracks points earned and spent
 * - Supports different source types (lesson, quiz, badge, purchase)
 * - Running balance not stored (calculated from transactions)
 *
 * Access Control:
 * - Read: User's own transactions, Admin
 * - Create: System/Admin only
 * - Update/Delete: Disabled (immutable ledger)
 */
export const PointsTransactions: CollectionConfig = {
  slug: 'points-transactions',

  labels: {
    singular: 'Points Transaction',
    plural: 'Points Transactions',
  },

  admin: {
    useAsTitle: 'id',
    defaultColumns: ['user', 'points', 'reason', 'sourceType', 'createdAt'],
    group: 'Gamification',
    description: 'Points earned and spent by users',
  },

  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (['admin', 'gestor'].includes(user.role)) return true;
      return { user: { equals: user.id } };
    },
    create: ({ req: { user } }) => {
      if (!user) return false;
      return ['admin', 'gestor'].includes(user.role);
    },
    update: () => false, // Immutable ledger
    delete: () => false, // Immutable ledger
  },

  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: {
        description: 'User receiving/spending points',
      },
    },

    {
      name: 'points',
      type: 'number',
      required: true,
      admin: {
        description: 'Points amount (positive = earned, negative = spent). Cannot be zero.',
      },
    },

    {
      name: 'reason',
      type: 'text',
      required: true,
      maxLength: 255,
      admin: {
        description: 'Reason for the transaction',
      },
    },

    {
      name: 'sourceType',
      type: 'select',
      required: true,
      options: [
        { label: 'Lesson Completion', value: 'lesson' },
        { label: 'Quiz Score', value: 'quiz' },
        { label: 'Badge Earned', value: 'badge' },
        { label: 'Course Completion', value: 'course' },
        { label: 'Streak Bonus', value: 'streak' },
        { label: 'Daily Login', value: 'login' },
        { label: 'Purchase', value: 'purchase' },
        { label: 'Redemption', value: 'redemption' },
        { label: 'Manual Adjustment', value: 'manual' },
        { label: 'Referral', value: 'referral' },
      ],
      admin: {
        description: 'Source of the points transaction',
        position: 'sidebar',
      },
    },

    {
      name: 'sourceId',
      type: 'text',
      admin: {
        description: 'Related entity ID (lesson ID, quiz ID, etc.)',
      },
    },

    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Additional transaction metadata',
      },
    },
  ],

  timestamps: true,
  defaultSort: '-createdAt',
};
