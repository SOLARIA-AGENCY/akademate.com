'use client'

import { Settings } from 'lucide-react'
import { PageHeader } from '@payload-config/components/ui/PageHeader'

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Ajustes del sistema y preferencias"
        icon={Settings}
      />

      <div className="rounded-lg border bg-card p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Página en desarrollo</h2>
        <p className="text-muted-foreground">
          El panel de configuración estará disponible próximamente
        </p>
      </div>
    </div>
  )
}
