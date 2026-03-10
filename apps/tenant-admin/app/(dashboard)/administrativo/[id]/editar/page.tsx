'use client'

import { useRouter, useParams } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { ArrowLeft, ExternalLink, Briefcase } from 'lucide-react'

export default function EditAdministrativoPage() {
  const router = useRouter()
  const params = useParams()
  const adminId = params.id as string

  const handleGoToPayload = () => {
    router.push(`/admin/collections/staff/${adminId}`)
  }

  return (
    <div className="space-y-6 max-w-4xl" data-oid="sswj.he">
      <PageHeader
        title="Editar Personal Administrativo"
        description="Modificar información del personal administrativo"
        icon={Briefcase}
        actions={
          <Button variant="ghost" size="icon" onClick={() => router.back()} data-oid="g9q8evk">
            <ArrowLeft className="h-5 w-5" data-oid="._jg6xu" />
          </Button>
        }
        data-oid="cck0-aa"
      />

      <Card data-oid="rs0n06o">
        <CardHeader data-oid="hzz4ksk">
          <CardTitle data-oid="4956m7q">Editor de Payload CMS</CardTitle>
          <CardDescription data-oid="_noz:gg">
            Para editar la información completa del personal administrativo, utiliza el editor de
            Payload CMS.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6" data-oid="8fk.r41">
          <div className="p-4 rounded-md bg-muted/50 text-sm" data-oid="_q:wh69">
            <p className="font-semibold mb-2" data-oid="a.i0nqt">
              El editor de Payload CMS te permite:
            </p>
            <ul
              className="list-disc list-inside space-y-1 text-muted-foreground"
              data-oid="oj9z-ro"
            >
              <li data-oid="w:hwp7j">Subir y gestionar fotos del personal</li>
              <li data-oid="2ptjox1">Asignar sedes y campus</li>
              <li data-oid="bukn7l4">Editar información de contacto y empleo</li>
              <li data-oid="izu5h9z">Gestionar rol y responsabilidades</li>
              <li data-oid="-dzu-rb">Ver historial de cambios completo</li>
            </ul>
          </div>

          <div className="flex gap-4 justify-end pt-4 border-t" data-oid="j0-:j08">
            <Button variant="outline" onClick={() => router.back()} data-oid="wf64q6v">
              Volver
            </Button>
            <Button onClick={handleGoToPayload} data-oid="57fexih">
              <ExternalLink className="mr-2 h-4 w-4" data-oid="j9jro3g" />
              Abrir en Payload CMS
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
