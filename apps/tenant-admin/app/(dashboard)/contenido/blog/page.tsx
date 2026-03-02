'use client'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Newspaper } from 'lucide-react'

export default function BlogPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Blog / Noticias"
        description="Gestión de artículos y noticias del sitio web"
        icon={Newspaper}
      />
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground text-sm">No hay contenido disponible todavía.</p>
        </CardContent>
      </Card>
    </div>
  )
}
