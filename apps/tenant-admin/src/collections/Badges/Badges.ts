import type { CollectionConfig } from 'payload';

/**
 * Badges Collection - Badge Definitions
 *
 * Defines the available badges that users can earn through
 * various achievements in the LMS.
 *
 * Database: PostgreSQL table 'badges'
 *
 * Key Features:
 * - Badge name, description, and icon
 * - Category for organization
 * - Points value when earned
 * - Criteria for automatic awarding
 *
 * Access Control:
 * - Read: All users (badges are public)
 * - Create/Update/Delete: Admin only
 */
export const Badges: CollectionConfig = {
  slug: 'badges',

  labels: {
    singular: 'Badge',
    plural: 'Badges',
  },

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'points', 'is_active'],
    group: 'Gamification',
    description: 'Badge definitions for gamification',
  },

  access: {
    read: () => true, // Public
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },

  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      maxLength: 100,
      admin: {
        description: 'Badge name (e.g., "First Steps", "Quiz Master")',
      },
    },

    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Unique identifier for the badge',
      },
    },

    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Description of how to earn this badge',
      },
    },

    {
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Badge icon image',
      },
    },

    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Achievement', value: 'achievement' },
        { label: 'Milestone', value: 'milestone' },
        { label: 'Skill', value: 'skill' },
        { label: 'Participation', value: 'participation' },
        { label: 'Special', value: 'special' },
      ],
      admin: {
        description: 'Badge category',
        position: 'sidebar',
      },
    },

    {
      name: 'points',
      type: 'number',
      required: true,
      defaultValue: 10,
      min: 0,
      admin: {
        description: 'Points awarded when this badge is earned',
        position: 'sidebar',
      },
    },

    {
      name: 'criteria_type',
      type: 'select',
      options: [
        { label: 'Manual', value: 'manual' },
        { label: 'Lessons Completed', value: 'lessons_completed' },
        { label: 'Courses Completed', value: 'courses_completed' },
        { label: 'Quiz Score', value: 'quiz_score' },
        { label: 'Streak Days', value: 'streak_days' },
        { label: 'Points Earned', value: 'points_earned' },
      ],
      admin: {
        description: 'How this badge is awarded',
      },
    },

    {
      name: 'criteria_value',
      type: 'number',
      min: 0,
      admin: {
        description: 'Threshold value for automatic awarding',
        condition: (data: any) => data.criteria_type && data.criteria_type !== 'manual',
      },
    },

    {
      name: 'is_active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Active badges can be earned',
        position: 'sidebar',
      },
    },

    {
      name: 'is_secret',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Secret badges are not shown until earned',
        position: 'sidebar',
      },
    },
  ],

  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.name && !data?.slug) {
          data.slug = data.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        }
        return data;
      },
    ],
  },

  timestamps: true,
};
