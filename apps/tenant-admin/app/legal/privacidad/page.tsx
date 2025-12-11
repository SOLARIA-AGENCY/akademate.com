'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Shield, Mail, Phone, MapPin, Calendar, ArrowLeft } from 'lucide-react'

export default function PrivacidadPage() {
  const router = useRouter()
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Política de Privacidad</h1>
        <p className="text-muted-foreground">
          Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            1. Responsable del Tratamiento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p><strong>Razón Social:</strong> CEP FORMACIÓN Y COMUNICACIÓN S.L.</p>
            <p><strong>CIF:</strong> B-XXXXXXXX</p>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p><strong>Domicilio Social:</strong></p>
                <p>Calle Principal 123, 38001 Santa Cruz de Tenerife, España</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <p><strong>Email de contacto:</strong> privacidad@cepcomunicacion.com</p>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <p><strong>Teléfono:</strong> +34 922 123 456</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Datos Personales que Tratamos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            En CEP FORMACIÓN Y COMUNICACIÓN S.L. tratamos los siguientes datos personales:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Datos identificativos:</strong> Nombre, apellidos, DNI/NIE, fecha de nacimiento</li>
            <li><strong>Datos de contacto:</strong> Dirección postal, email, teléfono</li>
            <li><strong>Datos académicos:</strong> Historial formativo, calificaciones, certificados</li>
            <li><strong>Datos de navegación:</strong> Dirección IP, cookies, datos de uso de la plataforma</li>
            <li><strong>Datos bancarios:</strong> Únicamente para gestión de pagos (no almacenados directamente)</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Finalidad del Tratamiento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Tratamos sus datos personales para las siguientes finalidades:</p>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Gestión académica y administrativa</h4>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Inscripción y matrícula en cursos y ciclos formativos</li>
                <li>Gestión de expedientes académicos</li>
                <li>Emisión de certificados y diplomas</li>
                <li>Comunicaciones relacionadas con su formación</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Marketing y comunicación comercial</h4>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Envío de newsletters con información de cursos</li>
                <li>Publicidad de nuevos programas formativos</li>
                <li>Invitaciones a eventos y jornadas de puertas abiertas</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Cumplimiento de obligaciones legales</h4>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Obligaciones fiscales y contables</li>
                <li>Requerimientos de autoridades educativas</li>
                <li>Prevención de fraude y blanqueo de capitales</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Base Legal del Tratamiento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>El tratamiento de sus datos se basa en:</p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li><strong>Ejecución de un contrato:</strong> Gestión de su matrícula y formación</li>
            <li><strong>Consentimiento del interesado:</strong> Envío de comunicaciones comerciales</li>
            <li><strong>Cumplimiento de obligaciones legales:</strong> Normativa fiscal y educativa</li>
            <li><strong>Interés legítimo:</strong> Mejora de nuestros servicios y seguridad</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Conservación de Datos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>Conservaremos sus datos personales durante:</p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li><strong>Datos académicos:</strong> Indefinidamente, según normativa educativa</li>
            <li><strong>Datos contractuales:</strong> Duración de la relación contractual + 6 años (obligaciones fiscales)</li>
            <li><strong>Datos de marketing:</strong> Hasta que revoque su consentimiento</li>
            <li><strong>Datos de navegación:</strong> Máximo 2 años</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Destinatarios de los Datos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>Sus datos podrán ser comunicados a:</p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li><strong>Consejería de Educación:</strong> Para homologación y certificación de estudios</li>
            <li><strong>Agencia Tributaria:</strong> Para cumplimiento de obligaciones fiscales</li>
            <li><strong>Entidades bancarias:</strong> Para gestión de pagos y cobros</li>
            <li><strong>Proveedores tecnológicos:</strong> Hosting, email marketing (con acuerdos de confidencialidad)</li>
            <li><strong>Empresas colaboradoras:</strong> Para prácticas profesionales (con su consentimiento)</li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            No realizamos transferencias internacionales de datos fuera del Espacio Económico Europeo.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Derechos de los Interesados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>Puede ejercitar los siguientes derechos:</p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li><strong>Acceso:</strong> Obtener información sobre qué datos tratamos</li>
            <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
            <li><strong>Supresión:</strong> Solicitar la eliminación de sus datos</li>
            <li><strong>Oposición:</strong> Oponerse al tratamiento de sus datos</li>
            <li><strong>Limitación:</strong> Solicitar la limitación del tratamiento</li>
            <li><strong>Portabilidad:</strong> Recibir sus datos en formato electrónico</li>
            <li><strong>Revocación del consentimiento:</strong> En cualquier momento</li>
          </ul>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="font-semibold mb-2">¿Cómo ejercer sus derechos?</p>
            <p className="text-sm">
              Envíe un correo a <strong>privacidad@cepcomunicacion.com</strong> adjuntando copia de su DNI/NIE.
              Responderemos en un plazo máximo de 30 días.
            </p>
            <p className="text-sm mt-2">
              Puede presentar reclamación ante la Agencia Española de Protección de Datos (www.aepd.es).
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>8. Medidas de Seguridad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            Hemos adoptado medidas de seguridad técnicas y organizativas para proteger sus datos personales:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>Cifrado SSL/TLS en todas las comunicaciones</li>
            <li>Copias de seguridad diarias automáticas</li>
            <li>Control de acceso mediante usuario y contraseña</li>
            <li>Registro de accesos y auditorías periódicas</li>
            <li>Formación del personal en protección de datos</li>
            <li>Acuerdos de confidencialidad con terceros</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>9. Modificaciones de la Política</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            CEP FORMACIÓN Y COMUNICACIÓN S.L. se reserva el derecho a modificar la presente política
            para adaptarla a novedades legislativas o jurisprudenciales. Cualquier modificación será
            publicada en esta página con antelación suficiente a su aplicación.
          </p>
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
