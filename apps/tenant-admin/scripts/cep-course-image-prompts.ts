export type CourseAccent = 'privado' | 'ocupados' | 'desempleados'
export type DeliveryAccent = 'presencial' | 'teleformacion'
export type CourseDomainStyle =
  | 'healthcare'
  | 'fitness'
  | 'animals'
  | 'office'
  | 'creative'
  | 'legal'
  | 'technical'
  | 'wellness'

export type CourseImagePrompt = {
  courseId: number
  slug: string
  name: string
  courseType: CourseAccent
  delivery: DeliveryAccent
  domainStyle: CourseDomainStyle
  prompt: string
}

type PromptSeed = Omit<CourseImagePrompt, 'prompt'>

const ACCENT_STYLE: Record<CourseAccent, string> = {
  privado:
    'base visual neutra y profesional; en salud y entornos clinicos dominar blancos limpios, marfil clinico y tonos sanitarios suaves; usar rojo editorial elegante solo como acento sutil y secundario en pequenos detalles, reflejos o elementos de apoyo, nunca como color dominante de la escena; en areas no sanitarias mantener igualmente el rojo como acento contenido de formacion privada',
  ocupados:
    'acento visual principal verde profesional, detalles cromaticos esmeralda y verde activo controlado, energia de mejora profesional en activo, sin invadir la escena',
  desempleados:
    'acento visual principal azul limpio, detalles cromaticos azul institucional y cobalto suave, energia de oportunidad y reinsercion profesional, sin invadir la escena',
}

const TELEFORMACION_OVERLAY =
  'sumar acento secundario naranja calido y tecnologico propio de teleformacion, presente en iluminacion ambiental, reflejos o pequenos elementos del entorno sin dominar por completo la escena'

const DOMAIN_STYLE: Record<CourseDomainStyle, string> = {
  healthcare:
    'base visual clinica blanca y neutra, batas blancas limpias cuando apliquen, marfil clinico y tonos sanitarios suaves como dominantes',
  fitness:
    'base visual atletica neutra y luminosa, materiales profesionales y entorno de entrenamiento pulcro como dominantes',
  animals:
    'base visual limpia y profesional, bienestar animal visible, entorno tecnico amable y controlado como dominante',
  office:
    'base visual profesional neutra, espacios de trabajo ordenados y contemporaneos como dominante',
  creative:
    'base visual moderna y creativa, tecnologia o herramientas de produccion visibles, entorno cuidado y profesional como dominante',
  legal:
    'base visual institucional neutra y pulcra, tono sobrio, documental y profesional como dominante',
  technical:
    'base visual tecnica y precisa, equipamiento o instrumental visible, entorno profesional controlado como dominante',
  wellness:
    'base visual calmada y limpia, tonos terapeuticos suaves y espacios de bienestar profesionales como dominante',
}

function buildPrompt(
  courseFocus: string,
  courseType: CourseAccent,
  delivery: DeliveryAccent,
  domainStyle: CourseDomainStyle,
): string {
  const deliveryStyle = delivery === 'teleformacion' ? `${TELEFORMACION_OVERLAY},` : ''
  return [
    'Fotografia editorial profesional, realista, premium, luz limpia y contrastada, composicion cinematografica, entorno profesional verosimil, escena educativa o profesional con contexto real de trabajo, evitar retrato individual posado salvo necesidad clara, priorizar interaccion, practica, colaboracion o actividad del oficio, sin texto, sin logos, sin marcas de agua,',
    `${DOMAIN_STYLE[domainStyle]},`,
    `${ACCENT_STYLE[courseType]},`,
    deliveryStyle,
    'alta nitidez, profundidad de campo natural, formato horizontal 16:9.',
    courseFocus,
  ]
    .filter(Boolean)
    .join(' ')
}

function createPrompt(seed: PromptSeed, courseFocus: string): CourseImagePrompt {
  return {
    ...seed,
    prompt: buildPrompt(courseFocus, seed.courseType, seed.delivery, seed.domainStyle),
  }
}

const PRIVATE_PROMPT_SEEDS: Array<[PromptSeed, string]> = [
  [
    {
      courseId: 11,
      slug: 'adiestramiento-canino-i-priv',
      name: 'Adiestramiento Canino I',
      courseType: 'privado',
      delivery: 'presencial',
      domainStyle: 'animals',
    },
    'Curso de Adiestramiento Canino I: escena de formacion canina con guia profesional mostrando obediencia basica a una pequena pareja de alumnos o asistentes junto a un perro atento en pista de entrenamiento limpia, conos, correa y gestos claros de aprendizaje, ambiente sereno y didactico.',
  ],
  [
    {
      courseId: 12,
      slug: 'adiestramiento-canino-ii-priv',
      name: 'Adiestramiento Canino II',
      courseType: 'privado',
      delivery: 'presencial',
      domainStyle: 'animals',
    },
    'Curso de Adiestramiento Canino II: escena avanzada de entrenamiento con adiestrador profesional y apoyo de otra persona del equipo mientras un perro ejecuta un circuito tecnico con salto bajo y senalizacion, comunicacion precisa y ambiente de especializacion real.',
  ],
  [
    {
      courseId: 13,
      slug: 'agente-funerario-tanatopraxia-y-tanatoestetica-priv',
      name: 'Agente Funerario (Tanatopraxia y Tanatoestetica)',
      courseType: 'privado',
      delivery: 'presencial',
      domainStyle: 'legal',
    },
    'Curso de Agente Funerario, Tanatopraxia y Tanatoestetica: escena sobria y respetuosa con hombre y mujer elegantes del sector funerario en interior institucional pulcro, mirando o conversando en actitud solemne, con contexto profesional discreto y sin mostrar camillas, cuerpos ni contenido sensible explicito.',
  ],
  [
    {
      courseId: 5,
      slug: 'auxiliar-clinico-veterinario-priv',
      name: 'Auxiliar Clinico Veterinario',
      courseType: 'privado',
      delivery: 'presencial',
      domainStyle: 'healthcare',
    },
    'Curso de Auxiliar Clinico Veterinario: escena de consulta moderna con auxiliar y veterinario atendiendo a un perro sobre mesa clinica, instrumental limpio, monitor veterinario al fondo, trato cercano, tecnico y colaborativo.',
  ],
  [
    {
      courseId: 8,
      slug: 'auxiliar-de-clinicas-esteticas-priv',
      name: 'Auxiliar de Clinicas Esteticas',
      courseType: 'privado',
      delivery: 'presencial',
      domainStyle: 'healthcare',
    },
    'Curso de Auxiliar de Clinicas Esteticas: cabina estetica avanzada con dos profesionales organizando camilla, aparatologia facial y corporal y materiales de trabajo, ambiente sanitario elegante, limpio y luminoso, sensacion de practica formativa real.',
  ],
  [
    {
      courseId: 10,
      slug: 'auxiliar-de-enfermeria-priv',
      name: 'Auxiliar de Enfermeria',
      courseType: 'privado',
      delivery: 'presencial',
      domainStyle: 'healthcare',
    },
    'Curso de Auxiliar de Enfermeria: entorno clinico moderno con auxiliar sanitaria preparando material junto a otro profesional y acompanando a paciente en consulta o control basico, tono humano, tecnico y profesional.',
  ],
  [
    {
      courseId: 183,
      slug: 'auxiliar-de-odontologia-e-higiene-priv',
      name: 'Auxiliar de Odontologia e Higiene',
      courseType: 'privado',
      delivery: 'presencial',
      domainStyle: 'healthcare',
    },
    'Curso de Auxiliar de Odontologia e Higiene: clinica dental contemporanea con auxiliar y odontologo coordinandose junto a sillon odontologico, bandeja e instrumental preparados, iluminacion limpia y ambiente sanitario preciso.',
  ],
  [
    {
      courseId: 14,
      slug: 'auxiliar-de-odontologia-e-higiene-online-priv',
      name: 'Auxiliar de Odontologia e Higiene online',
      courseType: 'privado',
      delivery: 'teleformacion',
      domainStyle: 'healthcare',
    },
    'Curso online de Auxiliar de Odontologia e Higiene: escena de estudio remoto con persona revisando anatomia dental y protocolos clinicos en workstation domestica elegante, portatil, tableta, modelos dentales y videoclase visible como contexto formativo, sin texto legible.',
  ],
  [
    {
      courseId: 181,
      slug: 'auxiliar-de-optica-priv',
      name: 'Auxiliar de Optica',
      courseType: 'privado',
      delivery: 'presencial',
      domainStyle: 'healthcare',
    },
    'Curso de Auxiliar de Optica: espacio optico moderno con dos profesionales revisando monturas y equipamiento de graduacion, vitrinas limpias y ambiente de atencion tecnica y comercial premium.',
  ],
  [
    {
      courseId: 15,
      slug: 'auxiliar-de-optica-online-priv',
      name: 'Auxiliar de Optica online',
      courseType: 'privado',
      delivery: 'teleformacion',
      domainStyle: 'healthcare',
    },
    'Curso online de Auxiliar de Optica: escritorio de estudio profesional con portatil, lentes, monturas y material optico, persona siguiendo contenidos tecnicos en remoto con contexto de practica y aprendizaje, estetica limpia y tecnologica.',
  ],
  [
    {
      courseId: 6,
      slug: 'ayudante-tecnico-veterinario-atv-priv',
      name: 'Ayudante Tecnico Veterinario (ATV)',
      courseType: 'privado',
      delivery: 'presencial',
      domainStyle: 'healthcare',
    },
    'Curso de Ayudante Tecnico Veterinario, ATV: escena de clinica veterinaria con tecnico y auxiliar asistiendo procedimiento basico con perro o gato, monitor, guantes, material clinico ordenado y ambiente de practica profesional compartida.',
  ],
  [
    {
      courseId: 16,
      slug: 'dermocosmetica-priv',
      name: 'Dermocosmetica',
      courseType: 'privado',
      delivery: 'presencial',
      domainStyle: 'healthcare',
    },
    'Curso de Dermocosmetica: laboratorio cosmetico limpio o cabina dermoestetica avanzada con profesionales analizando piel y trabajando con productos y activos, imagen sofisticada, tecnica y aplicada.',
  ],
  [
    {
      courseId: 17,
      slug: 'desarrollo-de-videojuegos-priv',
      name: 'Desarrollo de Videojuegos',
      courseType: 'privado',
      delivery: 'presencial',
      domainStyle: 'creative',
    },
    'Curso de Desarrollo de Videojuegos: estudio creativo tecnologico con pequeno equipo de desarrollo colaborando frente a monitores con motor de juego, arte 3D e interfaz de produccion, ambiente moderno e inmersivo.',
  ],
  [
    {
      courseId: 18,
      slug: 'dietetica-y-nutricion-priv',
      name: 'Dietetica y Nutricion',
      courseType: 'privado',
      delivery: 'presencial',
      domainStyle: 'healthcare',
    },
    'Curso de Dietetica y Nutricion: consulta nutricional moderna con profesional revisando plan alimentario junto a paciente o colega, material clinico y alimentos frescos bien presentados, tono saludable, tecnico y actual.',
  ],
  [
    {
      courseId: 19,
      slug: 'direccion-y-gestion-de-clinicas-dentales-priv',
      name: 'Direccion y Gestion de Clinicas Dentales',
      courseType: 'privado',
      delivery: 'presencial',
      domainStyle: 'healthcare',
    },
    'Curso de Direccion y Gestion de Clinicas Dentales: recepcion premium de clinica dental con dos profesionales coordinando agenda, indicadores y operativa, mezcla clara de salud y gestion empresarial.',
  ],
  [
    {
      courseId: 7,
      slug: 'entrenamiento-personal-priv',
      name: 'Entrenamiento Personal',
      courseType: 'privado',
      delivery: 'presencial',
      domainStyle: 'fitness',
    },
    'Curso de Entrenamiento Personal: escena fitness elegante con entrenador guiando tecnica de fuerza o movilidad a una persona en practica, equipamiento moderno, energia profesional y control tecnico.',
  ],
  [
    {
      courseId: 20,
      slug: 'especialista-en-cetaceos-y-animales-marinos-priv',
      name: 'Especialista en Cetaceos y Animales Marinos',
      courseType: 'privado',
      delivery: 'presencial',
      domainStyle: 'animals',
    },
    'Curso de Especialista en Cetaceos y Animales Marinos: escena de investigacion o cuidado costero con dos profesionales de fauna marina revisando documentacion tecnica, equipos y entorno marino controlado, imagen cientifica y respetuosa.',
  ],
  [
    {
      courseId: 21,
      slug: 'especializacion-clinica-avanzada-para-acv-priv',
      name: 'Especializacion Clinica Avanzada para ACV',
      courseType: 'privado',
      delivery: 'presencial',
      domainStyle: 'healthcare',
    },
    'Curso de Especializacion Clinica Avanzada para ACV: clinica veterinaria de alto nivel con equipo revisando caso avanzado mediante monitorizacion, radiografias o analiticas, tono tecnico especializado y colaborativo.',
  ],
  [
    {
      courseId: 22,
      slug: 'farmacia-y-dermocosmetica-priv',
      name: 'Farmacia y Dermocosmetica',
      courseType: 'privado',
      delivery: 'presencial',
      domainStyle: 'healthcare',
    },
    'Curso de Farmacia y Dermocosmetica: farmacia moderna con lineal dermocosmetico, profesional asesorando a cliente o coordinandose con colega mientras prepara producto, mezcla de salud, piel y atencion experta.',
  ],
  [
    {
      courseId: 23,
      slug: 'iluminacion-en-espectaculos-priv',
      name: 'Iluminacion en Espectaculos',
      courseType: 'privado',
      delivery: 'presencial',
      domainStyle: 'technical',
    },
    'Curso de Iluminacion en Espectaculos: backstage o cabina tecnica de teatro o concierto con tecnico de luces y apoyo de equipo ajustando consola y focos, haces de luz dramaticos y ambiente real de produccion escenica.',
  ],
  [
    {
      courseId: 24,
      slug: 'instructora-de-pilates-priv',
      name: 'Instructor o Instructora de Pilates',
      courseType: 'privado',
      delivery: 'presencial',
      domainStyle: 'wellness',
    },
    'Curso de Instructor o Instructora de Pilates: estudio de pilates refinado con instructor guiando ejercicio a una o dos personas con reformer o trabajo de suelo, ambiente luminoso, precision corporal y control postural.',
  ],
  [
    {
      courseId: 25,
      slug: 'instructora-de-yoga-priv',
      name: 'Instructor o Instructora de Yoga',
      courseType: 'privado',
      delivery: 'presencial',
      domainStyle: 'wellness',
    },
    'Curso de Instructor o Instructora de Yoga: estudio sobrio y elegante con instructor dirigiendo practica consciente a pequeno grupo, posturas solidas, luz natural, atmosfera serena y profesional, sin espiritualidad caricaturesca.',
  ],
  [
    {
      courseId: 26,
      slug: 'oratoria-publica-y-locucion-audiovisual-priv',
      name: 'Oratoria Publica y Locucion Audiovisual',
      courseType: 'privado',
      delivery: 'presencial',
      domainStyle: 'creative',
    },
    'Curso de Oratoria Publica y Locucion Audiovisual: set de grabacion o locutorio moderno con presentador ante microfono o camara y apoyo tecnico visible, auriculares, iluminacion controlada y foco en comunicacion profesional aplicada.',
  ],
  [
    {
      courseId: 9,
      slug: 'peluqueria-canina-y-felina-priv',
      name: 'Peluqueria Canina y Felina',
      courseType: 'privado',
      delivery: 'presencial',
      domainStyle: 'animals',
    },
    'Curso de Peluqueria Canina y Felina: salon grooming impecable con profesional trabajando sobre perro o gato y otra persona del equipo organizando herramientas especializadas, escena amable, tecnica y cuidada.',
  ],
  [
    {
      courseId: 186,
      slug: 'proteccion-bienestar-animal-y-marco-legal-priv',
      name: 'Proteccion, Bienestar Animal y Marco Legal',
      courseType: 'privado',
      delivery: 'presencial',
      domainStyle: 'legal',
    },
    'Curso de Proteccion, Bienestar Animal y Marco Legal: escena institucional o clinica con profesionales revisando documentacion de bienestar animal y presencia sutil de animal acompanado, tono juridico, tecnico y etico.',
  ],
  [
    {
      courseId: 185,
      slug: 'quiromasaje-priv',
      name: 'Quiromasaje',
      courseType: 'privado',
      delivery: 'presencial',
      domainStyle: 'wellness',
    },
    'Curso de Quiromasaje: cabina terapeutica elegante con profesional aplicando tecnica manual y contexto de formacion o supervision discreta, ambiente relajado pero clinico, atencion a anatomia y precision.',
  ],
  [
    {
      courseId: 28,
      slug: 'quiromasaje-11-meses-priv',
      name: 'Quiromasaje - 11 meses',
      courseType: 'privado',
      delivery: 'presencial',
      domainStyle: 'wellness',
    },
    'Curso de Quiromasaje de 11 meses: cabina de masaje profesional con terapeuta trabajando tecnica manual completa y contexto de aprendizaje avanzado o supervision profesional, sensacion de formacion extensa, solida y especializada.',
  ],
  [
    {
      courseId: 29,
      slug: 'tecnico-veterinario-en-felinos-priv',
      name: 'Tecnico Veterinario en Felinos',
      courseType: 'privado',
      delivery: 'presencial',
      domainStyle: 'healthcare',
    },
    'Curso de Tecnico Veterinario en Felinos: consulta felina especializada con tecnico y apoyo clinico examinando o asistiendo a un gato en entorno adaptado, calma, precision clinica y sensibilidad animal.',
  ],
]

export const CEP_PRIVATE_COURSE_IMAGE_PROMPTS = PRIVATE_PROMPT_SEEDS.map(([seed, focus]) =>
  createPrompt(seed, focus),
)

export const CEP_OCUPADOS_COURSE_IMAGE_PROMPTS: CourseImagePrompt[] = []
export const CEP_DESEMPLEADOS_COURSE_IMAGE_PROMPTS: CourseImagePrompt[] = []
export const CEP_TELEFORMACION_COURSE_IMAGE_PROMPTS: CourseImagePrompt[] = []

export const CEP_COURSE_IMAGE_PROMPTS_BY_TYPE = {
  privado: CEP_PRIVATE_COURSE_IMAGE_PROMPTS,
  ocupados: CEP_OCUPADOS_COURSE_IMAGE_PROMPTS,
  desempleados: CEP_DESEMPLEADOS_COURSE_IMAGE_PROMPTS,
  teleformacion: CEP_TELEFORMACION_COURSE_IMAGE_PROMPTS,
} as const

export function getCourseImagePromptsByType(courseType: CourseAccent | 'teleformacion') {
  return CEP_COURSE_IMAGE_PROMPTS_BY_TYPE[courseType]
}

export function isHealthcareDomain(domainStyle: CourseDomainStyle): boolean {
  return domainStyle === 'healthcare'
}
