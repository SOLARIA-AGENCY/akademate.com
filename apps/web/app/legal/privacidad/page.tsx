import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage, PendingValue } from '@/components/legal/legal-page'
import { getPublicLegalIdentity } from '@/lib/public-site'

export const metadata: Metadata = {
  title: 'Privacidad',
  description: 'Información sobre el tratamiento de datos personales en la web pública de Akademate.',
  alternates: { canonical: '/legal/privacidad' },
}
export default function PrivacyPage() {
  const identity = getPublicLegalIdentity()
  return (
    <LegalPage title="Política de privacidad" summary="Describe el tratamiento asociado a esta web pública. No reproduce contratos ni responsabilidades de clientes de Akademate.">
      <section><h2>1. Responsable</h2><ul className="mt-3 list-disc space-y-1 pl-5"><li>Entidad: <strong>{identity.legalName}</strong></li><li>Registro: <PendingValue value={identity.registryCode} /></li><li>Identificación fiscal: <PendingValue value={identity.taxId} /></li><li>Domicilio: <PendingValue value={identity.registeredAddress} /></li><li>Contacto de privacidad: <PendingValue value={identity.legalEmail} /></li></ul></section>
      <section><h2>2. Datos y finalidades</h2><p className="mt-3">Los formularios pueden recoger identidad, contacto, centro, mensaje, metadatos técnicos mínimos y prueba del consentimiento. Se usan para responder consultas, evaluar una solicitud de acceso y proteger el servicio frente a abuso.</p></section>
      <section><h2>3. Base jurídica</h2><p className="mt-3">Consentimiento para formularios voluntarios y, cuando proceda, medidas precontractuales solicitadas por la persona interesada. No se marca consentimiento de marketing por defecto.</p></section>
      <section><h2>4. Conservación y destinatarios</h2><p className="mt-3">Los plazos concretos y proveedores definitivos deben confirmarse documentalmente antes de una publicación contractual. Mientras tanto no se promete un plazo ni un proveedor no acreditado. Consulta el <Link href="/legal/subencargados" className="text-primary underline">registro público de subencargados</Link>.</p></section>
      <section><h2>5. Derechos</h2><p className="mt-3">Puedes solicitar acceso, rectificación, supresión, oposición, limitación o portabilidad mediante el contacto de privacidad indicado arriba. Si el campo sigue pendiente, utiliza el formulario de contacto y no incluyas información sensible.</p></section>
      <section><h2>6. Decisiones automatizadas</h2><p className="mt-3">La web pública no declara decisiones automatizadas con efectos jurídicos. Consulta nuestra <Link href="/legal/transparencia-ia" className="text-primary underline">transparencia sobre IA</Link>.</p></section>
    </LegalPage>
  )
}
