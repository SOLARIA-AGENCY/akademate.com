import { getPayload } from 'payload'
import configPromise from '../src/payload.config'
import { normalizeNominativeText } from '../lib/nominative-text'

type Collection = 'courses' | 'cycles'

function option(name: string): string | null {
  const prefix = `--${name}=`
  const value = process.argv.find((argument) => argument.startsWith(prefix))
  return value ? value.slice(prefix.length) : null
}

async function normalizeCollection(payload: Awaited<ReturnType<typeof getPayload>>, collection: Collection, tenantId: number, apply: boolean) {
  const result = await payload.find({
    collection,
    where: { tenant: { equals: tenantId } },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })

  const changes: Array<{ id: string | number; before: string; after: string }> = []
  for (const document of result.docs as Array<{ id: string | number; name?: string | null }>) {
    const before = document.name?.trim() ?? ''
    const after = normalizeNominativeText(before) ?? before
    if (!before || before === after) continue
    changes.push({ id: document.id, before, after })
    if (apply) {
      await payload.update({
        collection,
        id: document.id,
        data: { name: after },
        overrideAccess: true,
      })
    }
  }

  return { collection, scanned: result.docs.length, changed: changes.length, changes }
}

async function main() {
  const tenantId = Number(option('tenant-id') ?? '1')
  if (!Number.isInteger(tenantId) || tenantId <= 0) throw new Error('tenant-id debe ser un entero positivo')

  const apply = process.argv.includes('--apply')
  const payload = await getPayload({ config: configPromise })
  const reports = await Promise.all([
    normalizeCollection(payload, 'courses', tenantId, apply),
    normalizeCollection(payload, 'cycles', tenantId, apply),
  ])
  console.log(JSON.stringify({ tenantId, apply, reports }, null, 2))
}

void main().catch((error) => {
  console.error(error)
  process.exit(1)
})
