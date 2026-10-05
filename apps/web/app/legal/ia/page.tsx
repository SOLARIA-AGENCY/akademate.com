import { LegalPage } from '@/components/legal/LegalPage'

export const metadata = { title: 'Transparencia de IA' }

export default function AiTransparencyPage() {
  return (
    <LegalPage
      title="Transparencia de IA"
      description="Cómo se presentan las funcionalidades y las limitaciones de las integraciones de inteligencia artificial en Akademate."
      sections={[
        {
          title: 'Uso previsto',
          content: (
            <p>
              Akademate puede ofrecer integraciones con herramientas de inteligencia artificial para
              asistir tareas autorizadas por el usuario. Su disponibilidad y alcance dependen de la
              configuración, permisos y proveedores habilitados por cada organización.
            </p>
          ),
        },
        {
          title: 'Supervisión humana',
          content: (
            <p>
              Las salidas de IA pueden ser inexactas, incompletas o no adecuadas para un contexto
              concreto. No deben utilizarse como sustituto de la revisión humana, el criterio
              profesional, decisiones educativas, legales, financieras o de alto impacto.
            </p>
          ),
        },
        {
          title: 'Datos y permisos',
          content: (
            <p>
              Las integraciones deben respetar los permisos de la organización y el contrato de
              tratamiento aplicable. Antes de activar un proveedor o transferir datos, el cliente
              debe evaluar si la configuración es apropiada para sus obligaciones y sus personas
              usuarias.
            </p>
          ),
        },
        {
          title: 'Sin sello regulatorio',
          content: (
            <p>
              La información de esta página describe prácticas y límites de producto. No supone
              certificación, aprobación regulatoria ni una declaración de cumplimiento legal. La
              evaluación jurídica y técnica independiente sigue siendo necesaria.
            </p>
          ),
        },
      ]}
    />
  )
}
