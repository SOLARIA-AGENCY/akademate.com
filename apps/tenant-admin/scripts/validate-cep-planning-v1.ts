import {
  CEP_ROOM_SEEDS,
  CEP_STAFF_SEEDS,
  normalizeText,
  parsePlanningMarkdownFile,
  teacherNames,
} from './cep-planning-v1';

type Options = {
  inputPath: string;
  json: boolean;
};

const DEFAULT_INPUT_PATH = '/Users/carlosjperez/Downloads/cep_formacion_planificacion_cursos_sedes_personal.md';

function parseArgs(argv: string[]): Options {
  const options: Options = { inputPath: DEFAULT_INPUT_PATH, json: false };
  for (const arg of argv) {
    if (arg === '--json') options.json = true;
    if (arg.startsWith('--input=')) options.inputPath = arg.slice('--input='.length);
  }
  return options;
}

function duplicateAliases() {
  const aliases = new Map<string, string[]>();
  for (const person of CEP_STAFF_SEEDS) {
    if (person.staff_type !== 'profesor') continue;
    for (const alias of [person.fullName, ...person.aliases]) {
      const key = normalizeText(alias);
      aliases.set(key, [...(aliases.get(key) ?? []), person.fullName]);
    }
  }
  return [...aliases.entries()]
    .filter(([, owners]) => new Set(owners).size > 1)
    .map(([alias, owners]) => ({ alias, owners: [...new Set(owners)] }));
}

export async function runValidation(options: Options) {
  const rows = await parsePlanningMarkdownFile(options.inputPath);
  const teacherMaster = new Set(
    CEP_STAFF_SEEDS
      .filter((person) => person.staff_type === 'profesor')
      .map((person) => person.fullName)
  );
  const detectedTeachers = new Set<string>();
  const unresolvedTeachers = [];

  for (const row of rows) {
    for (const teacher of teacherNames(row.teacherRaw)) {
      detectedTeachers.add(teacher);
      if (!teacherMaster.has(teacher)) {
        unresolvedTeachers.push({
          teacher,
          courseTitle: row.courseTitle,
          section: row.section,
        });
      }
    }
  }

  const roomsByCampus = new Map<string, number>();
  for (const room of CEP_ROOM_SEEDS) {
    roomsByCampus.set(room.campusSlug, (roomsByCampus.get(room.campusSlug) ?? 0) + room.capacity);
  }

  const duplicateAliasRows = duplicateAliases();
  const invalidDateRows = rows.filter((row) => row.issues.includes('invalid_date_range'));
  const missingRoomRows = rows.filter((row) => row.issues.includes('missing_room'));
  const missingScheduleRows = rows.filter((row) => row.issues.includes('missing_schedule'));

  return {
    inputPath: options.inputPath,
    ok: duplicateAliasRows.length === 0 && unresolvedTeachers.length === 0,
    totals: {
      parsedRows: rows.length,
      teachersMaster: teacherMaster.size,
      teachersDetectedInConvocations: detectedTeachers.size,
      rooms: CEP_ROOM_SEEDS.length,
      northCapacity: roomsByCampus.get('sede-norte') ?? 0,
      santaCruzCapacity: roomsByCampus.get('sede-santa-cruz') ?? 0,
    },
    issues: {
      duplicateAliases: duplicateAliasRows,
      unresolvedTeachers,
      invalidDateRows: invalidDateRows.map((row) => ({ courseTitle: row.courseTitle, startDateRaw: row.startDateRaw, endDateRaw: row.endDateRaw })),
      missingRoomRows: missingRoomRows.map((row) => ({ courseTitle: row.courseTitle, roomRaw: row.roomRaw })),
      missingScheduleRows: missingScheduleRows.map((row) => ({ courseTitle: row.courseTitle, scheduleRaw: row.scheduleRaw })),
    },
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await runValidation(options);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('CEP Planning validation');
    console.log(`Parsed rows: ${result.totals.parsedRows}`);
    console.log(`Teacher master records: ${result.totals.teachersMaster}`);
    console.log(`Detected teachers in convocations: ${result.totals.teachersDetectedInConvocations}`);
    console.log(`Duplicate aliases: ${result.issues.duplicateAliases.length}`);
    console.log(`Unresolved teachers: ${result.issues.unresolvedTeachers.length}`);
    console.log(`Invalid date rows: ${result.issues.invalidDateRows.length}`);
    console.log(`Missing room rows: ${result.issues.missingRoomRows.length}`);
    console.log(`Missing schedule rows: ${result.issues.missingScheduleRows.length}`);
  }

  if (!result.ok) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main().catch((error) => {
    console.error('validate-cep-planning-v1 failed:', error);
    process.exit(1);
  });
}
