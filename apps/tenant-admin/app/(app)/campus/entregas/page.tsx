'use client'

import { RequireAuth } from '../providers/SessionProvider'
import { CampusEmptyState } from '../components/CampusEmptyState'

export default function EntregasPage() {
  return (
    <RequireAuth>
      <CampusEmptyState
        title="Entregas y tareas"
        description="Cuando tengas prácticas o entregas pendientes, aparecerán en esta lista."
      />
    </RequireAuth>
  )
}
