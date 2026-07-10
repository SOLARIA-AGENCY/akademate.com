import { getPayload } from 'payload'
import configPromise from '@payload-config';
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import type { CourseRun, Course, Campus } from '../../../src/payload-types';
import {
  evaluateInstructorAreaQualification,
  relationId,
  type RelationValue,
} from '@/app/lib/server/course-run-planning';

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
  horasPracticas?: string | null;
  certificacion?: string | null;
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
  instructors?: Array<number | string | StaffLike> | null;
  modality?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  schedule_days?: string[] | null;
  schedule_time_start?: string | null;
  schedule_time_end?: string | null;
  status?: string | null;
  enrollment_status?: string | null;
  enrollment_deadline?: string | null;
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
  practice_hours?: string | null;
  certification_type?: string | null;
  notes?: string | null;
}

type CampaignState = 'active' | 'paused' | 'draft' | 'completed' | 'archived' | 'none';

interface CampaignLike {
  id: number | string;
  name?: string | null;
  status?: string | null;
  course?: number | string | { id?: number | string } | null;
}

interface StaffLike {
  id?: number | string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  is_active?: boolean | null;
  employment_status?: string | null;
  qualified_areas?: unknown;
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
  practice_hours: string | undefined;
  certification_type: string | undefined;
  instructor: number | undefined;
  instructors: number[] | undefined;
  administrative_owner: number | undefined;
  training_type: string;
  planning_status: string;
  shift: string;
  notes: string;
}

interface LoosePayloadClient {
  create: (args: { collection: string; data: Record<string, unknown>; user?: unknown }) => Promise<{ id: string | number }>;
  findByID: (args: {
    collection: string;
    id: string | number;
    depth?: number;
    overrideAccess?: boolean;
    user?: unknown;
  }) => Promise<Record<string, unknown>>;
  update: (args: {
    collection: string;
    id: string | number;
    data: Record<string, unknown>;
    overrideAccess?: boolean;
    user?: unknown;
  }) => Promise<Record<string, unknown>>;
}

type PayloadRequestUser = Record<string, unknown>;

function getSessionToken(request: NextRequest): string | null {
  const payloadToken = request.cookies.get('payload-token')?.value;
  if (payloadToken) return payloadToken;

  for (const cookieName of ['akademate_session', 'cep_session']) {
    const rawSession = request.cookies.get(cookieName)?.value;
    if (!rawSession) continue;

    const candidates = [rawSession];
    try {
      const decoded = decodeURIComponent(rawSession);
      if (decoded !== rawSession) candidates.push(decoded);
    } catch {
      // Continue with the raw legacy cookie representation.
    }

    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate) as Record<string, unknown>;
        const token = [parsed.token, parsed.socketToken, parsed.payloadToken, parsed.jwt].find(
          (value): value is string => typeof value === 'string' && value.trim().length > 0,
        );
        if (token) return token;
      } catch {
        // Continue with the next supported legacy cookie representation.
      }
    }
  }

  return null;
}

async function authenticateRequest(
  request: NextRequest,
  payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<PayloadRequestUser | null> {
  const auth = payload.auth as unknown as (args: {
    collection: string;
    headers: Headers;
  }) => Promise<{ user?: unknown } | null>;
  const requestHeaders = new Headers(request.headers);
  const authorization = requestHeaders.get('authorization');
  const cookie = requestHeaders.get('cookie');
  const headerAttempts = [
    requestHeaders,
    new Headers({
      ...(cookie ? { cookie } : {}),
      ...(authorization ? { authorization } : {}),
      DisableAutologin: 'true',
    }),
  ];

  const sessionToken = getSessionToken(request);
  if (sessionToken) {
    headerAttempts.push(
      new Headers({ cookie: `payload-token=${sessionToken}`, DisableAutologin: 'true' }),
      new Headers({
        authorization: `JWT ${sessionToken}`,
        DisableAutologin: 'true',
      }),
      new Headers({
        authorization: `Bearer ${sessionToken}`,
        DisableAutologin: 'true',
      }),
    );
  }

  for (const headers of headerAttempts) {
    try {
      const result = await auth({ collection: 'users', headers });
      if (result?.user && typeof result.user === 'object') {
        return result.user as unknown as PayloadRequestUser;
      }
    } catch {
      // Try the next supported Payload extraction strategy.
    }
  }

  if (!sessionToken || !process.env.PAYLOAD_SECRET) return null;

  try {
    const verified = await jwtVerify(
      sessionToken,
      new TextEncoder().encode(process.env.PAYLOAD_SECRET),
    );
    const collection = verified.payload.collection;
    const id = verified.payload.id ?? verified.payload.sub;
    if (collection !== 'users' || (typeof id !== 'string' && typeof id !== 'number')) {
      return null;
    }

    const user = await payload.findByID({
      collection: 'users',
      id,
      depth: 0,
      overrideAccess: true,
    });
    return user && typeof user === 'object'
      ? (user as unknown as PayloadRequestUser)
      : null;
  } catch {
    return null;
  }
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

function normalizeInstructorNames(primary: unknown, instructors: unknown): string[] {
  const names = new Map<string, string>();
  const pushInstructor = (instructor: unknown) => {
    const name = normalizeInstructorName(instructor);
    if (name !== 'Sin asignar') {
      const key =
        instructor && typeof instructor === 'object' && 'id' in instructor
          ? String((instructor as { id?: string | number }).id ?? name)
          : name;
      names.set(key, name);
    }
  };

  pushInstructor(primary);
  if (Array.isArray(instructors)) {
    for (const instructor of instructors) {
      pushInstructor(instructor);
    }
  }

  return Array.from(names.values());
}

function normalizeInstructorRefs(primary: unknown, instructors: unknown): Array<{ id: string; name: string }> {
  const refs = new Map<string, { id: string; name: string }>();
  const pushInstructor = (instructor: unknown) => {
    if (!instructor || typeof instructor !== 'object' || !('id' in instructor)) return;
    const id = String((instructor as { id?: string | number }).id ?? '');
    if (!id) return;
    const name = normalizeInstructorName(instructor);
    if (name !== 'Sin asignar') refs.set(id, { id, name });
  };

  pushInstructor(primary);
  if (Array.isArray(instructors)) {
    for (const instructor of instructors) pushInstructor(instructor);
  }

  return Array.from(refs.values());
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

const CEP_EXCEL_PLANNING_METADATA = [
  {
    aliases: ['Auxiliar en Clínicas Estéticas', 'Auxiliar de Clínicas Estéticas'],
    startDate: '2026-05-11',
    practiceHours: '150h',
    certification: 'CEP + U.V 210€',
  },
  {
    aliases: ['Auxiliar de Farmacia y Parafarmacia + Dermocosmética', 'Farmacia y Dermocosmética'],
    startDate: '2026-09-08',
    practiceHours: '350h',
    certification: 'CEP',
  },
  {
    aliases: ['Instructor de Pilates', 'Instructor/a de Pilates'],
    startDate: '2026-09-09',
    practiceHours: null,
    certification: 'CEP',
  },
  {
    aliases: ['Quiromasaje Holístico', 'Quiromasaje'],
    startDate: '2026-09-11',
    practiceHours: '100h',
    certification: 'CEP',
  },
  {
    aliases: ['ACV (Aux. Clínico Veterinario)', 'Auxiliar Clínico Veterinario'],
    startDate: '2026-09-14',
    practiceHours: '350h',
    certification: 'CEP + U.V 200€',
  },
  {
    aliases: ['Auxiliar en Clínicas Estéticas', 'Auxiliar de Clínicas Estéticas'],
    startDate: '2026-09-17',
    practiceHours: '150h',
    certification: 'CEP + U.V 210€',
  },
  {
    aliases: ['Auxiliar Odontología', 'Auxiliar de Odontología e Higiene'],
    startDate: '2026-11-25',
    practiceHours: '200h',
    certification: 'CEP',
  },
  {
    aliases: ['Auxiliar de Enfermería'],
    startDate: '2026-06-24',
    practiceHours: '300h',
    certification: 'CEP',
  },
  {
    aliases: ['Auxiliar de Farmacia y Parafarmacia + Dermocosmética', 'Farmacia y Dermocosmética'],
    startDate: '2026-06-17',
    practiceHours: '350h',
    certification: 'CEP',
  },
  {
    aliases: ['ATV Combo (Alicia)', 'Ayudante Técnico Veterinario (ATV)'],
    startDate: '2026-09-08',
    practiceHours: '50h',
    certification: 'CEP',
  },
  {
    aliases: ['Auxiliar de Enfermería'],
    startDate: '2026-09-21',
    practiceHours: '300h',
    certification: 'CEP',
  },
  {
    aliases: ['Agente Funerario', 'Agente Funerario (Tanatopraxia y Tanatoestética)'],
    startDate: '2026-10-01',
    practiceHours: '160h',
    certification: 'CEP',
  },
  {
    aliases: ['Auxiliar de Farmacia y Parafarmacia + Dermocosmética', 'Farmacia y Dermocosmética'],
    startDate: '2026-10-23',
    practiceHours: '350h',
    certification: 'CEP',
  },
  {
    aliases: ['Peluquería Canina y Felina'],
    startDate: '2026-10-26',
    practiceHours: '25h adicionales',
    certification: 'CEP',
  },
] satisfies Array<{
  aliases: string[];
  startDate: string;
  practiceHours: string | null;
  certification: string | null;
}>;

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

function extractExcelPlanningMetadata(notes?: string | null): {
  certification: string | null;
  practiceHours: string | null;
} {
  const text = notes ?? '';
  const certificationMatch = text.match(/Diploma:\s*([^\n.]+)/i);
  const practiceMatch = text.match(/Prácticas:\s*([^\n.]+)/i);
  const normalize = (value?: string) => {
    const clean = value?.trim();
    if (!clean || clean === '-' || /^n\/?a$/i.test(clean)) return null;
    return clean;
  };

  return {
    certification: normalize(certificationMatch?.[1]),
    practiceHours: normalize(practiceMatch?.[1]),
  };
}

function normalizePlanningText(value?: string | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function getExcelPlanningMetadataFromSheet(
  courseName?: string | null,
  startDate?: string | null,
): {
  certification: string | null;
  practiceHours: string | null;
} {
  const normalizedCourse = normalizePlanningText(courseName);
  const dateKey = (startDate ?? '').slice(0, 10);
  if (!normalizedCourse || !dateKey) return { certification: null, practiceHours: null };

  const match = CEP_EXCEL_PLANNING_METADATA.find((item) => {
    if (item.startDate !== dateKey) return false;
    return item.aliases.some((alias) => {
      const normalizedAlias = normalizePlanningText(alias);
      return normalizedCourse.includes(normalizedAlias) || normalizedAlias.includes(normalizedCourse);
    });
  });

  return {
    certification: match?.certification ?? null,
    practiceHours: match?.practiceHours ?? null,
  };
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

async function getCourseRequiredAreaId(
  payload: LoosePayloadClient,
  course: unknown,
): Promise<string | number | null> {
  if (course && typeof course === 'object') {
    const areaId = relationId((course as { area_formativa?: RelationValue }).area_formativa);
    if (areaId != null) return areaId;
  }

  const courseId = getRelationId(course);
  if (!courseId) return null;

  const courseDoc = await payload.findByID({
    collection: 'courses',
    id: courseId,
    depth: 1,
  });

  return relationId((courseDoc as { area_formativa?: RelationValue }).area_formativa);
}

function formatSchedule(days?: string[] | null, start?: string | null, end?: string | null): string {
  const dayText = (days ?? []).map((day) => DAY_LABELS[day] ?? day.toUpperCase()).join(', ');
  const startText = start?.slice(0, 5) ?? '';
  const endText = end?.slice(0, 5) ?? '';
  const timeText = startText && endText ? `${startText}-${endText}` : startText || endText;
  return [dayText, timeText].filter(Boolean).join(' · ');
}

function normalizeOptionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function mapPlanningStatusToCourseRunStatus(status?: string | null): CourseRun['status'] {
  if (status === 'published') return 'published';
  if (status === 'in_progress') return 'in_progress';
  if (status === 'completed') return 'completed';
  if (status === 'cancelled') return 'cancelled';
  if (status === 'enrollment_closed') return 'enrollment_closed';
  if (status === 'draft' || status === 'borrador') return 'draft';
  return 'enrollment_open';
}

function mapCourseRunStatusToPlanningStatus(
  status: CourseRun['status'],
  planningStatus?: CreateConvocationRequest['planningStatus'],
): string {
  if (planningStatus) return planningStatus;
  if (status === 'draft') return 'draft';
  if (status === 'cancelled') return 'cancelled';
  if (status === 'completed') return 'completed';
  return 'published';
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
      horasPracticas,
      certificacion,
    } = body;

    // Validaciones basicas
    if (!courseId || !fechaInicio || !fechaFin || !horario || horario.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos: courseId, fechaInicio, fechaFin, horario' },
        { status: 400 }
      );
    }

     
    const payload = await getPayload({ config: configPromise });
    const user = await authenticateRequest(request, payload);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 },
      );
    }

    // Verificar que el curso existe
    const course = await payload.findByID({
      collection: 'courses',
      id: parseInt(courseId),
      user,
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
    const normalizedStatus = mapPlanningStatusToCourseRunStatus(estado);
    const courseRunData: CourseRunCreateData = {
      course: parseInt(courseId),
      campus: campusId,
      classroom: classroomId,
      start_date: fechaInicio,
      end_date: fechaFin,
      schedule_days: horario.map((e: ScheduleEntry) => e.day as DayKey),
      schedule_time_start: earliestStart,
      schedule_time_end: latestEnd,
      status: normalizedStatus,
      min_students: 5,
      max_students: plazasTotales,
      current_enrollments: 0,
      price_override: precio > 0 ? precio : undefined,
      price_snapshot: precio > 0 ? precio : undefined,
      enrollment_fee_snapshot: typeof matricula === 'number' && matricula >= 0 ? matricula : undefined,
      installment_amount_snapshot: typeof cuotaImporte === 'number' && cuotaImporte >= 0 ? cuotaImporte : undefined,
      installment_count_snapshot: typeof cuotaCantidad === 'number' && cuotaCantidad >= 0 ? cuotaCantidad : undefined,
      price_source: precio > 0 ? 'run_override' : 'course_default',
      practice_hours: normalizeOptionalText(horasPracticas),
      certification_type: normalizeOptionalText(certificacion),
      instructor: primaryInstructorId,
      instructors: instructorIds.length > 0 ? instructorIds : undefined,
      administrative_owner: administrativeOwnerId,
      training_type: trainingType ?? 'private',
      planning_status: mapCourseRunStatusToPlanningStatus(normalizedStatus, planningStatus),
      shift: turno ?? 'morning',
      notes: '',
    };

    // Crear convocatoria en Payload
    const payloadLoose = payload as unknown as LoosePayloadClient;
    const convocation = await payloadLoose.create({
      collection: 'course-runs',
      data: courseRunData as unknown as Record<string, unknown>,
      user,
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
    const user = await authenticateRequest(request, payload);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 },
      );
    }
    const payloadLoose = payload as unknown as LoosePayloadClient

    const current = await payloadLoose.findByID({
      collection: 'course-runs',
      id: convocatoriaId,
      depth: 2,
      user,
    })

    const professor = await payloadLoose.findByID({
      collection: 'staff',
      id: profesorId,
      depth: 1,
      user,
    }) as StaffLike

    if (!professor) {
      return NextResponse.json(
        { success: false, error: 'El docente seleccionado no existe.' },
        { status: 404 },
      )
    }

    if (professor.is_active === false || (professor.employment_status && professor.employment_status !== 'active')) {
      return NextResponse.json(
        { success: false, error: 'El docente seleccionado no está activo.' },
        { status: 400 },
      )
    }

    const requiredAreaId = await getCourseRequiredAreaId(payloadLoose, current.course)
    const qualification = evaluateInstructorAreaQualification(professor, requiredAreaId)
    if (!qualification.ok) {
      return NextResponse.json(
        {
          success: false,
          error: qualification.message ?? 'El docente no está habilitado para el área formativa de esta convocatoria.',
        },
        { status: 400 },
      )
    }

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
      user,
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
    const user = await authenticateRequest(request, payload);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 },
      );
    }

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
      user,
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
          user,
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
        const excelMetadata = extractExcelPlanningMetadata(conv.notes);
        const sheetMetadata = getExcelPlanningMetadataFromSheet(
          typeof conv.course === 'object' ? conv.course.name : null,
          conv.start_date,
        );

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
          enrollmentStatus: conv.enrollment_status,
          enrollmentDeadline: conv.enrollment_deadline,
          planningStatus: conv.planning_status,
          trainingType: conv.training_type,
          turno: conv.shift,
          plazasTotales: conv.max_students,
          plazasOcupadas: conv.current_enrollments,
          precio: conv.price_override ?? conv.price_snapshot ?? 0,
          matricula: conv.enrollment_fee_snapshot,
          cuotaImporte: conv.installment_amount_snapshot,
          cuotaCantidad: conv.installment_count_snapshot,
          horasPracticas: conv.practice_hours ?? excelMetadata.practiceHours ?? sheetMetadata.practiceHours,
          certificacion: conv.certification_type ?? excelMetadata.certification ?? sheetMetadata.certification,
          priceSource: conv.price_source,
          profesor: normalizeInstructorName(conv.instructor),
          profesores: normalizeInstructorNames(conv.instructor, conv.instructors),
          profesorRefs: normalizeInstructorRefs(conv.instructor, conv.instructors),
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
