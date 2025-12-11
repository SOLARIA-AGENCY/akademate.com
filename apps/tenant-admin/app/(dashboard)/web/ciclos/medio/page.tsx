'use client'

import { GraduationCap } from 'lucide-react'
import { ComingSoonPage } from '@payload-config/components/ui/ComingSoonPage'

export default function WebCicloMedioPage() {
  return (
    <ComingSoonPage
      title="Ciclo Medio Web"
      description="Vista de ciclos de grado medio publicados en el sitio web"
      icon={GraduationCap}
      expectedPhase="Fase F4"
      plannedFeatures={[
        "Preview de ciclos en la web pública",
        "Gestión de contenido específico para grado medio",
        "Requisitos de acceso",
        "Salidas profesionales",
        "Módulos y temarios",
      ]}
    />
  )
}
