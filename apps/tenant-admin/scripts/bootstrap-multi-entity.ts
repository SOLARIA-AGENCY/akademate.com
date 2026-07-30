import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

type EntityConfig = {
  key: string
  name: string
  slug: string
  legalName?: string
  taxId?: string
  kind?: 'operator' | 'employer' | 'funder' | 'vendor' | 'other'
  virtualScope?: { name: string; slug: string }
}

type SiteRelationshipConfig = {
  campusSlug: string
  entityKey: string
  role: 'primary_operator' | 'shared_operator' | 'employer' | 'resource_manager'
  isPrimary?: boolean
  validFrom?: string
}

type BootstrapConfig = {
  tenantSlug: string
  entities: EntityConfig[]
  siteRelationships?: SiteRelationshipConfig[]
}

function assertConfig(value: unknown): asserts value is BootstrapConfig {
  if (!value || typeof value !== 'object') throw new Error('Bootstrap config must be an object')
  const input = value as Partial<BootstrapConfig>
  if (!input.tenantSlug || !Array.isArray(input.entities) || input.entities.length === 0) {
    throw new Error('tenantSlug and at least one entity are required')
  }
  const keys = new Set<string>()
  const slugs = new Set<string>()
  for (const entity of input.entities) {
    if (!entity.key || !entity.name || !entity.slug) throw new Error('Every entity requires key, name and slug')
    if (keys.has(entity.key) || slugs.has(entity.slug)) throw new Error('Entity keys and slugs must be unique in the config')
    if (/PENDIENTE|REPLACE|TODO/i.test(`${entity.name} ${entity.legalName ?? ''} ${entity.taxId ?? ''}`)) {
      throw new Error(`Entity ${entity.key} contains placeholder legal data`)
    }
    keys.add(entity.key)
    slugs.add(entity.slug)
  }
  for (const relationship of input.siteRelationships ?? []) {
    if (!keys.has(relationship.entityKey)) throw new Error(`Unknown entityKey ${relationship.entityKey}`)
  }
}

async function main() {
  const configPath = process.argv.find((arg) => arg.endsWith('.json'))
  if (!configPath) throw new Error('Usage: tsx scripts/bootstrap-multi-entity.ts <config.json> [--apply]')
  const apply = process.argv.includes('--apply')
  const parsed: unknown = JSON.parse(await readFile(resolve(configPath), 'utf8'))
  assertConfig(parsed)

  if (!apply) {
    console.log(JSON.stringify({ mode: 'dry-run', ...parsed }, null, 2))
    return
  }

  const payload = await getPayload({ config: configPromise })
  const tenants = await payload.find({
    collection: 'tenants', where: { slug: { equals: parsed.tenantSlug } }, limit: 1, depth: 0, overrideAccess: true,
  })
  const tenant = tenants.docs[0]
  if (!tenant) throw new Error(`Tenant ${parsed.tenantSlug} not found`)

  const entityIds = new Map<string, number>()
  for (const entity of parsed.entities) {
    const existing = await payload.find({
      collection: 'legal-entities',
      where: { and: [{ tenant: { equals: tenant.id } }, { slug: { equals: entity.slug } }] },
      limit: 1, depth: 0, overrideAccess: true,
    })
    const data = {
      tenant: tenant.id, name: entity.name, slug: entity.slug, legal_name: entity.legalName,
      tax_id: entity.taxId, kind: entity.kind ?? 'operator', active: true,
    }
    const saved = existing.docs[0]
      ? await payload.update({ collection: 'legal-entities', id: existing.docs[0].id, data, overrideAccess: true })
      : await payload.create({ collection: 'legal-entities', data, overrideAccess: true })
    entityIds.set(entity.key, saved.id)

    if (entity.virtualScope) {
      const scopes = await payload.find({
        collection: 'operating-scopes',
        where: { and: [{ tenant: { equals: tenant.id } }, { slug: { equals: entity.virtualScope.slug } }] },
        limit: 1, depth: 0, overrideAccess: true,
      })
      const scopeData = {
        tenant: tenant.id, legal_entity: saved.id, name: entity.virtualScope.name,
        slug: entity.virtualScope.slug, kind: 'virtual_entity' as const, internal_only: true, active: true,
      }
      if (scopes.docs[0]) {
        await payload.update({ collection: 'operating-scopes', id: scopes.docs[0].id, data: scopeData, overrideAccess: true })
      } else {
        await payload.create({ collection: 'operating-scopes', data: scopeData, overrideAccess: true })
      }
    }
  }

  for (const relationship of parsed.siteRelationships ?? []) {
    const campuses = await payload.find({
      collection: 'campuses',
      where: { and: [{ tenant: { equals: tenant.id } }, { slug: { equals: relationship.campusSlug } }] },
      limit: 1, depth: 0, overrideAccess: true,
    })
    const campus = campuses.docs[0]
    const legalEntity = entityIds.get(relationship.entityKey)
    if (!campus || !legalEntity) throw new Error(`Cannot resolve relationship for ${relationship.campusSlug}`)
    const existing = await payload.find({
      collection: 'site-entity-relationships',
      where: { and: [
        { tenant: { equals: tenant.id } }, { campus: { equals: campus.id } },
        { legal_entity: { equals: legalEntity } }, { role: { equals: relationship.role } },
      ] },
      limit: 1, depth: 0, overrideAccess: true,
    })
    const data = {
      tenant: tenant.id, campus: campus.id, legal_entity: legalEntity, role: relationship.role,
      is_primary: relationship.isPrimary ?? false, valid_from: relationship.validFrom, active: true,
    }
    if (existing.docs[0]) {
      await payload.update({ collection: 'site-entity-relationships', id: existing.docs[0].id, data, overrideAccess: true })
    } else {
      await payload.create({ collection: 'site-entity-relationships', data, overrideAccess: true })
    }
  }

  console.log(JSON.stringify({ mode: 'applied', tenant: parsed.tenantSlug, entities: [...entityIds.keys()] }))
}

await main()
