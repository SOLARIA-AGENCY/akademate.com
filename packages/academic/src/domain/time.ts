const CLOCK_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function normalizeClock(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const raw = value.trim()
  const match = CLOCK_PATTERN.exec(raw)
  if (!match) return null
  return `${match[1]}:${match[2]}:${match[3] ?? '00'}`
}

export function clockToMinutes(value?: string | null): number | null {
  const normalized = normalizeClock(value)
  if (!normalized) return null
  const [hours, minutes, seconds] = normalized.split(':').map(Number)
  return hours * 60 + minutes + Math.floor((seconds ?? 0) / 60)
}

export function minutesBetween(start?: string | null, end?: string | null): number | null {
  const startMinutes = clockToMinutes(start)
  const endMinutes = clockToMinutes(end)
  if (startMinutes == null || endMinutes == null) return null
  const delta = endMinutes - startMinutes
  return delta > 0 ? delta : null
}

export function minutesToHours(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100
}

export function toDayKey(value: string | Date): string | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    return value.toISOString().slice(0, 10)
  }
  if (typeof value !== 'string' || !value.trim()) return null
  const raw = value.trim()
  if (DAY_PATTERN.test(raw)) return raw
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

export function compareDayKeys(a?: string | null, b?: string | null): number {
  const left = a ? toDayKey(a) : null
  const right = b ? toDayKey(b) : null
  if (!left && !right) return 0
  if (!left) return -1
  if (!right) return 1
  return left.localeCompare(right)
}

export function intervalsOverlap(
  startA?: string | null,
  endA?: string | null,
  startB?: string | null,
  endB?: string | null,
): boolean {
  const aStart = clockToMinutes(startA)
  const aEnd = clockToMinutes(endA)
  const bStart = clockToMinutes(startB)
  const bEnd = clockToMinutes(endB)
  if (aStart == null || aEnd == null || bStart == null || bEnd == null) return false
  return aStart < bEnd && bStart < aEnd
}

export function weekdayFromDayKey(day: string): string | null {
  const key = toDayKey(day)
  if (!key) return null
  const date = new Date(`${key}T12:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return null
  return [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ][date.getUTCDay()] ?? null
}
