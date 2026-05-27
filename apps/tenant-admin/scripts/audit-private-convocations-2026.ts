import { getPayload } from 'payload'
import config from '../src/payload.config'
import { normalizeText, teacherNames } from './cep-planning-v1'

type ExpectedRun = {
  campus: 'sede-santa-cruz' | 'sede-norte'
  title: string
  codePrefix: 'C-' | 'N-'
  shift: 'morning' | 'afternoon'
  start?: string
  end?: string
  day?: string
  startTime?: string
  endTime?: string
  classroom?: string
  capacity?: number
  teachers: string[]
  notes?: string
}

const EXPECTED_RUNS: ExpectedRun[] = [
  { campus: 'sede-santa-cruz', title: 'ATV COMBO', codePrefix: 'C-', shift: 'morning', day: 'tuesday', startTime: '10:30', endTime: '13:30', classroom: 'Aula 2', capacity: 18, teachers: ['Elena Micello'], notes: 'Inicio incompleto en origen: NOV / mayo 2026.' },
  { campus: 'sede-santa-cruz', title: 'AUXILIAR EN CLÍNICAS ESTÉTICAS', codePrefix: 'C-', shift: 'morning', start: '2026-05-11', end: '2027-04-05', day: 'monday', startTime: '10:00', endTime: '14:00', classroom: 'Sillones', capacity: 22, teachers: ['Luis José González', 'Nerea Illescas', 'Lucía Corominas Pérez'] },
  { campus: 'sede-santa-cruz', title: 'EXPERTO EN NUTRICOSMÉTICA Y COMPLEMENTOS ALIMENTICIOS', codePrefix: 'C-', shift: 'morning', teachers: ['Lucía Corominas Pérez'], notes: 'Faltan fecha, horario, aula y plazas en origen.' },
  { campus: 'sede-santa-cruz', title: 'AUXILIAR DE FARMACIA Y PARAFARMACIA + DERMOCOSMÉTICA', codePrefix: 'C-', shift: 'morning', start: '2026-09-08', end: '2027-07-06', day: 'tuesday', startTime: '10:00', endTime: '14:00', classroom: 'Sillones', capacity: 22, teachers: [] },
  { campus: 'sede-santa-cruz', title: 'INSTRUCTOR DE PILATES', codePrefix: 'C-', shift: 'morning', start: '2026-09-09', day: 'wednesday', startTime: '10:00', endTime: '13:00', classroom: 'Aula 2', capacity: 18, teachers: ['Cristina Suárez'], notes: 'Código origen figura C-/2025 con inicio 2026.' },
  { campus: 'sede-santa-cruz', title: 'QUIROMASAJE HOLÍSTICO', codePrefix: 'C-', shift: 'morning', start: '2026-09-11', end: '2027-08-01', day: 'friday', startTime: '10:00', endTime: '14:00', classroom: 'Aula 2', capacity: 18, teachers: ['Abraham Portocarrero'] },
  { campus: 'sede-santa-cruz', title: 'ACV AUXILIAR CLÍNICO VETERINARIO', codePrefix: 'C-', shift: 'morning', start: '2026-09-14', end: '2027-06-01', day: 'monday', startTime: '10:30', endTime: '13:30', classroom: 'Aula 2', capacity: 18, teachers: ['Elena Micello'] },
  { campus: 'sede-santa-cruz', title: 'AUXILIAR EN CLÍNICAS ESTÉTICAS', codePrefix: 'C-', shift: 'morning', start: '2026-09-17', end: '2027-07-01', day: 'thursday', startTime: '10:00', endTime: '14:00', classroom: 'Sillones', capacity: 22, teachers: ['Luis José González', 'Nerea Illescas', 'Lucía Corominas Pérez'] },
  { campus: 'sede-santa-cruz', title: 'AUXILIAR ODONTOLOGÍA', codePrefix: 'C-', shift: 'morning', start: '2026-11-25', end: '2027-06-02', day: 'wednesday', startTime: '10:00', endTime: '14:00', classroom: 'Sillones', capacity: 22, teachers: ['Nuria Esther Ángel Ramos'] },
  { campus: 'sede-santa-cruz', title: 'AUXILIAR DE ENFERMERÍA', codePrefix: 'C-', shift: 'afternoon', start: '2026-05-27', day: 'wednesday', startTime: '16:30', endTime: '19:30', classroom: 'Aula 2', capacity: 22, teachers: ['Epifanio Jesús Hernández Delgado', 'María Rando Falcón'] },
  { campus: 'sede-santa-cruz', title: 'AUXILIAR DE FARMACIA Y PARAFARMACIA + DERMOCOSMÉTICA', codePrefix: 'C-', shift: 'afternoon', start: '2026-06-17', day: 'wednesday', startTime: '16:00', endTime: '19:00', classroom: 'MAC', capacity: 18, teachers: ['Lucía Corominas Pérez'] },
  { campus: 'sede-santa-cruz', title: 'ATV COMBO', codePrefix: 'C-', shift: 'afternoon', start: '2026-07-14', end: '2027-01-19', day: 'tuesday', startTime: '16:00', endTime: '19:00', classroom: 'Aula 2', capacity: 18, teachers: ['Alicia Martín González'], notes: 'Origen indicaba fin 19/01/2026; corregido a 2027 para auditoría.' },
  { campus: 'sede-santa-cruz', title: 'AUXILIAR DE ENFERMERÍA', codePrefix: 'C-', shift: 'afternoon', start: '2026-09-21', end: '2027-07-26', day: 'monday', startTime: '16:30', endTime: '19:30', classroom: 'Sillones', capacity: 22, teachers: ['María Rando Falcón'] },
  { campus: 'sede-santa-cruz', title: 'AUXILIAR DE FARMACIA Y PARAFARMACIA + DERMOCOSMÉTICA', codePrefix: 'C-', shift: 'afternoon', start: '2026-10-23', end: '2027-07-01', day: 'friday', startTime: '16:00', endTime: '19:00', classroom: 'MAC', capacity: 18, teachers: ['Jessica Hernandez Nielsen'] },
  { campus: 'sede-santa-cruz', title: 'AGENTE FUNERARIO', codePrefix: 'C-', shift: 'afternoon', start: '2026-10-01', end: '2027-08-01', day: 'thursday', startTime: '18:00', endTime: '21:00', classroom: 'Aula 2', capacity: 18, teachers: ['Ángel Luis Cruz'] },
  { campus: 'sede-santa-cruz', title: 'PELUQUERÍA CANINA Y FELINA', codePrefix: 'C-', shift: 'afternoon', start: '2026-10-26', end: '2027-04-01', day: 'monday', startTime: '16:00', endTime: '19:00', classroom: 'Aula 2', capacity: 18, teachers: ['Raquel Trujillo'] },
  { campus: 'sede-norte', title: 'ADIESTRAMIENTO CANINO NIVEL 1', codePrefix: 'N-', shift: 'morning', start: '2026-09-16', end: '2027-08-27', day: 'tuesday', startTime: '10:00', endTime: '13:00', classroom: 'Aula 5', teachers: ['Daniel Kay'], notes: 'Origen indicaba Daniel ambiguo; requiere confirmación.' },
  { campus: 'sede-norte', title: 'AUXILIAR DE FARMACIA Y PARAFARMACIA + DERMO', codePrefix: 'N-', shift: 'morning', start: '2026-09-14', end: '2027-07-01', day: 'monday', startTime: '10:00', endTime: '14:00', classroom: 'Aula 5', teachers: ['Lucía Corominas Pérez'], notes: 'Origen indicaba fin JULIO 2025; corregido a julio 2027 para auditoría.' },
  { campus: 'sede-norte', title: 'AUXILIAR EN CLÍNICAS ESTÉTICAS', codePrefix: 'N-', shift: 'morning', start: '2026-11-11', end: '2027-09-01', day: 'wednesday', startTime: '10:00', endTime: '14:00', classroom: 'Aula 5', teachers: ['Lucía Corominas Pérez', 'Dra. Beatriz Marín', 'Sheila Méndez'], notes: 'Origen indicaba fin anterior al inicio; corregido a 2027.' },
  { campus: 'sede-norte', title: 'AUXILIAR ODONTOLOGÍA', codePrefix: 'N-', shift: 'morning', start: '2026-11-26', end: '2027-07-01', day: 'thursday', startTime: '10:00', endTime: '14:00', classroom: 'Aula 5', teachers: ['Nuria Esther Ángel Ramos'] },
  { campus: 'sede-norte', title: 'ATV COMBO', codePrefix: 'N-', shift: 'morning', start: '2027-03-05', end: '2028-05-01', day: 'friday', startTime: '10:00', endTime: '13:00', classroom: 'Aula 5', teachers: ['Elena Micello'], notes: 'Fechas 2027-2028 requieren confirmación.' },
  { campus: 'sede-norte', title: 'EXPERTO EN NUTRICOSMÉTICA Y COMPLEMENTOS ALIMENTICIOS', codePrefix: 'N-', shift: 'morning', start: '2026-07-09', end: '2026-09-24', day: 'thursday', startTime: '10:00', endTime: '14:00', classroom: 'Aula 5', teachers: ['Lucía Corominas Pérez'] },
  { campus: 'sede-norte', title: 'SEMINARIO GESTORVET', codePrefix: 'N-', shift: 'morning', start: '2026-08-10', end: '2026-08-13', day: 'monday', startTime: '10:00', endTime: '13:00', classroom: 'Aula 2', teachers: ['Elena Micello'], notes: 'Seminario 10, 12 y 13 de agosto; requiere sesiones múltiples.' },
  { campus: 'sede-norte', title: 'ENTRENAMIENTO PERSONAL', codePrefix: 'N-', shift: 'afternoon', start: '2026-06-19', end: '2027-01-29', day: 'friday', startTime: '17:00', endTime: '20:00', classroom: 'Aula 5', teachers: ['Javier Seoane Cruz', 'Agustín Ramó Mesa Padilla', 'Lucía Corominas Pérez', 'Carlos — pendiente apellidos'] },
  { campus: 'sede-norte', title: 'PELUQUERÍA CANINA Y FELINA', codePrefix: 'N-', shift: 'afternoon', start: '2026-09-09', end: '2027-03-24', day: 'wednesday', startTime: '16:00', endTime: '19:00', classroom: 'Aula 5', teachers: ['Raquel Trujillo'] },
  { campus: 'sede-norte', title: 'URGENCIAS, LABORATORIO Y REHABILITACIÓN', codePrefix: 'N-', shift: 'afternoon', start: '2026-09-10', end: '2027-06-24', day: 'thursday', startTime: '17:00', endTime: '20:00', classroom: 'Aula 5', teachers: ['Elena Micello'] },
  { campus: 'sede-norte', title: 'AUXILIAR DE FARMACIA Y PARAFARMACIA + DERMO', codePrefix: 'N-', shift: 'afternoon', start: '2026-10-26', end: '2027-08-30', day: 'monday', startTime: '16:00', endTime: '20:00', classroom: 'Aula 5', teachers: ['Jessica Hernandez Nielsen'] },
  { campus: 'sede-norte', title: 'AUXILIAR DE ENFERMERÍA', codePrefix: 'N-', shift: 'afternoon', start: '2026-10-27', end: '2027-08-01', day: 'tuesday', startTime: '17:00', endTime: '20:00', classroom: 'Aula 5', teachers: ['Carlos Viñoly'] },
]

function parseArgs() {
  return {
    apply: process.argv.includes('--apply'),
    tenantId: Number(process.argv.find((arg) => arg.startsWith('--tenant-id='))?.split('=')[1] ?? 1),
  }
}

function dateOnly(value: any): string {
  return typeof value === 'string' ? value.slice(0, 10) : ''
}

function toTime(value?: string): string | undefined {
  if (!value) return undefined
  return value.length === 5 ? `${value}:00` : value
}

function includesTitle(candidate: string, expected: string): boolean {
  const a = normalizeText(candidate)
  const b = normalizeText(expected)
  return a.includes(b) || b.includes(a)
}

async function fetchAll(payload: any, collection: string, tenantId: number) {
  const docs: any[] = []
  let page = 1
  while (true) {
    const result = await payload.find({
      collection,
      where: { tenant: { equals: tenantId } },
      limit: 100,
      page,
      depth: 1,
      overrideAccess: true,
    })
    docs.push(...result.docs)
    if (!result.totalPages || page >= result.totalPages) break
    page += 1
  }
  return docs
}

async function main() {
  const { apply, tenantId } = parseArgs()
  const payload = await getPayload({ config })
  const [runs, courses, staff, campuses, classrooms] = await Promise.all([
    fetchAll(payload, 'course-runs', tenantId),
    fetchAll(payload, 'courses', tenantId),
    fetchAll(payload, 'staff', tenantId),
    fetchAll(payload, 'campuses', tenantId),
    fetchAll(payload, 'classrooms', tenantId),
  ])

  const report = []

  for (const expected of EXPECTED_RUNS) {
    const campus = campuses.find((item) => normalizeText(item.slug || item.name || '') === normalizeText(expected.campus))
    const course = courses.find((item) => includesTitle(String(item.title || item.name || ''), expected.title))
    const classroom = classrooms.find((item) => {
      const campusId = item.campus?.id ?? item.campus
      return campus && String(campusId) === String(campus.id) && normalizeText(item.name || '') === normalizeText(expected.classroom || '')
    })
    const activeTeachers = expected.teachers.map((raw) => {
      const canonical = teacherNames(raw)[0] || raw
      const match = staff.find((person) => {
        const full = String(person.full_name || `${person.first_name || ''} ${person.last_name || ''}`.trim())
        return normalizeText(full) === normalizeText(canonical)
      })
      const status = String(match?.employment_status || match?.status || '').toLowerCase()
      return { raw, canonical, id: match?.id ?? null, active: Boolean(match && (!status || status === 'active' || status === 'activo')) }
    })
    const existing = runs.find((run) => {
      const runCourse = typeof run.course === 'object' ? run.course : null
      const runCampus = typeof run.campus === 'object' ? run.campus : null
      const title = String(runCourse?.title || runCourse?.name || run.name || '')
      return includesTitle(title, expected.title) &&
        (!expected.start || dateOnly(run.start_date) === expected.start) &&
        (!campus || String(runCampus?.id || run.campus) === String(campus.id))
    })

    const issues = [
      !course ? 'course_not_found' : '',
      !campus ? 'campus_not_found' : '',
      expected.classroom && !classroom ? 'classroom_not_found' : '',
      !expected.start || !expected.end || !expected.day || !expected.startTime || !expected.endTime ? 'required_planning_data_missing' : '',
      expected.start && expected.end && expected.end < expected.start ? 'invalid_date_range' : '',
      ...activeTeachers.filter((teacher) => !teacher.active).map((teacher) => `teacher_not_active_or_missing:${teacher.raw}`),
    ].filter(Boolean)

    report.push({
      title: expected.title,
      campus: expected.campus,
      start: expected.start || null,
      existing: existing?.id ?? null,
      course: course?.id ?? null,
      classroom: classroom?.id ?? null,
      teachers: activeTeachers,
      issues,
      action: existing ? 'keep_existing' : issues.length ? 'manual_review' : apply ? 'create' : 'would_create',
    })

    if (apply && !existing && issues.length === 0) {
      await payload.create({
        collection: 'course-runs',
        overrideAccess: true,
        data: {
          tenant: tenantId,
          course: course.id,
          campus: campus.id,
          classroom: classroom?.id,
          start_date: expected.start,
          end_date: expected.end || expected.start,
          schedule_days: expected.day ? [expected.day] : [],
          schedule_time_start: toTime(expected.startTime),
          schedule_time_end: toTime(expected.endTime),
          shift: expected.shift,
          max_students: expected.capacity || classroom?.capacity || 18,
          status: 'published',
          enrollment_status: 'open',
          planning_status: 'pending_validation',
          notes: expected.notes || 'Convocatoria creada desde auditoría privada CEP 2026.',
          instructors: activeTeachers.map((teacher) => teacher.id).filter(Boolean),
        },
      })
    }
  }

  console.log(JSON.stringify({
    apply,
    tenantId,
    totals: {
      expected: EXPECTED_RUNS.length,
      existing: report.filter((item) => item.existing).length,
      missingReady: report.filter((item) => !item.existing && item.issues.length === 0).length,
      manualReview: report.filter((item) => !item.existing && item.issues.length > 0).length,
    },
    report,
  }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
