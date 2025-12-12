import 'dotenv/config'
import { getPayload } from 'payload'
import { getPayloadConfig } from '../src/payload.config'

/**
 * Bootstrap a superadmin user into the database.
 * Uses env vars if provided, otherwise sensible defaults for local dev.
 */
async function main() {
  const email = process.env.SEED_SUPERADMIN_EMAIL || 'superadmin@cepcomunicacion.com'
  const password = process.env.SEED_SUPERADMIN_PASSWORD || 'Dev12345!'
  const name = process.env.SEED_SUPERADMIN_NAME || 'Super Admin'

  const payload = await getPayload({
    config: getPayloadConfig(),
  })

  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.docs.length > 0) {
    payload.logger.info(`[seed] Superadmin already exists: ${email}`)
    return
  }

  await payload.create({
    collection: 'users',
    data: {
      email,
      password,
      name,
      role: 'superadmin',
      is_active: true,
    },
    overrideAccess: true,
  })

  payload.logger.info(`[seed] Superadmin created: ${email}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
