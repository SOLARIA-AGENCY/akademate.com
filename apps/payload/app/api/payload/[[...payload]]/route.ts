import { handleEndpoints } from 'payload'
import type { SanitizedConfig } from 'payload'

export const dynamic = 'force-dynamic'

const loadConfig = async (): Promise<SanitizedConfig> => {
  const mod = await import('../../../../payload.config')
  // buildConfig returns a Promise<SanitizedConfig>
  const config = await mod.default
  return config
}

const configPromise = loadConfig()

const buildHandler =
  () =>
  async (request: Request, args: { params?: Promise<{ payload?: string[] }> }) => {
    const awaitedConfig = await configPromise
    const endpoints = Array.isArray(awaitedConfig.endpoints) ? awaitedConfig.endpoints : []
    awaitedConfig.endpoints = endpoints

    const awaitedParams = await args.params
    const apiSegments = awaitedParams?.payload
    const path = apiSegments?.length
      ? `${awaitedConfig.routes.api}/${apiSegments.join('/')}`
      : undefined

    return handleEndpoints({
      config: awaitedConfig,
      path,
      request: request,
    })
  }

export const GET = buildHandler()
export const POST = buildHandler()
export const PUT = buildHandler()
export const PATCH = buildHandler()
export const DELETE = buildHandler()
export const OPTIONS = buildHandler()
