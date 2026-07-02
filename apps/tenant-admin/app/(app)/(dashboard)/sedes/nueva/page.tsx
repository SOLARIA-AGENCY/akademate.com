'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, MapPin } from 'lucide-react'

import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'

export default function NuevaSedePage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Creación de sedes restringida"
        description="Las sedes solo pueden ser creadas por el equipo interno de Akademate."
        icon={MapPin}
      />

      <Card>
        <CardHeader>
          <CardTitle>Alta de sede no disponible desde el dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Para proteger la estructura operativa y contable del centro, no se permite crear sedes
            desde esta pantalla. Solicita el alta al equipo interno para que la sede quede
            configurada con sus permisos, aulas, capacidad y dependencias correctas.
          </p>
          <Button variant="outline" onClick={() => router.push('/dashboard/sedes')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Sedes
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
