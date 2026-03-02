'use client'

import { Settings } from 'lucide-react'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent } from '@payload-config/components/ui/card'

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Ajustes del sistema y preferencias"
        icon={Settings}
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground text-sm">No hay contenido disponible todavía.</p>
        </CardContent>
      </Card>
    </div>
  )
}
