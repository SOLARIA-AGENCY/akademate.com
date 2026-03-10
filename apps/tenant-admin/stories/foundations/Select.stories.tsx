import type { Meta, StoryObj } from '@storybook/nextjs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { Label } from '@payload-config/components/ui/label'

const meta = {
  title: 'Foundations/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Selecciona una categoría" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="tecnologia">Tecnología</SelectItem>
        <SelectItem value="marketing">Marketing Digital</SelectItem>
        <SelectItem value="diseño">Diseño y Creatividad</SelectItem>
        <SelectItem value="negocios">Negocios y Gestión</SelectItem>
        <SelectItem value="idiomas">Idiomas</SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const WithDefault: Story = {
  render: () => (
    <Select defaultValue="tecnologia">
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Selecciona una categoría" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="tecnologia">Tecnología</SelectItem>
        <SelectItem value="marketing">Marketing Digital</SelectItem>
        <SelectItem value="diseño">Diseño y Creatividad</SelectItem>
        <SelectItem value="negocios">Negocios y Gestión</SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="No disponible" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="a">Opción A</SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-64">
      <Label htmlFor="modalidad">Modalidad</Label>
      <Select>
        <SelectTrigger id="modalidad">
          <SelectValue placeholder="Selecciona modalidad" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="presencial">Presencial</SelectItem>
          <SelectItem value="online">Online en vivo</SelectItem>
          <SelectItem value="hibrido">Híbrido</SelectItem>
          <SelectItem value="asincronico">Asincrónico</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}

export const WithDisabledOptions: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Selecciona sede" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="madrid">Madrid Centro</SelectItem>
        <SelectItem value="barcelona">Barcelona</SelectItem>
        <SelectItem value="sevilla" disabled>
          Sevilla (sin disponibilidad)
        </SelectItem>
        <SelectItem value="valencia">Valencia</SelectItem>
      </SelectContent>
    </Select>
  ),
}
