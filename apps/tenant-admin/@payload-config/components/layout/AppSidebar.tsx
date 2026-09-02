'use client'

import * as React from 'react'
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  CalendarDays,
  Users,
  Building2,
  FileText,
  UserPlus,
  ListTodo,
  Megaphone,
  Sparkles,
  FileEdit,
  Newspaper,
  HelpCircle,
  MessageSquareQuote,
  Image,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Shield,
  Globe,
  FileInput,
  Eye,
  CreditCard,
  Award,
  School,
  Briefcase,
  Tag,
  Wallet,
  Receipt,
  Landmark,
  PiggyBank,
  HandCoins,
  ClipboardList,
  ScanLine,
  IdCard,
  Infinity,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MenuItem } from '@/types'
import { useTenantBranding } from '@/app/providers/tenant-branding'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from '../ui/sidebar'

export const SIDEBAR_SUBNAV_ICON_CLASS = 'h-4 w-4'
/** 1px primary tree. The active pill sits on this same axis, not inset. */
export const SIDEBAR_SUBNAV_TREE_CLASS = 'border-l border-l-[1px] border-primary'
export const SIDEBAR_SUBNAV_EXPANDED_LIST_CLASS =
  'relative ml-4 mt-0.5 space-y-0.5 pl-0 border-l border-l-[1px] border-primary'
export const SIDEBAR_SUBNAV_INDICATOR_CLASS =
  'pointer-events-none absolute top-1/2 left-0 z-[1] h-5 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary'
export const SIDEBAR_NAV_INDICATOR_CLASS =
  'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-primary'

function SidebarActiveBar({
  active,
  collapsedHidden = false,
  onRail = false,
}: {
  active: boolean
  collapsedHidden?: boolean
  onRail?: boolean
}) {
  return (
    <span
      data-slot={onRail ? 'sidebar-subnav-indicator' : 'sidebar-active-bar'}
      className={`transition-opacity duration-200 ${
        onRail ? SIDEBAR_SUBNAV_INDICATOR_CLASS : SIDEBAR_NAV_INDICATOR_CLASS
      } ${
        collapsedHidden
          ? 'opacity-0'
          : active
            ? 'opacity-100'
            : onRail
              ? 'opacity-0'
              : 'opacity-0 group-hover:opacity-100'
      }`}
    />
  )
}

// Menu structure with sections
// Section: null = no separator, otherwise show separator before item.
interface MenuItemWithSection extends MenuItem {
  sectionBefore?: string
}

const menuItems: MenuItemWithSection[] = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    url: '/dashboard',
  },
  {
    title: 'Programación',
    icon: Calendar,
    url: '/programacion',
    sectionBefore: 'ACADÉMICO',
  },
  {
    title: 'Planner Visual',
    icon: CalendarDays,
    url: '/planner',
  },
  {
    title: 'Cursos',
    icon: BookOpen,
    url: '/dashboard/cursos',
  },
  {
    title: 'Ciclos',
    icon: GraduationCap,
    url: '/dashboard/ciclos',
  },
  {
    title: 'Formación continua',
    icon: Infinity,
    url: '/dashboard/formacion-continua',
  },
  {
    title: 'Sedes',
    icon: Building2,
    url: '/dashboard/sedes',
  },
  {
    title: 'Alumnos',
    icon: School,
    url: '/dashboard/alumnos',
  },
  {
    title: 'Matriculacion',
    icon: UserPlus,
    items: [
      { title: 'Solicitudes', icon: ClipboardList, url: '/matriculas' },
      { title: 'Nueva matrícula', icon: UserPlus, url: '/matriculas/nueva' },
      { title: 'Planes y tarifas', icon: CreditCard, url: '/matriculas/planes' },
      { title: 'Tarifas de acceso', icon: Wallet, url: '/matriculas/tarifas-acceso' },
    ],
  },
  {
    title: 'Accesos',
    icon: ScanLine,
    items: [
      { title: 'Recepción', icon: ScanLine, url: '/accesos/recepcion' },
      { title: 'Pases', icon: IdCard, url: '/accesos/pases' },
      { title: 'Histórico', icon: ClipboardList, url: '/accesos/historico' },
    ],
  },
  {
    title: 'Personal',
    icon: Users,
    sectionBefore: 'PERSONAL',
    items: [
      { title: 'Profesores', icon: GraduationCap, url: '/dashboard/profesores' },
      { title: 'Administrativos', icon: Briefcase, url: '/dashboard/personal/administrativos' },
    ],
  },
  {
    title: 'Campus Virtual',
    icon: GraduationCap,
    sectionBefore: 'CAMPUS VIRTUAL',
    items: [
      { title: 'Vista General Campus', icon: LayoutDashboard, url: '/campus-virtual' },
      { title: 'Inscripciones LMS', icon: UserPlus, url: '/campus-virtual/inscripciones' },
      { title: 'Progreso Alumnos', icon: BarChart3, url: '/campus-virtual/progreso' },
      { title: 'Módulos y Lecciones', icon: BookOpen, url: '/campus-virtual/contenido' },
      { title: 'Certificados', icon: Award, url: '/campus-virtual/certificados' },
    ],
  },
  {
    title: 'Marketing',
    icon: Megaphone,
    sectionBefore: 'MARKETING',
    items: [
      { title: 'Campañas', icon: Megaphone, url: '/campanas' },
      { title: 'Creatividades', icon: Sparkles, url: '/marketing/creatividades' },
      { title: 'Leads', icon: FileText, url: '/leads' },
      { title: 'Inscripciones', icon: UserPlus, url: '/inscripciones' },
      { title: 'Lista de Espera', icon: ListTodo, url: '/lista-espera' },
      { title: 'Calendario citas', icon: CalendarDays, url: '/calendario-citas' },
      { title: 'Analíticas', icon: BarChart3, url: '/marketing/analiticas' },
    ],
  },
  {
    title: 'Web',
    icon: Globe,
    sectionBefore: 'WEB',
    items: [
      { title: 'Analíticas', icon: BarChart3, url: '/web/analiticas' },
      { title: 'Cursos', icon: BookOpen, url: '/web/cursos' },
      { title: 'Ciclos', icon: GraduationCap, url: '/web/ciclos' },
      { title: 'Convocatorias', icon: Calendar, url: '/web/convocatorias' },
      { title: 'Noticias/Blog', icon: Newspaper, url: '/contenido/blog' },
      { title: 'Páginas', icon: FileEdit, url: '/contenido/paginas' },
      { title: 'FAQs', icon: HelpCircle, url: '/contenido/faqs' },
      {
        title: 'Testimonios',
        icon: MessageSquareQuote,
        url: '/contenido/testimonios',
      },
      { title: 'Formularios', icon: FileInput, url: '/contenido/formularios' },
      { title: 'Medios', icon: Image, url: '/contenido/medios' },
      { title: 'Visitantes', icon: Eye, url: '/contenido/visitantes' },
    ],
  },
  {
    title: 'Finanzas',
    icon: Landmark,
    sectionBefore: 'FINANZAS',
    upcoming: true,
    items: [
      { title: 'Resumen Financiero', icon: Wallet, url: '/finanzas', upcoming: true },
      { title: 'Cobros y Pagos', icon: HandCoins, url: '/finanzas/cobros-pagos', upcoming: true },
      { title: 'Facturacion', icon: Receipt, url: '/finanzas/facturacion', upcoming: true },
      { title: 'Nominas y Costes', icon: PiggyBank, url: '/finanzas/nominas', upcoming: true },
      { title: 'Informes', icon: ClipboardList, url: '/finanzas/informes', upcoming: true },
    ],
  },
  {
    title: 'Administración',
    icon: Shield,
    sectionBefore: 'ADMINISTRACIÓN',
    items: [
      { title: 'Usuarios', icon: Users, url: '/administracion/usuarios' },
      { title: 'Roles y Permisos', icon: Shield, url: '/administracion/roles' },
      { title: 'Areas de Estudio', icon: BookOpen, url: '/administracion/areas-estudio' },
      { title: 'Tipos de Estudio', icon: Tag, url: '/administracion/tipos-estudio' },
      { title: 'Historial', icon: FileText, url: '/administracion/historial' },
      { title: 'Suscripción', icon: CreditCard, url: '/administracion/suscripcion' },
      { title: 'Registro de Actividad', icon: FileText, url: '/administracion/actividad' },
    ],
  },
  {
    title: 'Configuración',
    icon: Settings,
    url: '/configuracion',
    sectionBefore: 'CONFIGURACIÓN',
  },
]

interface SubMenuItemProps {
  subItem: MenuItem
  pathname: string
  currentSearch: string
  isCollapsed?: boolean
}

function SubMenuItem({ subItem, pathname, currentSearch, isCollapsed = false }: SubMenuItemProps) {
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
        <button
          onClick={() => setNestedOpen(!nestedOpen)}
          className={`group relative flex items-center gap-2 rounded-md text-sm transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
            isCollapsed ? 'h-10 w-10 justify-center px-0' : 'w-full px-3 py-2'
          } ${hasActiveNestedChild ? 'bg-sidebar-accent/50' : ''}`}
          title={isCollapsed ? subItem.title : undefined}
          data-oid="7nvqr6:"
        >
          <SidebarActiveBar active={hasActiveNestedChild} collapsedHidden={isCollapsed} onRail={!isCollapsed} />

          <SubIcon className={`${SIDEBAR_SUBNAV_ICON_CLASS} shrink-0 text-foreground/70`} data-oid="z:_3-_d" />
          {!isCollapsed && (
            <span className="flex-1 text-left" data-oid="68y.1:a">
              {subItem.title}
            </span>
          )}
          {!isCollapsed && (
            <ChevronDown
              className={`h-3 w-3 transition-transform text-foreground/50 ${
                nestedOpen || hasActiveNestedChild ? 'rotate-180' : ''
              }`}
              data-oid="wu7sv:t"
            />
          )}
        </button>
        {(nestedOpen || hasActiveNestedChild) && (
          <ul
            className={SIDEBAR_SUBNAV_EXPANDED_LIST_CLASS}
            data-oid="s6p7k8q"
          >
            {subItem.items?.map((nestedItem) => {
              const NestedIcon = nestedItem.icon
              const isNestedActive = matchesUrl(nestedItem.url)
              return (
                <li key={nestedItem.title} data-oid="h6eshm5">
                  <Link
                    href={nestedItem.url!}
                    className={`group relative flex items-center gap-2 rounded-md text-sm transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                      isCollapsed ? 'h-10 w-10 justify-center px-0' : 'px-3 py-2'
                    } ${
                      isNestedActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                        : ''
                    }`}
                    title={isCollapsed ? nestedItem.title : undefined}
                    data-oid="edf83fk"
                  >
                    <SidebarActiveBar active={isNestedActive} collapsedHidden={isCollapsed} onRail />

                    <NestedIcon
                      className={`${SIDEBAR_SUBNAV_ICON_CLASS} shrink-0 text-foreground/60`}
                      data-oid="67suuti"
                    />

                    {!isCollapsed && <span data-oid="1qqeq:e">{nestedItem.title}</span>}
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
      className={`group relative flex items-center gap-2 rounded-md text-sm transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
        isCollapsed ? 'h-10 w-10 justify-center px-0' : 'px-3 py-2'
      } ${isSubActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : ''}`}
      title={isCollapsed ? subItem.title : undefined}
      data-oid="b-5u9jo"
    >
      <SidebarActiveBar active={isSubActive} collapsedHidden={false} onRail />

      <SubIcon className={`${SIDEBAR_SUBNAV_ICON_CLASS} shrink-0 ${subItem.upcoming ? 'text-muted-foreground/40' : 'text-foreground/70'}`} data-oid=":he6p21" />
      {!isCollapsed && (
        <span className={subItem.upcoming ? 'italic text-muted-foreground/60' : ''} data-oid="-wiel.j">{subItem.title}</span>
      )}
    </Link>
  )
}

interface AppSidebarProps {
  isCollapsed?: boolean
}

export function AppSidebar({ isCollapsed: collapsedProp }: AppSidebarProps = {}) {
  const pathname = usePathname()
  const { state, isMobile } = useSidebar()
  const isCollapsed = collapsedProp ?? (!isMobile && state === 'collapsed')
  // Usamos window.location.search en el cliente para evitar useSearchParams
  // (que requeriría <Suspense> en cada página del árbol)
  const [currentSearch, setCurrentSearch] = React.useState('')
  const [openSections, setOpenSections] = React.useState<string[]>([])
  const { branding } = useTenantBranding()
  const academyName = branding.academyName
  // Menu items used directly (Sedes is a simple link to /sedes)
  const dynamicMenuItems: MenuItemWithSection[] = menuItems

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
    const next = activeParent ? [activeParent.title] : []
    setOpenSections((prev) =>
      prev.length === next.length && prev.every((title, index) => title === next[index])
        ? prev
        : next,
    )
  }, [pathname, currentSearch, isUrlActive])

  // Accordion: click only. Hover must not open sections.
  const toggleSection = (title: string) => {
    setOpenSections(
      (prev) => (prev.includes(title) ? prev.filter((item) => item !== title) : [title])
    )
  }

  const topLevelBaseClass = isCollapsed
    ? 'mx-auto h-10 w-10 justify-center px-0'
    : 'w-full gap-3 px-3'

  const topLevelInteractionClass =
    'transition-all duration-200 ease-in-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-0'

  return (
    <Sidebar collapsible="icon" className="overflow-hidden border-sidebar-border bg-transparent">
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden bg-transparent text-sidebar-foreground"
      data-oid="itwxk4a"
    >
      <SidebarHeader className="shrink-0 p-0">
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
      </SidebarHeader>

      <SidebarContent className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
      <nav className="py-3 px-2" data-oid=".42vml6">
        <ul className="space-y-1.5" data-oid=":9jwylk">
          {dynamicMenuItems.map((item) => {
            const Icon = item.icon
            const isActive =
              typeof item.url === 'string' &&
              (pathname === item.url || pathname.startsWith(`${item.url}/`))
            const hasSubItems = item.items && item.items.length > 0
            const isOpen = openSections.includes(item.title)

            // Section separator component using active tenant primary color.
            const SectionSeparator = item.sectionBefore ? (
              <li className="pt-4 pb-1 overflow-hidden" data-oid="dza5ht_">
                {isCollapsed ? (
                  <div className="flex justify-center">
                    <div
                      className="w-6 border-t"
                      style={{ borderColor: 'hsl(var(--primary) / 0.45)' }}
                      data-oid="r19606h"
                    />
                  </div>
                ) : (
                  <span
                    className="block px-3 text-[10px] font-bold uppercase tracking-[0.16em] whitespace-nowrap"
                    style={{ color: 'hsl(var(--primary))' }}
                    data-oid="im22q2t"
                  >
                    {item.sectionBefore}
                  </span>
                )}
              </li>
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
                      <SidebarActiveBar
                        active={isActive}
                        collapsedHidden={isCollapsed && !isActive}
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

            return (
              <React.Fragment key={item.title}>
                {SectionSeparator}
                <li data-oid="mup0i0h">
                  <button
                    onClick={() => toggleSection(item.title)}
                    className={`group relative flex items-center rounded-md py-2 text-sm ${topLevelInteractionClass} ${
                      hasActiveChild && !isCollapsed ? 'bg-sidebar-accent/60' : ''
                    } ${topLevelBaseClass}`}
                    title={isCollapsed ? item.title : undefined}
                    data-oid="47oydbm"
                  >
                    <SidebarActiveBar
                      active={hasActiveChild}
                      collapsedHidden={isCollapsed}
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
                    {!isCollapsed && (
                      isOpen ? (
                        <ChevronDown className="h-4 w-4 shrink-0" data-oid="h6d1idw" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0" data-oid="h6d1idw" />
                      )
                    )}
                  </button>
                  {/* Submenu with smooth height transition */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                    data-oid="33l6zag"
                  >
                    {isCollapsed ? (
                      isOpen ? (
                      <div className="mx-auto mt-0.5 w-11 min-w-0 overflow-hidden">
                        <ul
                          data-slot="sidebar-collapsed-subnav"
                          className={`space-y-0.5 ${SIDEBAR_SUBNAV_TREE_CLASS}`}
                        >
                          {item.items?.map((subItem) => (
                            <li key={subItem.title}>
                              <SubMenuItem
                                subItem={subItem}
                                pathname={pathname}
                                currentSearch={currentSearch}
                                isCollapsed={isCollapsed}
                              />
                            </li>
                          ))}
                        </ul>
                      </div>
                      ) : null
                    ) : (
                    <ul
                      data-slot="sidebar-subnav"
                      className={SIDEBAR_SUBNAV_EXPANDED_LIST_CLASS}
                      data-oid="fu19cwt"
                    >
                      {item.items?.map((subItem) => (
                        <li key={subItem.title} data-oid="w740los">
                          <SubMenuItem
                            subItem={subItem}
                            pathname={pathname}
                            currentSearch={currentSearch}
                            isCollapsed={isCollapsed}
                            data-oid="wgazwdi"
                          />
                        </li>
                      ))}
                    </ul>
                    )}
                  </div>
                </li>
              </React.Fragment>
            )
          })}
        </ul>
      </nav>
      </SidebarContent>

      <SidebarFooter className="shrink-0 p-0">
      <div className="border-t border-sidebar-border mt-auto" data-oid="df5f9o3">
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
      </SidebarFooter>
    </div>
    </Sidebar>
  )
}
