/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
import { REST_DELETE, REST_GET, REST_PATCH, REST_POST } from '@payloadcms/next/routes'

import config from '@payload-config'

const isDbConfigured = Boolean(process.env.DATABASE_URL)

const disabledResponse = () =>
  new Response(JSON.stringify({ error: 'Payload API disabled without DATABASE_URL.' }), {
    status: 503,
    headers: { 'content-type': 'application/json' },
  })

export const GET = isDbConfigured ? REST_GET(config as Parameters<typeof REST_GET>[0]) : disabledResponse
export const POST = isDbConfigured ? REST_POST(config as Parameters<typeof REST_POST>[0]) : disabledResponse
export const DELETE = isDbConfigured ? REST_DELETE(config as Parameters<typeof REST_DELETE>[0]) : disabledResponse
export const PATCH = isDbConfigured ? REST_PATCH(config as Parameters<typeof REST_PATCH>[0]) : disabledResponse
