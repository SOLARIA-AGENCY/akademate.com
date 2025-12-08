import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@payloadcms/next/routes'
import configPromise from '../../../../payload.config'

export const dynamic = 'force-dynamic'

export const GET = REST_GET({ config: configPromise })
export const POST = REST_POST({ config: configPromise })
export const PUT = REST_PUT({ config: configPromise })
export const PATCH = REST_PATCH({ config: configPromise })
export const DELETE = REST_DELETE({ config: configPromise })
export const OPTIONS = REST_OPTIONS({ config: configPromise })
