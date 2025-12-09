import { handleEndpoints, type PayloadRequest } from 'payload'
import type { Config as PayloadConfig } from 'payload/config'

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/await-thenable */
export const dynamic = 'force-dynamic'

const loadConfig = async (): Promise<PayloadConfig> => {
  const mod = await import('../../../../payload.config')
  return mod.default as PayloadConfig
}

const configPromise = loadConfig()

const buildHandler =
  () =>
  async (request: PayloadRequest, args: { params?: { slug?: string[] } }) => {
    const awaitedConfig = await configPromise
    const endpoints = Array.isArray(awaitedConfig.endpoints) ? awaitedConfig.endpoints : []
    awaitedConfig.endpoints = endpoints

    const awaitedParams = await args.params
    const path = awaitedParams?.slug?.length
      ? `${awaitedConfig.routes.api}/${awaitedParams.slug.join('/')}`
      : undefined

    return handleEndpoints({
      config: awaitedConfig,
      path,
      request,
    })
  }

export const GET = buildHandler()
export const POST = buildHandler()
export const PUT = buildHandler()
export const PATCH = buildHandler()
export const DELETE = buildHandler()
export const OPTIONS = buildHandler()
