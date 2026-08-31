/** Rail is a viewport column. Canvas scrolls cards. Cards stay natural height. */

export const DASHBOARD_SHELL_CLASS =
  'dashboard-shell h-svh min-w-0 overflow-x-clip overflow-y-hidden bg-background text-foreground'

export const DASHBOARD_RAIL_CLASS =
  'dashboard-rail flex h-full flex-col overflow-hidden bg-sidebar'

export const DASHBOARD_RAIL_NAV_CLASS =
  'dashboard-rail-nav min-h-0 flex-1 overflow-x-clip overflow-y-auto scrollbar-none py-3 px-2'

export const DASHBOARD_RAIL_FOOTER_CLASS =
  'dashboard-rail-footer shrink-0 border-t border-sidebar-border'

export const DASHBOARD_CANVAS_CLASS =
  'dashboard-canvas flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-x-clip bg-background'

export const DASHBOARD_MAIN_CLASS =
  'dashboard-canvas-scroll min-h-0 min-w-0 flex-1 overflow-x-clip overflow-y-auto p-3 sm:p-4 md:p-6'

export const DASHBOARD_GRID_CLASS =
  'grid min-w-0 w-full gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'

export const DASHBOARD_GRID_2_CLASS = 'grid min-w-0 w-full gap-4 md:grid-cols-2'

export const DASHBOARD_VIEWPORTS = [1440, 1280, 1024] as const
export const DASHBOARD_VIEWPORT_HEIGHTS = [800, 768] as const

function hasToken(className: string, token: string): boolean {
  return className.split(/\s+/).includes(token)
}

export function clipsCards(className: string): boolean {
  return (
    hasToken(className, 'overflow-y-auto') ||
    hasToken(className, 'overflow-y-scroll') ||
    hasToken(className, 'overflow-hidden') ||
    hasToken(className, 'overflow-x-hidden')
  )
}

export function canvasScrollsCards(className: string): boolean {
  return hasToken(className, 'overflow-y-auto') && hasToken(className, 'min-h-0')
}

export function railFooterPinned(className: string): boolean {
  return hasToken(className, 'shrink-0')
}
