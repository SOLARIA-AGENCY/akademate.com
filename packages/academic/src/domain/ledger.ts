import { sessionDeliveredMinutes, sessionPlannedMinutes } from './hours'
import type { AcademicId, AcademicSession, LedgerApprovalStatus } from './types'

export type InstructorTeachingEntry = {
  instructorId: AcademicId
  sessionId?: AcademicId
  courseRunId: AcademicId
  plannedMinutes: number
  deliveredMinutes: number
  approvedMinutes: number
  rate?: number | null
  amount?: number | null
  approvalStatus: LedgerApprovalStatus
}

export type InstructorHoursSummary = {
  instructorId: AcademicId
  plannedMinutes: number
  deliveredMinutes: number
  cancelledMinutes: number
  pendingMinutes: number
  approvedMinutes: number
}

export function createLedgerEntries(session: AcademicSession): InstructorTeachingEntry[] {
  if (session.status !== 'completed') return []
  const planned = sessionPlannedMinutes(session)
  const delivered = sessionDeliveredMinutes(session)
  return (session.instructorIds ?? []).map((instructorId) => ({
    instructorId,
    sessionId: session.id,
    courseRunId: session.courseRunId,
    plannedMinutes: planned,
    deliveredMinutes: delivered,
    approvedMinutes: 0,
    rate: null,
    amount: null,
    approvalStatus: 'pending',
  }))
}

export function summarizeInstructorHours(
  instructorId: AcademicId,
  sessions: AcademicSession[],
  approvedMinutes = 0,
): InstructorHoursSummary {
  let plannedMinutes = 0
  let deliveredMinutes = 0
  let cancelledMinutes = 0

  for (const session of sessions) {
    if (!session.instructorIds?.some((id) => String(id) === String(instructorId))) continue
    const minutes = sessionPlannedMinutes(session)
    if (session.status === 'cancelled') {
      cancelledMinutes += minutes
      continue
    }
    if (session.status === 'draft' || session.status === 'rescheduled') continue
    plannedMinutes += minutes
    if (session.status === 'completed') deliveredMinutes += sessionDeliveredMinutes(session)
  }

  return {
    instructorId,
    plannedMinutes,
    deliveredMinutes,
    cancelledMinutes,
    pendingMinutes: Math.max(0, plannedMinutes - deliveredMinutes),
    approvedMinutes,
  }
}

export function payableAmount(approvedMinutes: number, ratePerHour?: number | null): number | null {
  if (ratePerHour == null || ratePerHour < 0 || approvedMinutes <= 0) return null
  return Math.round((approvedMinutes / 60) * ratePerHour * 100) / 100
}

export function canPayFromPlanOnly(): false {
  return false
}