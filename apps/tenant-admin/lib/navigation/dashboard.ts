import type { LucideIcon } from 'lucide-react'
import {
  Award,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Eye,
  FileEdit,
  FileInput,
  FileText,
  Globe,
  GraduationCap,
  HandCoins,
  HelpCircle,
  Image,
  Landmark,
  LayoutDashboard,
  ListTodo,
  Megaphone,
  MessageSquareQuote,
  Newspaper,
  PiggyBank,
  Receipt,
  School,
  Settings,
  Shield,
  Sparkles,
  Tag,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react'
import { hasMinimumRole, ROLE_HIERARCHY, type Role, ROLES } from '@/src/access/roles'

export type DashboardNavigationItem = {
  title: string
  icon: LucideIcon
  url?: string
  items?: DashboardNavigationItem[]
  sectionBefore?: string
  upcoming?: boolean
  requiredRole?: Role
}

/**
 * Single source of truth for the dashboard shell and its global shortcuts.
 * This is a navigation projection only; route/API authorization remains
 * server-side and must never rely on this list.
 */
export const dashboardNavigation: DashboardNavigationItem[] = [
  { title: 'Dashboard', icon: LayoutDashboard, url: '/dashboard', requiredRole: ROLES.LECTURA },
  {
    title: 'Programación',
    icon: Calendar,
    url: '/programacion',
    sectionBefore: 'GESTIÓN ACADÉMICA',
    requiredRole: ROLES.GESTOR,
  },
  { title: 'Planner Visual', icon: CalendarDays, url: '/planner', requiredRole: ROLES.GESTOR },
  { title: 'Cursos', icon: BookOpen, url: '/dashboard/cursos', requiredRole: ROLES.GESTOR },
  { title: 'Ciclos', icon: GraduationCap, url: '/dashboard/ciclos', requiredRole: ROLES.GESTOR },
  { title: 'Sedes', icon: Building2, url: '/dashboard/sedes', requiredRole: ROLES.GESTOR },
  { title: 'Alumnos', icon: School, url: '/dashboard/alumnos', requiredRole: ROLES.ASESOR },
  {
    title: 'Profesores',
    icon: GraduationCap,
    url: '/dashboard/profesores',
    requiredRole: ROLES.GESTOR,
  },
  {
    title: 'Administrativos',
    icon: Briefcase,
    url: '/dashboard/administrativo',
    requiredRole: ROLES.GESTOR,
  },
  { title: 'Matriculacion', icon: UserPlus, url: '/matriculas', requiredRole: ROLES.ASESOR },
  {
    title: 'Marketing',
    icon: Megaphone,
    sectionBefore: 'GESTIÓN COMERCIAL',
    requiredRole: ROLES.MARKETING,
    items: [
      { title: 'Campañas', icon: Megaphone, url: '/campanas', requiredRole: ROLES.MARKETING },
      {
        title: 'Creatividades',
        icon: Sparkles,
        url: '/marketing/creatividades',
        requiredRole: ROLES.MARKETING,
      },
    ],
  },
  {
    title: 'Captacion',
    icon: FileText,
    requiredRole: ROLES.ASESOR,
    items: [
      { title: 'Leads', icon: FileText, url: '/leads', requiredRole: ROLES.ASESOR },
      { title: 'Inscripciones', icon: UserPlus, url: '/inscripciones', requiredRole: ROLES.ASESOR },
      {
        title: 'Lista de Espera',
        icon: ListTodo,
        url: '/lista-espera',
        requiredRole: ROLES.ASESOR,
      },
      {
        title: 'Calendario citas',
        icon: CalendarDays,
        url: '/calendario-citas',
        requiredRole: ROLES.ASESOR,
      },
    ],
  },
  {
    title: 'Contenido Web',
    icon: Globe,
    requiredRole: ROLES.MARKETING,
    items: [
      { title: 'Cursos', icon: BookOpen, url: '/web/cursos', requiredRole: ROLES.MARKETING },
      { title: 'Ciclos', icon: GraduationCap, url: '/web/ciclos', requiredRole: ROLES.MARKETING },
      {
        title: 'Convocatorias',
        icon: Calendar,
        url: '/web/convocatorias',
        requiredRole: ROLES.MARKETING,
      },
      {
        title: 'Noticias/Blog',
        icon: Newspaper,
        url: '/contenido/blog',
        requiredRole: ROLES.MARKETING,
      },
      {
        title: 'Páginas',
        icon: FileEdit,
        url: '/contenido/paginas',
        requiredRole: ROLES.MARKETING,
      },
      { title: 'FAQs', icon: HelpCircle, url: '/contenido/faqs', requiredRole: ROLES.MARKETING },
      {
        title: 'Testimonios',
        icon: MessageSquareQuote,
        url: '/contenido/testimonios',
        requiredRole: ROLES.MARKETING,
      },
      {
        title: 'Formularios',
        icon: FileInput,
        url: '/contenido/formularios',
        requiredRole: ROLES.MARKETING,
      },
      { title: 'Medios', icon: Image, url: '/contenido/medios', requiredRole: ROLES.MARKETING },
      {
        title: 'Visitantes',
        icon: Eye,
        url: '/contenido/visitantes',
        requiredRole: ROLES.MARKETING,
      },
    ],
  },
  { title: 'Analíticas', icon: BarChart3, url: '/analiticas', requiredRole: ROLES.ASESOR },
  {
    title: 'Finanzas',
    icon: Landmark,
    sectionBefore: 'GESTIÓN FINANCIERA',
    upcoming: true,
    requiredRole: ROLES.ADMIN,
    items: [
      {
        title: 'Resumen Financiero',
        icon: Wallet,
        url: '/finanzas',
        upcoming: true,
        requiredRole: ROLES.ADMIN,
      },
      {
        title: 'Cobros y Pagos',
        icon: HandCoins,
        url: '/finanzas/cobros-pagos',
        upcoming: true,
        requiredRole: ROLES.ADMIN,
      },
      {
        title: 'Facturacion',
        icon: Receipt,
        url: '/finanzas/facturacion',
        upcoming: true,
        requiredRole: ROLES.ADMIN,
      },
      {
        title: 'Nominas y Costes',
        icon: PiggyBank,
        url: '/finanzas/nominas',
        upcoming: true,
        requiredRole: ROLES.ADMIN,
      },
      {
        title: 'Informes',
        icon: ClipboardList,
        url: '/finanzas/informes',
        upcoming: true,
        requiredRole: ROLES.ADMIN,
      },
    ],
  },
  {
    title: 'Campus Virtual',
    icon: GraduationCap,
    sectionBefore: 'CAMPUS VIRTUAL',
    requiredRole: ROLES.GESTOR,
    items: [
      {
        title: 'Vista General Campus',
        icon: LayoutDashboard,
        url: '/campus-virtual',
        requiredRole: ROLES.GESTOR,
      },
      {
        title: 'Inscripciones LMS',
        icon: UserPlus,
        url: '/campus-virtual/inscripciones',
        requiredRole: ROLES.GESTOR,
      },
      {
        title: 'Progreso Alumnos',
        icon: BarChart3,
        url: '/campus-virtual/progreso',
        requiredRole: ROLES.GESTOR,
      },
      {
        title: 'Módulos y Lecciones',
        icon: BookOpen,
        url: '/campus-virtual/contenido',
        requiredRole: ROLES.GESTOR,
      },
      {
        title: 'Certificados',
        icon: Award,
        url: '/campus-virtual/certificados',
        requiredRole: ROLES.GESTOR,
      },
    ],
  },
  {
    title: 'Administración',
    icon: Shield,
    sectionBefore: 'ADMINISTRACIÓN',
    requiredRole: ROLES.ADMIN,
    items: [
      {
        title: 'Usuarios',
        icon: Users,
        url: '/administracion/usuarios',
        requiredRole: ROLES.ADMIN,
      },
      {
        title: 'Roles y Permisos',
        icon: Shield,
        url: '/administracion/roles',
        requiredRole: ROLES.ADMIN,
      },
      {
        title: 'Areas de Estudio',
        icon: BookOpen,
        url: '/administracion/areas-estudio',
        requiredRole: ROLES.ADMIN,
      },
      {
        title: 'Tipos de Estudio',
        icon: Tag,
        url: '/administracion/tipos-estudio',
        requiredRole: ROLES.ADMIN,
      },
      {
        title: 'Historial',
        icon: FileText,
        url: '/administracion/historial',
        requiredRole: ROLES.ADMIN,
      },
      {
        title: 'Suscripción',
        icon: CreditCard,
        url: '/administracion/suscripcion',
        requiredRole: ROLES.ADMIN,
      },
      {
        title: 'Registro de Actividad',
        icon: FileText,
        url: '/administracion/actividad',
        requiredRole: ROLES.ADMIN,
      },
    ],
  },
  { title: 'Configuración', icon: Settings, url: '/configuracion', requiredRole: ROLES.ADMIN },
]

function roleCanView(item: DashboardNavigationItem, role: string | null | undefined): boolean {
  if (!item.requiredRole) return true
  if (!role || !(role in ROLE_HIERARCHY)) return false
  return hasMinimumRole(role as Role, item.requiredRole)
}

export function visibleNavigationForRole(
  role: string | null | undefined
): DashboardNavigationItem[] {
  return dashboardNavigation.flatMap((item) => {
    const visibleChildren = item.items
      ?.map((child) => ({
        ...child,
        items: child.items?.filter((nested) => roleCanView(nested, role)),
      }))
      .filter((child) => roleCanView(child, role) && (!child.items || child.items.length > 0))

    if (!roleCanView(item, role)) return []
    if (item.items && (!visibleChildren || visibleChildren.length === 0)) return []

    return [{ ...item, items: visibleChildren }]
  })
}

export function flattenNavigation(items: DashboardNavigationItem[]): DashboardNavigationItem[] {
  return items.flatMap((item) => [item, ...(item.items ? flattenNavigation(item.items) : [])])
}

export function isNavigationUrlVisible(role: string | null | undefined, url: string): boolean {
  return flattenNavigation(visibleNavigationForRole(role)).some((item) => item.url === url)
}

export const dashboardNavigationUrls = flattenNavigation(dashboardNavigation)
  .map((item) => item.url)
  .filter((url): url is string => Boolean(url))
