import { readFile } from 'node:fs/promises'
import postgres from 'postgres'

export interface StaffAreaAssignmentRecord {
  line: number
  staffId: number
  areaIds: number[]
  reason?: string
}

export interface StaffAreaAssignmentStaff {
  id: number
  fullName: string
  staffType: string
  employmentStatus: string | null
  isActive: boolean | null
}

export interface StaffAreaAssignmentArea {
  id: number
  nombre: string
  codigo: string | null
  active: boolean | null
}

export interface StaffAreaAssignmentPlanItem {
  record: StaffAreaAssignmentRecord
  staff?: StaffAreaAssignmentStaff
  areas: StaffAreaAssignmentArea[]
  errors: string[]
}

export interface StaffAreaAssignmentPlan {
  ok: boolean
  totalRecords: number
  validRecords: number
  invalidRecords: number
  totalRelations: number
  items: StaffAreaAssignmentPlanItem[]
}

interface ScriptOptions {
  csvPath: string | null
  apply: boolean
  replace: boolean
  json: boolean
}

function parseArgs(argv: string[]): ScriptOptions {
  const csvFlagIndex = argv.findIndex((arg) => arg === '--csv')
  const csvEquals = argv.find((arg) => arg.startsWith('--csv='))

  return {
    csvPath: csvEquals?.slice('--csv='.length) ?? (csvFlagIndex >= 0 ? argv[csvFlagIndex + 1] : null),
    apply: argv.includes('--apply'),
    replace: argv.includes('--replace'),
    json: argv.includes('--json'),
  }
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]

    if (char === '"' && quoted && next === '"') {
      current += '"'
      index += 1
      continue
    }

    if (char === '"') {
      quoted = !quoted
      continue
    }

    if (char === ',' && !quoted) {
      cells.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  cells.push(current.trim())
  return cells
}

function parseAreaIds(raw: string, line: number): number[] {
  const ids = raw
    .split(/[|;]/)
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => Number(value))

  const invalid = ids.some((id) => !Number.isInteger(id) || id <= 0)
  if (invalid || ids.length === 0) {
    throw new Error(`Linea ${line}: area_ids debe contener IDs numericos separados por ; o |`)
  }

  return Array.from(new Set(ids))
}

export function parseStaffAreaAssignmentCsv(source: string): StaffAreaAssignmentRecord[] {
  const lines = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))

  if (lines.length === 0) return []

  const header = parseCsvLine(lines[0]).map((column) => column.trim().toLowerCase())
  const staffIndex = header.findIndex((column) => ['staff_id', 'staffid', 'docente_id', 'profesor_id'].includes(column))
  const areasIndex = header.findIndex((column) => ['area_ids', 'areaids', 'areas', 'qualified_area_ids'].includes(column))
  const reasonIndex = header.findIndex((column) => ['reason', 'motivo', 'observacion', 'observacion_interna'].includes(column))

  if (staffIndex < 0 || areasIndex < 0) {
    throw new Error('El CSV debe incluir cabeceras staff_id y area_ids')
  }

  const records: StaffAreaAssignmentRecord[] = []
  const seen = new Set<number>()

  for (let index = 1; index < lines.length; index += 1) {
    const lineNumber = index + 1
    const cells = parseCsvLine(lines[index])
    const staffId = Number(cells[staffIndex])

    if (!Number.isInteger(staffId) || staffId <= 0) {
      throw new Error(`Linea ${lineNumber}: staff_id no valido`)
    }

    if (seen.has(staffId)) {
      throw new Error(`Linea ${lineNumber}: staff_id duplicado (${staffId})`)
    }
    seen.add(staffId)

    records.push({
      line: lineNumber,
      staffId,
      areaIds: parseAreaIds(cells[areasIndex] ?? '', lineNumber),
      reason: reasonIndex >= 0 ? cells[reasonIndex]?.trim() : undefined,
    })
  }

  return records
}

export function buildStaffAreaAssignmentPlan(
  records: StaffAreaAssignmentRecord[],
  staffById: Map<number, StaffAreaAssignmentStaff>,
  areaById: Map<number, StaffAreaAssignmentArea>,
): StaffAreaAssignmentPlan {
  const items = records.map((record) => {
    const errors: string[] = []
    const staff = staffById.get(record.staffId)
    const areas = record.areaIds
      .map((areaId) => areaById.get(areaId))
      .filter((area): area is StaffAreaAssignmentArea => Boolean(area))

    if (!staff) {
      errors.push(`Docente #${record.staffId} no existe`)
    } else {
      if (!['profesor', 'academico'].includes(staff.staffType)) {
        errors.push(`Personal #${record.staffId} no es docente ni academico`)
      }
      if (staff.isActive === false || staff.employmentStatus !== 'active') {
        errors.push(`Docente #${record.staffId} no esta activo`)
      }
    }

    for (const areaId of record.areaIds) {
      const area = areaById.get(areaId)
      if (!area) {
        errors.push(`Area #${areaId} no existe`)
      } else if (area.active === false) {
        errors.push(`Area #${areaId} no esta activa`)
      }
    }

    return { record, staff, areas, errors }
  })

  const invalidRecords = items.filter((item) => item.errors.length > 0).length
  const totalRelations = items
    .filter((item) => item.errors.length === 0)
    .reduce((total, item) => total + item.record.areaIds.length, 0)

  return {
    ok: invalidRecords === 0,
    totalRecords: records.length,
    validRecords: records.length - invalidRecords,
    invalidRecords,
    totalRelations,
    items,
  }
}

async function fetchStaff(sql: postgres.Sql, ids: number[]) {
  if (ids.length === 0) return new Map<number, StaffAreaAssignmentStaff>()

  const rows = await sql<{
    id: number
    full_name: string
    staff_type: string
    employment_status: string | null
    is_active: boolean | null
  }[]>`
    SELECT id, full_name, staff_type, employment_status, is_active
    FROM staff
    WHERE id = ANY(${ids})
  `

  return new Map(rows.map((row) => [row.id, {
    id: row.id,
    fullName: row.full_name,
    staffType: row.staff_type,
    employmentStatus: row.employment_status,
    isActive: row.is_active,
  }]))
}

async function fetchAreas(sql: postgres.Sql, ids: number[]) {
  if (ids.length === 0) return new Map<number, StaffAreaAssignmentArea>()

  const rows = await sql<{
    id: number
    nombre: string
    codigo: string | null
    activo: boolean | null
  }[]>`
    SELECT id, nombre, codigo, activo
    FROM areas_formativas
    WHERE id = ANY(${ids})
  `

  return new Map(rows.map((row) => [row.id, {
    id: row.id,
    nombre: row.nombre,
    codigo: row.codigo,
    active: row.activo,
  }]))
}

async function applyPlan(sql: postgres.Sql, plan: StaffAreaAssignmentPlan, replace: boolean) {
  let appliedTeachers = 0
  let insertedRelations = 0
  let removedRelations = 0

  await sql.begin(async (tx) => {
    for (const item of plan.items) {
      if (item.errors.length > 0) continue

      if (replace) {
        const removed = await tx`
          DELETE FROM staff_rels
          WHERE parent_id = ${item.record.staffId}
            AND path = 'qualified_areas'
        `
        removedRelations += removed.count
      }

      let insertedForTeacher = 0
      for (const [order, areaId] of item.record.areaIds.entries()) {
        const inserted = await tx`
          INSERT INTO staff_rels ("order", parent_id, path, areas_formativas_id)
          SELECT ${order}, ${item.record.staffId}, 'qualified_areas', ${areaId}
          WHERE NOT EXISTS (
            SELECT 1
            FROM staff_rels
            WHERE parent_id = ${item.record.staffId}
              AND path = 'qualified_areas'
              AND areas_formativas_id = ${areaId}
          )
          RETURNING id
        `
        insertedForTeacher += inserted.count
      }

      if (insertedForTeacher > 0 || replace) appliedTeachers += 1
      insertedRelations += insertedForTeacher
    }
  })

  return { appliedTeachers, insertedRelations, removedRelations }
}

function printPlan(plan: StaffAreaAssignmentPlan, applied?: Awaited<ReturnType<typeof applyPlan>>) {
  console.log('Staff qualified areas CSV assignment')
  console.log('====================================')
  console.log(`Records: ${plan.totalRecords}`)
  console.log(`Valid: ${plan.validRecords}`)
  console.log(`Invalid: ${plan.invalidRecords}`)
  console.log(`Relations requested: ${plan.totalRelations}`)
  if (applied) {
    console.log(`Applied teachers: ${applied.appliedTeachers}`)
    console.log(`Inserted relations: ${applied.insertedRelations}`)
    console.log(`Removed relations: ${applied.removedRelations}`)
  }
  console.log('')

  for (const item of plan.items) {
    const staff = item.staff ? `${item.staff.fullName} (#${item.staff.id})` : `#${item.record.staffId}`
    const areas = item.areas.map((area) => `${area.nombre} (#${area.id})`).join(', ')
    const status = item.errors.length > 0 ? `ERROR: ${item.errors.join('; ')}` : 'OK'
    console.log(`- line ${item.record.line}: ${staff} -> ${areas || 'sin areas'} [${status}]`)
  }
}

export async function runStaffAreaAssignment(options: ScriptOptions) {
  if (!options.csvPath) throw new Error('Uso: pnpm audit:staff:areas:apply -- --csv ./areas.csv [--apply] [--replace]')

  const databaseUri = process.env.DATABASE_URI
  if (!databaseUri) throw new Error('DATABASE_URI is required to apply staff qualified areas')

  const source = await readFile(options.csvPath, 'utf8')
  const records = parseStaffAreaAssignmentCsv(source)
  const staffIds = records.map((record) => record.staffId)
  const areaIds = Array.from(new Set(records.flatMap((record) => record.areaIds)))

  const sql = postgres(databaseUri, { max: 1 })
  try {
    const [staffById, areaById] = await Promise.all([
      fetchStaff(sql, staffIds),
      fetchAreas(sql, areaIds),
    ])
    const plan = buildStaffAreaAssignmentPlan(records, staffById, areaById)

    let applied: Awaited<ReturnType<typeof applyPlan>> | undefined
    if (options.apply) {
      if (!plan.ok) throw new Error('El CSV contiene errores. Corrige el archivo antes de aplicar cambios.')
      applied = await applyPlan(sql, plan, options.replace)
    }

    return { plan, applied }
  } finally {
    await sql.end()
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const result = await runStaffAreaAssignment(options)

  if (options.json) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    printPlan(result.plan, result.applied)
    if (!options.apply) {
      console.log('')
      console.log('Dry-run: no se aplicaron cambios. Repite con --apply para escribir en base de datos.')
    }
  }

  if (!result.plan.ok) process.exitCode = 1
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
