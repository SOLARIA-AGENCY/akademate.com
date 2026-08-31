'use client'

import Link from 'next/link'
import { ClipboardList, DoorOpen, WalletCards } from 'lucide-react'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { EnrollmentBreadcrumb } from '../wizard/EnrollmentBreadcrumb'

const SHORTCUTS = [
  {
    href: '/matriculas',
    title: 'Ver matrículas',
    description: 'Listado de altas y estado de cada expediente.',
    icon: ClipboardList,
  },
  {
    href: '/matriculas/planes',
    title: 'Planes y tarifas',
    description: 'Precios, cuotas y tarifas de acceso.',
    icon: WalletCards,
  },
  {
    href: '/accesos/recepcion',
    title: 'Control de accesos',
    description: 'Recepción, pases y registro de entradas.',
    icon: DoorOpen,
  },
] as const

export default function MatriculasPortalPage() {
  return (
    <div className="min-w-0 space-y-6">
      <EnrollmentBreadcrumb current="Matriculación" />
      <PageHeader
        title="Matriculación"
        actions={
          <Button asChild>
            <Link href="/matriculas/nueva?paso=1">Nueva matrícula</Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {SHORTCUTS.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.href}>
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <Button asChild variant="outline" size="sm">
                  <Link href={item.href}>Abrir</Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
