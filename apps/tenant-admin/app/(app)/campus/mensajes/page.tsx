'use client'

import { RequireAuth } from '../providers/SessionProvider'
import { CampusEmptyState } from '../components/CampusEmptyState'

export default function MensajesPage() {
  return (
    <RequireAuth>
      <CampusEmptyState
        title="Mensajes"
        description="No hay mensajes nuevos. Aquí podrás escribir a tu tutor."
      />
    </RequireAuth>
  )
}
