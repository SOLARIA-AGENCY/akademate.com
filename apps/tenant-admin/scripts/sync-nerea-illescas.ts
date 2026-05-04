import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { getPayload } from 'payload';
import config from '../src/payload.config';
import { assertDatabaseConfig, normalizeText } from './cep-planning-v1';

type Options = {
  tenantId: number;
  apply: boolean;
  json: boolean;
};

type PayloadClient = Awaited<ReturnType<typeof getPayload>>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STAFF_FULL_NAME = 'Nerea Illescas';
const STAFF_LEGACY_NAME = 'Nerea Illesca';
const STAFF_PHOTO_FILENAME = 'nerea-illescas.webp';
const STAFF_PHOTO_ALT = 'Nerea Illescas, docente de Auxiliar en Clínicas Estéticas';
const COURSE_TITLE = 'Auxiliar de Clínicas Estéticas';
const COURSE_ALIASES = new Set([
  normalizeText(COURSE_TITLE),
  normalizeText('Auxiliar en Clínicas Estéticas'),
  normalizeText('Aux. en Clínicas Estéticas'),
]);

function parseArgs(argv: string[]): Options {
  const options: Options = { tenantId: 1, apply: false, json: false };
  for (const arg of argv) {
    if (arg === '--apply') options.apply = true;
    if (arg === '--json') options.json = true;
    if (arg.startsWith('--tenant-id=')) options.tenantId = Number(arg.split('=')[1]);
  }
  return options;
}

function relationId(value: unknown): string | number | null {
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: string | number }).id;
    return typeof id === 'string' || typeof id === 'number' ? id : null;
  }
  return null;
}

function includesRelation(values: unknown, id: string | number): boolean {
  return Array.isArray(values) && values.some((value) => String(relationId(value)) === String(id));
}

async function findSantaCruzCampus(payload: PayloadClient, tenantId: number) {
  const result = await payload.find({
    collection: 'campuses',
    where: {
      tenant: { equals: tenantId },
      slug: { equals: 'sede-santa-cruz' },
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  return result.docs[0] ?? null;
}

async function ensurePhoto(payload: PayloadClient, apply: boolean) {
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: STAFF_PHOTO_FILENAME } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  if (existing.docs[0]) return { action: 'skip', id: existing.docs[0].id, filename: STAFF_PHOTO_FILENAME };
  if (!apply) return { action: 'create', filename: STAFF_PHOTO_FILENAME };

  const sourcePath = path.resolve(__dirname, '../public/media', STAFF_PHOTO_FILENAME);
  const sourceBuffer = await readFile(sourcePath);
  const optimizedBuffer = await sharp(sourceBuffer)
    .rotate()
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();

  const created = await payload.create({
    collection: 'media',
    data: {
      alt: STAFF_PHOTO_ALT,
      folder: 'staff/photos',
    },
    file: {
      data: optimizedBuffer,
      mimetype: 'image/webp',
      name: STAFF_PHOTO_FILENAME,
      size: optimizedBuffer.length,
    },
    overrideAccess: true,
  });

  return { action: 'create', id: created.id, filename: STAFF_PHOTO_FILENAME };
}

async function findNereaStaff(payload: PayloadClient) {
  const staff = await payload.find({ collection: 'staff', limit: 500, depth: 0, overrideAccess: true });
  const wanted = new Set([STAFF_FULL_NAME, STAFF_LEGACY_NAME, 'Nerea'].map(normalizeText));
  return staff.docs.find((member) => {
    const fullName = typeof member.full_name === 'string' ? member.full_name : '';
    const aliasNames = typeof member.alias_names === 'string' ? member.alias_names.split(',').map((alias) => alias.trim()) : [];
    return [fullName, ...aliasNames].some((candidate) => wanted.has(normalizeText(candidate)));
  }) ?? null;
}

async function ensureStaff(payload: PayloadClient, tenantId: number, photoId: unknown, apply: boolean) {
  const existing = await findNereaStaff(payload);
  const campus = await findSantaCruzCampus(payload, tenantId);
  const assignedCampuses = campus?.id ? [campus.id] : [];
  const data = {
    staff_type: 'profesor',
    first_name: 'Nerea',
    last_name: 'Illescas',
    full_name: STAFF_FULL_NAME,
    position: 'Docente',
    contract_type: 'freelance',
    employment_status: 'active',
    photo: photoId,
    assigned_campuses: assignedCampuses,
    is_active: true,
    data_quality_status: 'pending_validation',
    source: 'cep_planning_2026',
    alias_names: 'Nerea, Nerea Illesca',
    detected_courses: 'Auxiliar en Clínicas Estéticas',
    notes: 'Especialidades CEP: Clínicas estéticas',
  };

  if (existing) {
    if (apply) await payload.update({ collection: 'staff', id: existing.id, data, overrideAccess: true });
    return { action: 'update', id: existing.id, name: STAFF_FULL_NAME };
  }

  if (!apply) return { action: 'create', name: STAFF_FULL_NAME };
  const created = await payload.create({ collection: 'staff', data, overrideAccess: true });
  return { action: 'create', id: created.id, name: STAFF_FULL_NAME };
}

async function findCourse(payload: PayloadClient, tenantId: number) {
  const courses = await payload.find({
    collection: 'courses',
    where: { tenant: { equals: tenantId } },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  });
  return courses.docs.find((course) => COURSE_ALIASES.has(normalizeText(String(course.name ?? '')))) ?? null;
}

async function syncCourseRuns(payload: PayloadClient, tenantId: number, staffId: unknown, apply: boolean) {
  const staffRelationId = relationId(staffId);
  if (staffRelationId == null) return { course: null, actions: [], reason: 'staff_id_missing' };

  const course = await findCourse(payload, tenantId);
  if (!course?.id) return { course: null, actions: [], reason: 'course_not_found' };

  const runs = await payload.find({
    collection: 'course-runs',
    where: {
      tenant: { equals: tenantId },
      course: { equals: course.id },
    },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  });
  const actions = [];

  for (const run of runs.docs) {
    const existingInstructors = Array.isArray(run.instructors) ? run.instructors : [];
    const instructors = includesRelation(existingInstructors, staffRelationId)
      ? existingInstructors.map(relationId).filter((id): id is string | number => id != null)
      : [...existingInstructors.map(relationId).filter((id): id is string | number => id != null), staffRelationId];
    const data = {
      instructor: staffRelationId,
      instructors,
    };

    if (apply) await payload.update({ collection: 'course-runs', id: run.id, data, overrideAccess: true });
    actions.push({ action: 'update', id: run.id, course: course.name });
  }

  return { course: { id: course.id, name: course.name }, actions };
}

export async function runSync(options: Options) {
  assertDatabaseConfig();
  const payload = await getPayload({ config });
  const photo = await ensurePhoto(payload, options.apply);
  const staff = await ensureStaff(payload, options.tenantId, photo.id, options.apply);
  const courseRuns = await syncCourseRuns(payload, options.tenantId, staff.id, options.apply);

  return {
    mode: options.apply ? 'apply' : 'dry-run',
    tenantId: options.tenantId,
    photo,
    staff,
    courseRuns,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await runSync(options);
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(`Nerea Illescas sync (${result.mode})`);
  console.log(`Photo: ${result.photo.action} ${result.photo.id ?? STAFF_PHOTO_FILENAME}`);
  console.log(`Staff: ${result.staff.action} ${result.staff.id ?? STAFF_FULL_NAME}`);
  console.log(`Course: ${result.courseRuns.course?.name ?? result.courseRuns.reason ?? 'not found'}`);
  console.log(`Course runs updated: ${result.courseRuns.actions.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main().catch((error) => {
    console.error('sync-nerea-illescas failed:', error);
    process.exit(1);
  });
}
