import { minutesBetween, minutesToHours, toDayKey } from './time'
import {
  assertNever,
  occupiesResource,
  type AcademicSession,
  type CourseHoursBudget,
  type CourseHoursSummary,
  type SessionType,
} from './types'

export function sessionPlannedMinutes(session: AcademicSession): number {
  if (typeof session.plannedMinutes === 'number' && session.plannedMinutes > 0) {
    return session.plannedMinutes
  }
  return minutesBetween(session.plannedStart, session.plannedEnd) ?? 0
}

export function sessionDeliveredMinutes(session: AcademicSession): number {
  if (session.status !== 'completed') return 0
  if (typeof session.actualMinutes === 'number' && session.actualMinutes > 0) {
    return session.actualMinutes
  }
  const actual = minutesBetween(session.actualStart, session.actualEnd)
  if (actual != null) return actual
  return sessionPlannedMinutes(session)
}

function hourBucket(sessionType: SessionType | null | undefined): keyof Pick<
  CourseHoursSummary,
  'theoryHours' | 'practiceHours' | 'externalPracticeHours' | 'otherHours'
> {
  switch (sessionType ?? 'OTHER') {
    case 'THEORY':
    case 'ONLINE':
      return 'theoryHours'
    case 'PRACTICE':
    case 'THEORY_PRACTICE':
    case 'WORKSHOP':
      return 'practiceHours'
    case 'EXTERNAL_PRACTICE':
    case 'OUTDOOR_PRACTICE':
      return 'externalPracticeHours'
    case 'OTHER':
      return 'otherHours'
    default:
      return assertNever(sessionType as never, 'session type')
  }
}

export function resolvePlannedHours(budget: CourseHoursBudget): number {
  if (typeof budget.plannedHours === 'number' && budget.plannedHours > 0) return budget.plannedHours
  return [
    budget.theoryHours,
    budget.practiceHoursInternal,
    budget.externalPracticeHours,
    budget.otherHours,
  ].reduce<number>((sum, value) => sum + (typeof value === 'number' && value > 0 ? value : 0), 0)
}

export function summarizeCourseHours(
  sessions: AcademicSession[],
  budget: CourseHoursBudget = {},
  plannedEndDate?: string | null,
): CourseHoursSummary {
  const summary: CourseHoursSummary = {
    plannedHours: resolvePlannedHours(budget),
    scheduledHours: 0,
    completedHours: 0,
    cancelledHours: 0,
    remainingHours: 0,
    theoryHours: 0,
    practiceHours: 0,
    externalPracticeHours: 0,
    otherHours: 0,
    calculatedEndDate: null,
    endDateWarning: false,
  }

  let lastDate: string | null = null

  for (const session of sessions) {
    const minutes = sessionPlannedMinutes(session)
    const hours = minutesToHours(minutes)
    if (session.status === 'cancelled') {
      summary.cancelledHours += hours
      continue
    }
    if (!occupiesResource(session.status) && session.status !== 'completed') continue

    summary.scheduledHours += hours
    summary[hourBucket(session.sessionType)] += hours
    if (session.status === 'completed') {
      summary.completedHours += minutesToHours(sessionDeliveredMinutes(session))
    }

    const day = toDayKey(session.date)
    if (day && (!lastDate || day > lastDate)) lastDate = day
  }

  summary.scheduledHours = roundHours(summary.scheduledHours)
  summary.completedHours = roundHours(summary.completedHours)
  summary.cancelledHours = roundHours(summary.cancelledHours)
  summary.theoryHours = roundHours(summary.theoryHours)
  summary.practiceHours = roundHours(summary.practiceHours)
  summary.externalPracticeHours = roundHours(summary.externalPracticeHours)
  summary.otherHours = roundHours(summary.otherHours)
  summary.remainingHours = roundHours(Math.max(0, summary.plannedHours - summary.scheduledHours))
  summary.calculatedEndDate = lastDate
  const plannedEnd = plannedEndDate ? toDayKey(plannedEndDate) : null
  summary.endDateWarning = Boolean(plannedEnd && lastDate && plannedEnd !== lastDate)
  return summary
}

export function hoursMismatchWarning(summary: CourseHoursSummary): boolean {
  return summary.plannedHours > 0 && summary.scheduledHours !== summary.plannedHours
}

function roundHours(value: number): number {
  return Math.round(value * 100) / 100
}
