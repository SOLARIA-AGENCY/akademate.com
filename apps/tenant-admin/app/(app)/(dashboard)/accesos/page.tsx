'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { ClipboardList, IdCard, ScanLine } from 'lucide-react'

const HUB_CARDS = [
  {
    href: '/accesos/recepcion',
    title: 'Recepción',
    description: 'Registra entradas y salidas con credencial, pase temporal o webcam.',
    icon: ScanLine,
  },
  {
    href: '/accesos/pases',
    title: 'Pases',
    description: 'Emite credenciales QR, pases temporales, visitantes y magic link.',
    icon: IdCard,
  },
  {
    href: '/accesos/historico',
    title: 'Histórico',
    description: 'Consulta el registro de accesos físicos, virtuales e híbridos.',
    icon: ClipboardList,
  },
] as const

export default function AccesosHubPage() {
  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Accesos"
        description="Control de entrada física, campus virtual y sedes híbridas sin cambiar de flujo."
        icon={ScanLine}
      />

      <div className="grid gap-4 md:grid-cols-3">
        {HUB_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.href} href={card.href} className="min-w-0">
              <Card className="h-full transition-colors hover:border-primary/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-4 w-4 text-primary" />
                    {card.title}
                  </CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tipos de acceso</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-3">
          <div>
            <p className="font-medium">Físico</p>
            <p className="text-muted-foreground">
              Credencial QR, foto y registro en puerta. Pensado para sedes presenciales.
            </p>
          </div>
          <div>
            <p className="font-medium">Virtual</p>
            <p className="text-muted-foreground">
              Magic link o usuario temporal enviado por email o SMS al campus virtual.
            </p>
          </div>
          <div>
            <p className="font-medium">Híbrido</p>
            <p className="text-muted-foreground">
              La misma persona puede tener credencial física y envío virtual a la vez.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
