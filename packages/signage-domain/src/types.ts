export type SignageCompileErrorCode =
  | 'INVALID_PLAYLIST'
  | 'INVALID_TIME'
  | 'INVALID_TIMEZONE'
  | 'INVALID_WINDOW'
  | 'SCOPE_MISMATCH'

export interface SignageSchedule {
  /** Sunday = 0 through Saturday = 6, matching the resolved local calendar day. */
  readonly daysOfWeek?: readonly number[]
  /** Inclusive local minute from midnight. Must be paired with endMinute. */
  readonly startMinute?: number
  /** Exclusive local minute from midnight. Must be paired with startMinute. */
  readonly endMinute?: number
}

export interface SignagePlaylistItem {
  readonly id: string
  readonly tenantId: string
  readonly siteId: string
  readonly assetId: string
  readonly durationSeconds: number
  readonly priority: number
  readonly position: number
  readonly validFrom?: string
  readonly validUntil?: string
  readonly schedule?: SignageSchedule
}

export interface SignagePlaylist {
  readonly id: string
  readonly tenantId: string
  readonly siteId: string
  readonly timezone: string
  readonly revision: number
  readonly items: readonly SignagePlaylistItem[]
}

export interface CompilePlaylistInput {
  readonly playlist: SignagePlaylist
  readonly tenantId: string
  readonly siteId: string
  readonly at: string | Date
}

export interface SignageManifestItem {
  readonly id: string
  readonly assetId: string
  readonly durationSeconds: number
  readonly priority: number
  readonly position: number
}

export interface SignagePositionCollision {
  readonly position: number
  readonly priority: number
  readonly itemIds: readonly string[]
}

export interface SignageLocalTime {
  readonly dayOfWeek: number
  readonly minuteOfDay: number
}

export interface SignageManifest {
  readonly schemaVersion: 1
  readonly tenantId: string
  readonly siteId: string
  readonly playlistId: string
  readonly playlistRevision: number
  readonly timezone: string
  readonly compiledAt: string
  readonly manifestKey: string
  readonly localTime: SignageLocalTime
  readonly items: readonly SignageManifestItem[]
  readonly collisions: readonly SignagePositionCollision[]
}
