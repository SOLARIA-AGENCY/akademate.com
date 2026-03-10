'use client'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { GraduationCap } from 'lucide-react'

export default function WebCicloMedioPage() {
  return (
    <div className="space-y-4" data-oid="rj.2bif">
      <PageHeader
        title="Ciclo Medio Web"
        description="Vista de ciclos de grado medio publicados en el sitio web"
        icon={GraduationCap}
        data-oid="tzdazbl"
      />

      <Card data-oid="1lu34b1">
        <CardContent
          className="flex flex-col items-center justify-center py-12 text-center"
          data-oid="4rl8yjj"
        >
          <p className="text-muted-foreground text-sm" data-oid="g0d2rvx">
            No hay contenido disponible todavía.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
