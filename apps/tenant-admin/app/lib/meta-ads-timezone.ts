export const META_ADS_ACCOUNT_TIMEZONE = 'America/Los_Angeles'
export const META_OPS_LOCAL_TIMEZONE = 'Europe/Madrid'

export function formatInTimeZone(iso: string | Date | null | undefined, timeZone: string): string {
  if (!iso) return '--'
  const date = iso instanceof Date ? iso : new Date(iso)
  if (Number.isNaN(date.getTime())) return '--'
  return new Intl.DateTimeFormat('es-ES', {
    timeZone,
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export function formatAdsManagerClock(iso?: string | Date | null): {
  account: string
  local: string
  accountTz: string
  localTz: string
  label: string
} {
  return {
    account: formatInTimeZone(iso || new Date(), META_ADS_ACCOUNT_TIMEZONE),
    local: formatInTimeZone(iso || new Date(), META_OPS_LOCAL_TIMEZONE),
    accountTz: META_ADS_ACCOUNT_TIMEZONE,
    localTz: META_OPS_LOCAL_TIMEZONE,
    label: `Ads Manager ${META_ADS_ACCOUNT_TIMEZONE} · Operación ${META_OPS_LOCAL_TIMEZONE}`,
  }
}

export function adsManagerTimezoneNote(): string {
  return 'El día de Ads Manager es America/Los_Angeles (PDT/PST), no Europe/Madrid. Compara series solo tras convertir zona.'
}
