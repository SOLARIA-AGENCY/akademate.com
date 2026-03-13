import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function EquipoPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Equipo & Roles"
        description="Gestión del equipo de operaciones — humanos y agentes IA"
      />
      <Card>
        <CardHeader>
          <CardTitle>En construcción</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Esta sección se desarrollará en Phase 3 con soporte completo para API keys con scopes y roles.
        </CardContent>
      </Card>
    </div>
  )
}
