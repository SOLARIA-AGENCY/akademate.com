import type {
  CompilePlaylistInput,
  SignageCompileErrorCode,
  SignageLocalTime,
  SignageManifest,
  SignageManifestItem,
  SignagePlaylist,
  SignagePlaylistItem,
  SignagePositionCollision,
  SignageSchedule,
} from './types.ts'

const WEEKDAY_INDEX: Readonly<Record<string, number>> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

function compareCanonicalIdentifiers(left: string, right: string): number {
  if (left < right) return -1
  if (left > right) return 1
  return 0
}

export class SignageCompileError extends Error {
  readonly code: SignageCompileErrorCode

  constructor(code: SignageCompileErrorCode, message: string) {
    super(message)
    this.name = 'SignageCompileError'
    this.code = code
  }
}

function requireIdentifier(value: string, field: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u.test(value)) {
    throw new SignageCompileError(
      'INVALID_PLAYLIST',
      `${field} must be a canonical ASCII identifier`,
    )
  }
}

function parseInstant(value: string | Date, field: string): Date {
  const parsed = value instanceof Date ? new Date(value.getTime()) : new Date(value)
  if (
    !Number.isFinite(parsed.getTime()) ||
    (typeof value === 'string' && parsed.toISOString() !== value)
  ) {
    throw new SignageCompileError(
      'INVALID_TIME',
      `${field} must be a canonical ISO-8601 UTC instant`,
    )
  }
  return parsed
}

function isSafeCanonicalInteger(value: number): boolean {
  return Number.isSafeInteger(value) && !Object.is(value, -0)
}

function resolveLocalTime(instant: Date, timezone: string): SignageLocalTime {
  let formatter: Intl.DateTimeFormat
  try {
    formatter = new Intl.DateTimeFormat('en-US-u-hc-h23', {
      timeZone: timezone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
  } catch {
    throw new SignageCompileError('INVALID_TIMEZONE', `Unsupported IANA timezone: ${timezone}`)
  }

  const parts = formatter.formatToParts(instant)
  const weekday = parts.find((part) => part.type === 'weekday')?.value
  const hour = Number(parts.find((part) => part.type === 'hour')?.value)
  const minute = Number(parts.find((part) => part.type === 'minute')?.value)
  const dayOfWeek = weekday === undefined ? undefined : WEEKDAY_INDEX[weekday]

  if (
    dayOfWeek === undefined ||
    !Number.isInteger(hour) ||
    hour < 0 ||
    hour > 23 ||
    !Number.isInteger(minute) ||
    minute < 0 ||
    minute > 59
  ) {
    throw new SignageCompileError('INVALID_TIMEZONE', `Could not resolve local time for ${timezone}`)
  }

  return { dayOfWeek, minuteOfDay: hour * 60 + minute }
}

function validateSchedule(schedule: SignageSchedule | undefined, itemId: string): void {
  if (schedule === undefined) return

  if (schedule.daysOfWeek !== undefined) {
    if (schedule.daysOfWeek.length === 0) {
      throw new SignageCompileError('INVALID_WINDOW', `${itemId} has an empty daysOfWeek window`)
    }
    const unique = new Set(schedule.daysOfWeek)
    if (
      unique.size !== schedule.daysOfWeek.length ||
      schedule.daysOfWeek.some((day) => !Number.isInteger(day) || day < 0 || day > 6)
    ) {
      throw new SignageCompileError('INVALID_WINDOW', `${itemId} has invalid daysOfWeek values`)
    }
  }

  const { startMinute, endMinute } = schedule
  const hasStart = startMinute !== undefined
  const hasEnd = endMinute !== undefined
  if (hasStart !== hasEnd) {
    throw new SignageCompileError(
      'INVALID_WINDOW',
      `${itemId} must provide both startMinute and endMinute`,
    )
  }
  if (startMinute === undefined || endMinute === undefined) return
  if (
    !Number.isInteger(startMinute) ||
    !Number.isInteger(endMinute) ||
    startMinute < 0 ||
    startMinute > 1439 ||
    endMinute < 0 ||
    endMinute > 1439 ||
    startMinute === endMinute
  ) {
    throw new SignageCompileError('INVALID_WINDOW', `${itemId} has an invalid local-time window`)
  }
}

function validatePlaylist(playlist: SignagePlaylist, tenantId: string, siteId: string): void {
  requireIdentifier(playlist.id, 'playlist.id')
  requireIdentifier(playlist.tenantId, 'playlist.tenantId')
  requireIdentifier(playlist.siteId, 'playlist.siteId')
  if (playlist.timezone.trim().length === 0) {
    throw new SignageCompileError('INVALID_TIMEZONE', 'playlist.timezone must not be empty')
  }
  requireIdentifier(tenantId, 'tenantId')
  requireIdentifier(siteId, 'siteId')

  if (playlist.tenantId !== tenantId || playlist.siteId !== siteId) {
    throw new SignageCompileError('SCOPE_MISMATCH', 'Playlist is outside the requested scope')
  }
  if (!isSafeCanonicalInteger(playlist.revision) || playlist.revision < 0) {
    throw new SignageCompileError('INVALID_PLAYLIST', 'playlist.revision must be a non-negative integer')
  }

  const itemIds = new Set<string>()
  for (const item of playlist.items) {
    requireIdentifier(item.id, 'item.id')
    requireIdentifier(item.assetId, `${item.id}.assetId`)
    if (itemIds.has(item.id)) {
      throw new SignageCompileError('INVALID_PLAYLIST', `Duplicate item id: ${item.id}`)
    }
    itemIds.add(item.id)

    if (item.tenantId !== tenantId || item.siteId !== siteId) {
      throw new SignageCompileError('SCOPE_MISMATCH', `${item.id} is outside the requested scope`)
    }
    if (
      !isSafeCanonicalInteger(item.durationSeconds) ||
      item.durationSeconds < 1 ||
      item.durationSeconds > 86_400 ||
      !isSafeCanonicalInteger(item.priority) ||
      !isSafeCanonicalInteger(item.position) ||
      item.position < 0
    ) {
      throw new SignageCompileError('INVALID_PLAYLIST', `${item.id} has invalid playback values`)
    }
    validateSchedule(item.schedule, item.id)

    const from = item.validFrom === undefined ? undefined : parseInstant(item.validFrom, `${item.id}.validFrom`)
    const until = item.validUntil === undefined ? undefined : parseInstant(item.validUntil, `${item.id}.validUntil`)
    if (from !== undefined && until !== undefined && from.getTime() >= until.getTime()) {
      throw new SignageCompileError('INVALID_WINDOW', `${item.id} has a non-increasing validity window`)
    }
  }
}

function includesDay(days: readonly number[] | undefined, day: number): boolean {
  return days === undefined || days.includes(day)
}

function matchesSchedule(schedule: SignageSchedule | undefined, local: SignageLocalTime): boolean {
  if (schedule === undefined) return true
  if (schedule.startMinute === undefined || schedule.endMinute === undefined) {
    return includesDay(schedule.daysOfWeek, local.dayOfWeek)
  }

  const { startMinute, endMinute } = schedule
  if (startMinute < endMinute) {
    return (
      includesDay(schedule.daysOfWeek, local.dayOfWeek) &&
      local.minuteOfDay >= startMinute &&
      local.minuteOfDay < endMinute
    )
  }

  if (local.minuteOfDay >= startMinute) {
    return includesDay(schedule.daysOfWeek, local.dayOfWeek)
  }
  if (local.minuteOfDay < endMinute) {
    const previousDay = (local.dayOfWeek + 6) % 7
    return includesDay(schedule.daysOfWeek, previousDay)
  }
  return false
}

function isActive(item: SignagePlaylistItem, instant: Date, local: SignageLocalTime): boolean {
  if (item.validFrom !== undefined && instant < parseInstant(item.validFrom, `${item.id}.validFrom`)) {
    return false
  }
  if (item.validUntil !== undefined && instant >= parseInstant(item.validUntil, `${item.id}.validUntil`)) {
    return false
  }
  return matchesSchedule(item.schedule, local)
}

function toManifestItem(item: SignagePlaylistItem): SignageManifestItem {
  return {
    id: item.id,
    assetId: item.assetId,
    durationSeconds: item.durationSeconds,
    priority: item.priority,
    position: item.position,
  }
}

function findCollisions(items: readonly SignageManifestItem[]): SignagePositionCollision[] {
  const groups = new Map<string, SignageManifestItem[]>()
  for (const item of items) {
    const key = `${item.priority}:${item.position}`
    const group = groups.get(key)
    if (group === undefined) groups.set(key, [item])
    else group.push(item)
  }

  return [...groups.values()]
    .filter((group) => group.length > 1)
    .map((group) => ({
      position: group[0]!.position,
      priority: group[0]!.priority,
      itemIds: group.map((item) => item.id).sort(compareCanonicalIdentifiers),
    }))
    .sort((left, right) => right.priority - left.priority || left.position - right.position)
}

export function compilePlaylist(input: CompilePlaylistInput): SignageManifest {
  const instant = parseInstant(input.at, 'at')
  validatePlaylist(input.playlist, input.tenantId, input.siteId)
  const localTime = resolveLocalTime(instant, input.playlist.timezone)

  const items = input.playlist.items
    .filter((item) => isActive(item, instant, localTime))
    .map(toManifestItem)
    .sort(
      (left, right) =>
        right.priority - left.priority ||
        left.position - right.position ||
        compareCanonicalIdentifiers(left.id, right.id),
    )
  const compiledAt = instant.toISOString()

  return {
    schemaVersion: 1,
    tenantId: input.tenantId,
    siteId: input.siteId,
    playlistId: input.playlist.id,
    playlistRevision: input.playlist.revision,
    timezone: input.playlist.timezone,
    compiledAt,
    manifestKey: `${input.tenantId}/${input.siteId}/${input.playlist.id}/r${input.playlist.revision}/${compiledAt}`,
    localTime,
    items,
    collisions: findCollisions(items),
  }
}
