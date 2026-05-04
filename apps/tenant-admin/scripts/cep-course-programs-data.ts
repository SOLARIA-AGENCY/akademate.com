export type CourseProgramEntry = {
  pdfFilename: string
  textFilename: string
  courseSlug: string
  courseName: string
  materialTitle: string
  modality: 'presencial' | 'online' | 'hibrido'
  courseType?: 'privado' | 'ocupados' | 'desempleados' | 'teleformacion' | 'ciclo_medio' | 'ciclo_superior'
  areaCode?: 'SCLN' | 'VETA' | 'SBD' | 'TDD' | 'EAG' | 'SVP'
  createIfMissing?: boolean
  durationHours: number | null
  shortDescription: string
  longDescriptionLines: string[]
  notes?: string[]
}

export const CEP_DEPRECATED_COURSE_SLUGS = ['proteccion-bienestar-animal-y-marco-legal-actual-priv']

export const CEP_COURSE_PROGRAM_ENTRIES: CourseProgramEntry[] = [
  {
    pdfFilename: 'ADIESTRAMIENTO CANINO.pdf',
    textFilename: 'ADIESTRAMIENTO CANINO.txt',
    courseSlug: 'adiestramiento-canino-i-priv',
    courseName: 'Adiestramiento Canino I',
    materialTitle: 'Programa oficial - Adiestramiento Canino Nivel 1',
    modality: 'presencial',
    durationHours: 72,
    shortDescription:
      'Formacion en tecnicas de adiestramiento de base aplicadas a perros, modificacion de conductas no deseadas, cuidados basicos, primeros auxilios y orientacion laboral.',
    longDescriptionLines: [
      'El curso de Adiestramiento Canino ofrece conocimientos sobre tecnicas de adiestramiento de base aplicadas a perros.',
      'Incluye modificacion de conductas no deseadas, cuidados basicos, primeros auxilios y modulo de orientacion laboral.',
      'Prepara para trabajar como adiestrador canino o aplicar estos conocimientos con animales propios.',
      'Salidas detectadas: educacion basica y correccion de conductas, deportes caninos, perros de asistencia y terapia, perros de trabajo, seguridad, rescate, deteccion, servicios a domicilio y online.',
      'Contenido detectado: modulo de tecnicas de adiestramiento de base, modificacion de conductas no deseadas y cuidados higienicos aplicados a perros.',
    ],
    notes: ['Decision validada: el mismo PDF aplica a Adiestramiento Canino I y II.'],
  },
  {
    pdfFilename: 'ADIESTRAMIENTO CANINO.pdf',
    textFilename: 'ADIESTRAMIENTO CANINO.txt',
    courseSlug: 'adiestramiento-canino-ii-priv',
    courseName: 'Adiestramiento Canino II',
    materialTitle: 'Programa oficial - Adiestramiento Canino Nivel 1',
    modality: 'presencial',
    durationHours: 72,
    shortDescription:
      'Formacion en tecnicas de adiestramiento de base aplicadas a perros, modificacion de conductas no deseadas, cuidados basicos, primeros auxilios y orientacion laboral.',
    longDescriptionLines: [
      'El curso de Adiestramiento Canino ofrece conocimientos sobre tecnicas de adiestramiento de base aplicadas a perros.',
      'Incluye modificacion de conductas no deseadas, cuidados basicos, primeros auxilios y modulo de orientacion laboral.',
      'Prepara para trabajar como adiestrador canino o aplicar estos conocimientos con animales propios.',
      'Salidas detectadas: educacion basica y correccion de conductas, deportes caninos, perros de asistencia y terapia, perros de trabajo, seguridad, rescate, deteccion, servicios a domicilio y online.',
      'Contenido detectado: modulo de tecnicas de adiestramiento de base, modificacion de conductas no deseadas y cuidados higienicos aplicados a perros.',
    ],
    notes: ['Decision validada: el mismo PDF aplica a Adiestramiento Canino I y II.'],
  },
  {
    pdfFilename: 'ACV AUXILIAR CLINICO VETERINARIO.pdf',
    textFilename: 'ACV AUXILIAR CLINICO VETERINARIO.txt',
    courseSlug: 'auxiliar-clinico-veterinario-priv',
    courseName: 'Auxiliar Clinico Veterinario',
    materialTitle: 'Programa oficial - Auxiliar Clinico Veterinario',
    modality: 'presencial',
    durationHours: 108,
    shortDescription:
      'Formacion para adquirir conocimientos del funcionamiento de una clinica veterinaria, funciones del auxiliar, atencion a perros y gatos, nociones de animales exoticos y orientacion laboral.',
    longDescriptionLines: [
      'El curso de Auxiliar Clinico Veterinario ofrece conocimientos imprescindibles sobre el funcionamiento de una clinica veterinaria y las funciones del auxiliar.',
      'Incluye contenidos sobre perros y gatos, introduccion a animales exoticos y un modulo de orientacion laboral.',
      'El objetivo es adquirir confianza, habilidades y conocimientos para trabajar en clinicas, hospitales veterinarios, tiendas de animales, centros de acogida u ONG.',
      'Enfoque CEP: cuidado clinico, bienestar animal, manejo del estres en consulta y aprendizaje practico.',
    ],
    notes: ['El PDF tambien menciona 350 h; se toma 108 h como duracion principal detectada.'],
  },
  {
    pdfFilename: 'AGENTE FUNERARIO.pdf',
    textFilename: 'AGENTE FUNERARIO.txt',
    courseSlug: 'agente-funerario-tanatopraxia-y-tanatoestetica-priv',
    courseName: 'Agente Funerario (Tanatopraxia y Tanatoestetica)',
    materialTitle: 'Programa oficial - Agente Funerario',
    modality: 'presencial',
    durationHours: 160,
    shortDescription:
      'Formacion en tanatopraxia, tanatoestetica, anatomia y fisiologia humana, alteraciones postmortem, embalsamamiento, prevencion de riesgos, bioseguridad y gestion funeraria.',
    longDescriptionLines: [
      'El curso prepara para conocer el origen y la historia de la tanatopraxia y adquirir conocimientos basicos sobre anatomia y fisiologia humana.',
      'Trabaja la identificacion de alteraciones postmortem, su tratamiento y el proceso de embalsamamiento.',
      'Incluye prevencion de riesgos laborales, bioseguridad y gestion funeraria.',
      'Enfoque CEP: servicio funerario integral, trato solemne, acompanamiento a familias, gestion y protocolo con cumplimiento sanitario, legal y mortuorio.',
    ],
    notes: ['El PDF tambien menciona 120 h; se toma 160 h como duracion principal detectada.'],
  },
  {
    pdfFilename: 'ATV AYUDANTE TECNICO VETERINARIO.pdf',
    textFilename: 'ATV AYUDANTE TECNICO VETERINARIO.txt',
    courseSlug: 'ayudante-tecnico-veterinario-atv-priv',
    courseName: 'Ayudante Tecnico Veterinario (ATV)',
    materialTitle: 'Programa oficial - Ayudante Tecnico Veterinario ATV',
    modality: 'presencial',
    durationHours: 120,
    shortDescription:
      'Formacion en tecnicas y conocimientos del ayudante tecnico veterinario: legislacion, anatomia y fisiologia animal, farmacologia, toxicologia, imagenologia, odontologia veterinaria, quirofano, hospitalizacion y urgencias.',
    longDescriptionLines: [
      'El curso de ATV ofrece conocimientos sobre las tecnicas que debe manejar un ayudante tecnico veterinario.',
      'Incluye legislacion actual, anatomia y fisiologia animal, farmacologia y toxicologia, imagenologia, introduccion a odontologia veterinaria, atencion en quirofano, hospitalizacion y urgencias.',
      'El objetivo es adquirir confianza, habilidades y conocimientos para trabajar como ATV en clinicas, centros veterinarios, tiendas de animales, ONG o nucleos zoologicos.',
      'El PDF indica clases presenciales una vez por semana y modalidad online bajo consulta.',
    ],
  },
  {
    pdfFilename: 'AUX FARMACIA, PARAFARMACIA Y DERMOCOSMÉTICA.pdf',
    textFilename: 'AUX FARMACIA, PARAFARMACIA Y DERMOCOSMÉTICA.txt',
    courseSlug: 'farmacia-y-dermocosmetica-priv',
    courseName: 'Farmacia y Dermocosmetica',
    materialTitle: 'Programa oficial - Auxiliar de Farmacia, Parafarmacia y Dermocosmetica',
    modality: 'presencial',
    durationHours: 120,
    shortDescription:
      'Formacion sobre funcionamiento de oficina de farmacia, funciones del auxiliar, parafarmacia, dermocosmetica, atencion sanitaria profesional y orientacion laboral.',
    longDescriptionLines: [
      'El curso ofrece conocimientos imprescindibles del funcionamiento de una oficina de farmacia y las funciones del auxiliar de farmacia.',
      'Trabaja farmacia, parafarmacia, dermocosmetica, almacen de medicamentos, atencion al paciente y asesoramiento personalizado.',
      'Prepara para trabajar como auxiliar en farmacias, parafarmacias, perfumerias, almacen de medicamentos o empresas del sector.',
      'El PDF indica clases presenciales una vez por semana y modalidad online bajo consulta.',
    ],
    notes: ['El PDF tambien menciona 350 h; se toma 120 h como duracion principal del curso.'],
  },
  {
    pdfFilename: 'AUXILIAR CLINICAS ESTETICAS.pdf',
    textFilename: 'AUXILIAR CLINICAS ESTETICAS.txt',
    courseSlug: 'auxiliar-de-clinicas-esteticas-priv',
    courseName: 'Auxiliar de Clinicas Esteticas',
    materialTitle: 'Programa oficial - Auxiliar en Clinicas Esteticas',
    modality: 'presencial',
    durationHours: 120,
    shortDescription:
      'Formacion practica orientada a profesionales de cosmetologia, estetica, peluqueria, unas, asesoria de imagen, dermofarmacia, farmacia y centros esteticos.',
    longDescriptionLines: [
      'El programa presenta una formacion vinculada a servicios y tratamientos de estetica, cosmeticos y especialidades complementarias.',
      'Esta dirigido a profesionales de cosmetologia, estetica, peluqueria, unas, asesoria de imagen personal, dermofarmacia, farmacia, sanitarios y responsables de centros.',
      'Incluye aprendizaje practico, orientacion laboral y acompanamiento profesional.',
    ],
    notes: ['El PDF contiene textos de enfoque diferenciador que parecen arrastrados de veterinaria; revisar antes de publicar descripcion larga definitiva.'],
  },
  {
    pdfFilename: 'AUXILIAR DE ENFERMERÍA.pdf',
    textFilename: 'AUXILIAR DE ENFERMERÍA.txt',
    courseSlug: 'auxiliar-de-enfermeria-priv',
    courseName: 'Auxiliar de Enfermeria',
    materialTitle: 'Programa oficial - Auxiliar de Enfermeria',
    modality: 'presencial',
    durationHours: 120,
    shortDescription:
      'Formacion en tecnicas auxiliares de enfermeria, anatomia, cuidados basicos, documentacion, higiene del medio hospitalario y orientacion laboral.',
    longDescriptionLines: [
      'El curso de Tecnicas Auxiliares en Enfermeria ofrece conocimientos sobre anatomia, tecnicas basicas de enfermeria, documentacion e higiene del medio hospitalario.',
      'Prepara para trabajar como auxiliar en centros medicos, hospitales concertados, consultas privadas y otros entornos sanitarios.',
      'Enfoque CEP: vision integral del cuidado, trato humano, apoyo emocional, aplicacion de cuidados basicos, higiene, movilizacion, constantes y prevencion de riesgos.',
    ],
    notes: ['El PDF tambien menciona 300 h; se toma 120 h como duracion principal del curso.'],
  },
  {
    pdfFilename: 'AUXILIAR DE ODONTOLOGIA ONLINE.pdf',
    textFilename: 'AUXILIAR DE ODONTOLOGIA ONLINE.txt',
    courseSlug: 'auxiliar-de-odontologia-e-higiene-online-priv',
    courseName: 'Auxiliar de Odontologia e Higiene online',
    materialTitle: 'Programa oficial - Auxiliar de Odontologia Online',
    modality: 'online',
    durationHours: 300,
    shortDescription:
      'Curso online sobre funcionamiento de clinica odontologica, funciones del auxiliar de odontologia, higiene bucodental, protocolos clinicos y orientacion laboral.',
    longDescriptionLines: [
      'El curso online ofrece conocimientos imprescindibles del funcionamiento de una clinica odontologica y las funciones del auxiliar de odontologia.',
      'Prepara para trabajar como auxiliar en clinicas dentales, recepcionista en clinicas odontologicas, apoyo en cirugia oral, ortodoncia o implantologia y comercial de productos odontologicos.',
      'Contenido detectado: clinica dental, equipo odontologico, anatomia bucal y dientes, control de infecciones, desinfeccion y esterilizacion, farmacologia, endodoncia, protesis, patologias, periodoncia y cirugia oral.',
    ],
  },
  {
    pdfFilename: 'AUXILIAR ODONTOLOGÍA INTENSIVO.pdf',
    textFilename: 'AUXILIAR ODONTOLOGÍA INTENSIVO.txt',
    courseSlug: 'auxiliar-de-odontologia-e-higiene-priv',
    courseName: 'Auxiliar de Odontologia e Higiene',
    materialTitle: 'Programa oficial - Auxiliar de Odontologia Intensivo',
    modality: 'presencial',
    durationHours: 120,
    shortDescription:
      'Curso presencial intensivo sobre funcionamiento de clinica odontologica, funciones del auxiliar de odontologia, higiene bucodental y practicas en empresa.',
    longDescriptionLines: [
      'El curso presencial ofrece conocimientos imprescindibles del funcionamiento de una clinica odontologica y las funciones del auxiliar de odontologia.',
      'Organizacion detectada: clases presenciales un dia en semana, clases teorico-practicas, grupos reducidos, 300 h de practicas en empresas y duracion de 6 meses o 24 sesiones.',
      'Contenido detectado: clinica dental, equipo odontologico, anatomia de cavidad bucal y dientes, control de infecciones, desinfeccion, esterilizacion, farmacologia, endodoncia, protesis, patologias, periodoncia y cirugia oral.',
    ],
  },
  {
    pdfFilename: 'DIETETICA Y NUTRICION.pdf',
    textFilename: 'DIETETICA Y NUTRICION.txt',
    courseSlug: 'dietetica-y-nutricion-priv',
    courseName: 'Dietetica y Nutricion',
    materialTitle: 'Programa oficial - Dietetica y Nutricion',
    modality: 'presencial',
    durationHours: 150,
    shortDescription:
      'Formacion en anatomia, fisiologia, dietetica y nutricion, alimentacion en distintas etapas de la vida, dietas y orientacion laboral.',
    longDescriptionLines: [
      'El curso de Dietetica y Nutricion ofrece conocimientos de anatomia, dietetica y nutricion, alimentacion en diferentes etapas de la vida y dietas.',
      'Incluye modulo de orientacion laboral dinamico y actualizado.',
      'Salidas profesionales detectadas: caterings, herbolarios, gimnasios y apertura de herbolario propio.',
      'Contenido detectado: modulo de anatomia-fisiologia y modulo de dietetica y nutricion.',
    ],
  },
  {
    pdfFilename: 'DIETETICA Y NUTRICION ONLINE.pdf',
    textFilename: 'DIETETICA Y NUTRICION ONLINE.txt',
    courseSlug: 'dietetica-y-nutricion-online-priv',
    courseName: 'Dietetica y Nutricion Online',
    materialTitle: 'Programa oficial - Dietetica y Nutricion Online',
    modality: 'online',
    courseType: 'teleformacion',
    areaCode: 'SBD',
    createIfMissing: true,
    durationHours: 400,
    shortDescription:
      'Curso online de dietetica y nutricion con anatomia, estudio de alimentos, necesidades nutricionales, dietas, alimentacion en distintas etapas de la vida y practicas en empresa.',
    longDescriptionLines: [
      'El curso online de Dietetica y Nutricion ofrece conocimientos de anatomia, dietetica y nutricion, alimentacion en las diferentes etapas de la vida y dietas.',
      'Organizacion detectada: aprendizaje online, campus virtual, aprendizaje colaborativo y practicas en empresa.',
      'Contenido detectado: necesidades nutricionales y estudio de nutrientes, estudio de alimentos, aspectos dieteticos y nutricionales en distintas etapas de la vida.',
      'Caracteristicas detectadas: 400 horas de formacion y modalidad online.',
    ],
    notes: ['Crear curso si no existe: variante online diferenciada del curso presencial.'],
  },
  {
    pdfFilename: 'ENTRENAMIENTO PERSONAL.pdf',
    textFilename: 'ENTRENAMIENTO PERSONAL.txt',
    courseSlug: 'entrenamiento-personal-priv',
    courseName: 'Entrenamiento Personal',
    materialTitle: 'Programa oficial - Entrenamiento Personal',
    modality: 'presencial',
    durationHours: 120,
    shortDescription:
      'Formacion en anatomia, dietetica y nutricion aplicada al entrenamiento personal, programas de ejercicio seguro y efectivo adaptados a salud, capacidad, necesidades y metas del cliente.',
    longDescriptionLines: [
      'El curso permite obtener conocimientos del entrenador personal: anatomia, dietetica y nutricion aplicada al entrenamiento personal.',
      'Trabaja el diseno de programas de ejercicio seguro y efectivo adaptados al estado de salud, capacidad, necesidades y metas del cliente.',
      'Prepara para aplicar estos conocimientos en balnearios, spas, gimnasios, box propio o mejora de calidad de vida.',
      'Enfoque CEP: tecnica precisa, conciencia corporal, correccion postural, bienestar mental y orientacion laboral.',
    ],
  },
  {
    pdfFilename: 'ESPECIALISTA EN URGENCIAS, LABORATORIO Y REHABILITACIÓN VETERINARIA.pdf.pdf',
    textFilename: 'ESPECIALISTA EN URGENCIAS, LABORATORIO Y REHABILITACIÓN VETERINARIA.pdf.txt',
    courseSlug: 'especializacion-clinica-avanzada-para-acv-priv',
    courseName: 'Especializacion Clinica Avanzada para ACV',
    materialTitle: 'Programa oficial - Urgencias, Laboratorio y Rehabilitacion Veterinaria para ACV',
    modality: 'presencial',
    durationHours: 108,
    shortDescription:
      'Especializacion para ACV en urgencias veterinarias, triaje, primeros auxilios, monitorizacion, laboratorio clinico, hospitalizacion, fisioterapia y rehabilitacion veterinaria.',
    longDescriptionLines: [
      'El curso permite actuar con seguridad y criterio en urgencias veterinarias, realizando triaje, primeros auxilios, monitorizacion y asistencia en situaciones criticas.',
      'Incluye manejo del material de urgencias, fluidoterapia, sondas, drenajes y cuidados del paciente hospitalizado.',
      'Trabaja competencias practicas en laboratorio clinico veterinario: recogida, procesado e interpretacion basica de muestras.',
      'Introduce las bases de fisioterapia y rehabilitacion veterinaria para apoyar la recuperacion funcional de los pacientes.',
      'Salidas detectadas: clinicas veterinarias con urgencias, hospitales veterinarios, centros de rehabilitacion animal, clinicas con laboratorio interno, hospitalizacion y UCI veterinaria.',
      'Contenido detectado: urgencias, triaje, material de urgencias, fluidoterapia, sondas, urgencias cardiovasculares, hematologicas, metabolicas, gastrointestinales, urologicas, reproductivas, neurologicas, traumatologicas y toxicologicas.',
    ],
    notes: ['Decision validada: aunque el titulo del PDF no coincide exacto, aplica a Especializacion Clinica Avanzada para ACV.'],
  },
  {
    pdfFilename: 'INSTRUCTOR PILATES.pdf',
    textFilename: 'INSTRUCTOR PILATES.txt',
    courseSlug: 'instructora-de-pilates-priv',
    courseName: 'Instructor o Instructora de Pilates',
    materialTitle: 'Programa oficial - Instructor/a de Pilates',
    modality: 'presencial',
    durationHours: null,
    shortDescription:
      'Formacion en metodo Pilates, anatomia aplicada al movimiento, correccion postural, respiracion, planificacion de clases y adaptaciones por niveles.',
    longDescriptionLines: [
      'El curso forma en los principios y fundamentos del metodo Pilates con base solida en anatomia aplicada al movimiento.',
      'Incluye correccion postural, control de la respiracion, planificacion de clases y adaptaciones por niveles.',
      'Salidas profesionales detectadas: estudios de Pilates, spas, balnearios, hoteles wellness, gimnasios, centros deportivos, clinicas de fisioterapia, rehabilitacion, centros de estetica, bienestar integral, eventos, residencias y autoempleo.',
      'Contenido detectado: historia y filosofia del metodo, Joseph Hubertus Pilates, alineacion corporal y posicion neutra.',
    ],
    notes: ['No se actualiza duration_hours: el PDF solo detecta 3 h como asistencia semanal, no duracion total.'],
  },
  {
    pdfFilename: 'INSTRUCTOR YOGA.pdf',
    textFilename: 'INSTRUCTOR YOGA.txt',
    courseSlug: 'instructora-de-yoga-priv',
    courseName: 'Instructor o Instructora de Yoga',
    materialTitle: 'Programa oficial - Instructor/a de Yoga',
    modality: 'presencial',
    durationHours: 200,
    shortDescription:
      'Formacion integral de instructor/a de Yoga basada en Hatha Yoga, con trabajo de cuerpo, mente y emociones para crecimiento personal o ejercicio profesional.',
    longDescriptionLines: [
      'Curso basado en Hatha Yoga, enriquecido con experiencia docente en yoga y terapia transpersonal.',
      'Ofrece ensenanza integral de cuerpo, mente y emociones para el desempeno del instructor o instructora.',
      'Organizacion detectada: clases presenciales teorico-practicas, grupos reducidos y duracion de 200 h.',
      'Contenido detectado: Yoga, Tantra, universo y ser humano, chakras, energia, mente, salud, higiene, habitos saludables, terapias saludables, dieta vegetariana o vegana y medicina natural.',
    ],
  },
  {
    pdfFilename: 'CFGM FARMACIA.pdf',
    textFilename: 'CFGM FARMACIA.txt',
    courseSlug: 'cfgm-farmacia-y-parafarmacia',
    courseName: 'CFGM Farmacia y Parafarmacia',
    materialTitle: 'Programa oficial - CFGM Farmacia y Parafarmacia',
    modality: 'hibrido',
    courseType: 'ciclo_medio',
    areaCode: 'SCLN',
    createIfMissing: true,
    durationHours: 500,
    shortDescription:
      'Ciclo Formativo de Grado Medio de Farmacia y Parafarmacia con salidas en oficinas de farmacia, parafarmacias, farmacia hospitalaria, almacenes, distribucion y laboratorios.',
    longDescriptionLines: [
      'Ciclo Formativo de Grado Medio de Farmacia y Parafarmacia autorizado por MEC 38017275.',
      'Salidas profesionales detectadas: tecnico en oficinas de farmacia, parafarmacias, establecimientos sanitarios, farmacia hospitalaria, almacenes de distribucion farmaceutica, empresas de distribucion farmaceutica y sanitaria, laboratorios farmaceuticos o cosmeticos.',
      'Otros ambitos: parafarmacias y tiendas de salud, clinicas y centros sanitarios, empresas de dermocosmetica u ortopedia, gestion y distribucion de medicamentos en almacenes y hospitales.',
      'Requisitos detectados: ESO o Graduado Escolar, prueba de acceso a Grado Medio, Tecnico Auxiliar de FP o titulacion equivalente o superior.',
      'Modalidad detectada: semipresencial. Duracion detectada: 500 h.',
    ],
    notes: ['Crear curso si no existe, aunque tambien pueda existir como ciclo.'],
  },
  {
    pdfFilename: 'CFGS HIGIENE BUCODENTAL.pdf',
    textFilename: 'CFGS HIGIENE BUCODENTAL.txt',
    courseSlug: 'cfgs-higiene-bucodental',
    courseName: 'CFGS Higiene Bucodental',
    materialTitle: 'Programa oficial - CFGS Higiene Bucodental',
    modality: 'hibrido',
    courseType: 'ciclo_superior',
    areaCode: 'SCLN',
    createIfMissing: true,
    durationHours: 500,
    shortDescription:
      'Ciclo Formativo de Grado Superior de Higiene Bucodental con salidas como higienista bucodental, tecnico especialista, educador en salud bucodental y especialista en prevencion dental.',
    longDescriptionLines: [
      'Ciclo Formativo de Grado Superior de Higiene Bucodental autorizado por MEC 38017275.',
      'Salidas profesionales detectadas: higienista bucodental en sector privado y publico, tecnico especialista en higiene bucodental, educador en salud bucodental y especialista en prevencion y profilaxis dental.',
      'Otros ambitos: clinicas odontologicas privadas, centros sanitarios, programas de salud publica y prevencion bucodental, empresas del sector dental, clinicas de ortodoncia, periodoncia o implantologia.',
      'Requisitos detectados: Bachiller o BUP, prueba de acceso a Grado Superior, Tecnico Medio de FP o titulacion equivalente o superior.',
      'Modalidad detectada: semipresencial. Duracion detectada: 500 h.',
    ],
    notes: ['Crear curso si no existe, aunque tambien pueda existir como ciclo.'],
  },
  {
    pdfFilename: 'QUIROMASAJE HOLISTO.pdf',
    textFilename: 'QUIROMASAJE HOLISTO.txt',
    courseSlug: 'quiromasaje-priv',
    courseName: 'Quiromasaje',
    materialTitle: 'Programa oficial - Quiromasaje Holistico',
    modality: 'presencial',
    durationHours: 100,
    shortDescription:
      'Formacion avanzada de quiromasaje y terapias manuales con enfoque holistico, tecnica manual, sensibilidad terapeutica, cadenas musculares, protocolos personalizados y orientacion laboral.',
    longDescriptionLines: [
      'El curso forma como quiromasajista profesional con alta preparacion tecnica y sensibilidad terapeutica.',
      'Trabaja un masaje que no solo trata el cuerpo, sino que acompana al cliente en el plano emocional, trabajando cadenas musculares y protocolos personalizados.',
      'Incluye orientacion laboral para dar los primeros pasos profesionales con seguridad y confianza.',
      'Contenido detectado: bases del quiromasaje, quiromasaje holistico, terapias complementarias, trabajo por cadenas y personalizacion, emprendimiento y desarrollo personal.',
      'Enfoque CEP: tecnica precisa, presencia consciente, integracion emocional, masaje adaptado, escucha manual, digitopuntura, reflexoterapia, masaje deportivo y circulatorio.',
    ],
    notes: ['Decision validada: el mismo PDF aplica a Quiromasaje y Quiromasaje - 11 meses.'],
  },
  {
    pdfFilename: 'QUIROMASAJE HOLISTO.pdf',
    textFilename: 'QUIROMASAJE HOLISTO.txt',
    courseSlug: 'quiromasaje-11-meses-priv',
    courseName: 'Quiromasaje - 11 meses',
    materialTitle: 'Programa oficial - Quiromasaje Holistico',
    modality: 'presencial',
    durationHours: 176,
    shortDescription:
      'Formacion avanzada de quiromasaje y terapias manuales con enfoque holistico, tecnica manual, sensibilidad terapeutica, cadenas musculares, protocolos personalizados y orientacion laboral.',
    longDescriptionLines: [
      'El curso forma como quiromasajista profesional con alta preparacion tecnica y sensibilidad terapeutica.',
      'Trabaja un masaje que no solo trata el cuerpo, sino que acompana al cliente en el plano emocional, trabajando cadenas musculares y protocolos personalizados.',
      'Incluye orientacion laboral para dar los primeros pasos profesionales con seguridad y confianza.',
      'Contenido detectado: bases del quiromasaje, quiromasaje holistico, terapias complementarias, trabajo por cadenas y personalizacion, emprendimiento y desarrollo personal.',
      'Enfoque CEP: tecnica precisa, presencia consciente, integracion emocional, masaje adaptado, escucha manual, digitopuntura, reflexoterapia, masaje deportivo y circulatorio.',
    ],
    notes: ['Decision validada: el mismo PDF aplica a Quiromasaje y Quiromasaje - 11 meses.'],
  },
  {
    pdfFilename: 'PELUQUERIA CANINA Y FELINA.pdf',
    textFilename: 'PELUQUERIA CANINA Y FELINA.txt',
    courseSlug: 'peluqueria-canina-y-felina-priv',
    courseName: 'Peluqueria Canina y Felina',
    materialTitle: 'Programa oficial - Peluqueria Canina y Felina',
    modality: 'presencial',
    durationHours: 72,
    shortDescription:
      'Formacion en tecnicas de corte canino, instrumental, anatomia, higiene, dermatologia y orientacion laboral para trabajar en peluqueria canina y felina.',
    longDescriptionLines: [
      'El curso ofrece conocimientos sobre tecnicas de corte canino, instrumental, anatomia, higiene y dermatologia.',
      'Incluye modulo de orientacion laboral dinamico y actualizado.',
      'Prepara para trabajar como peluquero/a canino/a en centro propio, guarderias caninas, albergues, tiendas de mascotas, centros veterinarios o servicio a domicilio.',
    ],
  },
  {
    pdfFilename: 'NUTRICOSMÉTICA.pdf',
    textFilename: 'NUTRICOSMÉTICA.txt',
    courseSlug: 'nutricosmetica-priv',
    courseName: 'Nutricosmetica',
    materialTitle: 'Programa oficial - Nutricosmetica y Complementos Alimenticios',
    modality: 'presencial',
    courseType: 'privado',
    areaCode: 'SBD',
    createIfMissing: true,
    durationHours: 48,
    shortDescription:
      'Especializacion tecnica en nutricosmetica y complementos alimenticios, integrando nutricion, estetica, bienestar y deporte con recomendaciones eticas basadas en evidencia.',
    longDescriptionLines: [
      'Especializacion tecnica en nutricosmetica que fusiona ciencia y practica profesional.',
      'Permite realizar recomendaciones eticas basadas en evidencia, integrando nutricion, estetica y deporte para elevar la calidad de atencion y confianza de clientes.',
      'Dirigido a profesionales de salud, estetica, bienestar y deporte que quieran ampliar conocimientos en nutricosmetica y complementos alimenticios.',
      'Contenido detectado: fundamentos de nutricosmetica, complementos alimenticios, vitaminas y minerales, proteinas, aminoacidos, colageno, lipidos, acidos grasos esenciales, microbiota, antioxidantes, salud de piel, cabello y unas, nutricosmetica en la mujer, sueño, estres, adaptogenos e integracion profesional.',
      'Caracteristicas detectadas: 48 horas o 12 sesiones de 4 h, clases presenciales una vez por semana, grupos reducidos y contenido teorico-practico.',
    ],
    notes: ['Crear curso si no existe.'],
  },
  {
    pdfFilename: 'Nutrición Deportiva Online 100h.pdf',
    textFilename: 'Nutrición Deportiva Online 100h.txt',
    courseSlug: 'nutricion-deportiva-online-100h',
    courseName: 'Nutricion Deportiva Online',
    materialTitle: 'Programa oficial - Nutricion Deportiva Online 100h',
    modality: 'online',
    courseType: 'teleformacion',
    areaCode: 'SBD',
    createIfMissing: true,
    durationHours: 100,
    shortDescription:
      'Curso online de nutricion deportiva orientado a rendimiento, nutricion aplicada a actividad fisica, estrategia nutricional, competiciones y acompanamiento psicologico.',
    longDescriptionLines: [
      'El curso permite conocer la mejora del rendimiento deportivo a traves de la nutricion y la dietetica.',
      'Incluye conocimientos generales sobre nutricion aplicada a tipos de actividad fisica, estrategia nutricional en entrenamientos y competiciones desde nivel amateur hasta elite.',
      'Aborda la parte psicologica del acompanamiento y el papel de la nutricion en diferentes pruebas deportivas.',
      'Salidas detectadas: caterings, herbolarios y gimnasios.',
      'Caracteristicas detectadas: 100 horas, 100% online y practicas en empresas.',
    ],
    notes: ['Crear curso si no existe.'],
  },
  {
    pdfFilename: 'Nutrición en la Práctica Deportiva Online 200h.pdf',
    textFilename: 'Nutrición en la Práctica Deportiva Online 200h.txt',
    courseSlug: 'nutricion-en-la-practica-deportiva-online-200h',
    courseName: 'Nutricion en la Practica Deportiva Online',
    materialTitle: 'Programa oficial - Nutricion en la Practica Deportiva Online 200h',
    modality: 'online',
    courseType: 'teleformacion',
    areaCode: 'SBD',
    createIfMissing: true,
    durationHours: 200,
    shortDescription:
      'Curso online de dietetica y nutricion aplicada a la practica deportiva, necesidades nutricionales especificas y elaboracion de planes alimentarios para actividad fisica.',
    longDescriptionLines: [
      'El curso ofrece conceptos basicos de dietetica y nutricion aplicados a personas que realizan actividad deportiva.',
      'Permite conocer necesidades nutricionales especificas de personas que practican deporte.',
      'Proporciona conocimientos para elaborar un plan alimentario adecuado para actividad deportiva profesional o de mantenimiento.',
      'Salidas detectadas: consultas dieteticas, franquicias de nutricion, equipos de elaboracion de dietas en centros de estetica, gimnasios y clubes deportivos.',
      'Duracion detectada: 200 h.',
    ],
    notes: ['Crear curso si no existe.'],
  },
  {
    pdfFilename: 'SEMINARIO UNYCOP.pdf.pdf',
    textFilename: 'SEMINARIO UNYCOP.pdf.txt',
    courseSlug: 'seminario-practico-gestion-unycop',
    courseName: 'Seminario Practico Gestion Unycop',
    materialTitle: 'Programa oficial - Seminario Practico Gestion Unycop',
    modality: 'presencial',
    courseType: 'privado',
    areaCode: 'SCLN',
    createIfMissing: true,
    durationHours: 12,
    shortDescription:
      'Seminario practico de gestion Unycop para farmacia, con trabajo sobre almacen, mostrador, receta electronica/manual, pedidos, incidencias, devoluciones, clientes y facturacion.',
    longDescriptionLines: [
      'Seminario practico sobre programa de gestion en farmacia con vision global y practica de Unycop.',
      'Trabaja gestiones de almacen y mostrador a nivel practico.',
      'Dirigido a estudiantes o titulados de Tecnico Medio en Farmacia y Parafarmacia que quieran complementar su formacion con gestion practica.',
      'Contenido detectado: almacen, recepcion de pedido diario, encargos, financiados, no financiados, recepcion de pedido directo o transfer, entrada directa, incidencias, devoluciones, reclamaciones, mostrador, receta electronica, receta manual, receta de organismos, busqueda de datos de paciente, sustitucion, ventas, ficha de cliente y factura.',
      'Caracteristicas detectadas: clases presenciales, practicas, grupos reducidos, 12 horas en 3 sesiones de 4 horas.',
    ],
    notes: ['Crear curso si no existe.'],
  },
  {
    pdfFilename: 'PROTECCION, BIENESTAR ANIMAL Y MARCO LEGAL.pdf',
    textFilename: 'PROTECCION, BIENESTAR ANIMAL Y MARCO LEGAL.txt',
    courseSlug: 'proteccion-bienestar-animal-y-marco-legal-priv',
    courseName: 'Proteccion, Bienestar Animal y Marco Legal',
    materialTitle: 'Programa oficial - Proteccion, Bienestar Animal y Marco Legal',
    modality: 'online',
    durationHours: 200,
    shortDescription:
      'Formacion online sobre cuidados esenciales de especies animales domesticas y exoticas, bienestar animal y marco normativo actualizado en España.',
    longDescriptionLines: [
      'El curso prepara para conocer cuidados esenciales basicos de determinadas especies animales, tanto exoticas como domesticas.',
      'Es util para perfiles que trabajan como cuidadores o conservadores en zoologicos, centros caninos y centros de recuperacion de especies silvestres.',
      'Incluye una vision actualizada del marco normativo referente al bienestar animal en España.',
      'Salidas detectadas: protectoras, asociaciones de bienestar animal, apoyo en programas de conservacion y entornos vinculados al cuidado animal.',
      'El PDF indica modalidad online y duracion de 200 h.',
    ],
    notes: ['Decision validada: se aplica al curso base; la variante con slug actual queda obsoleta.'],
  },
]

export function courseProgramRichText(lines: string[]): unknown {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      type: 'paragraph',
      children: [{ text: line }],
    }))
}
