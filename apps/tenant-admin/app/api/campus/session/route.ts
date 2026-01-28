/**
 * Campus Session API
 *
 * Validates JWT and returns current student session.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getPayload } from 'payload';
import config from '@payload-config';

/** Student record from Payload CMS */
interface StudentRecord {
  id: string | number;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  avatar?: { url?: string };
  tenant?: string | number;
}

/** Course information */
interface CourseInfo {
  title?: string;
}

/** Course run with nested course */
interface CourseRunInfo {
  id: string | number;
  course?: CourseInfo;
}

/** Enrollment record from Payload CMS */
interface EnrollmentRecord {
  id: string | number;
  courseRun?: CourseRunInfo | string | number;
  status?: string;
  progressPercent?: number;
  startedAt?: string;
  completedAt?: string;
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.CAMPUS_JWT_SECRET ?? 'campus-secret-key-change-in-production'
);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT
    let decoded;
    try {
      const { payload: jwtPayload } = await jwtVerify(token, JWT_SECRET);
      decoded = jwtPayload;
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (decoded.type !== 'campus') {
      return NextResponse.json(
        { success: false, error: 'Invalid token type' },
        { status: 401 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const payload = await getPayload({ config });

    // Validate subject claim exists
    const studentId = decoded.sub;
    if (!studentId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token: missing subject' },
        { status: 401 }
      );
    }

    // Get student
    const studentResult = await payload.findByID({
      collection: 'students',
      id: studentId,
    });
    const student = studentResult as unknown as StudentRecord;

    if (!student?.isActive) {
      return NextResponse.json(
        { success: false, error: 'Student not found or inactive' },
        { status: 401 }
      );
    }

    // Get active enrollments
    const enrollmentsResult = await payload.find({
      collection: 'enrollments',
      where: {
        student: { equals: student.id },
        status: { in: ['enrolled', 'in_progress'] },
      },
      depth: 2,
    });

    const enrollments = enrollmentsResult.docs.map((doc) => {
      const enrollment = doc as unknown as EnrollmentRecord;
      const courseRun = enrollment.courseRun;
      const courseRunObj = typeof courseRun === 'object' && courseRun !== null ? courseRun : null;

      return {
        id: enrollment.id,
        courseRunId: courseRunObj?.id ?? courseRun,
        courseTitle: courseRunObj?.course?.title ?? 'Unknown Course',
        status: enrollment.status,
        progressPercent: enrollment.progressPercent ?? 0,
        startedAt: enrollment.startedAt,
        completedAt: enrollment.completedAt,
      };
    });

    const firstName = student.firstName ?? '';
    const lastName = student.lastName ?? '';

    return NextResponse.json({
      success: true,
      student: {
        id: String(student.id),
        email: student.email,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim(),
        avatar: student.avatar?.url ?? null,
        tenantId: student.tenant,
      },
      enrollments,
    });
  } catch (error) {
    console.error('[Campus Session] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Session validation failed' },
      { status: 500 }
    );
  }
}
