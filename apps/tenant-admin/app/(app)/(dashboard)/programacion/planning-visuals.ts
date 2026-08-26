export const DASHBOARD_CARD_CLASS =
  'rounded-xl border border-border/80 bg-card text-card-foreground shadow-card transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card-hover'

export function getOccupancyVisual(occupancy: number = 0) {
  if (occupancy >= 90) return { label: 'Completo', color: 'text-rose-600 bg-rose-50' }
  if (occupancy >= 60) return { label: 'Ocupado', color: 'text-amber-600 bg-amber-50' }
  return { label: 'Disponible', color: 'text-emerald-600 bg-emerald-50' }
}

export function getRunStatusVisual(status: string) {
  switch (status) {
    case 'active':
    case 'en_curso':
      return { label: 'En Curso', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
    case 'scheduled':
    case 'planificado':
      return { label: 'Planificado', color: 'text-blue-700 bg-blue-50 border-blue-200' }
    default:
      return { label: status || 'Pendiente', color: 'text-slate-700 bg-slate-100 border-slate-200' }
  }
}

export function getTrainingTypeVisual(type: string) {
  switch (type?.toLowerCase()) {
    case 'teleformacion':
    case 'online':
      return { label: 'Teleformación', color: 'text-indigo-700 bg-indigo-50' }
    case 'presencial':
      return { label: 'Presencial', color: 'text-blue-700 bg-blue-50' }
    case 'mixta':
    case 'hibrida':
      return { label: 'Híbrida', color: 'text-purple-700 bg-purple-50' }
    default:
      return { label: type || 'Oficial', color: 'text-slate-700 bg-slate-100' }
  }
}
