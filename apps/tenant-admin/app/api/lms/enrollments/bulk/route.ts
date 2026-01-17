/**
 * LMS Bulk Enrollments API
 *
 * POST /api/lms/enrollments/bulk - Bulk enroll students via CSV
 *
 * CSV Format:
 * studentEmail,courseRunId,status,notes
 * student1@email.com,course-run-123,active,Optional notes
 */

import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import { NextRequest, NextResponse } from 'next/server';

interface CSVRow {
  studentEmail: string;
  courseRunId: string;
  status?: string;
  notes?: string;
}

interface BulkResult {
  total: number;
  created: number;
  failed: number;
  skipped: number;
  errors: Array<{ row: number; email: string; error: string }>;
  created_ids: string[];
}

/**
 * Parse CSV content to array of objects
 */
function parseCSV(content: string): CSVRow[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

  // Validate required headers
  if (!headers.includes('studentemail') && !headers.includes('email')) {
    throw new Error('CSV must have studentEmail or email column');
  }
  if (!headers.includes('courserunid') && !headers.includes('course_run_id')) {
    throw new Error('CSV must have courseRunId or course_run_id column');
  }

  const emailIndex = headers.indexOf('studentemail') !== -1
    ? headers.indexOf('studentemail')
    : headers.indexOf('email');
  const courseRunIndex = headers.indexOf('courserunid') !== -1
    ? headers.indexOf('courserunid')
    : headers.indexOf('course_run_id');
  const statusIndex = headers.indexOf('status');
  const notesIndex = headers.indexOf('notes');

  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    if (values.length < 2 || !values[emailIndex]) continue;

    rows.push({
      studentEmail: values[emailIndex],
      courseRunId: values[courseRunIndex],
      status: statusIndex !== -1 ? values[statusIndex] : 'active',
      notes: notesIndex !== -1 ? values[notesIndex] : undefined,
    });
  }

  return rows;
}

/**
 * POST /api/lms/enrollments/bulk
 *
 * Body: FormData with 'file' (CSV) or JSON { csvContent: string }
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let csvContent: string;

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No file provided' },
          { status: 400 }
        );
      }

      csvContent = await file.text();
    } else {
      // Handle JSON body
      const body = await request.json();
      csvContent = body.csvContent;

      if (!csvContent) {
        return NextResponse.json(
          { success: false, error: 'No CSV content provided' },
          { status: 400 }
        );
      }
    }

    // Parse CSV
    let rows: CSVRow[];
    try {
      rows = parseCSV(csvContent);
    } catch (parseError: any) {
      return NextResponse.json(
        { success: false, error: `CSV parse error: ${parseError.message}` },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid rows found in CSV' },
        { status: 400 }
      );
    }

    const payload = await getPayloadHMR({ config: configPromise });

    const result: BulkResult = {
      total: rows.length,
      created: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      created_ids: [],
    };

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 for header row and 0-index

      try {
        // Find student by email
        const students = await payload.find({
          collection: 'students',
          where: { email: { equals: row.studentEmail } },
          limit: 1,
        });

        if (students.docs.length === 0) {
          result.failed++;
          result.errors.push({
            row: rowNum,
            email: row.studentEmail,
            error: 'Student not found',
          });
          continue;
        }

        const student = students.docs[0];

        // Verify course run exists
        const courseRun = await payload.findByID({
          collection: 'course-runs',
          id: row.courseRunId,
        }).catch(() => null);

        if (!courseRun) {
          result.failed++;
          result.errors.push({
            row: rowNum,
            email: row.studentEmail,
            error: `Course run ${row.courseRunId} not found`,
          });
          continue;
        }

        // Check for existing enrollment
        const existing = await payload.find({
          collection: 'enrollments' as any,
          where: {
            and: [
              { student: { equals: student.id } },
              { courseRun: { equals: row.courseRunId } },
              { status: { in: ['active', 'pending'] } },
            ],
          },
          limit: 1,
        });

        if (existing.docs.length > 0) {
          result.skipped++;
          continue;
        }

        // Create enrollment
        const enrollment = await payload.create({
          collection: 'enrollments' as any,
          data: {
            student: student.id,
            courseRun: row.courseRunId,
            status: (row.status || 'pending') as any,
            notes: row.notes,
            enrolledAt: new Date().toISOString(),
          },
        });

        result.created++;
        result.created_ids.push(enrollment.id.toString());
      } catch (rowError: any) {
        result.failed++;
        result.errors.push({
          row: rowNum,
          email: row.studentEmail,
          error: rowError.message || 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk enrollment complete: ${result.created} created, ${result.skipped} skipped, ${result.failed} failed`,
      data: result,
    });
  } catch (error: any) {
    console.error('[LMS Bulk Enrollments] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Bulk enrollment failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/lms/enrollments/bulk
 *
 * Returns CSV template for bulk enrollment
 */
export async function GET() {
  const template = `studentEmail,courseRunId,status,notes
student1@example.com,course-run-id-1,active,First enrollment
student2@example.com,course-run-id-1,pending,Pending payment
student3@example.com,course-run-id-2,active,`;

  return new NextResponse(template, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="bulk-enrollment-template.csv"',
    },
  });
}
