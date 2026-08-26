const DATE_ONLY_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/
const UTC_MIDNIGHT_SUFFIX = /^T00:00:00(?:\.\d+)?Z?$/

export type CalendarDateParts = {
  year: number
  month: number
  day: number
}

export type CalendarDateFormatOptions = {
  locale?: string
  day?: 'numeric' | '2-digit'
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow'
  year?: 'numeric' | '2-digit' | null
  empty?: string
}

function isValidParts(parts: CalendarDateParts): boolean {
  const { year, month, day } = parts
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false
  if (month < 1 || month > 12 || day < 1 || day > 31) return false
  const probe = new Date(year, month - 1, day)
  return (
    probe.getFullYear() === year && probe.getMonth() === month - 1 && probe.getDate() === day
  )
}

function fromParts(parts: CalendarDateParts): Date | null {
  if (!isValidParts(parts)) return null
  return new Date(parts.year, parts.month - 1, parts.day)
}

function isUtcMidnight(date: Date): boolean {
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  )
}

export function getCalendarDateParts(
  value: string | Date | null | undefined,
): CalendarDateParts | null {
  if (value == null || value === '') return null

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null
    if (isUtcMidnight(value)) {
      return {
        year: value.getUTCFullYear(),
        month: value.getUTCMonth() + 1,
        day: value.getUTCDate(),
      }
    }
    return {
      year: value.getFullYear(),
      month: value.getMonth() + 1,
      day: value.getDate(),
    }
  }

  const trimmed = value.trim()
  const match = DATE_ONLY_PREFIX.exec(trimmed)
  if (match) {
    const rest = trimmed.slice(10)
    const dateOnly = rest === '' || UTC_MIDNIGHT_SUFFIX.test(rest)
    if (dateOnly) {
      const parts = {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
      }
      return isValidParts(parts) ? parts : null
    }
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null
  return getCalendarDateParts(parsed)
}

export function parseCalendarDate(value: string | Date | null | undefined): Date | null {
  const parts = getCalendarDateParts(value)
  return parts ? fromParts(parts) : null
}

export function toCalendarDateString(value: string | Date | null | undefined): string {
  const parts = getCalendarDateParts(value)
  if (!parts) return ''
  return `${String(parts.year).padStart(4, '0')}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
}

export function toPayloadCalendarTimestamp(value: string | Date | null | undefined): string | null {
  const day = toCalendarDateString(value)
  if (!day) return null
  return `${day}T00:00:00.000Z`
}

export function compareCalendarDates(
  left: string | Date | null | undefined,
  right: string | Date | null | undefined,
): number | null {
  const start = parseCalendarDate(left)
  const end = parseCalendarDate(right)
  if (!start || !end) return null
  return start.getTime() - end.getTime()
}

export function formatCalendarDate(
  value: string | Date | null | undefined,
  options: CalendarDateFormatOptions = {},
): string {
  const date = parseCalendarDate(value)
  if (!date) return options.empty ?? '—'
  const formatOptions: Intl.DateTimeFormatOptions = {
    day: options.day ?? 'numeric',
    month: options.month ?? 'short',
  }
  if (options.year !== null) {
    formatOptions.year = options.year ?? 'numeric'
  }
  return new Intl.DateTimeFormat(options.locale ?? 'es-ES', formatOptions).format(date)
}
