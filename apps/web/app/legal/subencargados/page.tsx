import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'

export const metadata: Metadata = { title: 'Subencargados y proveedores', alternates: { canonical: '/legal/subencargados' } }

export default function SubprocessorsPage() {
  return <LegalPage title="Subencargados y proveedores" description="Estado del inventario público de proveedores que pueden intervenir en la prestación de Akademate." sections={[
    { title: 'Estado del inventario', content: <p>La lista contractual, ubicaciones, transferencias y funciones está pendiente de validación antes de su publicación definitiva. No convertimos dependencias presentes en el código o documentación de infraestructura en una afirmación contractual automática.</p> },
    { title: 'Categorías previsibles', content: <p>Según la configuración contratada pueden intervenir proveedores de alojamiento, red y seguridad, almacenamiento, correo, soporte, observabilidad, pagos o inteligencia artificial. Una categoría no prueba que un proveedor esté activo para un cliente.</p> },
    { title: 'Cambios y garantías', content: <p>Cuando un proveedor trate datos por cuenta de un cliente, su función, ubicación y salvaguardas deberán reflejarse en el contrato o anexo aplicable, junto con el mecanismo de información de cambios.</p> },
    { title: 'Solicitud de información', content: <p>Hasta validar el inventario público, los clientes deben solicitar la versión contractual vigente mediante su canal de relación con SOLARIA.</p> },
  ]} />
}
