'use client'

import { Eye } from 'lucide-react'
import { ComingSoonPage } from '@payload-config/components/ui/ComingSoonPage'

export default function VisitantesPage() {
  return (
    <ComingSoonPage
      title="Visitantes"
      description="Seguimiento de visitantes y comportamiento en el sitio web"
      icon={Eye}
      expectedPhase="Fase F7 - Analytics"
      plannedFeatures={[
        "Tracking de visitantes en tiempo real",
        "Mapas de calor (heatmaps)",
        "Grabación de sesiones",
        "Embudos de conversión",
        "Segmentación de audiencias",
        "Integración con GA4 y Meta Pixel",
      ]}
    />
  )
}
