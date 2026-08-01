'use client'

import { CalendarCheck, KeyRound, QrCode, ShieldCheck } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
} from '@akademate/ui'

import { CampusWorkspace } from '../../components/CampusWorkspace'

const activationRequirements = [
  {
    icon: ShieldCheck,
    title: 'Sesión académica validada',
    description: 'La fecha y el horario deben proceder de la programación de la academia.',
  },
  {
    icon: KeyRound,
    title: 'Identidad autenticada',
    description: 'Alumno, tenant y matrícula se resuelven en el servidor.',
  },
  {
    icon: QrCode,
    title: 'Proveedor de acceso configurado',
    description: 'QR, NFC o RFID se habilitan mediante una extensión validada.',
  },
] as const

export default function AttendancePage() {
  return (
    <CampusWorkspace activePath="/asistencia">
      <main className="space-y-6" data-testid="attendance-page">
        <PageHeader
          eyebrow="Campus presencial"
          title="Asistencia"
          description="Consulta y registro de llegadas conectado a sesiones reales."
          actions={<Badge variant="warning">Extensión no configurada</Badge>}
        />

        <Alert variant="warning">
          <AlertTitle>Registro QR todavía no disponible</AlertTitle>
          <AlertDescription>
            Tu academia debe activar una integración de asistencia validada antes de registrar
            llegadas desde este dispositivo.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Requisitos de activación</CardTitle>
            <CardDescription>
              Akademate habilitará el escáner únicamente cuando estas garantías estén configuradas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {activationRequirements.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                  <div
                    className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary"
                    aria-hidden="true"
                  >
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">{title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarCheck className="size-4" aria-hidden="true" />
          La asistencia no se calcula ni se simula mientras el módulo permanezca desactivado.
        </p>
      </main>
    </CampusWorkspace>
  )
}
