import { getPayload } from 'payload';
import config from '../src/payload.config';
import { CEP_CAMPUS_SEEDS, CEP_ROOM_SEEDS, CEP_STAFF_SEEDS, assertDatabaseConfig, normalizeText } from './cep-planning-v1';

type Options = {
  tenantId: number;
  apply: boolean;
  json: boolean;
};

type PayloadClient = Awaited<ReturnType<typeof getPayload>>;

function parseArgs(argv: string[]): Options {
  const options: Options = { tenantId: 1, apply: false, json: false };
  for (const arg of argv) {
    if (arg === '--apply') options.apply = true;
    if (arg === '--json') options.json = true;
    if (arg.startsWith('--tenant-id=')) options.tenantId = Number(arg.split('=')[1]);
  }
  return options;
}

async function findOne(payload: PayloadClient, collection: string, where: Record<string, unknown>) {
  const result = await payload.find({ collection, where, limit: 1, depth: 0, overrideAccess: true });
  return result.docs[0] ?? null;
}

async function ensureCampus(payload: PayloadClient, tenantId: number, slug: string, name: string, apply: boolean) {
  const existing = await findOne(payload, 'campuses', { slug: { equals: slug }, tenant: { equals: tenantId } });
  if (existing) return { action: 'skip', id: existing.id, slug };
  if (!apply) return { action: 'create', slug };

  const created = await payload.create({
    collection: 'campuses',
    data: {
      slug,
      name,
      tenant: tenantId,
      active: true,
    },
    overrideAccess: true,
  });
  return { action: 'create', id: created.id, slug };
}

async function seedRooms(payload: PayloadClient, tenantId: number, apply: boolean) {
  const actions = [];
  const expectedCodes = new Set(CEP_ROOM_SEEDS.map((room) => room.code));
  for (const room of CEP_ROOM_SEEDS) {
    const campus = await findOne(payload, 'campuses', { slug: { equals: room.campusSlug }, tenant: { equals: tenantId } });
    if (!campus) {
      actions.push({ action: 'error', code: room.code, reason: `Campus not found: ${room.campusSlug}` });
      continue;
    }

    const existing = await findOne(payload, 'classrooms', { code: { equals: room.code }, tenant: { equals: tenantId } });
    const data = {
      code: room.code,
      name: room.name,
      capacity: room.capacity,
      usage_policy: room.usage_policy,
      enabled_shifts: room.enabled_shifts,
      operational_notes: room.operational_notes,
      campus: campus.id,
      tenant: tenantId,
      is_active: true,
      data_quality_status: 'complete',
    };

    if (existing) {
      if (apply) await payload.update({ collection: 'classrooms', id: existing.id, data, overrideAccess: true });
      actions.push({ action: 'update', id: existing.id, code: room.code });
    } else {
      if (apply) {
        const created = await payload.create({ collection: 'classrooms', data, overrideAccess: true });
        actions.push({ action: 'create', id: created.id, code: room.code });
      } else {
        actions.push({ action: 'create', code: room.code });
      }
    }
  }

  const legacyRooms = await payload.find({
    collection: 'classrooms',
    where: {
      tenant: { equals: tenantId },
      code: { like: 'LEGACY-' },
    },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  });
  for (const room of legacyRooms.docs) {
    if (expectedCodes.has(String(room.code))) continue;
    const data = {
      is_active: false,
      data_quality_status: 'pending_validation',
      operational_notes: [
        typeof room.operational_notes === 'string' ? room.operational_notes : '',
        'Desactivada operativamente por seed CEP Planning 2026: aula placeholder previa a la normalización de sedes/aulas. No eliminada para conservar historial.',
      ].filter(Boolean).join('\n'),
    };
    if (apply) {
      await payload.update({ collection: 'classrooms', id: room.id, data, overrideAccess: true });
    }
    actions.push({ action: 'deactivate_legacy', id: room.id, code: room.code });
  }
  return actions;
}

async function seedStaff(payload: PayloadClient, tenantId: number, apply: boolean) {
  const campuses = await payload.find({ collection: 'campuses', where: { tenant: { equals: tenantId } }, limit: 100, depth: 0, overrideAccess: true });
  const existingStaff = await payload.find({ collection: 'staff', limit: 500, depth: 0, overrideAccess: true });
  const campusIdBySlug = new Map(campuses.docs.map((campus) => [String(campus.slug), campus.id]));
  const actions = [];

  for (const person of CEP_STAFF_SEEDS) {
    const candidateNames = new Set([person.fullName, ...person.aliases].map(normalizeText));
    const existing = existingStaff.docs.find((staff) => {
      const fullName = typeof staff.full_name === 'string' ? staff.full_name : '';
      const aliasNames = typeof staff.alias_names === 'string' ? staff.alias_names.split(',').map((alias) => alias.trim()) : [];
      return [fullName, ...aliasNames].some((candidate) => candidateNames.has(normalizeText(candidate)));
    }) ?? null;
    const assigned_campuses = person.assignedCampusSlugs
      .map((slug) => campusIdBySlug.get(slug))
      .filter((id): id is number => typeof id === 'number');
    const data = {
      staff_type: person.staff_type,
      first_name: person.first_name,
      last_name: person.last_name,
      full_name: person.fullName,
      position: person.position,
      contract_type: person.staff_type === 'profesor' ? 'freelance' : 'full_time',
      employment_status: 'active',
      specialties: [],
      assigned_campuses,
      is_active: true,
      data_quality_status: person.data_quality_status,
      source: person.source,
      alias_names: person.aliases.join(', '),
      detected_courses: person.detectedCourses.join(', '),
      notes: [
        person.specialties.length > 0 ? `Especialidades CEP: ${person.specialties.join(', ')}` : '',
        person.notes ?? '',
      ].filter(Boolean).join('\n') || undefined,
    };

    if (existing) {
      if (apply) await payload.update({ collection: 'staff', id: existing.id, data, overrideAccess: true });
      actions.push({ action: 'update', id: existing.id, name: person.fullName });
    } else {
      if (apply) {
        const created = await payload.create({ collection: 'staff', data, overrideAccess: true });
        actions.push({ action: 'create', id: created.id, name: person.fullName });
      } else {
        actions.push({ action: 'create', name: person.fullName });
      }
    }
  }

  return actions;
}

export async function runSeed(options: Options) {
  assertDatabaseConfig();
  const payload = await getPayload({ config });
  const campusActions = [];
  for (const campus of CEP_CAMPUS_SEEDS) {
    campusActions.push(await ensureCampus(payload, options.tenantId, campus.slug, campus.name, options.apply));
  }

  const roomActions = await seedRooms(payload, options.tenantId, options.apply);
  const staffActions = await seedStaff(payload, options.tenantId, options.apply);

  return {
    mode: options.apply ? 'apply' : 'dry-run',
    tenantId: options.tenantId,
    campuses: campusActions,
    rooms: roomActions,
    staff: staffActions,
    totals: {
      campuses: campusActions.length,
      rooms: roomActions.length,
      staff: staffActions.length,
    },
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await runSeed(options);
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(`CEP Planning seed (${result.mode})`);
  console.log(`Campuses: ${result.totals.campuses}`);
  console.log(`Rooms: ${result.totals.rooms}`);
  console.log(`Staff: ${result.totals.staff}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main().catch((error) => {
    console.error('seed-cep-planning-v1 failed:', error);
    process.exit(1);
  });
}
