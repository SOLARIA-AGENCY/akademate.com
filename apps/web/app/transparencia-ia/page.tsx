import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal/legal-page'
import { NON_CERTIFICATION_NOTICE } from '@/lib/public-legal'

export const metadata: Metadata = {
  title: 'Transparencia e IA',
  description:
    'Información sobre el uso y los límites de funciones de inteligencia artificial en Akademate.',
}

export default function AiTransparencyPage() {
  return (
    <LegalPage
      title="Transparencia e inteligencia artificial"
      intro="Distingue la infraestructura disponible de las funciones que cada organización puede tener realmente activadas."
    >
      <h2>Estado de las funciones</h2>
      <p>
        El monorepo contiene infraestructura MCP y módulos relacionados con automatización. Esa
        presencia técnica no demuestra que todos los asistentes, acciones o tenants estén conectados
        en producción.
      </p>
      <h2>Uso responsable</h2>
      <p>
        Las funciones asistidas deben indicar su finalidad, datos utilizados y posibilidad de
        revisión humana. No deben tomar por sí solas decisiones jurídicas o de efectos
        significativos sobre admisiones, evaluaciones, empleo o pagos.
      </p>
      <h2>Permisos y datos</h2>
      <p>
        Una integración solo debe acceder al alcance autorizado para el usuario y la organización.
        La activación requiere configuración, controles de acceso probados y documentación
        contractual; una marca o logotipo no prueba interoperabilidad.
      </p>
      <h2>Distintivo informativo</h2>
      <p>{NON_CERTIFICATION_NOTICE}</p>
      <h2>Comunicar una incidencia</h2>
      <p>
        Si detectas contenido incorrecto o una automatización inesperada, detén el flujo cuando sea
        posible y comunícalo mediante la página de contacto para revisión humana.
      </p>
    </LegalPage>
  )
}
