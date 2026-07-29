import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'
import { trackingPolicy } from '@/lib/legal-config'

export const metadata: Metadata = { title: 'Cookies', alternates: { canonical: '/legal/cookies' } }

export default function CookiesPage() {
  return <LegalPage title="Política de cookies" description="Estado actual de cookies y tecnologías similares en la web pública de Akademate." sections={[
    { title: 'Uso actual', content: <p>{trackingPolicy.statement}</p> },
    { title: 'Tecnologías necesarias', content: <p>Las rutas de autenticación pueden usar cookies de sesión estrictamente necesarias. La interfaz también puede leer una preferencia de tema. Estas funciones no se describen como analítica o publicidad.</p> },
    { title: 'Gate para futuras mediciones', content: <p>{trackingPolicy.activationGate}</p> },
    { title: 'Control del navegador', content: <p>El navegador permite bloquear o eliminar cookies. Desactivar una cookie estrictamente necesaria puede impedir que una sesión autenticada funcione.</p> },
  ]} />
}
