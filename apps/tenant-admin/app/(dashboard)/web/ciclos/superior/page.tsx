'use client'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { GraduationCap } from 'lucide-react'

export default function WebCicloSuperiorPage() {
  return (
    <div className="space-y-4" data-oid="emwgk3m">
      <PageHeader
        title="Ciclo Superior Web"
        description="Vista de ciclos de grado superior publicados en el sitio web"
        icon={GraduationCap}
        data-oid="tn3h92s"
      />

      <Card data-oid="2h9yy5l">
        <CardContent
          className="flex flex-col items-center justify-center py-12 text-center"
          data-oid=".8pn5mv"
        >
          <p className="text-muted-foreground text-sm" data-oid="59m5lup">
            No hay contenido disponible todavía.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
