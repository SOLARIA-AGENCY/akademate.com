import { existsSync, readFileSync, writeFileSync } from 'node:fs'

export type AccessKind = 'fisico' | 'virtual' | 'hibrido'
export type AccessPass = 'credential' | 'temporary' | 'visitor' | 'magic_link'
export type AccessDirection = 'in' | 'out'
export type AccessChannel = 'email' | 'sms' | 'qr' | 'webcam' | 'manual'

export interface AccessEvent {
  id: string
  tenantId: number
  personName: string
  personId: string | null
  enrollmentId: string | null
  courseRunId: string | null
  campusName: string
  kind: AccessKind
  pass: AccessPass
  channel: AccessChannel
  direction: AccessDirection
  at: string
  note: string
}

export type AccessEventInput = Omit<AccessEvent, 'id' | 'at'> & {
  id?: string
  at?: string
}

const STORE_PATH = '/tmp/akademate-accesos.json'

let memory: AccessEvent[] | null = null

function isAccessKind(value: unknown): value is AccessKind {
  return value === 'fisico' || value === 'virtual' || value === 'hibrido'
}

function isAccessPass(value: unknown): value is AccessPass {
  return value === 'credential' || value === 'temporary' || value === 'visitor' || value === 'magic_link'
}

function isAccessChannel(value: unknown): value is AccessChannel {
  return value === 'email' || value === 'sms' || value === 'qr' || value === 'webcam' || value === 'manual'
}

function isAccessDirection(value: unknown): value is AccessDirection {
  return value === 'in' || value === 'out'
}

function loadMemory(): AccessEvent[] {
  if (memory) return memory
  try {
    if (existsSync(STORE_PATH)) {
      const parsed = JSON.parse(readFileSync(STORE_PATH, 'utf8')) as unknown
      memory = Array.isArray(parsed) ? parsed.filter(isAccessEvent) : []
      return memory
    }
  } catch {
    memory = []
    return memory
  }
  memory = []
  return memory
}

function persist(events: AccessEvent[]): void {
  memory = events
  try {
    writeFileSync(STORE_PATH, JSON.stringify(events))
  } catch {
    // Memory remains the source of truth if the temp file is unavailable.
  }
}

function isAccessEvent(value: unknown): value is AccessEvent {
  if (!value || typeof value !== 'object') return false
  const row = value as Record<string, unknown>
  return (
    typeof row.id === 'string' &&
    typeof row.tenantId === 'number' &&
    typeof row.personName === 'string' &&
    (typeof row.personId === 'string' || row.personId === null) &&
    (typeof row.enrollmentId === 'string' || row.enrollmentId === null) &&
    (typeof row.courseRunId === 'string' || row.courseRunId === null) &&
    typeof row.campusName === 'string' &&
    isAccessKind(row.kind) &&
    isAccessPass(row.pass) &&
    isAccessChannel(row.channel) &&
    isAccessDirection(row.direction) &&
    typeof row.at === 'string' &&
    typeof row.note === 'string'
  )
}

export function listEvents(
  tenantId: number,
  filters?: { kind?: AccessKind; q?: string },
): AccessEvent[] {
  const needle = filters?.q?.trim().toLowerCase() ?? ''
  return loadMemory()
    .filter((event) => event.tenantId === tenantId)
    .filter((event) => (filters?.kind ? event.kind === filters.kind : true))
    .filter((event) => {
      if (!needle) return true
      return [event.personName, event.campusName, event.note, event.pass, event.kind]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
}

export function addEvent(input: AccessEventInput): AccessEvent {
  const event: AccessEvent = {
    id: input.id ?? `acc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    tenantId: input.tenantId,
    personName: input.personName,
    personId: input.personId,
    enrollmentId: input.enrollmentId,
    courseRunId: input.courseRunId,
    campusName: input.campusName,
    kind: input.kind,
    pass: input.pass,
    channel: input.channel,
    direction: input.direction,
    at: input.at ?? new Date().toISOString(),
    note: input.note,
  }
  persist([event, ...loadMemory()])
  return event
}

export function resetStore(): void {
  persist([])
}

export function parseAccessKind(value: unknown): AccessKind | null {
  return isAccessKind(value) ? value : null
}

export function parseAccessPass(value: unknown): AccessPass | null {
  return isAccessPass(value) ? value : null
}

export function parseAccessChannel(value: unknown): AccessChannel {
  return isAccessChannel(value) ? value : 'manual'
}

export function parseAccessDirection(value: unknown): AccessDirection {
  return isAccessDirection(value) ? value : 'in'
}
