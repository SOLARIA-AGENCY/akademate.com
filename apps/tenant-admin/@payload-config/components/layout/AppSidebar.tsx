'use client'

import * as React from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTenantBranding } from '@/app/providers/tenant-branding'
import { visibleNavigationForRole, type DashboardNavigationItem } from '@/lib/navigation/dashboard'
import {
  DashboardSidebarGroup,
  DashboardSidebarUpcomingBadge,
} from '../akademate/dashboard/DashboardSidebar'
import { Button } from '@payload-config/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@payload-config/components/ui/dropdown-menu'

interface SubMenuItemProps {
  subItem: DashboardNavigationItem
  pathname: string
  currentSearch: string
}

function SubMenuItem({ subItem, pathname, currentSearch }: SubMenuItemProps) {
  const [nestedOpen, setNestedOpen] = React.useState(false)
  const SubIcon = subItem.icon
  const hasNestedItems = subItem.items && subItem.items.length > 0

  // Compara pathname + query params exactos para determinar item activo
  const matchesUrl = React.useCallback(
    (url: string | undefined): boolean => {
      if (!url) return false
      const [base, query] = url.split('?')
      if (pathname !== base) return false
      if (!query) return true
      const currentParams = new URLSearchParams(currentSearch)
      const targetParams = new URLSearchParams(query)
      for (const [key, value] of targetParams.entries()) {
        if (currentParams.get(key) !== value) return false
      }
      return true
    },
    [pathname, currentSearch]
  )

  const isSubActive = matchesUrl(subItem.url)

  if (hasNestedItems) {
    const hasActiveNestedChild = subItem.items?.some((n) => matchesUrl(n.url)) ?? false
    return (
      <>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setNestedOpen(!nestedOpen)}
          aria-expanded={nestedOpen || hasActiveNestedChild}
          className={`group relative w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
            hasActiveNestedChild ? 'bg-sidebar-accent/50' : ''
          }`}
          data-oid="7nvqr6:"
        >
          <span
            className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-primary transition-opacity duration-200 ${
              hasActiveNestedChild ? 'opacity-60' : 'opacity-0 group-hover:opacity-100'
            }`}
            data-oid="bspggu-"
          />

          <SubIcon className="h-4 w-4 shrink-0 text-foreground/70" data-oid="z:_3-_d" />
          <span className="flex-1 text-left" data-oid="68y.1:a">
            {subItem.title}
          </span>
          <ChevronDown
            className={`h-3 w-3 transition-transform text-foreground/50 ${
              nestedOpen || hasActiveNestedChild ? 'rotate-180' : ''
            }`}
            data-oid="wu7sv:t"
          />
        </Button>
        {(nestedOpen || hasActiveNestedChild) && (
          <ul
            className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-4"
            data-oid="s6p7k8q"
          >
            {subItem.items?.map((nestedItem) => {
              const NestedIcon = nestedItem.icon
              const isNestedActive = matchesUrl(nestedItem.url)
              return (
                <li key={nestedItem.title} data-oid="h6eshm5">
                  <Link
                    href={nestedItem.url!}
                    className={`group relative flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                      isNestedActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                        : ''
                    }`}
                    data-oid="edf83fk"
                  >
                    <span
                      className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-primary transition-opacity duration-200 ${
                        isNestedActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      data-oid="62xhu-b"
                    />

                    <NestedIcon
                      className="h-3 w-3 shrink-0 text-foreground/60"
                      data-oid="67suuti"
                    />

                    <span data-oid="1qqeq:e">{nestedItem.title}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </>
    )
  }

  return (
    <Link
      href={subItem.url!}
      className={`group relative flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
        isSubActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : ''
      }`}
      data-oid="b-5u9jo"
    >
      <span
        className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-primary transition-opacity duration-200 ${
          isSubActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        data-oid="c:6sgov"
      />

      <SubIcon
        className={`h-4 w-4 shrink-0 ${subItem.upcoming ? 'text-muted-foreground/40' : 'text-foreground/70'}`}
        data-oid=":he6p21"
      />
      <span
        className={subItem.upcoming ? 'italic text-muted-foreground/60' : ''}
        data-oid="-wiel.j"
      >
        {subItem.title}
      </span>
      {subItem.upcoming ? <DashboardSidebarUpcomingBadge className="ml-auto" /> : null}
    </Link>
  )
}

interface AppSidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
  /** Role projection for navigation only; server authorization remains authoritative. */
  role: string | null
}

export function AppSidebar({ isCollapsed = false, onToggle, role }: AppSidebarProps) {
  const pathname = usePathname()
  // Usamos window.location.search en el cliente para evitar useSearchParams
  // (que requeriría <Suspense> en cada página del árbol)
  const [currentSearch, setCurrentSearch] = React.useState('')
  const [openSections, setOpenSections] = React.useState<string[]>([])
  const { branding } = useTenantBranding()
  const academyName = branding.academyName
  // Navigation is shared with the layout shortcuts and filtered by the
  // authenticated role. This projection never replaces server authorization.
  const dynamicMenuItems = React.useMemo(() => visibleNavigationForRole(role), [role])

  // Sincroniza el search string cuando cambia la ruta
  React.useEffect(() => {
    setCurrentSearch(typeof window !== 'undefined' ? window.location.search : '')
  }, [pathname])

  // Compara pathname + query params exactos (sin useSearchParams)
  const isUrlActive = React.useCallback(
    (url: string | undefined): boolean => {
      if (!url) return false
      const [base, query] = url.split('?')
      if (pathname !== base && !pathname.startsWith(`${base}/`)) return false
      if (!query) return true
      const currentParams = new URLSearchParams(currentSearch)
      const targetParams = new URLSearchParams(query)
      for (const [key, value] of targetParams.entries()) {
        if (currentParams.get(key) !== value) return false
      }
      return true
    },
    [pathname, currentSearch]
  )

  React.useEffect(() => {
    const activeParent = dynamicMenuItems.find(
      (item) =>
        item.items?.some((subItem) => {
          if (subItem.items?.length) {
            return subItem.items.some((nested) => isUrlActive(nested.url))
          }
          return isUrlActive(subItem.url)
        }) ?? false
    )
    if (activeParent) {
      setOpenSections([activeParent.title])
    }
  }, [pathname, currentSearch, isUrlActive])

  // Accordion behavior: only one section open at a time
  const toggleSection = (title: string) => {
    if (isCollapsed) return
    setOpenSections(
      (prev) => (prev.includes(title) ? prev.filter((item) => item !== title) : [title]) // Only keep the new section open, close all others
    )
  }

  const topLevelBaseClass = isCollapsed
    ? 'mx-auto h-10 w-10 justify-center px-0'
    : 'w-full gap-3 px-3'

  const topLevelInteractionClass =
    'transition-all duration-200 ease-in-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-0'

  const renderCollapsedSubmenu = (
    item: DashboardNavigationItem,
    Icon: React.ElementType,
    hasActiveChild: boolean
  ) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={`group relative flex items-center rounded-md py-2 text-sm ${topLevelInteractionClass} ${
            hasActiveChild ? 'bg-sidebar-accent/60' : ''
          } ${topLevelBaseClass}`}
          title={item.title}
          aria-label={item.title}
        >
          <Icon
            className={`h-5 w-5 shrink-0 ${item.upcoming ? 'text-muted-foreground/40' : 'text-foreground/80'}`}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" sideOffset={10} className="w-60">
        <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {item.items?.map((subItem) => {
          const SubIcon = subItem.icon
          const hasNestedItems = subItem.items && subItem.items.length > 0
          if (hasNestedItems) {
            return (
              <React.Fragment key={subItem.title}>
                <DropdownMenuLabel className="px-2 py-1.5 text-xs text-muted-foreground">
                  {subItem.title}
                </DropdownMenuLabel>
                {subItem.items?.map((nestedItem) => {
                  const NestedIcon = nestedItem.icon
                  return (
                    <DropdownMenuItem key={nestedItem.title} asChild>
                      <Link href={nestedItem.url!} className="flex items-center gap-2">
                        <NestedIcon className="h-4 w-4" />
                        {nestedItem.title}
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
              </React.Fragment>
            )
          }

          return (
            <DropdownMenuItem key={subItem.title} asChild>
              <Link href={subItem.url!} className="flex items-center gap-2">
                <SubIcon className="h-4 w-4" />
                {subItem.title}
              </Link>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div
      className="flex h-full flex-col overflow-hidden bg-card text-sidebar-foreground"
      data-oid="itwxk4a"
    >
      {/* Header - Logo + Text - Smooth transition */}
      {/* Header - Logo fijo h-14, nunca cambia */}
      <div
        className="flex h-14 items-center border-b border-sidebar-border px-3 overflow-hidden"
        data-oid="woefz9o"
      >
        <div
          className={`flex items-center w-full transition-all duration-300 ease-in-out ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}
          data-oid="opzrczc"
        >
          {/* Logo — visible siempre, usa branding si disponible */}
          <img
            src={branding.logos.principal || branding.logos.favicon}
            alt={academyName}
            className="h-8 w-8 flex-shrink-0 rounded object-contain"
            title={isCollapsed ? academyName : undefined}
          />

          {/* Nombre academia — solo en expanded */}
          {!isCollapsed && (
            <span className="font-bold text-base tracking-tight text-sidebar-foreground truncate select-none uppercase">
              {academyName}
            </span>
          )}
        </div>
      </div>

      {/* Menu Content */}
      <nav
        aria-label="Navegación principal"
        className="flex-1 overflow-y-auto py-3 px-2"
        data-oid=".42vml6"
      >
        <ul className="space-y-1.5" data-oid=":9jwylk">
          {dynamicMenuItems.map((item) => {
            const Icon = item.icon
            const isActive =
              typeof item.url === 'string' &&
              (pathname === item.url ||
                (item.title !== 'Dashboard' && pathname.startsWith(`${item.url}/`)))
            const hasSubItems = item.items && item.items.length > 0
            const isOpen = openSections.includes(item.title)

            // Section separator component using active tenant primary color.
            const SectionSeparator = item.sectionBefore ? (
              <DashboardSidebarGroup label={item.sectionBefore} collapsed={isCollapsed} />
            ) : null

            if (!hasSubItems) {
              return (
                <React.Fragment key={item.title}>
                  {SectionSeparator}
                  <li data-oid="3omo4hp">
                    <Link
                      href={item.url!}
                      className={`group relative flex items-center rounded-md py-2 text-sm ${topLevelInteractionClass} ${
                        isActive ? `bg-sidebar-accent text-sidebar-accent-foreground` : ''
                      } ${topLevelBaseClass}`}
                      title={isCollapsed ? item.title : undefined}
                      data-oid="5zqti0j"
                    >
                      <span
                        className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-primary transition-opacity duration-200 ${
                          isActive
                            ? 'opacity-100'
                            : isCollapsed
                              ? 'opacity-0'
                              : 'opacity-0 group-hover:opacity-100'
                        }`}
                        data-oid="odmyz7h"
                      />

                      <Icon
                        className="h-5 w-5 shrink-0 text-foreground/80 group-hover:text-foreground"
                        data-oid="vtc2v7g"
                      />

                      <span
                        className={`whitespace-nowrap transition-all duration-300 ease-in-out ${
                          isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
                        }`}
                        data-oid="lg_g2_t"
                      >
                        {item.title}
                      </span>
                      {!isCollapsed && item.upcoming ? <DashboardSidebarUpcomingBadge /> : null}
                    </Link>
                  </li>
                </React.Fragment>
              )
            }

            // El padre solo se resalta si tiene un hijo con la ruta activa
            const hasActiveChild =
              item.items?.some((subItem) => {
                if (subItem.items?.length) {
                  return subItem.items.some((nested) => isUrlActive(nested.url))
                }
                return isUrlActive(subItem.url)
              }) ?? false

            if (isCollapsed) {
              return (
                <React.Fragment key={item.title}>
                  {SectionSeparator}
                  <li data-oid="mup0i0h">{renderCollapsedSubmenu(item, Icon, hasActiveChild)}</li>
                </React.Fragment>
              )
            }

            return (
              <React.Fragment key={item.title}>
                {SectionSeparator}
                <li data-oid="mup0i0h">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => toggleSection(item.title)}
                    aria-expanded={isOpen}
                    className={`group relative flex items-center rounded-md py-2 text-sm ${topLevelInteractionClass} ${
                      hasActiveChild && !isCollapsed ? 'bg-sidebar-accent/60' : ''
                    } ${topLevelBaseClass}`}
                    title={isCollapsed ? item.title : undefined}
                    data-oid="47oydbm"
                  >
                    <span
                      className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-primary transition-opacity duration-200 ${
                        isCollapsed
                          ? 'opacity-0'
                          : hasActiveChild
                            ? 'opacity-70'
                            : 'opacity-0 group-hover:opacity-100'
                      }`}
                      data-oid="lc-q44:"
                    />

                    <Icon
                      className={`h-5 w-5 shrink-0 ${item.upcoming ? 'text-muted-foreground/40' : 'text-foreground/80'}`}
                      data-oid="o_-brke"
                    />

                    <span
                      className={`whitespace-nowrap transition-all duration-300 ease-in-out ${
                        isCollapsed
                          ? 'w-0 opacity-0 overflow-hidden'
                          : 'flex-1 w-auto opacity-100 text-left'
                      } ${item.upcoming ? 'italic text-muted-foreground/60' : ''}`}
                      data-oid="eg9lgi8"
                    >
                      {item.title}
                    </span>
                    {!isCollapsed && item.upcoming ? <DashboardSidebarUpcomingBadge /> : null}
                    {!isCollapsed && (
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-180' : ''}`}
                        data-oid="h6d1idw"
                      />
                    )}
                  </Button>
                  {/* Submenu with smooth height transition */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      !isCollapsed && isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                    data-oid="33l6zag"
                  >
                    <ul
                      className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-4"
                      data-oid="fu19cwt"
                    >
                      {item.items?.map((subItem) => (
                        <li key={subItem.title} data-oid="w740los">
                          <SubMenuItem
                            subItem={subItem}
                            pathname={pathname}
                            currentSearch={currentSearch}
                            data-oid="wgazwdi"
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              </React.Fragment>
            )
          })}
        </ul>
      </nav>

      {/* Footer - Always Visible */}
      <div className="border-t border-sidebar-border mt-auto" data-oid="df5f9o3">
        {/* Toggle button row - At top of footer, centered when collapsed */}
        {onToggle && (
          <div
            className={`py-2 flex items-center border-b border-sidebar-border ${isCollapsed ? 'justify-center' : 'justify-end px-4'}`}
            data-oid="374s6jy"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onToggle}
              aria-label={isCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-sidebar-accent transition-colors text-foreground/70"
              title={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
              data-oid=".6.qflx"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" data-oid="elvi31c" />
              ) : (
                <ChevronLeft className="h-4 w-4" data-oid="0bu6x7h" />
              )}
            </Button>
          </div>
        )}

        {/* Help Section - Always visible with smooth transitions */}
        <Link
          href="/ayuda"
          className={`flex items-center hover:bg-sidebar-accent transition-all duration-300 ease-in-out h-12 ${
            isCollapsed ? 'justify-center' : 'gap-3 px-3'
          }`}
          title={isCollapsed ? 'Ayuda y Documentación' : undefined}
          data-oid="yyqlipb"
        >
          <HelpCircle className="h-4 w-4 shrink-0 text-foreground/70" data-oid="jhy3iek" />
          <div
            className={`min-w-0 transition-all duration-300 ease-in-out ${
              isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'flex-1 opacity-100'
            }`}
            data-oid="1rnn:zw"
          >
            <p
              className="text-sm text-muted-foreground truncate whitespace-nowrap"
              data-oid="10c0ke6"
            >
              Ayuda y Documentación
            </p>
            <p
              className="text-xs text-muted-foreground/70 truncate whitespace-nowrap"
              data-oid=":jyoxpo"
            >
              Guías y soporte técnico
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}
