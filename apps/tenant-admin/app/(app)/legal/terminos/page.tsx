'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { FileText, AlertTriangle, Scale, CreditCard, ArrowLeft } from 'lucide-react'

export default function TerminosPage() {
  const router = useRouter()
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6" data-oid="_qiwjgq">
      <div data-oid="h70.b29">
        <h1 className="text-4xl font-bold mb-2" data-oid=".z.k3e8">
          Términos y Condiciones de Uso
        </h1>
        <p className="text-muted-foreground" data-oid="_c6cmmj">
          Última actualización:{' '}
          {new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <Card data-oid="8fx:1t.">
        <CardHeader data-oid="dcx0yii">
          <CardTitle className="flex items-center gap-2" data-oid="lcnhp.p">
            <FileText className="h-5 w-5" data-oid="8y3u4wx" />
            1. Objeto y Aceptación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="k6dm_rx">
          <p data-oid="equhnnw">
            Los presentes Términos y Condiciones regulan el acceso y uso de la plataforma de gestión
            académica (en adelante, "la Plataforma") operada por{' '}
            <strong data-oid="st9-n0y">CEP FORMACIÓN Y COMUNICACIÓN S.L.</strong>
          </p>
          <p data-oid="_h0ufj5">
            Al acceder y utilizar esta Plataforma, el usuario acepta quedar vinculado por estos
            Términos y Condiciones. Si no está de acuerdo con alguna de las condiciones, debe
            abstenerse de utilizar la Plataforma.
          </p>
          <div className="bg-muted p-4 rounded-lg" data-oid="7gu:ize">
            <p className="text-sm" data-oid="wwxsg0o">
              <strong data-oid="9g6mq:p">Datos del titular:</strong>
            </p>
            <ul className="text-sm mt-2 space-y-1" data-oid="wtey611">
              <li data-oid="84a_li4">Razón Social: CEP FORMACIÓN Y COMUNICACIÓN S.L.</li>
              <li data-oid="h8cnzkk">CIF: B-XXXXXXXX</li>
              <li data-oid="iwyv16n">
                Domicilio: Calle Principal 123, 38001 Santa Cruz de Tenerife
              </li>
              <li data-oid="859goux">Email: info@cepcomunicacion.com</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card data-oid="01xun9g">
        <CardHeader data-oid="h2m6ubv">
          <CardTitle data-oid="evz02w7">2. Usuarios y Registro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="nivxw3a">
          <p data-oid="q8m4dr1">
            <strong data-oid="05bg1:7">2.1. Tipos de usuarios</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2" data-oid="xkdomoe">
            <li data-oid="4do0ju-">
              <strong data-oid="lfuv2ew">Administradores:</strong> Personal de CEP con acceso total
              al sistema
            </li>
            <li data-oid="1sk126d">
              <strong data-oid="nj4my0x">Gestores:</strong> Personal con permisos de gestión de
              contenido y datos
            </li>
            <li data-oid="c5wuf_b">
              <strong data-oid="y27cgg9">Marketing:</strong> Acceso a campañas, analytics y leads
            </li>
            <li data-oid="c3.fd_9">
              <strong data-oid="-nsd713">Asesores:</strong> Gestión exclusiva de leads y contactos
            </li>
            <li data-oid="21id6bv">
              <strong data-oid="iy1k89v">Lectura:</strong> Acceso de solo lectura a la información
            </li>
          </ul>

          <p className="mt-4" data-oid="b_s_:1i">
            <strong data-oid="j818n6s">2.2. Responsabilidades del usuario</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2" data-oid="9v263zg">
            <li data-oid="m87ar-4">Mantener la confidencialidad de sus credenciales de acceso</li>
            <li data-oid="kwgofk0">
              Notificar inmediatamente cualquier uso no autorizado de su cuenta
            </li>
            <li data-oid="rmhu3:1">Proporcionar información veraz y actualizada</li>
            <li data-oid="k9oi3ux">No compartir su cuenta con terceros</li>
            <li data-oid="_fqmfq2">Utilizar la Plataforma conforme a la legalidad vigente</li>
          </ul>
        </CardContent>
      </Card>

      <Card data-oid="qhidqag">
        <CardHeader data-oid="yyp.dwd">
          <CardTitle data-oid="qv:0n7n">3. Servicios Ofrecidos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3" data-oid="ceioqsf">
          <p data-oid="04tvlo.">La Plataforma ofrece los siguientes servicios:</p>
          <ul className="list-disc list-inside ml-4 space-y-2" data-oid="g23w0iu">
            <li data-oid="52ik6mt">Gestión de cursos, ciclos formativos y convocatorias</li>
            <li data-oid="ossnvso">Administración de sedes y aulas</li>
            <li data-oid="m82u-xl">Control de profesorado y personal administrativo</li>
            <li data-oid="7w42kon">Sistema de gestión de leads y captación</li>
            <li data-oid="_w1drzl">
              Integración con Meta Ads, Google Analytics y herramientas de marketing
            </li>
            <li data-oid="rrbgd_4">Generación de contenido mediante IA (LLM)</li>
            <li data-oid="jaroe.o">Análisis y reportes estadísticos</li>
            <li data-oid="0pcc9qe">Gestión de campañas de comunicación</li>
          </ul>
        </CardContent>
      </Card>

      <Card data-oid="mk7iv_.">
        <CardHeader data-oid="v3p2n.a">
          <CardTitle className="flex items-center gap-2" data-oid="5c44kw9">
            <CreditCard className="h-5 w-5" data-oid="57t27pj" />
            4. Condiciones Económicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="fas6rs4">
          <p data-oid="qde5aw_">
            <strong data-oid="zh3o3a9">4.1. Matrícula y pagos</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2" data-oid="ykmdrpt">
            <li data-oid="ysgu.an">
              Los precios de los cursos se indican en la plataforma y son en euros (€)
            </li>
            <li data-oid="3mb0jm2">Los precios incluyen IVA cuando sea aplicable</li>
            <li data-oid="v7:mm_t">
              CEP se reserva el derecho a modificar precios sin previo aviso
            </li>
            <li data-oid="xij0gn.">
              Las matrículas confirmadas mantienen el precio vigente en el momento de la inscripción
            </li>
          </ul>

          <p className="mt-4" data-oid="k.rlreo">
            <strong data-oid="hz25feg">4.2. Métodos de pago</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2" data-oid="vr:7s93">
            <li data-oid="7:e9g86">Transferencia bancaria</li>
            <li data-oid="wcperef">Tarjeta de crédito/débito</li>
            <li data-oid="7612m3s">Domiciliación bancaria (planes fraccionados)</li>
          </ul>

          <p className="mt-4" data-oid="w9.e8b:">
            <strong data-oid="w5a_rqm">4.3. Política de cancelación y reembolsos</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2" data-oid="iwz586u">
            <li data-oid="0szkpg9">
              Cancelación con más de 15 días de antelación: reembolso del 100%
            </li>
            <li data-oid="a.1tc6o">Cancelación entre 15 y 7 días: reembolso del 50%</li>
            <li data-oid="1mnuyln">Cancelación con menos de 7 días: no procede reembolso</li>
            <li data-oid=":g760yg">
              CEP se reserva el derecho a cancelar cursos por falta de quórum (reembolso 100%)
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card data-oid="q7fvofi">
        <CardHeader data-oid="wvsb6un">
          <CardTitle data-oid="5lp6gta">5. Propiedad Intelectual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3" data-oid="cno8.1_">
          <p data-oid="nw06w8t">
            Todos los contenidos de la Plataforma (textos, imágenes, logos, diseño, código fuente,
            bases de datos) son propiedad de CEP FORMACIÓN Y COMUNICACIÓN S.L. o de terceros que han
            autorizado su uso.
          </p>
          <p data-oid="e096w.3">Queda expresamente prohibido:</p>
          <ul className="list-disc list-inside ml-4 space-y-2" data-oid="y:oafnz">
            <li data-oid="2c.k:ao">
              Reproducir, copiar o distribuir los contenidos sin autorización
            </li>
            <li data-oid="dg1zkkv">Modificar, adaptar o crear obras derivadas</li>
            <li data-oid="t56mmf3">Hacer ingeniería inversa del código fuente</li>
            <li data-oid="k31l2z2">Utilizar contenidos para fines comerciales sin licencia</li>
            <li data-oid="5nd4a31">Eliminar marcas de agua, avisos de copyright o atribuciones</li>
          </ul>
        </CardContent>
      </Card>

      <Card data-oid="7yd37e3">
        <CardHeader data-oid="uaj23d3">
          <CardTitle className="flex items-center gap-2" data-oid="0f0bglp">
            <Scale className="h-5 w-5" data-oid="ql:oh._" />
            6. Responsabilidades y Limitaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="_bsd8yq">
          <p data-oid="ifdbpqw">
            <strong data-oid="lv-7dtr">6.1. Disponibilidad del servicio</strong>
          </p>
          <p data-oid="kbgvh-v">
            CEP se esfuerza por mantener la Plataforma operativa 24/7, pero no garantiza
            disponibilidad ininterrumpida. Pueden producirse interrupciones por:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2" data-oid="om2mffa">
            <li data-oid="1_.or_n">Mantenimientos programados (notificados con antelación)</li>
            <li data-oid="-vmi23j">Fallos técnicos imprevistos</li>
            <li data-oid="b0_5m8i">Ataques informáticos o causas de fuerza mayor</li>
          </ul>

          <p className="mt-4" data-oid="-tjpyik">
            <strong data-oid="ptxef58">6.2. Limitación de responsabilidad</strong>
          </p>
          <p data-oid="w.i5.sh">CEP no será responsable de:</p>
          <ul className="list-disc list-inside ml-4 space-y-2" data-oid="yg4qeds">
            <li data-oid="xfosoms">Pérdida de datos por causas ajenas a CEP</li>
            <li data-oid="6l0.5z4">Daños derivados del uso indebido de la Plataforma</li>
            <li data-oid="5wn8w1h">Contenidos generados por IA que puedan contener errores</li>
            <li data-oid="8o3iqhy">Problemas de conectividad del usuario</li>
            <li data-oid="wor9:m1">Incompatibilidades con dispositivos o navegadores obsoletos</li>
          </ul>

          <p className="mt-4" data-oid="-.qqg01">
            <strong data-oid="s67p:pw">6.3. Uso responsable</strong>
          </p>
          <p data-oid="l_i4u9s">El usuario se compromete a NO:</p>
          <ul className="list-disc list-inside ml-4 space-y-2" data-oid="gc2oyq:">
            <li data-oid="xumeb9g">Realizar actividades ilegales o fraudulentas</li>
            <li data-oid="gwnfopn">Introducir virus, malware o código malicioso</li>
            <li data-oid="br4:oh3">Intentar acceder a áreas restringidas del sistema</li>
            <li data-oid="9c5irw1">Sobrecargar intencionalmente el servidor</li>
            <li data-oid="i.me:no">Extraer datos masivamente mediante scraping</li>
            <li data-oid="mj0_:r_">Suplantar la identidad de otros usuarios</li>
          </ul>
        </CardContent>
      </Card>

      <Card data-oid="cakn06:">
        <CardHeader data-oid="10k_5p:">
          <CardTitle className="flex items-center gap-2" data-oid=":es:brx">
            <AlertTriangle className="h-5 w-5" data-oid="z6ss7nv" />
            7. Suspensión y Terminación de Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3" data-oid="36_x56g">
          <p data-oid="05bw8gq">
            CEP se reserva el derecho de suspender o cancelar cuentas de usuario en los siguientes
            casos:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2" data-oid="-6dno:v">
            <li data-oid="f5o3-_b">Incumplimiento de estos Términos y Condiciones</li>
            <li data-oid="hng4wnx">Uso fraudulento o actividades ilegales</li>
            <li data-oid="zxcw6m6">Impago de servicios contratados</li>
            <li data-oid="yvjbvs_">Conducta abusiva hacia otros usuarios o personal de CEP</li>
            <li data-oid="sqckhbk">Inactividad prolongada (más de 2 años)</li>
          </ul>
          <p className="mt-4" data-oid="b7zijx2">
            En caso de suspensión, el usuario será notificado por email y tendrá derecho a presentar
            alegaciones en un plazo de 10 días hábiles.
          </p>
        </CardContent>
      </Card>

      <Card data-oid="4.reaag">
        <CardHeader data-oid="435_coq">
          <CardTitle data-oid="kmsfe10">8. Modificaciones de los Términos</CardTitle>
        </CardHeader>
        <CardContent data-oid="0udhspn">
          <p data-oid="nos7ly5">
            CEP FORMACIÓN Y COMUNICACIÓN S.L. se reserva el derecho a modificar estos Términos y
            Condiciones en cualquier momento. Las modificaciones entrarán en vigor desde su
            publicación en la Plataforma.
          </p>
          <p className="mt-3" data-oid="t9leapf">
            Los usuarios serán notificados de cambios sustanciales mediante email o aviso en la
            Plataforma. El uso continuado de la Plataforma tras la notificación implica la
            aceptación de los nuevos términos.
          </p>
        </CardContent>
      </Card>

      <Card data-oid=":ppr.7q">
        <CardHeader data-oid="rgf9vmy">
          <CardTitle data-oid="p8mvi70">9. Ley Aplicable y Jurisdicción</CardTitle>
        </CardHeader>
        <CardContent data-oid="l.mj439">
          <p data-oid="m1fmg1s">
            Los presentes Términos y Condiciones se rigen por la legislación española.
          </p>
          <p className="mt-3" data-oid="okxcr7p">
            Para la resolución de cualquier controversia derivada del uso de la Plataforma, las
            partes se someten expresamente a los Juzgados y Tribunales de Santa Cruz de Tenerife,
            renunciando a cualquier otro fuero que pudiera corresponderles.
          </p>
        </CardContent>
      </Card>

      <Card data-oid="9-6mfze">
        <CardHeader data-oid="n:r:e-y">
          <CardTitle data-oid="-a.e:nq">10. Contacto</CardTitle>
        </CardHeader>
        <CardContent data-oid="w170ac4">
          <p data-oid="onw7ca2">
            Para cualquier consulta relacionada con estos Términos y Condiciones:
          </p>
          <ul className="list-none ml-4 mt-3 space-y-2" data-oid="o91y116">
            <li data-oid="ie03yhv">
              <strong data-oid=":9qm:5h">Email:</strong> legal@cepcomunicacion.com
            </li>
            <li data-oid="h_ft6bd">
              <strong data-oid=":zv3mts">Teléfono:</strong> +34 922 123 456
            </li>
            <li data-oid="kfg5zgj">
              <strong data-oid="klm.arj">Dirección:</strong> Calle Principal 123, 38001 Santa Cruz
              de Tenerife
            </li>
            <li data-oid="-0pkgo0">
              <strong data-oid="h0k3e5o">Horario de atención:</strong> Lunes a Viernes, 9:00 - 18:00
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-6 pb-4" data-oid="dix_njy">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="gap-2"
          data-oid="inir.wg"
        >
          <ArrowLeft className="h-4 w-4" data-oid="7rkk69f" />
          Volver
        </Button>
      </div>
    </div>
  )
}
