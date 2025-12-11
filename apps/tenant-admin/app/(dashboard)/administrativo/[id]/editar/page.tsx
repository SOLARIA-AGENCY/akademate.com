'use client'

import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { ArrowLeft, ExternalLink } from 'lucide-react'

export default function EditAdministrativoPage() {
  const router = useRouter()
  const params = useParams()
  const adminId = params.id as string

  const handleGoToPayload = () => {
    router.push(`/admin/collections/staff/${adminId}`)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Personal Administrativo</h1>
          <p className="text-muted-foreground mt-1">Modificar información del personal administrativo</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editor de Payload CMS</CardTitle>
          <CardDescription>
            Para editar la información completa del personal administrativo, utiliza el editor de Payload CMS.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 rounded-md bg-muted/50 text-sm">
            <p className="font-semibold mb-2">El editor de Payload CMS te permite:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Subir y gestionar fotos del personal</li>
              <li>Asignar sedes y campus</li>
              <li>Editar información de contacto y empleo</li>
              <li>Gestionar rol y responsabilidades</li>
              <li>Ver historial de cambios completo</li>
            </ul>
          </div>

          <div className="flex gap-4 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => router.back()}>
              Volver
            </Button>
            <Button onClick={handleGoToPayload}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir en Payload CMS
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
