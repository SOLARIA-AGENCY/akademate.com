'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { FileText, AlertTriangle, Scale, CreditCard, ArrowLeft } from 'lucide-react'

export default function TerminosPage() {
  const router = useRouter()
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Términos y Condiciones de Uso</h1>
        <p className="text-muted-foreground">
          Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            1. Objeto y Aceptación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Los presentes Términos y Condiciones regulan el acceso y uso de la plataforma de gestión
            académica (en adelante, "la Plataforma") operada por <strong>CEP FORMACIÓN Y COMUNICACIÓN S.L.</strong>
          </p>
          <p>
            Al acceder y utilizar esta Plataforma, el usuario acepta quedar vinculado por estos
            Términos y Condiciones. Si no está de acuerdo con alguna de las condiciones, debe abstenerse
            de utilizar la Plataforma.
          </p>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm">
              <strong>Datos del titular:</strong>
            </p>
            <ul className="text-sm mt-2 space-y-1">
              <li>Razón Social: CEP FORMACIÓN Y COMUNICACIÓN S.L.</li>
              <li>CIF: B-XXXXXXXX</li>
              <li>Domicilio: Calle Principal 123, 38001 Santa Cruz de Tenerife</li>
              <li>Email: info@cepcomunicacion.com</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Usuarios y Registro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p><strong>2.1. Tipos de usuarios</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li><strong>Administradores:</strong> Personal de CEP con acceso total al sistema</li>
            <li><strong>Gestores:</strong> Personal con permisos de gestión de contenido y datos</li>
            <li><strong>Marketing:</strong> Acceso a campañas, analytics y leads</li>
            <li><strong>Asesores:</strong> Gestión exclusiva de leads y contactos</li>
            <li><strong>Lectura:</strong> Acceso de solo lectura a la información</li>
          </ul>

          <p className="mt-4"><strong>2.2. Responsabilidades del usuario</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>Mantener la confidencialidad de sus credenciales de acceso</li>
            <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta</li>
            <li>Proporcionar información veraz y actualizada</li>
            <li>No compartir su cuenta con terceros</li>
            <li>Utilizar la Plataforma conforme a la legalidad vigente</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Servicios Ofrecidos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>La Plataforma ofrece los siguientes servicios:</p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>Gestión de cursos, ciclos formativos y convocatorias</li>
            <li>Administración de sedes y aulas</li>
            <li>Control de profesorado y personal administrativo</li>
            <li>Sistema de gestión de leads y captación</li>
            <li>Integración con Meta Ads, Google Analytics y herramientas de marketing</li>
            <li>Generación de contenido mediante IA (LLM)</li>
            <li>Análisis y reportes estadísticos</li>
            <li>Gestión de campañas de comunicación</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            4. Condiciones Económicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p><strong>4.1. Matrícula y pagos</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>Los precios de los cursos se indican en la plataforma y son en euros (€)</li>
            <li>Los precios incluyen IVA cuando sea aplicable</li>
            <li>CEP se reserva el derecho a modificar precios sin previo aviso</li>
            <li>Las matrículas confirmadas mantienen el precio vigente en el momento de la inscripción</li>
          </ul>

          <p className="mt-4"><strong>4.2. Métodos de pago</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>Transferencia bancaria</li>
            <li>Tarjeta de crédito/débito</li>
            <li>Domiciliación bancaria (planes fraccionados)</li>
          </ul>

          <p className="mt-4"><strong>4.3. Política de cancelación y reembolsos</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>Cancelación con más de 15 días de antelación: reembolso del 100%</li>
            <li>Cancelación entre 15 y 7 días: reembolso del 50%</li>
            <li>Cancelación con menos de 7 días: no procede reembolso</li>
            <li>CEP se reserva el derecho a cancelar cursos por falta de quórum (reembolso 100%)</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Propiedad Intelectual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            Todos los contenidos de la Plataforma (textos, imágenes, logos, diseño, código fuente,
            bases de datos) son propiedad de CEP FORMACIÓN Y COMUNICACIÓN S.L. o de terceros que
            han autorizado su uso.
          </p>
          <p>Queda expresamente prohibido:</p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>Reproducir, copiar o distribuir los contenidos sin autorización</li>
            <li>Modificar, adaptar o crear obras derivadas</li>
            <li>Hacer ingeniería inversa del código fuente</li>
            <li>Utilizar contenidos para fines comerciales sin licencia</li>
            <li>Eliminar marcas de agua, avisos de copyright o atribuciones</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            6. Responsabilidades y Limitaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p><strong>6.1. Disponibilidad del servicio</strong></p>
          <p>
            CEP se esfuerza por mantener la Plataforma operativa 24/7, pero no garantiza
            disponibilidad ininterrumpida. Pueden producirse interrupciones por:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>Mantenimientos programados (notificados con antelación)</li>
            <li>Fallos técnicos imprevistos</li>
            <li>Ataques informáticos o causas de fuerza mayor</li>
          </ul>

          <p className="mt-4"><strong>6.2. Limitación de responsabilidad</strong></p>
          <p>CEP no será responsable de:</p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>Pérdida de datos por causas ajenas a CEP</li>
            <li>Daños derivados del uso indebido de la Plataforma</li>
            <li>Contenidos generados por IA que puedan contener errores</li>
            <li>Problemas de conectividad del usuario</li>
            <li>Incompatibilidades con dispositivos o navegadores obsoletos</li>
          </ul>

          <p className="mt-4"><strong>6.3. Uso responsable</strong></p>
          <p>El usuario se compromete a NO:</p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>Realizar actividades ilegales o fraudulentas</li>
            <li>Introducir virus, malware o código malicioso</li>
            <li>Intentar acceder a áreas restringidas del sistema</li>
            <li>Sobrecargar intencionalmente el servidor</li>
            <li>Extraer datos masivamente mediante scraping</li>
            <li>Suplantar la identidad de otros usuarios</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            7. Suspensión y Terminación de Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            CEP se reserva el derecho de suspender o cancelar cuentas de usuario en los siguientes casos:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>Incumplimiento de estos Términos y Condiciones</li>
            <li>Uso fraudulento o actividades ilegales</li>
            <li>Impago de servicios contratados</li>
            <li>Conducta abusiva hacia otros usuarios o personal de CEP</li>
            <li>Inactividad prolongada (más de 2 años)</li>
          </ul>
          <p className="mt-4">
            En caso de suspensión, el usuario será notificado por email y tendrá derecho a presentar
            alegaciones en un plazo de 10 días hábiles.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>8. Modificaciones de los Términos</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            CEP FORMACIÓN Y COMUNICACIÓN S.L. se reserva el derecho a modificar estos Términos y
            Condiciones en cualquier momento. Las modificaciones entrarán en vigor desde su publicación
            en la Plataforma.
          </p>
          <p className="mt-3">
            Los usuarios serán notificados de cambios sustanciales mediante email o aviso en la Plataforma.
            El uso continuado de la Plataforma tras la notificación implica la aceptación de los nuevos términos.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>9. Ley Aplicable y Jurisdicción</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Los presentes Términos y Condiciones se rigen por la legislación española.
          </p>
          <p className="mt-3">
            Para la resolución de cualquier controversia derivada del uso de la Plataforma, las partes
            se someten expresamente a los Juzgados y Tribunales de Santa Cruz de Tenerife, renunciando
            a cualquier otro fuero que pudiera corresponderles.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>10. Contacto</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Para cualquier consulta relacionada con estos Términos y Condiciones:</p>
          <ul className="list-none ml-4 mt-3 space-y-2">
            <li><strong>Email:</strong> legal@cepcomunicacion.com</li>
            <li><strong>Teléfono:</strong> +34 922 123 456</li>
            <li><strong>Dirección:</strong> Calle Principal 123, 38001 Santa Cruz de Tenerife</li>
            <li><strong>Horario de atención:</strong> Lunes a Viernes, 9:00 - 18:00</li>
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
