'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Cookie, Settings, BarChart, Shield, Eye, ArrowLeft } from 'lucide-react'

export default function CookiesPage() {
  const router = useRouter()
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Política de Cookies</h1>
        <p className="text-muted-foreground">
          Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cookie className="h-5 w-5" />
            1. ¿Qué son las cookies?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Las cookies son pequeños archivos de texto que se almacenan en su dispositivo (ordenador,
            tablet, smartphone) cuando visita nuestra plataforma. Permiten que la web funcione de
            manera más eficiente y proporcionan información a los propietarios del sitio.
          </p>
          <div className="bg-muted p-4 rounded-lg">
            <p className="font-semibold mb-2">Información importante:</p>
            <ul className="text-sm space-y-1">
              <li>• Las cookies no pueden dañar su dispositivo</li>
              <li>• No contienen virus ni malware</li>
              <li>• No acceden a información personal sin su consentimiento</li>
              <li>• Puede eliminarlas en cualquier momento desde su navegador</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Tipos de Cookies que Utilizamos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <Settings className="h-4 w-4" />
              Cookies Técnicas (Estrictamente Necesarias)
            </h4>
            <p className="text-sm mb-2">
              Son esenciales para el funcionamiento de la plataforma. No requieren consentimiento.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left border">Cookie</th>
                    <th className="p-2 text-left border">Propósito</th>
                    <th className="p-2 text-left border">Duración</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border font-mono">cep_auth_token</td>
                    <td className="p-2 border">Gestión de sesión del usuario</td>
                    <td className="p-2 border">Sesión</td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-mono">cep_user</td>
                    <td className="p-2 border">Información del usuario logueado</td>
                    <td className="p-2 border">Sesión</td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-mono">NEXT_LOCALE</td>
                    <td className="p-2 border">Preferencia de idioma</td>
                    <td className="p-2 border">1 año</td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-mono">csrf_token</td>
                    <td className="p-2 border">Protección contra ataques CSRF</td>
                    <td className="p-2 border">Sesión</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <BarChart className="h-4 w-4" />
              Cookies Analíticas y de Rendimiento
            </h4>
            <p className="text-sm mb-2">
              Nos permiten analizar cómo los usuarios interactúan con la plataforma para mejorar su funcionamiento.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left border">Cookie</th>
                    <th className="p-2 text-left border">Proveedor</th>
                    <th className="p-2 text-left border">Propósito</th>
                    <th className="p-2 text-left border">Duración</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border font-mono">_ga</td>
                    <td className="p-2 border">Google Analytics</td>
                    <td className="p-2 border">Distinguir usuarios únicos</td>
                    <td className="p-2 border">2 años</td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-mono">_ga_*</td>
                    <td className="p-2 border">Google Analytics 4</td>
                    <td className="p-2 border">Mantener estado de sesión</td>
                    <td className="p-2 border">2 años</td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-mono">plausible_ignore</td>
                    <td className="p-2 border">Plausible Analytics</td>
                    <td className="p-2 border">Excluir del análisis (opcional)</td>
                    <td className="p-2 border">Permanente</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4" />
              Cookies de Marketing y Publicidad
            </h4>
            <p className="text-sm mb-2">
              Utilizadas para mostrar anuncios relevantes y medir la efectividad de nuestras campañas.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left border">Cookie</th>
                    <th className="p-2 text-left border">Proveedor</th>
                    <th className="p-2 text-left border">Propósito</th>
                    <th className="p-2 text-left border">Duración</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border font-mono">_fbp</td>
                    <td className="p-2 border">Meta (Facebook)</td>
                    <td className="p-2 border">Seguimiento de conversiones de anuncios</td>
                    <td className="p-2 border">3 meses</td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-mono">_fbc</td>
                    <td className="p-2 border">Meta (Facebook)</td>
                    <td className="p-2 border">Almacenar ID de clic en anuncios</td>
                    <td className="p-2 border">2 años</td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-mono">fr</td>
                    <td className="p-2 border">Meta (Facebook)</td>
                    <td className="p-2 border">Publicidad personalizada</td>
                    <td className="p-2 border">3 meses</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4" />
              Cookies de Preferencias
            </h4>
            <p className="text-sm mb-2">
              Recuerdan sus preferencias para personalizar su experiencia.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left border">Cookie</th>
                    <th className="p-2 text-left border">Propósito</th>
                    <th className="p-2 text-left border">Duración</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border font-mono">theme_preference</td>
                    <td className="p-2 border">Tema claro/oscuro seleccionado</td>
                    <td className="p-2 border">1 año</td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-mono">sidebar_collapsed</td>
                    <td className="p-2 border">Estado del menú lateral</td>
                    <td className="p-2 border">1 año</td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-mono">cookies_consent</td>
                    <td className="p-2 border">Registro de consentimiento de cookies</td>
                    <td className="p-2 border">1 año</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Base Legal para el Uso de Cookies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            El uso de cookies en nuestra plataforma se basa en:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>
              <strong>Cookies técnicas:</strong> Exceptuadas de consentimiento según Art. 22.2 de la LSSI
              (Ley de Servicios de la Sociedad de la Información)
            </li>
            <li>
              <strong>Cookies analíticas y de marketing:</strong> Requieren consentimiento previo del usuario
              conforme al RGPD (Reglamento General de Protección de Datos)
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Gestión y Configuración de Cookies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p><strong>4.1. Panel de configuración de cookies</strong></p>
          <p className="text-sm">
            Al acceder por primera vez a nuestra plataforma, se mostrará un banner donde podrá:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
            <li>Aceptar todas las cookies</li>
            <li>Rechazar cookies opcionales</li>
            <li>Configurar qué tipos de cookies desea permitir</li>
          </ul>

          <p className="mt-4"><strong>4.2. Configuración desde el navegador</strong></p>
          <p className="text-sm mb-2">
            Puede eliminar o bloquear cookies desde la configuración de su navegador:
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="bg-muted p-3 rounded-lg text-sm">
              <p className="font-semibold mb-1">Google Chrome</p>
              <p className="text-xs">Configuración → Privacidad y seguridad → Cookies y otros datos de sitios</p>
            </div>
            <div className="bg-muted p-3 rounded-lg text-sm">
              <p className="font-semibold mb-1">Mozilla Firefox</p>
              <p className="text-xs">Opciones → Privacidad y seguridad → Cookies y datos del sitio</p>
            </div>
            <div className="bg-muted p-3 rounded-lg text-sm">
              <p className="font-semibold mb-1">Safari (macOS)</p>
              <p className="text-xs">Preferencias → Privacidad → Gestionar datos de sitios web</p>
            </div>
            <div className="bg-muted p-3 rounded-lg text-sm">
              <p className="font-semibold mb-1">Microsoft Edge</p>
              <p className="text-xs">Configuración → Privacidad, búsqueda y servicios → Cookies</p>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg mt-4">
            <p className="text-sm font-semibold mb-2">⚠️ Importante:</p>
            <p className="text-sm">
              Bloquear todas las cookies puede afectar al funcionamiento de la plataforma. Algunas
              funcionalidades podrían no estar disponibles.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Cookies de Terceros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            Nuestra plataforma utiliza servicios de terceros que pueden instalar cookies en su dispositivo:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>
              <strong>Google Analytics:</strong>{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Política de privacidad
              </a>
            </li>
            <li>
              <strong>Meta Pixel (Facebook):</strong>{' '}
              <a
                href="https://www.facebook.com/privacy/policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Política de privacidad
              </a>
            </li>
            <li>
              <strong>Plausible Analytics:</strong>{' '}
              <a
                href="https://plausible.io/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Política de privacidad
              </a>
            </li>
          </ul>
          <p className="mt-4 text-sm">
            CEP FORMACIÓN Y COMUNICACIÓN S.L. no tiene control sobre las cookies de terceros.
            Le recomendamos revisar las políticas de privacidad de estos servicios.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Actualizaciones de esta Política</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Podemos actualizar esta Política de Cookies para reflejar cambios en nuestra plataforma
            o en la normativa aplicable. Le notificaremos de cambios significativos mediante aviso
            en la plataforma o por email.
          </p>
          <p className="mt-3">
            Fecha de la última modificación: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Contacto</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Para consultas sobre nuestra Política de Cookies:</p>
          <ul className="list-none ml-4 mt-3 space-y-2">
            <li><strong>Email:</strong> privacidad@cepcomunicacion.com</li>
            <li><strong>Teléfono:</strong> +34 922 123 456</li>
            <li><strong>Dirección:</strong> Calle Principal 123, 38001 Santa Cruz de Tenerife</li>
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-6 pb-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>
    </div>
  )
}
