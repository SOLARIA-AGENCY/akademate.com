'use client'

import type { Meta, StoryObj } from '@storybook/nextjs'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@payload-config/components/ui/sheet'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { Separator } from '@payload-config/components/ui/separator'

const meta = {
  title: 'Foundations/Sheet',
  component: Sheet,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Sheet>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Abrir panel</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Panel lateral</SheetTitle>
          <SheetDescription>
            Contenido adicional que aparece desde el lateral de la pantalla.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">Aquí puedes añadir cualquier contenido.</p>
        </div>
        <SheetFooter>
          <Button>Guardar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}

export const EditAlumno: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Editar alumno</Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Editar alumno</SheetTitle>
          <SheetDescription>
            Actualiza los datos personales del alumno. Los cambios se guardan inmediatamente.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nombre-alumno">Nombre completo</Label>
            <Input id="nombre-alumno" defaultValue="Ana Martínez López" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email-alumno">Email</Label>
            <Input id="email-alumno" type="email" defaultValue="ana.martinez@email.com" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input id="telefono" defaultValue="+34 612 345 678" />
          </div>
        </div>
        <Separator />
        <SheetFooter className="mt-4">
          <Button variant="outline">Cancelar</Button>
          <Button>Guardar cambios</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}

export const FiltersPanel: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Filtros</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Filtros de búsqueda</SheetTitle>
          <SheetDescription>Refina los resultados del catálogo de cursos.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-1.5">
            <Label>Área de conocimiento</Label>
            <div className="space-y-2 text-sm">
              {['Desarrollo', 'Marketing', 'Diseño', 'Gestión', 'Idiomas'].map((area) => (
                <label key={area} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  <span>{area}</span>
                </label>
              ))}
            </div>
          </div>
          <Separator />
          <div className="flex flex-col gap-1.5">
            <Label>Modalidad</Label>
            <div className="space-y-2 text-sm">
              {['Presencial', 'Online', 'Híbrido'].map((mod) => (
                <label key={mod} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="modalidad" className="rounded" />
                  <span>{mod}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" className="w-full">
            Limpiar filtros
          </Button>
          <Button className="w-full">Aplicar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}
