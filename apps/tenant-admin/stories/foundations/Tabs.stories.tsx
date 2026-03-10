import type { Meta, StoryObj } from '@storybook/nextjs'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@payload-config/components/ui/tabs'
import { Badge } from '@payload-config/components/ui/badge'

const meta = {
  title: 'Foundations/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="cursos" className="w-96">
      <TabsList>
        <TabsTrigger value="cursos">Cursos</TabsTrigger>
        <TabsTrigger value="alumnos">Alumnos</TabsTrigger>
        <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
      </TabsList>
      <TabsContent value="cursos">
        <p className="text-sm text-muted-foreground pt-2">
          Gestiona el catálogo de cursos activos e inactivos.
        </p>
      </TabsContent>
      <TabsContent value="alumnos">
        <p className="text-sm text-muted-foreground pt-2">
          Lista de alumnos inscritos y su progreso.
        </p>
      </TabsContent>
      <TabsContent value="estadisticas">
        <p className="text-sm text-muted-foreground pt-2">
          Métricas de rendimiento y asistencia del período.
        </p>
      </TabsContent>
    </Tabs>
  ),
}

export const WithBadges: Story = {
  render: () => (
    <Tabs defaultValue="activos" className="w-96">
      <TabsList>
        <TabsTrigger value="activos" className="gap-1.5">
          Activos
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            12
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="borradores" className="gap-1.5">
          Borradores
          <Badge variant="outline" className="text-xs px-1.5 py-0">
            4
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="archivados" className="gap-1.5">
          Archivados
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            8
          </Badge>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="activos">
        <p className="text-sm text-muted-foreground pt-2">12 cursos publicados en el catálogo.</p>
      </TabsContent>
      <TabsContent value="borradores">
        <p className="text-sm text-muted-foreground pt-2">4 cursos pendientes de revisión.</p>
      </TabsContent>
      <TabsContent value="archivados">
        <p className="text-sm text-muted-foreground pt-2">8 cursos archivados de períodos anteriores.</p>
      </TabsContent>
    </Tabs>
  ),
}

export const ProfileDetail: Story = {
  render: () => (
    <Tabs defaultValue="info" className="w-96">
      <TabsList className="w-full">
        <TabsTrigger value="info" className="flex-1">Información</TabsTrigger>
        <TabsTrigger value="horario" className="flex-1">Horario</TabsTrigger>
        <TabsTrigger value="pagos" className="flex-1">Pagos</TabsTrigger>
      </TabsList>
      <TabsContent value="info">
        <div className="pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Nombre</span>
            <span>Ana Martínez López</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>ana@ejemplo.com</span>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="horario">
        <p className="text-sm text-muted-foreground pt-3">Horario: Lunes y Miércoles 18:00–20:00</p>
      </TabsContent>
      <TabsContent value="pagos">
        <p className="text-sm text-muted-foreground pt-3">Último pago: 01/03/2026 — €299</p>
      </TabsContent>
    </Tabs>
  ),
}
