import postgres from 'postgres'

export interface MissingTeacherAreaRow {
  staffId: number
  fullName: string
  staffType: string
  employmentStatus: string | null
  isActive: boolean | null
  inferredAreas: {
    id: number
    codigo: string
    nombre: string
    evidenceCount: number
  }[]
}

export interface StaffAreaAuditSummary {
  totalMissing: number
  inferable: number
  needsManualReview: number
  appliedTeachers: number
  appliedRelations: number
}

export interface StaffAreaAuditResult {
  ok: boolean
  summary: StaffAreaAuditSummary
  rows: MissingTeacherAreaRow[]
}

interface ScriptOptions {
  applyInferred: boolean
  strict: boolean
  json: boolean
}

function parseArgs(argv: string[]): ScriptOptions {
  return {
    applyInferred: argv.includes('--apply-inferred'),
    strict: argv.includes('--strict'),
    json: argv.includes('--json'),
  }
}

export function buildStaffAreaAuditResult(
  rows: MissingTeacherAreaRow[],
  appliedTeachers = 0,
  appliedRelations = 0,
): StaffAreaAuditResult {
  const inferable = rows.filter((row) => row.inferredAreas.length > 0).length
  const needsManualReview = rows.length - inferable

  return {
    ok: rows.length === 0,
    summary: {
      totalMissing: rows.length,
      inferable,
      needsManualReview,
      appliedTeachers,
      appliedRelations,
    },
    rows,
  }
}

async function fetchMissingTeachingAreas(sql: postgres.Sql): Promise<MissingTeacherAreaRow[]> {
  const rows = await sql<{
    staff_id: number
    full_name: string
    staff_type: string
    employment_status: string | null
    is_active: boolean | null
    inferred_areas: {
      id: number
      codigo: string
      nombre: string
      evidenceCount: number
    }[] | null
  }[]>`
    WITH direct_instructor_evidence AS (
      SELECT
        cr.instructor_id AS staff_id,
        c.area_formativa_id AS area_id,
        count(*)::int AS evidence_count
      FROM course_runs cr
      JOIN courses c ON c.id = cr.course_id
      WHERE cr.instructor_id IS NOT NULL
        AND c.area_formativa_id IS NOT NULL
      GROUP BY cr.instructor_id, c.area_formativa_id
    ),
    rel_instructor_evidence AS (
      SELECT
        crr.staff_id AS staff_id,
        c.area_formativa_id AS area_id,
        count(*)::int AS evidence_count
      FROM course_runs_rels crr
      JOIN course_runs cr ON cr.id = crr.parent_id
      JOIN courses c ON c.id = cr.course_id
      WHERE crr.path = 'instructors'
        AND crr.staff_id IS NOT NULL
        AND c.area_formativa_id IS NOT NULL
      GROUP BY crr.staff_id, c.area_formativa_id
    ),
    teacher_area_evidence AS (
      SELECT * FROM direct_instructor_evidence
      UNION ALL
      SELECT * FROM rel_instructor_evidence
    ),
    aggregated_evidence AS (
      SELECT
        tae.staff_id,
        tae.area_id,
        sum(tae.evidence_count)::int AS evidence_count
      FROM teacher_area_evidence tae
      GROUP BY tae.staff_id, tae.area_id
    ),
    missing AS (
      SELECT
        s.id,
        s.full_name,
        s.staff_type,
        s.employment_status,
        s.is_active
      FROM staff s
      LEFT JOIN staff_rels sr
        ON sr.parent_id = s.id
       AND sr.path = 'qualified_areas'
       AND sr.areas_formativas_id IS NOT NULL
      WHERE s.staff_type IN ('profesor', 'academico')
        AND COALESCE(s.is_active, true) = true
        AND COALESCE(s.employment_status, 'active') = 'active'
      GROUP BY s.id, s.full_name, s.staff_type, s.employment_status, s.is_active
      HAVING count(sr.areas_formativas_id) = 0
    )
    SELECT
      m.id AS staff_id,
      m.full_name,
      m.staff_type,
      m.employment_status,
      m.is_active,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', area.id,
            'codigo', area.codigo,
            'nombre', area.nombre,
            'evidenceCount', ae.evidence_count
          )
          ORDER BY area.nombre
        ) FILTER (WHERE area.id IS NOT NULL),
        '[]'::jsonb
      ) AS inferred_areas
    FROM missing m
    LEFT JOIN aggregated_evidence ae ON ae.staff_id = m.id
    LEFT JOIN areas_formativas area ON area.id = ae.area_id
    GROUP BY m.id, m.full_name, m.staff_type, m.employment_status, m.is_active
    ORDER BY m.full_name
  `

  return rows.map((row) => ({
    staffId: row.staff_id,
    fullName: row.full_name,
    staffType: row.staff_type,
    employmentStatus: row.employment_status,
    isActive: row.is_active,
    inferredAreas: row.inferred_areas ?? [],
  }))
}

async function applyInferredAreas(sql: postgres.Sql, rows: MissingTeacherAreaRow[]) {
  let appliedTeachers = 0
  let appliedRelations = 0

  await sql.begin(async (tx) => {
    for (const row of rows) {
      if (row.inferredAreas.length === 0) continue

      let order = 0
      let insertedForTeacher = 0

      for (const area of row.inferredAreas) {
        const result = await tx`
          INSERT INTO staff_rels ("order", parent_id, path, areas_formativas_id)
          SELECT ${order}, ${row.staffId}, 'qualified_areas', ${area.id}
          WHERE NOT EXISTS (
            SELECT 1
            FROM staff_rels
            WHERE parent_id = ${row.staffId}
              AND path = 'qualified_areas'
              AND areas_formativas_id = ${area.id}
          )
          RETURNING id
        `
        insertedForTeacher += result.count
        order += 1
      }

      if (insertedForTeacher > 0) {
        appliedTeachers += 1
        appliedRelations += insertedForTeacher
      }
    }
  })

  return { appliedTeachers, appliedRelations }
}

function printHumanReport(result: StaffAreaAuditResult) {
  console.log('Staff qualified areas audit')
  console.log('===========================')
  console.log(`Missing active teaching staff areas: ${result.summary.totalMissing}`)
  console.log(`Inferable from existing convocatorias: ${result.summary.inferable}`)
  console.log(`Needs manual review: ${result.summary.needsManualReview}`)
  console.log(`Applied teachers: ${result.summary.appliedTeachers}`)
  console.log(`Applied relations: ${result.summary.appliedRelations}`)
  console.log('')

  for (const row of result.rows) {
    const areas = row.inferredAreas.length
      ? row.inferredAreas
          .map((area) => `${area.nombre} (${area.codigo}, ${area.evidenceCount})`)
          .join(', ')
      : 'sin evidencia suficiente'
    console.log(`- #${row.staffId} ${row.fullName}: ${areas}`)
  }
}

export async function runStaffQualifiedAreasAudit(options: ScriptOptions): Promise<StaffAreaAuditResult> {
  const databaseUri = process.env.DATABASE_URI
  if (!databaseUri) {
    throw new Error('DATABASE_URI is required to audit staff qualified areas')
  }

  const sql = postgres(databaseUri, { max: 1 })
  try {
    const initialRows = await fetchMissingTeachingAreas(sql)
    let appliedTeachers = 0
    let appliedRelations = 0

    if (options.applyInferred) {
      const applied = await applyInferredAreas(sql, initialRows)
      appliedTeachers = applied.appliedTeachers
      appliedRelations = applied.appliedRelations
    }

    const finalRows = options.applyInferred
      ? await fetchMissingTeachingAreas(sql)
      : initialRows

    return buildStaffAreaAuditResult(finalRows, appliedTeachers, appliedRelations)
  } finally {
    await sql.end()
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const result = await runStaffQualifiedAreasAudit(options)

  if (options.json) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    printHumanReport(result)
  }

  if (options.strict && !result.ok) {
    process.exitCode = 1
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
