import type { IntegrationBrandId } from '@/lib/integration-brands'
import type { FeatureModuleId } from '@/lib/feature-module-details'

export type SpanishFeatureModule = {
  id: FeatureModuleId
  title: string
  eyebrow: string
  description: string
  features: readonly string[]
  audiences: readonly string[]
  preview: {
    title: string
    description: string
    signal: string
    signalLabel: string
    tableHeading: string
    rows: ReadonlyArray<{ label: string; value: string; action: string }>
    note: string
    alt: string
  }
  connectors: readonly IntegrationBrandId[]
  aria: {
    tab: string
    panel: string
    preview: string
  }
}

export const spanishFeatureExplorerCopy = {
  eyebrow: 'Catálogo completo de módulos',
  title: 'Explora todos los módulos.',
  description: 'Elige un módulo y consulta su flujo, sus equipos y sus conexiones.',
  tablistAria: 'Módulos de producto de Akademate',
  capabilitiesHeading: 'Lo que puede hacer tu equipo',
  connectorsHeading: 'Servicios y métodos conectados',
  paymentMethodsNote:
    'Las marcas de tarjetas y monederos identifican métodos de pago disponibles mediante el proveedor configurado.',
} as const

export const spanishFeatureModules = [
  moduleEs(
    'website-catalogue-embeds',
    'Web, catálogo e integraciones',
    'Publica donde te descubren',
    'Lanza una web conectada, usa tu dominio o integra el recorrido de matrícula en cualquier página.',
    [
      'Subdominio de Akademate listo para configurar',
      'Dominio propio con configuración DNS guiada',
      'Páginas comerciales para cursos y talleres',
      'Clases, formularios y pagos integrables',
      'Reseñas, testimonios y contenido para compartir',
    ],
    ['Crecimiento', 'Operaciones'],
    'Academia pública',
    'Controla cómo se publica y convierte cada oferta.',
    '3',
    'modalidades de publicación',
    'Estado de publicación',
    [
      ['Dominio propio', 'Conectado', 'Revisar dominio'],
      ['Catálogo de cursos', '12 ofertas activas', 'Abrir catálogo'],
      ['Pago integrado', 'Preparado', 'Comprobar pago'],
    ],
    'Ejemplo operativo ilustrativo; la publicación final depende de la configuración de cada academia.',
    'Vista del estado de dominio, catálogo y pago integrado de la academia pública',
    ['cloudflare']
  ),
  moduleEs(
    'growth-ads-crm',
    'Crecimiento, anuncios y CRM',
    'Convierte demanda en matrículas',
    'Sigue cada contacto desde su campaña de origen hasta el siguiente paso comercial.',
    [
      'Captura y cualificación de leads',
      'Atribución por campaña y parámetros UTM',
      'Contexto de Meta Ads y conversiones',
      'Capa de conectores MCP',
      'Seguimiento y traspaso a matrícula',
    ],
    ['Crecimiento', 'Admisiones'],
    'Pipeline de campañas',
    'Prioriza leads y seguimientos sin perder el origen comercial.',
    '24%',
    'de lead a solicitud',
    'Actividad comercial',
    [
      ['Campaña de Meta', '36 leads', 'Ver campaña'],
      ['Búsqueda de Google', '18 leads', 'Ver fuente'],
      ['Seguimientos pendientes', '7 hoy', 'Abrir tareas'],
    ],
    'Las métricas son ilustrativas y dependen de las fuentes publicitarias y del CRM configurados.',
    'Vista del pipeline de campañas con leads por fuente y seguimientos pendientes',
    ['meta', 'googleads']
  ),
  moduleEs(
    'campaign-intelligence',
    'Inteligencia de campañas',
    'Entiende el crecimiento de pago',
    'Relaciona las señales publicitarias con solicitudes y matrículas atribuidas.',
    [
      'Fuentes de Meta Ads y Google Ads',
      'Impresiones, alcance, clics y CTR',
      'Inversión, leads y solicitudes',
      'Ventanas de atribución configurables',
      'Reglas de crecimiento sujetas a aprobación',
    ],
    ['Crecimiento', 'Dirección'],
    'Panel de campañas',
    'Compara fuentes, actualidad de datos y reglas de atribución.',
    'Illustrative',
    'señales de proveedores y CRM',
    'Calidad de la señal',
    [
      ['Fuentes de pago', 'Meta · Google', 'Comparar fuentes'],
      ['Actualidad de métricas', 'Visible', 'Revisar sincronización'],
      ['Modelo de atribución', 'Configurable', 'Consultar reglas'],
    ],
    'El alcance puede no estar disponible y la atribución sigue el modelo configurado por la academia.',
    'Vista comparativa de fuentes publicitarias, actualidad y modelo de atribución',
    ['meta', 'googleads']
  ),
  moduleEs(
    'reservations-admissions',
    'Reservas y admisiones',
    'Convierte interés en plazas',
    'Configura cada recorrido desde la consulta inicial hasta la plaza confirmada.',
    [
      'Modalidades de consulta y solicitud',
      'Reservas temporales y caducidad',
      'Reserva inmediata o con pago',
      'Listas de espera y promoción',
      'Documentos, consentimiento y aprobación',
    ],
    ['Admisiones', 'Alumnado'],
    'Cola de admisiones',
    'Ordena expedientes por estado y próximo paso.',
    '42',
    'solicitudes activas',
    'Expedientes por revisar',
    [
      ['Listas para revisar', '12', 'Abrir revisión'],
      ['Documentación pendiente', '8', 'Solicitar documentos'],
      ['Plazas reservadas', '6', 'Ver caducidad'],
    ],
    'Los estados mostrados no implican admisión automática; las reglas y aprobaciones las define cada academia.',
    'Vista de solicitudes listas, documentación pendiente y plazas reservadas',
    ['googlecalendar']
  ),
  moduleEs(
    'offers-runs-capacity',
    'Ofertas, ediciones y capacidad',
    'Diseña una oferta viable',
    'Define ofertas, calendarios, acceso y capacidad antes de abrir matrículas.',
    [
      'Cursos, clases y membresías',
      'Ediciones, cohortes y temporadas',
      'Sesiones y recurrencias',
      'Capacidad y recursos',
      'Reglas de acceso y elegibilidad',
    ],
    ['Operaciones', 'Crecimiento'],
    'Capacidad de la oferta',
    'Detecta plazas disponibles y listas de espera por edición.',
    '86%',
    'de ocupación actual',
    'Disponibilidad por edición',
    [
      ['Grupo de tarde', '3 plazas', 'Ver plazas'],
      ['Taller del sábado', 'Lista de espera', 'Gestionar espera'],
      ['Convocatoria online', 'Abierta', 'Abrir oferta'],
    ],
    'La disponibilidad es ilustrativa y se calcula con las reglas de capacidad configuradas.',
    'Vista de capacidad para un grupo de tarde, un taller y una convocatoria online',
    ['googlecalendar', 'zoom']
  ),
  moduleEs(
    'academic-operations',
    'Operación académica',
    'Coordina cada programa',
    'Planifica programas, cohortes, aulas y modalidades de impartición.',
    [
      'Cursos y programas',
      'Cohortes y ediciones',
      'Horarios y calendarios',
      'Aulas e instalaciones',
      'Planificación multisedes',
    ],
    ['Equipo académico', 'Profesorado'],
    'Operación diaria',
    'Consulta la carga académica prevista en cada sede.',
    '18',
    'sesiones hoy',
    'Sesiones por campus',
    [
      ['Campus central', '8 sesiones', 'Ver horario'],
      ['Campus norte', '6 sesiones', 'Ver aulas'],
      ['Campus online', '4 sesiones', 'Abrir campus'],
    ],
    'La agenda refleja sesiones planificadas; cualquier cambio sigue los permisos y flujos configurados.',
    'Vista de sesiones del día distribuidas entre campus central, norte y online',
    ['googlecalendar', 'googlemeet']
  ),
  moduleEs(
    'attendance-physical-access',
    'Asistencia y acceso físico',
    'Conecta cada llegada',
    'Relaciona asistencia, identidad y eventos de acceso del campus.',
    [
      'Check-in QR desde aplicaciones responsive',
      'Recorridos con tarjetas NFC y RFID',
      'Adaptadores para lectores y controladores de acceso',
      'Sincronización por clase y ubicación',
      'Revisión de llegadas y excepciones',
    ],
    ['Operaciones', 'Alumnado'],
    'Llegadas al campus',
    'Revisa registros de llegada y excepciones sin confundirlos con control de acceso físico.',
    '92%',
    'de asistencia hoy',
    'Registros de llegada',
    [
      ['Check-ins con QR', '184', 'Ver registros'],
      ['NFC y RFID', '63', 'Ver método'],
      ['Excepciones', '4 por revisar', 'Revisar excepciones'],
    ],
    'QR, NFC, RFID y acceso físico son extensiones sujetas a hardware, proveedor y configuración.',
    'Vista de llegadas por QR, NFC y RFID con excepciones pendientes',
    []
  ),
  moduleEs(
    'students-members-participants',
    'Alumnos, miembros y participantes',
    'Un expediente por persona',
    'Mantén cada perfil completo, actualizado y vinculado a su actividad.',
    [
      'Perfiles de alumnos y participantes',
      'Matrículas y membresías',
      'Relaciones con tutores',
      'Asistencia y notas',
      'Documentos y progreso',
    ],
    ['Administración', 'Alumnado'],
    'Expediente del participante',
    'Reúne matrícula, asistencia y documentación en un contexto único.',
    '1,284',
    'perfiles conectados',
    'Resumen del expediente',
    [
      ['Matrículas', '3 activas', 'Ver matrículas'],
      ['Asistencia', '92%', 'Consultar detalle'],
      ['Documentos', 'Completos', 'Abrir documentos'],
    ],
    'El acceso al expediente depende del tenant, el rol y los permisos de la persona usuaria.',
    'Vista de un expediente con matrículas, asistencia y documentos',
    ['auth0']
  ),
  moduleEs(
    'organisation-brands-domains',
    'Organización, marcas y dominios',
    'Estructura tu organización',
    'Organiza marcas, sedes, dominios y responsabilidades con alcance definido.',
    [
      'Jerarquía de organización y marcas',
      'Sedes y campus',
      'Subdominios de Akademate',
      'Dominios propios y temas visuales',
      'Catálogos acotados y contexto legal',
    ],
    ['Dirección', 'TI'],
    'Estructura de la academia',
    'Comprueba cómo se relacionan marca, sedes y campus online.',
    '4',
    'campus conectados',
    'Estructura operativa',
    [
      ['Academia principal', 'Marca principal', 'Ver marca'],
      ['Ubicaciones', '3 físicas', 'Ver sedes'],
      ['Campus online', '1 global', 'Abrir campus'],
    ],
    'Cada dominio y marca conserva el alcance operativo y legal definido para su organización.',
    'Vista de la marca principal, tres sedes físicas y un campus online',
    ['cloudflare', 'auth0']
  ),
  moduleEs(
    'teaching-staff-operations',
    'Operaciones docentes y de personal',
    'Coordina al equipo',
    'Conecta a cada docente y profesional con sus tareas, horarios y responsabilidades.',
    [
      'Registro de docentes y entrenadores',
      'Perfiles del personal',
      'Asignaciones y horarios',
      'Espacios según rol',
      'Contexto de carga y responsabilidad',
    ],
    ['Profesorado', 'RR. HH.'],
    'Espacio docente',
    'Concentra clases, entregas y mensajes privados del día.',
    '28',
    'docentes programados',
    'Trabajo pendiente',
    [
      ['Clases de hoy', '4', 'Ver clases'],
      ['Entregas', '8 por revisar', 'Revisar entregas'],
      ['Mensajes privados', '3 nuevos', 'Abrir mensajes'],
    ],
    'La carga mostrada es operativa y no sustituye los controles laborales o de nómina configurados.',
    'Vista del espacio docente con clases, entregas y mensajes pendientes',
    ['zoom', 'googlemeet']
  ),
  moduleEs(
    'virtual-campus-learning',
    'Campus virtual y aprendizaje',
    'Imparte y acompaña',
    'Reúne lecciones, actividades, feedback y progreso en un campus conectado.',
    [
      'Campus del alumno',
      'Espacio docente del curso',
      'Lecciones y materiales',
      'Tareas y evaluaciones',
      'Calificaciones, feedback y progreso',
    ],
    ['Alumnado', 'Profesorado'],
    'Campus del alumno',
    'Muestra el próximo paso formativo sin inventar actividad ni progreso.',
    '78%',
    'de participación semanal',
    'Próximos pasos',
    [
      ['Próxima lección', 'Hoy, 18:00', 'Abrir lección'],
      ['Actividad', 'Entrega el viernes', 'Ver actividad'],
      ['Progreso del curso', '7 de 10 unidades', 'Consultar progreso'],
    ],
    'La participación y el progreso proceden de la actividad registrada en el campus configurado.',
    'Vista del campus con próxima lección, actividad pendiente y progreso del curso',
    ['zoom', 'googlemeet', 'youtube', 'vimeo']
  ),
  moduleEs(
    'communication-community',
    'Comunicación y comunidad',
    'Mantén a todos alineados',
    'Activa el mensaje adecuado a partir de eventos operativos reales.',
    [
      'Recorridos de correo transaccional',
      'Chat interno entre docentes y alumnos',
      'Notificaciones operativas',
      'Recordatorios y tareas',
      'Automatización basada en eventos',
    ],
    ['Toda la comunidad'],
    'Centro de comunicaciones',
    'Distingue mensajes enviados, no leídos y programados.',
    '96%',
    'de mensajes entregados',
    'Estado de comunicaciones',
    [
      ['Recordatorio de clase', 'Enviado', 'Ver entrega'],
      ['Chat con docente', '2 sin leer', 'Abrir chat'],
      ['Seguimiento de pago', 'Programado', 'Revisar programación'],
    ],
    'Un registro creado o programado no acredita por sí solo la entrega del proveedor.',
    'Vista del estado de recordatorios, chat y seguimiento de pago',
    ['whatsapp', 'twilio']
  ),
  moduleEs(
    'digital-signage',
    'Señalización digital',
    'Activa cada pantalla',
    'Publica contenido oportuno de la academia en las sedes configuradas.',
    [
      'Calendarios de clase y aulas en pantalla',
      'Anuncios y noticias de la academia',
      'Promociones de cursos y eventos',
      'Listas y horarios de publicación por sede',
      'Estado de pantallas y monitorización de reproducción',
    ],
    ['Operaciones', 'Crecimiento'],
    'Red de pantallas',
    'Supervisa contenido publicado, programado y estado de dispositivos.',
    '12',
    'pantallas conectadas',
    'Estado de la red',
    [
      ['Calendarios de clase', '6 activos', 'Ver contenido'],
      ['Anuncios', '3 programados', 'Revisar agenda'],
      ['Estado de pantallas', '12 online', 'Ver dispositivos'],
    ],
    'La señalización digital requiere reproductores y proveedores compatibles contratados por separado.',
    'Vista de calendarios, anuncios y estado de una red de pantallas',
    []
  ),
  moduleEs(
    'payments-billing-finance',
    'Pagos, facturación y finanzas',
    'Conecta cada cobro',
    'Mantén cada pago vinculado a su oferta, matrícula y estado financiero.',
    [
      'Adaptadores para Stripe, PayPal y SEPA',
      'Depósitos, plazos y suscripciones',
      'Membresías y bonos de sesiones',
      'Políticas de devolución y cancelación',
      'Conciliación y APIs financieras',
    ],
    ['Finanzas', 'Alumnado'],
    'Operación de pagos',
    'Revisa cobros, vencimientos y devoluciones dentro de su contexto.',
    '€48k',
    'cobrados este mes',
    'Estado de cobros',
    [
      ['Matrículas pagadas', '184', 'Ver cobros'],
      ['Plazos pendientes', '23', 'Revisar vencimientos'],
      ['Devoluciones por revisar', '2', 'Abrir revisión'],
    ],
    'Importes y estados son ilustrativos; la disponibilidad depende del proveedor y la configuración contractual.',
    'Vista de matrículas pagadas, plazos pendientes y devoluciones por revisar',
    ['stripe', 'paypal', 'sepa', 'visa', 'mastercard', 'applepay', 'googlepay']
  ),
  moduleEs(
    'finance-accounting',
    'Finanzas y contabilidad',
    'Entiende el negocio',
    'Reúne ingresos, costes, cuentas y conciliación para apoyar el cierre financiero.',
    [
      'Cuentas por cobrar y pagar',
      'Libro mayor y plan contable',
      'Centros de coste y entidades',
      'Conexiones bancarias y conciliación',
      'Exportaciones y APIs contables',
    ],
    ['Finanzas', 'Dirección'],
    'Cierre financiero',
    'Identifica saldos y partidas que requieren intervención.',
    '98.4%',
    'de pagos conciliados',
    'Situación financiera',
    [
      ['Cuentas por cobrar', '12.420 €', 'Ver saldos'],
      ['Pagos sin asociar', '4', 'Conciliar pagos'],
      ['Margen por campus', 'Informe disponible', 'Ver informe'],
    ],
    'Las vistas apoyan la operación financiera y no constituyen asesoramiento contable.',
    'Vista de cuentas por cobrar, pagos sin asociar y margen por campus',
    ['xero', 'quickbooks', 'sage']
  ),
  moduleEs(
    'hr-workforce',
    'RR. HH. y equipo',
    'Cuida y planifica el equipo',
    'Coordina contratos, disponibilidad, carga de trabajo y cualificaciones.',
    [
      'Contratos y expedientes del personal',
      'Disponibilidad y sustituciones',
      'Carga de trabajo y tiempo',
      'Ausencias y cualificaciones',
      'Datos para nómina y pagos docentes',
    ],
    ['RR. HH.', 'Dirección'],
    'Planificación del equipo',
    'Detecta disponibilidad, coberturas y renovaciones próximas.',
    '312h',
    'de docencia programada',
    'Necesidades del equipo',
    [
      ['Docentes disponibles', '18', 'Ver disponibilidad'],
      ['Coberturas necesarias', '2 sesiones', 'Buscar sustitución'],
      ['Cualificaciones', '3 renovaciones', 'Revisar vencimientos'],
    ],
    'La planificación no reemplaza la validación contractual, laboral o de nómina correspondiente.',
    'Vista de docentes disponibles, coberturas y renovaciones de cualificaciones',
    []
  ),
  moduleEs(
    'library-inventory-facilities',
    'Biblioteca, inventario e instalaciones',
    'Controla los recursos compartidos',
    'Gestiona préstamos, equipos, existencias, mantenimiento y proveedores.',
    [
      'Catálogo y préstamos de biblioteca',
      'Acceso a recursos digitales',
      'Equipos e inventario',
      'Instalaciones y mantenimiento',
      'Compras y proveedores',
    ],
    ['Operaciones', 'Profesorado'],
    'Control de recursos',
    'Prioriza préstamos, mantenimiento y reposición de existencias.',
    '94%',
    'de recursos disponibles',
    'Incidencias de recursos',
    [
      ['Artículos prestados', '38', 'Ver préstamos'],
      ['Mantenimiento de aulas', '1 actuación', 'Abrir incidencia'],
      ['Existencias bajas', '4 artículos', 'Preparar reposición'],
    ],
    'La disponibilidad refleja los registros del inventario y las instalaciones configuradas.',
    'Vista de préstamos, mantenimiento de aulas y existencias bajas',
    []
  ),
  moduleEs(
    'sports-seasonal-operations',
    'Operaciones deportivas y de temporada',
    'Gestiona equipos y temporadas',
    'Coordina pruebas, grupos, temporadas y programas de duración limitada.',
    [
      'Equipos y categorías',
      'Temporadas y campus',
      'Pruebas y evaluaciones',
      'Consentimiento de tutores',
      'Contexto de instalaciones y equipamiento',
    ],
    ['Entrenadores', 'Familias'],
    'Operación de temporada',
    'Sigue pruebas, consentimientos y capacidad antes de cada actividad.',
    '12',
    'equipos y grupos',
    'Preparación de temporada',
    [
      ['Pruebas esta semana', '24', 'Ver participantes'],
      ['Consentimiento del tutor', '91%', 'Solicitar pendientes'],
      ['Capacidad de instalaciones', 'Disponible', 'Ver espacios'],
    ],
    'Los consentimientos y plazas deben validarse conforme a las reglas del programa.',
    'Vista de pruebas deportivas, consentimientos y capacidad de instalaciones',
    ['googlecalendar']
  ),
  moduleEs(
    'insight-reporting',
    'Datos e informes',
    'Decide con contexto',
    'Convierte demanda, formación y finanzas en indicadores comprensibles.',
    [
      'Paneles operativos',
      'Embudos de conversión y matrícula',
      'Indicadores académicos y de asistencia',
      'Estado financiero y conciliación',
      'Exportaciones e informes gobernados',
    ],
    ['Dirección', 'Operaciones'],
    'Rendimiento de la academia',
    'Relaciona conversión, asistencia y previsión sin ocultar su procedencia.',
    '+18%',
    'de crecimiento de matrículas',
    'Indicadores principales',
    [
      ['Conversión de leads', '24%', 'Ver embudo'],
      ['Asistencia', '91%', 'Consultar detalle'],
      ['Previsión de ingresos', 'Según objetivo', 'Abrir previsión'],
    ],
    'Los indicadores dependen de los datos disponibles y no garantizan resultados futuros.',
    'Vista de conversión, asistencia y previsión de ingresos de la academia',
    []
  ),
  moduleEs(
    'ai-assisted-workflows',
    'Flujos de trabajo asistidos por IA',
    'Asistencia opcional bajo control',
    'Prepara tareas rutinarias manteniendo revisión humana y permisos.',
    [
      'Asistencia contextual',
      'Herramientas según permisos',
      'Puntos de revisión humana',
      'Proveedores configurables',
      'Controles de transparencia de IA',
    ],
    ['Opcional para cada rol'],
    'Acción asistida',
    'Diferencia con claridad entre borrador, revisión y ejecución.',
    'Human',
    'la revisión mantiene el control',
    'Estado de la asistencia',
    [
      ['Resumir una consulta', 'Borrador preparado', 'Revisar borrador'],
      ['Preparar un recordatorio', 'Revisión requerida', 'Abrir revisión'],
      ['Alcance de acceso', 'Según permisos', 'Consultar alcance'],
    ],
    'La IA es opcional; las acciones con consecuencias requieren los controles configurados.',
    'Vista de borradores asistidos, revisión humana y alcance de permisos',
    ['openai']
  ),
  moduleEs(
    'ai-workspace-mcp',
    'Espacio de IA y MCP',
    'Conecta clientes aprobados',
    'Prepara trabajo académico dentro del alcance autorizado de cada persona.',
    [
      'Herramientas MCP acotadas al tenant',
      'Modos de lectura, borrador y confirmación',
      'Opciones de clientes compatibles',
      'Confirmación humana para acciones con consecuencias',
      'Actividad de herramientas auditable',
    ],
    ['Opcional para cada rol', 'TI'],
    'Espacio MCP',
    'Separa lectura, preparación y escritura según su nivel de autorización.',
    'Scoped',
    'al tenant y al contexto del rol',
    'Modos de herramienta',
    [
      ['Acción de lectura', 'Resumir', 'Ver alcance'],
      ['Acción de borrador', 'Revisar primero', 'Abrir borrador'],
      ['Acción de escritura', 'Aprobación requerida', 'Solicitar aprobación'],
    ],
    'La compatibilidad de clientes y herramientas forma parte de la hoja de ruta y la configuración aprobada.',
    'Vista de acciones MCP de lectura, borrador y escritura con sus controles',
    ['openai', 'claude', 'gemini']
  ),
  moduleEs(
    'security-governance',
    'Seguridad y gobierno',
    'Opera con confianza',
    'Integra acceso, privacidad y responsabilidad en la operación cotidiana.',
    [
      'Límites por tenant y organización',
      'Controles de roles y permisos',
      'Flujos de privacidad',
      'Retención y contexto de auditoría',
      'Información de gobierno de IA',
    ],
    ['TI', 'Privacidad'],
    'Controles de acceso',
    'Revisa límites, permisos y contexto auditable desde una vista común.',
    'Scoped',
    'acceso según responsabilidad',
    'Estado de gobierno',
    [
      ['Límite del tenant', 'Activo', 'Revisar alcance'],
      ['Revisión de roles', 'Vence en 8 días', 'Abrir revisión'],
      ['Contexto de auditoría', 'Registrado', 'Consultar registro'],
    ],
    'Estos controles apoyan el gobierno operativo; no equivalen por sí solos a una certificación.',
    'Vista de límites del tenant, revisión de roles y contexto de auditoría',
    ['okta', 'auth0']
  ),
  moduleEs(
    'apis-webhooks-deployment',
    'APIs, webhooks y despliegue',
    'Encaja con tu arquitectura',
    'Conecta sistemas mediante interfaces gobernadas y modelos de despliegue adaptables.',
    [
      'Capa de API y webhooks',
      'Capa de integración MCP',
      'Proveedores de pagos, correo y finanzas',
      'Servicio cloud gestionado',
      'Cloud privado o instalación propia',
    ],
    ['TI', 'Partners'],
    'Capa de integración',
    'Consulta el alcance de interfaces, eventos y opciones de despliegue.',
    '3',
    'modelos de despliegue',
    'Capacidades técnicas',
    [
      ['Acceso a la API', 'Gobernado', 'Ver alcance'],
      ['Webhooks', 'Basados en eventos', 'Consultar eventos'],
      ['Despliegue', 'Cloud o privado', 'Comparar modelos'],
    ],
    'La disponibilidad de interfaces y despliegues se acuerda según plan, proveedor y alcance técnico.',
    'Vista del acceso API, webhooks y modelos de despliegue disponibles',
    ['zapier', 'make', 'n8n']
  ),
] as const satisfies readonly SpanishFeatureModule[]

const spanishFeatureModuleById = Object.fromEntries(
  spanishFeatureModules.map((module) => [module.id, module])
) as Partial<Record<FeatureModuleId, (typeof spanishFeatureModules)[number]>>

export function getSpanishFeatureModule(id: FeatureModuleId): SpanishFeatureModule {
  const module = spanishFeatureModuleById[id]
  if (!module) throw new Error(`Falta la ficha española del módulo: ${id}`)
  return module
}

function moduleEs(
  id: FeatureModuleId,
  title: string,
  eyebrow: string,
  description: string,
  features: readonly string[],
  audiences: readonly string[],
  previewTitle: string,
  previewDescription: string,
  signal: string,
  signalLabel: string,
  tableHeading: string,
  rows: ReadonlyArray<readonly [label: string, value: string, action: string]>,
  note: string,
  alt: string,
  connectors: readonly IntegrationBrandId[]
): SpanishFeatureModule {
  return {
    id,
    title,
    eyebrow,
    description,
    features,
    audiences,
    preview: {
      title: previewTitle,
      description: previewDescription,
      signal,
      signalLabel,
      tableHeading,
      rows: rows.map(([label, value, action]) => ({ label, value, action })),
      note,
      alt,
    },
    connectors,
    aria: {
      tab: `Mostrar el módulo ${title}`,
      panel: `Detalle del módulo ${title}`,
      preview: `Vista previa operativa de ${title}: ${alt}`,
    },
  }
}
