/** Page chrome. Vertical scroll belongs to the document, not an inner pane. */
export const DASHBOARD_SHELL_CLASS =
  'dashboard-shell min-h-screen overflow-x-hidden bg-background text-foreground'

export const DASHBOARD_MAIN_CLASS = 'flex-1 min-w-0 p-3 sm:p-4 md:p-6'

function hasToken(className: string, token: string): boolean {
  return className.split(/\s+/).includes(token)
}

export function clipsCards(className: string): boolean {
  return (
    hasToken(className, 'overflow-y-auto') ||
    hasToken(className, 'overflow-y-scroll') ||
    hasToken(className, 'overflow-hidden')
  )
}

export function trapsViewport(className: string): boolean {
  return hasToken(className, 'h-screen') && hasToken(className, 'overflow-hidden')
}
