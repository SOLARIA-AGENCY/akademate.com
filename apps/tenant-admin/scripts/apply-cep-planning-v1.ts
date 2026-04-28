import { runSeed } from './seed-cep-planning-v1';
import { runImport } from './import-cep-planning-v1';
import { runValidation } from './validate-cep-planning-v1';
import { assertDatabaseConfig } from './cep-planning-v1';

type Options = {
  tenantId: number;
  inputPath: string;
  json: boolean;
  skipConvocations: boolean;
};

const DEFAULT_INPUT_PATH = '/Users/carlosjperez/Downloads/cep_formacion_planificacion_cursos_sedes_personal.md';

function parseArgs(argv: string[]): Options {
  const options: Options = {
    tenantId: 1,
    inputPath: DEFAULT_INPUT_PATH,
    json: false,
    skipConvocations: false,
  };
  for (const arg of argv) {
    if (arg === '--json') options.json = true;
    if (arg === '--skip-convocations') options.skipConvocations = true;
    if (arg.startsWith('--tenant-id=')) options.tenantId = Number(arg.split('=')[1]);
    if (arg.startsWith('--input=')) options.inputPath = arg.slice('--input='.length);
  }
  return options;
}

export async function runApply(options: Options) {
  assertDatabaseConfig();

  const validation = await runValidation({ inputPath: options.inputPath, json: true });
  if (!validation.ok) {
    return {
      mode: 'blocked',
      reason: 'validation_failed',
      validation,
    };
  }

  const seed = await runSeed({ tenantId: options.tenantId, apply: true, json: true });
  const importResult = options.skipConvocations
    ? null
    : await runImport({
        tenantId: options.tenantId,
        inputPath: options.inputPath,
        apply: true,
        json: true,
      });

  return {
    mode: 'apply',
    tenantId: options.tenantId,
    validation,
    seed,
    import: importResult,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = await runApply(options);
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log('CEP Planning apply');
  console.log(`Tenant: ${options.tenantId}`);
  console.log(`Validation OK: ${result.validation.ok}`);
  if (result.mode === 'blocked') {
    console.log(`Blocked: ${result.reason}`);
    process.exit(1);
  }
  console.log(`Campuses: ${result.seed.totals.campuses}`);
  console.log(`Rooms: ${result.seed.totals.rooms}`);
  console.log(`Staff: ${result.seed.totals.staff}`);
  if (result.import) {
    console.log(`Parsed rows: ${result.import.parsedRows}`);
    console.log(`Teacher sync: ${result.import.teacherSync.total}`);
    console.log(`Convocations: ${result.import.convocations.create} create, ${result.import.convocations.pending} pending`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main().catch((error) => {
    console.error('apply-cep-planning-v1 failed:', error);
    process.exit(1);
  });
}
