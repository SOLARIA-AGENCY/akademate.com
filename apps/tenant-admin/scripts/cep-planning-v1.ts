import { readFile } from 'fs/promises';

export type ShiftCode = 'morning' | 'afternoon' | 'evening_extra';
export type UsagePolicy = 'private_only' | 'fped_only' | 'cycle_only' | 'mixed' | 'restricted';
export type TrainingType = 'private' | 'fped' | 'cycle' | 'other';
export type DataQualityStatus = 'complete' | 'pending_validation';

export type CepRoomSeed = {
  campusSlug: string;
  code: string;
  name: string;
  capacity: number;
  usage_policy: UsagePolicy;
  enabled_shifts: ShiftCode[];
  operational_notes?: string;
};

export type CepStaffSeed = {
  fullName: string;
  first_name: string;
  last_name: string;
  staff_type: 'profesor' | 'administrativo' | 'jefatura_administracion' | 'academico';
  position: string;
  specialties: string[];
  aliases: string[];
  detectedCourses: string[];
  assignedCampusSlugs: string[];
  data_quality_status: DataQualityStatus;
  source: 'cep_planning_2026';
  notes?: string;
};

export type CepNorthTeacherImageRow = {
  name: string;
  specialties: string[];
};

export type ParsedConvocationRow = {
  section: string;
  code: string;
  courseTitle: string;
  startDateRaw: string;
  endDateRaw: string;
  scheduleRaw: string;
  hoursRaw: string;
  priceRaw: string;
  installmentsRaw: string;
  teacherRaw: string;
  roomRaw: string;
  capacityRaw: string;
  enrolledRaw: string;
  trainingType: TrainingType;
  campusSlug: string;
  shift: ShiftCode;
  dataQualityStatus: DataQualityStatus;
  issues: string[];
};

export const CEP_CAMPUS_SEEDS = [
  { name: 'Sede Norte', slug: 'sede-norte' },
  { name: 'Sede Santa Cruz', slug: 'sede-santa-cruz' },
] as const;

export const CEP_ROOM_SEEDS: CepRoomSeed[] = [
  { campusSlug: 'sede-norte', code: 'N-AULA-1', name: 'Aula 1', capacity: 17, usage_policy: 'fped_only', enabled_shifts: ['morning', 'afternoon'] },
  { campusSlug: 'sede-norte', code: 'N-AULA-2', name: 'Aula 2', capacity: 17, usage_policy: 'fped_only', enabled_shifts: ['morning', 'afternoon'] },
  { campusSlug: 'sede-norte', code: 'N-AULA-3', name: 'Aula 3', capacity: 17, usage_policy: 'fped_only', enabled_shifts: ['morning', 'afternoon'] },
  { campusSlug: 'sede-norte', code: 'N-AULA-4', name: 'Aula 4', capacity: 17, usage_policy: 'fped_only', enabled_shifts: ['morning', 'afternoon'] },
  { campusSlug: 'sede-norte', code: 'N-AULA-5', name: 'Aula 5', capacity: 17, usage_policy: 'private_only', enabled_shifts: ['morning', 'afternoon'] },
  { campusSlug: 'sede-santa-cruz', code: 'SC-POLIVALENTE', name: 'Aula Polivalente', capacity: 17, usage_policy: 'fped_only', enabled_shifts: ['morning', 'afternoon'] },
  { campusSlug: 'sede-santa-cruz', code: 'SC-MAC', name: 'Aula MAC', capacity: 18, usage_policy: 'mixed', enabled_shifts: ['morning', 'afternoon'] },
  { campusSlug: 'sede-santa-cruz', code: 'SC-AULA-1', name: 'Aula 1', capacity: 17, usage_policy: 'fped_only', enabled_shifts: ['morning', 'afternoon'] },
  { campusSlug: 'sede-santa-cruz', code: 'SC-AULA-2', name: 'Aula 2', capacity: 18, usage_policy: 'mixed', enabled_shifts: ['morning', 'afternoon'] },
  { campusSlug: 'sede-santa-cruz', code: 'SC-AULA-3', name: 'Aula 3', capacity: 17, usage_policy: 'fped_only', enabled_shifts: ['morning', 'afternoon'] },
  { campusSlug: 'sede-santa-cruz', code: 'SC-SILLONES', name: 'Sillones / Área común', capacity: 22, usage_policy: 'mixed', enabled_shifts: ['morning', 'afternoon'] },
];

export const CEP_NORTE_DOCENTES_IMAGE_20260427: CepNorthTeacherImageRow[] = [
  { name: 'Maco Basilli', specialties: ['Quiromasaje'] },
  { name: 'Elena Micello', specialties: ['ACV', 'ATV', 'Urgencias', 'Laboratorio y Rehabilitación', 'Dietética y Nutrición'] },
  { name: 'Lucía Corominas', specialties: ['Auxiliar en Clínicas Estéticas', 'Auxiliar de Farmacia y Parafarmacia + Dermo', 'Entrenamiento Personal', 'Experto en Nutricosmética y Complementos Alimenticios'] },
  { name: 'Josep Nacher', specialties: ['Auxiliar de Farmacia y Parafarmacia + Dermo'] },
  { name: 'Dra. Beatriz', specialties: ['Aux. en Clínicas Estéticas'] },
  { name: 'Sheila Méndez', specialties: ['Aux. en Clínicas Estéticas'] },
  { name: 'Nuria Esther Angel Ramos', specialties: ['Aux. Odontología'] },
  { name: 'Javier Seoane Cruz', specialties: ['Entrenamiento Personal'] },
  { name: 'Agustín Ramó Mesa Padilla', specialties: ['Entrenamiento Personal'] },
  { name: 'Yohhana Benítez', specialties: ['Adiestramiento Canino Nivel 1'] },
  { name: 'Daniel Kay', specialties: ['Adiestramiento Canino Nivel 2'] },
  { name: 'Jessica Hernández', specialties: ['Auxiliar de Farmacia', 'Parafarmacia + Dermo'] },
  { name: 'Carlos Viñoly', specialties: ['Auxiliar de Enfermería'] },
];

const STAFF_SEED_SOURCE: Array<Omit<CepStaffSeed, 'first_name' | 'last_name' | 'data_quality_status' | 'source'>> = [
  { fullName: 'Sandra Rodríguez Padrón', staff_type: 'administrativo', position: 'Administrativo', specialties: [], aliases: [], detectedCourses: [], assignedCampusSlugs: ['sede-norte'] },
  { fullName: 'Verónica Virginia Chacare Bohorquez', staff_type: 'jefatura_administracion', position: 'Jefa de Administración', specialties: [], aliases: [], detectedCourses: [], assignedCampusSlugs: ['sede-norte', 'sede-santa-cruz'] },
  { fullName: 'Aurelio Daniel Díaz Acosta', staff_type: 'administrativo', position: 'Administrativo', specialties: [], aliases: ['Aure'], detectedCourses: [], assignedCampusSlugs: ['sede-santa-cruz'] },
  { fullName: 'Jan Méndez Ceballos', staff_type: 'administrativo', position: 'Administrativo', specialties: [], aliases: ['Jan'], detectedCourses: [], assignedCampusSlugs: ['sede-santa-cruz'] },
  { fullName: 'Abraham Portocarrero', staff_type: 'profesor', position: 'Docente', specialties: ['Quiromasaje'], aliases: ['Abraham'], detectedCourses: ['Quiromasaje Holístico'], assignedCampusSlugs: ['sede-santa-cruz'] },
  { fullName: 'Agustín Ramó Mesa Padilla', staff_type: 'profesor', position: 'Docente', specialties: ['Entrenamiento personal'], aliases: ['Agustín', 'Agustin', 'Agustin Ramó Mesa Padilla'], detectedCourses: ['Entrenamiento Personal'], assignedCampusSlugs: ['sede-norte', 'sede-santa-cruz'], notes: 'Imagen Docentes Norte 2026-04-27 confirma docencia en CEP Norte.' },
  { fullName: 'Alicia Martín González', staff_type: 'profesor', position: 'Docente', specialties: ['Auxiliar clínico veterinario', 'Ayudante técnico veterinario'], aliases: ['Alicia'], detectedCourses: ['ACV', 'ATV Combo'], assignedCampusSlugs: ['sede-santa-cruz'] },
  { fullName: 'Ángel Luis Cruz', staff_type: 'profesor', position: 'Docente', specialties: ['Agente funerario'], aliases: ['Ángel Luis Cruz'], detectedCourses: ['Agente Funerario'], assignedCampusSlugs: ['sede-santa-cruz'] },
  { fullName: 'Carlos Viñoly', staff_type: 'profesor', position: 'Docente', specialties: ['Auxiliar de enfermería'], aliases: ['Carlos Viñoly'], detectedCourses: ['Auxiliar de Enfermería'], assignedCampusSlugs: ['sede-norte'], notes: 'Docente detectado en convocatoria; confirmar ficha oficial.' },
  { fullName: 'Carlos — pendiente apellidos', staff_type: 'profesor', position: 'Docente', specialties: ['Entrenamiento personal'], aliases: ['Carlos'], detectedCourses: ['Entrenamiento Personal'], assignedCampusSlugs: ['sede-norte'], notes: 'Pendiente identificar nombre completo o fusionar con docente existente.' },
  { fullName: 'Cristina Suárez', staff_type: 'profesor', position: 'Docente', specialties: ['Pilates'], aliases: ['Cristina Suárez'], detectedCourses: ['Instructor de Pilates'], assignedCampusSlugs: ['sede-santa-cruz'], notes: 'Docente detectado en convocatoria; confirmar ficha oficial.' },
  { fullName: 'Daniel Kay', staff_type: 'profesor', position: 'Docente', specialties: ['Adiestramiento canino'], aliases: ['Daniel', 'Daniel — pendiente apellidos'], detectedCourses: ['Adiestramiento Canino Nivel 2'], assignedCampusSlugs: ['sede-norte'], notes: 'Imagen Docentes Norte 2026-04-27 confirma nombre completo.' },
  { fullName: 'David Hernández', staff_type: 'profesor', position: 'Docente', specialties: ['Agente funerario'], aliases: ['David Hernández'], detectedCourses: ['Agente Funerario'], assignedCampusSlugs: ['sede-santa-cruz'] },
  { fullName: 'Dra. Beatriz Marín', staff_type: 'profesor', position: 'Docente', specialties: ['Clínicas estéticas'], aliases: ['Dra. Beatriz', 'Beatriz Marín', 'Dra. Beatriz — pendiente apellidos'], detectedCourses: ['Aux. en Clínicas Estéticas'], assignedCampusSlugs: ['sede-norte'], notes: 'Imagen Docentes Norte 2026-04-27 confirma nombre completo.' },
  { fullName: 'Elena Micello', staff_type: 'profesor', position: 'Docente', specialties: ['Auxiliar clínico veterinario', 'Ayudante técnico veterinario', 'Urgencias Laboratorio y Rehabilitación', 'Dietética y Nutrición'], aliases: ['Elena'], detectedCourses: ['ACV', 'ATV Combo', 'Urgencias Laboratorio y Rehabilitación', 'Dietética y Nutrición'], assignedCampusSlugs: ['sede-norte', 'sede-santa-cruz'], notes: 'Imagen Docentes Norte 2026-04-27 añade Dietética y Nutrición.' },
  { fullName: 'Epifanio Jesús Hernández Delgado', staff_type: 'profesor', position: 'Docente', specialties: ['Auxiliar de enfermería'], aliases: ['Epifanio'], detectedCourses: ['Auxiliar de Enfermería'], assignedCampusSlugs: ['sede-santa-cruz'] },
  { fullName: 'Javier Jesús García Jorge', staff_type: 'profesor', position: 'Docente', specialties: ['Auxiliar de farmacia', 'Parafarmacia', 'Dermocosmética'], aliases: ['Javier Jesús García Jorge'], detectedCourses: ['Auxiliar de Farmacia y Parafarmacia + Dermocosmética'], assignedCampusSlugs: ['sede-santa-cruz'], notes: 'No confundir con Javier Seoane Cruz.' },
  { fullName: 'Javier Seoane Cruz', staff_type: 'profesor', position: 'Docente', specialties: ['Entrenamiento personal'], aliases: ['Javier', 'Javier Seoane'], detectedCourses: ['Entrenamiento Personal'], assignedCampusSlugs: ['sede-norte', 'sede-santa-cruz'], notes: 'Confirmar que el alias Javier en Entrenamiento Personal Norte corresponde a este docente.' },
  { fullName: 'Jessica Hernandez Nielsen', staff_type: 'profesor', position: 'Docente', specialties: ['Auxiliar de farmacia', 'SPD', 'Dermocosmética'], aliases: ['Jessica Hernández', 'Jessica Hernandez Nielsen'], detectedCourses: ['Auxiliar de Farmacia y Parafarmacia + Dermocosmética'], assignedCampusSlugs: ['sede-norte', 'sede-santa-cruz'] },
  { fullName: 'Yohhana Benítez', staff_type: 'profesor', position: 'Docente', specialties: ['Adiestramiento canino'], aliases: ['Johana', 'Yohhana', 'Yohhana Benítez', 'Johana — pendiente apellidos'], detectedCourses: ['Adiestramiento Canino Nivel 1', 'Adiestramiento Canino Nivel 2'], assignedCampusSlugs: ['sede-norte'], notes: 'Imagen Docentes Norte 2026-04-27 confirma nombre como Yohhana Benítez y curso Nivel 1. La planificación previa la asociaba a Nivel 2; validar si imparte ambos o corregir convocatoria.' },
  { fullName: 'Josep Nacher', staff_type: 'profesor', position: 'Docente', specialties: ['Auxiliar de farmacia', 'Parafarmacia', 'Dermocosmética', 'Clínicas estéticas'], aliases: ['Josep Nacher'], detectedCourses: ['Auxiliar de Farmacia', 'Auxiliar de Farmacia y Parafarmacia + Dermo', 'Auxiliar en Clínicas Estéticas'], assignedCampusSlugs: ['sede-norte', 'sede-santa-cruz'], notes: 'Imagen Docentes Norte 2026-04-27 confirma docencia en CEP Norte.' },
  { fullName: 'Lucía Corominas Pérez', staff_type: 'profesor', position: 'Docente', specialties: ['Auxiliar de farmacia', 'Parafarmacia', 'Dermocosmética', 'Clínicas estéticas', 'Entrenamiento personal', 'Nutricosmética'], aliases: ['Lucía', 'Lucía Corominas'], detectedCourses: ['Auxiliar de Farmacia y Parafarmacia + Dermocosmética', 'Auxiliar en Clínicas Estéticas', 'Entrenamiento Personal', 'Nutricosmética'], assignedCampusSlugs: ['sede-norte', 'sede-santa-cruz'], notes: 'Imagen Docentes Norte 2026-04-27 confirma Entrenamiento Personal en CEP Norte.' },
  { fullName: 'Luis José González', staff_type: 'profesor', position: 'Docente', specialties: ['Clínicas estéticas'], aliases: ['Luis José'], detectedCourses: ['Auxiliar en Clínicas Estéticas'], assignedCampusSlugs: ['sede-santa-cruz'] },
  { fullName: 'Maco Basilli', staff_type: 'profesor', position: 'Docente', specialties: ['Quiromasaje'], aliases: ['Maco Basilli'], detectedCourses: ['Quiromasaje'], assignedCampusSlugs: ['sede-norte'], notes: 'Docente detectado en convocatoria; confirmar ficha oficial.' },
  { fullName: 'María Rando Falcón', staff_type: 'profesor', position: 'Docente', specialties: ['Auxiliar de enfermería', 'Entrenamiento personal'], aliases: ['María Rando'], detectedCourses: ['Auxiliar de Enfermería'], assignedCampusSlugs: ['sede-santa-cruz'] },
  { fullName: 'Miguel — pendiente apellidos', staff_type: 'profesor', position: 'Docente', specialties: ['Peluquería canina y felina'], aliases: ['Miguel'], detectedCourses: ['Peluquería Canina y Felina'], assignedCampusSlugs: ['sede-norte'], notes: 'Pendiente identificar nombre completo.' },
  { fullName: 'Nerea Illescas', staff_type: 'profesor', position: 'Docente', specialties: ['Clínicas estéticas'], aliases: ['Nerea', 'Nerea Illesca'], detectedCourses: ['Auxiliar en Clínicas Estéticas'], assignedCampusSlugs: ['sede-santa-cruz'] },
  { fullName: 'Nuria Esther Ángel Ramos', staff_type: 'profesor', position: 'Docente', specialties: ['Auxiliar de odontología'], aliases: ['Nuria'], detectedCourses: ['Auxiliar Odontología'], assignedCampusSlugs: ['sede-norte', 'sede-santa-cruz'] },
  { fullName: 'Óscar Arteaga', staff_type: 'profesor', position: 'Docente', specialties: ['Entrenamiento personal'], aliases: ['Óscar Arteaga'], detectedCourses: ['Entrenamiento personal'], assignedCampusSlugs: ['sede-santa-cruz'] },
  { fullName: 'Raquel Trujillo', staff_type: 'profesor', position: 'Docente', specialties: ['Peluquería canina y felina'], aliases: ['Raquel'], detectedCourses: ['Peluquería Canina y Felina'], assignedCampusSlugs: ['sede-santa-cruz'] },
  { fullName: 'Romina — pendiente apellidos', staff_type: 'profesor', position: 'Docente', specialties: ['Auxiliar de farmacia', 'Dermocosmética'], aliases: ['Romina'], detectedCourses: ['Auxiliar de Farmacia y Parafarmacia + Dermo'], assignedCampusSlugs: ['sede-norte'], notes: 'Pendiente identificar nombre completo.' },
  { fullName: 'Sheila Méndez', staff_type: 'profesor', position: 'Docente', specialties: ['Clínicas estéticas'], aliases: ['Sheila', 'Sheila — pendiente apellidos'], detectedCourses: ['Aux. en Clínicas Estéticas'], assignedCampusSlugs: ['sede-norte'], notes: 'Imagen Docentes Norte 2026-04-27 confirma nombre completo.' },
];

export const CEP_STAFF_SEEDS: CepStaffSeed[] = STAFF_SEED_SOURCE.map((seed) => ({
  ...seed,
  ...splitName(seed.fullName),
  data_quality_status: 'pending_validation',
  source: 'cep_planning_2026',
}));

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function canonicalTeacherName(name: string): string {
  const normalized = normalizeText(name);
  const seed = CEP_STAFF_SEEDS.find((person) => {
    if (normalizeText(person.fullName) === normalized) return true;
    return person.aliases.some((alias) => normalizeText(alias) === normalized);
  });
  return seed?.fullName ?? name.trim();
}

export function teacherNames(raw: string): string[] {
  const names = raw
    .split(/,|\/|\bo\b|\by\b/i)
    .map((entry) => entry.replace(/\bpendiente\b.*$/i, '').replace(/\bconfirmar\b.*$/i, '').trim())
    .filter((entry) => entry.length >= 3 && entry !== '—');
  return [...new Set(names.map(canonicalTeacherName))];
}

export function splitName(fullName: string): { first_name: string; last_name: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return { first_name: fullName.trim(), last_name: 'Pendiente' };
  return { first_name: parts[0], last_name: parts.slice(1).join(' ') };
}

export function detectShift(scheduleRaw: string, section = ''): ShiftCode {
  const source = `${scheduleRaw} ${section}`.toLowerCase();
  const match = source.match(/(\d{1,2}):(\d{2})\s*[-–]/);
  if (match) {
    const hour = Number(match[1]);
    if (hour >= 19) return 'evening_extra';
    if (hour >= 14) return 'afternoon';
    return 'morning';
  }
  if (source.includes('tarde')) return 'afternoon';
  return 'morning';
}

export function inferTrainingType(section: string): TrainingType {
  const normalized = normalizeText(section);
  if (normalized.includes('fped') || normalized.includes('desempleados') || normalized.includes('ocupados')) return 'fped';
  if (normalized.includes('ciclo')) return 'cycle';
  if (normalized.includes('privado')) return 'private';
  return 'other';
}

export function inferCampusSlug(section: string): string {
  const normalized = normalizeText(section);
  return normalized.includes('norte') ? 'sede-norte' : 'sede-santa-cruz';
}

export function parseMarkdownTableRows(markdown: string): Array<{ section: string; cells: string[] }> {
  const rows: Array<{ section: string; cells: string[] }> = [];
  let section = '';
  const headingTrail: string[] = [];

  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      headingTrail[level - 1] = heading[2].trim();
      headingTrail.length = level;
      section = headingTrail.join(' / ');
      continue;
    }
    if (!line.trim().startsWith('|') || line.includes('|---')) continue;
    const cells = line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim());
    if (cells.length < 5 || cells[0].toLowerCase() === 'código' || cells[0].toLowerCase() === 'nº') continue;
    rows.push({ section, cells });
  }

  return rows;
}

export function parseConvocationRows(markdown: string): ParsedConvocationRow[] {
  return parseMarkdownTableRows(markdown)
    .filter(({ section }) => /cursos privados|fped|ciclos formativos/i.test(section))
    .map(({ section, cells }) => {
      const trainingType = inferTrainingType(section);
      const campusSlug = inferCampusSlug(section);
      const isFped = trainingType === 'fped';
      const normalizedSection = normalizeText(section);
      const isNorthPrivateUpcoming = trainingType === 'private' && normalizedSection.includes('nuevos cursos');
      const isNorthPrivateFull = trainingType === 'private' && normalizedSection.includes('norte') && !isNorthPrivateUpcoming && cells.length >= 14;
      const isSantaCruzPrivate = trainingType === 'private' && normalizedSection.includes('santa cruz');
      const isCycle = trainingType === 'cycle';

      const code = cells[isFped ? 1 : 0] ?? '';
      const courseTitle = cells[isFped ? 1 : 1] ?? '';
      const startDateRaw = cells[isFped ? 3 : isCycle || isSantaCruzPrivate ? 2 : 3] ?? '';
      const endDateRaw = cells[isFped ? 4 : isCycle || isSantaCruzPrivate ? 3 : 4] ?? '';
      const scheduleRaw = cells[isFped ? 5 : isCycle || isSantaCruzPrivate ? 4 : 5] ?? '';
      const teacherRaw = isFped || isCycle
        ? ''
        : isNorthPrivateFull
          ? (cells[10] ?? '')
          : isNorthPrivateUpcoming
            ? (cells[9] ?? '')
            : (cells[8] ?? '');
      const roomRaw = isFped
        ? (cells[6] ?? '')
        : isCycle
          ? (cells[8] ?? '')
          : isNorthPrivateFull
            ? (cells[11] ?? '')
            : isNorthPrivateUpcoming
              ? (cells[10] ?? '')
              : (cells[9] ?? '');
      const capacityRaw = isFped
        ? ''
        : isCycle
          ? (cells[9] ?? '')
          : isNorthPrivateFull
            ? (cells[12] ?? '')
            : isNorthPrivateUpcoming
              ? (cells[11] ?? '')
              : (cells[10] ?? '');
      const issues: string[] = [];

      if (!courseTitle || courseTitle === 'Curso') issues.push('missing_course_title');
      if (hasInvalidDateRange(startDateRaw, endDateRaw)) issues.push('invalid_date_range');
      if (!scheduleRaw || scheduleRaw === '—') issues.push('missing_schedule');
      if (!roomRaw || roomRaw === '—') issues.push('missing_room');

      return {
        section,
        code,
        courseTitle,
        startDateRaw,
        endDateRaw,
        scheduleRaw,
        hoursRaw: cells[isFped ? 2 : isCycle || isSantaCruzPrivate ? 5 : 6] ?? '',
        priceRaw: isFped ? '' : (cells[isCycle || isSantaCruzPrivate ? 6 : isNorthPrivateUpcoming ? 7 : 8] ?? ''),
        installmentsRaw: isFped ? '' : (cells[isCycle || isSantaCruzPrivate ? 7 : isNorthPrivateUpcoming ? 8 : 9] ?? ''),
        teacherRaw,
        roomRaw,
        capacityRaw,
        enrolledRaw: isFped
          ? ''
          : isCycle
            ? (cells[10] ?? '')
            : isNorthPrivateFull
              ? (cells[13] ?? '')
              : isNorthPrivateUpcoming
                ? (cells[12] ?? '')
                : (cells[11] ?? ''),
        trainingType,
        campusSlug,
        shift: detectShift(scheduleRaw, section),
        dataQualityStatus: issues.length > 0 ? 'pending_validation' : 'complete',
        issues,
      };
    });
}

export function hasInvalidDateRange(startRaw: string, endRaw: string): boolean {
  const start = parseSpanishDate(startRaw);
  const end = parseSpanishDate(endRaw);
  if (!start || !end) return false;
  return end.getTime() < start.getTime();
}

export function parseSpanishDate(value: string): Date | null {
  const match = value.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month, day));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseEuroAmount(value: string): number | null {
  const match = value.replace(/\./g, '').replace(',', '.').match(/(\d+(?:\.\d+)?)\s*€/);
  return match ? Number(match[1]) : null;
}

export function hasDatabaseConfig(): boolean {
  if (process.env.DATABASE_URL?.trim()) return true;
  return Boolean(
    process.env.DATABASE_USER?.trim()
      && process.env.DATABASE_PASSWORD?.trim()
      && process.env.DATABASE_HOST?.trim()
      && process.env.DATABASE_PORT?.trim()
      && process.env.DATABASE_NAME?.trim()
  );
}

export function assertDatabaseConfig(): void {
  if (!hasDatabaseConfig()) {
    throw new Error('Falta DATABASE_URL o el set completo DATABASE_USER/DATABASE_PASSWORD/DATABASE_HOST/DATABASE_PORT/DATABASE_NAME.');
  }
}

export async function parsePlanningMarkdownFile(inputPath: string): Promise<ParsedConvocationRow[]> {
  const markdown = await readFile(inputPath, 'utf8');
  return parseConvocationRows(markdown);
}
