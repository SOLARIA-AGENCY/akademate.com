'use client'

import * as React from 'react'
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  CalendarDays,
  Users,
  UserCircle,
  Building2,
  DoorOpen,
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
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  MapPin,
  Shield,
  List,
  Lock,
  Briefcase,
  Monitor,
  Globe,
  FileInput,
  Eye,
  UserCog,
  CreditCard,
} from 'lucide-react'
import Link from 'next/link'
import NextImage from 'next/image'
import { usePathname } from 'next/navigation'
import { MenuItem } from '@/types'

// Menu structure with sections
// Section: null = no separator, 'CEP FORMACIÓN' or 'CEP COMUNICACIÓN' = show separator before item
interface MenuItemWithSection extends MenuItem {
  sectionBefore?: string
}

const menuItems: MenuItemWithSection[] = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    url: '/',
  },
  {
    title: 'Programación',
    icon: Calendar,
    url: '/programacion',
    sectionBefore: 'GESTIÓN ACADÉMICA',
  },
  {
    title: 'Planner Visual',
    icon: CalendarDays,
    url: '/planner',
  },
  {
    title: 'Cursos',
    icon: BookOpen,
    items: [
      { title: 'Todos los Cursos', icon: List, url: '/cursos' },
      { title: 'Cursos Privados', icon: Lock, url: '/cursos?tipo=privados' },
      { title: 'Cursos Ocupados', icon: Briefcase, url: '/cursos?tipo=ocupados' },
      { title: 'Cursos Desempleados', icon: Building2, url: '/cursos?tipo=desempleados' },
      { title: 'Cursos Teleformación', icon: Monitor, url: '/cursos?tipo=teleformacion' },
    ],
  },
  {
    title: 'Ciclos',
    icon: GraduationCap,
    items: [
      { title: 'Todos los Ciclos', icon: List, url: '/ciclos' },
      { title: 'Ciclo Medio', icon: GraduationCap, url: '/ciclos-medio' },
      { title: 'Ciclo Superior', icon: GraduationCap, url: '/ciclos-superior' },
    ],
  },
  {
    title: 'Sedes',
    icon: Building2,
    items: [
      { title: 'Todas las Sedes', icon: List, url: '/sedes' },
      { title: 'CEP Norte', icon: MapPin, url: '/sedes/cep-norte' },
      { title: 'CEP Santa Cruz', icon: MapPin, url: '/sedes/cep-santa-cruz' },
      { title: 'CEP Sur', icon: MapPin, url: '/sedes/cep-sur' },
    ],
  },
  {
    title: 'Personal',
    icon: Users,
    items: [
      { title: 'Profesores', icon: UserCircle, url: '/profesores' },
      { title: 'Administrativos', icon: UserPlus, url: '/administrativo' },
    ],
  },
  {
    title: 'Marketing',
    icon: Megaphone,
    sectionBefore: 'GESTIÓN COMERCIAL',
    items: [
      { title: 'Campañas', icon: Megaphone, url: '/campanas' },
      { title: 'Creatividades', icon: Sparkles, url: '/creatividades' },
    ],
  },
  {
    title: 'Leads e Inscripciones',
    icon: FileText,
    items: [
      { title: 'Leads', icon: FileText, url: '/leads' },
      { title: 'Matrículas', icon: UserPlus, url: '/matriculas' },
      { title: 'Lista de Espera', icon: ListTodo, url: '/lista-espera' },
    ],
  },
  {
    title: 'Contenido Web',
    icon: Globe,
    items: [
      {
        title: 'Cursos Publicados',
        icon: BookOpen,
        items: [
          { title: 'Todos los Cursos Web', icon: Globe, url: '/web/cursos' },
          { title: 'Privados Web', icon: Lock, url: '/web/cursos?tipo=privados' },
          { title: 'Ocupados Web', icon: Briefcase, url: '/web/cursos?tipo=ocupados' },
          {
            title: 'Desempleados Web',
            icon: Building2,
            url: '/web/cursos?tipo=desempleados',
          },
          { title: 'Teleformación Web', icon: Monitor, url: '/web/cursos?tipo=teleformacion' },
        ],
      },
      {
        title: 'Ciclos Publicados',
        icon: GraduationCap,
        items: [
          { title: 'Ciclo Medio Web', icon: GraduationCap, url: '/web/ciclos/medio' },
          { title: 'Ciclo Superior Web', icon: GraduationCap, url: '/web/ciclos/superior' },
        ],
      },
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
    title: 'Analíticas',
    icon: BarChart3,
    url: '/analiticas',
  },
  {
    title: 'Administración',
    icon: Shield,
    items: [
      { title: 'Usuarios', icon: Users, url: '/administracion/usuarios' },
      { title: 'Roles y Permisos', icon: Shield, url: '/administracion/roles' },
      { title: 'Impersonar Usuario', icon: UserCog, url: '/administracion/impersonar' },
      { title: 'Suscripción', icon: CreditCard, url: '/administracion/suscripcion' },
      { title: 'Registro de Actividad', icon: FileText, url: '/administracion/actividad' },
    ],
  },
  {
    title: 'Configuración',
    icon: Settings,
    items: [
      { title: 'General', icon: Settings, url: '/configuracion/general' },
      { title: 'Áreas de Estudio', icon: BookOpen, url: '/configuracion/areas' },
      { title: 'APIs y Webhooks', icon: Globe, url: '/configuracion/apis' },
      { title: 'Personalización', icon: Sparkles, url: '/configuracion/personalizacion' },
    ],
  },
]

interface SubMenuItemProps {
  subItem: MenuItem
  pathname: string
}

function SubMenuItem({ subItem, pathname }: SubMenuItemProps) {
  const [nestedOpen, setNestedOpen] = React.useState(false)
  const SubIcon = subItem.icon
  const isSubActive = pathname === subItem.url
  const hasNestedItems = subItem.items && subItem.items.length > 0

  if (hasNestedItems) {
    return (
      <>
        <button
          onClick={() => setNestedOpen(!nestedOpen)}
          className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <SubIcon className="h-4 w-4 shrink-0 text-foreground/70" />
          <span className="flex-1 text-left">{subItem.title}</span>
          <ChevronDown
            className={`h-3 w-3 transition-transform text-foreground/50 ${
              nestedOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
        {nestedOpen && (
          <ul className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-4">
            {subItem.items?.map((nestedItem) => {
              const NestedIcon = nestedItem.icon
              const isNestedActive = pathname === nestedItem.url
              return (
                <li key={nestedItem.title}>
                  <Link
                    href={nestedItem.url!}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                      isNestedActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : ''
                    }`}
                  >
                    <NestedIcon className="h-3 w-3 shrink-0 text-foreground/60" />
                    <span>{nestedItem.title}</span>
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
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
        isSubActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : ''
      }`}
    >
      <SubIcon className="h-4 w-4 shrink-0 text-foreground/70" />
      <span>{subItem.title}</span>
    </Link>
  )
}

interface AppSidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

export function AppSidebar({ isCollapsed = false, onToggle }: AppSidebarProps) {
  const pathname = usePathname()
  const [openSections, setOpenSections] = React.useState<string[]>([])
  const [logoUrl, setLogoUrl] = React.useState('/logos/cep-logo-alpha.png')
  const [academyName, setAcademyName] = React.useState('ACADEMIX')

  // Fetch logo config from API
  React.useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config?section=logos')
        if (response.ok) {
          const { data } = await response.json()
          setLogoUrl(data.claro || '/logos/cep-logo-alpha.png')
        }

        const academyResponse = await fetch('/api/config?section=academia')
        if (academyResponse.ok) {
          const { data } = await academyResponse.json()
          setAcademyName(data.nombre || 'ACADEMIX')
        }
      } catch (error) {
        console.error('Error fetching sidebar config:', error)
      }
    }
    fetchConfig()
  }, [])

  // Accordion behavior: only one section open at a time
  const toggleSection = (title: string) => {
    if (isCollapsed) return
    setOpenSections((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [title] // Only keep the new section open, close all others
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-card text-sidebar-foreground">
      {/* Header - Logo + Text - Smooth transition */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-4 overflow-hidden">
        <div className={`flex items-center w-full transition-all duration-300 ease-in-out ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          {/* White background wrapper for dark mode logo visibility */}
          <div className="w-9 h-9 rounded-md bg-white flex items-center justify-center flex-shrink-0 p-0.5">
            <NextImage
              src={logoUrl}
              alt={academyName}
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
            />
          </div>
          <span
            className={`text-lg font-semibold text-sidebar-foreground whitespace-nowrap transition-all duration-300 ease-in-out ${
              isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
            }`}
          >
            {academyName}
          </span>
        </div>
      </div>

      {/* Menu Content */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.url
            const hasSubItems = item.items && item.items.length > 0
            const isOpen = openSections.includes(item.title)

            // Section separator component - CEP Magenta color (#F2014B) with smooth transition
            const SectionSeparator = item.sectionBefore ? (
              <li className="pt-4 pb-2 overflow-hidden">
                <div className="relative flex items-center justify-center">
                  {/* Text label - fades out when collapsed */}
                  <span
                    className={`px-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300 ease-in-out ${
                      isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'
                    }`}
                    style={{ color: '#F2014B' }}
                  >
                    {item.sectionBefore}
                  </span>
                  {/* Line separator - fades in when collapsed */}
                  <div
                    className={`w-8 border-t transition-all duration-300 ease-in-out ${
                      isCollapsed ? 'opacity-100' : 'opacity-0 w-0'
                    }`}
                    style={{ borderColor: '#F2014B' }}
                  />
                </div>
              </li>
            ) : null

            if (!hasSubItems) {
              return (
                <React.Fragment key={item.title}>
                  {SectionSeparator}
                  <li>
                    <Link
                      href={item.url!}
                      className={`flex items-center rounded-md py-2 text-sm transition-all duration-300 ease-in-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                        isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''
                      } ${isCollapsed ? 'justify-center w-full' : 'gap-3 px-3'}`}
                      title={isCollapsed ? item.title : undefined}
                    >
                      <Icon className="h-5 w-5 shrink-0 text-foreground/80" />
                      <span
                        className={`whitespace-nowrap transition-all duration-300 ease-in-out ${
                          isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
                        }`}
                      >
                        {item.title}
                      </span>
                    </Link>
                  </li>
                </React.Fragment>
              )
            }

            return (
              <React.Fragment key={item.title}>
                {SectionSeparator}
                <li>
                  <button
                    onClick={() => toggleSection(item.title)}
                    className={`w-full flex items-center rounded-md py-2 text-sm transition-all duration-300 ease-in-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
                      isCollapsed ? 'justify-center' : 'gap-3 px-3'
                    }`}
                    title={isCollapsed ? item.title : undefined}
                  >
                    <Icon className="h-5 w-5 shrink-0 text-foreground/80" />
                    <span
                      className={`flex-1 text-left whitespace-nowrap transition-all duration-300 ease-in-out ${
                        isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
                      }`}
                    >
                      {item.title}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-all duration-300 ease-in-out ${
                        isOpen ? 'rotate-180' : ''
                      } ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'opacity-100'}`}
                    />
                  </button>
                  {/* Submenu with smooth height transition */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      !isCollapsed && isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <ul className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-4">
                      {item.items?.map((subItem) => (
                        <li key={subItem.title}>
                          <SubMenuItem subItem={subItem} pathname={pathname} />
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
      <div className="border-t border-sidebar-border mt-auto">
        {/* Toggle button row - At top of footer, centered when collapsed */}
        {onToggle && (
          <div className={`py-2 flex items-center border-b border-sidebar-border ${isCollapsed ? 'justify-center' : 'justify-end px-4'}`}>
            <button
              onClick={onToggle}
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-sidebar-accent transition-colors text-foreground/70"
              title={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>
        )}

        {/* Help Section - Always visible with smooth transitions */}
        <Link
          href="/ayuda"
          className={`flex items-center hover:bg-sidebar-accent transition-all duration-300 ease-in-out h-[46px] ${
            isCollapsed ? 'justify-center' : 'gap-3 px-4'
          }`}
          title={isCollapsed ? 'Ayuda y Documentación' : undefined}
        >
          <HelpCircle className="h-3.5 w-3.5 shrink-0 text-foreground/70" />
          <div
            className={`min-w-0 transition-all duration-300 ease-in-out ${
              isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'flex-1 opacity-100'
            }`}
          >
            <p className="text-sm text-muted-foreground truncate whitespace-nowrap">Ayuda y Documentación</p>
            <p className="text-xs text-muted-foreground/70 truncate whitespace-nowrap">Guías y soporte técnico</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
