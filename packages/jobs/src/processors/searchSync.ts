import type { TenantJob } from '../index'
import type { TenantJobHandler } from '../workers'

export type SearchSyncAction = 'index' | 'update' | 'delete'

export type SearchSyncPayload = {
  action: SearchSyncAction
  collection: string
  documentId: string
  data?: Record<string, unknown>
}

/**
 * Processes search index synchronisation jobs.
 *
 * TODO: Integrate an actual search engine client (e.g. Meilisearch,
 * Typesense, or Elasticsearch) once the search infrastructure is
 * provisioned.
 */
export const processSearchSync: TenantJobHandler<SearchSyncPayload> = async (
  job: TenantJob<SearchSyncPayload>,
  _rawJob
) => {
  const { action, collection, documentId, data } = job.payload

  if (!action || !collection || !documentId) {
    throw new Error(
      'Search sync job missing required fields: action, collection, documentId'
    )
  }

  if ((action === 'index' || action === 'update') && data === undefined) {
    throw new Error(
      `Search sync action "${action}" requires a data field`
    )
  }

  // TODO: Replace with actual search engine client calls
  console.log(
    `[search-sync] tenant=${job.tenantId} action=${action} ` +
      `collection=${collection} documentId=${documentId} ` +
      `hasData=${String(data !== undefined)} traceId=${job.traceId ?? 'none'}`
  )
}
