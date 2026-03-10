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
    <Card className="w-[360px]" data-oid="n7xegky">
      <CardHeader
        className="flex flex-row items-center justify-between space-y-0 pb-2"
        data-oid="t30l-:w"
      >
        <CardTitle className="text-sm font-medium" data-oid="i-_1aq2">
          Cursos activos
        </CardTitle>
        <Calendar className="h-4 w-4 text-muted-foreground" data-oid="gze2t:0" />
      </CardHeader>
      <CardContent data-oid="ugqsxqv">
        <div className="text-2xl font-bold" data-oid="td.wcka">
          34
        </div>
        <p className="text-xs text-muted-foreground" data-oid="6iwc.52">
          +5% vs mes anterior
        </p>
      </CardContent>
    </Card>
  ),
}

export const ContentCard: Story = {
  render: () => (
    <Card className="w-[420px]" data-oid=".u64hsj">
      <CardHeader data-oid="w:vrt.k">
        <div className="flex items-center justify-between gap-3" data-oid="bjz41kn">
          <div data-oid="0n5pcbu">
            <CardTitle data-oid="rzjqody">UX/UI Bootcamp</CardTitle>
            <CardDescription data-oid="l7tlynv">Teleformación · 120h</CardDescription>
          </div>
          <Badge data-oid="br:m4xz">ACTIVO</Badge>
        </div>
      </CardHeader>
      <CardContent data-oid="mw0c-9:">
        <p className="text-sm text-muted-foreground" data-oid="ke.0_2h">
          Curso enfocado en experiencia de usuario, prototipado y validación con métricas.
        </p>
      </CardContent>
      <CardFooter className="justify-between" data-oid="rs.q.ac">
        <div className="flex items-center gap-2 text-sm text-muted-foreground" data-oid="3gb79:-">
          <Users className="h-4 w-4" data-oid="e:j972o" />
          24 alumnos
        </div>
        <Button variant="outline" data-oid="nma-s:d">
          Ver detalle
        </Button>
      </CardFooter>
    </Card>
  ),
}
