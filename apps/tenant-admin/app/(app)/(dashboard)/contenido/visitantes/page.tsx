'use client'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Eye } from 'lucide-react'

export default function VisitantesPage() {
  return (
    <div className="space-y-4" data-oid="y0zghpp">
      <PageHeader
        title="Visitantes"
        description="Seguimiento de visitantes y comportamiento en el sitio web"
        icon={Eye}
        data-oid="bhgn90_"
      />

      <Card data-oid="2qhvufm">
        <CardContent
          className="flex flex-col items-center justify-center py-12 text-center"
          data-oid="uvhen.6"
        >
          <p className="text-muted-foreground text-sm" data-oid="a46scev">
            No hay contenido disponible todavía.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
