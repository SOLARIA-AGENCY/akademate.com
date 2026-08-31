import { describe, expect, it } from 'vitest'
import {
  deleteTariff,
  listTariffs,
  resetTariffStore,
  upsertTariff,
} from './store'

describe('access tariff store', () => {
  it('creates, lists, updates and deletes by tenant', () => {
    resetTariffStore()
    const created = upsertTariff({
      tenantId: 7,
      name: 'Pase físico mañana',
      kind: 'fisico',
      period: 'mensual',
      price: 25,
      campusName: 'Madrid',
      active: true,
    })
    expect(listTariffs(7)).toHaveLength(1)
    expect(listTariffs(8)).toHaveLength(0)

    upsertTariff({
      ...created,
      price: 30,
    })
    expect(listTariffs(7)[0]?.price).toBe(30)
    expect(deleteTariff(7, created.id)).toBe(true)
    expect(listTariffs(7)).toHaveLength(0)
  })
})
