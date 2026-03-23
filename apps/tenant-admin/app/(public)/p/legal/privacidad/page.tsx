'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Shield, Mail, Phone, MapPin, ArrowLeft } from 'lucide-react'

export default function PrivacidadPage() {
  const router = useRouter()
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6" data-oid="mqb34_e">
      <div data-oid="uiijlyy">
        <h1 className="text-4xl font-bold mb-2" data-oid="su0jeix">
          Política de Privacidad
        </h1>
        <p className="text-muted-foreground" data-oid="ecs07rp">
          Última actualización:{' '}
          {new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <Card data-oid="dolr0ja">
        <CardHeader data-oid="9zabz.b">
          <CardTitle className="flex items-center gap-2" data-oid="ctgz9.k">
            <Shield className="h-5 w-5" data-oid="epi_:hf" />
            1. Responsable del Tratamiento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="aioxkuc">
          <div className="space-y-2" data-oid="xf6apq0">
            <p data-oid="qao-omy">
              <strong data-oid="6caraqd">Razón Social:</strong> CEP FORMACIÓN Y COMUNICACIÓN S.L.
            </p>
            <p data-oid="zfw-god">
              <strong data-oid="ivwse37">CIF:</strong> B-XXXXXXXX
            </p>
            <div className="flex items-start gap-2" data-oid="fwll6um">
              <MapPin className="h-4 w-4 mt-1 text-muted-foreground" data-oid="367ejrz" />
              <div data-oid="_1gr0ft">
                <p data-oid="x6:p7qz">
                  <strong data-oid="gahcmdo">Domicilio Social:</strong>
                </p>
                <p data-oid="4e2vmla">Calle Principal 123, 38001 Santa Cruz de Tenerife, España</p>
              </div>
            </div>
            <div className="flex items-center gap-2" data-oid="pz61n71">
              <Mail className="h-4 w-4 text-muted-foreground" data-oid="2va-w3a" />
              <p data-oid="posxz4v">
                <strong data-oid="b4zxcc:">Email de contacto:</strong>{' '}
                privacidad@cepcomunicacion.com
              </p>
            </div>
            <div className="flex items-center gap-2" data-oid="snlzwgd">
              <Phone className="h-4 w-4 text-muted-foreground" data-oid="u8maozt" />
              <p data-oid="tc4uuag">
                <strong data-oid="6acdn79">Teléfono:</strong> +34 922 123 456
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-oid="ceuzw8m">
        <CardHeader data-oid="hpiv7d3">
          <CardTitle data-oid="_5edk:1">2. Datos Personales que Tratamos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="56_pq_w">
          <p data-oid="yqgs.mm">
            En CEP FORMACIÓN Y COMUNICACIÓN S.L. tratamos los siguientes datos personales:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4" data-oid="wm0__9u">
            <li data-oid="80lbu:o">
              <strong data-oid="1e6854z">Datos identificativos:</strong> Nombre, apellidos, DNI/NIE,
              fecha de nacimiento
            </li>
            <li data-oid="_gyjruk">
              <strong data-oid="qxup3e8">Datos de contacto:</strong> Dirección postal, email,
              teléfono
            </li>
            <li data-oid="_5aqdp3">
              <strong data-oid="_j.c827">Datos académicos:</strong> Historial formativo,
              calificaciones, certificados
            </li>
            <li data-oid="oku-lpq">
              <strong data-oid="_ywh4n2">Datos de navegación:</strong> Dirección IP, cookies, datos
              de uso de la plataforma
            </li>
            <li data-oid="-8jmv0e">
              <strong data-oid="whkssss">Datos bancarios:</strong> Únicamente para gestión de pagos
              (no almacenados directamente)
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card data-oid="imazzms">
        <CardHeader data-oid="9hoh:mt">
          <CardTitle data-oid="u0a33sl">3. Finalidad del Tratamiento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" data-oid=".9gr_vi">
          <p data-oid="kbphnmb">Tratamos sus datos personales para las siguientes finalidades:</p>
          <div className="space-y-4" data-oid="l-sxg45">
            <div data-oid="elm_s78">
              <h4 className="font-semibold mb-2" data-oid="s04t39n">
                Gestión académica y administrativa
              </h4>
              <ul className="list-disc list-inside ml-4 space-y-1" data-oid="h6o-tyy">
                <li data-oid="smzmnu3">Inscripción y matrícula en cursos y ciclos formativos</li>
                <li data-oid="ps.b.-9">Gestión de expedientes académicos</li>
                <li data-oid="e34:xn_">Emisión de certificados y diplomas</li>
                <li data-oid="3r-jwrw">Comunicaciones relacionadas con su formación</li>
              </ul>
            </div>
            <div data-oid="74yx2_n">
              <h4 className="font-semibold mb-2" data-oid="fdt0f73">
                Marketing y comunicación comercial
              </h4>
              <ul className="list-disc list-inside ml-4 space-y-1" data-oid="s9ba3v8">
                <li data-oid="h_11ua_">Envío de newsletters con información de cursos</li>
                <li data-oid="ooc5nda">Publicidad de nuevos programas formativos</li>
                <li data-oid="wd8_3l3">Invitaciones a eventos y jornadas de puertas abiertas</li>
              </ul>
            </div>
            <div data-oid="11bmr.y">
              <h4 className="font-semibold mb-2" data-oid="2_q6gt0">
                Cumplimiento de obligaciones legales
              </h4>
              <ul className="list-disc list-inside ml-4 space-y-1" data-oid="7f4m2rz">
                <li data-oid="hs7dsgj">Obligaciones fiscales y contables</li>
                <li data-oid="qx4_2z_">Requerimientos de autoridades educativas</li>
                <li data-oid="q:2cg_i">Prevención de fraude y blanqueo de capitales</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-oid="musjm:9">
        <CardHeader data-oid="2.mc5t:">
          <CardTitle data-oid="-r5pn88">4. Base Legal del Tratamiento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3" data-oid="islwscy">
          <p data-oid="gasrsje">El tratamiento de sus datos se basa en:</p>
          <ul className="list-disc list-inside ml-4 space-y-2" data-oid="5-0avwt">
            <li data-oid="rcsjjiq">
              <strong data-oid="j.o66mc">Ejecución de un contrato:</strong> Gestión de su matrícula
              y formación
            </li>
            <li data-oid="mq.yunm">
              <strong data-oid="n:u0ugb">Consentimiento del interesado:</strong> Envío de
              comunicaciones comerciales
            </li>
            <li data-oid="c424dnt">
              <strong data-oid="j6ars9n">Cumplimiento de obligaciones legales:</strong> Normativa
              fiscal y educativa
            </li>
            <li data-oid="2-akofo">
              <strong data-oid="ea8m6d8">Interés legítimo:</strong> Mejora de nuestros servicios y
              seguridad
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card data-oid="pn27u2x">
        <CardHeader data-oid="4idps2v">
          <CardTitle data-oid="q4vqy1l">5. Conservación de Datos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3" data-oid="8fhi:mm">
          <p data-oid="m3ypvin">Conservaremos sus datos personales durante:</p>
          <ul className="list-disc list-inside ml-4 space-y-2" data-oid=".i_:k3g">
            <li data-oid="..4o62v">
              <strong data-oid="qyw47:8">Datos académicos:</strong> Indefinidamente, según normativa
              educativa
            </li>
            <li data-oid="4qxs98b">
              <strong data-oid="qgrlosv">Datos contractuales:</strong> Duración de la relación
              contractual + 6 años (obligaciones fiscales)
            </li>
            <li data-oid="8qlv8x5">
              <strong data-oid="96z-9us">Datos de marketing:</strong> Hasta que revoque su
              consentimiento
            </li>
            <li data-oid="g.pxx_j">
              <strong data-oid="wn7-qrb">Datos de navegación:</strong> Máximo 2 años
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card data-oid="wyudnnc">
        <CardHeader data-oid=".-f4big">
          <CardTitle data-oid="z:r5-xt">6. Destinatarios de los Datos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3" data-oid="jpa::bg">
          <p data-oid="jjllg.t">Sus datos podrán ser comunicados a:</p>
          <ul className="list-disc list-inside ml-4 space-y-2" data-oid="do01z03">
            <li data-oid="kymnif2">
              <strong data-oid="lgo0xyq">Consejería de Educación:</strong> Para homologación y
              certificación de estudios
            </li>
            <li data-oid="9crsi0j">
              <strong data-oid="zqhy:8f">Agencia Tributaria:</strong> Para cumplimiento de
              obligaciones fiscales
            </li>
            <li data-oid="il1ao65">
              <strong data-oid="3:_f_-e">Entidades bancarias:</strong> Para gestión de pagos y
              cobros
            </li>
            <li data-oid="18ji-r_">
              <strong data-oid="k:12i3p">Proveedores tecnológicos:</strong> Hosting, email marketing
              (con acuerdos de confidencialidad)
            </li>
            <li data-oid="6b39x-2">
              <strong data-oid="kkxnyd3">Empresas colaboradoras:</strong> Para prácticas
              profesionales (con su consentimiento)
            </li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground" data-oid="y.iie4-">
            No realizamos transferencias internacionales de datos fuera del Espacio Económico
            Europeo.
          </p>
        </CardContent>
      </Card>

      <Card data-oid="ln.kniw">
        <CardHeader data-oid="qil8laj">
          <CardTitle data-oid="xvh35ko">7. Derechos de los Interesados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3" data-oid="ysc2a1f">
          <p data-oid="rtpy7jv">Puede ejercitar los siguientes derechos:</p>
          <ul className="list-disc list-inside ml-4 space-y-2" data-oid="p0vjl2x">
            <li data-oid="uqcom1:">
              <strong data-oid="q7s03do">Acceso:</strong> Obtener información sobre qué datos
              tratamos
            </li>
            <li data-oid="virb4z-">
              <strong data-oid="o9zblcc">Rectificación:</strong> Corregir datos inexactos o
              incompletos
            </li>
            <li data-oid="lsycmj:">
              <strong data-oid="7owgv:p">Supresión:</strong> Solicitar la eliminación de sus datos
            </li>
            <li data-oid=":rp_0:z">
              <strong data-oid="ii:m3q1">Oposición:</strong> Oponerse al tratamiento de sus datos
            </li>
            <li data-oid="rmhrl5g">
              <strong data-oid="ioy68-q">Limitación:</strong> Solicitar la limitación del
              tratamiento
            </li>
            <li data-oid="9d499ck">
              <strong data-oid="ppli492">Portabilidad:</strong> Recibir sus datos en formato
              electrónico
            </li>
            <li data-oid="c57t9f7">
              <strong data-oid="sguh:5_">Revocación del consentimiento:</strong> En cualquier
              momento
            </li>
          </ul>
          <div className="mt-4 p-4 bg-muted rounded-lg" data-oid="krkye0a">
            <p className="font-semibold mb-2" data-oid="uct9udj">
              ¿Cómo ejercer sus derechos?
            </p>
            <p className="text-sm" data-oid="so0_cbn">
              Envíe un correo a <strong data-oid="iv35f7g">privacidad@cepcomunicacion.com</strong>{' '}
              adjuntando copia de su DNI/NIE. Responderemos en un plazo máximo de 30 días.
            </p>
            <p className="text-sm mt-2" data-oid="23ptfhn">
              Puede presentar reclamación ante la Agencia Española de Protección de Datos
              (www.aepd.es).
            </p>
          </div>
        </CardContent>
      </Card>

      <Card data-oid="97_9.7g">
        <CardHeader data-oid="ed8g2e8">
          <CardTitle data-oid="do6jsyg">8. Medidas de Seguridad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3" data-oid="k8azbog">
          <p data-oid="3qv0pou">
            Hemos adoptado medidas de seguridad técnicas y organizativas para proteger sus datos
            personales:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2" data-oid="9__bi04">
            <li data-oid="hvr_nm6">Cifrado SSL/TLS en todas las comunicaciones</li>
            <li data-oid="girjkbs">Copias de seguridad diarias automáticas</li>
            <li data-oid="6w28bl_">Control de acceso mediante usuario y contraseña</li>
            <li data-oid="5ki3ct0">Registro de accesos y auditorías periódicas</li>
            <li data-oid="ug1ewqg">Formación del personal en protección de datos</li>
            <li data-oid="r2jm2i-">Acuerdos de confidencialidad con terceros</li>
          </ul>
        </CardContent>
      </Card>

      <Card data-oid="lm_ri_8">
        <CardHeader data-oid="19fkul4">
          <CardTitle data-oid="9aqna66">9. Modificaciones de la Política</CardTitle>
        </CardHeader>
        <CardContent data-oid="80ccfy:">
          <p data-oid="kbh2_dl">
            CEP FORMACIÓN Y COMUNICACIÓN S.L. se reserva el derecho a modificar la presente política
            para adaptarla a novedades legislativas o jurisprudenciales. Cualquier modificación será
            publicada en esta página con antelación suficiente a su aplicación.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-6 pb-4" data-oid="hamnt5x">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="gap-2"
          data-oid="31460o9"
        >
          <ArrowLeft className="h-4 w-4" data-oid="r.raeee" />
          Volver
        </Button>
      </div>
    </div>
  )
}
