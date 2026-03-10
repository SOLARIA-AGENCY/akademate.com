import type { Meta, StoryObj } from '@storybook/nextjs'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Separator } from '@payload-config/components/ui/separator'
import { Plus, Download } from 'lucide-react'

const meta = {
  title: 'Patrones/PageHeader Standards',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="space-y-6">
      <PageHeader
        title="Catálogo de Cursos"
        description="Gestiona y organiza el catálogo de formación de tu centro."
      />
      <Separator />
      <p className="text-sm text-muted-foreground">Contenido de la página...</p>
    </div>
  ),
}

export const WithActions: Story = {
  render: () => (
    <div className="space-y-6">
      <PageHeader
        title="Alumnos"
        description="Listado completo de alumnos matriculados."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Añadir alumno
            </Button>
          </div>
        }
      />
      <Separator />
    </div>
  ),
}

export const WithCard: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Convocatorias activas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <PageHeader
          title="Filtros de búsqueda"
          description="Refina los resultados según tus criterios."
        />
        <p className="text-sm text-muted-foreground">Contenido con filtros...</p>
      </CardContent>
    </Card>
  ),
}

export const PageLayout: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* PageHeader estándar */}
        <PageHeader
          title="Configuración del Centro"
          description="Gestiona la información de tu centro de formación y sus sedes."
          actions={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva sede
            </Button>
          }
        />
        <Separator />

        {/* Secciones con space-y-6 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información general</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Datos del centro...</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sedes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Lista de sedes...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  ),
}
