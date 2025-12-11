'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Input } from '@payload-config/components/ui/input'
import {
  BookOpen,
  Video,
  FileText,
  Search,
  ChevronRight,
  Download,
  MessageCircle,
  Shield,
  Users,
  GraduationCap,
  Settings,
  BarChart,
  HelpCircle,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Mail
} from 'lucide-react'

interface GuideSection {
  id: string
  title: string
  icon: typeof BookOpen
  description: string
  guides: Array<{
    title: string
    description: string
    duration?: string
    level: 'Básico' | 'Intermedio' | 'Avanzado'
  }>
}

export default function AyudaPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const guideSections: GuideSection[] = [
    {
      id: 'getting-started',
      title: 'Primeros Pasos',
      icon: GraduationCap,
      description: 'Aprende lo básico para comenzar a usar el sistema',
      guides: [
        {
          title: 'Introducción al Dashboard',
          description: 'Conoce la interfaz principal y navegación del sistema',
          duration: '5 min',
          level: 'Básico',
        },
        {
          title: 'Configuración de Perfil y Seguridad',
          description: 'Actualiza tu información personal y activa 2FA',
          duration: '10 min',
          level: 'Básico',
        },
        {
          title: 'Navegación y Estructura del Sistema',
          description: 'Entiende cómo está organizado el panel de administración',
          duration: '8 min',
          level: 'Básico',
        },
      ],
    },
    {
      id: 'courses-management',
      title: 'Gestión de Cursos',
      icon: BookOpen,
      description: 'Crea, edita y gestiona cursos y convocatorias',
      guides: [
        {
          title: 'Crear un Nuevo Curso',
          description: 'Paso a paso para añadir cursos al catálogo',
          duration: '15 min',
          level: 'Básico',
        },
        {
          title: 'Programar Convocatorias',
          description: 'Configura fechas, plazas y modalidades de impartición',
          duration: '12 min',
          level: 'Intermedio',
        },
        {
          title: 'Gestión de Áreas de Estudio',
          description: 'Organiza cursos por categorías y especialidades',
          duration: '8 min',
          level: 'Intermedio',
        },
        {
          title: 'Estados de Convocatorias',
          description: 'Maneja abierta, lista de espera, cerrada y planificada',
          duration: '10 min',
          level: 'Avanzado',
        },
      ],
    },
    {
      id: 'staff-management',
      title: 'Gestión de Personal',
      icon: Users,
      description: 'Administra profesores y personal administrativo',
      guides: [
        {
          title: 'Añadir Profesores al Sistema',
          description: 'Registra nuevos docentes con sus especialidades',
          duration: '10 min',
          level: 'Básico',
        },
        {
          title: 'Gestión de Personal Administrativo',
          description: 'Administra el equipo de soporte y gestión',
          duration: '8 min',
          level: 'Básico',
        },
        {
          title: 'Vincular Usuarios a Staff',
          description: 'Conecta cuentas de usuario con perfiles de personal',
          duration: '5 min',
          level: 'Intermedio',
        },
      ],
    },
    {
      id: 'users-roles',
      title: 'Usuarios y Permisos',
      icon: Shield,
      description: 'Administra usuarios, roles y control de acceso',
      guides: [
        {
          title: 'Sistema de Roles (RBAC)',
          description: 'Comprende Admin, Gestor, Marketing, Asesor y Lectura',
          duration: '12 min',
          level: 'Intermedio',
        },
        {
          title: 'Crear y Modificar Usuarios',
          description: 'Gestiona cuentas de acceso al sistema',
          duration: '8 min',
          level: 'Básico',
        },
        {
          title: 'Configurar Autenticación 2FA',
          description: 'Mejora la seguridad con doble factor',
          duration: '10 min',
          level: 'Avanzado',
        },
        {
          title: 'Auditoría y Registro de Actividad',
          description: 'Monitorea acciones de usuarios en el sistema',
          duration: '7 min',
          level: 'Avanzado',
        },
      ],
    },
    {
      id: 'configuration',
      title: 'Configuración del Sistema',
      icon: Settings,
      description: 'Personaliza y configura el panel de administración',
      guides: [
        {
          title: 'Configuración General de la Academia',
          description: 'Actualiza datos fiscales, contacto y redes sociales',
          duration: '15 min',
          level: 'Intermedio',
        },
        {
          title: 'Personalización de Colores y Tema',
          description: 'Aplica colores corporativos al dashboard',
          duration: '10 min',
          level: 'Básico',
        },
        {
          title: 'Configurar APIs e Integraciones',
          description: 'Facebook Pixel, Google Analytics, MCP',
          duration: '20 min',
          level: 'Avanzado',
        },
        {
          title: 'Gestión de Webhooks',
          description: 'Configura notificaciones automáticas de eventos',
          duration: '12 min',
          level: 'Avanzado',
        },
      ],
    },
    {
      id: 'analytics',
      title: 'Análisis y Reportes',
      icon: BarChart,
      description: 'Interpreta métricas y genera reportes',
      guides: [
        {
          title: 'Dashboard Principal: Métricas Clave',
          description: 'Entiende los indicadores de rendimiento',
          duration: '10 min',
          level: 'Básico',
        },
        {
          title: 'Exportar Datos y Reportes',
          description: 'Descarga información en CSV y Excel',
          duration: '8 min',
          level: 'Intermedio',
        },
      ],
    },
  ]

  const videoTutorials = [
    {
      title: 'Tour Completo del Sistema',
      description: 'Recorrido guiado por todas las funcionalidades',
      duration: '25 min',
      thumbnail: '/thumbnails/tour-completo.jpg',
    },
    {
      title: 'Gestión de Cursos desde Cero',
      description: 'Crea tu primer curso paso a paso',
      duration: '18 min',
      thumbnail: '/thumbnails/cursos.jpg',
    },
    {
      title: 'Configuración Inicial Recomendada',
      description: 'Setup óptimo para comenzar a trabajar',
      duration: '12 min',
      thumbnail: '/thumbnails/setup.jpg',
    },
  ]

  const faqItems = [
    {
      question: '¿Cómo restablezco mi contraseña?',
      answer: 'Haz clic en "¿Olvidaste tu contraseña?" en la página de login. Recibirás un correo con un enlace que expira en 1 hora. Si no recibes el correo, verifica la carpeta de spam.',
    },
    {
      question: '¿Qué es 2FA y cómo lo activo?',
      answer: 'La autenticación de dos factores (2FA) añade una capa extra de seguridad. Ve a tu perfil de usuario, haz clic en "Activar 2FA", escanea el código QR con Google Authenticator o Authy, e ingresa el código de verificación.',
    },
    {
      question: '¿Puedo eliminar un área de estudio con cursos asignados?',
      answer: 'No. Primero debes reasignar todos los cursos a otra área. Esto previene la pérdida accidental de datos. El sistema te mostrará un aviso y el botón de eliminación estará deshabilitado hasta que no haya cursos asociados.',
    },
    {
      question: '¿Cuál es la diferencia entre los roles?',
      answer: 'Admin: acceso total. Gestor: cursos, staff, contenido. Marketing: campañas y leads. Asesor: solo gestión de leads. Lectura: solo visualización sin edición.',
    },
    {
      question: '¿Cómo exporto los registros de actividad?',
      answer: 'En la página de Registro de Actividad, usa los filtros para seleccionar los datos que necesitas, luego haz clic en el botón "Exportar" en la esquina superior derecha. Los datos se descargarán en formato CSV.',
    },
    {
      question: '¿Cómo aplico mi tema de colores personalizado?',
      answer: 'Ve a Configuración → Personalización, ajusta los colores, verás la vista previa en tiempo real. Cuando estés satisfecho, haz clic en "Guardar Tema" para aplicar los cambios permanentemente.',
    },
    {
      question: '¿Qué hago si veo un error al crear un curso?',
      answer: 'Verifica que todos los campos obligatorios estén completos. Revisa el formato de fechas y números. Si el error persiste, contacta con soporte técnico proporcionando el mensaje de error exacto.',
    },
    {
      question: '¿Cómo vinculo un usuario a un miembro del staff?',
      answer: 'Al crear o editar un usuario, verás el campo "Vincular a Staff". Selecciona el miembro del personal correspondiente. Esto conecta la cuenta de acceso con el perfil profesional.',
    },
  ]

  const documentationFiles = [
    {
      title: 'Manual de Usuario Completo',
      description: 'Guía exhaustiva de todas las funcionalidades',
      format: 'PDF',
      size: '5.2 MB',
      icon: FileText,
    },
    {
      title: 'Guía Rápida de Referencia',
      description: 'Comandos y atajos más usados',
      format: 'PDF',
      size: '1.8 MB',
      icon: FileText,
    },
    {
      title: 'Políticas de Seguridad y RGPD',
      description: 'Cumplimiento normativo y mejores prácticas',
      format: 'PDF',
      size: '2.4 MB',
      icon: FileText,
    },
  ]

  const filteredSections = guideSections.filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.guides.some(guide => 
      guide.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold">Ayuda y Documentación</h1>
        <p className="text-muted-foreground">Centro de recursos y soporte técnico</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Busca guías, tutoriales o preguntas frecuentes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-lg h-14"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Access */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="pt-6 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">Chat con Asistente IA</h3>
            <p className="text-sm text-muted-foreground">Obtén ayuda instantánea 24/7</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="pt-6 text-center">
            <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
              <Video className="h-6 w-6 text-success" />
            </div>
            <h3 className="font-semibold mb-1">Video Tutoriales</h3>
            <p className="text-sm text-muted-foreground">Aprende viendo ejemplos</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="pt-6 text-center">
            <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-3">
              <FileText className="h-6 w-6 text-warning" />
            </div>
            <h3 className="font-semibold mb-1">Documentación PDF</h3>
            <p className="text-sm text-muted-foreground">Descarga manuales completos</p>
          </CardContent>
        </Card>
      </div>

      {/* Guide Sections */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Guías por Tema</h2>
        {filteredSections.map((section) => (
          <Card key={section.id}>
            <CardHeader 
              className="cursor-pointer hover:bg-accent/5"
              onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <section.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{section.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                </div>
                <ChevronRight 
                  className={`h-5 w-5 transition-transform ${expandedSection === section.id ? 'rotate-90' : ''}`} 
                />
              </div>
            </CardHeader>
            
            {expandedSection === section.id && (
              <CardContent className="space-y-2">
                {section.guides.map((guide, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/5 cursor-pointer">
                    <div className="flex-1">
                      <p className="font-medium">{guide.title}</p>
                      <p className="text-sm text-muted-foreground">{guide.description}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs px-2 py-1 rounded ${
                        guide.level === 'Básico' ? 'bg-success/10 text-success' :
                        guide.level === 'Intermedio' ? 'bg-warning/10 text-warning' :
                        'bg-destructive/10 text-destructive'
                      }`}>
                        {guide.level}
                      </span>
                      {guide.duration && (
                        <span className="text-xs text-muted-foreground">{guide.duration}</span>
                      )}
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Video Tutorials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Tutoriales en Video
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {videoTutorials.map((video, idx) => (
              <div key={idx} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <Video className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="p-4">
                  <p className="font-medium mb-1">{video.title}</p>
                  <p className="text-sm text-muted-foreground mb-2">{video.description}</p>
                  <p className="text-xs text-muted-foreground">{video.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Preguntas Frecuentes (FAQ)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqItems.map((faq, idx) => (
            <div key={idx} className="border-b pb-4 last:border-0">
              <p className="font-medium mb-2 flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                {faq.question}
              </p>
              <p className="text-sm text-muted-foreground pl-7">{faq.answer}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Documentation Downloads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Documentación Descargable
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {documentationFiles.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <file.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{file.title}</p>
                  <p className="text-sm text-muted-foreground">{file.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-medium">{file.format}</p>
                  <p className="text-xs text-muted-foreground">{file.size}</p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Support Contact */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">¿Necesitas más ayuda?</h3>
              <p className="text-muted-foreground mb-4">
                Nuestro equipo de soporte está disponible para ayudarte con cualquier duda o problema técnico.
              </p>
              <div className="flex gap-3">
                <Button>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Chat en Vivo
                </Button>
                <Button variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar Email
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
