import fs from 'node:fs/promises';
import path from 'node:path';

const workspace = '/Users/carlosjperez/Documents/GitHub/akademate.com/outputs/019e918f-530f-7a13-8a19-7db8d3485222/presentations/cep-formacion-platform';
const slidesDir = path.join(workspace, 'slides');

const planFiles = {
  'profile-plan.txt': `task mode: create
primary deck-profile: product-platform
secondary gates: consumer-retail asset quality, GTM automation story
required proof objects: public web capture, CEP dashboard capture, course image strip, workflow diagram from convocatoria to lead to matricula, deployment/access map focused on CEP
source/asset requirements: local CEP screenshots and course images only; no invented logo marks
brand authenticity constraints: use visible CEP screenshots as identity proof; do not draw a fake CEP logo
profile-specific QA gates: every slide has a CEP-specific claim, proof object and no multitenant/SaaS wording
known missing inputs: fresh logged-in dashboard/campus screenshots and official CEP brand manual are not available in repo
`,
  'source-notes.txt': `Sources used:
- docs/AKADEMATE_PRESENTACION_CLIENTE.md: client-facing feature narrative.
- docs/sessions/2026-03-05-cep-enterprise-plan.md: CEP enterprise plan and target domains.
- docs/reports/2026-04-08-project-status-and-cep-deployment-audit.md: verified state and claim limits.
- cepformacion.akademate.com: public page verified 2026-06-04 with 200 response.
- Local assets copied into assets/: CEP dashboard, login, Meta/Facebook screenshots and course images.

Identity asset policy:
- CEP identity appears through verified screenshots and existing local images.
- No recreated CEP logo or unofficial mark is drawn.
`,
  'reference-audit.txt': `No source/template deck supplied. Existing docs include a previous client presentation in MD/PDF/DOCX, but this output is a fresh CEP-only presentation.
Anti-patterns avoided: multitenant terminology, SaaS platform positioning, other-client language, broad infrastructure details.
`,
  'claim-spine.txt': `Thesis: CEP can run the academy from one branded operational platform: public web, course planning, campaign generation, lead management, campus and reporting.
Audience: CEP Formacion direction and operating team.
Arc: Show the new CEP digital operating system, then prove the daily workflows and the highest-value automation: convocatoria -> publicidad -> leads -> matricula.

01 Portada: CEP gets a platform built around its academy. Proof: branded capture wall.
02 Vision: one workspace connects web, admin, leads, campus and reporting. Proof: operating map.
03 Web: CEP public site already presents courses and calls to action. Proof: public web capture.
04 Catalog: all offer types live in one catalog. Proof: course image strip and counts.
05 Convocatorias: each course run becomes a managed commercial opportunity. Proof: stage board.
06 Automation: convocatoria creation can launch advertising assets and lead routing. Proof: workflow diagram.
07 Leads: every form/contact becomes a tracked sales file. Proof: CRM lane.
08 Matriculas: commercial follow-up converts into enrollment status. Proof: conversion pipeline.
09 Marketing: Meta assets and campaign data connect to the operating flow. Proof: Meta screenshots.
10 Campus: students access lessons, progress, attendance and certificates. Proof: campus module map.
11 Team: CEP can coordinate staff, teachers, rooms and campuses. Proof: operations grid.
12 Dashboard: management sees courses, leads, campaigns and activity. Proof: dashboard capture.
13 Brand: CEP image, courses and language are foregrounded. Proof: brand treatment slide.
14 Access: CEP has clear access points for web, dashboard, campus and admin. Proof: domain/access map.
15 Implantation: launch is a controlled validation sequence. Proof: timeline.
16 Next steps: align content, capture final screens, confirm domains and demo. Proof: decision checklist.
`,
  'design-system.txt': `Slide size: 1280x720.
Palette: paper #F7F5F2, ink #171717, CEP red #B5121B, deep red #7C0D14, warm gray #E7E0DA, graphite #303030, white #FFFFFF.
Typography: Arial for all editable text; heavy claims use bold Arial.
Background: warm paper with red anchor bands, white panels only when they contain proof objects.
Title grammar: small red kicker, large black claim title, concise support text.
Diagram grammar: straight/elbow arrows in red, white nodes with thin warm-gray strokes.
Image grammar: large proof captures, subtle borders, no fake device frames unless a screenshot needs containment.
Footer grammar: small page marker and source note.
Banned motifs: multitenant/SaaS wording, fake CEP logos, decorative blobs/orbs, generic card-heavy SaaS grids.
`,
  'contact-sheet-plan.txt': `16-slide rhythm:
01 cover image wall
02 operating map
03 screenshot-led public web
04 editorial catalog strip
05 stage board
06 hero workflow diagram
07 CRM pipeline
08 enrollment conversion board
09 marketing evidence collage
10 campus module map
11 operations matrix
12 dashboard screenshot with callouts
13 brand/editorial proof
14 access map
15 implementation timeline
16 decision checklist
`,
};

const deckData = [
  {
    kicker: 'CEP PLATFORM',
    title: 'La nueva plataforma digital de CEP Formación',
    subtitle: 'Web, gestión interna, captación y campus en un único entorno operativo para la academia.',
    layout: 'cover',
    images: ['cep-dashboard-final.png', 'cep-public-web-2026-06-04.png', 'cep-login-current.png'],
  },
  {
    kicker: 'VISION',
    title: 'Un solo flujo conecta la web, la gestión y la matrícula',
    subtitle: 'El equipo de CEP puede pasar de publicar formación a captar interesados, hacer seguimiento y convertir matrículas sin duplicar trabajo.',
    layout: 'map',
    nodes: ['Web pública', 'Convocatorias', 'Publicidad', 'Leads', 'Matrículas', 'Campus'],
  },
  {
    kicker: 'WEB PUBLICA',
    title: 'La web de CEP convierte la oferta formativa en solicitudes reales',
    subtitle: 'Cursos, ciclos, convocatorias y formularios quedan conectados con el panel interno para mantener la información actualizada.',
    layout: 'screenshot',
    image: 'cep-public-web-2026-06-04.png',
    bullets: ['Catálogo por tipo de formación', 'CTAs de información y matrícula', 'Contenido preparado para campañas'],
  },
  {
    kicker: 'CATALOGO',
    title: 'Toda la oferta de CEP se organiza desde un catálogo único',
    subtitle: 'Privados, teleformación, desempleados, ocupados y ciclos oficiales comparten una estructura común para publicar, filtrar y vender mejor.',
    layout: 'catalog',
    images: ['farmacia-y-dermocosmetica-priv.png', 'auxiliar-de-enfermeria-priv.png', 'entrenamiento-personal-priv.png', 'cfgm-farmacia-parafarmacia__unique.png', 'competencias-digitales-avanzadas-des.png'],
  },
  {
    kicker: 'CONVOCATORIAS',
    title: 'Cada convocatoria se gestiona como una oportunidad comercial',
    subtitle: 'Fechas, plazas, sedes, modalidad y estado de matrícula quedan preparados para operar y comunicar sin rehacer información.',
    layout: 'stages',
    stages: ['Curso base', 'Fechas y sede', 'Plazas', 'Estado', 'Lista de espera'],
  },
  {
    kicker: 'AUTOMATIZACION CLAVE',
    title: 'Al crear una convocatoria, CEP puede activar publicidad y captación de leads',
    subtitle: 'La plataforma conecta la planificación académica con la generación de anuncios, formularios y seguimiento comercial.',
    layout: 'automation',
    nodes: ['Nueva convocatoria', 'Creatividades y copy', 'Campaña Meta', 'Formulario', 'Lead cualificado', 'Matrícula'],
  },
  {
    kicker: 'LEADS',
    title: 'Cada interesado entra automáticamente en seguimiento comercial',
    subtitle: 'Los formularios de la web y las campañas alimentan una ficha de lead con origen, curso de interés, estado y próxima acción.',
    layout: 'pipeline',
    stages: ['Nuevo', 'Contactado', 'Cualificado', 'Documentación', 'Matriculado'],
  },
  {
    kicker: 'MATRICULAS',
    title: 'El equipo puede convertir la conversación en matrícula sin perder contexto',
    subtitle: 'La ficha comercial conserva el historial y permite avanzar de interesado a alumno con estado operativo claro.',
    layout: 'conversion',
    left: ['Datos del alumno', 'Curso o convocatoria', 'Origen de campaña'],
    right: ['Estado de matrícula', 'Seguimiento administrativo', 'Acceso al campus'],
  },
  {
    kicker: 'MARKETING',
    title: 'Las campañas dejan de estar separadas de la gestión diaria',
    subtitle: 'Meta/Facebook, Pixel, audiencias y campañas se conectan con el objetivo real: leads útiles para CEP y matrículas medibles.',
    layout: 'marketing',
    images: ['fb-cep-ads-manager.png', 'fb-audiencias-cep.png', 'bm-app-cep-capi-details.png'],
  },
  {
    kicker: 'CAMPUS',
    title: 'El alumno tiene un espacio propio para avanzar y acreditar progreso',
    subtitle: 'Cursos, lecciones, materiales, asistencia, progreso y certificados pueden centralizarse en una experiencia de campus CEP.',
    layout: 'campus',
    modules: ['Cursos', 'Lecciones', 'Materiales', 'Progreso', 'Asistencia', 'Certificados'],
  },
  {
    kicker: 'EQUIPO Y SEDES',
    title: 'CEP puede coordinar personas, aulas y sedes desde el mismo panel',
    subtitle: 'Profesores, personal administrativo, sedes, aulas y disponibilidad quedan alineados con cada convocatoria.',
    layout: 'matrix',
    rows: [['Profesores', 'Asignación a cursos', 'Áreas cualificadas'], ['Sedes', 'Convocatorias por centro', 'Aulas y capacidad'], ['Personal', 'Roles internos', 'Seguimiento operativo']],
  },
  {
    kicker: 'DASHBOARD',
    title: 'Dirección ve la actividad de CEP sin pedir informes manuales',
    subtitle: 'Cursos activos, alumnos, leads, campañas, próximas convocatorias y alertas se leen desde un panel operativo.',
    layout: 'dashboard',
    image: 'cep-dashboard-final.png',
  },
  {
    kicker: 'IMAGEN CEP',
    title: 'La plataforma debe sentirse como CEP, no como una herramienta genérica',
    subtitle: 'El contenido, los cursos, las capturas, los colores y el lenguaje se orientan a la identidad de la academia.',
    layout: 'brand',
    image: 'cep-public-web-2026-06-04.png',
  },
  {
    kicker: 'ACCESOS',
    title: 'Cada perfil entra por el acceso que necesita',
    subtitle: 'CEP puede separar web pública, panel de gestión, campus del alumno y administración técnica sin mezclar usos.',
    layout: 'access',
    items: [['Web CEP', 'Oferta y formularios'], ['Dashboard', 'Gestión diaria'], ['Campus', 'Alumnos y certificados'], ['Admin', 'Contenido y configuración']],
  },
  {
    kicker: 'IMPLANTACION',
    title: 'El lanzamiento se puede ejecutar por fases controladas',
    subtitle: 'Primero se valida contenido y pantallas, después campañas y leads, y finalmente campus, dominios y formación del equipo.',
    layout: 'timeline',
    phases: ['Validar contenidos', 'Capturas finales', 'Campañas y leads', 'Campus', 'Dominios y salida'],
  },
  {
    kicker: 'PROXIMOS PASOS',
    title: 'La demo debe cerrar decisiones, no abrir dudas',
    subtitle: 'Para presentar a CEP conviene enseñar pantallas reales, confirmar dominios y acordar el flujo de publicidad automática desde convocatorias.',
    layout: 'checklist',
    checks: ['Validar oferta formativa prioritaria', 'Preparar demo con datos CEP', 'Confirmar dominio y accesos', 'Aprobar flujo convocatoria → publicidad → leads', 'Planificar formación del equipo'],
  },
];

function textLiteral(value) {
  return JSON.stringify(String(value));
}

const shared = `
const C = {
  paper: '#F7F5F2',
  ink: '#171717',
  red: '#F0004F',
  deepRed: '#9A0035',
  gray: '#E7E0DA',
  mid: '#6F6760',
  graphite: '#303030',
  white: '#FFFFFF',
};

function rect(slide, left, top, width, height, fill = C.white, line = { style: 'solid', fill: C.gray, width: 1 }, radius = false) {
  const sh = slide.shapes.add({
    geometry: radius ? 'roundRect' : 'rect',
    position: { left, top, width, height },
    fill: { type: 'solid', color: fill },
    line,
  });
  return sh;
}

function line(slide, left, top, width, height, color = C.red, weight = 2) {
  return slide.shapes.add({
    geometry: 'line',
    position: { left, top, width, height },
    line: { style: 'solid', fill: color, width: weight },
  });
}

function textbox(slide, text, left, top, width, height, opts = {}) {
  const sh = slide.shapes.add({
    geometry: 'rect',
    position: { left, top, width, height },
    fill: { color: opts.fill || 'transparent', transparency: opts.fill ? 0 : 100000 },
    line: { transparency: 100000 },
  });
  sh.text = text;
  sh.text.fontSize = opts.size || 20;
  sh.text.typeface = 'Arial';
  sh.text.color = opts.color || C.ink;
  sh.text.bold = Boolean(opts.bold);
  sh.text.alignment = opts.align || 'left';
  sh.text.verticalAlignment = opts.valign || 'top';
  return sh;
}

function footer(slide, num) {
  textbox(slide, 'CEP Formación · Akademate', 58, 682, 360, 20, { size: 11, color: C.mid });
  textbox(slide, String(num).padStart(2, '0'), 1175, 678, 48, 24, { size: 12, color: C.mid, align: 'right' });
}

function header(slide, data, num) {
  slide.background.fill = { type: 'solid', color: C.paper };
  rect(slide, 0, 0, 18, 720, C.red, { transparency: 100000 });
  textbox(slide, data.kicker, 58, 42, 340, 22, { size: 12, bold: true, color: C.red });
  textbox(slide, data.title, 58, 72, 620, 100, { size: 34, bold: true, color: C.ink });
  if (data.subtitle) textbox(slide, data.subtitle, 58, 178, 600, 62, { size: 18, color: C.graphite });
  footer(slide, num);
}

async function addImage(slide, ctx, name, left, top, width, height, fit = 'cover') {
  return await ctx.addImage(slide, {
    path: \`\${ctx.assetDir}/\${name}\`,
    alt: name,
    left,
    top,
    width,
    height,
    fit,
  });
}

function bullet(slide, text, left, top, width) {
  rect(slide, left, top + 7, 8, 8, C.red, { transparency: 100000 });
  textbox(slide, text, left + 20, top, width, 34, { size: 17, color: C.graphite });
}

function pill(slide, text, left, top, width, fill = C.white) {
  const sh = rect(slide, left, top, width, 54, fill, { style: 'solid', fill: C.gray, width: 1 }, true);
  sh.text = text;
  sh.text.fontSize = 17;
  sh.text.typeface = 'Arial';
  sh.text.bold = true;
  sh.text.color = C.ink;
  sh.text.alignment = 'center';
  sh.text.verticalAlignment = 'middle';
  return sh;
}
`;

function moduleForSlide(data, index) {
  const num = index + 1;
  const dataCode = JSON.stringify(data, null, 2);
  return `${shared}
const data = ${dataCode};

export async function slide${String(num).padStart(2, '0')}(presentation, ctx) {
  const slide = presentation.slides.add();
  ${renderBody(data.layout, num).replaceAll('addImage(', 'await addImage(')}
  return slide;
}
`;
}

function renderBody(layout, num) {
  switch (layout) {
    case 'cover':
      return `
  slide.background.fill = { type: 'solid', color: C.paper };
  rect(slide, 0, 0, 410, 720, C.red, { transparency: 100000 });
  textbox(slide, data.kicker, 62, 70, 260, 24, { size: 13, bold: true, color: C.white });
  textbox(slide, data.title, 62, 116, 370, 180, { size: 46, bold: true, color: C.white });
  textbox(slide, data.subtitle, 64, 296, 380, 92, { size: 22, color: C.white });
  addImage(slide, ctx, data.images[0], 470, 62, 700, 390, 'cover');
  addImage(slide, ctx, data.images[1], 470, 480, 330, 170, 'cover');
  addImage(slide, ctx, data.images[2], 830, 480, 340, 170, 'cover');
  textbox(slide, 'Convocatorias · publicidad · leads · matrícula · campus', 62, 604, 360, 48, { size: 15, color: C.white, bold: true });
  footer(slide, ${num});`;
    case 'map':
      return `
  header(slide, data, ${num});
  const xs = [90, 280, 470, 660, 850, 1040];
  data.nodes.forEach((n, i) => {
    pill(slide, n, xs[i], 330 + (i % 2) * 74, 150, i === 2 ? '#FFF3F4' : C.white);
    if (i < data.nodes.length - 1) line(slide, xs[i] + 152, 357 + (i % 2) * 74, 70, ((i + 1) % 2 - (i % 2)) * 74, C.red, 2);
  });
  textbox(slide, 'La mejora no está en tener más pantallas: está en que cada paso alimente al siguiente.', 820, 112, 330, 76, { size: 20, color: C.deepRed, bold: true });
  textbox(slide, 'Resultado para CEP', 820, 214, 220, 26, { size: 15, bold: true, color: C.red });
  textbox(slide, 'Menos duplicación administrativa, mejor seguimiento comercial y más claridad para dirección.', 820, 252, 270, 80, { size: 18, color: C.ink });`;
    case 'screenshot':
      return `
  header(slide, data, ${num});
  addImage(slide, ctx, data.image, 700, 70, 500, 520, 'cover');
  rect(slide, 690, 60, 520, 540, 'transparent', { style: 'solid', fill: C.red, width: 3 });
  data.bullets.forEach((b, i) => bullet(slide, b, 86, 304 + i * 62, 500));
  textbox(slide, 'Lo importante para CEP: publicar una convocatoria no termina en la web; empieza el proceso de captación.', 84, 522, 520, 64, { size: 22, color: C.deepRed, bold: true });`;
    case 'catalog':
      return `
  header(slide, data, ${num});
  for (let i = 0; i < data.images.length; i += 1) {
    const img = data.images[i];
    addImage(slide, ctx, img, 70 + i * 230, 310, 190, 150, 'cover');
    rect(slide, 70 + i * 230, 310, 190, 150, 'transparent', { style: 'solid', fill: C.white, width: 3 });
  }
  ['Privados','Teleformación','Desempleados','Ocupados','Ciclos'].forEach((label, i) => {
    textbox(slide, label, 70 + i * 230, 480, 190, 30, { size: 17, bold: true, align: 'center', color: C.ink });
  });
  textbox(slide, 'Una misma lógica de publicación evita rehacer textos, imágenes y datos cada vez que cambia la oferta.', 118, 558, 980, 42, { size: 24, bold: true, color: C.deepRed, align: 'center' });`;
    case 'stages':
      return `
  header(slide, data, ${num});
  data.stages.forEach((s, i) => {
    const x = 78 + i * 225;
    rect(slide, x, 318, 178, 150, i === 0 ? '#FFF3F4' : C.white, { style: 'solid', fill: i === 0 ? C.red : C.gray, width: i === 0 ? 2 : 1 });
    textbox(slide, '0' + (i + 1), x + 18, 336, 60, 28, { size: 18, bold: true, color: C.red });
    textbox(slide, s, x + 18, 382, 138, 54, { size: 22, bold: true, color: C.ink });
    if (i < data.stages.length - 1) line(slide, x + 188, 393, 54, 0, C.red, 2);
  });
  textbox(slide, 'Cada convocatoria combina información académica y comercial: qué se imparte, cuándo, dónde, con cuántas plazas y cómo se comunica.', 124, 548, 980, 54, { size: 22, color: C.graphite, align: 'center' });`;
    case 'automation':
      return `
  header(slide, data, ${num});
  data.nodes.forEach((n, i) => {
    const x = 70 + i * 190;
    const y = i % 2 === 0 ? 316 : 406;
    const fill = i === 0 || i === 2 || i === 4 ? '#FFF3F4' : C.white;
    const node = pill(slide, n, x, y, 150, fill);
    if (i < data.nodes.length - 1) line(slide, x + 154, y + 27, 52, (i % 2 === 0 ? 90 : -90), C.red, 2);
  });
  rect(slide, 70, 546, 1060, 66, C.deepRed, { transparency: 100000 });
  textbox(slide, 'Mensaje clave: la publicidad nace de la convocatoria, y los leads vuelven al panel para seguimiento y matrícula.', 104, 562, 996, 34, { size: 23, bold: true, color: C.white, align: 'center', valign: 'middle' });`;
    case 'pipeline':
      return `
  header(slide, data, ${num});
  data.stages.forEach((s, i) => {
    const w = 188;
    const x = 74 + i * 220;
    rect(slide, x, 318, w, 170, C.white, { style: 'solid', fill: C.gray, width: 1 });
    rect(slide, x, 318, w, 10, i < 3 ? C.red : C.deepRed, { transparency: 100000 });
    textbox(slide, s, x + 18, 354, w - 36, 40, { size: 21, bold: true, color: C.ink });
    textbox(slide, i === 0 ? 'Formulario o campaña' : i === 4 ? 'Alumno creado' : 'Próxima acción clara', x + 18, 416, w - 36, 46, { size: 15, color: C.graphite });
  });
  textbox(slide, 'CEP gana trazabilidad: cada contacto tiene origen, curso de interés, estado y responsable.', 140, 556, 930, 48, { size: 24, color: C.deepRed, bold: true, align: 'center' });`;
    case 'conversion':
      return `
  header(slide, data, ${num});
  rect(slide, 94, 310, 420, 244, C.white, { style: 'solid', fill: C.gray, width: 1 });
  rect(slide, 768, 310, 420, 244, C.white, { style: 'solid', fill: C.gray, width: 1 });
  textbox(slide, 'Ficha comercial', 126, 338, 260, 30, { size: 24, bold: true, color: C.red });
  data.left.forEach((b, i) => bullet(slide, b, 128, 398 + i * 44, 300));
  textbox(slide, 'Matrícula activa', 800, 338, 260, 30, { size: 24, bold: true, color: C.red });
  data.right.forEach((b, i) => bullet(slide, b, 802, 398 + i * 44, 300));
  line(slide, 540, 430, 190, 0, C.red, 4);
  textbox(slide, 'Convertir', 568, 388, 140, 28, { size: 18, bold: true, color: C.deepRed, align: 'center' });`;
    case 'marketing':
      return `
  header(slide, data, ${num});
  addImage(slide, ctx, data.images[0], 70, 286, 345, 226, 'cover');
  addImage(slide, ctx, data.images[1], 468, 286, 345, 226, 'cover');
  addImage(slide, ctx, data.images[2], 866, 286, 345, 226, 'cover');
  ['Campañas', 'Audiencias', 'Conexión técnica'].forEach((t, i) => textbox(slide, t, 70 + i * 398, 532, 345, 28, { size: 18, bold: true, align: 'center', color: C.ink }));
  textbox(slide, 'La publicidad no se mide como algo aislado: se mide por los leads y matrículas que produce para CEP.', 168, 604, 930, 38, { size: 23, bold: true, color: C.deepRed, align: 'center' });`;
    case 'campus':
      return `
  header(slide, data, ${num});
  data.modules.forEach((m, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    rect(slide, 110 + col * 350, 306 + row * 126, 280, 82, i === 5 ? '#FFF3F4' : C.white, { style: 'solid', fill: i === 5 ? C.red : C.gray, width: i === 5 ? 2 : 1 });
    textbox(slide, m, 138 + col * 350, 330 + row * 126, 224, 32, { size: 23, bold: true, color: C.ink, align: 'center', valign: 'middle' });
  });
  textbox(slide, 'Para el alumno, CEP deja de ser solo una web de cursos: se convierte en una experiencia de aprendizaje con continuidad.', 146, 584, 990, 42, { size: 22, color: C.deepRed, bold: true, align: 'center' });`;
    case 'matrix':
      return `
  header(slide, data, ${num});
  ['Área', 'Qué coordina', 'Para qué sirve'].forEach((h, i) => textbox(slide, h, 118 + i * 330, 286, 290, 30, { size: 16, bold: true, color: C.red }));
  data.rows.forEach((r, row) => {
    const y = 330 + row * 90;
    rect(slide, 96, y, 990, 72, row % 2 === 0 ? C.white : '#FBFAF8', { style: 'solid', fill: C.gray, width: 1 });
    r.forEach((cell, i) => textbox(slide, cell, 118 + i * 330, y + 20, 280, 28, { size: i === 0 ? 21 : 18, bold: i === 0, color: i === 0 ? C.ink : C.graphite }));
  });
  textbox(slide, 'La planificación comercial solo funciona bien si aulas, docentes y sedes están conectados con la convocatoria.', 128, 618, 940, 34, { size: 20, bold: true, color: C.deepRed, align: 'center' });`;
    case 'dashboard':
      return `
  header(slide, data, ${num});
  addImage(slide, ctx, data.image, 100, 268, 760, 360, 'cover');
  rect(slide, 100, 268, 760, 360, 'transparent', { style: 'solid', fill: C.red, width: 3 });
  rect(slide, 910, 300, 230, 230, C.deepRed, { transparency: 100000 });
  textbox(slide, 'Dirección', 940, 330, 170, 30, { size: 18, bold: true, color: C.white, align: 'center' });
  textbox(slide, 'Cursos\\nLeads\\nCampañas\\nConvocatorias', 946, 382, 160, 112, { size: 24, bold: true, color: C.white, align: 'center', valign: 'middle' });`;
    case 'brand':
      return `
  header(slide, data, ${num});
  addImage(slide, ctx, data.image, 720, 100, 410, 460, 'cover');
  rect(slide, 720, 100, 410, 460, 'transparent', { style: 'solid', fill: C.red, width: 3 });
  ['Marca CEP visible', 'Cursos reales', 'Lenguaje del centro', 'Capturas demostrables'].forEach((b, i) => bullet(slide, b, 106, 314 + i * 54, 450));
  textbox(slide, 'La presentación al cliente debe enseñar CEP, no una plataforma abstracta.', 106, 566, 520, 46, { size: 24, bold: true, color: C.deepRed });`;
    case 'access':
      return `
  header(slide, data, ${num});
  data.items.forEach((it, i) => {
    const x = 108 + (i % 2) * 520;
    const y = 310 + Math.floor(i / 2) * 132;
    rect(slide, x, y, 430, 90, C.white, { style: 'solid', fill: C.gray, width: 1 });
    textbox(slide, it[0], x + 24, y + 20, 170, 28, { size: 23, bold: true, color: C.red });
    textbox(slide, it[1], x + 220, y + 22, 170, 42, { size: 18, color: C.graphite });
  });
  textbox(slide, 'Nota: el dominio propio se presenta como fase de implantación hasta confirmar DNS y despliegue final.', 144, 610, 930, 30, { size: 16, color: C.mid, align: 'center' });`;
    case 'timeline':
      return `
  header(slide, data, ${num});
  data.phases.forEach((p, i) => {
    const x = 92 + i * 220;
    rect(slide, x, 338, 170, 120, i === 2 ? '#FFF3F4' : C.white, { style: 'solid', fill: i === 2 ? C.red : C.gray, width: i === 2 ? 2 : 1 });
    textbox(slide, 'Fase ' + (i + 1), x + 22, 356, 120, 22, { size: 14, bold: true, color: C.red });
    textbox(slide, p, x + 22, 394, 126, 42, { size: 20, bold: true, color: C.ink });
    if (i < data.phases.length - 1) line(slide, x + 174, 398, 54, 0, C.red, 2);
  });
  textbox(slide, 'La fase crítica para CEP es validar el flujo completo: convocatoria publicada, publicidad generada y leads gestionados.', 138, 548, 980, 52, { size: 23, bold: true, color: C.deepRed, align: 'center' });`;
    case 'checklist':
      return `
  header(slide, data, ${num});
  data.checks.forEach((c, i) => {
    const y = 294 + i * 62;
    rect(slide, 120, y, 34, 34, i === 3 ? C.red : C.white, { style: 'solid', fill: i === 3 ? C.red : C.gray, width: 2 });
    textbox(slide, i === 3 ? '✓' : '', 120, y + 2, 34, 28, { size: 18, bold: true, color: C.white, align: 'center', valign: 'middle' });
    textbox(slide, c, 176, y, 860, 34, { size: 22, bold: i === 3, color: i === 3 ? C.deepRed : C.ink });
  });
  rect(slide, 900, 104, 250, 88, C.deepRed, { transparency: 100000 });
  textbox(slide, 'Decisión central\\nFlujo publicidad + leads', 922, 122, 206, 52, { size: 20, bold: true, color: C.white, align: 'center', valign: 'middle' });`;
    default:
      return `header(slide, data, ${num});`;
  }
}

await Promise.all(Object.entries(planFiles).map(([name, content]) => fs.writeFile(path.join(workspace, name), content, 'utf8')));
await fs.mkdir(slidesDir, { recursive: true });
await Promise.all(deckData.map((slide, i) => fs.writeFile(path.join(slidesDir, `slide-${String(i + 1).padStart(2, '0')}.mjs`), moduleForSlide(slide, i), 'utf8')));
console.log(`Wrote ${deckData.length} slide modules to ${slidesDir}`);
