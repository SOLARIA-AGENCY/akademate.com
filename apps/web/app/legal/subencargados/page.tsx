import { LegalPage } from '@/components/legal/LegalPage'

export const metadata = { title: 'Subencargados' }

export default function SubprocessorsPage() {
  return (
    <LegalPage
      title="Subencargados"
      description="Criterios de transparencia sobre proveedores que pueden tratar datos personales para prestar Akademate."
      sections={[
        {
          title: 'Alcance',
          content: (
            <p>
              SOLARIA puede recurrir a proveedores de infraestructura, comunicaciones, soporte,
              almacenamiento o seguridad cuando sean necesarios para prestar y proteger el SaaS.
              Cuando traten datos personales por cuenta de un cliente, actúan como subencargados
              bajo las salvaguardas contractuales aplicables.
            </p>
          ),
        },
        {
          title: 'Lista y cambios',
          content: (
            <p>
              La lista contractual de subencargados, sus ubicaciones y la información de cambio se
              facilitará a los clientes en la documentación contractual aplicable. No publicamos
              aquí una lista técnica no verificada ni detalles de infraestructura que puedan
              incrementar el riesgo operativo.
            </p>
          ),
        },
        {
          title: 'Garantías',
          content: (
            <p>
              La selección y supervisión de proveedores se realiza atendiendo a la necesidad del
              servicio, medidas de seguridad, confidencialidad y requisitos de protección de datos
              pertinentes. Esta explicación no constituye una certificación de proveedores ni una
              garantía de cumplimiento jurídico.
            </p>
          ),
        },
      ]}
    />
  )
}
