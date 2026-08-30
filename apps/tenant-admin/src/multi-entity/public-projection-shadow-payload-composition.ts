import {
  MULTI_ENTITY_PUBLIC_PROJECTION_SHADOW_RUNNER_ENVIRONMENT,
  MULTI_ENTITY_PUBLIC_PROJECTION_SHADOW_RUNNER_FLAG,
  runPublicProjectionShadowComparison,
  type PublicProjectionShadowRunnerResult,
} from '../../../../packages/tenant/src/multi-entity-public-projection-runner'
import { createWebsiteRendererPublicBaselineLoader } from './public-baseline-payload-reader'
import {
  createPayloadPublicProjectionInputLoader,
  type PayloadPublicProjectionReaderOptions,
} from './public-projection-payload-reader'

export interface PayloadPublicProjectionShadowCompositionOptions extends PayloadPublicProjectionReaderOptions {
  readonly environment: Readonly<Record<string, string | undefined>>
}

/**
 * Composes both read-only snapshots behind the existing staging-only gate.
 * Creating the composition performs no Payload I/O; the returned function is
 * intentionally not registered in runtime configuration, routes, hooks or jobs.
 */
export function createPayloadPublicProjectionShadowComparison(
  options: PayloadPublicProjectionShadowCompositionOptions
): () => Promise<PublicProjectionShadowRunnerResult> {
  const loadProjectionInput = createPayloadPublicProjectionInputLoader(options)
  const loadCurrentBaseline = createWebsiteRendererPublicBaselineLoader({
    req: options.req,
    targetTenantId: options.targetTenantId,
  })
  const environment = Object.freeze({
    [MULTI_ENTITY_PUBLIC_PROJECTION_SHADOW_RUNNER_FLAG]:
      options.environment[MULTI_ENTITY_PUBLIC_PROJECTION_SHADOW_RUNNER_FLAG],
    [MULTI_ENTITY_PUBLIC_PROJECTION_SHADOW_RUNNER_ENVIRONMENT]:
      options.environment[MULTI_ENTITY_PUBLIC_PROJECTION_SHADOW_RUNNER_ENVIRONMENT],
  })

  return () =>
    runPublicProjectionShadowComparison({
      environment,
      loadProjectionInput,
      loadCurrentBaseline,
    })
}
