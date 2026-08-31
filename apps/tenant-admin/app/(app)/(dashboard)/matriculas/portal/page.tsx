'use client'

import Link from 'next/link'
import {
  ClipboardList,
  CreditCard,
  DoorOpen,
  GraduationCap,
  UserPlus,
  WalletCards,
} from 'lucide-react'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { PAYMENT_METHODS } from '../wizard/types'

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
      <PageHeader
        title="Matriculación"
        description="Alta, cobro y acceso desde un solo hub."
        icon={GraduationCap}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UserPlus className="size-5" aria-hidden="true" />
              </span>
              <div>
                <CardTitle>Nueva matrícula</CardTitle>
                <CardDescription>
                  Convocatoria, alumno, cobro y confirmación en cuatro pasos.
                </CardDescription>
              </div>
            </div>
            <Button asChild>
              <Link href="/matriculas/nueva?paso=1">Empezar</Link>
            </Button>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <CreditCard className="size-5" aria-hidden="true" />
              </span>
              <div>
                <CardTitle>Métodos de cobro</CardTitle>
                <CardDescription>Canales disponibles en recepción.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {PAYMENT_METHODS.map((method) => (
              <div
                key={method}
                className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span>{paymentLabel(method)}</span>
                <Badge variant="secondary">Activo</Badge>
              </div>
            ))}
            <Button asChild variant="outline" size="sm" className="mt-2 w-full">
              <Link href="/matriculas/planes">Ver planes</Link>
            </Button>
          </CardContent>
        </Card>

        {SHORTCUTS.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} className="block min-h-0">
              <Card className="h-full transition-colors hover:bg-muted/40">
                <CardHeader>
                  <span className="mb-2 flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function paymentLabel(method: (typeof PAYMENT_METHODS)[number]): string {
  switch (method) {
    case 'sepa':
      return 'Domiciliación SEPA'
    case 'card_online':
      return 'Tarjeta online'
    case 'card_pos':
      return 'Tarjeta en punto de cobro'
    case 'transfer':
      return 'Transferencia'
    case 'cash':
      return 'Efectivo'
    default: {
      const _exhaustive: never = method
      return _exhaustive
    }
  }
}
