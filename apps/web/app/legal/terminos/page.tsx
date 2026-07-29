import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'

export const metadata: Metadata = { title: 'Términos de uso', alternates: { canonical: '/legal/terminos' } }

export default function TermsPage() {
  return <LegalPage title="Términos de uso" description="Condiciones informativas de acceso a la web y límite entre esta información y el contrato del servicio." sections={[
    { title: 'Alcance y modelos de servicio', content: <p>akademate.com describe el SaaS general todavía en preparación para apertura multitenant. Las instancias Enterprise son despliegues aislados por cliente bajo contrato; la configuración de CEP Formación no se incorpora automáticamente al SaaS general ni a otros clientes. Módulos, soporte, disponibilidad, precio, límites, integraciones y responsabilidades solo quedan comprometidos en la oferta o contrato aplicable.</p> },
    { title: 'Uso autorizado', content: <p>No se permite interferir con la seguridad, acceder a datos ajenos, abusar de formularios o utilizar el servicio para fines ilícitos. Las credenciales deben mantenerse protegidas.</p> },
    { title: 'Disponibilidad y cambios', content: <p>La información puede actualizarse para reflejar el estado del producto. No se garantiza disponibilidad ininterrumpida ni resultados concretos desde esta página pública.</p> },
    { title: 'Propiedad y responsabilidad', content: <p>Akademate y sus componentes están sujetos a los derechos aplicables. Cada cliente conserva sus derechos y responsabilidades sobre sus datos. Las limitaciones de responsabilidad requieren acuerdo contractual y revisión jurídica.</p> },
  ]} />
}
