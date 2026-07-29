import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Subencargados',
  description: 'Transparencia sobre proveedores que pueden tratar datos para Akademate.',
}

export default function SubprocessorsPage() {
  return (
    <LegalPage
      title="Subencargados y proveedores"
      intro="Registro público prudente de categorías de proveedor; no convierte documentación técnica en un contrato."
    >
      <h2>Estado del registro</h2>
      <p>
        La lista contractual de subencargados, ubicaciones de tratamiento y mecanismos de
        transferencia está <strong>pendiente de validación jurídica y operativa</strong>. No
        publicamos nombres inferidos únicamente desde dependencias del repositorio.
      </p>
      <h2>Categorías previstas</h2>
      <ul>
        <li>Alojamiento e infraestructura.</li>
        <li>Almacenamiento, copias de seguridad y entrega de archivos.</li>
        <li>Correo transaccional y soporte.</li>
        <li>Pagos, solo cuando el cliente activa esa integración.</li>
        <li>
          Servicios de IA, solo para funciones expresamente activadas y bajo el contrato aplicable.
        </li>
      </ul>
      <h2>Antes de producción</h2>
      <p>
        Debe verificarse para cada proveedor su entidad legal, finalidad, datos afectados, región,
        contrato, subcontratación y salvaguardas internacionales. Hasta entonces esta página es
        transparencia de estado, no una lista contractual completa.
      </p>
    </LegalPage>
  )
}
