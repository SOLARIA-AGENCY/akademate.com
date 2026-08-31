'use client'

import { RequireAuth } from '../../providers/SessionProvider'
import { CampusEmptyState } from '../../components/CampusEmptyState'

export default function ComunidadPage() {
  return (
    <RequireAuth>
      <CampusEmptyState
        title="Comunidad y foro"
        description="El foro del campus estará disponible cuando tu centro lo active."
      />
    </RequireAuth>
  )
}
