import { LegalPage } from '@/components/legal/LegalPage'

export const metadata = { title: 'Política de cookies' }

export default function CookiesPage() {
  return (
    <LegalPage
      title="Política de cookies"
      description="Información general sobre el uso de cookies y tecnologías similares en Akademate."
      sections={[
        {
          title: 'Qué son las cookies',
          content: (
            <p>
              Las cookies y tecnologías similares son archivos o identificadores que un sitio puede
              utilizar para recordar preferencias, facilitar funciones técnicas o medir el uso de un
              servicio.
            </p>
          ),
        },
        {
          title: 'Uso actual y consentimiento',
          content: (
            <p>
              Esta página no enumera cookies concretas porque deben verificarse en el entorno
              publicado antes de su declaración definitiva. Las cookies no esenciales, si se
              incorporan, deberán gestionarse mediante un mecanismo de consentimiento apropiado
              antes de activarse.
            </p>
          ),
        },
        {
          title: 'Gestión de preferencias',
          content: (
            <p>
              Puede configurar su navegador para bloquear o eliminar cookies. Algunas funciones
              pueden verse afectadas si desactiva cookies estrictamente necesarias. Cuando esté
              disponible, el panel de preferencias permitirá revisar y modificar las opciones
              aplicables.
            </p>
          ),
        },
      ]}
    />
  )
}
