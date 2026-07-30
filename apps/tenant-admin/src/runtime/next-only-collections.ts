import { nextCollectionConfigs } from './next-collection-configs'

// Add a collection here only after its schema, authorization and migration
// have passed the Next runtime gates. This module is dynamically imported and
// is never evaluated by legacy/CEP runtimes.
export const nextOnlyCollections = nextCollectionConfigs
