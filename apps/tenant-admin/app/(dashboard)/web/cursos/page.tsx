'use client'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Globe } from 'lucide-react'

export default function WebCursosPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Cursos Publicados"
        description="Vista de cursos publicados en el sitio web público"
        icon={Globe}
      />
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground text-sm">No hay contenido disponible todavía.</p>
        </CardContent>
      </Card>
    </div>
  )
}
