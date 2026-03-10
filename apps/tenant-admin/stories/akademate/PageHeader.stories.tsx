import type { Meta, StoryObj } from '@storybook/nextjs'
import { CalendarDays, Download, Filter, Plus } from 'lucide-react'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'

const meta = {
  title: 'Akademate/PageHeader',
  component: PageHeader,
  tags: ['autodocs'],
  args: {
    title: 'Programación',
    description: 'Planificación de cursos, aulas y recursos',
    icon: CalendarDays,
  },
} satisfies Meta<typeof PageHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithActionsAndFilters: Story = {
  args: {
    badge: (
      <Badge variant="secondary" data-oid="au:9t1y">
        SINCRONIZADO
      </Badge>
    ),
    actions: (
      <>
        <Button variant="outline" size="sm" data-oid="4wqykuz">
          <Download className="mr-2 h-4 w-4" data-oid="-r.z5c7" />
          Exportar
        </Button>
        <Button size="sm" data-oid=":95be3b">
          <Plus className="mr-2 h-4 w-4" data-oid="e6naf5u" />
          Nueva clase
        </Button>
      </>
    ),

    filters: (
      <div className="flex items-center gap-2 text-sm text-muted-foreground" data-oid="zn-.kuh">
        <Filter className="h-4 w-4" data-oid="lt-6bl5" />
        Filtros activos: sede norte, semana actual
      </div>
    ),
  },
}
