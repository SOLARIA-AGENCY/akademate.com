#!/usr/bin/env node

/**
 * Fail-closed guard for internal Campus work.
 * It never connects to the database; it only rejects unsafe configuration.
 */

const environment = process.env.CAMPUS_ENVIRONMENT ?? 'development'
const nodeEnvironment = process.env.NODE_ENV ?? 'development'
const databaseUrl = process.env.DATABASE_URL ?? ''

if (process.env.CAMPUS_INTERNAL_ENABLED !== 'true') {
  throw new Error('Campus interno bloqueado: CAMPUS_INTERNAL_ENABLED debe ser true.')
}

if (environment === 'production' || nodeEnvironment === 'production') {
  throw new Error('Campus interno bloqueado: no se permite ejecutar este flujo en produccion.')
}

if (!process.env.CAMPUS_JWT_SECRET || process.env.CAMPUS_JWT_SECRET.length < 32) {
  throw new Error('Campus interno bloqueado: CAMPUS_JWT_SECRET debe tener al menos 32 caracteres.')
}

if (!databaseUrl) {
  throw new Error('Campus interno bloqueado: DATABASE_URL es obligatorio para validar aislamiento.')
}

const parsed = new URL(databaseUrl)
const databaseName = parsed.pathname.replace(/^\//, '')
if (!/(dev|development|stg|staging|test|local)/i.test(databaseName)) {
  throw new Error(`Campus interno bloqueado: la base de datos '${databaseName}' no parece de desarrollo/staging/test.`)
}

console.log(JSON.stringify({
  campus: 'isolated',
  environment,
  databaseHost: parsed.hostname,
  databaseName,
  productionWrites: false,
}))
