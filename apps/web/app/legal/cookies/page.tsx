import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/legal-page'
import { trackerConfiguration } from '@/lib/public-site'

export const metadata: Metadata = {
  title: 'Cookies',
  description: 'Inventario de cookies y rastreadores de la web pública de Akademate.',
  alternates: { canonical: '/legal/cookies' },
}
export default function CookiesPage() {
  return (
    <LegalPage title="Política de cookies" summary="El inventario se basa en la implementación actual de apps/web, no en integraciones previstas o presentes en otras apps.">
      <section><h2>1. Estado actual</h2><p className="mt-3"><strong>No hay rastreadores opcionales de analítica o marketing activos en la web pública revisada.</strong> Por eso no se muestra un banner que simule una elección inexistente.</p></section>
      <section><h2>2. Almacenamiento esencial</h2><p className="mt-3">Pueden utilizarse cookies estrictamente necesarias para sesión, seguridad o preferencias visuales. No se usan para publicidad en esta superficie y no requieren una opción de rechazo cuando son imprescindibles para el servicio solicitado.</p></section>
      <section><h2>3. Activación futura</h2><p className="mt-3">Una integración opcional exigirá inventario nominal, finalidad, duración, proveedor, carga bloqueada por defecto y consentimiento granular por categoría antes de ejecutarse.</p></section>
      <section><h2>4. Configuración fail-closed</h2><p className="mt-3">Los proveedores solicitados solo por variable de entorno permanecen bloqueados si no existe un cargador revisado. Estado actual: {trackerConfiguration.active.length} activos y {trackerConfiguration.blocked.length} solicitudes bloqueadas.</p></section>
    </LegalPage>
  )
}
