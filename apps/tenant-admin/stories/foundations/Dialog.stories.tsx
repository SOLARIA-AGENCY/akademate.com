'use client'

import type { Meta, StoryObj } from '@storybook/nextjs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@payload-config/components/ui/dialog'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'

const meta = {
  title: 'Foundations/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Abrir diálogo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Título del diálogo</DialogTitle>
          <DialogDescription>
            Este es el contenido descriptivo del diálogo. Confirma la acción antes de continuar.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancelar</Button>
          <Button>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const DeleteConfirmation: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Eliminar curso</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Eliminar curso?</DialogTitle>
          <DialogDescription>
            Vas a eliminar <strong>Desarrollo Web Full-Stack</strong>. Esta acción no se puede
            deshacer y se perderán todos los datos de alumnos, calificaciones y materiales.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Cancelar</Button>
          <Button variant="destructive">Eliminar definitivamente</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const EditCourse: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Editar curso</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar curso</DialogTitle>
          <DialogDescription>Actualiza la información básica del curso.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nombre">Nombre del curso</Label>
            <Input id="nombre" defaultValue="Desarrollo Web Full-Stack" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="codigo">Código</Label>
            <Input id="codigo" defaultValue="DWF-2026-01" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancelar</Button>
          <Button>Guardar cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}
