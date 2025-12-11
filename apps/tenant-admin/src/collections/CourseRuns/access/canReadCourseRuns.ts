import type { Access } from 'payload';

/**
 * Access Control: canReadCourseRuns
 *
 * Role-based read access to course runs:
 *
 * - Public: Can ONLY read published/enrollment_open runs
 * - Lectura: Can read ALL active runs (not draft or cancelled)
 * - Asesor: Can read ALL runs
 * - Marketing: Can read ALL runs
 * - Gestor: Can read ALL runs
 * - Admin: Can read ALL runs
 *
 * Public Access Logic:
 * - Only show runs that are publicly visible (published, enrollment_open)
 * - Hide draft, cancelled, and completed runs from public
 *
 * Authenticated Access Logic:
 * - Lectura: Can see active runs (helps with inquiries)
 * - Asesor: Can see all runs (needs context for student advising)
 * - Marketing/Gestor/Admin: Full read access
 */
export const canReadCourseRuns: Access = ({ req: { user } }) => {
  // Public: Only published or enrollment_open runs
  if (!user) {
    return {
      status: {
        in: ['published', 'enrollment_open'],
      },
    };
  }

  // Admin, Gestor, Marketing, and Asesor can read all runs
  if (['admin', 'gestor', 'marketing', 'asesor'].includes(user.role)) {
    return true;
  }

  // Lectura: Can read active runs (not draft or cancelled)
  if (user.role === 'lectura') {
    return {
      status: {
        not_in: ['draft', 'cancelled'],
      },
    };
  }

  // Default: No access
  return false;
};
