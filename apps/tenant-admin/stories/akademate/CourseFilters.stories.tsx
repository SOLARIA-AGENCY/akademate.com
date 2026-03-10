import type { Meta, StoryObj } from '@storybook/nextjs'
import { Input } from '@payload-config/components/ui/input'
import { Button } from '@payload-config/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { Search, X } from 'lucide-react'

const meta = {
  title: 'Akademate/CourseFilters',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar cursos..." className="pl-9" />
      </div>
      <Select>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Modalidad" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="presencial">Presencial</SelectItem>
          <SelectItem value="online">Online</SelectItem>
          <SelectItem value="hibrido">Híbrido</SelectItem>
          <SelectItem value="teleformacion">Teleformación</SelectItem>
        </SelectContent>
      </Select>
      <Select>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="activo">Activo</SelectItem>
          <SelectItem value="borrador">Borrador</SelectItem>
          <SelectItem value="archivado">Archivado</SelectItem>
        </SelectContent>
      </Select>
      <Button>Aplicar</Button>
      <Button variant="ghost" size="sm" className="text-muted-foreground">
        <X className="h-4 w-4 mr-1" />
        Limpiar
      </Button>
    </div>
  ),
}

export const WithAreaFilter: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar cursos..." className="pl-9" defaultValue="React" />
      </div>
      <Select defaultValue="online">
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="presencial">Presencial</SelectItem>
          <SelectItem value="online">Online</SelectItem>
          <SelectItem value="hibrido">Híbrido</SelectItem>
        </SelectContent>
      </Select>
      <Select>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Área" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="desarrollo">Desarrollo</SelectItem>
          <SelectItem value="marketing">Marketing</SelectItem>
          <SelectItem value="diseno">Diseño</SelectItem>
          <SelectItem value="gestion">Gestión</SelectItem>
          <SelectItem value="idiomas">Idiomas</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue="activo">
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="activo">Activo</SelectItem>
          <SelectItem value="borrador">Borrador</SelectItem>
          <SelectItem value="archivado">Archivado</SelectItem>
        </SelectContent>
      </Select>
      <Button>Aplicar</Button>
      <Button variant="ghost" size="sm" className="text-muted-foreground">
        <X className="h-4 w-4 mr-1" />
        Limpiar
      </Button>
    </div>
  ),
}
