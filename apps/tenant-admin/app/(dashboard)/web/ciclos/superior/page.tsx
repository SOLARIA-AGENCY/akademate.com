'use client'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { GraduationCap } from 'lucide-react'

export default function WebCicloSuperiorPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Ciclo Superior Web"
        description="Vista de ciclos de grado superior publicados en el sitio web"
        icon={GraduationCap}
      />
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground text-sm">No hay contenido disponible todavía.</p>
        </CardContent>
      </Card>
    </div>
  )
}
