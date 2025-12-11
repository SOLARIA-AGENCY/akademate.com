'use client'

import { FileInput } from 'lucide-react'
import { ComingSoonPage } from '@payload-config/components/ui/ComingSoonPage'

export default function FormulariosPage() {
  return (
    <ComingSoonPage
      title="Formularios"
      description="Gestión de formularios web y captura de leads"
      icon={FileInput}
      expectedPhase="Fase F4"
      plannedFeatures={[
        "Constructor de formularios drag & drop",
        "Campos personalizados",
        "Validación RGPD integrada",
        "Webhooks para integraciones",
        "Notificaciones por email",
        "Exportación de submissions",
      ]}
    />
  )
}
