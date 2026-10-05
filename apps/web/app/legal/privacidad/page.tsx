import { LegalPage } from '@/components/legal/LegalPage'
import { legalCompany } from '@/lib/legal-config'

export const metadata = { title: 'Política de privacidad' }

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Política de privacidad"
      description="Cómo tratamos los datos personales relacionados con la web de Akademate y con el servicio SaaS."
      sections={[
        {
          title: 'Quién trata los datos',
          content: (
            <p>
              {legalCompany.name} es responsable del tratamiento de los datos recogidos en su propia
              web, facturación, seguridad y relación comercial. Respecto de los datos que los
              clientes introducen en Akademate para usar el SaaS, actúa como encargado del
              tratamiento siguiendo las instrucciones documentadas del cliente, que determina los
              fines y medios de ese tratamiento.
            </p>
          ),
        },
        {
          title: 'Datos y finalidades',
          content: (
            <p>
              Podemos tratar datos de contacto, información de cuenta, datos de facturación,
              registros de seguridad y la información necesaria para prestar, mantener y proteger el
              servicio. No utilizamos los datos de clientes para fines incompatibles con la
              prestación del SaaS.
            </p>
          ),
        },
        {
          title: 'Bases, conservación y seguridad',
          content: (
            <p>
              Las bases jurídicas y los plazos de conservación dependen de la relación aplicable:
              consentimiento, solicitud precontractual, ejecución de contrato, obligación legal o
              interés legítimo debidamente evaluado. Aplicamos medidas técnicas y organizativas
              razonables; no afirmamos una certificación, adecuación o cumplimiento normativo sin
              evidencia y revisión independientes.
            </p>
          ),
        },
        {
          title: 'Derechos y contacto',
          content: (
            <p>
              Las personas pueden solicitar información, acceso, rectificación, supresión,
              limitación, oposición o portabilidad cuando corresponda. Las solicitudes sobre datos
              del SaaS deben dirigirse primero al cliente responsable. Para asuntos de la web o la
              relación con SOLARIA, contacte con {legalCompany.privacyEmail}.
            </p>
          ),
        },
      ]}
    />
  )
}
