import type { Meta, StoryObj } from '@storybook/nextjs'
import { Calendar, Users } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'

const meta = {
  title: 'Foundations/Card',
  component: Card,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const KPI: Story = {
  render: () => (
    <Card className="w-[360px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Cursos activos</CardTitle>
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">34</div>
        <p className="text-xs text-muted-foreground">+5% vs mes anterior</p>
      </CardContent>
    </Card>
  ),
}

export const ContentCard: Story = {
  render: () => (
    <Card className="w-[420px]">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>UX/UI Bootcamp</CardTitle>
            <CardDescription>Teleformación · 120h</CardDescription>
          </div>
          <Badge>ACTIVO</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Curso enfocado en experiencia de usuario, prototipado y validación con métricas.
        </p>
      </CardContent>
      <CardFooter className="justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          24 alumnos
        </div>
        <Button variant="outline">Ver detalle</Button>
      </CardFooter>
    </Card>
  ),
}
