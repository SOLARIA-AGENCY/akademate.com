import { access, readFile } from 'fs/promises';
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

const COURSE_NAME = 'Curso de Tatuador: Tatuaje Profesional Online';
const COURSE_SLUG = 'tatuaje-profesional-online';
const COURSE_CODE = 'SAL-TELE-0001';
const RUN_CODE = 'ONL-2026-001';
const HERO_FILENAME = 'tatuaje-profesional-online.webp';
const DOSSIER_FILENAME = 'curso-tatuador-tatuaje-profesional-online.pdf';
const DOSSIER_SOURCE = '/Users/carlosjperez/Downloads/Curso de Tatuador Tatuaje Profesional Online.pdf';

const OBJECTIVES = [
  'Seleccionar y preparar equipos y medios técnicos para las distintas fases del proceso de tatuaje.',
  'Preparar productos y pigmentos relacionándolos con los efectos que se desean conseguir.',
  'Aplicar medidas de seguridad, higiene y prevención de riesgos personales, de equipos y productos.',
  'Identificar contraindicaciones, cuidados de la piel y propuestas decorativas realizables mediante tatuaje.',
  'Aplicar técnicas de dibujo, teoría del color y parámetros técnicos vinculados a diferentes estilos de tatuaje.',
  'Conocer protocolos normalizados, documentación legal, consentimiento informado y primeros auxilios aplicados.',
];

const PROGRAM_BLOCKS = [
  {
    title: 'Seguridad, higiene y materiales',
    body: 'Protocolos de limpieza, desinfección, esterilización, enfermedades infecciosas, requisitos legales, equipos, aparatología, pigmentos y productos específicos.',
    items: ['Seguridad e higiene', 'Equipos, aparatos y materiales', 'Productos para tatuaje'],
  },
  {
    title: 'Cliente, piel y documentación',
    body: 'Estudio del cliente, alteraciones de la piel, indicaciones pre y post, anatomía, cicatrización, consentimiento y documentación técnica, legal y comercial.',
    items: ['Estudio y asesoramiento', 'Morfología de zonas a tatuar', 'Documentación técnica y legal'],
  },
  {
    title: 'Dibujo, color y técnica profesional',
    body: 'Dibujo aplicado al tatuaje, estilos, transferencia del diseño, teoría del color, parámetros de dermógrafo y técnicas de aplicación del tatuaje.',
    items: ['Técnicas de dibujo', 'Teoría del color', 'Parámetros técnicos', 'Técnicas de aplicación'],
  },
];

function parseArgs(argv: string[]): Options {
  const options: Options = { tenantId: 1, apply: false, json: false };
  for (const arg of argv) {
    if (arg === '--apply') options.apply = true;
    if (arg === '--json') options.json = true;
    if (arg.startsWith('--tenant-id=')) options.tenantId = Number(arg.split('=')[1]);
  }
  return options;
}

async function exists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureHeroMedia(payload: PayloadClient, apply: boolean) {
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: HERO_FILENAME } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  if (existing.docs[0]) return { action: 'skip', id: existing.docs[0].id, filename: HERO_FILENAME };
  if (!apply) return { action: 'create', filename: HERO_FILENAME };

  const sourcePath = path.resolve(__dirname, '../public/website/cep/courses/fallback-teleformacion.png');
  const sourceBuffer = await readFile(sourcePath);
  const imageBuffer = await sharp(sourceBuffer)
    .resize({ width: 1600, height: 900, fit: 'cover' })
    .webp({ quality: 84, effort: 4 })
    .toBuffer();

  const created = await payload.create({
    collection: 'media',
    data: {
      alt: 'Curso online de Tatuaje Profesional de CEP Formación',
      folder: 'courses/teleformacion',
    },
    file: {
      data: imageBuffer,
      mimetype: 'image/webp',
      name: HERO_FILENAME,
      size: imageBuffer.length,
    },
    overrideAccess: true,
  });

  return { action: 'create', id: created.id, filename: HERO_FILENAME };
}

async function ensureDossierMedia(payload: PayloadClient, apply: boolean) {
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: DOSSIER_FILENAME } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  if (existing.docs[0]) return { action: 'skip', id: existing.docs[0].id, filename: DOSSIER_FILENAME };
  if (!(await exists(DOSSIER_SOURCE))) return { action: 'missing-source', filename: DOSSIER_FILENAME };
  if (!apply) return { action: 'create', filename: DOSSIER_FILENAME };

  const pdfBuffer = await readFile(DOSSIER_SOURCE);
  const created = await payload.create({
    collection: 'media',
    data: {
      alt: 'Dossier Curso de Tatuador Tatuaje Profesional Online',
      folder: 'courses/dossiers',
    },
    file: {
      data: pdfBuffer,
      mimetype: 'application/pdf',
      name: DOSSIER_FILENAME,
      size: pdfBuffer.length,
    },
    overrideAccess: true,
  });
  return { action: 'create', id: created.id, filename: DOSSIER_FILENAME };
}

async function ensureArea(payload: PayloadClient, tenantId: number, apply: boolean) {
  const areas = await payload.find({
    collection: 'areas-formativas',
    limit: 200,
    depth: 0,
    overrideAccess: true,
  });
  const existing = areas.docs.find((area: any) => {
    const name = normalizeText(String(area.nombre || area.name || ''));
    return name.includes('salud') || name.includes('bienestar') || name.includes('deporte');
  });
  if (existing) return { action: 'skip', id: existing.id, name: existing.nombre || existing.name };
  if (!apply) return { action: 'create', name: 'Área Salud, Bienestar y Deporte' };

  const created = await payload.create({
    collection: 'areas-formativas',
    data: {
      codigo: 'SAL',
      nombre: 'Área Salud, Bienestar y Deporte',
      descripcion: 'Formación vinculada a salud, bienestar, estética, deporte y desarrollo profesional.',
      active: true,
      tenant: tenantId,
    },
    overrideAccess: true,
  });
  return { action: 'create', id: created.id, name: created.nombre };
}

async function ensureCourse(payload: PayloadClient, tenantId: number, areaId: unknown, heroId: unknown, dossierId: unknown, apply: boolean) {
  const existing = await payload.find({
    collection: 'courses',
    where: {
      or: [
        { slug: { equals: COURSE_SLUG } },
        { codigo: { equals: COURSE_CODE } },
      ],
    } as any,
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });

  const data = {
    codigo: COURSE_CODE,
    slug: COURSE_SLUG,
    name: COURSE_NAME,
    featured_image: heroId,
    dossier_pdf: dossierId,
    landing_enabled: true,
    campuses: [],
    short_description: 'Curso online de 240 horas para conocer el mundo del tatuaje profesional, sus técnicas, seguridad, higiene, dibujo, color y protocolos de trabajo.',
    modality: 'online',
    course_type: 'teleformacion',
    area_formativa: areaId,
    area: 'salud',
    duration_hours: 240,
    operational_status: 'active',
    active: true,
    featured: true,
    meta_title: 'Curso de Tatuador: Tatuaje Profesional Online | CEP Formación',
    meta_description: 'Formación online de 240 horas en tatuaje profesional: seguridad e higiene, equipos, dibujo, color, técnica, documentación y salidas profesionales.',
    landing_target_audience: 'Dirigido a personas que quieren conocer a fondo el mundo del tatuaje, sus técnicas y los aspectos fundamentales para trabajar con profesionalidad, seguridad e higiene.',
    landing_access_requirements: 'No se indican requisitos específicos de acceso en el dossier. Solicita información para confirmar condiciones de matrícula.',
    landing_outcomes: 'Permite ampliar oportunidades laborales en el sector de la estética, como asesor personal o profesional del tatuaje.',
    landing_objectives: OBJECTIVES.map((text) => ({ text })),
    landing_program_blocks: PROGRAM_BLOCKS.map((block) => ({
      title: block.title,
      body: block.body,
      items: block.items.map((text) => ({ text })),
    })),
    landing_faqs: [
      {
        question: '¿Cuándo puedo empezar?',
        answer: 'La matrícula está abierta de forma permanente. Al ser teleformación, puedes empezar cuando quieras y estudiar a tu ritmo.',
      },
      {
        question: '¿Qué duración tiene?',
        answer: 'El dossier del curso indica una duración de 240 horas.',
      },
      {
        question: '¿Qué diploma recibo?',
        answer: 'El dossier indica Diploma CEP al finalizar la formación.',
      },
    ],
    tenant: tenantId,
  };

  if (existing.docs[0]) {
    if (apply) await payload.update({ collection: 'courses', id: existing.docs[0].id, data, overrideAccess: true });
    return { action: 'update', id: existing.docs[0].id, slug: COURSE_SLUG };
  }

  if (!apply) return { action: 'create', slug: COURSE_SLUG };
  const created = await payload.create({ collection: 'courses', data, overrideAccess: true });
  return { action: 'create', id: created.id, slug: COURSE_SLUG };
}

async function ensureCourseRun(payload: PayloadClient, tenantId: number, courseId: unknown, apply: boolean) {
  const existing = await payload.find({
    collection: 'course-runs',
    where: { codigo: { equals: RUN_CODE } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const startDate = new Date('2026-05-11T00:00:00.000Z').toISOString();
  const endDate = new Date('2027-05-11T00:00:00.000Z').toISOString();
  const data = {
    course: courseId,
    codigo: RUN_CODE,
    start_date: startDate,
    end_date: endDate,
    max_students: 999,
    min_students: 1,
    current_enrollments: 0,
    status: 'enrollment_open',
    training_type: 'other',
    planning_status: 'published',
    financial_aid_available: false,
    notes: 'Convocatoria online permanente: matrícula abierta, sin fecha fija de inicio y sin docente fijo visible.',
    tenant: tenantId,
  };

  if (existing.docs[0]) {
    if (apply) await payload.update({ collection: 'course-runs', id: existing.docs[0].id, data, overrideAccess: true });
    return { action: 'update', id: existing.docs[0].id, codigo: RUN_CODE };
  }

  if (!apply) return { action: 'create', codigo: RUN_CODE };
  const created = await payload.create({ collection: 'course-runs', data, overrideAccess: true });
  return { action: 'create', id: created.id, codigo: RUN_CODE };
}

export async function runSync(options: Options) {
  assertDatabaseConfig();
  const payload = await getPayload({ config });
  const hero = await ensureHeroMedia(payload, options.apply);
  const dossier = await ensureDossierMedia(payload, options.apply);
  const area = await ensureArea(payload, options.tenantId, options.apply);
  const course = await ensureCourse(payload, options.tenantId, area.id, hero.id, dossier.id, options.apply);
  const run = course.id ? await ensureCourseRun(payload, options.tenantId, course.id, options.apply) : null;

  return {
    mode: options.apply ? 'apply' : 'dry-run',
    tenantId: options.tenantId,
    hero,
    dossier,
    area,
    course,
    run,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await runSync(options);
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(`Tatuaje Profesional Online sync (${result.mode})`);
  console.log(`Hero: ${result.hero.action} ${result.hero.id ?? HERO_FILENAME}`);
  console.log(`Dossier: ${result.dossier.action} ${result.dossier.id ?? DOSSIER_FILENAME}`);
  console.log(`Area: ${result.area.action} ${result.area.id ?? result.area.name}`);
  console.log(`Course: ${result.course.action} ${result.course.id ?? COURSE_SLUG}`);
  console.log(`Run: ${result.run?.action ?? 'pending'} ${result.run?.id ?? RUN_CODE}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main().catch((error) => {
    console.error('sync-tatuaje-profesional-online failed:', error);
    process.exit(1);
  });
}
