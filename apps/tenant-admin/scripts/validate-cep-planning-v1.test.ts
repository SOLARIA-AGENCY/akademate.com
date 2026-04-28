import { mkdtemp, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { afterEach, describe, expect, test } from 'vitest';
import { runValidation } from './validate-cep-planning-v1';

let tempDir: string | null = null;

async function writePlanningFixture(markdown: string) {
  tempDir = await mkdtemp(join(tmpdir(), 'cep-planning-validation-'));
  const filePath = join(tempDir, 'planning.md');
  await writeFile(filePath, markdown, 'utf8');
  return filePath;
}

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
});

describe('validate-cep-planning-v1', () => {
  test('passes when every detected teacher resolves to the master staff list', async () => {
    const inputPath = await writePlanningFixture(`
# 5. Cursos privados — Sede Norte
## 5.2. Cursos de tarde — Norte
| Código | Curso | Centro | Inicio | Fin | Horario | Horas | Modalidad / observación | Precio total + matrícula | Cuotas | Docente / responsable | Aula | Capacidad | Matriculados / estado | Notas |
|---|---|---|---:|---:|---|---:|---|---:|---:|---|---|---:|---:|---|
| N-004/2026 | Entrenamiento Personal | CEP | 15/05/2026 | 29/01/2027 | Viernes 17:00-20:00 | Teórico-práctico | — | 990€ + 150M | 90€ × 10 | Javier, Agustín, Lucía o Carlos | Aula 5 | 17 | 5 | Nota |

# 6. Cursos privados — Sede Santa Cruz
## 6.1. Cursos de mañana — Santa Cruz
| Código | Curso | Inicio | Fin | Horario | Horas | Precio total + matrícula | Cuotas | Docente | Aula / espacio | Capacidad | Matriculados | Retrasos / notas | Encargado |
|---|---|---:|---:|---|---:|---:|---:|---|---|---:|---:|---|---|
| C-/2025 | Instructor de Pilates | 09/09/2026 | — | Miércoles 10:00-13:00 | N/A | 950€ + 150M | 95€ × 10 | Cristina Suárez | Aula 2 | 18 | 1 | 1ª 01/10 | Aure |
`);

    const result = await runValidation({ inputPath, json: true });

    expect(result.ok).toBe(true);
    expect(result.totals.parsedRows).toBe(2);
    expect(result.totals.teachersMaster).toBe(28);
    expect(result.totals.teachersDetectedInConvocations).toBe(5);
    expect(result.issues.duplicateAliases).toEqual([]);
    expect(result.issues.unresolvedTeachers).toEqual([]);
  });

  test('reports unresolved teachers without blocking known data-quality issues', async () => {
    const inputPath = await writePlanningFixture(`
# 5. Cursos privados — Sede Norte
## 5.1. Cursos de mañana — Norte
| Código | Curso | Centro | Inicio | Fin | Horario | Horas | Modalidad / observación | Precio total + matrícula | Cuotas | Docente / responsable | Aula | Capacidad | Matriculados / estado | Notas |
|---|---|---|---:|---:|---|---:|---|---:|---:|---|---|---:|---:|---|
| N-/2026 | Curso con docente nuevo | CEP | 11/11/2026 | 01/09/2026 | — | 150h | Sí | 1.100€ + 150M | 115€ × 10 | Persona Nueva | — | 17 | — | Fechas a revisar |
`);

    const result = await runValidation({ inputPath, json: true });

    expect(result.ok).toBe(false);
    expect(result.issues.unresolvedTeachers).toEqual([
      expect.objectContaining({
        teacher: 'Persona Nueva',
        courseTitle: 'Curso con docente nuevo',
      }),
    ]);
    expect(result.issues.invalidDateRows).toHaveLength(1);
    expect(result.issues.missingRoomRows).toHaveLength(1);
    expect(result.issues.missingScheduleRows).toHaveLength(1);
  });
});
