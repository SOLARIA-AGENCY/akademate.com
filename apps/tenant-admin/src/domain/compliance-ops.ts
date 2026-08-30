export const COMPLIANCE_CONTRACT_VERSION = 'akademate.compliance.v1'

export const ATTENDANCE_CODE_FLAGS = ['counts_as_absence', 'justified'] as const

export type AttendanceCode = {
  code: string
  label: string
  countsAsAbsence: boolean
  justified: boolean
  order: number
}

export type HourMilestone = {
  percent: number
  eventType: 'milestone_reached'
}

export type DropoutReason = {
  code: string
  label: string
  threshold: 'before_25' | 'at_25' | 'before_75' | 'at_75' | 'none'
  billable: boolean
  requiresJobContract: boolean
}

export type SelectionStage =
  | 'prospect'
  | 'assessment'
  | 'reserved'
  | 'enrolled'
  | 'waitlist'
  | 'withdrawn'

export type CaptureChannel = 'leads' | 'web' | 'survey' | 'onsite' | 'referral' | 'other'

export type RegionPackIdentity = {
  id: string
  country: string
  region: string
  program: string
  locale: string
  currency: string
}

export type RegionPackPayload = {
  attendanceCodes: AttendanceCode[]
  hourMilestones: HourMilestone[]
  consecutiveAbsenceAlert: number
  unjustifiedDropoutLimit: number
  dropoutReasons: DropoutReason[]
  requiredSelectionFields: string[]
  documentTypes: string[]
}

export type RegionPack = RegionPackIdentity & {
  payload: RegionPackPayload
}

export type PolicyOverride = Partial<RegionPackPayload>

export type PolicyScope = 'tenant' | 'campus' | 'course_run'

export type PolicyBinding = {
  packId: string
  scope: PolicyScope
  scopeId: string | number
}

export type AttendanceMark = {
  enrollmentId: string
  date: string
  code: string
  scheduledHours: number
}

export type AttendanceEvent = {
  type: 'milestone_reached' | 'consecutive_absences' | 'dropout_eligible'
  enrollmentId: string
  value: number
  atDate: string
}

export type CourseAuditRow = {
  campusId: string
  year: number
  marketLine: string
  groupCode: string
  title: string
  hours: number
  startMale: number
  startFemale: number
  endMale: number
  endFemale: number
  disabilityCount: number
  passed: number
  certified: number
  absenceHours: number
  dropoutsAttendance: number
  dropoutsContract: number
}

export type LoyaltyRow = {
  personKey: string
  year: number
  campusId: string
  coursesThisYear: number
  coursesLifetime: number
}

export const EMPTY_REGION_PACK: RegionPack = {
  id: 'global-empty',
  country: 'XX',
  region: 'worldwide',
  program: 'none',
  locale: 'en',
  currency: 'USD',
  payload: {
    attendanceCodes: [],
    hourMilestones: [],
    consecutiveAbsenceAlert: 0,
    unjustifiedDropoutLimit: 0,
    dropoutReasons: [],
    requiredSelectionFields: [],
    documentTypes: [],
  },
}

export const ES_CANARIAS_SCE_PACK: RegionPack = {
  id: 'es-canarias-sce',
  country: 'ES',
  region: 'canarias',
  program: 'sce',
  locale: 'es-ES',
  currency: 'EUR',
  payload: {
    attendanceCodes: [
      { code: 'A', label: 'Asistencia', countsAsAbsence: false, justified: false, order: 1 },
      { code: 'F', label: 'Falta', countsAsAbsence: true, justified: false, order: 2 },
      { code: 'FJ', label: 'Falta justificada', countsAsAbsence: true, justified: true, order: 3 },
    ],
    hourMilestones: [
      { percent: 25, eventType: 'milestone_reached' },
      { percent: 75, eventType: 'milestone_reached' },
    ],
    consecutiveAbsenceAlert: 2,
    unjustifiedDropoutLimit: 3,
    dropoutReasons: [
      { code: 'before_75', label: 'Withdrawal before 75%', threshold: 'before_75', billable: false, requiresJobContract: false },
      { code: 'at_75_billable', label: 'Withdrawal at 75% (billable)', threshold: 'at_75', billable: true, requiresJobContract: false },
      { code: 'at_25_job_billable', label: 'Withdrawal at 25% with job contract (billable)', threshold: 'at_25', billable: true, requiresJobContract: true },
      { code: 'before_75_attendance_unbillable', label: 'Withdrawal before 75% for attendance or other causes (not billable)', threshold: 'before_75', billable: false, requiresJobContract: false },
    ],
    requiredSelectionFields: ['fullName', 'nationalId', 'email', 'phone', 'motivationTest', 'theoryTest'],
    documentTypes: ['dni', 'nie', 'passport'],
  },
}

export const REGION_PACK_CATALOG: RegionPack[] = [EMPTY_REGION_PACK, ES_CANARIAS_SCE_PACK]

export function findRegionPack(id: string): RegionPack | null {
  return REGION_PACK_CATALOG.find((pack) => pack.id === id) ?? null
}

export function mergePolicy(base: RegionPackPayload, override?: PolicyOverride | null): RegionPackPayload {
  if (!override) return structuredClone(base)
  return {
    attendanceCodes: override.attendanceCodes ?? base.attendanceCodes,
    hourMilestones: override.hourMilestones ?? base.hourMilestones,
    consecutiveAbsenceAlert: override.consecutiveAbsenceAlert ?? base.consecutiveAbsenceAlert,
    unjustifiedDropoutLimit: override.unjustifiedDropoutLimit ?? base.unjustifiedDropoutLimit,
    dropoutReasons: override.dropoutReasons ?? base.dropoutReasons,
    requiredSelectionFields: override.requiredSelectionFields ?? base.requiredSelectionFields,
    documentTypes: override.documentTypes ?? base.documentTypes,
  }
}

export function resolvePolicy(input: {
  core?: RegionPackPayload
  pack?: RegionPack | null
  override?: PolicyOverride | null
}): RegionPackPayload {
  const core = input.core ?? EMPTY_REGION_PACK.payload
  const fromPack = mergePolicy(core, input.pack?.payload)
  return mergePolicy(fromPack, input.override)
}

export function codeByValue(policy: RegionPackPayload, code: string): AttendanceCode | null {
  return policy.attendanceCodes.find((item) => item.code === code) ?? null
}

export function assertKnownCode(policy: RegionPackPayload, code: string): AttendanceCode {
  const found = codeByValue(policy, code)
  if (!found) throw new Error(`unknown_attendance_code:${code}`)
  return found
}

export function attendedHours(policy: RegionPackPayload, marks: AttendanceMark[]): number {
  return marks.reduce((sum, mark) => {
    const code = codeByValue(policy, mark.code)
    if (!code || code.countsAsAbsence) return sum
    return sum + Math.max(0, mark.scheduledHours)
  }, 0)
}

export function hourProgressPercent(attended: number, plannedHours: number): number {
  if (plannedHours <= 0) return 0
  return Math.min(100, Math.round((attended / plannedHours) * 1000) / 10)
}

export function crossedMilestones(policy: RegionPackPayload, previousPercent: number, nextPercent: number): number[] {
  return policy.hourMilestones
    .map((milestone) => milestone.percent)
    .filter((percent) => previousPercent < percent && nextPercent >= percent)
}

export function consecutiveUnjustifiedAbsences(policy: RegionPackPayload, marks: AttendanceMark[]): number {
  const ordered = [...marks].sort((a, b) => a.date.localeCompare(b.date))
  let streak = 0
  let best = 0
  for (const mark of ordered) {
    const code = codeByValue(policy, mark.code)
    if (code?.countsAsAbsence && !code.justified) {
      streak += 1
      best = Math.max(best, streak)
    } else {
      streak = 0
    }
  }
  return best
}

export function unjustifiedAbsenceCount(policy: RegionPackPayload, marks: AttendanceMark[]): number {
  return marks.filter((mark) => {
    const code = codeByValue(policy, mark.code)
    return Boolean(code?.countsAsAbsence && !code.justified)
  }).length
}

export function evaluateAttendance(input: {
  policy: RegionPackPayload
  enrollmentId: string
  plannedHours: number
  previousMarks: AttendanceMark[]
  nextMark: AttendanceMark
}): { marks: AttendanceMark[]; events: AttendanceEvent[] } {
  assertKnownCode(input.policy, input.nextMark.code)
  const withoutSameDay = input.previousMarks.filter((mark) => mark.date !== input.nextMark.date)
  const marks = [...withoutSameDay, input.nextMark].sort((a, b) => a.date.localeCompare(b.date))

  const previousPercent = hourProgressPercent(attendedHours(input.policy, withoutSameDay), input.plannedHours)
  const nextPercent = hourProgressPercent(attendedHours(input.policy, marks), input.plannedHours)
  const events: AttendanceEvent[] = []

  for (const percent of crossedMilestones(input.policy, previousPercent, nextPercent)) {
    events.push({
      type: 'milestone_reached',
      enrollmentId: input.enrollmentId,
      value: percent,
      atDate: input.nextMark.date,
    })
  }

  const streak = consecutiveUnjustifiedAbsences(input.policy, marks)
  if (input.policy.consecutiveAbsenceAlert > 0 && streak >= input.policy.consecutiveAbsenceAlert) {
    events.push({
      type: 'consecutive_absences',
      enrollmentId: input.enrollmentId,
      value: streak,
      atDate: input.nextMark.date,
    })
  }

  const unjustified = unjustifiedAbsenceCount(input.policy, marks)
  if (input.policy.unjustifiedDropoutLimit > 0 && unjustified >= input.policy.unjustifiedDropoutLimit) {
    events.push({
      type: 'dropout_eligible',
      enrollmentId: input.enrollmentId,
      value: unjustified,
      atDate: input.nextMark.date,
    })
  }

  return { marks, events }
}

export function dedupeEvents(existing: AttendanceEvent[], incoming: AttendanceEvent[]): AttendanceEvent[] {
  const seen = new Set(existing.map((event) => `${event.type}:${event.enrollmentId}:${event.value}`))
  return incoming.filter((event) => {
    const key = `${event.type}:${event.enrollmentId}:${event.value}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function canApplyDropout(input: {
  reason: DropoutReason
  events: AttendanceEvent[]
}): boolean {
  if (input.reason.code.includes('attendance') || input.reason.threshold === 'before_75') {
    if (input.reason.code === 'before_75_attendance_unbillable') {
      return input.events.some((event) => event.type === 'dropout_eligible')
    }
  }
  return true
}

export const SELECTION_STAGES: SelectionStage[] = [
  'prospect',
  'assessment',
  'reserved',
  'enrolled',
  'waitlist',
  'withdrawn',
]

export function normalizeSelectionStage(raw: string): SelectionStage {
  const value = raw.trim().toLowerCase()
  if (value.includes('espera') || value.includes('wait')) return 'waitlist'
  if (value.includes('reserva')) return 'reserved'
  if (value.includes('baja') || value.includes('renuncia') || value.includes('withdraw')) return 'withdrawn'
  if (value.includes('alta') || value.includes('enroll') || value.includes('matric')) return 'enrolled'
  if (value.includes('prueba') || value.includes('assess') || value.includes('mot')) return 'assessment'
  return 'prospect'
}

export function passRate(passed: number, started: number): number {
  if (started <= 0) return 0
  return Math.round((passed / started) * 1000) / 10
}

export function absenceRate(absenceHours: number, plannedHours: number, students: number): number {
  const denom = plannedHours * students
  if (denom <= 0) return 0
  return Math.round((absenceHours / denom) * 10000) / 100
}

export function buildCourseAuditRow(row: CourseAuditRow): CourseAuditRow & { passPercent: number; absencePercent: number } {
  const started = row.startMale + row.startFemale
  return {
    ...row,
    passPercent: passRate(row.passed, started),
    absencePercent: absenceRate(row.absenceHours, row.hours, started),
  }
}

export function staffCanSeeRoster(role: string | null | undefined): boolean {
  return ['admin', 'gestor', 'superadmin', 'asesor'].includes(role ?? '')
}

export function learnerCanSeeRoster(role: string | null | undefined): boolean {
  return role === 'alumno' || role === 'student' || role === 'learner'
}
