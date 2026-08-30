/** Outer dashboard grid. Color comes from TenantBranding `--sidebar`, never a host hex. */
export const DASHBOARD_SHELL_LOCKED_CLASS =
  'dashboard-shell flex h-dvh overflow-hidden bg-[hsl(var(--sidebar))] text-foreground overscroll-none'

export const DASHBOARD_RAIL_LOCKED_CLASS =
  'fixed left-0 top-0 z-40 h-dvh bg-transparent border-r border-sidebar-border transition-all duration-300'

export const DASHBOARD_CANVAS_LOCKED_CLASS =
  'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[hsl(var(--dashboard-canvas))] text-foreground transition-all duration-300 md:mb-3 md:mr-3 md:mt-3 md:rounded-xl'
