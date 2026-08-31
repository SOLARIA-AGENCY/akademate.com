'use client'

import { RequireAuth } from '../providers/SessionProvider'
import { CampusEmptyState } from '../components/CampusEmptyState'

export default function HorariosPage() {
  return (
    <RequireAuth>
      <CampusEmptyState
        title="Horarios y clases"
        description="Aún no hay horarios publicados para tus convocatorias."
      />
    </RequireAuth>
  )
}
