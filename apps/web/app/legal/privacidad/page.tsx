import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'
import { legalCompany } from '@/lib/legal-config'

export const metadata: Metadata = { title: 'Privacidad', alternates: { canonical: '/legal/privacidad' } }

export default function PrivacyPage() {
  return <LegalPage title="Política de privacidad" description="Borrador informativo sobre los tratamientos vinculados a la web corporativa y al SaaS Akademate." sections={[
    { title: 'Quién trata los datos', content: <p>{legalCompany.name} actúa como responsable para su web, relación comercial, facturación y seguridad propias. Respecto de los datos que un cliente introduce en el SaaS multitenant futuro o en una instancia Enterprise aislada, el reparto responsable/encargado depende del contrato y del tratamiento concreto. La documentación específica de CEP no se publica como contrato genérico.</p> },
    { title: 'Datos y finalidades', content: <p>La web puede recibir datos de contacto y contexto de una consulta. El servicio puede tratar datos de cuenta, operación académica, facturación y seguridad cuando estén habilitados y exista una base aplicable. No se declara aquí una finalidad de marketing o entrenamiento de modelos con datos de clientes.</p> },
    { title: 'Bases y conservación', content: <p>Las bases y plazos deben concretarse según consentimiento, medidas precontractuales, contrato, obligación legal o interés legítimo evaluado. No se publica un plazo único sin validar el inventario definitivo.</p> },
    { title: 'Derechos y contacto', content: <p>Las solicitudes sobre datos gestionados por una academia deben dirigirse primero a esa organización. El canal específico de privacidad de SOLARIA está pendiente de validación; de forma provisional puede escribirse a hola@akademate.com.</p> },
  ]} />
}
