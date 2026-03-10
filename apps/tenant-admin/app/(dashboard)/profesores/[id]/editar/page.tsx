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
import { ArrowLeft, ExternalLink, User } from 'lucide-react'

export default function EditProfesorPage() {
  const router = useRouter()
  const params = useParams()
  const professorId = params.id as string

  const handleGoToPayload = () => {
    router.push(`/admin/collections/staff/${professorId}`)
  }

  return (
    <div className="space-y-6 max-w-4xl" data-oid="_wkek6p">
      <PageHeader
        title="Editar Profesor"
        description="Modificar información del profesor"
        icon={User}
        actions={
          <Button variant="ghost" size="icon" onClick={() => router.back()} data-oid="thtby.r">
            <ArrowLeft className="h-5 w-5" data-oid="gfdjw4m" />
          </Button>
        }
        data-oid="tausaey"
      />

      <Card data-oid=".mmkrth">
        <CardHeader data-oid="1a22554">
          <CardTitle data-oid="p9u_3bj">Editor de Payload CMS</CardTitle>
          <CardDescription data-oid="dach9.7">
            Para editar la información completa del profesor, utiliza el editor de Payload CMS.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6" data-oid="pgn._ct">
          <div className="p-4 rounded-md bg-muted/50 text-sm" data-oid="8xxfbzl">
            <p className="font-semibold mb-2" data-oid="3.3cuzq">
              El editor de Payload CMS te permite:
            </p>
            <ul
              className="list-disc list-inside space-y-1 text-muted-foreground"
              data-oid="d0nalkw"
            >
              <li data-oid="-f1a7fz">Subir y gestionar fotos del profesor</li>
              <li data-oid="lytkzgk">Asignar sedes y campus</li>
              <li data-oid="v1aj_q5">Editar información de contacto y empleo</li>
              <li data-oid="gurq-wu">Gestionar especialidades y certificaciones</li>
              <li data-oid="zlmuafs">Ver historial de cambios completo</li>
            </ul>
          </div>

          <div className="flex gap-4 justify-end pt-4 border-t" data-oid="5hiyf_x">
            <Button variant="outline" onClick={() => router.back()} data-oid="jy_tgin">
              Volver
            </Button>
            <Button onClick={handleGoToPayload} data-oid="5:odf6d">
              <ExternalLink className="mr-2 h-4 w-4" data-oid="f8oj4pf" />
              Abrir en Payload CMS
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
