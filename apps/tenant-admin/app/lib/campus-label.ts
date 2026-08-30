export function formatCampusLabel(campus?: { name?: string | null; city?: string | null } | null): string {
  if (!campus) return 'Sin sede'
  if (campus.city && campus.name) {
    return `${campus.name} (${campus.city})`
  }
  return campus.name || campus.city || 'Sin sede'
}

export function mapCampusFilterOptions(campuses: Array<{ id: string | number; name: string; city?: string | null }>) {
  return campuses.map((c) => ({
    value: String(c.id),
    label: formatCampusLabel(c),
  }))
}
