export const designSystemSource = {
  localPath: 'vendor/academate-ui',
  upstreamRepository: 'https://github.com/SOLARIA-AGENCY/Academate-ui',
  storybookUrl: 'http://localhost:6006',
}

export const designFoundations = [
  {
    name: 'Color Tokens',
    description: 'Variables CSS para marca, estados, superficies y contraste.',
  },
  {
    name: 'Typography',
    description: 'Jerarquía tipográfica para títulos, cuerpo, labels y microcopy.',
  },
  {
    name: 'Spacing & Layout',
    description: 'Sistema de espaciado, grid responsive y densidad de componentes.',
  },
  {
    name: 'Radii & Elevation',
    description: 'Curvatura y niveles de sombra para cards, modals y overlays.',
  },
  {
    name: 'Motion',
    description: 'Transiciones y patrones de interacción para navegación y feedback.',
  },
  {
    name: 'Theming',
    description: 'Modo claro/oscuro y branding por tenant mediante variables.',
  },
]

export const uiComponentNames = [
  'alert-dialog',
  'avatar',
  'badge',
  'button',
  'calendar',
  'card',
  'carousel',
  'chart',
  'checkbox',
  'collapsible',
  'combobox',
  'dialog',
  'drawer',
  'dropdown-menu',
  'field',
  'grid-pattern',
  'input',
  'input-group',
  'kbd',
  'label',
  'logo',
  'popover',
  'progress',
  'scroll-area',
  'select',
  'separator',
  'sheet',
  'sidebar',
  'skeleton',
  'slider',
  'switch',
  'table',
  'textarea',
  'tooltip',
  'verified-icon',
]

export const templateNames = [
  'bookmarks',
  'calendar',
  'chat',
  'dashboard-1',
  'dashboard-2',
  'dashboard-3',
  'dashboard-4',
  'dashboard-5',
  'emails',
  'employees',
  'files',
  'leads',
  'maps',
  'payrolls',
  'projects-timeline',
  'rentals',
  'task-management',
  'tasks',
]

export const templateProfiles: Record<string, { category: string; description: string; modules: string[] }> = {
  bookmarks: {
    category: 'Productivity',
    description: 'Gestion de marcadores, favoritos, archivados y papelera.',
    modules: ['Sidebar', 'Cards', 'Filters'],
  },
  calendar: {
    category: 'Scheduling',
    description: 'Calendario con vista semanal, eventos y agenda.',
    modules: ['Calendar Grid', 'Event Drawer', 'Toolbar'],
  },
  chat: {
    category: 'Communication',
    description: 'Interfaz de chat conversacional con historial.',
    modules: ['Thread', 'Composer', 'Sidebar'],
  },
  'dashboard-1': {
    category: 'Analytics',
    description: 'Dashboard general con KPIs y activity feed.',
    modules: ['KPIs', 'Tables', 'Charts'],
  },
  'dashboard-2': {
    category: 'CRM',
    description: 'Panel CRM con revenue y pipeline.',
    modules: ['Funnel', 'Deals Table', 'Metrics'],
  },
  'dashboard-3': {
    category: 'HR',
    description: 'Dashboard de talento con finanzas y empleados.',
    modules: ['Employees', 'Flow Chart', 'Alerts'],
  },
  'dashboard-4': {
    category: 'Operations',
    description: 'Panel de equipos con leads y rendimiento.',
    modules: ['Workgroups', 'Leads', 'Ranking'],
  },
  'dashboard-5': {
    category: 'Project Mgmt',
    description: 'Dashboard moderno con tareas y proyectos.',
    modules: ['Tasks', 'Projects', 'Performance'],
  },
  emails: {
    category: 'Communication',
    description: 'Cliente de correo con inbox y detalle.',
    modules: ['Inbox', 'Email Detail', 'Folders'],
  },
  employees: {
    category: 'HR',
    description: 'Gestion de empleados, altas/bajas y directorio.',
    modules: ['Employees Table', 'Stats', 'Actions'],
  },
  files: {
    category: 'Storage',
    description: 'Gestor de archivos con grid/list y almacenamiento.',
    modules: ['Storage Cards', 'File List', 'Breadcrumb'],
  },
  leads: {
    category: 'Sales',
    description: 'Gestion de leads con filtros y embudo.',
    modules: ['Leads Table', 'Filters', 'Growth Chart'],
  },
  maps: {
    category: 'Location',
    description: 'Panel de mapas con busqueda y favoritos.',
    modules: ['Map Canvas', 'Search', 'Recents'],
  },
  payrolls: {
    category: 'Finance',
    description: 'Panel de nominas y gastos operativos.',
    modules: ['Expenses', 'Payroll Table', 'Filters'],
  },
  'projects-timeline': {
    category: 'Project Mgmt',
    description: 'Timeline de proyectos y entregables.',
    modules: ['Timeline', 'Milestones', 'Dependencies'],
  },
  rentals: {
    category: 'Real Estate',
    description: 'Plataforma de alquileres con listados y mapa.',
    modules: ['Property Cards', 'Map', 'Filters'],
  },
  'task-management': {
    category: 'Productivity',
    description: 'Tablero de tareas simplificado tipo kanban.',
    modules: ['Columns', 'Cards', 'Filters'],
  },
  tasks: {
    category: 'Productivity',
    description: 'Dashboard de tareas con metricas y board.',
    modules: ['Kanban', 'KPIs', 'Reports'],
  },
}

export const templateLiveDemos: Record<string, { liveUrl: string; githubUrl: string }> = {
  bookmarks: {
    liveUrl: 'https://square-ui-bookmarks.vercel.app',
    githubUrl: 'https://github.com/ln-dev7/square-ui/tree/master/templates/bookmarks',
  },
  calendar: {
    liveUrl: 'https://square-ui-calendar.vercel.app',
    githubUrl: 'https://github.com/ln-dev7/square-ui/tree/master/templates/calendar',
  },
  chat: {
    liveUrl: 'https://square-ui-chat.vercel.app',
    githubUrl: 'https://github.com/ln-dev7/square-ui/tree/master/templates/chat',
  },
  'dashboard-1': {
    liveUrl: 'https://square-ui-dashboard-1.vercel.app',
    githubUrl: 'https://github.com/ln-dev7/square-ui/tree/master/templates/dashboard-1',
  },
  'dashboard-2': {
    liveUrl: 'https://square-ui-dashboard-2.vercel.app',
    githubUrl: 'https://github.com/ln-dev7/square-ui/tree/master/templates/dashboard-2',
  },
  'dashboard-3': {
    liveUrl: 'https://square-ui-dashboard-3.vercel.app',
    githubUrl: 'https://github.com/ln-dev7/square-ui/tree/master/templates/dashboard-3',
  },
  'dashboard-4': {
    liveUrl: 'https://square-ui-dashboard-4.vercel.app',
    githubUrl: 'https://github.com/ln-dev7/square-ui/tree/master/templates/dashboard-4',
  },
  'dashboard-5': {
    liveUrl: 'https://square-ui-dashboard-5.vercel.app',
    githubUrl: 'https://github.com/ln-dev7/square-ui/tree/master/templates/dashboard-5',
  },
  emails: {
    liveUrl: 'https://square-ui-emails.vercel.app',
    githubUrl: 'https://github.com/ln-dev7/square-ui/tree/master/templates/emails',
  },
  employees: {
    liveUrl: 'https://square-ui-employees.vercel.app',
    githubUrl: 'https://github.com/ln-dev7/square-ui/tree/master/templates/employees',
  },
  files: {
    liveUrl: 'https://square-ui-files.vercel.app',
    githubUrl: 'https://github.com/ln-dev7/square-ui/tree/master/templates/files',
  },
  leads: {
    liveUrl: 'https://square-ui-leads.vercel.app',
    githubUrl: 'https://github.com/ln-dev7/square-ui/tree/master/templates/leads',
  },
  maps: {
    liveUrl: 'https://square-ui-maps.vercel.app',
    githubUrl: 'https://github.com/ln-dev7/square-ui/tree/master/templates/maps',
  },
  payrolls: {
    liveUrl: 'https://square-ui-payrolls.vercel.app',
    githubUrl: 'https://github.com/ln-dev7/square-ui/tree/master/templates/payrolls',
  },
  'projects-timeline': {
    liveUrl: 'https://square-ui-projects-timeline.vercel.app',
    githubUrl: 'https://github.com/ln-dev7/square-ui/tree/master/templates/projects-timeline',
  },
  rentals: {
    liveUrl: 'https://square-ui-rentals.vercel.app',
    githubUrl: 'https://github.com/ln-dev7/square-ui/tree/master/templates/rentals',
  },
  'task-management': {
    liveUrl: 'https://square-ui-task-management.vercel.app',
    githubUrl: 'https://github.com/ln-dev7/square-ui/tree/master/templates/task-management',
  },
  tasks: {
    liveUrl: 'https://square-ui-tasks.vercel.app',
    githubUrl: 'https://github.com/ln-dev7/square-ui/tree/master/templates/tasks',
  },
}
