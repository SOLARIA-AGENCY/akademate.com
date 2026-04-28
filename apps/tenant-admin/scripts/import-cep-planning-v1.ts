import { getPayload } from 'payload';
import config from '../src/payload.config';
import {
  normalizeText,
  CEP_STAFF_SEEDS,
  assertDatabaseConfig,
  teacherNames,
  parsePlanningMarkdownFile,
  parseSpanishDate,
  parseEuroAmount,
  splitName,
  type ParsedConvocationRow,
} from './cep-planning-v1';

type Options = {
  inputPath: string;
  tenantId: number;
  apply: boolean;
  json: boolean;
  limit?: number;
};

type PayloadClient = Awaited<ReturnType<typeof getPayload>>;

const DEFAULT_INPUT_PATH = '/Users/carlosjperez/Downloads/cep_formacion_planificacion_cursos_sedes_personal.md';

function parseArgs(argv: string[]): Options {
  const options: Options = { inputPath: DEFAULT_INPUT_PATH, tenantId: 1, apply: false, json: false };
  for (const arg of argv) {
    if (arg === '--apply') options.apply = true;
    if (arg === '--json') options.json = true;
    if (arg.startsWith('--input=')) options.inputPath = arg.slice('--input='.length);
    if (arg.startsWith('--tenant-id=')) options.tenantId = Number(arg.split('=')[1]);
    if (arg.startsWith('--limit=')) options.limit = Number(arg.split('=')[1]);
  }
  return options;
}

async function fetchAll(payload: PayloadClient, collection: string, where: Record<string, unknown>) {
  const docs = [];
  let page = 1;
  while (true) {
    const result = await payload.find({ collection, where, page, limit: 100, depth: 0, overrideAccess: true });
    docs.push(...result.docs);
    if (!result.totalPages || page >= result.totalPages) break;
    page += 1;
  }
  return docs;
}

const COURSE_TITLE_ALIASES: Record<string, string> = {
  acv: 'auxiliar clinico veterinario',
  'acv aux clinico veterinario': 'auxiliar clinico veterinario',
  'atv combo alicia': 'ayudante tecnico veterinario atv',
  'atv combo elena': 'ayudante tecnico veterinario atv',
  'atv combo viernes manana': 'ayudante tecnico veterinario atv',
  'aux en clinicas esteticas': 'auxiliar de clinicas esteticas',
  'auxiliar en clinicas esteticas': 'auxiliar de clinicas esteticas',
  'aux odontologia': 'auxiliar de odontologia e higiene',
  'auxiliar odontologia': 'auxiliar de odontologia e higiene',
  'cfgm farmacia': 'cfgm farmacia y parafarmacia',
  'cfgsh higiene': 'cfgs higiene bucodental',
  'adiestramiento canino nivel 1': 'adiestramiento canino i',
  'adiestramiento canino nivel 2': 'adiestramiento canino ii',
  'agente funerario': 'agente funerario tanatopraxia y tanatoestetica',
  'auxiliar de farmacia y parafarmacia dermo': 'farmacia y dermocosmetica',
  'auxiliar de farmacia y parafarmacia dermocosmetica': 'farmacia y dermocosmetica',
  'instructor de pilates': 'instructor a de pilates',
  'instructor de yoga': 'instructor a de yoga',
  'quiromasaje holistico': 'quiromasaje',
  'mejora tu productividad con inteligencia artificial': 'mejora tu productividad con inteligencia artificial',
  'inteligencia artificial aplicada a la empresa': 'inteligencia artificial aplicada a la empresa',
  'fiscalidad en las pymes y gestion fiscal integrada': 'fiscalidad en las pymes y uso de programa de gestion fiscal integrado',
  'impuestos y obligaciones fiscales del autonomo': 'impuestos y obligaciones fiscales de la persona trabajadora autonoma',
  'organizacion del transporte y la distribucion': 'organizacion del transporte y distribucion',
  'transformacion digital de la empresa': 'transformacion digital en la empresa',
  facturaplus: 'facturaplus facturacion en la empresa',
  'digitalizacion y rrss como estrategia corporativa': 'digitalizacion y rr ss como estrategia corporativa',
};

function stripPlanningCourseCode(value: string): string {
  return value
    .replace(/^\d{2}\s+\d{2}\s+\d{4,6}\s+/, '')
    .replace(/\b[a-z]{3,5}\d{2,4}[a-z]*\b/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

function courseLookupKeys(value: string): string[] {
  const normalized = normalizeText(value);
  const stripped = stripPlanningCourseCode(normalized);
  const keys = [normalized, stripped, COURSE_TITLE_ALIASES[normalized], COURSE_TITLE_ALIASES[stripped]]
    .filter((key): key is string => Boolean(key));
  return [...new Set(keys.map(normalizeText).filter(Boolean))];
}

function buildCourseLookup(courses: Record<string, unknown>[]) {
  const courseByKey = new Map<string, Record<string, unknown>>();
  for (const course of courses) {
    for (const key of courseLookupKeys(String(course.name ?? ''))) {
      if (!courseByKey.has(key)) courseByKey.set(key, course);
    }
  }
  return courseByKey;
}

function findCourseByTitle(courseByKey: Map<string, Record<string, unknown>>, title: string) {
  for (const key of courseLookupKeys(title)) {
    const course = courseByKey.get(key);
    if (course) return course;
  }
  return null;
}

function normalizeRoomName(value: string): string {
  return normalizeText(value).replace(/^aula /, 'aula ');
}

async function findOrCreateTeacher(payload: PayloadClient, tenantId: number, name: string, apply: boolean) {
  void tenantId;
  const seed = CEP_STAFF_SEEDS.find((person) => person.fullName === name);
  const candidateNames = new Set([name, ...(seed?.aliases ?? [])].map(normalizeText));
  const existing = await payload.find({
    collection: 'staff',
    where: { full_name: { equals: name } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  if (existing.docs[0]) return { id: existing.docs[0].id, action: 'existing' };
  const staff = await payload.find({ collection: 'staff', limit: 500, depth: 0, overrideAccess: true });
  const aliasMatch = staff.docs.find((member) => {
    const fullName = typeof member.full_name === 'string' ? member.full_name : '';
    const aliasNames = typeof member.alias_names === 'string' ? member.alias_names.split(',').map((alias) => alias.trim()) : [];
    return [fullName, ...aliasNames].some((candidate) => candidateNames.has(normalizeText(candidate)));
  });
  if (aliasMatch) return { id: aliasMatch.id, action: 'existing' };
  if (!apply) return { id: null, action: 'create' };

  const split = splitName(name);
  const created = await payload.create({
    collection: 'staff',
    data: {
      staff_type: 'profesor',
      ...split,
      full_name: name,
      position: 'Docente',
      contract_type: 'freelance',
      employment_status: 'active',
      assigned_campuses: [],
      is_active: true,
      data_quality_status: 'pending_validation',
      source: 'cep_planning_2026',
      alias_names: seed?.aliases.join(', '),
      detected_courses: seed?.detectedCourses.join(', '),
      notes: [
        seed?.specialties.length ? `Especialidades CEP: ${seed.specialties.join(', ')}` : '',
        seed?.notes ?? 'Docente creado automáticamente desde docentes detectados en convocatorias CEP.',
      ].filter(Boolean).join('\n'),
    },
    overrideAccess: true,
  });
  return { id: created.id, action: 'created' };
}

function allTeacherNamesFromRows(rows: ParsedConvocationRow[]) {
  const names = new Set<string>();
  for (const row of rows) {
    for (const name of teacherNames(row.teacherRaw)) {
      names.add(name);
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'es'));
}

function relationId(value: unknown): string | number | null {
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: string | number }).id;
    return typeof id === 'string' || typeof id === 'number' ? id : null;
  }
  return null;
}

function findRoom(row: ParsedConvocationRow, rooms: Record<string, unknown>[], campus: Record<string, unknown> | undefined) {
  const wanted = normalizeRoomName(row.roomRaw);
  const campusId = campus?.id;
  const campusRooms = campusId == null ? rooms : rooms.filter((room) => relationId(room.campus) === campusId);
  return campusRooms.find((room) => {
    const haystack = normalizeText(`${room.name ?? ''} ${room.code ?? ''}`);
    return haystack.includes(wanted) || wanted.includes(normalizeText(String(room.name ?? '')));
  }) ?? null;
}

function isoDate(raw: string): string | undefined {
  const date = parseSpanishDate(raw);
  return date ? date.toISOString() : undefined;
}

function sameRelation(left: unknown, right: unknown): boolean {
  const leftId = relationId(left);
  const rightId = relationId(right);
  return leftId != null && rightId != null && String(leftId) === String(rightId);
}

function sameIsoDate(left: unknown, right: unknown): boolean {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  return new Date(left).toISOString() === new Date(right).toISOString();
}

function findExistingCourseRun(
  existingRuns: Record<string, unknown>[],
  data: {
    course?: unknown;
    campus?: unknown;
    classroom?: unknown;
    start_date?: string;
    end_date?: string;
    schedule_time_start?: string;
    schedule_time_end?: string;
  }
) {
  return existingRuns.find((run) => {
    if (!sameRelation(run.course, data.course)) return false;
    if (!sameRelation(run.campus, data.campus)) return false;
    if (!sameRelation(run.classroom, data.classroom)) return false;
    if (!data.start_date || !sameIsoDate(run.start_date, data.start_date)) return false;
    if (!data.end_date || !sameIsoDate(run.end_date, data.end_date)) return false;
    return String(run.schedule_time_start ?? '') === String(data.schedule_time_start ?? '')
      && String(run.schedule_time_end ?? '') === String(data.schedule_time_end ?? '');
  }) ?? null;
}

async function syncCourseOperationalStatus(
  payload: PayloadClient,
  tenantId: number,
  rows: ParsedConvocationRow[],
  apply: boolean
) {
  const courses = await fetchAll(payload, 'courses', { tenant: { equals: tenantId } });
  const courseByKey = buildCourseLookup(courses);
  const activeCourseIds = new Set<string>();
  const missingTitles = new Set<string>();
  for (const row of rows) {
    const course = findCourseByTitle(courseByKey, row.courseTitle);
    if (course?.id != null) {
      activeCourseIds.add(String(course.id));
    } else {
      missingTitles.add(normalizeText(row.courseTitle));
    }
  }
  const actions = [];

  for (const course of courses) {
    const shouldBeActive = course.id != null && activeCourseIds.has(String(course.id));
    const nextStatus = shouldBeActive ? 'active' : 'inactive';
    if (course.operational_status === nextStatus) {
      actions.push({ action: 'skip', id: course.id, name: course.name, operational_status: nextStatus });
      continue;
    }
    if (apply) {
      await payload.update({
        collection: 'courses',
        id: course.id,
        data: { operational_status: nextStatus },
        overrideAccess: true,
      });
    }
    actions.push({ action: 'update', id: course.id, name: course.name, operational_status: nextStatus });
  }

  const missing = [...missingTitles].filter(Boolean).sort((a, b) => a.localeCompare(b, 'es'));
  return { actions, missing };
}

async function ensureDetectedTeachers(
  payload: PayloadClient,
  tenantId: number,
  rows: ParsedConvocationRow[],
  apply: boolean
) {
  const actions = [];
  for (const name of allTeacherNamesFromRows(rows)) {
    actions.push({ name, ...(await findOrCreateTeacher(payload, tenantId, name, apply)) });
  }
  return actions;
}

async function importConvocations(
  payload: PayloadClient,
  tenantId: number,
  rows: ParsedConvocationRow[],
  apply: boolean
) {
  const [courses, campuses, rooms] = await Promise.all([
    fetchAll(payload, 'courses', { tenant: { equals: tenantId } }),
    fetchAll(payload, 'campuses', { tenant: { equals: tenantId } }),
    fetchAll(payload, 'classrooms', { tenant: { equals: tenantId } }),
  ]);
  const courseByTitle = buildCourseLookup(courses);
  const campusBySlug = new Map(campuses.map((campus) => [String(campus.slug), campus]));
  const existingRuns = await fetchAll(payload, 'course-runs', { tenant: { equals: tenantId } });
  const actions = [];

  for (const row of rows) {
    const course = findCourseByTitle(courseByTitle, row.courseTitle);
    const campus = campusBySlug.get(row.campusSlug);
    const room = findRoom(row, rooms, campus);
    const startDate = isoDate(row.startDateRaw);
    const endDate = isoDate(row.endDateRaw);
    const issues = [...row.issues];
    if (!course) issues.push('course_not_found');
    if (!campus) issues.push('campus_not_found');
    if (!room) issues.push('room_not_found');
    if (!startDate || !endDate) issues.push('missing_structured_dates');

    const names = teacherNames(row.teacherRaw);
    const instructorResults = [];
    for (const name of names) {
      instructorResults.push(await findOrCreateTeacher(payload, tenantId, name, apply));
    }
    const instructorIds = instructorResults.map((result) => result.id).filter((id): id is number => typeof id === 'number');

    const data = {
      course: course?.id,
      campus: campus?.id,
      classroom: room?.id,
      start_date: startDate,
      end_date: endDate,
      schedule_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].filter((day) =>
        /l-v/i.test(row.scheduleRaw) ? true : row.scheduleRaw.toLowerCase().includes(day.slice(0, 3))
      ),
      schedule_time_start: row.scheduleRaw.match(/(\d{1,2}:\d{2})/)?.[1] ? `${row.scheduleRaw.match(/(\d{1,2}:\d{2})/)?.[1]}:00` : undefined,
      schedule_time_end: row.scheduleRaw.match(/[-–]\s*(\d{1,2}:\d{2})/)?.[1] ? `${row.scheduleRaw.match(/[-–]\s*(\d{1,2}:\d{2})/)?.[1]}:00` : undefined,
      status: 'draft',
      planning_status: issues.length > 0 ? 'pending_validation' : 'draft',
      training_type: row.trainingType,
      shift: row.shift,
      min_students: 1,
      max_students: Number(row.capacityRaw) || (typeof room?.capacity === 'number' ? room.capacity : 1),
      current_enrollments: Number(row.enrolledRaw.match(/\d+/)?.[0] ?? 0),
      price_override: parseEuroAmount(row.priceRaw) ?? undefined,
      price_source: row.priceRaw ? 'manual_import' : 'unknown',
      instructor: instructorIds[0],
      instructors: instructorIds.length > 0 ? instructorIds : undefined,
      notes: [
        `Importado desde CEP Planning 2026: ${row.section}`,
        row.issues.length > 0 ? `Issues: ${issues.join(', ')}` : '',
        row.priceRaw ? `Precio origen: ${row.priceRaw}` : '',
        row.installmentsRaw ? `Cuotas origen: ${row.installmentsRaw}` : '',
      ].filter(Boolean).join('\n'),
      tenant: tenantId,
    };

    if (!course || !campus || !room || !startDate || !endDate || issues.includes('invalid_date_range')) {
      actions.push({ action: 'pending', courseTitle: row.courseTitle, issues });
      continue;
    }

    const existingRun = findExistingCourseRun(existingRuns, data);
    if (existingRun) {
      if (apply) {
        await payload.update({
          collection: 'course-runs',
          id: existingRun.id,
          data,
          overrideAccess: true,
        });
      }
      actions.push({ action: 'update', id: existingRun.id, courseTitle: row.courseTitle, issues });
      continue;
    }

    if (apply) {
      const created = await payload.create({ collection: 'course-runs', data, overrideAccess: true });
      existingRuns.push(created);
      actions.push({ action: 'create', id: created.id, courseTitle: row.courseTitle, issues });
    } else {
      actions.push({ action: 'create', courseTitle: row.courseTitle, issues });
    }
  }

  return actions;
}

export async function runImport(options: Options) {
  assertDatabaseConfig();
  const parsedRows = await parsePlanningMarkdownFile(options.inputPath);
  const rows = typeof options.limit === 'number' ? parsedRows.slice(0, options.limit) : parsedRows;
  const payload = await getPayload({ config });
  const teacherSync = await ensureDetectedTeachers(payload, options.tenantId, rows, options.apply);
  const courseSync = await syncCourseOperationalStatus(payload, options.tenantId, rows, options.apply);
  const convocationActions = await importConvocations(payload, options.tenantId, rows, options.apply);

  return {
    mode: options.apply ? 'apply' : 'dry-run',
    tenantId: options.tenantId,
    inputPath: options.inputPath,
    parsedRows: rows.length,
    courseSync: {
      updatedOrSkipped: courseSync.actions.length,
      missingCurrentCourses: courseSync.missing,
    },
    teacherSync: {
      total: teacherSync.length,
      existing: teacherSync.filter((action) => action.action === 'existing').length,
      create: teacherSync.filter((action) => action.action === 'create').length,
      created: teacherSync.filter((action) => action.action === 'created').length,
      sample: teacherSync.slice(0, 20),
    },
    convocations: {
      total: convocationActions.length,
      create: convocationActions.filter((action) => action.action === 'create').length,
      pending: convocationActions.filter((action) => action.action === 'pending').length,
      sample: convocationActions.slice(0, 20),
    },
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await runImport(options);
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(`CEP Planning import (${result.mode})`);
  console.log(`Parsed rows: ${result.parsedRows}`);
  console.log(`Course sync actions: ${result.courseSync.updatedOrSkipped}`);
  console.log(`Teacher sync: ${result.teacherSync.existing} existing, ${result.teacherSync.create + result.teacherSync.created} create/created`);
  console.log(`Missing current courses: ${result.courseSync.missingCurrentCourses.length}`);
  console.log(`Convocations: ${result.convocations.create} create, ${result.convocations.pending} pending`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main().catch((error) => {
    console.error('import-cep-planning-v1 failed:', error);
    process.exit(1);
  });
}
