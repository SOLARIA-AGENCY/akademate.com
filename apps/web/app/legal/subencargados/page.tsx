import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/legal-page'
import { LEGAL_PLACEHOLDER } from '@/lib/public-site'

export const metadata: Metadata = {
  title: 'Subencargados',
  description: 'Registro público de categorías de subencargados de Akademate.',
  alternates: { canonical: '/legal/subencargados' },
}
const categories = [
  ['Infraestructura y alojamiento', LEGAL_PLACEHOLDER],
  ['Correo transaccional y soporte', LEGAL_PLACEHOLDER],
  ['Autenticación externa opcional', 'Solo cuando se configure y acepte contractualmente; proveedor nominal pendiente'],
  ['Servicios de IA', 'Ningún proveedor general declarado como activo para esta web pública'],
] as const

export default function SubprocessorsPage() {
  return (
    <LegalPage title="Registro de subencargados" summary="No se infieren proveedores contractuales a partir de dependencias, infraestructura histórica o la instalación de un cliente.">
      <section><h2>Registro público</h2><div className="mt-4 overflow-x-auto"><table className="w-full border-collapse text-left"><thead><tr><th className="border-b p-3">Categoría</th><th className="border-b p-3">Estado verificable</th></tr></thead><tbody>{categories.map(([category, status]) => <tr key={category}><td className="border-b p-3 font-medium text-foreground">{category}</td><td className="border-b p-3 text-muted-foreground">{status}</td></tr>)}</tbody></table></div></section>
      <section><h2>Criterio de publicación</h2><p className="mt-3">Un proveedor se nombrará cuando exista confirmación contractual de su función, ubicación y salvaguardas. Los placeholders evitan atribuir a SOLARIA AGENCY OÜ o a terceros responsabilidades no verificadas.</p></section>
    </LegalPage>
  )
}
