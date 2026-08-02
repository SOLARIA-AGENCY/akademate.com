import type { StoryField, StoryMoment, VerticalProductStory } from '@/lib/vertical-product-stories'
import { verticalProductStories } from '@/lib/vertical-product-stories'

type SpanishMomentCopy = Pick<
  StoryMoment,
  'label' | 'title' | 'text' | 'metricLabel' | 'fields' | 'activity'
>

type SpanishStoryCopy = {
  noun: string
  moments: SpanishMomentCopy[]
}

const field = (label: string, ...options: string[]): StoryField => ({ label, options })

/**
 * Spanish product copy is deliberately authored per vertical. It is not generated from the
 * English catalogue: every scenario, control and activity must sound like the operation that
 * the academy team actually manages.
 */
const spanishStoryCopy: Record<string, SpanishStoryCopy> = {
  'professional-training': {
    noun: 'centro de formación',
    moments: [
      {
        label: 'Programa',
        title: 'Configura cada convocatoria desde su programa.',
        text: 'Define titulación, modalidad, documentación, sedes y fechas antes de abrir admisiones.',
        metricLabel: 'plazas en la convocatoria de septiembre',
        fields: [
          field('Programa', 'Marketing Digital Nivel 3', 'Diploma en Dirección de Proyectos'),
          field('Modalidad', 'Híbrida', 'Presencial', 'Online'),
          field('Sede', 'Sede central', 'Sede norte', 'Campus online'),
        ],
        activity: [
          'Requisitos de acceso adjuntos',
          'Dos fechas de evaluación disponibles',
          'Solicitud publicada',
        ],
      },
      {
        label: 'Admisiones',
        title: 'Acompaña cada solicitud hasta la matrícula.',
        text: 'Reúne requisitos, documentos, entrevistas, decisiones y aceptación de plaza en un recorrido claro.',
        metricLabel: 'solicitudes activas',
        fields: [
          field('Estado', 'Lista para revisar', 'Pendiente de documentos', 'Aprobada'),
          field('Documento', 'Identidad', 'Titulación previa', 'Justificante de financiación'),
          field('Responsable', 'Equipo de admisiones', 'Dirección académica'),
        ],
        activity: [
          '12 listas para revisar',
          '8 pendientes de documentación',
          '6 plazas reservadas',
        ],
      },
      {
        label: 'Impartición',
        title: 'Conecta docencia, asistencia y evaluación.',
        text: 'El profesorado trabaja desde su curso y el alumnado accede a clases, sesiones en directo y recursos.',
        metricLabel: 'asistencia de la cohorte',
        fields: [
          field('Cohorte', 'MD-SEP-26', 'DP-OCT-26'),
          field('Sesión', 'Taller presencial', 'Tutoría online en directo'),
          field('Evaluación', 'Portafolio', 'Observación práctica'),
        ],
        activity: [
          'Asistencia registrada',
          'Feedback del portafolio pendiente',
          'Próxima tutoría programada',
        ],
      },
      {
        label: 'Finanzas',
        title: 'Relaciona cada cobro con su matrícula.',
        text: 'Gestiona depósitos, cuotas, facturas y conciliación para la entidad y la sede correspondientes.',
        metricLabel: 'pagos conciliados',
        fields: [
          field('Plan de pago', '3 cuotas mensuales', 'Pago único', 'Plaza financiada'),
          field('Método', 'Tarjeta con Stripe', 'PayPal', 'Domiciliación SEPA'),
          field('Entidad receptora', 'Centro principal', 'Sede norte'),
        ],
        activity: ['Depósito recibido', 'Próxima cuota en 12 días', 'Factura disponible'],
      },
    ],
  },
  wellness: {
    noun: 'estudio de bienestar',
    moments: [
      {
        label: 'Clases',
        title: 'Diseña un horario al que apetece volver.',
        text: 'Ofrece yoga, pilates y sesiones privadas por nivel, instructor y sala.',
        metricLabel: 'clases programadas hoy',
        fields: [
          field('Clase', 'Vinyasa Flow', 'Pilates Reformer', 'Hatha Yoga', 'Sesión privada'),
          field('Nivel', 'Todos los niveles', 'Iniciación', 'Intermedio'),
          field('Instructora', 'Maya Chen', 'Sofía Lind', 'Daniel Moore'),
        ],
        activity: [
          'Quedan 3 plazas en Vinyasa',
          'Lista de espera activa en Reformer',
          'Sustitución confirmada',
        ],
      },
      {
        label: 'Estudios',
        title: 'Coordina salas, aforo y equipo.',
        text: 'Organiza cada espacio físico y el horario online con disponibilidad visible para todo el equipo.',
        metricLabel: 'espacios conectados',
        fields: [
          field('Ubicación', 'Estudio Riverside', 'Estudio Norte', 'Estudio online'),
          field('Sala', 'Sala Sol', 'Sala Reformer', 'Sala privada'),
          field('Aforo', '16 esterillas', '10 reformers', '1 sesión privada'),
        ],
        activity: [
          'Sala Sol preparada',
          '10 reformers disponibles',
          'La sala online abre 10 minutos antes',
        ],
      },
      {
        label: 'Socios',
        title: 'Haz que reservar y entrar sea natural.',
        text: 'Combina pruebas, clases sueltas, bonos y membresías con asistencia y seguimiento de renovación.',
        metricLabel: 'retención mensual',
        fields: [
          field('Socio', 'Amelia Torres', 'Noah Berg', 'Nueva prueba'),
          field('Acceso', 'Mensual ilimitado', 'Bono de 10 clases', 'Clase suelta'),
          field('Entrada', 'Recepción', 'Código QR'),
        ],
        activity: [
          'Prueba convertida en membresía',
          'Quedan 3 sesiones en el bono',
          'Recordatorio de renovación preparado',
        ],
      },
      {
        label: 'Pagos',
        title: 'Vende membresías en un checkout fluido.',
        text: 'Une clase, sede, política de cancelación y pago recurrente al perfil de cada socio.',
        metricLabel: 'membresía mensual ilimitada',
        fields: [
          field('Compra', 'Mensual ilimitado', 'Bono de 10 clases', 'Clase individual'),
          field('Estudio', 'Estudio Riverside', 'Todas las ubicaciones'),
          field('Método', 'Tarjeta con Stripe', 'PayPal', 'Domiciliación SEPA'),
        ],
        activity: [
          'Próxima renovación el 1 de septiembre',
          'Política de cancelación de 14 días',
          'Recibo enviado',
        ],
      },
    ],
  },
  sports: {
    noun: 'academia deportiva',
    moments: [
      {
        label: 'Pruebas',
        title: 'Convierte el interés en una plaza adecuada.',
        text: 'Recoge edad, experiencia, tutor y sede para preparar cada prueba deportiva.',
        metricLabel: 'pruebas esta semana',
        fields: [
          field('Programa', 'Fútbol sub-14', 'Tenis junior', 'Campus de rendimiento'),
          field('Edad', 'Menores de 10', 'Menores de 14', 'Menores de 18'),
          field('Instalación', 'Campo norte', 'Pistas centrales'),
        ],
        activity: ['Tutor invitado', 'Rúbrica de evaluación preparada', 'Entrenador asignado'],
      },
      {
        label: 'Equipos',
        title: 'Coordina equipos, técnicos y temporada.',
        text: 'Mantén plantillas, grupos de entrenamiento, asistencia y cambios ligados a la temporada.',
        metricLabel: 'equipos activos',
        fields: [
          field('Equipo', 'Sub-14 Azul', 'Sub-14 Blanco', 'Sub-16 Rendimiento'),
          field('Entrenador', 'Alex Romero', 'Jordan Lee'),
          field('Temporada', 'Otoño 2026', 'Invierno 2026'),
        ],
        activity: [
          'Plantilla de 18 deportistas',
          'Dos licencias por renovar',
          'Sesión visitante confirmada',
        ],
      },
      {
        label: 'Instalaciones',
        title: 'Planifica espacios y material deportivo.',
        text: 'Asigna sesiones según instalación, aforo y equipamiento con una agenda compartida.',
        metricLabel: 'ocupación de instalaciones',
        fields: [
          field('Instalación', 'Campo Norte 1', 'Pista Central 2', 'Sala de fuerza'),
          field('Material', 'Kit de fútbol', 'Cestas de tenis', 'Puertas de cronometraje'),
          field('Sesión', 'Entrenamiento de equipo', 'Evaluación', 'Entrenamiento privado'),
        ],
        activity: [
          'Inspección de campo completada',
          'Material reservado',
          'Previsión meteorológica compartida',
        ],
      },
      {
        label: 'Cuotas',
        title: 'Organiza pagos familiares y licencias.',
        text: 'Cobra depósitos, suscripciones o temporada con consentimiento del tutor y fechas claras.',
        metricLabel: 'cuotas de temporada cobradas',
        fields: [
          field('Cuota', 'Temporada completa', 'Plan mensual', 'Depósito de prueba'),
          field('Participante', 'Leo Martín', 'Mia Jensen'),
          field('Método', 'Tarjeta con Stripe', 'PayPal', 'Domiciliación SEPA'),
        ],
        activity: ['Pago autorizado por el tutor', 'Licencia incluida', 'Recibo compartido'],
      },
    ],
  },
  seasonal: {
    noun: 'programa de temporada',
    moments: [
      {
        label: 'Lanzamiento',
        title: 'Publica un campamento desde una sola configuración.',
        text: 'Presenta fechas, edades, actividades y plazas en una página lista para compartir.',
        metricLabel: 'semanas abiertas para reservar',
        fields: [
          field('Programa', 'Verano multideporte', 'Semana creativa', 'Aventura de idiomas'),
          field('Semana', '6 al 10 de julio', '13 al 17 de julio', '20 al 24 de julio'),
          field('Edad', '6 a 8 años', '9 a 12 años', '13 a 15 años'),
        ],
        activity: [
          'Vista social preparada',
          'Reserva anticipada abierta',
          'Reglas de aforo aplicadas',
        ],
      },
      {
        label: 'Familias',
        title: 'Prepara cada detalle antes de la llegada.',
        text: 'Reúne consentimiento, salud, alergias, personas autorizadas y documentos por participante.',
        metricLabel: 'formularios completos',
        fields: [
          field(
            'Formulario',
            'Salud y alergias',
            'Consentimiento de imagen',
            'Recogida autorizada'
          ),
          field('Estado', 'Completo', 'Requiere atención'),
          field('Tutor', 'Tutor principal', 'Contacto adicional'),
        ],
        activity: [
          '12 recordatorios programados',
          '3 alergias destacadas',
          'Lista de recogida preparada',
        ],
      },
      {
        label: 'Llegadas',
        title: 'Recibe a cada grupo con una lista clara.',
        text: 'Consulta llegadas, grupos, monitores e incidencias desde el punto de entrada.',
        metricLabel: 'participantes previstos el lunes',
        fields: [
          field('Punto de acceso', 'Entrada principal', 'Campo deportivo'),
          field('Grupo', 'Grupo azul', 'Grupo verde', 'Grupo naranja'),
          field('Estado', 'Previsto', 'Registrado', 'Llegada tardía'),
        ],
        activity: [
          'Listado de monitores compartido',
          'Notas médicas visibles',
          'Código de recogida preparado',
        ],
      },
      {
        label: 'Depósitos',
        title: 'Asegura la plaza y programa el saldo.',
        text: 'Configura depósito, vencimiento, cancelación y descuentos para cada semana del campamento.',
        metricLabel: 'depósito de reserva',
        fields: [
          field('Plan', 'Depósito y saldo', 'Pago completo'),
          field('Descuento', 'Hermanos', 'Varias semanas', 'Sin descuento'),
          field('Método', 'Tarjeta con Stripe', 'PayPal'),
        ],
        activity: ['Saldo 30 días antes', 'Descuento de hermanos aplicado', 'Confirmación enviada'],
      },
    ],
  },
  'performing-arts': {
    noun: 'academia de artes escénicas',
    moments: [
      {
        label: 'Disciplinas',
        title: 'Da forma a cada recorrido creativo.',
        text: 'Publica clases y lecciones con nivel, formato, requisitos y progresión visibles.',
        metricLabel: 'formatos de clase semanales',
        fields: [
          field('Disciplina', 'Danza contemporánea', 'Piano', 'Teatro musical'),
          field('Nivel', 'Iniciación', 'Intermedio', 'Avanzado'),
          field('Formato', 'Clase grupal', 'Lección privada', 'Ensamble'),
        ],
        activity: [
          'Clase de prueba disponible',
          'Guía de nivel publicada',
          'Recorrido hacia el recital conectado',
        ],
      },
      {
        label: 'Estudios',
        title: 'Mantén aulas y docentes en ritmo.',
        text: 'Coordina recurrencias con idoneidad de la sala, equipamiento y disponibilidad docente.',
        metricLabel: 'espacios especializados',
        fields: [
          field('Espacio', 'Estudio de danza A', 'Aula de piano 2', 'Caja negra'),
          field('Recurso', 'Piano de cola', 'Equipo de sonido', 'Espejos y barra'),
          field('Frecuencia', 'Semanal', 'Quincenal', 'Sesión única'),
        ],
        activity: [
          'Piano afinado',
          'Cambio de estudio notificado',
          'Docente de sustitución disponible',
        ],
      },
      {
        label: 'Progreso',
        title: 'Conecta práctica, feedback y actuación.',
        text: 'El profesorado comparte recursos y el alumnado sigue objetivos, ensayos y evolución.',
        metricLabel: 'objetivos de práctica completados',
        fields: [
          field('Alumno', 'Ava Collins', 'Elias Moore'),
          field('Objetivo', 'Técnica', 'Repertorio', 'Interpretación'),
          field('Feedback', 'Nota privada', 'Revisión en vídeo'),
        ],
        activity: [
          'Vídeo revisado',
          'Nueva partitura compartida',
          'Recordatorio de ensayo enviado',
        ],
      },
      {
        label: 'Facturación',
        title: 'Simplifica clases y cuentas familiares.',
        text: 'Agrupa hermanos, lecciones privadas, ensambles y tasas de actuación en una cuenta legible.',
        metricLabel: 'plan familiar mensual',
        fields: [
          field('Cuenta', 'Familia Collins', 'Familia Moore'),
          field('Plan', 'Mensualidad', 'Cuota trimestral', 'Bono de lecciones'),
          field('Método', 'Tarjeta con Stripe', 'Domiciliación SEPA'),
        ],
        activity: [
          'Dos alumnos incluidos',
          'Tasa de recital programada',
          'Próxima factura preparada',
        ],
      },
    ],
  },
  'online-cohorts': {
    noun: 'academia online',
    moments: [
      {
        label: 'Cohorte',
        title: 'Reúne la cohorte adecuada.',
        text: 'Conecta solicitudes, currículo, sesiones y comunidad desde la admisión.',
        metricLabel: 'alumnos en la próxima cohorte',
        fields: [
          field('Programa', 'Liderazgo de producto', 'Fundamentos de datos'),
          field('Zona horaria', 'Europa', 'América', 'Asia-Pacífico'),
          field('Ritmo', '8 semanas', '12 semanas', 'Autónomo con sesiones en directo'),
        ],
        activity: [
          'Orientación publicada',
          'Calendario generado',
          'Espacios de comunidad preparados',
        ],
      },
      {
        label: 'Clases en directo',
        title: 'Coordina cada sesión en directo.',
        text: 'Organiza facilitadores, salas, asistencia, grabaciones y recursos de seguimiento.',
        metricLabel: 'sesiones en directo esta semana',
        fields: [
          field('Sesión', 'Taller', 'Tutoría abierta', 'Sesión invitada'),
          field('Sala', 'Zoom', 'Google Meet'),
          field('Grabación', 'Publicar para la cohorte', 'Solo facilitadores'),
        ],
        activity: [
          'La sala abre 10 minutos antes',
          'Grabación procesándose',
          'Asistencia sincronizada',
        ],
      },
      {
        label: 'Comunidad',
        title: 'Une tareas, conversación y apoyo docente.',
        text: 'Cada alumno ve su siguiente paso, el chat privado y la conversación de la cohorte.',
        metricLabel: 'participación semanal',
        fields: [
          field('Actividad', 'Tarea', 'Debate', 'Revisión entre compañeros'),
          field('Audiencia', 'Toda la cohorte', 'Grupo de estudio', 'Individual'),
          field('Feedback', 'Rúbrica', 'Chat privado', 'Nota en vídeo'),
        ],
        activity: [
          '12 entregas recibidas',
          '3 preguntas privadas abiertas',
          'La revisión cierra el viernes',
        ],
      },
      {
        label: 'Pago',
        title: 'Abre la cohorte a alumnado internacional.',
        text: 'Asocia condiciones de pago, fechas de acceso y cancelación al perfil de cada alumno.',
        metricLabel: 'plan en tres pagos',
        fields: [
          field('Acceso', 'Matrícula de cohorte', 'Suscripción mensual'),
          field('Moneda', 'EUR', 'GBP', 'USD'),
          field('Método', 'Tarjeta con Stripe', 'PayPal'),
        ],
        activity: ['Acceso activo tras el pago', 'Segunda cuota programada', 'Factura disponible'],
      },
    ],
  },
  languages: {
    noun: 'academia de idiomas',
    moments: [
      {
        label: 'Nivelación',
        title: 'Sitúa a cada alumno en su nivel.',
        text: 'Conecta prueba, objetivos, disponibilidad y sede para recomendar el grupo adecuado.',
        metricLabel: 'nivel MCER recomendado',
        fields: [
          field('Idioma', 'Inglés', 'Español', 'Alemán'),
          field('Objetivo', 'Fluidez general', 'Preparación de examen', 'Negocios'),
          field('Nivelación', 'Prueba online', 'Entrevista docente'),
        ],
        activity: [
          'Resultado escrito recibido',
          'Entrevista oral reservada',
          'Tres grupos compatibles',
        ],
      },
      {
        label: 'Grupos',
        title: 'Forma grupos equilibrados y viables.',
        text: 'Compara sedes, aulas, docentes y opciones online antes de confirmar la plaza.',
        metricLabel: 'grupos B2 con disponibilidad',
        fields: [
          field('Horario', 'Lun y mié 18:00', 'Mar y jue 10:00'),
          field('Ubicación', 'Sede central', 'Sede norte', 'Online'),
          field('Docente', 'Emma Hall', 'Lucas Meyer'),
        ],
        activity: ['Media de 9 alumnos por grupo', 'Aula híbrida disponible', 'Libro reservado'],
      },
      {
        label: 'Aprendizaje',
        title: 'Alinea progreso presencial y online.',
        text: 'Reúne asistencia, tareas, expresión oral, calificaciones y evolución de nivel en el campus.',
        metricLabel: 'asistencia mensual',
        fields: [
          field('Destreza', 'Expresión oral', 'Escritura', 'Comprensión auditiva', 'Lectura'),
          field('Actividad', 'Tarea', 'Clase en directo', 'Simulacro de examen'),
          field('Feedback', 'Cuaderno de notas', 'Nota privada del docente'),
        ],
        activity: ['Tarea devuelta', 'Feedback oral compartido', 'Simulacro programado'],
      },
      {
        label: 'Facturación mensual',
        title: 'Relaciona la mensualidad con cada grupo.',
        text: 'Gestiona cuotas, trimestres, materiales y cambios de grupo conservando el historial.',
        metricLabel: 'mensualidad de grupo',
        fields: [
          field('Facturación', 'Mensual', 'Trimestral', 'Curso completo'),
          field('Materiales', 'Incluidos', 'Cargo separado'),
          field('Método', 'Domiciliación SEPA', 'Tarjeta con Stripe', 'PayPal'),
        ],
        activity: [
          'Próximo cobro el 1 de septiembre',
          'Libro incluido',
          'El cambio de grupo conserva la facturación',
        ],
      },
    ],
  },
  networks: {
    noun: 'red de academias',
    moments: [
      {
        label: 'Estructura',
        title: 'Modela la red completa.',
        text: 'Organiza marcas, entidades, sedes y responsabilidades con una estructura compartida.',
        metricLabel: 'sedes en el grupo',
        fields: [
          field('Marca', 'Akademate Norte', 'Akademate Ciudad'),
          field('Entidad', 'Empresa del grupo', 'Operador local'),
          field('Sede', 'Estocolmo Centro', 'Malmö Sur', 'Online Europa'),
        ],
        activity: [
          'Normas de marca activas',
          'Catálogo local asignado',
          'Dominio conectado a la sede',
        ],
      },
      {
        label: 'Permisos',
        title: 'Da a cada equipo el acceso adecuado.',
        text: 'Acota personas por sede, responsabilidad financiera y programas asignados.',
        metricLabel: 'plantillas de roles',
        fields: [
          field('Rol', 'Dirección de grupo', 'Responsable de sede', 'Docente'),
          field('Ámbito', 'Todas las sedes', 'Una sede', 'Programas asignados'),
          field('Finanzas', 'Consolidado', 'Solo local', 'Sin acceso'),
        ],
        activity: [
          'Revisión trimestral programada',
          'Dos cambios de rol pendientes',
          'Contexto de auditoría registrado',
        ],
      },
      {
        label: 'Operación local',
        title: 'Opera cada sede con autonomía coordinada.',
        text: 'Adapta horarios, aforo, catálogo, idioma y comunicaciones sobre una base común.',
        metricLabel: 'consistencia del catálogo',
        fields: [
          field('Sede', 'Estocolmo Centro', 'Malmö Sur'),
          field('Catálogo', 'Programas compartidos', 'Programas locales'),
          field('Comunicación', 'Idioma local', 'Plantilla del grupo'),
        ],
        activity: ['Festivo local aplicado', 'Aforo actualizado', 'Página de campaña publicada'],
      },
      {
        label: 'Finanzas de grupo',
        title: 'Lee el rendimiento de toda la red.',
        text: 'Dirige cobros a la entidad acordada y consolida ingresos, ocupación y saldos pendientes.',
        metricLabel: 'ingresos mensuales del grupo',
        fields: [
          field('Vista', 'Grupo consolidado', 'Por marca', 'Por sede'),
          field('Entidad receptora', 'Entidad del grupo', 'Operador local'),
          field('Liquidación', 'Stripe', 'PayPal', 'SEPA'),
        ],
        activity: [
          '13 de 14 sedes conciliadas',
          'Margen local disponible',
          'Previsión del grupo actualizada',
        ],
      },
    ],
  },
}

export const spanishVerticalProductStories: Record<string, VerticalProductStory> =
  Object.fromEntries(
    Object.entries(spanishStoryCopy).map(([slug, localized]) => {
      const source = verticalProductStories[slug]
      if (!source || source.moments.length !== localized.moments.length) {
        throw new Error(`Spanish vertical story is out of sync: ${slug}`)
      }
      return [
        slug,
        {
          noun: localized.noun,
          moments: localized.moments.map((copy, index) => ({
            ...source.moments[index]!,
            ...copy,
          })),
        },
      ]
    })
  )
