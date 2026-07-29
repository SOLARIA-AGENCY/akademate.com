import type { Metadata } from 'next'
import { LegalPage, PendingValue } from '@/components/legal/legal-page'
import { getPublicLegalIdentity } from '@/lib/public-site'

export const metadata: Metadata = {
  title: 'Términos de uso',
  description: 'Condiciones de acceso y uso de la web pública de Akademate.',
  alternates: { canonical: '/legal/terminos' },
}
export default function TermsPage() {
  const identity = getPublicLegalIdentity()
  return (
    <LegalPage title="Términos de uso" summary="Estas condiciones se limitan a la navegación y contacto en akademate.com; no sustituyen un contrato SaaS firmado.">
      <section><h2>1. Titular de la web</h2><ul className="mt-3 list-disc space-y-1 pl-5"><li><strong>{identity.legalName}</strong></li><li>Registro: <PendingValue value={identity.registryCode} /></li><li>Identificación fiscal: <PendingValue value={identity.taxId} /></li><li>Domicilio: <PendingValue value={identity.registeredAddress} /></li></ul></section>
      <section><h2>2. Alcance</h2><p className="mt-3">La información presenta capacidades generales. La disponibilidad, precio, soporte, migración, integraciones, niveles de servicio y obligaciones se determinan únicamente en la propuesta o contrato aplicable.</p></section>
      <section><h2>3. Solicitudes</h2><p className="mt-3">Enviar un formulario no crea una cuenta, no activa producción, no reserva un precio y no implica aceptación comercial. Los datos deben ser veraces y no incluir secretos ni información especialmente sensible.</p></section>
      <section><h2>4. Propiedad y uso permitido</h2><p className="mt-3">La marca, el diseño y el contenido pertenecen a sus titulares. Se permite la navegación ordinaria; no se autoriza interferir con el servicio, automatizar abuso ni intentar acceder a áreas restringidas.</p></section>
      <section><h2>5. Disponibilidad y responsabilidad</h2><p className="mt-3">La web puede cambiar durante el desarrollo del producto. No se garantizan módulos, integraciones o resultados no confirmados por contrato y evidencia de despliegue.</p></section>
    </LegalPage>
  )
}
