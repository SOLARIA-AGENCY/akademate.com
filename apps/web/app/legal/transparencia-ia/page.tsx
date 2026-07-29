import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Transparencia sobre IA',
  description: 'Límites y principios de transparencia sobre IA y MCP en Akademate.',
  alternates: { canonical: '/legal/transparencia-ia' },
}
export default function AiTransparencyPage() {
  return (
    <LegalPage title="Transparencia sobre IA" summary="Akademate no presenta la compatibilidad con IA o MCP como una capacidad general activa sin evidencia de integración y despliegue.">
      <section><h2>1. Estado público</h2><p className="mt-3">La web no afirma que asistentes externos puedan crear cursos, matricular alumnado, consultar analítica o ejecutar acciones mediante MCP. Cualquier integración futura debe documentarse por entorno y contrato.</p></section>
      <section><h2>2. Permisos y supervisión</h2><p className="mt-3">Una función asistida no amplía permisos por sí misma. Debe respetar tenant, rol, propósito, registro de actividad y revisión humana cuando la decisión pueda afectar a personas.</p></section>
      <section><h2>3. Datos</h2><p className="mt-3">No deben enviarse datos personales o confidenciales a un proveedor de IA sin base jurídica, minimización, contrato aplicable y configuración explícita.</p></section>
      <section><h2>4. Distintivos</h2><p className="mt-3">Los badges regulatorios de esta web facilitan navegación e información. No acreditan certificación, conformidad legal integral ni auditoría independiente.</p></section>
    </LegalPage>
  )
}
