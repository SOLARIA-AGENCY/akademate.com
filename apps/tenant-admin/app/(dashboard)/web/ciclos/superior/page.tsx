'use client'

import { GraduationCap } from 'lucide-react'
import { ComingSoonPage } from '@payload-config/components/ui/ComingSoonPage'

export default function WebCicloSuperiorPage() {
  return (
    <ComingSoonPage
      title="Ciclo Superior Web"
      description="Vista de ciclos de grado superior publicados en el sitio web"
      icon={GraduationCap}
      expectedPhase="Fase F4"
      plannedFeatures={[
        "Preview de ciclos en la web pública",
        "Gestión de contenido específico para grado superior",
        "Requisitos de acceso",
        "Salidas profesionales",
        "Módulos y temarios",
        "Convalidaciones y acceso a universidad",
      ]}
    />
  )
}
