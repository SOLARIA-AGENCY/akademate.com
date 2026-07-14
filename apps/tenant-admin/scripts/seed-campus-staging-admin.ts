import { getPayload } from 'payload'
import config from '@payload-config'

const environment = process.env.CAMPUS_ENVIRONMENT
const databaseName = process.env.DATABASE_NAME ?? ''
if (
  process.env.CAMPUS_INTERNAL_ENABLED !== 'true' ||
  environment !== 'staging' ||
  process.env.NODE_ENV === 'production' ||
  !/(staging|stg|dev|test|local)/i.test(databaseName)
) {
  throw new Error('El seed de administrador solo puede ejecutarse en una base staging/dev/test/local.')
}

const email = process.env.CAMPUS_E2E_ADMIN_EMAIL?.trim().toLowerCase()
const password = process.env.CAMPUS_E2E_ADMIN_PASSWORD
const tenantId = Number(process.env.CAMPUS_E2E_ADMIN_TENANT_ID ?? '1')

if (!email || !password || !Number.isInteger(tenantId) || tenantId <= 0) {
  throw new Error('Faltan CAMPUS_E2E_ADMIN_EMAIL, CAMPUS_E2E_ADMIN_PASSWORD o CAMPUS_E2E_ADMIN_TENANT_ID.')
}

const payload = await getPayload({ config })
const existing = await payload.find({
  collection: 'users',
  where: { email: { equals: email } },
  limit: 1,
  depth: 0,
  overrideAccess: true,
})

const data = {
  email,
  password,
  name: 'Campus Staging Admin',
  role: 'admin' as const,
  tenant: tenantId,
  is_active: true,
}

if (existing.docs[0]) {
  await payload.update({
    collection: 'users',
    id: String(existing.docs[0].id),
    data,
    overrideAccess: true,
  })
  console.log(JSON.stringify({ action: 'updated', email, tenantId }))
} else {
  await payload.create({
    collection: 'users',
    data,
    overrideAccess: true,
  })
  console.log(JSON.stringify({ action: 'created', email, tenantId }))
}

// Payload keeps its database pool alive; this one-shot seed must terminate
// explicitly so it can be used in CI and local staging automation.
process.exit(0)
