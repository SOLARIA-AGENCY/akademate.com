/** Routes that keep a viewport-locked shell. Everything else used to scroll the document. */
export const DASHBOARD_LOCKED_CHROME_PATHS = [
  '/planner',
  '/dashboard/planner',
  '/calendario-citas',
  '/dashboard/calendario-citas',
] as const

export function normalizeDashboardPath(pathname: string): string {
  return pathname.split(/[?#]/)[0]?.replace(/\/+$/, '') || '/'
}

export function isDashboardLockedChrome(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return (DASHBOARD_LOCKED_CHROME_PATHS as readonly string[]).includes(
    normalizeDashboardPath(pathname),
  )
}

/**
 * Document scroll is retired: listings, fichas and home share one dvh-locked chrome.
 * Planner paths stay in the locked set for callers that still branch on it.
 */
export function isDashboardListingDocumentScroll(_pathname: string | null | undefined): boolean {
  return false
}

/** Locked dashboard chrome: named 3-column grid so overlays cannot steal the agent slot. */
export const DASHBOARD_SHELL_LOCKED_CLASS =
  'dashboard-shell grid h-dvh grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-1 overflow-hidden bg-[#0066CC] text-foreground overscroll-none [grid-template-areas:"rail_main_agent"]'

/** Same locked chrome for catalog pages (name kept for existing layout imports). */
export const DASHBOARD_SHELL_LISTING_CLASS = DASHBOARD_SHELL_LOCKED_CLASS

export const DASHBOARD_RAIL_EXPANDED_WIDTH = 'w-[240px]'
export const DASHBOARD_RAIL_COLLAPSED_WIDTH = 'w-[80px]'
export const DASHBOARD_AGENT_RAIL_COLLAPSED_WIDTH = 'w-[40px]'

/** In-flow left rail. Same height as the shell; never overlays the topbar. */
export const DASHBOARD_RAIL_CLASS =
  'hidden h-full shrink-0 flex-col self-stretch bg-transparent transition-[width] duration-300 md:flex overscroll-none [grid-area:rail]'

export const DASHBOARD_AGENT_RAIL_CLASS =
  'hidden h-full min-h-0 shrink-0 flex-col self-stretch bg-[#0B1D36] overscroll-none md:flex [grid-area:agent]'

/** Center column: topbar + main only. Header cannot span into the agent area. */
export const DASHBOARD_CENTER_CLASS =
  'flex h-full min-h-0 min-w-0 flex-col overflow-hidden p-1 [grid-area:main]'

/** Portal hosts must not occupy a grid track. */
export const DASHBOARD_OVERLAY_HOST_CLASS =
  'pointer-events-none h-0 w-0 overflow-visible [grid-area:rail]'

export const DASHBOARD_RAIL_SPACER_CLASS =
  'pointer-events-none hidden shrink-0 transition-[width] duration-300 md:block'

/** Top bar lives only in the center column so the right rail can reach the top. */
export const DASHBOARD_TOPBAR_CLASS =
  'relative z-30 flex h-14 shrink-0 items-center gap-2 px-4 overscroll-none bg-[var(--dashboard-canvas)]'

export const DASHBOARD_TOPBAR_SPACER_CLASS = 'h-14 shrink-0'

/** Listing canvas fills the center column (not the full viewport over the agent). */
export const DASHBOARD_LISTING_INSET_CLASS =
  'flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl bg-[var(--dashboard-canvas)] text-foreground shadow-none'

/** No extra top padding: page chrome sits flush under the topbar. */
export const DASHBOARD_LISTING_MAIN_INNER_CLASS =
  'flex min-h-0 w-full flex-1 flex-col overflow-hidden px-4 pt-0 pb-[var(--dashboard-fab-clearance,0rem)]'

export function dashboardShellClass(_listingDocumentScroll: boolean): string {
  return DASHBOARD_SHELL_LOCKED_CLASS
}
