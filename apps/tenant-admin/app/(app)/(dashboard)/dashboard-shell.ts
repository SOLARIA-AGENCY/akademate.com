/** Page chrome. Vertical scroll belongs to the document, not an inner pane. */
export const DASHBOARD_SHELL_CLASS = 'dashboard-shell min-h-screen min-w-0 bg-background text-foreground'

export const DASHBOARD_MAIN_CLASS = 'flex-1 min-w-0 p-3 sm:p-4 md:p-6'

export const DASHBOARD_GRID_CLASS =
  'grid min-w-0 w-full gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'

export const DASHBOARD_GRID_2_CLASS = 'grid min-w-0 w-full gap-4 md:grid-cols-2'

export const DASHBOARD_VIEWPORTS = [1440, 1024, 768] as const

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

export function trapsViewport(className: string): boolean {
  return hasToken(className, 'h-screen') && hasToken(className, 'overflow-hidden')
}

export function createsInnerVerticalScroll(className: string): boolean {
  return (
    hasToken(className, 'overflow-y-auto') ||
    hasToken(className, 'overflow-y-scroll') ||
    hasToken(className, 'overflow-auto') ||
    hasToken(className, 'overflow-x-hidden')
  )
}
