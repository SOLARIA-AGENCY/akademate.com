export const CAMPUS_NAV = [
  { href: '/campus', label: 'Mi panel', match: 'exact' as const },
  { href: '/campus/cursos', label: 'Mis cursos', match: 'prefix' as const },
  { href: '/campus/horarios', label: 'Horarios y clases', match: 'prefix' as const },
  { href: '/campus/entregas', label: 'Entregas y tareas', match: 'prefix' as const },
  { href: '/campus/comunidad', label: 'Comunidad y foro', match: 'prefix' as const },
  { href: '/campus/logros', label: 'Calificaciones y diplomas', match: 'prefix' as const },
  { href: '/campus/mensajes', label: 'Mensajes', match: 'prefix' as const },
  { href: '/campus/ajustes', label: 'Ajustes', match: 'prefix' as const },
] as const

export function isCampusNavActive(pathname: string, href: string, match: 'exact' | 'prefix'): boolean {
  if (match === 'exact') return pathname === href
  if (href === '/campus/cursos') {
    return pathname === '/campus/cursos' || pathname.startsWith('/campus/cursos/')
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}
