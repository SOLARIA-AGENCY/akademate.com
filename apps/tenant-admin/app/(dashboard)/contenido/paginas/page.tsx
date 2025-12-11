'use client'

import { FileEdit } from 'lucide-react'
import { ComingSoonPage } from '@payload-config/components/ui/ComingSoonPage'

export default function PaginasPage() {
  return (
    <ComingSoonPage
      title="Páginas"
      description="Gestión de páginas estáticas del sitio web"
      icon={FileEdit}
      expectedPhase="Fase F5"
      plannedFeatures={[
        "Editor de páginas con bloques",
        "Templates predefinidos (Landing, Información, etc.)",
        "Gestión de URLs y slugs",
        "Versionado de páginas",
        "Preview en múltiples dispositivos",
      ]}
    />
  )
}
