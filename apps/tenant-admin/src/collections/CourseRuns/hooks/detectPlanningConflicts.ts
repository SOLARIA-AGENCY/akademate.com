import type { CollectionBeforeValidateHook } from 'payload';

type Severity = 'blocker' | 'warning';
type Conflict = {
  type: string;
  severity: Severity;
  message: string;
};

type CourseRunLike = {
  id?: string | number;
  classroom?: unknown;
  campus?: unknown;
  instructor?: unknown;
  instructors?: unknown[];
  training_type?: string;
  start_date?: string;
  end_date?: string;
  schedule_days?: string[];
  schedule_time_start?: string;
  schedule_time_end?: string;
  max_students?: number;
  current_enrollments?: number;
  planning_status?: string;
};

type ClassroomLike = {
  id?: string | number;
  name?: string;
  code?: string;
  capacity?: number;
  usage_policy?: string;
};

type CampusLike = {
  id?: string | number;
  name?: string;
  slug?: string;
};

function relationId(value: unknown): string | number | null {
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: string | number }).id;
    return typeof id === 'string' || typeof id === 'number' ? id : null;
  }
  return null;
}

function asArrayIds(values: unknown): Array<string | number> {
  if (!Array.isArray(values)) return [];
  return values.map(relationId).filter((id): id is string | number => id != null);
}

function toSeconds(time?: string): number | null {
  if (!time) return null;
  const parts = time.split(':').map(Number);
  if (parts.length < 2 || parts.some((part) => Number.isNaN(part))) return null;
  return parts[0] * 3600 + parts[1] * 60 + (parts[2] ?? 0);
}

function overlapsTime(startA?: string, endA?: string, startB?: string, endB?: string): boolean {
  const aStart = toSeconds(startA);
  const aEnd = toSeconds(endA);
  const bStart = toSeconds(startB);
  const bEnd = toSeconds(endB);
  if (aStart == null || aEnd == null || bStart == null || bEnd == null) return false;
  return aStart < bEnd && bStart < aEnd;
}

function overlapsDate(startA?: string, endA?: string, startB?: string, endB?: string): boolean {
  if (!startA || !endA || !startB || !endB) return false;
  return new Date(startA) <= new Date(endB) && new Date(startB) <= new Date(endA);
}

function intersects<T>(a: T[] = [], b: T[] = []): boolean {
  const bSet = new Set(b);
  return a.some((item) => bSet.has(item));
}

async function readRelation<T>(req: Parameters<CollectionBeforeValidateHook>[0]['req'], collection: string, id: unknown): Promise<T | null> {
  const resolved = relationId(id);
  if (!resolved) return null;
  try {
    const findByID = req.payload.findByID as unknown as (args: Record<string, unknown>) => Promise<unknown>;
    return (await findByID({ collection, id: resolved, depth: 0 })) as T;
  } catch {
    return null;
  }
}

async function upsertConflictRecords(
  req: Parameters<CollectionBeforeValidateHook>[0]['req'],
  courseRunId: string | number | undefined,
  tenant: unknown,
  conflicts: Conflict[]
) {
  if (!courseRunId) return;

  try {
    await (req.payload.update as unknown as (args: Record<string, unknown>) => Promise<unknown>)({
      collection: 'planning-conflicts',
      where: { course_run: { equals: courseRunId }, status: { equals: 'open' } },
      data: { status: 'resolved', resolved_at: new Date().toISOString() },
      overrideAccess: true,
    });
  } catch {
    // Best-effort conflict persistence; validation still enforces blockers.
  }

  for (const conflict of conflicts) {
    try {
      await (req.payload.create as unknown as (args: Record<string, unknown>) => Promise<unknown>)({
        collection: 'planning-conflicts',
        data: {
          course_run: courseRunId,
          tenant: typeof tenant === 'number' || typeof tenant === 'string' ? tenant : undefined,
          type: conflict.type,
          severity: conflict.severity,
          status: 'open',
          message: conflict.message,
          detected_at: new Date().toISOString(),
        },
        overrideAccess: true,
      });
    } catch {
      // Best-effort conflict persistence.
    }
  }
}

export const detectPlanningConflicts: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  req,
  operation,
}) => {
  if (!data || (operation !== 'create' && operation !== 'update')) return data;

  const candidate: CourseRunLike = { ...originalDoc, ...data };
  const conflicts: Conflict[] = [];
  const classroomId = relationId(candidate.classroom);
  const instructorIds = [
    relationId(candidate.instructor),
    ...asArrayIds(candidate.instructors),
  ].filter((id): id is string | number => id != null);

  if (candidate.current_enrollments != null && candidate.max_students != null && candidate.current_enrollments > candidate.max_students) {
    conflicts.push({
      type: 'capacity_exceeded',
      severity: 'warning',
      message: 'Las plazas ocupadas superan la capacidad de la convocatoria.',
    });
  }

  const classroom = await readRelation<ClassroomLike>(req, 'classrooms', candidate.classroom);
  const campus = await readRelation<CampusLike>(req, 'campuses', candidate.campus);

  if (classroom) {
    if (candidate.max_students && classroom.capacity && candidate.max_students > classroom.capacity) {
      conflicts.push({
        type: 'room_capacity_exceeded',
        severity: 'warning',
        message: `La convocatoria supera la capacidad física del aula ${classroom.name ?? classroom.code ?? ''}.`,
      });
    }

    if (classroom.usage_policy === 'private_only' && candidate.training_type === 'fped') {
      conflicts.push({
        type: 'room_usage_policy',
        severity: 'blocker',
        message: 'No se puede planificar FPED en un aula reservada para privados.',
      });
    }
    if (classroom.usage_policy === 'fped_only' && candidate.training_type === 'private') {
      conflicts.push({
        type: 'room_usage_policy',
        severity: 'blocker',
        message: 'No se puede planificar un curso privado en un aula reservada para FPED.',
      });
    }
  }

  const campusName = `${campus?.name ?? ''} ${campus?.slug ?? ''}`.toLowerCase();
  const classroomName = `${classroom?.name ?? ''} ${classroom?.code ?? ''}`.toLowerCase();
  if (campusName.includes('norte') && classroomName.includes('aula 5') && candidate.training_type === 'fped') {
    conflicts.push({
      type: 'cep_norte_private_room',
      severity: 'blocker',
      message: 'CEP Norte Aula 5 queda reservada para cursos privados.',
    });
  }
  if (campusName.includes('norte') && /aula\s?[1-4]\b/.test(classroomName) && candidate.training_type === 'private') {
    conflicts.push({
      type: 'cep_norte_fped_room',
      severity: 'blocker',
      message: 'CEP Norte Aulas 1-4 quedan reservadas para FPED.',
    });
  }

  const where: Record<string, unknown> = {
    and: [
      { id: { not_equals: candidate.id ?? '__new__' } },
      { status: { not_in: ['cancelled', 'completed'] } },
    ],
  };

  const existing = await req.payload.find({
    collection: 'course-runs',
    where,
    limit: 250,
    depth: 0,
    overrideAccess: true,
  });

  for (const run of existing.docs as CourseRunLike[]) {
    if (!overlapsDate(candidate.start_date, candidate.end_date, run.start_date, run.end_date)) continue;
    if (!intersects(candidate.schedule_days ?? [], run.schedule_days ?? [])) continue;
    if (!overlapsTime(candidate.schedule_time_start, candidate.schedule_time_end, run.schedule_time_start, run.schedule_time_end)) continue;

    if (classroomId && relationId(run.classroom) === classroomId) {
      conflicts.push({
        type: 'classroom_overlap',
        severity: 'blocker',
        message: 'Existe otra convocatoria en la misma aula y franja horaria.',
      });
    }

    const runInstructorIds = [relationId(run.instructor), ...asArrayIds(run.instructors)].filter((id): id is string | number => id != null);
    if (instructorIds.length > 0 && intersects(instructorIds, runInstructorIds)) {
      conflicts.push({
        type: 'instructor_overlap',
        severity: 'blocker',
        message: 'Existe otra convocatoria con el mismo docente en la misma franja horaria.',
      });
    }
  }

  await upsertConflictRecords(req, candidate.id, data.tenant ?? originalDoc?.tenant, conflicts);

  const hasBlocker = conflicts.some((conflict) => conflict.severity === 'blocker');
  if (hasBlocker && ['validated', 'published'].includes(String(candidate.planning_status ?? ''))) {
    throw new Error(`Planning conflict: ${conflicts.find((conflict) => conflict.severity === 'blocker')?.message}`);
  }

  return data;
};
