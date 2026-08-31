import { existsSync, readFileSync, writeFileSync } from 'node:fs'

export type AccessKind = 'fisico' | 'virtual' | 'hibrido'
export type TariffPeriod = 'unico' | 'mensual' | 'curso'

export interface AccessTariff {
  id: string
  tenantId: number
  name: string
  kind: AccessKind
  period: TariffPeriod
  price: number
  campusName: string
  active: boolean
  updatedAt: string
}

export type AccessTariffInput = Omit<AccessTariff, 'id' | 'updatedAt'> & {
  id?: string
  updatedAt?: string
}

const STORE_PATH = '/tmp/akademate-access-tariffs.json'

let memory: AccessTariff[] | null = null

function isAccessKind(value: unknown): value is AccessKind {
  return value === 'fisico' || value === 'virtual' || value === 'hibrido'
}

function isTariffPeriod(value: unknown): value is TariffPeriod {
  return value === 'unico' || value === 'mensual' || value === 'curso'
}

function isAccessTariff(value: unknown): value is AccessTariff {
  if (!value || typeof value !== 'object') return false
  const row = value as Record<string, unknown>
  return (
    typeof row.id === 'string' &&
    typeof row.tenantId === 'number' &&
    typeof row.name === 'string' &&
    isAccessKind(row.kind) &&
    isTariffPeriod(row.period) &&
    typeof row.price === 'number' &&
    typeof row.campusName === 'string' &&
    typeof row.active === 'boolean' &&
    typeof row.updatedAt === 'string'
  )
}

function loadMemory(): AccessTariff[] {
  if (memory) return memory
  try {
    if (existsSync(STORE_PATH)) {
      const parsed = JSON.parse(readFileSync(STORE_PATH, 'utf8')) as unknown
      memory = Array.isArray(parsed) ? parsed.filter(isAccessTariff) : []
      return memory
    }
  } catch {
    memory = []
    return memory
  }
  memory = []
  return memory
}

function persist(rows: AccessTariff[]): void {
  memory = rows
  try {
    writeFileSync(STORE_PATH, JSON.stringify(rows))
  } catch {
    // Memory remains the source of truth if the temp file is unavailable.
  }
}

export function parseAccessKind(value: unknown): AccessKind | null {
  return isAccessKind(value) ? value : null
}

export function parseTariffPeriod(value: unknown): TariffPeriod | null {
  return isTariffPeriod(value) ? value : null
}

export function listTariffs(
  tenantId: number,
  filters?: { kind?: AccessKind; q?: string },
): AccessTariff[] {
  const needle = filters?.q?.trim().toLowerCase() ?? ''
  return loadMemory()
    .filter((row) => row.tenantId === tenantId)
    .filter((row) => (filters?.kind ? row.kind === filters.kind : true))
    .filter((row) => {
      if (!needle) return true
      return [row.name, row.campusName, row.kind, row.period].join(' ').toLowerCase().includes(needle)
    })
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0))
}

export function upsertTariff(input: AccessTariffInput): AccessTariff {
  const rows = loadMemory()
  const tariff: AccessTariff = {
    id: input.id ?? `tar_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    tenantId: input.tenantId,
    name: input.name,
    kind: input.kind,
    period: input.period,
    price: input.price,
    campusName: input.campusName,
    active: input.active,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  }
  const index = rows.findIndex((row) => row.id === tariff.id && row.tenantId === tariff.tenantId)
  if (index >= 0) {
    rows[index] = tariff
  } else {
    rows.unshift(tariff)
  }
  persist(rows)
  return tariff
}

export function deleteTariff(tenantId: number, id: string): boolean {
  const rows = loadMemory()
  const next = rows.filter((row) => !(row.tenantId === tenantId && row.id === id))
  if (next.length === rows.length) return false
  persist(next)
  return true
}

export function resetTariffStore(): void {
  memory = []
  persist([])
}
