'use client'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Globe } from 'lucide-react'

export default function WebCursosPage() {
  return (
    <div className="space-y-4" data-oid="3jlh5a_">
      <PageHeader
        title="Cursos Publicados"
        description="Vista de cursos publicados en el sitio web público"
        icon={Globe}
        data-oid="htsgys-"
      />

      <Card data-oid="5h43n-a">
        <CardContent
          className="flex flex-col items-center justify-center py-12 text-center"
          data-oid="ow12pzj"
        >
          <p className="text-muted-foreground text-sm" data-oid="0xkwl_t">
            No hay contenido disponible todavía.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
