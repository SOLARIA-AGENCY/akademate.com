import { describe, expect, it } from 'vitest'
import {
  COMPLIANCE_CONTRACT_VERSION,
  ES_CANARIAS_SCE_PACK,
  assertKnownCode,
  attendedHours,
  canApplyDropout,
  consecutiveUnjustifiedAbsences,
  crossedMilestones,
  dedupeEvents,
  evaluateAttendance,
  hourProgressPercent,
  learnerCanSeeRoster,
  normalizeSelectionStage,
  resolvePolicy,
  staffCanSeeRoster,
} from '../src/compliance-ops.js'
import { OFFICIAL_PROFESSIONAL_FAMILIES } from '../src/official-families.js'

const policy = ES_CANARIAS_SCE_PACK.payload

describe('compliance ops contract', () => {
  it('keeps a stable contract version for cross-repo drift checks', () => {
    expect(COMPLIANCE_CONTRACT_VERSION).toBe('akademate.compliance.v1')
    expect(ES_CANARIAS_SCE_PACK.id).toBe('es-canarias-sce')
    expect(ES_CANARIAS_SCE_PACK.payload.attendanceCodes.map((code) => code.code)).toEqual(['A', 'F', 'FJ'])
  })

  it('resolves core < pack < tenant overlay', () => {
    const resolved = resolvePolicy({
      pack: ES_CANARIAS_SCE_PACK,
      override: { consecutiveAbsenceAlert: 4 },
    })
    expect(resolved.attendanceCodes).toHaveLength(3)
    expect(resolved.consecutiveAbsenceAlert).toBe(4)
    expect(resolved.unjustifiedDropoutLimit).toBe(3)
  })

  it('rejects unknown attendance codes', () => {
    expect(() => assertKnownCode(policy, 'X')).toThrow('unknown_attendance_code:X')
  })

  it('counts only present codes toward hours and emits 25 and 75 milestones once', () => {
    const plannedHours = 40
    const day1 = evaluateAttendance({
      policy,
      enrollmentId: 'e1',
      plannedHours,
      previousMarks: [],
      nextMark: { enrollmentId: 'e1', date: '2026-01-01', code: 'A', scheduledHours: 10 },
    })
    expect(hourProgressPercent(attendedHours(policy, day1.marks), plannedHours)).toBe(25)
    expect(day1.events.map((event) => event.value)).toEqual([25])

    const day2 = evaluateAttendance({
      policy,
      enrollmentId: 'e1',
      plannedHours,
      previousMarks: day1.marks,
      nextMark: { enrollmentId: 'e1', date: '2026-01-02', code: 'A', scheduledHours: 20 },
    })
    expect(crossedMilestones(policy, 25, 75)).toEqual([75])
    expect(day2.events.some((event) => event.type === 'milestone_reached' && event.value === 75)).toBe(true)

    const replay = evaluateAttendance({
      policy,
      enrollmentId: 'e1',
      plannedHours,
      previousMarks: day2.marks,
      nextMark: { enrollmentId: 'e1', date: '2026-01-02', code: 'A', scheduledHours: 20 },
    })
    expect(dedupeEvents(day2.events, replay.events)).toEqual([])
  })

  it('alerts on two consecutive unjustified absences and eligibility at three', () => {
    const first = evaluateAttendance({
      policy,
      enrollmentId: 'e2',
      plannedHours: 100,
      previousMarks: [],
      nextMark: { enrollmentId: 'e2', date: '2026-02-01', code: 'F', scheduledHours: 5 },
    })
    const second = evaluateAttendance({
      policy,
      enrollmentId: 'e2',
      plannedHours: 100,
      previousMarks: first.marks,
      nextMark: { enrollmentId: 'e2', date: '2026-02-02', code: 'F', scheduledHours: 5 },
    })
    expect(consecutiveUnjustifiedAbsences(policy, second.marks)).toBe(2)
    expect(second.events.some((event) => event.type === 'consecutive_absences')).toBe(true)

    const third = evaluateAttendance({
      policy,
      enrollmentId: 'e2',
      plannedHours: 100,
      previousMarks: second.marks,
      nextMark: { enrollmentId: 'e2', date: '2026-02-03', code: 'F', scheduledHours: 5 },
    })
    expect(third.events.some((event) => event.type === 'dropout_eligible' && event.value === 3)).toBe(true)
  })

  it('does not treat justified absences as a consecutive-absence streak', () => {
    const result = evaluateAttendance({
      policy,
      enrollmentId: 'e3',
      plannedHours: 20,
      previousMarks: [
        { enrollmentId: 'e3', date: '2026-03-01', code: 'F', scheduledHours: 4 },
        { enrollmentId: 'e3', date: '2026-03-02', code: 'FJ', scheduledHours: 4 },
      ],
      nextMark: { enrollmentId: 'e3', date: '2026-03-03', code: 'F', scheduledHours: 4 },
    })
    expect(consecutiveUnjustifiedAbsences(policy, result.marks)).toBe(1)
    expect(result.events.some((event) => event.type === 'consecutive_absences')).toBe(false)
  })

  it('requires dropout-eligible evidence for the attendance withdrawal reason', () => {
    const reason = policy.dropoutReasons.find((item) => item.code === 'before_75_attendance_unbillable')
    expect(reason).toBeTruthy()
    expect(canApplyDropout({ reason: reason!, events: [] })).toBe(false)
    expect(
      canApplyDropout({
        reason: reason!,
        events: [{ type: 'dropout_eligible', enrollmentId: 'e2', value: 3, atDate: '2026-02-03' }],
      }),
    ).toBe(true)
  })

  it('normalizes free-text selection status into a closed stage set', () => {
    expect(normalizeSelectionStage('ALTA + BIENVENIDA')).toBe('enrolled')
    expect(normalizeSelectionStage('plaza reservada')).toBe('reserved')
    expect(normalizeSelectionStage('lista de espera')).toBe('waitlist')
    expect(normalizeSelectionStage('BAJA X RENUNCIA')).toBe('withdrawn')
    expect(normalizeSelectionStage('pendiente pruebas')).toBe('assessment')
  })

  it('hides the roster from learner roles', () => {
    expect(staffCanSeeRoster('gestor')).toBe(true)
    expect(learnerCanSeeRoster('alumno')).toBe(true)
    expect(staffCanSeeRoster('alumno')).toBe(false)
  })

  it('ships the 26 official professional families as a generic catalog', () => {
    expect(OFFICIAL_PROFESSIONAL_FAMILIES).toHaveLength(26)
    expect(OFFICIAL_PROFESSIONAL_FAMILIES.map((family) => family.code)).toContain('IFC')
    expect(new Set(OFFICIAL_PROFESSIONAL_FAMILIES.map((family) => family.code)).size).toBe(26)
  })
})
