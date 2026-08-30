import { afterEach, describe, expect, it } from 'vitest'
import { addEvent, listEvents, resetStore } from '../../../../api/accesos/_lib/store'
import { clearEnrollmentDraft, loadEnrollmentDraft, saveEnrollmentDraft } from './draft'
import {
  accessKindFromModality,
  createEmptyDraft,
  DRAFT_STORAGE_KEY,
  payableAmount,
} from './types'

describe('accessKindFromModality', () => {
  it('maps online to virtual', () => {
    expect(accessKindFromModality('online')).toBe('virtual')
  })

  it('maps hibrido to hibrido', () => {
    expect(accessKindFromModality('hibrido')).toBe('hibrido')
  })

  it('maps presencial to fisico', () => {
    expect(accessKindFromModality('presencial')).toBe('fisico')
  })
})

describe('payableAmount', () => {
  it('subtracts discount from course price and enrollment fee', () => {
    const draft = createEmptyDraft()
    draft.discount = 25
    draft.course = {
      id: '1',
      name: 'Curso',
      campusId: '1',
      campusName: 'Sede',
      startDate: '2026-09-01',
      endDate: '2026-12-01',
      seatsUsed: 1,
      seatsMax: 10,
      price: 100,
      enrollmentFee: 20,
      modality: 'presencial',
      accessKind: 'fisico',
      status: 'enrollment_open',
    }
    expect(payableAmount(draft)).toBe(95)
  })
})

describe('enrollment draft localStorage', () => {
  afterEach(() => {
    clearEnrollmentDraft()
  })

  it('saves, loads and clears the draft', () => {
    const draft = createEmptyDraft()
    draft.person.firstName = 'Ana'
    draft.searchQuery = 'ana'
    saveEnrollmentDraft(draft)

    expect(window.localStorage.getItem(DRAFT_STORAGE_KEY)).toContain('Ana')
    expect(loadEnrollmentDraft().person.firstName).toBe('Ana')
    expect(loadEnrollmentDraft().searchQuery).toBe('ana')

    clearEnrollmentDraft()
    expect(window.localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull()
    expect(loadEnrollmentDraft().person.firstName).toBe('')
  })
})

describe('accesos store', () => {
  afterEach(() => {
    resetStore()
  })

  it('adds and lists events for a tenant', () => {
    resetStore()
    addEvent({
      tenantId: 7,
      personName: 'Ana Lopez',
      personId: '1',
      enrollmentId: null,
      courseRunId: '9',
      campusName: 'Santa Cruz',
      kind: 'fisico',
      pass: 'credential',
      channel: 'qr',
      direction: 'in',
      note: 'Entrada',
    })
    addEvent({
      tenantId: 8,
      personName: 'Otro tenant',
      personId: null,
      enrollmentId: null,
      courseRunId: null,
      campusName: 'La Laguna',
      kind: 'virtual',
      pass: 'magic_link',
      channel: 'email',
      direction: 'in',
      note: '',
    })

    const events = listEvents(7)
    expect(events).toHaveLength(1)
    expect(events[0]?.personName).toBe('Ana Lopez')
    expect(events[0]?.kind).toBe('fisico')
  })

  it('resetStore isolates later tests', () => {
    addEvent({
      tenantId: 1,
      personName: 'Residual',
      personId: null,
      enrollmentId: null,
      courseRunId: null,
      campusName: '',
      kind: 'fisico',
      pass: 'visitor',
      channel: 'manual',
      direction: 'out',
      note: '',
    })
    resetStore()
    expect(listEvents(1)).toEqual([])
  })
})
