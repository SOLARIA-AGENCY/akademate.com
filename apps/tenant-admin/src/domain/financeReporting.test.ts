import { describe, expect, it } from 'vitest'
import { aggregateFinanceEntries } from './financeReporting'

describe('finance reporting', () => {
  it('separates totals by legal entity, site and activity', () => {
    const rows = aggregateFinanceEntries([
      { type: 'income', amount: 1000, legal_entity: { id: 1, name: 'ACATEM' }, campus: { id: 2, name: 'CEP Norte' }, course_run: { id: 3, codigo: 'NOR-001' } },
      { type: 'payroll', amount: 250, legal_entity: { id: 1, name: 'ACATEM' }, campus: { id: 2, name: 'CEP Norte' }, course_run: { id: 3, codigo: 'NOR-001' } },
      { type: 'subsidy', amount: 700, legal_entity: { id: 4, name: 'APROEM' }, campus: { id: 5, name: 'CEP Santa Cruz' }, course_run: { id: 6, codigo: 'SC-001' } },
    ])
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ legalEntity: 'ACATEM', income: 1000, expense: 250, net: 750, entries: 2 })
    expect(rows[1]).toMatchObject({ legalEntity: 'APROEM', income: 700, expense: 0, net: 700, entries: 1 })
  })

  it('keeps unassigned analytic dimensions explicit', () => {
    expect(aggregateFinanceEntries([{ type: 'expense', amount: 10, legal_entity: 1 }])[0])
      .toMatchObject({ legalEntity: 'Entidad 1', campus: 'Sin asignar', activity: 'Sin asignar', net: -10 })
  })

  it('ignores non-finite amounts instead of corrupting totals', () => {
    expect(aggregateFinanceEntries([{ type: 'income', amount: Number.NaN, legal_entity: 1 }])).toEqual([])
  })
})
