type PlatformEnv = {
  web?: string
  ops?: string
  tenant?: string
  campus?: string
  designSystem?: string
  support?: string
  portal?: string
}

export type PlatformUrls = {
  web: string
  ops: string
  tenant: string
  campus: string
  designSystem: string
  support: string
  portal: string
}

const env: PlatformEnv = {
  web: process.env.NEXT_PUBLIC_WEB_URL,
  ops: process.env.NEXT_PUBLIC_OPS_URL ?? process.env.NEXT_PUBLIC_ADMIN_URL,
  tenant: process.env.NEXT_PUBLIC_TENANT_URL ?? process.env.NEXT_PUBLIC_CLIENT_DASHBOARD_URL,
  campus: process.env.NEXT_PUBLIC_CAMPUS_URL,
  designSystem: process.env.NEXT_PUBLIC_DESIGN_SYSTEM_URL,
  support: process.env.NEXT_PUBLIC_SUPPORT_URL,
  portal: process.env.NEXT_PUBLIC_PORTAL_URL,
}

function normalizeUrl(raw: string): string {
  return raw.replace(/\/$/, '')
}

function hostUrlForPort(port: number): string {
  if (typeof window === 'undefined') return `http://localhost:${port}`
  return `${window.location.protocol}//${window.location.hostname}:${port}`
}

export function getRuntimePlatformUrls(): PlatformUrls {
  const web = normalizeUrl(env.web ?? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3006'))
  const ops = normalizeUrl(env.ops ?? hostUrlForPort(3004))
  const tenant = normalizeUrl(env.tenant ?? hostUrlForPort(3009))
  const campus = normalizeUrl(env.campus ?? hostUrlForPort(3005))
  const designSystem = normalizeUrl(env.designSystem ?? `${web}/design-system`)
  const support = normalizeUrl(env.support ?? `${ops}/dashboard/support`)
  const portal = normalizeUrl(env.portal ?? hostUrlForPort(3008))

  return { web, ops, tenant, campus, designSystem, support, portal }
}

export function getPathFromUrl(url: string): string {
  try {
    const parsed = new URL(url)
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || '/'
  } catch {
    return '/'
  }
}
