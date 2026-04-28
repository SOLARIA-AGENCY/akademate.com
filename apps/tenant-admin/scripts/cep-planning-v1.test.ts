import { describe, expect, test } from 'vitest';
import {
  CEP_ROOM_SEEDS,
  CEP_NORTE_DOCENTES_IMAGE_20260427,
  CEP_STAFF_SEEDS,
  canonicalTeacherName,
  detectShift,
  hasInvalidDateRange,
  inferTrainingType,
  parseMarkdownTableRows,
  parseConvocationRows,
  parseEuroAmount,
  teacherNames,
} from './cep-planning-v1';

describe('cep-planning-v1 canonical seeds', () => {
  test('defines CEP physical room capacity by campus', () => {
    const north = CEP_ROOM_SEEDS.filter((room) => room.campusSlug === 'sede-norte');
    const santaCruz = CEP_ROOM_SEEDS.filter((room) => room.campusSlug === 'sede-santa-cruz');

    expect(north).toHaveLength(5);
    expect(north.reduce((sum, room) => sum + room.capacity, 0)).toBe(85);
    expect(santaCruz).toHaveLength(6);
    expect(santaCruz.reduce((sum, room) => sum + room.capacity, 0)).toBe(109);
    expect(north.find((room) => room.name === 'Aula 5')?.usage_policy).toBe('private_only');
    expect(north.filter((room) => /Aula [1-4]/.test(room.name)).every((room) => room.usage_policy === 'fped_only')).toBe(true);
  });

  test('allows incomplete staff fichas as pending validation', () => {
    expect(CEP_STAFF_SEEDS.filter((person) => person.staff_type === 'profesor')).toHaveLength(28);
    expect(CEP_STAFF_SEEDS.every((person) => person.data_quality_status === 'pending_validation')).toBe(true);
    expect(CEP_STAFF_SEEDS.some((person) => person.staff_type === 'jefatura_administracion')).toBe(true);
  });

  test('defines a single canonical ficha for every detected teacher alias', () => {
    expect(canonicalTeacherName('Lucía')).toBe('Lucía Corominas Pérez');
    expect(canonicalTeacherName('Jessica Hernández')).toBe('Jessica Hernandez Nielsen');
    expect(canonicalTeacherName('Javier')).toBe('Javier Seoane Cruz');
    expect(canonicalTeacherName('Dra. Beatriz')).toBe('Dra. Beatriz Marín');
    expect(canonicalTeacherName('Sheila')).toBe('Sheila Méndez');
    expect(canonicalTeacherName('Johana')).toBe('Yohhana Benítez');
    expect(canonicalTeacherName('Daniel')).toBe('Daniel Kay');
    expect(canonicalTeacherName('Romina')).toBe('Romina — pendiente apellidos');

    const aliasOwners = new Map<string, string[]>();
    for (const person of CEP_STAFF_SEEDS) {
      for (const alias of person.aliases) {
        const key = alias.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        aliasOwners.set(key, [...(aliasOwners.get(key) ?? []), person.fullName]);
      }
    }
    const duplicateAliases = [...aliasOwners.entries()].filter(([, owners]) => new Set(owners).size > 1);
    expect(duplicateAliases).toEqual([]);
  });

  test('every alias resolves to one existing professor master record', () => {
    const professorNames = new Set(
      CEP_STAFF_SEEDS
        .filter((person) => person.staff_type === 'profesor')
        .map((person) => person.fullName)
    );

    for (const person of CEP_STAFF_SEEDS.filter((seed) => seed.staff_type === 'profesor')) {
      expect(professorNames.has(canonicalTeacherName(person.fullName))).toBe(true);
      for (const alias of person.aliases) {
        expect(professorNames.has(canonicalTeacherName(alias))).toBe(true);
      }
    }
  });

  test('crosses every extracted CEP Norte image teacher with a north staff ficha', () => {
    const northProfessors = new Set(
      CEP_STAFF_SEEDS
        .filter((person) => person.staff_type === 'profesor' && person.assignedCampusSlugs.includes('sede-norte'))
        .map((person) => person.fullName)
    );

    expect(CEP_NORTE_DOCENTES_IMAGE_20260427).toHaveLength(13);
    for (const row of CEP_NORTE_DOCENTES_IMAGE_20260427) {
      const canonical = canonicalTeacherName(row.name);
      expect(northProfessors.has(canonical), `${row.name} should resolve to a CEP Norte staff ficha`).toBe(true);
    }
  });
});

describe('cep-planning-v1 parser helpers', () => {
  test('infers shifts from time ranges', () => {
    expect(detectShift('Martes 10:00-14:00')).toBe('morning');
    expect(detectShift('Miércoles 16:00-19:00')).toBe('afternoon');
    expect(detectShift('Miércoles 19:00-22:00')).toBe('evening_extra');
  });

  test('detects training type from section names', () => {
    expect(inferTrainingType('Cursos privados — Sede Norte')).toBe('private');
    expect(inferTrainingType('FPED / Desempleados y ocupados — Santa Cruz')).toBe('fped');
    expect(inferTrainingType('Ciclos formativos — Santa Cruz')).toBe('cycle');
  });

  test('parses euro amounts and incoherent dates', () => {
    expect(parseEuroAmount('1.155€ + 160M')).toBe(1155);
    expect(parseEuroAmount('300€ + 150M')).toBe(300);
    expect(hasInvalidDateRange('11/11/2026', '01/09/2026')).toBe(true);
    expect(hasInvalidDateRange('07/04/2026', '01/07/2027')).toBe(false);
  });

  test('parses private rows and marks invalid data pending', () => {
    const markdown = `
## 5.1. Cursos privados — Norte
| Código | Curso | Centro | Inicio | Fin | Horario | Horas | Modalidad / observación | Precio total + matrícula | Cuotas | Docente / responsable | Aula | Capacidad | Matriculados / estado | Notas |
|---|---|---|---:|---:|---|---:|---|---:|---:|---|---|---:|---:|---|
| N-/2026 | Aux. en Clínicas Estéticas | CEP | 11/11/2026 | 01/09/2026 | Miércoles 10:00-13:00 | 150h | Sí | 1.100€ + 150M | 115€ × 10 | Lucía | Aula 5 | 17 | — | Fechas a revisar |
`;
    const rows = parseConvocationRows(markdown);

    expect(rows).toHaveLength(1);
    expect(rows[0].trainingType).toBe('private');
    expect(rows[0].campusSlug).toBe('sede-norte');
    expect(rows[0].shift).toBe('morning');
    expect(rows[0].dataQualityStatus).toBe('pending_validation');
    expect(rows[0].issues).toContain('invalid_date_range');
  });

  test('normalizes course-run teacher text into canonical staff records', () => {
    expect(teacherNames('Lucía / Romina pendiente confirmar')).toEqual([
      'Lucía Corominas Pérez',
      'Romina — pendiente apellidos',
    ]);
    expect(teacherNames('Javier, Agustín, Lucía o Carlos')).toEqual([
      'Javier Seoane Cruz',
      'Agustín Ramó Mesa Padilla',
      'Lucía Corominas Pérez',
      'Carlos — pendiente apellidos',
    ]);
    expect(teacherNames('Lucía, Dra. Beatriz, Sheila')).toEqual([
      'Lucía Corominas Pérez',
      'Dra. Beatriz Marín',
      'Sheila Méndez',
    ]);
    expect(teacherNames('Johana / Daniel')).toEqual(['Yohhana Benítez', 'Daniel Kay']);
  });

  test('preserves parent section context for nested course tables', () => {
    const rows = parseMarkdownTableRows(`
# 5. Cursos privados — Sede Norte
## 5.3. Nuevos cursos próximos a poner en marcha — Norte
| Código | Curso | Centro | Inicio | Fin | Horario | Horas / modalidad | Precio total + matrícula | Cuotas | Docente | Aula | Capacidad | Matriculados / estado | Observación |
|---|---|---|---|---|---|---|---:|---:|---|---|---:|---:|---|
| N-/2026 | Adiestramiento Canino Nivel 2 | CEP ANACP | — | — | Lunes 16:00-18:30 | 2,5h | 630€ + 160M | 105€ × 6 | Johana | Aula 5 | 17 | 10 | Próximo a poner en marcha |
`);
    expect(rows).toHaveLength(1);
    expect(rows[0].section).toContain('5. Cursos privados — Sede Norte');
    expect(rows[0].section).toContain('5.3. Nuevos cursos próximos');
  });

  test('parses all private/cycle table formats without shifting teacher into room fields', () => {
    const markdown = `
# 5. Cursos privados — Sede Norte
## 5.2. Cursos de tarde — Norte
| Código | Curso | Centro | Inicio | Fin | Horario | Horas | Modalidad / observación | Precio total + matrícula | Cuotas | Docente / responsable | Aula | Capacidad | Matriculados / estado | Notas |
|---|---|---|---:|---:|---|---:|---|---:|---:|---|---|---:|---:|---|
| N-004/2026 | Entrenamiento Personal | CEP | 15/05/2026 | 29/01/2027 | Viernes 17:00-20:00 | Teórico-práctico | — | 990€ + 150M | 90€ × 10 | Javier, Agustín, Lucía o Carlos | Aula 5 | 17 | 5 | Nota |

## 5.3. Nuevos cursos próximos a poner en marcha — Norte
| Código | Curso | Centro | Inicio | Fin | Horario | Horas / modalidad | Precio total + matrícula | Cuotas | Docente | Aula | Capacidad | Matriculados / estado | Observación |
|---|---|---|---|---|---|---|---:|---:|---|---|---:|---:|---|
| N-/2026 | Adiestramiento Canino Nivel 2 | CEP ANACP | — | — | Lunes 16:00-18:30 | 2,5h | 630€ + 160M | 105€ × 6 | Johana | Aula 5 | 17 | 10 | Próximo |

# 6. Cursos privados — Sede Santa Cruz
## 6.1. Cursos de mañana — Santa Cruz
| Código | Curso | Inicio | Fin | Horario | Horas | Precio total + matrícula | Cuotas | Docente | Aula / espacio | Capacidad | Matriculados | Retrasos / notas | Encargado |
|---|---|---:|---:|---|---:|---:|---:|---|---|---:|---:|---|---|
| C-/2025 | Instructor de Pilates | 09/09/2026 | — | Miércoles 10:00-13:00 | N/A | 950€ + 150M | 95€ × 10 | Cristina Suárez | Aula 2 | 18 | 1 | 1ª 01/10 | Aure |

## 6.3. Ciclos formativos — Santa Cruz
| Código | Curso | Inicio | Fin | Horario | Horas | Precio / matrícula | Cuotas | Aula / espacio | Capacidad | Matriculados |
|---|---|---:|---:|---|---:|---|---|---|---:|---:|
| CFGMF | CFGM Farmacia | 14/09/2026 | 15/06/2027 | Lunes 17:00-21:00 | 500h | 2.000€ + matrícula 200€ | 10 cuotas × 200€ | MAC | 18 | 0 |
`;
    const rows = parseConvocationRows(markdown);

    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({
      courseTitle: 'Entrenamiento Personal',
      teacherRaw: 'Javier, Agustín, Lucía o Carlos',
      roomRaw: 'Aula 5',
      capacityRaw: '17',
      enrolledRaw: '5',
      shift: 'afternoon',
    });
    expect(rows[1]).toMatchObject({
      courseTitle: 'Adiestramiento Canino Nivel 2',
      teacherRaw: 'Johana',
      roomRaw: 'Aula 5',
      capacityRaw: '17',
      enrolledRaw: '10',
    });
    expect(rows[2]).toMatchObject({
      courseTitle: 'Instructor de Pilates',
      teacherRaw: 'Cristina Suárez',
      roomRaw: 'Aula 2',
      capacityRaw: '18',
      enrolledRaw: '1',
    });
    expect(rows[3]).toMatchObject({
      trainingType: 'cycle',
      courseTitle: 'CFGM Farmacia',
      teacherRaw: '',
      roomRaw: 'MAC',
      capacityRaw: '18',
      enrolledRaw: '0',
    });
  });
});
