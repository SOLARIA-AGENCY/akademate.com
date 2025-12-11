/**
 * AdsTemplates Hooks - Index
 *
 * Re-exports all hook functions for the AdsTemplates collection.
 *
 * Hook Execution Order:
 * 1. beforeValidate: validateTemplateContent, validateAssetURLs, validateTags
 * 2. beforeChange: trackTemplateCreator, setArchivedTimestamp
 */

export { trackTemplateCreator } from './trackTemplateCreator';
export { setArchivedTimestamp } from './setArchivedTimestamp';
export { validateTemplateContent } from './validateTemplateContent';
export { validateAssetURLs } from './validateAssetURLs';
export { validateTagsHook } from './validateTags';
