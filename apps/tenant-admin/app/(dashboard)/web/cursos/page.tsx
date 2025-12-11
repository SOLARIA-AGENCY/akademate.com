'use client'

import { Globe } from 'lucide-react'
import { ComingSoonPage } from '@payload-config/components/ui/ComingSoonPage'

export default function WebCursosPage() {
  return (
    <ComingSoonPage
      title="Cursos Publicados"
      description="Vista de cursos publicados en el sitio web público"
      icon={Globe}
      expectedPhase="Fase F4"
      plannedFeatures={[
        "Preview de cursos como aparecen en la web",
        "Toggle de publicación/despublicación",
        "SEO metadata por curso",
        "URLs amigables personalizables",
        "Orden de visualización",
        "Destacados y promocionados",
      ]}
    />
  )
}
