import { writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { getPayload } from 'payload'
import type * as XLSXType from 'xlsx'
import config from '../src/payload.config'
import {
  CEP_STAFF_SEEDS,
  assertDatabaseConfig,
  canonicalTeacherName,
  normalizeText,
  parseEuroAmount,
  splitName,
} from './cep-planning-v1'

type Options = {
  inputPath: string
  tenantId: number
  apply: boolean
  json: boolean
  out?: string
}

type PayloadClient = Awaited<ReturnType<typeof getPayload>>
const require = createRequire(import.meta.url)
const XLSX = require('xlsx') as typeof XLSXType

type ExcelConvocationRow = {
  rowNumber: number
  turno: string
  codigo: string
  courseTitle: string
  diploma: string
  startRaw: string
  endRaw: string
  dayRaw: string
  timeStartRaw: string
  timeEndRaw: string
  practicas: string
  priceRaw: string
  enrollmentFeeRaw: string
  installmentsRaw: string
  teachersRaw: string[]
  classroomRaw: string
  capacityRaw: string
  notes: string
}

const DEFAULT_INPUT_PATH = '/Users/carlosjperez/Desktop/CEP_FORMACION_PROXIMOS_INICIOS_SANTA_CRUZ_DOCENTES_MARCADOR_GUION (1).xlsx'

const COURSE_TITLE_ALIASES: Record<string, string> = {
  'acv aux clinico veterinario': 'auxiliar clinico veterinario',
  'acv auxiliar clinico veterinario': 'auxiliar clinico veterinario',
  'atv combo': 'ayudante tecnico veterinario',
  'atv combo elena': 'ayudante tecnico veterinario',
  'atv combo alicia': 'ayudante tecnico veterinario',
  'auxiliar en clinicas esteticas': 'auxiliar de clinicas esteticas',
  'auxiliar odontologia': 'auxiliar de odontologia e higiene',
  'auxiliar de farmacia y parafarmacia dermocosmetica': 'farmacia y dermocosmetica',
  'experto en nutricosmetica y complementos alimenticios': 'experto en nutricosmetica y complementos alimenticios',
  'instructor de pilates': 'instructor a de pilates',
  'quiromasaje holistico': 'quiromasaje',
}

const DAY_MAP: Record<string, string> = {
  lunes: 'monday',
  martes: 'tuesday',
  miercoles: 'wednesday',
  miércoles: 'wednesday',
  jueves: 'thursday',
  viernes: 'friday',
  sabado: 'saturday',
  sábado: 'saturday',
  domingo: 'sunday',
}

function parseArgs(argv: string[]): Options {
  const options: Options = { inputPath: DEFAULT_INPUT_PATH, tenantId: 1, apply: false, json: false }
  for (const arg of argv) {
    if (arg === '--apply') options.apply = true
    if (arg === '--json') options.json = true
    if (arg.startsWith('--input=')) options.inputPath = arg.slice('--input='.length)
    if (arg.startsWith('--tenant-id=')) options.tenantId = Number(arg.split('=')[1])
    if (arg.startsWith('--out=')) options.out = arg.slice('--out='.length)
  }
  return options
}

function text(value: unknown): string {
  if (value == null) return ''
  return String(value).trim()
}

function normalizeCourseKey(value: string): string {
  const normalized = normalizeText(value.replace(/\([^)]*\)/g, ' '))
  return COURSE_TITLE_ALIASES[normalized] ?? normalized
}

function parseDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString()
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (parsed) return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d, 12)).toISOString()
  }
  const raw = text(value)
  if (!raw || raw === '-' || normalizeText(raw) === 'nov') return null
  const ddmmyyyy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (ddmmyyyy) return new Date(Date.UTC(Number(ddmmyyyy[3]), Number(ddmmyyyy[2]) - 1, Number(ddmmyyyy[1]), 12)).toISOString()
  const monthYear = raw.match(/^([a-záéíóúñ]+)\s+(\d{4})$/i)
  if (monthYear) {
    const monthKey = normalizeText(monthYear[1])
    const month = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'].indexOf(monthKey)
    if (month >= 0) return new Date(Date.UTC(Number(monthYear[2]), month, 1, 12)).toISOString()
  }
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function normalizeTime(value: string): string | null {
  const raw = text(value)
  if (!raw || raw === '-') return null
  const match = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (!match) return null
  return `${match[1].padStart(2, '0')}:${match[2]}:00`
}

function previousDayIso(value: string | null): string | undefined {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString()
}

function parseInstallments(value: string): { amount?: number; count?: number } {
  const match = text(value).match(/(\d+(?:[,.]\d+)?)\s*€?\s*x\s*(\d+)/i)
  if (!match) return {}
  return { amount: Number(match[1].replace(',', '.')), count: Number(match[2]) }
}

function teacherNames(values: string[]) {
  return [...new Set(values.map(text).filter((value) => value && value !== '-').map(canonicalTeacherName))]
}

function readRows(inputPath: string): ExcelConvocationRow[] {
  const wb = XLSX.readFile(inputPath, { cellDates: true })
  const ws = wb.Sheets['Próximos Inicios SC']
  if (!ws) throw new Error('No existe la hoja "Próximos Inicios SC"')
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, defval: '' })
  const headerIndex = rows.findIndex((row) => row.map(text).includes('Turno') && row.map(text).includes('Curso'))
  if (headerIndex < 0) throw new Error('No se encontró cabecera de convocatorias')
  return rows.slice(headerIndex + 1)
    .map((row, index): ExcelConvocationRow => ({
      rowNumber: headerIndex + index + 2,
      turno: text(row[0]),
      codigo: text(row[1]),
      courseTitle: text(row[2]),
      diploma: text(row[3]),
      startRaw: text(row[4]),
      endRaw: text(row[5]),
      dayRaw: text(row[6]),
      timeStartRaw: text(row[7]),
      timeEndRaw: text(row[8]),
      practicas: text(row[9]),
      priceRaw: text(row[10]),
      enrollmentFeeRaw: text(row[11]),
      installmentsRaw: text(row[12]),
      teachersRaw: [text(row[13]), text(row[14]), text(row[15])],
      classroomRaw: text(row[16]),
      capacityRaw: text(row[17]),
      notes: text(row[18]),
    }))
    .filter((row) => row.courseTitle)
}

async function fetchAll(payload: PayloadClient, collection: string, where: Record<string, unknown>) {
  const docs = []
  let page = 1
  while (true) {
    const result = await payload.find({ collection, where, page, limit: 200, depth: 1, overrideAccess: true })
    docs.push(...result.docs)
    if (!result.totalPages || page >= result.totalPages) break
    page += 1
  }
  return docs as Record<string, any>[]
}

function relationId(value: unknown): string | number | null {
  if (typeof value === 'string' || typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) return (value as { id?: string | number }).id ?? null
  return null
}

function findCourse(courses: Record<string, any>[], title: string) {
  const wanted = normalizeCourseKey(title)
  return courses.find((course) => normalizeCourseKey(String(course.name ?? course.title ?? '')) === wanted)
    ?? courses.find((course) => {
      const haystack = normalizeCourseKey(String(course.name ?? course.title ?? ''))
      return haystack.includes(wanted) || wanted.includes(haystack)
    })
    ?? null
}

function findSantaCruz(campuses: Record<string, any>[]) {
  return campuses.find((campus) => normalizeText(String(campus.slug ?? campus.name ?? '')).includes('santa cruz')) ?? null
}

function findClassroom(classrooms: Record<string, any>[], raw: string, campusId: string | number | null) {
  const wanted = normalizeText(raw)
  if (!wanted || wanted === '-') return null
  const candidates = campusId == null ? classrooms : classrooms.filter((room) => String(relationId(room.campus)) === String(campusId))
  return candidates.find((room) => {
    const haystack = normalizeText(`${room.name ?? ''} ${room.code ?? ''}`)
    return haystack.includes(wanted) || wanted.includes(haystack)
  }) ?? null
}

async function findOrCreateTeacher(payload: PayloadClient, tenantId: number, name: string, apply: boolean) {
  const seed = CEP_STAFF_SEEDS.find((person) => person.fullName === name || person.aliases.some((alias) => normalizeText(alias) === normalizeText(name)))
  const aliases = [name, seed?.fullName, ...(seed?.aliases ?? [])].filter(Boolean).map((value) => normalizeText(String(value)))
  const staff = await payload.find({ collection: 'staff', limit: 500, depth: 0, overrideAccess: true })
  const existing = (staff.docs as Record<string, any>[]).find((member) => {
    const values = [member.full_name, member.fullName, member.first_name, member.alias_names].filter(Boolean).join(',').split(',').map(normalizeText)
    return values.some((value) => aliases.includes(value))
  })
  if (existing) return { id: existing.id, action: 'existing' }
  if (!seed) return { id: null, action: 'missing' }
  if (!apply) return { id: null, action: 'create' }
  const created = await payload.create({
      collection: 'staff',
      data: {
        staff_type: 'profesor',
      ...splitName(seed.fullName),
      full_name: seed.fullName,
      position: seed.position,
      contract_type: 'freelance',
      employment_status: 'active',
      assigned_campuses: [],
      qualified_areas: [],
      is_active: true,
      data_quality_status: 'pending_validation',
      source: 'cep_convo_xlsx_2026_06_22',
      alias_names: seed.aliases.join(', '),
      detected_courses: seed.detectedCourses.join(', '),
      notes: seed.notes ?? 'Docente creado desde Excel de próximos inicios Santa Cruz.',
    },
    overrideAccess: true,
  })
  return { id: created.id, action: 'created' }
}

function sameDate(left: unknown, right: unknown) {
  if (!left || !right) return false
  return new Date(String(left)).toISOString().slice(0, 10) === new Date(String(right)).toISOString().slice(0, 10)
}

function findExistingRun(runs: Record<string, any>[], data: Record<string, any>) {
  return runs.find((run) =>
    String(relationId(run.course)) === String(data.course)
    && sameDate(run.start_date, data.start_date)
    && String(run.schedule_time_start ?? '') === String(data.schedule_time_start ?? '')
    && String(run.schedule_time_end ?? '') === String(data.schedule_time_end ?? '')
  ) ?? null
}

export async function runXlsxImport(options: Options) {
  assertDatabaseConfig()
  const rows = readRows(options.inputPath)
  const payload = await getPayload({ config })
  const [courses, campuses, classrooms, existingRuns] = await Promise.all([
    fetchAll(payload, 'courses', {}),
    fetchAll(payload, 'campuses', { tenant: { equals: options.tenantId } }),
    fetchAll(payload, 'classrooms', { tenant: { equals: options.tenantId } }),
    fetchAll(payload, 'course-runs', { tenant: { equals: options.tenantId } }),
  ])

  const campus = findSantaCruz(campuses)
  const actions = []

  for (const row of rows) {
    const issues: string[] = []
    const course = findCourse(courses, row.courseTitle)
    const classroom = findClassroom(classrooms, row.classroomRaw, campus?.id ?? null)
    const startDate = parseDate(row.startRaw)
    const endDate = parseDate(row.endRaw)
    const day = DAY_MAP[row.dayRaw.toLowerCase()] ?? DAY_MAP[normalizeText(row.dayRaw)]
    const timeStart = normalizeTime(row.timeStartRaw)
    const timeEnd = normalizeTime(row.timeEndRaw)
    const teachers = []
    for (const name of teacherNames(row.teachersRaw)) {
      teachers.push({ name, ...(await findOrCreateTeacher(payload, options.tenantId, name, options.apply)) })
    }
    const teacherIds = teachers.map((teacher) => teacher.id).filter((id): id is number => typeof id === 'number')
    const installments = parseInstallments(row.installmentsRaw)

    if (!course) issues.push('course_not_found')
    if (!campus) issues.push('campus_not_found')
    if (!classroom && row.classroomRaw !== '-') issues.push('classroom_not_found')
    if (!startDate) issues.push('start_date_missing_or_ambiguous')
    if (!endDate) issues.push('end_date_missing_or_ambiguous')
    if (!day) issues.push('weekday_missing_or_invalid')
    if (!timeStart || !timeEnd) issues.push('time_missing_or_invalid')
    if (teachers.some((teacher) => teacher.action === 'missing')) issues.push('teacher_not_found')
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) issues.push('invalid_date_range')

    const data = {
      course: course?.id,
      campus: campus?.id,
      classroom: classroom?.id,
      start_date: startDate,
      end_date: endDate,
      schedule_days: day ? [day] : [],
      schedule_time_start: timeStart,
      schedule_time_end: timeEnd,
      status: 'draft',
      enrollment_status: 'scheduled',
      enrollment_deadline: previousDayIso(startDate),
      planning_status: issues.length > 0 ? 'pending_validation' : 'draft',
      training_type: 'private',
      shift: normalizeText(row.turno).includes('tarde') ? 'afternoon' : 'morning',
      min_students: 1,
      max_students: Number(row.capacityRaw) || classroom?.capacity || 1,
      price_override: parseEuroAmount(row.priceRaw) ?? undefined,
      price_snapshot: parseEuroAmount(row.priceRaw) ?? undefined,
      enrollment_fee_snapshot: parseEuroAmount(row.enrollmentFeeRaw) ?? undefined,
      installment_amount_snapshot: installments.amount,
      installment_count_snapshot: installments.count,
      price_source: 'manual_import',
      instructor: teacherIds[0],
      instructors: teacherIds.length > 0 ? teacherIds : undefined,
      notes: [
        'Importado desde Excel CEP próximos inicios Santa Cruz actualizado 22/06/2026.',
        `Fila Excel: ${row.rowNumber}. Código origen: ${row.codigo || 'sin código'}. Diploma: ${row.diploma || 'sin diploma'}.`,
        row.practicas ? `Prácticas: ${row.practicas}.` : '',
        row.installmentsRaw ? `Cuotas origen: ${row.installmentsRaw}.` : '',
        row.notes ? `Observaciones origen: ${row.notes}` : '',
        issues.length > 0 ? `Pendiente revisión: ${issues.join(', ')}` : '',
      ].filter(Boolean).join('\n'),
      tenant: options.tenantId,
    }

    const canWrite = issues.length === 0 && course && campus && startDate && endDate && day && timeStart && timeEnd
    const existing = canWrite ? findExistingRun(existingRuns, data) : null
    if (!canWrite) {
      actions.push({ action: 'pending', row: row.rowNumber, courseTitle: row.courseTitle, teachers, issues })
      continue
    }
    if (existing) {
      if (options.apply) {
        await payload.update({ collection: 'course-runs', id: existing.id, data, overrideAccess: true })
      }
      actions.push({ action: 'update', id: existing.id, row: row.rowNumber, courseTitle: row.courseTitle, teachers, issues })
      continue
    }
    if (options.apply) {
      const created = await payload.create({ collection: 'course-runs', data: { ...data, current_enrollments: 0 }, overrideAccess: true })
      existingRuns.push(created as Record<string, any>)
      actions.push({ action: 'create', id: created.id, row: row.rowNumber, courseTitle: row.courseTitle, teachers, issues })
    } else {
      actions.push({ action: 'create', row: row.rowNumber, courseTitle: row.courseTitle, teachers, issues })
    }
  }

  const result = {
    mode: options.apply ? 'apply' : 'dry-run',
    inputPath: options.inputPath,
    tenantId: options.tenantId,
    totals: {
      excelRows: rows.length,
      create: actions.filter((action) => action.action === 'create').length,
      update: actions.filter((action) => action.action === 'update').length,
      pending: actions.filter((action) => action.action === 'pending').length,
    },
    actions,
  }

  if (options.out) {
    await writeFile(path.resolve(options.out), JSON.stringify(result, null, 2))
  }

  return result
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const result = await runXlsxImport(options)
  if (options.json) {
    console.log(JSON.stringify(result, null, 2))
    process.exit(0)
    return
  }
  console.log(`CEP convocatorias XLSX import (${result.mode})`)
  console.log(`Rows: ${result.totals.excelRows}`)
  console.log(`Create: ${result.totals.create}`)
  console.log(`Update: ${result.totals.update}`)
  console.log(`Pending: ${result.totals.pending}`)
  process.exit(0)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main().catch((error) => {
    console.error('import-cep-convocatorias-xlsx failed:', error)
    process.exit(1)
  })
}
