'use client'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { use, useEffect, useState } from 'react'
import { ComingSoonPage } from '@payload-config/components/ui/ComingSoonPage'
import { DashboardPageShell } from '@payload-config/components/akademate/dashboard'
import { Button } from '@payload-config/components/ui/button'
import { DRAFT_MODULES } from '@/app/lib/draft-modules'

function OperationalPanel({
  title,
  body,
  href,
  hrefLabel,
  items,
}: {
  title: string
  body: string
  href: string
  hrefLabel: string
  items: string[]
}) {
  return (
    <DashboardPageShell title={title}>
      <p className="text-sm text-muted-foreground">{body}</p>
      {items.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      <Button asChild size="sm" variant="outline">
        <Link href={href}>{hrefLabel}</Link>
      </Button>
    </DashboardPageShell>
  )
}

function MessagingInbox() {
  const [items, setItems] = useState<string[]>([])
  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/notifications', { cache: 'no-store' })
      if (!response.ok) return
      const payload = (await response.json()) as { notifications?: Array<{ title?: string }> }
      setItems((payload.notifications ?? []).map((item) => item.title || 'Notificación'))
    }
    void load()
  }, [])
  return (
    <OperationalPanel
      title="Mensajería"
      body="Inbox sobre notificaciones existentes. No hay chat ni SAML."
      href="/administracion/actividad"
      hrefLabel="Ver actividad"
      items={items.slice(0, 8)}
    />
  )
}

export default function DraftModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const module = DRAFT_MODULES[slug]
  if (!module) {
    notFound()
  }

  if (slug === 'comunicacion') {
    return <MessagingInbox />
  }
  if (slug === 'calendario-google') {
    return (
      <OperationalPanel
        title="Google Calendar"
        body="El conector vive en Configuración. Esta página no inicia OAuth nuevo."
        href="/configuracion/integraciones"
        hrefLabel="Abrir integraciones"
        items={['Estado GCal en el hub de integraciones']}
      />
    )
  }
  if (slug === 'webhooks') {
    return (
      <OperationalPanel
        title="Centro de webhooks"
        body="Receivers ya instalados. No hay bus de eventos propio."
        href="/administracion/actividad"
        hrefLabel="Ver audit logs"
        items={['/api/webhooks/stripe', '/api/webhooks/meta-leads']}
      />
    )
  }
  if (slug === 'sso') {
    return (
      <OperationalPanel
        title="SSO / SAML"
        body="No hay IdP. El acceso staff sigue en usuarios y API keys."
        href="/administracion/usuarios"
        hrefLabel="Ir a usuarios"
        items={['API keys en Configuración']}
      />
    )
  }

  return (
    <ComingSoonPage
      title={module.title}
      description={module.description}
      icon={module.icon}
      expectedPhase={module.expectedPhase}
      plannedFeatures={module.plannedFeatures}
      note={module.note}
    />
  )
}
