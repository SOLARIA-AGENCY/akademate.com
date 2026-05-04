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

const STAFF_FULL_NAME = 'Abraham Portocarrero';
const STAFF_PHOTO_FILENAME = 'abraham-portocarrero.webp';
const STAFF_PHOTO_ALT = 'Abraham Portocarrero, docente de Quiromasaje Holístico';
const STAFF_ALIASES = ['Abraham', 'Abraham Portocarrero'];
const DETECTED_COURSES = ['Quiromasaje Holístico'];
const COURSE_ALIASES = new Set([
  'Quiromasaje',
  'Quiromasaje Holístico',
  'Quiromasaje Holistico',
  'Quiromasaje - 11 meses',
].map(normalizeText));

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

async function findSantaCruzCampus(payload: PayloadClient, tenantId: number) {
  const campuses = await fetchAll(payload, 'campuses', { tenant: { equals: tenantId } });
  return campuses
    .filter((campus) => String(campus.slug ?? '') === 'sede-santa-cruz')
    .map((campus) => campus.id)
    .filter((id): id is string | number => typeof id === 'string' || typeof id === 'number');
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

async function findAbrahamStaff(payload: PayloadClient) {
  const staff = await payload.find({ collection: 'staff', limit: 500, depth: 0, overrideAccess: true });
  const wanted = new Set([STAFF_FULL_NAME, ...STAFF_ALIASES].map(normalizeText));
  return staff.docs.find((member) => {
    const fullName = typeof member.full_name === 'string' ? member.full_name : '';
    const aliasNames = typeof member.alias_names === 'string' ? member.alias_names.split(',').map((alias) => alias.trim()) : [];
    return [fullName, ...aliasNames].some((candidate) => wanted.has(normalizeText(candidate)));
  }) ?? null;
}

async function ensureStaff(payload: PayloadClient, tenantId: number, photoId: unknown, apply: boolean) {
  const existing = await findAbrahamStaff(payload);
  const assignedCampuses = await findSantaCruzCampus(payload, tenantId);
  const data = {
    staff_type: 'profesor',
    first_name: 'Abraham',
    last_name: 'Portocarrero',
    full_name: STAFF_FULL_NAME,
    position: 'Docente',
    contract_type: 'freelance',
    employment_status: 'active',
    photo: photoId,
    assigned_campuses: assignedCampuses,
    is_active: true,
    data_quality_status: 'pending_validation',
    source: 'cep_planning_2026',
    alias_names: STAFF_ALIASES.join(', '),
    detected_courses: DETECTED_COURSES.join(', '),
    notes: 'Especialidades CEP: Quiromasaje',
  };

  if (existing) {
    if (apply) await payload.update({ collection: 'staff', id: existing.id, data, overrideAccess: true });
    return { action: 'update', id: existing.id, name: STAFF_FULL_NAME };
  }

  if (!apply) return { action: 'create', name: STAFF_FULL_NAME };
  const created = await payload.create({ collection: 'staff', data, overrideAccess: true });
  return { action: 'create', id: created.id, name: STAFF_FULL_NAME };
}

async function findCourses(payload: PayloadClient, tenantId: number) {
  const courses = await fetchAll(payload, 'courses', { tenant: { equals: tenantId } });
  return courses.filter((course) => COURSE_ALIASES.has(normalizeText(String(course.name ?? ''))));
}

async function syncCourseRuns(payload: PayloadClient, tenantId: number, staffId: unknown, apply: boolean) {
  const staffRelationId = relationId(staffId);
  if (staffRelationId == null) return { courses: [], actions: [], reason: 'staff_id_missing' };

  const courses = await findCourses(payload, tenantId);
  const actions = [];

  for (const course of courses) {
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

    for (const run of runs.docs) {
      const existingInstructors = Array.isArray(run.instructors) ? run.instructors : [];
      const existingIds = existingInstructors.map(relationId).filter((id): id is string | number => id != null);
      const instructors = includesRelation(existingInstructors, staffRelationId)
        ? existingIds
        : [...existingIds, staffRelationId];
      const data = {
        instructor: staffRelationId,
        instructors,
      };

      if (apply) await payload.update({ collection: 'course-runs', id: run.id, data, overrideAccess: true });
      actions.push({ action: 'update', id: run.id, course: course.name });
    }
  }

  return {
    courses: courses.map((course) => ({ id: course.id, name: course.name })),
    actions,
  };
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
  console.log(`Abraham Portocarrero sync (${result.mode})`);
  console.log(`Photo: ${result.photo.action} ${result.photo.id ?? STAFF_PHOTO_FILENAME}`);
  console.log(`Staff: ${result.staff.action} ${result.staff.id ?? STAFF_FULL_NAME}`);
  console.log(`Courses matched: ${result.courseRuns.courses.length}`);
  console.log(`Course runs updated: ${result.courseRuns.actions.length}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main().catch((error) => {
    console.error('sync-abraham-portocarrero failed:', error);
    process.exit(1);
  });
}
