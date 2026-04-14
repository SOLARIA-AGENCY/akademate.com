import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { withTenantScope } from '@/app/lib/server/tenant-scope'
import type {
  ResolvedWebsiteNavigationGroup,
  ResolvedWebsiteNavigationItem,
  WebsiteLink,
  WebsiteNavigationItem,
} from './types'
import { normalizeStudyType } from './study-types'

type CourseTypeDoc = {
  id: string | number
  name?: string | null
  code?: string | null
  active?: boolean | null
}

type CycleDoc = {
  id: string | number
  name?: string | null
  slug?: string | null
  level?: string | null
  active?: boolean | null
}

type CampusDoc = {
  id: string | number
  name?: string | null
  slug?: string | null
  active?: boolean | null
}

function toSearchParamSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeNavigationItem(item: WebsiteNavigationItem): ResolvedWebsiteNavigationItem {
  return {
    label: item.label,
    href: item.href,
    kind: item.kind === 'dropdown' ? 'dropdown' : 'link',
    source: item.source,
    children: item.children,
  }
}

function toLink(label: string, href: string): WebsiteLink {
  return { label, href }
}

function resolveStudyTypeChildren(courseTypes: CourseTypeDoc[]): WebsiteLink[] {
  return courseTypes
    .filter((type) => type.active !== false)
    .map((type) => {
      const label = (type.name || '').trim()
      if (!label) return null
      const rawValue = (type.code || label).toString()
      const tipo = normalizeStudyType(rawValue) || normalizeStudyType(label) || toSearchParamSegment(rawValue)
      return toLink(label, `/cursos?tipo=${encodeURIComponent(tipo)}`)
    })
    .filter((link): link is WebsiteLink => Boolean(link))
}

function resolveCycleGroups(cycles: CycleDoc[]): ResolvedWebsiteNavigationGroup[] {
  const levelGroups: Array<{ key: string; label: string }> = [
    { key: 'grado_medio', label: 'Grado Medio · CFGM' },
    { key: 'grado_superior', label: 'Grado Superior · CFGS' },
  ]

  return levelGroups
    .map((group) => {
      const children = cycles
        .filter((cycle) => cycle.active !== false && cycle.level === group.key)
        .map((cycle) => {
          const label = (cycle.name || '').trim()
          const slug = (cycle.slug || '').trim()
          if (!label || !slug) return null
          return toLink(label, `/ciclos/${slug}`)
        })
        .filter((link): link is WebsiteLink => Boolean(link))
      return { label: group.label, children }
    })
    .filter((group) => group.children.length > 0)
}

function resolveCampusChildren(campuses: CampusDoc[]): WebsiteLink[] {
  return campuses
    .filter((campus) => campus.active !== false)
    .map((campus) => {
      const label = (campus.name || '').trim()
      const slug = (campus.slug || '').trim()
      if (!label || !slug) return null
      return toLink(label, `/sedes/${slug}`)
    })
    .filter((link): link is WebsiteLink => Boolean(link))
}

export async function resolvePublicNavigation(
  items: WebsiteNavigationItem[],
  options?: { tenantId?: string | number | null }
): Promise<ResolvedWebsiteNavigationItem[]> {
  const normalized = items.map((item) => normalizeNavigationItem(item))
  const needsStudyTypes = normalized.some((item) => item.kind === 'dropdown' && item.source === 'study_types')
  const needsCycles = normalized.some((item) => item.kind === 'dropdown' && item.source === 'cycles_by_level')
  const needsCampuses = normalized.some((item) => item.kind === 'dropdown' && item.source === 'campuses')

  if (!needsStudyTypes && !needsCycles && !needsCampuses) {
    return normalized
  }

  const payload = await getPayload({ config: configPromise })
  const payloadAny = payload as any

  const [courseTypesResult, cyclesResult, campusesResult] = await Promise.all([
    needsStudyTypes
      ? payloadAny.find({
          collection: 'course-types',
          where: { active: { equals: true } },
          sort: 'name',
          limit: 100,
          depth: 0,
        })
      : Promise.resolve({ docs: [] }),
    needsCycles
      ? payload.find({
          collection: 'cycles',
          where: withTenantScope({ active: { equals: true } }, options?.tenantId) as any,
          sort: 'name',
          limit: 200,
          depth: 0,
        })
      : Promise.resolve({ docs: [] }),
    needsCampuses
      ? payload.find({
          collection: 'campuses',
          where: withTenantScope({ active: { equals: true } }, options?.tenantId) as any,
          sort: 'name',
          limit: 100,
          depth: 0,
        })
      : Promise.resolve({ docs: [] }),
  ])

  const courseTypes = (courseTypesResult.docs ?? []) as CourseTypeDoc[]
  const cycles = (cyclesResult.docs ?? []) as CycleDoc[]
  const campuses = (campusesResult.docs ?? []) as CampusDoc[]

  return normalized.map((item) => {
    if (item.kind !== 'dropdown') return item

    if (item.source === 'study_types') {
      const children = resolveStudyTypeChildren(courseTypes)
      return children.length > 0 ? { ...item, children } : { ...item, kind: 'link', children: undefined }
    }

    if (item.source === 'cycles_by_level') {
      const groups = resolveCycleGroups(cycles)
      const children = groups.flatMap((group) => group.children)
      return children.length > 0
        ? { ...item, groups, children }
        : { ...item, kind: 'link', children: undefined, groups: undefined }
    }

    if (item.source === 'campuses') {
      const children = resolveCampusChildren(campuses)
      return children.length > 0 ? { ...item, children } : { ...item, kind: 'link', children: undefined }
    }

    const manualChildren = item.children ?? []
    return manualChildren.length > 0 ? item : { ...item, kind: 'link', children: undefined }
  })
}
