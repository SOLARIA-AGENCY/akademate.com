'use client'

import { HelpCircle } from 'lucide-react'
import { ComingSoonPage } from '@payload-config/components/ui/ComingSoonPage'

export default function FaqsPage() {
  return (
    <ComingSoonPage
      title="FAQs"
      description="Gestión de preguntas frecuentes"
      icon={HelpCircle}
      expectedPhase="Fase F5"
      plannedFeatures={[
        "Organización por categorías",
        "Editor de respuestas con formato",
        "Ordenación por relevancia",
        "Búsqueda y filtrado",
        "Schema markup para SEO",
      ]}
    />
  )
}
