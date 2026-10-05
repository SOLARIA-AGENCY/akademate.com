import { LegalPage } from '@/components/legal/LegalPage'

export const metadata = { title: 'Términos de uso' }

export default function TermsPage() {
  return (
    <LegalPage
      title="Términos de uso"
      description="Condiciones generales de acceso a la web y uso del servicio Akademate."
      sections={[
        {
          title: 'Alcance del servicio',
          content: (
            <p>
              Akademate es una plataforma SaaS para la gestión de centros de formación. El acceso a
              funcionalidades concretas, niveles de soporte y tratamiento de datos se rige por el
              contrato aplicable con cada cliente y por la configuración autorizada de su
              organización.
            </p>
          ),
        },
        {
          title: 'Uso autorizado',
          content: (
            <p>
              El usuario debe proporcionar información exacta, mantener sus credenciales protegidas
              y utilizar el servicio conforme a la ley y a los derechos de terceros. No se permite
              interferir con la seguridad, intentar acceder a datos ajenos ni usar el servicio para
              actividades ilícitas.
            </p>
          ),
        },
        {
          title: 'Disponibilidad y cambios',
          content: (
            <p>
              Podemos mantener, actualizar o modificar el servicio para mejorar su seguridad,
              funcionamiento o cumplimiento contractual. No se garantiza disponibilidad
              ininterrumpida ni resultados concretos derivados del uso de la plataforma.
            </p>
          ),
        },
        {
          title: 'Propiedad intelectual y responsabilidad',
          content: (
            <p>
              Akademate, sus contenidos y componentes están protegidos por los derechos aplicables.
              Cada cliente conserva los derechos sobre sus datos. Las limitaciones y
              responsabilidades se concretarán en el contrato aplicable; estos términos no
              sustituyen un acuerdo suscrito.
            </p>
          ),
        },
      ]}
    />
  )
}
