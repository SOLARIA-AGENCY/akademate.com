'use client'

import { Image } from 'lucide-react'
import { ComingSoonPage } from '@payload-config/components/ui/ComingSoonPage'

export default function MediaPage() {
  return (
    <ComingSoonPage
      title="Medios"
      description="Biblioteca de medios y gestión de archivos"
      icon={Image}
      expectedPhase="Fase F5"
      plannedFeatures={[
        "Galería de imágenes con thumbnails",
        "Upload drag & drop",
        "Optimización automática de imágenes",
        "Organización por carpetas",
        "Búsqueda por nombre y tags",
        "CDN integrado para entrega rápida",
      ]}
    />
  )
}
