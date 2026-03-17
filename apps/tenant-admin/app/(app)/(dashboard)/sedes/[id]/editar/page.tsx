'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { ArrowLeft, Save, MapPin } from 'lucide-react'

interface EditSedePageProps {
  params: Promise<{ id: string }>
}

export default function EditSedePage({ params }: EditSedePageProps) {
  const router = useRouter()
  const { id } = React.use(params)

  const [form, setForm] = React.useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    horario: '',
  })

  React.useEffect(() => {
    // Prefill with deterministic values for current mock environment.
    const normalizedId = id.replaceAll('-', ' ')
    setForm({
      nombre: normalizedId.toUpperCase(),
      direccion: 'Calle Principal 123',
      telefono: '+34 922 000 000',
      email: `info@${id}.akademate.com`,
      horario: 'Lunes a Viernes 08:00 - 21:00',
    })
  }, [id])

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    router.push(`/sedes/${id}`)
  }

  return (
    <div className="space-y-6 max-w-4xl" data-oid="xy61k91">
      <PageHeader
        title="Editar Sede"
        description="Actualiza la información operativa de la sede."
        icon={MapPin}
        actions={
          <Button variant="ghost" onClick={() => router.push(`/sedes/${id}`)} data-oid="jjc.e99">
            <ArrowLeft className="mr-2 h-4 w-4" data-oid="5u07lkx" />
            Volver a la sede
          </Button>
        }
        data-oid=".cyaqx8"
      />

      <Card data-oid="l-gcx-2">
        <CardHeader data-oid="g_87xhl">
          <CardTitle data-oid="3h91742">Datos de la Sede</CardTitle>
          <CardDescription data-oid="1t..qzh">
            Actualiza campos de contacto, dirección y horario.
          </CardDescription>
        </CardHeader>
        <CardContent data-oid="emf-s9k">
          <form className="space-y-4" onSubmit={handleSave} data-oid="uot2d1e">
            <div className="grid gap-4 md:grid-cols-2" data-oid="zg:z7iz">
              <div className="space-y-2" data-oid="tcym.p9">
                <Label htmlFor="nombre" data-oid="ydly-xb">
                  Nombre
                </Label>
                <Input
                  id="nombre"
                  value={form.nombre}
                  onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
                  data-oid="dovn44m"
                />
              </div>

              <div className="space-y-2" data-oid="-gzr989">
                <Label htmlFor="telefono" data-oid="r99q.is">
                  Teléfono
                </Label>
                <Input
                  id="telefono"
                  value={form.telefono}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, telefono: event.target.value }))
                  }
                  data-oid="c-7p144"
                />
              </div>
            </div>

            <div className="space-y-2" data-oid="k6p-b0_">
              <Label htmlFor="direccion" data-oid="snpu:lq">
                Dirección
              </Label>
              <Input
                id="direccion"
                value={form.direccion}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, direccion: event.target.value }))
                }
                data-oid="g066afi"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2" data-oid="0agvt-i">
              <div className="space-y-2" data-oid="vh:3v63">
                <Label htmlFor="email" data-oid="1lssc-g">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  data-oid="2_ryxbj"
                />
              </div>

              <div className="space-y-2" data-oid="zqwm2z7">
                <Label htmlFor="horario" data-oid="fj9g.gf">
                  Horario
                </Label>
                <Input
                  id="horario"
                  value={form.horario}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, horario: event.target.value }))
                  }
                  data-oid="1de374-"
                />
              </div>
            </div>

            <div className="pt-2" data-oid="7sykqkz">
              <Button type="submit" data-oid="4e6kwlt">
                <Save className="mr-2 h-4 w-4" data-oid="0xyo22t" />
                Guardar cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
