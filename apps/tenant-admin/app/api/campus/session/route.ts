/**
 * Campus Session API
 *
 * Validates JWT and returns current student session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getPayload } from 'payload';
import config from '@payload-config';

const JWT_SECRET = new TextEncoder().encode(
  process.env.CAMPUS_JWT_SECRET ?? 'campus-secret-key-change-in-production'
);

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
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
    } catch (err) {
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

    const payload = await getPayload({ config });

    // Get student
    const student = await payload.findByID({
      collection: 'students',
      id: decoded.sub as string,
    });

    if (!student || !(student as any).isActive) {
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

    const enrollments = enrollmentsResult.docs.map((enrollment: any) => ({
      id: enrollment.id,
      courseRunId: typeof enrollment.courseRun === 'object' ? enrollment.courseRun.id : enrollment.courseRun,
      courseTitle: enrollment.courseRun?.course?.title || 'Unknown Course',
      status: enrollment.status,
      progressPercent: enrollment.progressPercent || 0,
      startedAt: enrollment.startedAt,
      completedAt: enrollment.completedAt,
    }));

    return NextResponse.json({
      success: true,
      student: {
        id: String(student.id),
        email: student.email,
        firstName: (student as any).firstName || '',
        lastName: (student as any).lastName || '',
        fullName: `${(student as any).firstName || ''} ${(student as any).lastName || ''}`.trim(),
        avatar: (student as any).avatar?.url || null,
        tenantId: (student as any).tenant,
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
