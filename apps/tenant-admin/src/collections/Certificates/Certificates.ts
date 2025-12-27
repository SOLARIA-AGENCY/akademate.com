import type { CollectionConfig } from 'payload';

/**
 * Certificates Collection - Course Completion Certificates
 *
 * Records issued certificates for course completions.
 * Immutable once created for legal/compliance purposes.
 *
 * Database: PostgreSQL table 'certificates'
 *
 * Key Features:
 * - Links to user and course run
 * - Unique certificate number
 * - PDF storage or URL
 * - Verification code for authenticity
 *
 * Relationships:
 * - Many-to-One: Certificate -> User (required)
 * - Many-to-One: Certificate -> CourseRun (required)
 * - Many-to-One: Certificate -> Enrollment (optional)
 *
 * Access Control:
 * - Read: Certificate owner, Admin
 * - Create: Admin/System only
 * - Update/Delete: Disabled (certificates are immutable)
 */
export const Certificates: CollectionConfig = {
  slug: 'certificates',

  labels: {
    singular: 'Certificate',
    plural: 'Certificates',
  },

  admin: {
    useAsTitle: 'certificate_number',
    defaultColumns: ['certificate_number', 'user', 'course_run', 'issued_at', 'createdAt'],
    group: 'LMS',
    description: 'Course completion certificates',
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
    update: () => false, // Certificates are immutable
    delete: () => false, // Certificates cannot be deleted
  },

  fields: [
    {
      name: 'certificate_number',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Unique certificate number (auto-generated)',
        readOnly: true,
      },
    },

    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: {
        description: 'User who earned this certificate',
      },
    },

    {
      name: 'course_run',
      type: 'relationship',
      relationTo: 'course-runs',
      required: true,
      index: true,
      admin: {
        description: 'Course run that was completed',
      },
    },

    {
      name: 'enrollment',
      type: 'relationship',
      relationTo: 'enrollments',
      index: true,
      admin: {
        description: 'Related enrollment record',
      },
    },

    {
      name: 'issued_at',
      type: 'date',
      required: true,
      admin: {
        description: 'When the certificate was issued',
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm:ss',
        },
      },
    },

    {
      name: 'expires_at',
      type: 'date',
      admin: {
        description: 'Optional expiration date',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },

    {
      name: 'verification_code',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Code for verifying certificate authenticity',
        readOnly: true,
      },
    },

    {
      name: 'pdf_url',
      type: 'text',
      admin: {
        description: 'URL to the certificate PDF',
      },
    },

    {
      name: 'pdf_file',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Certificate PDF file',
      },
    },

    {
      name: 'final_grade',
      type: 'number',
      min: 0,
      max: 100,
      admin: {
        description: 'Final grade achieved',
        position: 'sidebar',
      },
    },

    {
      name: 'completion_hours',
      type: 'number',
      min: 0,
      admin: {
        description: 'Total hours of instruction completed',
        position: 'sidebar',
      },
    },

    {
      name: 'issued_by',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'Admin who issued the certificate',
        position: 'sidebar',
      },
    },

    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Additional certificate metadata',
      },
    },
  ],

  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        if (operation === 'create') {
          // Auto-generate certificate number
          if (!data?.certificate_number) {
            const timestamp = Date.now().toString(36).toUpperCase();
            const random = Math.random().toString(36).substring(2, 6).toUpperCase();
            data.certificate_number = `CERT-${timestamp}-${random}`;
          }

          // Auto-generate verification code
          if (!data?.verification_code) {
            const code = Math.random().toString(36).substring(2, 14).toUpperCase();
            data.verification_code = code;
          }

          // Auto-set issued_at
          if (!data?.issued_at) {
            data.issued_at = new Date().toISOString();
          }
        }
        return data;
      },
    ],
  },

  timestamps: true,
  defaultSort: '-issued_at',
};
