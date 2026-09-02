export type DashboardPresence = 'online' | 'idle' | 'offline' | 'pending'

const ONLINE_MS = 2 * 60 * 1000
const IDLE_MS = 15 * 60 * 1000

export function presenceFromTimestamps(
  lastSeenAt?: string | null,
  lastLoginAt?: string | null,
  now = Date.now(),
): DashboardPresence {
  const stamp = lastSeenAt || lastLoginAt
  if (!stamp) return 'offline'
  const then = new Date(stamp).getTime()
  if (!Number.isFinite(then)) return 'offline'
  const delta = now - then
  if (delta < ONLINE_MS) return 'online'
  if (delta < IDLE_MS) return 'idle'
  return 'offline'
}

export const PRESENCE_LABEL: Record<DashboardPresence, string> = {
  online: 'En línea',
  idle: 'Ausente',
  offline: 'Desconectado',
  pending: 'Invitación',
}
