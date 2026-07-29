import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/LegalPage'

export const metadata: Metadata = { title: 'Transparencia de IA', alternates: { canonical: '/legal/ia' } }

export default function AiTransparencyPage() {
  return <LegalPage title="Transparencia de IA" description="Disponibilidad, límites y controles aplicables a integraciones de inteligencia artificial y MCP." sections={[
    { title: 'Disponibilidad', content: <p>Existe una integración técnica MCP en el producto. Las herramientas, proveedores, credenciales y datos accesibles dependen del despliegue y de la autorización de cada organización. No se afirma compatibilidad universal.</p> },
    { title: 'Supervisión humana', content: <p>Las salidas pueden ser inexactas o incompletas. Deben revisarse antes de ejecutar o publicar acciones y no sustituyen decisiones educativas, legales, financieras o de alto impacto.</p> },
    { title: 'Datos y permisos', content: <p>Cada integración debe limitarse al tenant, rol, recurso y finalidad autorizados. Activar un proveedor externo requiere validar contrato, flujo de datos y configuración.</p> },
    { title: 'Sin certificación', content: <p>Esta información no es un sello de RGPD, Reglamento de IA o seguridad, ni una aprobación regulatoria. Una evaluación independiente puede seguir siendo necesaria.</p> },
  ]} />
}
