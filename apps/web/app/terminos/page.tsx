import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/legal-page'
import { PUBLIC_LEGAL } from '@/lib/public-legal'

export const metadata: Metadata = {
  title: 'Términos de uso',
  description: 'Condiciones de uso de la web pública de Akademate.',
}

export default function TermsPage() {
  return (
    <LegalPage
      title="Términos de uso"
      intro="Condiciones aplicables a la navegación y a las solicitudes realizadas desde la web pública."
    >
      <h2>1. Operador</h2>
      <p>
        La web es operada por <strong>{PUBLIC_LEGAL.operatorName}</strong>, con sede registral en{' '}
        {PUBLIC_LEGAL.registeredCountry}. Registro: {PUBLIC_LEGAL.registryCode}. IVA:{' '}
        {PUBLIC_LEGAL.vatNumber}. Correspondencia: {PUBLIC_LEGAL.correspondenceAddress}.
      </p>
      <p className="legal-warning">
        La identidad contiene placeholders explícitos pendientes de verificación; no debe
        desplegarse así en producción.
      </p>
      <h2>2. Alcance</h2>
      <p>
        El contenido describe el producto y permite solicitar información o acceso. Una solicitud no
        crea automáticamente una cuenta, suscripción, plaza formativa ni derecho a una funcionalidad
        concreta.
      </p>
      <h2>3. Disponibilidad y producto</h2>
      <p>
        Las capacidades pueden variar por configuración, tenant y fase de disponibilidad. Las
        condiciones comerciales, niveles de servicio, tratamiento de datos y precios válidos serán
        exclusivamente los acordados por escrito.
      </p>
      <h2>4. Uso aceptable</h2>
      <p>
        No se permite interferir con el servicio, eludir controles de acceso, introducir código
        malicioso, usar identidades ajenas ni tratar de acceder a datos de otro tenant.
      </p>
      <h2>5. Propiedad intelectual</h2>
      <p>
        Akademate, su software, diseño y contenidos están protegidos por la normativa aplicable. Las
        marcas de terceros pertenecen a sus titulares y su mención no implica patrocinio.
      </p>
      <h2>6. Contacto</h2>
      <p>
        Para consultas sobre estos términos:{' '}
        <a href={`mailto:${PUBLIC_LEGAL.contactEmail}`}>{PUBLIC_LEGAL.contactEmail}</a>.
      </p>
    </LegalPage>
  )
}
