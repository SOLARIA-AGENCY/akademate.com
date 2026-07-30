type Relation = string | number | { id: string | number; name?: string; codigo?: string } | null | undefined

export type FinanceEntryForReport = {
  type?: string | null
  amount?: number | null
  currency?: string | null
  legal_entity?: Relation
  campus?: Relation
  course_run?: Relation
}

export type FinanceReportRow = {
  key: string
  legalEntity: string
  campus: string
  activity: string
  currency: string
  income: number
  expense: number
  net: number
  entries: number
}

function relationLabel(value: Relation, fallback: string): string {
  if (value && typeof value === 'object') return value.name ?? value.codigo ?? `${fallback} ${value.id}`
  return value === null || value === undefined ? 'Sin asignar' : `${fallback} ${value}`
}

export function aggregateFinanceEntries(entries: FinanceEntryForReport[]): FinanceReportRow[] {
  const rows = new Map<string, FinanceReportRow>()
  for (const entry of entries) {
    const amount = Number(entry.amount ?? 0)
    if (!Number.isFinite(amount)) continue
    const legalEntity = relationLabel(entry.legal_entity, 'Entidad')
    const campus = relationLabel(entry.campus, 'Sede')
    const activity = relationLabel(entry.course_run, 'Actividad')
    const currency = entry.currency || 'EUR'
    const key = `${legalEntity}\u0000${campus}\u0000${activity}\u0000${currency}`
    const row = rows.get(key) ?? { key, legalEntity, campus, activity, currency, income: 0, expense: 0, net: 0, entries: 0 }
    if (entry.type === 'income' || entry.type === 'subsidy') row.income += amount
    else row.expense += amount
    row.net = row.income - row.expense
    row.entries += 1
    rows.set(key, row)
  }
  return [...rows.values()].sort((a, b) =>
    a.legalEntity.localeCompare(b.legalEntity) || a.campus.localeCompare(b.campus) || a.activity.localeCompare(b.activity))
}
