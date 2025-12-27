import type { CollectionConfig } from 'payload';

/**
 * Attendance Collection - Student Attendance Tracking
 *
 * Records student attendance for live sessions and in-person classes.
 *
 * Database: PostgreSQL table 'attendance'
 *
 * Key Features:
 * - Links to enrollment and session date
 * - Supports different attendance statuses
 * - Check-in/check-out timestamps
 * - Notes for tardiness/early departure
 *
 * Relationships:
 * - Many-to-One: Attendance -> Enrollment (required)
 *
 * Access Control:
 * - Read: Student's own, Admin, Gestor
 * - Create/Update: Admin, Gestor
 * - Delete: Admin only
 */
export const Attendance: CollectionConfig = {
  slug: 'attendance',

  labels: {
    singular: 'Attendance Record',
    plural: 'Attendance Records',
  },

  admin: {
    useAsTitle: 'id',
    defaultColumns: ['enrollment', 'session_date', 'status', 'check_in_at'],
    group: 'LMS',
    description: 'Student attendance tracking for sessions',
  },

  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (['admin', 'gestor'].includes(user.role)) return true;
      return { 'enrollment.user': { equals: user.id } };
    },
    create: ({ req: { user } }) => {
      if (!user) return false;
      return ['admin', 'gestor'].includes(user.role);
    },
    update: ({ req: { user } }) => {
      if (!user) return false;
      return ['admin', 'gestor'].includes(user.role);
    },
    delete: ({ req: { user } }) => user?.role === 'admin',
  },

  fields: [
    {
      name: 'enrollment',
      type: 'relationship',
      relationTo: 'enrollments',
      required: true,
      index: true,
      admin: {
        description: 'The enrollment this attendance belongs to',
      },
    },

    {
      name: 'session_date',
      type: 'date',
      required: true,
      index: true,
      admin: {
        description: 'Date of the session',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },

    {
      name: 'session_type',
      type: 'select',
      options: [
        { label: 'In-Person Class', value: 'in_person' },
        { label: 'Live Online', value: 'live_online' },
        { label: 'Workshop', value: 'workshop' },
        { label: 'Exam', value: 'exam' },
        { label: 'Other', value: 'other' },
      ],
      defaultValue: 'in_person',
      admin: {
        description: 'Type of session',
        position: 'sidebar',
      },
    },

    {
      name: 'status',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Present', value: 'present' },
        { label: 'Absent', value: 'absent' },
        { label: 'Late', value: 'late' },
        { label: 'Excused', value: 'excused' },
        { label: 'Left Early', value: 'left_early' },
      ],
      admin: {
        description: 'Attendance status',
        position: 'sidebar',
      },
    },

    {
      name: 'check_in_at',
      type: 'date',
      admin: {
        description: 'Check-in timestamp',
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm:ss',
        },
      },
    },

    {
      name: 'check_out_at',
      type: 'date',
      admin: {
        description: 'Check-out timestamp',
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm:ss',
        },
      },
    },

    {
      name: 'duration_minutes',
      type: 'number',
      min: 0,
      admin: {
        description: 'Time present in minutes',
      },
    },

    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Notes (reason for absence, tardiness, etc.)',
      },
    },

    {
      name: 'recorded_by',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'Staff member who recorded the attendance',
        position: 'sidebar',
      },
    },
  ],

  hooks: {
    beforeChange: [
      ({ data }) => {
        if (!data) return data;

        // Calculate duration if both check-in and check-out are set
        if (data.check_in_at && data.check_out_at) {
          const checkIn = new Date(data.check_in_at);
          const checkOut = new Date(data.check_out_at);
          const durationMs = checkOut.getTime() - checkIn.getTime();
          data.duration_minutes = Math.round(durationMs / 60000);
        }
        return data;
      },
    ],
  },

  timestamps: true,
};
