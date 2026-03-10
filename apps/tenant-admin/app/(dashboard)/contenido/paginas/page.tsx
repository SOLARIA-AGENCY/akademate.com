'use client'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { FileEdit } from 'lucide-react'

export default function PaginasPage() {
  return (
    <div className="space-y-4" data-oid="h-wr_9l">
      <PageHeader
        title="Páginas"
        description="Gestión de páginas estáticas del sitio web"
        icon={FileEdit}
        data-oid="ox-4:.1"
      />

      <Card data-oid="wa4-vef">
        <CardContent
          className="flex flex-col items-center justify-center py-12 text-center"
          data-oid="u6sdten"
        >
          <p className="text-muted-foreground text-sm" data-oid="f5sic.p">
            No hay contenido disponible todavía.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
