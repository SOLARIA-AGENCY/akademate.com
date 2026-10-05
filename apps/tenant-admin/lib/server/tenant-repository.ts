import 'server-only'

import type { VerifiedPrincipal } from './session'
import { requireTenantScope } from './tenant-access'

type PayloadClient = {
  find(args: Record<string, unknown>): Promise<{ docs: unknown[]; [key: string]: unknown }>
  create(args: Record<string, unknown>): Promise<unknown>
  update(args: Record<string, unknown>): Promise<unknown>
  delete(args: Record<string, unknown>): Promise<unknown>
}

type Where = Record<string, unknown>

function tenantWhere(tenantField: string, tenantId: string): Where {
  return { [tenantField]: { equals: tenantId } }
}

function scopedWhere(tenantField: string, tenantId: string, where?: Where): Where {
  const scope = tenantWhere(tenantField, tenantId)
  return where && Object.keys(where).length > 0 ? { and: [scope, where] } : scope
}

export function createTenantRepository(
  payload: PayloadClient,
  principal: VerifiedPrincipal,
  options: { collection: string; tenantField?: string },
) {
  const tenantId = requireTenantScope(principal, principal.tenantId)
  const tenantField = options.tenantField ?? 'tenant'

  return {
    find(args: Record<string, unknown> = {}) {
      return payload.find({
        ...args,
        collection: options.collection,
        where: scopedWhere(tenantField, tenantId, args.where as Where | undefined),
        overrideAccess: true,
      })
    },
    async findById(id: string | number, args: Record<string, unknown> = {}) {
      const result = await payload.find({
        ...args,
        collection: options.collection,
        limit: 1,
        where: scopedWhere(tenantField, tenantId, { id: { equals: id } }),
        overrideAccess: true,
      })
      return result.docs[0] ?? null
    },
    create(data: Record<string, unknown>, args: Record<string, unknown> = {}) {
      return payload.create({
        ...args,
        collection: options.collection,
        data: { ...data, [tenantField]: tenantId },
        overrideAccess: true,
      })
    },
    update(id: string | number, data: Record<string, unknown>, args: Record<string, unknown> = {}) {
      return payload.update({
        ...args,
        collection: options.collection,
        data: { ...data, [tenantField]: tenantId },
        where: scopedWhere(tenantField, tenantId, { id: { equals: id } }),
        overrideAccess: true,
      })
    },
    delete(id: string | number, args: Record<string, unknown> = {}) {
      return payload.delete({
        ...args,
        collection: options.collection,
        where: scopedWhere(tenantField, tenantId, { id: { equals: id } }),
        overrideAccess: true,
      })
    },
  }
}
