/**
 * Dashboard content gutters.
 * FAB clearance stays a separate token (default 0rem). Bottom padding matches px-4.
 */
export const DASHBOARD_FAB_CLEARANCE_VAR = '--dashboard-fab-clearance'

export const DASHBOARD_LISTING_MAIN_INNER_CLASS =
  'min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-clip overscroll-none px-4 pt-0 pb-4 mb-[var(--dashboard-fab-clearance,0rem)]'

/** Kept for callers: the wizard now stays inside the dashboard shell. */
export function isEnrollmentFocusPath(_pathname: string | null | undefined): boolean {
  return false
}
