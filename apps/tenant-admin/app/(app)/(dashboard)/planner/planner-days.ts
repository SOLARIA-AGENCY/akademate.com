export const DAY_FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
] as const

export type PlannerDayKey = (typeof DAY_FILTERS)[number]['key']

const PLANNER_DAY_ALIASES: Record<string, PlannerDayKey> = {
  lunes: 'monday',
  lun: 'monday',
  martes: 'tuesday',
  mar: 'tuesday',
  miercoles: 'wednesday',
  mie: 'wednesday',
  miércoles: 'wednesday',
  jueves: 'thursday',
  jue: 'thursday',
  viernes: 'friday',
  vie: 'friday',
}

export function normalizePlannerDay(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  return PLANNER_DAY_ALIASES[normalized] ?? normalized
}

export function cardMatchesDay(card: { dias: string[] }, day: PlannerDayKey): boolean {
  if (day === 'all') return true
  return card.dias.some((value) => normalizePlannerDay(value) === day)
}
