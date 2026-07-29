export type OptionalTracker = {
  id: string
  category: 'analytics' | 'marketing' | 'personalization'
  provider: string
  purpose: string
}

// Fail-closed registry: optional scripts may only be loaded after they are
// declared here and the visitor has consented to the matching category.
export const OPTIONAL_TRACKERS: readonly OptionalTracker[] = []

export const hasOptionalTrackers = OPTIONAL_TRACKERS.length > 0

export function mayLoadTracker(
  tracker: OptionalTracker,
  consent: Partial<Record<OptionalTracker['category'], boolean>> | null
) {
  return consent?.[tracker.category] === true
}
