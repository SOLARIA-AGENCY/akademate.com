import { getPayload } from 'payload'
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
  profesorIds?: string[];
  sedeId: string;
  aulaId: string;
  trainingType?: 'private' | 'fped' | 'cycle' | 'other';
  planningStatus?: 'draft' | 'pending_validation' | 'validated' | 'published' | 'cancelled' | 'completed';
  turno?: 'morning' | 'afternoon' | 'evening_extra';
  responsableId?: string;
  matricula?: number;
  cuotaImporte?: number;
  cuotaCantidad?: number;
}

/** Where clause for course-runs query */
interface CourseRunWhereClause {
  course?: { equals: number };
  campus?: { equals: number };
}

/** CourseRun with populated relations from depth=2 */
interface PopulatedCourseRun {
  id: number | string;
  codigo?: string | null;
  course: number | (Course & { id: number; name: string; course_type?: string | null; featured_image?: unknown });
  campus?: number | null | (Campus & { id: number; name: string });
  classroom?: number | null | { id: number; name?: string | null; code?: string | null; capacity?: number | null };
  administrative_owner?: number | null | StaffLike;
  instructor?: number | null | StaffLike;
  modality?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  schedule_days?: string[] | null;
  schedule_time_start?: string | null;
  schedule_time_end?: string | null;
  status?: string | null;
  max_students?: number | null;
  current_enrollments?: number | null;
  price_override?: number | null;
  planning_status?: string | null;
  training_type?: string | null;
  shift?: 'morning' | 'afternoon' | 'evening_extra' | null;
  price_snapshot?: number | null;
  enrollment_fee_snapshot?: number | null;
  installment_amount_snapshot?: number | null;
  installment_count_snapshot?: number | null;
  price_source?: 'unknown' | 'course_default' | 'run_override' | 'manual_import' | null;
}

type CampaignState = 'active' | 'paused' | 'draft' | 'completed' | 'archived' | 'none';

interface CampaignLike {
  id: number | string;
  name?: string | null;
  status?: string | null;
  course?: number | string | { id?: number | string } | null;
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
  classroom: number | undefined;
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
  price_snapshot: number | undefined;
  enrollment_fee_snapshot: number | undefined;
  installment_amount_snapshot: number | undefined;
  installment_count_snapshot: number | undefined;
  price_source: string;
  instructor: number | undefined;
  instructors: number[] | undefined;
  administrative_owner: number | undefined;
  training_type: string;
  planning_status: string;
  shift: string;
  notes: string;
}

interface LoosePayloadClient {
  create: (args: { collection: string; data: Record<string, unknown> }) => Promise<{ id: string | number }>;
  findByID: (args: { collection: string; id: string | number; depth?: number }) => Promise<Record<string, unknown>>;
  update: (args: {
    collection: string;
    id: string | number;
    data: Record<string, unknown>;
    overrideAccess?: boolean;
  }) => Promise<Record<string, unknown>>;
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

const DAY_LABELS: Record<string, string> = {
  monday: 'LUN',
  tuesday: 'MAR',
  wednesday: 'MIE',
  thursday: 'JUE',
  friday: 'VIE',
  saturday: 'SAB',
  sunday: 'DOM',
};

function normalizeCampaignStatus(status: unknown): CampaignState {
  if (typeof status !== 'string') return 'none';
  if (['active', 'paused', 'draft', 'completed', 'archived'].includes(status)) {
    return status as CampaignState;
  }
  return 'none';
}

function resolveMediaUrl(media: unknown): string | null {
  if (!media) return null;
  if (typeof media === 'string') return media;
  if (typeof media === 'object') {
    const record = media as Record<string, unknown>;
    if (typeof record.url === 'string') return record.url;
    if (typeof record.filename === 'string') return `/media/${record.filename}`;
  }
  return null;
}

function getRelationId(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'number' || typeof value === 'string') return String(value);
  if (typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: number | string }).id;
    return id == null ? null : String(id);
  }
  return null;
}

function formatSchedule(days?: string[] | null, start?: string | null, end?: string | null): string {
  const dayText = (days ?? []).map((day) => DAY_LABELS[day] ?? day.toUpperCase()).join(', ');
  const startText = start?.slice(0, 5) ?? '';
  const endText = end?.slice(0, 5) ?? '';
  const timeText = startText && endText ? `${startText}-${endText}` : startText || endText;
  return [dayText, timeText].filter(Boolean).join(' · ');
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
      profesorIds,
      sedeId,
      aulaId,
      trainingType,
      planningStatus,
      turno,
      responsableId,
      matricula,
      cuotaImporte,
      cuotaCantidad,
    } = body;

    // Validaciones basicas
    if (!courseId || !fechaInicio || !fechaFin || !horario || horario.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: courseId, fechaInicio, fechaFin, horario' },
        { status: 400 }
      );
    }

     
    const payload = await getPayload({ config: configPromise });

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

    // Parse classroom ID (may be a numeric ID from the classrooms table)
    let classroomId: number | undefined = undefined;
    if (aulaId && aulaId !== '') {
      const parsed = parseInt(aulaId, 10);
      if (!isNaN(parsed)) {
        classroomId = parsed;
      }
    }

    const primaryInstructorId = profesorId && !isNaN(parseInt(profesorId, 10)) ? parseInt(profesorId, 10) : undefined;
    const instructorIds = Array.from(
      new Set(
        [primaryInstructorId, ...(profesorIds ?? []).map((id) => parseInt(id, 10))]
          .filter((id): id is number => typeof id === 'number' && !isNaN(id))
      )
    );
    const administrativeOwnerId =
      responsableId && !isNaN(parseInt(responsableId, 10)) ? parseInt(responsableId, 10) : undefined;

    // Prepare data for course-run creation
    const courseRunData: CourseRunCreateData = {
      course: parseInt(courseId),
      campus: campusId,
      classroom: classroomId,
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
      price_snapshot: precio > 0 ? precio : undefined,
      enrollment_fee_snapshot: typeof matricula === 'number' && matricula >= 0 ? matricula : undefined,
      installment_amount_snapshot: typeof cuotaImporte === 'number' && cuotaImporte >= 0 ? cuotaImporte : undefined,
      installment_count_snapshot: typeof cuotaCantidad === 'number' && cuotaCantidad >= 0 ? cuotaCantidad : undefined,
      price_source: precio > 0 ? 'run_override' : 'course_default',
      instructor: primaryInstructorId,
      instructors: instructorIds.length > 0 ? instructorIds : undefined,
      administrative_owner: administrativeOwnerId,
      training_type: trainingType ?? 'private',
      planning_status: planningStatus ?? (estado === 'abierta' ? 'published' : 'draft'),
      shift: turno ?? 'morning',
      notes: '',
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
 * PATCH /api/convocatorias
 *
 * Asigna una convocatoria existente a un profesor.
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      convocatoriaId?: string | number
      profesorId?: string | number
    }

    const convocatoriaId = body.convocatoriaId
    const profesorId = body.profesorId

    if (!convocatoriaId || !profesorId) {
      return NextResponse.json(
        { success: false, error: 'convocatoriaId y profesorId son obligatorios' },
        { status: 400 },
      )
    }

    const payload = await getPayload({ config: configPromise })
    const payloadLoose = payload as unknown as LoosePayloadClient

    const current = await payloadLoose.findByID({
      collection: 'course-runs',
      id: convocatoriaId,
      depth: 0,
    })

    const existingInstructors = Array.isArray(current.instructors)
      ? current.instructors
          .map((value) => {
            if (typeof value === 'string' || typeof value === 'number') return String(value)
            if (typeof value === 'object' && value !== null && 'id' in value) {
              return String((value as { id: string | number }).id)
            }
            return null
          })
          .filter((value): value is string => Boolean(value))
      : []

    const professorIdString = String(profesorId)
    const instructorIds = Array.from(new Set([professorIdString, ...existingInstructors]))

    const updated = await payloadLoose.update({
      collection: 'course-runs',
      id: convocatoriaId,
      overrideAccess: true,
      data: {
        instructor: Number.isNaN(Number(profesorId)) ? profesorId : Number(profesorId),
        instructors: instructorIds.map((id) => (Number.isNaN(Number(id)) ? id : Number(id))),
      },
    })

    return NextResponse.json({
      success: true,
      data: { id: updated.id },
      message: 'Convocatoria asignada correctamente',
    })
  } catch (error: unknown) {
    console.error('Error assigning convocation instructor:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error al asignar convocatoria' },
      { status: 500 },
    )
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

     
    const payload = await getPayload({ config: configPromise });

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

    const courseIds = Array.from(
      new Set(
        (convocations.docs as PopulatedCourseRun[])
          .map((conv) => getRelationId(conv.course))
          .filter((id): id is string => Boolean(id))
      )
    );

    const campaignByCourse = new Map<string, CampaignLike>();
    if (courseIds.length > 0) {
      try {
        const campaigns = await payload.find({
          collection: 'campaigns',
          where: {
            course: {
              in: courseIds,
            },
          } as unknown as Record<string, unknown>,
          limit: 200,
          depth: 0,
        });

        for (const campaign of campaigns.docs as CampaignLike[]) {
          const relatedCourseId = getRelationId(campaign.course);
          if (!relatedCourseId || campaignByCourse.has(relatedCourseId)) continue;
          campaignByCourse.set(relatedCourseId, campaign);
        }
      } catch (campaignError) {
        console.warn('Campaign lookup skipped for convocatorias:', campaignError);
      }
    }

    return NextResponse.json({
      success: true,
      data: (convocations.docs as PopulatedCourseRun[]).map((conv) => {
        // Extract course image URL
        const courseId = getRelationId(conv.course);
        const campaign = courseId ? campaignByCourse.get(courseId) : undefined;
        const cursoImagen = typeof conv.course === 'object' && conv.course !== null
          ? resolveMediaUrl(conv.course.featured_image)
          : null;
        const dias = conv.schedule_days ?? [];

        return {
          id: conv.id,
          codigo: conv.codigo,
          cursoId: typeof conv.course === 'object' ? conv.course.id : conv.course,
          cursoNombre: typeof conv.course === 'object' ? conv.course.name : 'Curso',
          cursoTipo: typeof conv.course === 'object' ? conv.course.course_type : undefined,
          cursoImagen,
          campusId: typeof conv.campus === 'object' && conv.campus !== null ? conv.campus.id : conv.campus,
          campusNombre: typeof conv.campus === 'object' && conv.campus !== null ? conv.campus.name : 'Sin sede',
          aulaId: typeof conv.classroom === 'object' && conv.classroom !== null ? conv.classroom.id : conv.classroom,
          aulaNombre: typeof conv.classroom === 'object' && conv.classroom !== null ? (conv.classroom.name ?? conv.classroom.code ?? 'Aula') : 'Sin aula',
          aulaCapacidad: typeof conv.classroom === 'object' && conv.classroom !== null ? conv.classroom.capacity : undefined,
          fechaInicio: conv.start_date,
          fechaFin: conv.end_date,
          dias,
          horaInicio: conv.schedule_time_start,
          horaFin: conv.schedule_time_end,
          horario: formatSchedule(dias, conv.schedule_time_start, conv.schedule_time_end),
          estado: conv.status,
          planningStatus: conv.planning_status,
          trainingType: conv.training_type,
          turno: conv.shift,
          plazasTotales: conv.max_students,
          plazasOcupadas: conv.current_enrollments,
          precio: conv.price_override ?? conv.price_snapshot ?? 0,
          matricula: conv.enrollment_fee_snapshot,
          cuotaImporte: conv.installment_amount_snapshot,
          cuotaCantidad: conv.installment_count_snapshot,
          priceSource: conv.price_source,
          profesor: normalizeInstructorName(conv.instructor),
          responsable: normalizeInstructorName(conv.administrative_owner),
          modalidad: conv.modality ?? 'presencial',
          campaignId: campaign ? String(campaign.id) : null,
          campaignName: campaign?.name ?? null,
          campaignStatus: normalizeCampaignStatus(campaign?.status),
        };
      }),
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
