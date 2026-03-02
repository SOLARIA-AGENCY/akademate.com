'use client'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { Eye } from 'lucide-react'

export default function VisitantesPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Visitantes"
        description="Seguimiento de visitantes y comportamiento en el sitio web"
        icon={Eye}
      />
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground text-sm">No hay contenido disponible todavía.</p>
        </CardContent>
      </Card>
    </div>
  )
}
