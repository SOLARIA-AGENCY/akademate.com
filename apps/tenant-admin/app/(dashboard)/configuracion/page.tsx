'use client'

import { Settings } from 'lucide-react'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent } from '@payload-config/components/ui/card'

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6" data-oid="9d.-6.5">
      <PageHeader
        title="Configuración"
        description="Ajustes del sistema y preferencias"
        icon={Settings}
        data-oid="fdvoo9v"
      />

      <Card data-oid="l7l4i0z">
        <CardContent
          className="flex flex-col items-center justify-center py-12 text-center"
          data-oid="358xf-w"
        >
          <p className="text-muted-foreground text-sm" data-oid="mt0y349">
            No hay contenido disponible todavía.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
