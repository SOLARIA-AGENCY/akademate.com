'use client'

import { Newspaper } from 'lucide-react'
import { ComingSoonPage } from '@payload-config/components/ui/ComingSoonPage'

export default function BlogPage() {
  return (
    <ComingSoonPage
      title="Blog / Noticias"
      description="Gestión de artículos y noticias del sitio web"
      icon={Newspaper}
      expectedPhase="Fase F5"
      plannedFeatures={[
        "Editor WYSIWYG con bloques",
        "Categorización y etiquetado",
        "Programación de publicaciones",
        "SEO automático con meta tags",
        "Preview antes de publicar",
        "Integración con redes sociales",
      ]}
    />
  )
}
