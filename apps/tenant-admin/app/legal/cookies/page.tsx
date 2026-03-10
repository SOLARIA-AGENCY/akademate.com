'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Cookie, Settings, BarChart, Shield, Eye, ArrowLeft } from 'lucide-react'

export default function CookiesPage() {
  const router = useRouter()
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6" data-oid="u2i3aln">
      <div data-oid="ij39-mc">
        <h1 className="text-4xl font-bold mb-2" data-oid="09tuema">
          Política de Cookies
        </h1>
        <p className="text-muted-foreground" data-oid="8c_83lw">
          Última actualización:{' '}
          {new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <Card data-oid="dhgzogf">
        <CardHeader data-oid="rovm4sg">
          <CardTitle className="flex items-center gap-2" data-oid="4209_0:">
            <Cookie className="h-5 w-5" data-oid=":f_.3vr" />
            1. ¿Qué son las cookies?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="1-cmk_-">
          <p data-oid="xq9q69y">
            Las cookies son pequeños archivos de texto que se almacenan en su dispositivo
            (ordenador, tablet, smartphone) cuando visita nuestra plataforma. Permiten que la web
            funcione de manera más eficiente y proporcionan información a los propietarios del
            sitio.
          </p>
          <div className="bg-muted p-4 rounded-lg" data-oid="kb8jmxq">
            <p className="font-semibold mb-2" data-oid=":m8a120">
              Información importante:
            </p>
            <ul className="text-sm space-y-1" data-oid="4ow5p2_">
              <li data-oid="cynwm0:">• Las cookies no pueden dañar su dispositivo</li>
              <li data-oid="47k6qsy">• No contienen virus ni malware</li>
              <li data-oid="7zhdj6k">• No acceden a información personal sin su consentimiento</li>
              <li data-oid="cal9x1q">
                • Puede eliminarlas en cualquier momento desde su navegador
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card data-oid="2og8_2w">
        <CardHeader data-oid="bu8m1ri">
          <CardTitle data-oid="wow66b4">2. Tipos de Cookies que Utilizamos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6" data-oid="a-ujoop">
          <div data-oid="y-6_awd">
            <h4 className="font-semibold flex items-center gap-2 mb-3" data-oid="e:u_4n3">
              <Settings className="h-4 w-4" data-oid="p062kzj" />
              Cookies Técnicas (Estrictamente Necesarias)
            </h4>
            <p className="text-sm mb-2" data-oid="o9kkj-s">
              Son esenciales para el funcionamiento de la plataforma. No requieren consentimiento.
            </p>
            <div className="overflow-x-auto" data-oid="-0zquyp">
              <table className="w-full text-sm border" data-oid="ckms04b">
                <thead className="bg-muted" data-oid="ki7go7k">
                  <tr data-oid="pkg_ccs">
                    <th className="p-2 text-left border" data-oid="lwg8aki">
                      Cookie
                    </th>
                    <th className="p-2 text-left border" data-oid=".j3joy7">
                      Propósito
                    </th>
                    <th className="p-2 text-left border" data-oid="fr4ac0g">
                      Duración
                    </th>
                  </tr>
                </thead>
                <tbody data-oid="yax0bhs">
                  <tr data-oid="db10nj6">
                    <td className="p-2 border font-mono" data-oid="ue56r:i">
                      payload-token
                    </td>
                    <td className="p-2 border" data-oid="nm7hgxa">
                      Gestión de sesión del usuario (httpOnly)
                    </td>
                    <td className="p-2 border" data-oid="kb5dy__">
                      7 días
                    </td>
                  </tr>
                  <tr data-oid="zwp8bua">
                    <td className="p-2 border font-mono" data-oid="_:el7rc">
                      cep_user
                    </td>
                    <td className="p-2 border" data-oid="owwwq48">
                      Metadatos del usuario logueado (no sensible)
                    </td>
                    <td className="p-2 border" data-oid="jm2uc.-">
                      Sesión
                    </td>
                  </tr>
                  <tr data-oid="gw.wrt9">
                    <td className="p-2 border font-mono" data-oid="b8wp.nb">
                      NEXT_LOCALE
                    </td>
                    <td className="p-2 border" data-oid=".2w5t29">
                      Preferencia de idioma
                    </td>
                    <td className="p-2 border" data-oid="xbfjx4u">
                      1 año
                    </td>
                  </tr>
                  <tr data-oid="_292pqo">
                    <td className="p-2 border font-mono" data-oid="lno16:_">
                      csrf_token
                    </td>
                    <td className="p-2 border" data-oid="-0wgjvy">
                      Protección contra ataques CSRF
                    </td>
                    <td className="p-2 border" data-oid="92c_6dj">
                      Sesión
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div data-oid="8.7w526">
            <h4 className="font-semibold flex items-center gap-2 mb-3" data-oid="a2ch-6q">
              <BarChart className="h-4 w-4" data-oid="po96wce" />
              Cookies Analíticas y de Rendimiento
            </h4>
            <p className="text-sm mb-2" data-oid="2o6.ygp">
              Nos permiten analizar cómo los usuarios interactúan con la plataforma para mejorar su
              funcionamiento.
            </p>
            <div className="overflow-x-auto" data-oid="w_baku0">
              <table className="w-full text-sm border" data-oid="di6bl8m">
                <thead className="bg-muted" data-oid="v.eem4e">
                  <tr data-oid="mki8.:3">
                    <th className="p-2 text-left border" data-oid="_-xbdh3">
                      Cookie
                    </th>
                    <th className="p-2 text-left border" data-oid="y58o84d">
                      Proveedor
                    </th>
                    <th className="p-2 text-left border" data-oid="fwl2vyy">
                      Propósito
                    </th>
                    <th className="p-2 text-left border" data-oid="keyfqp-">
                      Duración
                    </th>
                  </tr>
                </thead>
                <tbody data-oid="hqar797">
                  <tr data-oid="e4qht4w">
                    <td className="p-2 border font-mono" data-oid="v63gjl0">
                      _ga
                    </td>
                    <td className="p-2 border" data-oid="rbryakm">
                      Google Analytics
                    </td>
                    <td className="p-2 border" data-oid="z7il8p8">
                      Distinguir usuarios únicos
                    </td>
                    <td className="p-2 border" data-oid="-u-e.dx">
                      2 años
                    </td>
                  </tr>
                  <tr data-oid="fzqbadu">
                    <td className="p-2 border font-mono" data-oid="5vpm-0w">
                      _ga_*
                    </td>
                    <td className="p-2 border" data-oid="of.z100">
                      Google Analytics 4
                    </td>
                    <td className="p-2 border" data-oid="5vvscwq">
                      Mantener estado de sesión
                    </td>
                    <td className="p-2 border" data-oid="-knnfxl">
                      2 años
                    </td>
                  </tr>
                  <tr data-oid="wta-rx1">
                    <td className="p-2 border font-mono" data-oid="mv:e95p">
                      plausible_ignore
                    </td>
                    <td className="p-2 border" data-oid="r0-112x">
                      Plausible Analytics
                    </td>
                    <td className="p-2 border" data-oid="0d8f700">
                      Excluir del análisis (opcional)
                    </td>
                    <td className="p-2 border" data-oid="773jbs_">
                      Permanente
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div data-oid="o6-lt__">
            <h4 className="font-semibold flex items-center gap-2 mb-3" data-oid="wle52c4">
              <Eye className="h-4 w-4" data-oid="iux8llz" />
              Cookies de Marketing y Publicidad
            </h4>
            <p className="text-sm mb-2" data-oid="eyohqqk">
              Utilizadas para mostrar anuncios relevantes y medir la efectividad de nuestras
              campañas.
            </p>
            <div className="overflow-x-auto" data-oid="l8yojc6">
              <table className="w-full text-sm border" data-oid="34tt-v0">
                <thead className="bg-muted" data-oid="baz3c-.">
                  <tr data-oid="uj07k_d">
                    <th className="p-2 text-left border" data-oid="yytlh-m">
                      Cookie
                    </th>
                    <th className="p-2 text-left border" data-oid="fvxhrwq">
                      Proveedor
                    </th>
                    <th className="p-2 text-left border" data-oid="xvlmkkn">
                      Propósito
                    </th>
                    <th className="p-2 text-left border" data-oid="8yspgzn">
                      Duración
                    </th>
                  </tr>
                </thead>
                <tbody data-oid="8cyx3vc">
                  <tr data-oid="pl3hfiu">
                    <td className="p-2 border font-mono" data-oid="zuu._zo">
                      _fbp
                    </td>
                    <td className="p-2 border" data-oid="y:9o9jr">
                      Meta (Facebook)
                    </td>
                    <td className="p-2 border" data-oid="obdz8a7">
                      Seguimiento de conversiones de anuncios
                    </td>
                    <td className="p-2 border" data-oid="px5ceu.">
                      3 meses
                    </td>
                  </tr>
                  <tr data-oid="3nt4lov">
                    <td className="p-2 border font-mono" data-oid="eeox.ji">
                      _fbc
                    </td>
                    <td className="p-2 border" data-oid="kcxw___">
                      Meta (Facebook)
                    </td>
                    <td className="p-2 border" data-oid="d6rwu3a">
                      Almacenar ID de clic en anuncios
                    </td>
                    <td className="p-2 border" data-oid="-lk40ru">
                      2 años
                    </td>
                  </tr>
                  <tr data-oid="5upqj83">
                    <td className="p-2 border font-mono" data-oid="em_4cxo">
                      fr
                    </td>
                    <td className="p-2 border" data-oid="eab_bsv">
                      Meta (Facebook)
                    </td>
                    <td className="p-2 border" data-oid="vmev5yv">
                      Publicidad personalizada
                    </td>
                    <td className="p-2 border" data-oid="jc1zds.">
                      3 meses
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div data-oid="tgiyc3s">
            <h4 className="font-semibold flex items-center gap-2 mb-3" data-oid="hg-xrsr">
              <Shield className="h-4 w-4" data-oid="2wt2vzg" />
              Cookies de Preferencias
            </h4>
            <p className="text-sm mb-2" data-oid="ia:9ec0">
              Recuerdan sus preferencias para personalizar su experiencia.
            </p>
            <div className="overflow-x-auto" data-oid="povcuyd">
              <table className="w-full text-sm border" data-oid="2ksw:-o">
                <thead className="bg-muted" data-oid="-ue9zua">
                  <tr data-oid="whd1apd">
                    <th className="p-2 text-left border" data-oid="z8-az.l">
                      Cookie
                    </th>
                    <th className="p-2 text-left border" data-oid="uyoqzqn">
                      Propósito
                    </th>
                    <th className="p-2 text-left border" data-oid=":vyh_:u">
                      Duración
                    </th>
                  </tr>
                </thead>
                <tbody data-oid="owifzxl">
                  <tr data-oid="3s:vsn1">
                    <td className="p-2 border font-mono" data-oid="jb3f8qb">
                      theme_preference
                    </td>
                    <td className="p-2 border" data-oid="w1f3j0u">
                      Tema claro/oscuro seleccionado
                    </td>
                    <td className="p-2 border" data-oid="l4:wcfn">
                      1 año
                    </td>
                  </tr>
                  <tr data-oid="8ca7_no">
                    <td className="p-2 border font-mono" data-oid="w746z10">
                      sidebar_collapsed
                    </td>
                    <td className="p-2 border" data-oid="f0v1lll">
                      Estado del menú lateral
                    </td>
                    <td className="p-2 border" data-oid="f5i6f07">
                      1 año
                    </td>
                  </tr>
                  <tr data-oid="y19g3g4">
                    <td className="p-2 border font-mono" data-oid="sjjssei">
                      cookies_consent
                    </td>
                    <td className="p-2 border" data-oid="f6ftv43">
                      Registro de consentimiento de cookies
                    </td>
                    <td className="p-2 border" data-oid="nkyyife">
                      1 año
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-oid="us15f0q">
        <CardHeader data-oid="sf6i9sl">
          <CardTitle data-oid="v:g3.bw">3. Base Legal para el Uso de Cookies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3" data-oid="t3qog.m">
          <p data-oid="mslh-p-">El uso de cookies en nuestra plataforma se basa en:</p>
          <ul className="list-disc list-inside ml-4 space-y-2" data-oid="djbuisv">
            <li data-oid="kgv9l5_">
              <strong data-oid="04.9za2">Cookies técnicas:</strong> Exceptuadas de consentimiento
              según Art. 22.2 de la LSSI (Ley de Servicios de la Sociedad de la Información)
            </li>
            <li data-oid="06u7hkc">
              <strong data-oid="gihxmml">Cookies analíticas y de marketing:</strong> Requieren
              consentimiento previo del usuario conforme al RGPD (Reglamento General de Protección
              de Datos)
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card data-oid=":-g.8jr">
        <CardHeader data-oid="9w-4rsy">
          <CardTitle data-oid="-aw:aj4">4. Gestión y Configuración de Cookies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="rdu2-qt">
          <p data-oid="4dc58.q">
            <strong data-oid="iip:1vr">4.1. Panel de configuración de cookies</strong>
          </p>
          <p className="text-sm" data-oid="n5x6z_-">
            Al acceder por primera vez a nuestra plataforma, se mostrará un banner donde podrá:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1 text-sm" data-oid="iti_tin">
            <li data-oid="ao7n_k8">Aceptar todas las cookies</li>
            <li data-oid="5l_dxed">Rechazar cookies opcionales</li>
            <li data-oid="xzipi6o">Configurar qué tipos de cookies desea permitir</li>
          </ul>

          <p className="mt-4" data-oid="0:1dwb6">
            <strong data-oid="hi1wxr0">4.2. Configuración desde el navegador</strong>
          </p>
          <p className="text-sm mb-2" data-oid="tacgg44">
            Puede eliminar o bloquear cookies desde la configuración de su navegador:
          </p>
          <div className="grid gap-3 md:grid-cols-2" data-oid="dznx-m5">
            <div className="bg-muted p-3 rounded-lg text-sm" data-oid="ogx-c86">
              <p className="font-semibold mb-1" data-oid="8agzwa8">
                Google Chrome
              </p>
              <p className="text-xs" data-oid="eistxc2">
                Configuración → Privacidad y seguridad → Cookies y otros datos de sitios
              </p>
            </div>
            <div className="bg-muted p-3 rounded-lg text-sm" data-oid="wqaq2wm">
              <p className="font-semibold mb-1" data-oid="6r-97_b">
                Mozilla Firefox
              </p>
              <p className="text-xs" data-oid="ow8x:fs">
                Opciones → Privacidad y seguridad → Cookies y datos del sitio
              </p>
            </div>
            <div className="bg-muted p-3 rounded-lg text-sm" data-oid="f17pyz.">
              <p className="font-semibold mb-1" data-oid="w69rcc:">
                Safari (macOS)
              </p>
              <p className="text-xs" data-oid="b9k160h">
                Preferencias → Privacidad → Gestionar datos de sitios web
              </p>
            </div>
            <div className="bg-muted p-3 rounded-lg text-sm" data-oid="fy.h680">
              <p className="font-semibold mb-1" data-oid="bl73v2a">
                Microsoft Edge
              </p>
              <p className="text-xs" data-oid="odjpmux">
                Configuración → Privacidad, búsqueda y servicios → Cookies
              </p>
            </div>
          </div>

          <div
            className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg mt-4"
            data-oid="j_-_-tt"
          >
            <p className="text-sm font-semibold mb-2" data-oid="787ee:p">
              ⚠️ Importante:
            </p>
            <p className="text-sm" data-oid="1p.g-oh">
              Bloquear todas las cookies puede afectar al funcionamiento de la plataforma. Algunas
              funcionalidades podrían no estar disponibles.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card data-oid="n-nizjc">
        <CardHeader data-oid="s2a-9cj">
          <CardTitle data-oid="kni8dt_">5. Cookies de Terceros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3" data-oid="j6noj3:">
          <p data-oid="qa7yw_n">
            Nuestra plataforma utiliza servicios de terceros que pueden instalar cookies en su
            dispositivo:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2" data-oid="95m:6yk">
            <li data-oid="kuy8-w:">
              <strong data-oid="r_mo-c7">Google Analytics:</strong>{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
                data-oid="ssgs5ga"
              >
                Política de privacidad
              </a>
            </li>
            <li data-oid="86qp7pg">
              <strong data-oid="1cv7o0x">Meta Pixel (Facebook):</strong>{' '}
              <a
                href="https://www.facebook.com/privacy/policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
                data-oid="0fc:wxe"
              >
                Política de privacidad
              </a>
            </li>
            <li data-oid="3b-a8g3">
              <strong data-oid="pppbntz">Plausible Analytics:</strong>{' '}
              <a
                href="https://plausible.io/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
                data-oid="s.0059v"
              >
                Política de privacidad
              </a>
            </li>
          </ul>
          <p className="mt-4 text-sm" data-oid="f0ullm9">
            CEP FORMACIÓN Y COMUNICACIÓN S.L. no tiene control sobre las cookies de terceros. Le
            recomendamos revisar las políticas de privacidad de estos servicios.
          </p>
        </CardContent>
      </Card>

      <Card data-oid="-98og4p">
        <CardHeader data-oid="vscm.7e">
          <CardTitle data-oid="38vgonm">6. Actualizaciones de esta Política</CardTitle>
        </CardHeader>
        <CardContent data-oid="0a7mfw1">
          <p data-oid="w5mh_n5">
            Podemos actualizar esta Política de Cookies para reflejar cambios en nuestra plataforma
            o en la normativa aplicable. Le notificaremos de cambios significativos mediante aviso
            en la plataforma o por email.
          </p>
          <p className="mt-3" data-oid="foixflo">
            Fecha de la última modificación:{' '}
            {new Date().toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </CardContent>
      </Card>

      <Card data-oid="1v3zx5t">
        <CardHeader data-oid="0s.gcd5">
          <CardTitle data-oid="p9visul">7. Contacto</CardTitle>
        </CardHeader>
        <CardContent data-oid="mhd2p_i">
          <p data-oid="f-:2gtp">Para consultas sobre nuestra Política de Cookies:</p>
          <ul className="list-none ml-4 mt-3 space-y-2" data-oid="mqb_99b">
            <li data-oid=".yspzx6">
              <strong data-oid="eu34rxh">Email:</strong> privacidad@cepcomunicacion.com
            </li>
            <li data-oid="-7zw5or">
              <strong data-oid="x2a:d0u">Teléfono:</strong> +34 922 123 456
            </li>
            <li data-oid="3q7k2lt">
              <strong data-oid="x_n:evy">Dirección:</strong> Calle Principal 123, 38001 Santa Cruz
              de Tenerife
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-6 pb-4" data-oid="czzqsf5">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="gap-2"
          data-oid="cw._q:e"
        >
          <ArrowLeft className="h-4 w-4" data-oid="8k:n3p6" />
          Volver
        </Button>
      </div>
    </div>
  )
}
