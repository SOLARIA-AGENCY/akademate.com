'use client'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { FileEdit } from 'lucide-react'

export default function PaginasPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Páginas"
        description="Gestión de páginas estáticas del sitio web"
        icon={FileEdit}
      />
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground text-sm">No hay contenido disponible todavía.</p>
        </CardContent>
      </Card>
    </div>
  )
}
