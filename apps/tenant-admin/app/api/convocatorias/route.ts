import { getPayloadHMR } from '@payloadcms/next/utilities';
import configPromise from '@payload-config';
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import type { CourseRun, Course, Campus } from '../../../src/payload-types';

// ============================================================================
// Type Definitions
// ============================================================================

/** Day of week keys used in schedule */
type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

/** Schedule entry for course runs */
interface ScheduleEntry {
  day: string;
  startTime: string;
  endTime: string;
}

/** Request body for creating a new convocation */
interface CreateConvocationRequest {
  courseId: string;
  fechaInicio: string;
  fechaFin: string;
  horario: ScheduleEntry[];
  modalidad: string;
  estado: string;
  plazasTotales: number;
  precio: number;
  profesorId: string;
  sedeId: string;
  aulaId: string;
}

/** Where clause for course-runs query */
interface CourseRunWhereClause {
  course?: { equals: number };
  campus?: { equals: number };
}

/** CourseRun with populated course relation */
interface PopulatedCourseRun extends Omit<CourseRun, 'course' | 'campus'> {
  course: number | (Course & { id: number; name: string; course_type?: string | null });
  campus?: number | null | (Campus & { id: number; name: string });
  modality?: string | null;
}

interface StaffLike {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

/** Data structure for course-run creation */
interface CourseRunCreateData {
  course: number;
  campus: number | undefined;
  start_date: string;
  end_date: string;
  schedule_days: CourseRun['schedule_days'];
  schedule_time_start: string;
  schedule_time_end: string;
  status: CourseRun['status'];
  min_students: number;
  max_students: number;
  current_enrollments: number;
  price_override: number | undefined;
  instructor_name: string | undefined;
  notes: string;
}

interface LoosePayloadClient {
  create: (args: { collection: string; data: Record<string, unknown> }) => Promise<{ id: string | number }>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Type guard to check if error is an Error instance
 */
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Get error message from unknown error
 */
function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  return 'Error al crear convocatoria';
}

function normalizeInstructorName(instructor: unknown): string {
  if (typeof instructor === 'string') {
    return instructor;
  }

  if (instructor && typeof instructor === 'object') {
    const staff = instructor as StaffLike;
    const fullName = staff.full_name?.trim();
    if (fullName) {
      return fullName;
    }

    const firstName = staff.first_name?.trim() ?? '';
    const lastName = staff.last_name?.trim() ?? '';
    const combined = `${firstName} ${lastName}`.trim();
    if (combined) {
      return combined;
    }
  }

  return 'Sin asignar';
}

// ============================================================================
// Route Handlers
// ============================================================================

/**
 * POST /api/convocatorias
 *
 * Crea una nueva convocatoria para un curso
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateConvocationRequest;
    const {
      courseId,
      fechaInicio,
      fechaFin,
      horario,
      estado,
      plazasTotales,
      precio,
      profesorId,
      sedeId,
      aulaId,
    } = body;

    // Validaciones basicas
    if (!courseId || !fechaInicio || !fechaFin || !horario || horario.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: courseId, fechaInicio, fechaFin, horario' },
        { status: 400 }
      );
    }

     
    const payload = await getPayloadHMR({ config: configPromise });

    // Verificar que el curso existe
    const course = await payload.findByID({
      collection: 'courses',
      id: parseInt(courseId),
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    // Find earliest start time and latest end time across all schedule entries
    const startTimes = horario.map((e: ScheduleEntry) => e.startTime);
    const endTimes = horario.map((e: ScheduleEntry) => e.endTime);

    const earliestStart = startTimes.sort()[0] ?? '09:00:00';
    const latestEnd = endTimes.sort().reverse()[0] ?? '14:00:00';

    // Parse and validate campus ID
    let campusId: number | undefined = undefined;
    if (sedeId) {
      const parsedCampusId = parseInt(sedeId, 10);
      if (isNaN(parsedCampusId)) {
        return NextResponse.json(
          { success: false, error: `Invalid campus ID: ${sedeId}` },
          { status: 400 }
        );
      }
      campusId = parsedCampusId;
    }

    // Prepare data for course-run creation
    const courseRunData: CourseRunCreateData = {
      course: parseInt(courseId),
      campus: campusId,
      start_date: fechaInicio,
      end_date: fechaFin,
      schedule_days: horario.map((e: ScheduleEntry) => e.day as DayKey),
      schedule_time_start: earliestStart,
      schedule_time_end: latestEnd,
      status: estado === 'abierta' ? 'enrollment_open' : 'draft',
      min_students: 5,
      max_students: plazasTotales,
      current_enrollments: 0,
      price_override: precio > 0 ? precio : undefined,
      instructor_name: profesorId !== '' ? profesorId : undefined,
      notes: `Aula: ${aulaId !== '' ? aulaId : 'Sin asignar'}`,
    };

    // Crear convocatoria en Payload
    const payloadLoose = payload as unknown as LoosePayloadClient;
    const convocation = await payloadLoose.create({
      collection: 'course-runs',
      data: courseRunData as unknown as Record<string, unknown>,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: convocation.id,
        courseId: course.id,
         
        courseName: course.name,
      },
      message: `Convocatoria creada exitosamente`,
    });
  } catch (error: unknown) {
    console.error('Error creating convocation:', error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/convocatorias?courseId=X&campusId=Y
 *
 * Lista convocatorias de un curso o de un campus (o ambos)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const campusId = searchParams.get('campusId');

     
    const payload = await getPayloadHMR({ config: configPromise });

    // Build dynamic where clause
    const whereClause: CourseRunWhereClause = {};

    if (courseId) {
      whereClause.course = { equals: parseInt(courseId) };
    }

    if (campusId) {
      whereClause.campus = { equals: parseInt(campusId) };
    }

    const convocations = await payload.find({
      collection: 'course-runs',
      where: whereClause as unknown as Record<string, unknown>,
      limit: 100,
      sort: '-start_date',
      depth: 2, // Populate course and campus relationships
    });

    return NextResponse.json({
      success: true,
      data: convocations.docs.map((conv: PopulatedCourseRun) => ({
        id: conv.id,
        cursoId: typeof conv.course === 'object' ? conv.course.id : conv.course,
        cursoNombre: typeof conv.course === 'object' ? conv.course.name : 'Curso',
        cursoTipo: typeof conv.course === 'object' ? conv.course.course_type : undefined,
        campusId: typeof conv.campus === 'object' && conv.campus !== null ? conv.campus.id : conv.campus,
        campusNombre: typeof conv.campus === 'object' && conv.campus !== null ? conv.campus.name : 'Sin sede',
        fechaInicio: conv.start_date,
        fechaFin: conv.end_date,
        horario: `${conv.schedule_days?.join(', ') ?? ''} ${conv.schedule_time_start ?? ''}-${conv.schedule_time_end ?? ''}`,
        estado: conv.status,
        plazasTotales: conv.max_students,
        plazasOcupadas: conv.current_enrollments,
        precio: conv.price_override ?? 0,
        profesor: normalizeInstructorName(conv.instructor),
        modalidad: conv.modality ?? 'presencial',
      })),
      total: convocations.totalDocs,
    });
  } catch (error: unknown) {
    console.error('Error fetching convocations:', error);
    // Fallback defensivo para entornos con schema parcial/migraciones pendientes.
    // Permite que Programación cargue sin error fatal mientras se corrige la base.
    return NextResponse.json({
      success: true,
      data: [],
      total: 0,
      warning: 'Convocatorias no disponibles temporalmente: esquema de base de datos incompleto.',
    });
  }
}
