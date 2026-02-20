'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { ArrowLeft, Save } from 'lucide-react'

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
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push(`/sedes/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a la sede
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editar Sede</CardTitle>
          <CardDescription>Actualiza la información operativa de la sede.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSave}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={form.nombre}
                  onChange={(event) => setForm((prev) => ({ ...prev, nombre: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={form.telefono}
                  onChange={(event) => setForm((prev) => ({ ...prev, telefono: event.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={form.direccion}
                onChange={(event) => setForm((prev) => ({ ...prev, direccion: event.target.value }))}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="horario">Horario</Label>
                <Input
                  id="horario"
                  value={form.horario}
                  onChange={(event) => setForm((prev) => ({ ...prev, horario: event.target.value }))}
                />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Guardar cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
