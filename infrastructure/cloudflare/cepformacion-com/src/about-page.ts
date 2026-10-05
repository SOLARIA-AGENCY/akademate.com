function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function jsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

const ABOUT = {
  heroKicker: 'Centro de formación en Tenerife',
  heroTitle: 'Quiénes somos',
  heroLead: 'Formación profesional con propósito y trayectoria en Tenerife',
  heroSupport:
    'Llevamos más de 28 años formando en la isla. La dirección es de Fran de Amo Olivier y Carol de Amo Olivier, con un equipo docente y de gestión. La enseñanza viene de una familia que va por la séptima generación dedicada a la docencia.',
  intro: [
    'CEP Formación es un centro de formación profesional en Tenerife, con tres sedes: Norte en La Orotava, Santa Cruz y Sur. Impartimos ciclos formativos oficiales, cursos privados, formación para trabajadores/as ocupados/as y trabajadores/as desempleados/as, formación bonificada para empresas (FUNDAE) y talleres de inserción laboral. El Ministerio de Educación autorizó al centro para el ciclo superior de Higiene Bucodental. En los Premios Nacionales de Educación, APROEM y CEP Formación recibieron una Mención Honorífica y el 4.º puesto en Fomento de los Aprendizajes Esenciales.',
  ],
  historyTitle: 'Trayectoria',
  historyHref: '/blog/conocer-nuestra-historia',
  historyLabel: 'Conocer nuestra historia',
  history: [
    'La trayectoria del centro, desde el primer CEP en 1981 hasta las tres sedes de Tenerife, está recogida aparte.',
  ],
  milestones: [
    { year: '1981', text: 'Primer CEP en la península' },
    { year: '1998', text: 'CEP Norte abre en La Orotava, con diez alumnos' },
    { year: '2010', text: 'Abre CEP Santa Cruz' },
    { year: '2017', text: 'Sede actual y ciclo superior de Higiene Bucodental' },
    { year: 'Hoy', text: 'Tres campus en Tenerife, ciclos, cursos y agencia de colocación' },
  ],
  recognitionKicker: 'Premios Nacionales de Educación',
  recognitionTitle: 'Una mención que reconoce el valor de acompañar procesos reales',
  recognitionText:
    'La Mención Honorífica y el 4.º puesto en la categoría de Fomento de los Aprendizajes Esenciales en los Premios Nacionales de Educación representan un reconocimiento al trabajo desarrollado por APROEM y CEP Formación.',
  recognitionParagraphs: [
    'La Mención Honorífica y el 4.º puesto en la categoría de Fomento de los Aprendizajes Esenciales en los Premios Nacionales de Educación representan un reconocimiento al trabajo desarrollado por APROEM y CEP Formación en favor de la formación, la empleabilidad y el acompañamiento de las personas.',
    'Después de más de 28 años de trayectoria, CEP Formación ha aprendido que la excelencia consiste en enamorarse de los procesos, mejorar cada día y acompañar a las personas para que puedan vivir transformaciones reales y sostenibles.',
    'Este reconocimiento fue recibido en los Premios Nacionales de Educación celebrados en Madrid.',
  ],
  recognitionImage: '/website/cep/recognition/mencion-honorifica-premios-nacionales-educacion-2026.png',
  recognitionAlt: 'Mención Honorífica en los I Premios Nacionales de Educación 2026',
  recognitionPhoto: '/website/cep/aproem/premios-nacionales-educacion-aproem.jpeg',
  recognitionPhotoAlt: 'Reconocimiento de APROEM y CEP Formación en los Premios Nacionales de Educación',
  visionTitle: 'Visión',
  vision: [
    'Contribuir a las capacidades y competencias de cada alumno para afrontar el trabajo y la vida con una formación íntegra.',
    'Promover la igualdad de género en Tenerife.',
    'Colaborar en la educación de la responsabilidad social y medioambiental en la isla.',
    'Dar visibilidad a la realidad animal y ambiental de Tenerife.',
  ],
  missionTitle: 'Misión',
  mission:
    'Consolidarnos como un centro de referencia impulsando proyectos educativos alineados con las empresas, el entorno social y el medioambiente, y potenciando valores y capacidades que sumen al crecimiento personal, profesional y a la sostenibilidad de nuestro entorno.',
  valuesTitle: 'Valores',
  values: [
    {
      title: 'Personas, respeto e inclusión',
      text: 'El alumnado y el equipo están en el centro. Atendemos necesidades educativas específicas y no admitimos discriminación.',
    },
    {
      title: 'Formación con valor social',
      text: 'Entendemos la enseñanza como una herramienta de transformación, con ética, empatía y responsabilidad.',
    },
    {
      title: 'Honestidad y transparencia',
      text: 'Coherencia entre lo que prometemos y lo que hacemos, también en la información y las condiciones de cada curso.',
    },
    {
      title: 'Mejora continua',
      text: 'El equipo se actualiza y el centro corrige a partir de la experiencia, el entorno laboral y la demanda social.',
    },
    {
      title: 'Innovación en el aula',
      text: 'Metodologías activas, tecnologías y creatividad al servicio del aprendizaje, no como decorado.',
    },
    {
      title: 'Responsabilidad social',
      text: 'Sostenibilidad, inclusión, conciliación y respeto al entorno forman parte del proyecto, no de un anexo.',
    },
  ],
  methodTitle: 'Metodología',
  methodLead:
    'Partimos de la persona como un ser completo, con inteligencias múltiples. En el aula se acompaña para que cada alumno desarrolle sus potencialidades, con valores transversales: respeto, igualdad, solidaridad humana y animal, y cuidado del medioambiente.',
  method: [
    'El docente observa al grupo, ajusta el ritmo al cronograma y no aplica el mismo molde a todas las aulas.',
    'Hay actividades de educación emocional y comunicación: exposiciones, debates, trabajo en equipo y resolución de conflictos.',
    'Las nuevas tecnologías entran en clase cuando aportan: ordenador, gamificación o realidad virtual para aprender de forma más clara.',
    'Durante el curso intervienen ONG o alumnado de otras formaciones sobre igualdad, pobreza, abandono animal o medioambiente en Canarias.',
    'Las jornadas de puertas abiertas relacionan distintas formaciones, visibilizan entidades sociales y ofrecen talleres y charlas abiertas.',
    'La práctica es pieza central: material en el aula y prácticas en empresa, también en la modalidad online.',
    'En ciclos y certificados de profesionalidad la evaluación sigue las pautas de la Consejería de Educación y del Servicio Canario de Empleo. En la formación no reglada la evaluación es continua, con más peso de la práctica, la actitud y la evolución en empresa.',
  ],
  ngoTitle: 'Compromiso con el entorno',
  ngoText:
    'Durante el año colaboramos con entidades canarias. Entre ellas: ADEPAC, ADDANCA, SOS felina, Valle Colino, Sonrisas Canarias y Caretta Caretta.',
  quoteTitle: 'La opinión del alumnado',
  quotes: [
    {
      text: 'Gracias a CEP he conseguido una estabilidad laboral y una profesión que me gusta, y con la que llego a casa feliz.',
      name: 'Pilar',
      course: 'Higiene bucodental',
    },
    {
      text: 'Las prácticas fueron beneficiosas para mi aprendizaje. Conocí gente fantástica y salí con una carta de recomendación.',
      name: 'Sonia',
      course: 'Técnico en odontología',
    },
    {
      text: 'Conseguí trabajo en la farmacia donde hice las prácticas profesionales.',
      name: 'Priscila',
      course: 'Auxiliar de farmacia',
    },
    {
      text: 'Agradecida a la docente que me tocó. No pude tener un mejor ejemplo.',
      name: 'Jennifer',
      course: 'Auxiliar de odontología',
    },
  ],
  aristotle: 'Educar la mente sin educar el corazón no es educar en absoluto.',
  campusesTitle: 'Campus en Tenerife',
  campusesLead: 'Tres centros propios, con el mismo proyecto y atención cercana.',
  campuses: [
    {
      name: 'CEP Santa Cruz',
      href: '/sedes/sede-santa-cruz',
      image: '/images/sedes/sede-cep-santa-cruz.png',
      text: 'Plaza José Antonio Barrios Olivero, Bajo Estadio Heliodoro, 38005 Santa Cruz de Tenerife.',
    },
    {
      name: 'CEP Norte',
      href: '/sedes/sede-norte',
      image: '/images/sedes/sede-cep-norte.png',
      text: 'Molinos de Gofio 2, C.C. El Trompo, última planta, 38312 La Orotava.',
    },
    {
      name: 'CEP Sur',
      href: '/sedes/cep-sur',
      image: '/images/sedes/sede-cep-sur.png',
      text: 'Calle Arguayoda 3, 38611 San Isidro, Tenerife.',
    },
  ],
  ctaTitle: '¿Quieres estudiar con CEP Formación?',
  ctaText: 'Te orientamos sobre el itinerario que encaja con tu perfil y con las fechas abiertas.',
  ctaHref: '/p/contacto',
  ctaLabel: 'Pedir información',
}

const ABOUT_CSS = `body:has(script[data-cep-about-lock="1"]) main:not(:has([data-cep-about="1"])){visibility:hidden}
[data-cep-about="1"]{color:#0f172a}
[data-cep-about="1"] h1,[data-cep-about="1"] h2,[data-cep-about="1"] h3{letter-spacing:0;text-transform:none;font-weight:600}
[data-cep-about="1"] .cep-about-hero{position:relative;overflow:hidden;background:#3E091A;padding:4.5rem 0}
[data-cep-about="1"] .cep-about-hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
[data-cep-about="1"] .cep-about-hero-mask{position:absolute;inset:0;background:linear-gradient(90deg,rgba(62,9,26,.92),rgba(62,9,26,.55) 55%,rgba(62,9,26,.2))}
[data-cep-about="1"] .cep-about-wrap{position:relative;margin:0 auto;max-width:72rem;padding:0 1rem}
@media (min-width:640px){[data-cep-about="1"] .cep-about-wrap{padding:0 1.5rem}}
@media (min-width:1024px){[data-cep-about="1"] .cep-about-wrap{padding:0 2rem}}
[data-cep-about="1"] .cep-about-kicker{margin:0;color:#f2014b;font-size:.8rem;font-weight:600}
[data-cep-about="1"] .cep-about-hero .cep-about-kicker{color:#fff}
[data-cep-about="1"] .cep-about-hero h1{margin:.85rem 0 0;max-width:18ch;color:#fff;font-size:clamp(2rem,5vw,3.25rem);line-height:1.1}
[data-cep-about="1"] .cep-about-hero p{margin:1.1rem 0 0;max-width:40rem;color:#fff;font-size:1.05rem;line-height:1.65}
[data-cep-about="1"] section{padding:3.5rem 0}
[data-cep-about="1"] h2{margin:0;font-size:clamp(1.45rem,3vw,1.9rem);line-height:1.2}
[data-cep-about="1"] h3{margin:0;font-size:1.05rem;line-height:1.3}
[data-cep-about="1"] .cep-about-lead{margin:1rem 0 1.5rem;color:#475569;font-size:1rem;line-height:1.65}
[data-cep-about="1"] .cep-about-copy p{margin:1rem 0 0;color:#475569;font-size:1rem;line-height:1.7}
[data-cep-about="1"] .cep-about-split{display:grid;gap:2rem}
@media (min-width:900px){[data-cep-about="1"] .cep-about-split{grid-template-columns:minmax(0,1.25fr) minmax(16rem,.8fr);align-items:start}}
[data-cep-about="1"] .cep-about-milestones{margin:0;padding:1.25rem 1.4rem;border:1px solid #e5e7eb;background:#fff}
[data-cep-about="1"] .cep-about-milestones li{display:grid;grid-template-columns:3.5rem minmax(0,1fr);gap:.75rem;padding:.7rem 0;border-bottom:1px solid #f1f5f9;color:#334155;font-size:.95rem;line-height:1.45}
[data-cep-about="1"] .cep-about-milestones li:last-child{border-bottom:0;padding-bottom:0}
[data-cep-about="1"] .cep-about-milestones strong{color:#f2014b;font-weight:600}
[data-cep-about="1"] .cep-about-award{background:#fff7ed;border-top:1px solid #ffedd5;border-bottom:1px solid #ffedd5}
[data-cep-about="1"] .cep-about-award-grid{display:grid;gap:1.75rem;align-items:center}
@media (min-width:800px){[data-cep-about="1"] .cep-about-award-grid{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr)}}
[data-cep-about="1"] .cep-about-award-photo{display:block;width:100%;height:auto;max-height:34rem;object-fit:cover;border-radius:1.5rem;background:#fff}
[data-cep-about="1"] .cep-about-award-seal{display:block;width:7.5rem;height:auto;margin:1.25rem 0 0;background:#fff;padding:.45rem;border-radius:999px}
[data-cep-about="1"] .cep-about-list{margin:1rem 0 0;padding:0;list-style:none}
[data-cep-about="1"] .cep-about-list li{position:relative;margin-top:.7rem;padding-left:1rem;color:#475569;line-height:1.65}
[data-cep-about="1"] .cep-about-list li::before{content:"";position:absolute;left:0;top:.7em;width:.4rem;height:.4rem;border-radius:99px;background:#f2014b}
[data-cep-about="1"] .cep-about-values{display:grid;gap:1rem}
@media (min-width:700px){[data-cep-about="1"] .cep-about-values{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (min-width:1024px){[data-cep-about="1"] .cep-about-values{grid-template-columns:repeat(3,minmax(0,1fr))}}
[data-cep-about="1"] .cep-about-values article{padding:1.15rem 1.2rem 1.25rem;border:1px solid #e5e7eb;background:#fff}
[data-cep-about="1"] .cep-about-values p{margin:.5rem 0 0;color:#475569;font-size:.95rem;line-height:1.6}
[data-cep-about="1"] .cep-about-soft{background:#f8fafc}
[data-cep-about="1"] .cep-about-quotes{display:grid;gap:1rem}
@media (min-width:800px){[data-cep-about="1"] .cep-about-quotes{grid-template-columns:repeat(2,minmax(0,1fr))}}
[data-cep-about="1"] .cep-about-quotes article{padding:1.2rem 1.25rem;border:1px solid #eadadd;background:#fff}
[data-cep-about="1"] .cep-about-quotes p{margin:0;color:#334155;line-height:1.65}
[data-cep-about="1"] .cep-about-quotes span{display:block;margin-top:.85rem;color:#3E091A;font-size:.9rem;font-weight:600}
[data-cep-about="1"] .cep-about-quote{margin:1.5rem 0 0;color:#3E091A;font-size:1.05rem;line-height:1.5}
[data-cep-about="1"] .cep-about-campuses{display:grid;gap:1.25rem}
@media (min-width:800px){[data-cep-about="1"] .cep-about-campuses{grid-template-columns:repeat(3,minmax(0,1fr))}}
[data-cep-about="1"] .cep-about-campuses a{display:flex;min-height:100%;flex-direction:column;overflow:hidden;border:1px solid #e5e7eb;background:#fff;color:inherit;text-decoration:none}
[data-cep-about="1"] .cep-about-campuses img{display:block;width:100%;height:11rem;object-fit:cover}
[data-cep-about="1"] .cep-about-campuses div{padding:1.1rem 1.15rem 1.25rem;display:flex;flex:1;flex-direction:column}
[data-cep-about="1"] .cep-about-campuses p{margin:.55rem 0 0;color:#475569;font-size:.92rem;line-height:1.55}
[data-cep-about="1"] .cep-about-campuses span{margin-top:auto;padding-top:1rem;color:#f2014b;font-size:.9rem;font-weight:600}
[data-cep-about="1"] .cep-about-cta{background:#3E091A;color:#fff;text-align:center}
[data-cep-about="1"] .cep-about-cta h2,[data-cep-about="1"] .cep-about-cta p{color:#fff}
[data-cep-about="1"] .cep-about-cta p{margin:1rem auto 0;max-width:36rem;line-height:1.65}
[data-cep-about="1"] .cep-about-cta a{display:inline-flex;align-items:center;justify-content:center;min-height:2.75rem;margin-top:1.4rem;padding:0 1.25rem;border-radius:999px;background:#f2014b;color:#fff;font-size:.95rem;font-weight:600;text-decoration:none}`

function isAboutHtml(html: string): boolean {
  return /<title>Quiénes somos/i.test(html) || html.includes('Formación profesional con propósito y trayectoria en Tenerife')
}

function list(items: string[]): string {
  return `<ul class="cep-about-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
}

function aboutMarkup(): string {
  return `<div data-cep-about="1">
<section class="cep-about-hero">
  <img src="/website/cep/hero/quienes-somos-hero-v1.png" alt="Alumnado de CEP Formación en Tenerife" />
  <div class="cep-about-hero-mask"></div>
  <div class="cep-about-wrap">
    <p class="cep-about-kicker">${escapeHtml(ABOUT.heroKicker)}</p>
    <h1>${escapeHtml(ABOUT.heroTitle)}</h1>
    <p>${escapeHtml(ABOUT.heroLead)}</p>
  </div>
</section>
<section>
  <div class="cep-about-wrap cep-about-split">
    <div class="cep-about-copy">
      <h2>${escapeHtml(ABOUT.historyTitle)}</h2>
      ${ABOUT.intro.map((item) => `<p>${escapeHtml(item)}</p>`).join('')}
      <p>${escapeHtml(ABOUT.heroSupport)}</p>
      ${ABOUT.history.map((item) => `<p>${escapeHtml(item)}</p>`).join('')}
      <p><a href="${escapeHtml(ABOUT.historyHref)}">${escapeHtml(ABOUT.historyLabel)}</a></p>
    </div>
  </div>
</section>
<section class="cep-about-award" id="reconocimiento">
  <div class="cep-about-wrap cep-about-award-grid">
    <img class="cep-about-award-photo" src="${escapeHtml(ABOUT.recognitionPhoto)}" alt="${escapeHtml(ABOUT.recognitionPhotoAlt)}" loading="lazy" decoding="async" />
    <div>
      <p class="cep-about-kicker">${escapeHtml(ABOUT.recognitionKicker)}</p>
      <h2>${escapeHtml(ABOUT.recognitionTitle)}</h2>
      <div class="cep-about-copy">${ABOUT.recognitionParagraphs.map((item) => `<p>${escapeHtml(item)}</p>`).join('')}</div>
      <img class="cep-about-award-seal" src="${escapeHtml(ABOUT.recognitionImage)}" alt="${escapeHtml(ABOUT.recognitionAlt)}" loading="lazy" decoding="async" />
    </div>
  </div>
</section>
<section class="cep-about-soft">
  <div class="cep-about-wrap cep-about-split">
    <div>
      <h2>${escapeHtml(ABOUT.visionTitle)}</h2>
      ${list(ABOUT.vision)}
    </div>
    <div class="cep-about-copy">
      <h2>${escapeHtml(ABOUT.missionTitle)}</h2>
      <p>${escapeHtml(ABOUT.mission)}</p>
    </div>
  </div>
</section>
<section>
  <div class="cep-about-wrap">
    <h2>${escapeHtml(ABOUT.valuesTitle)}</h2>
    <div class="cep-about-values">
      ${ABOUT.values.map((item) => `<article><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></article>`).join('')}
    </div>
  </div>
</section>
<section class="cep-about-soft">
  <div class="cep-about-wrap cep-about-copy">
    <h2>${escapeHtml(ABOUT.methodTitle)}</h2>
    <p>${escapeHtml(ABOUT.methodLead)}</p>
    ${list(ABOUT.method)}
    <p class="cep-about-quote">${escapeHtml(ABOUT.aristotle)}</p>
  </div>
</section>
<section>
  <div class="cep-about-wrap cep-about-copy">
    <h2>${escapeHtml(ABOUT.ngoTitle)}</h2>
    <p>${escapeHtml(ABOUT.ngoText)}</p>
  </div>
</section>
<section class="cep-about-soft">
  <div class="cep-about-wrap">
    <h2>${escapeHtml(ABOUT.quoteTitle)}</h2>
    <div class="cep-about-quotes">
      ${ABOUT.quotes
        .map(
          (item) =>
            `<article><p>«${escapeHtml(item.text)}»</p><span>${escapeHtml(item.name)} · ${escapeHtml(item.course)}</span></article>`,
        )
        .join('')}
    </div>
  </div>
</section>
<section>
  <div class="cep-about-wrap">
    <h2>${escapeHtml(ABOUT.campusesTitle)}</h2>
    <p class="cep-about-lead">${escapeHtml(ABOUT.campusesLead)}</p>
    <div class="cep-about-campuses">
      ${ABOUT.campuses
        .map(
          (item) =>
            `<a href="${escapeHtml(item.href)}"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async"><div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.text)}</p><span>Ver sede</span></div></a>`,
        )
        .join('')}
    </div>
  </div>
</section>
<section class="cep-about-cta">
  <div class="cep-about-wrap">
    <h2>${escapeHtml(ABOUT.ctaTitle)}</h2>
    <p>${escapeHtml(ABOUT.ctaText)}</p>
    <a href="${escapeHtml(ABOUT.ctaHref)}">${escapeHtml(ABOUT.ctaLabel)}</a>
  </div>
</section>
</div>`
}

function replaceMain(html: string, inner: string): string {
  if (!/<main\b/i.test(html)) return html
  return html.replace(/<main([^>]*)>[\s\S]*<\/main>/i, `<main$1>${inner}</main>`)
}

function injectCss(html: string): string {
  if (html.includes('data-cep-about-css="1"')) return html
  const tag = `<style data-cep-about-css="1">${ABOUT_CSS}</style>`
  if (html.includes('</head>')) return html.replace('</head>', `${tag}</head>`)
  return tag + html
}

function injectLock(html: string): string {
  if (html.includes('<script data-cep-about-lock="1">')) return html
  const script = `<script data-cep-about-lock="1">
(function () {
  if (window.__cepAboutLock) return;
  window.__cepAboutLock = 1;
  var ABOUT = ${jsonForScript(ABOUT)};
  var CSS = ${jsonForScript(ABOUT_CSS)};
  function ensureCss() {
    var style = document.querySelector('[data-cep-about-css="1"]');
    if (!style) {
      style = document.createElement('style');
      style.setAttribute('data-cep-about-css', '1');
      document.head.appendChild(style);
    }
    if (style.textContent !== CSS) style.textContent = CSS;
  }
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === 'className') node.className = attrs[key];
      else if (key === 'text') node.textContent = attrs[key];
      else node.setAttribute(key, attrs[key]);
    });
    (children || []).forEach(function (child) { if (child) node.appendChild(child); });
    return node;
  }
  function list(items) {
    return el('ul', { className: 'cep-about-list' }, items.map(function (item) {
      return el('li', { text: item });
    }));
  }
  function wrap(children, extra) {
    return el('div', { className: extra ? 'cep-about-wrap ' + extra : 'cep-about-wrap' }, children);
  }
  function build() {
    return el('div', { 'data-cep-about': '1' }, [
      el('section', { className: 'cep-about-hero' }, [
        el('img', { src: '/website/cep/hero/quienes-somos-hero-v1.png', alt: 'Alumnado de CEP Formación en Tenerife' }),
        el('div', { className: 'cep-about-hero-mask' }),
        wrap([
          el('p', { className: 'cep-about-kicker', text: ABOUT.heroKicker }),
          el('h1', { text: ABOUT.heroTitle }),
          el('p', { text: ABOUT.heroLead }),
        ]),
      ]),
      el('section', {}, [wrap([
        el('div', { className: 'cep-about-copy' }, [el('h2', { text: ABOUT.historyTitle })].concat(ABOUT.intro.map(function (item) {
          return el('p', { text: item });
        })).concat([el('p', { text: ABOUT.heroSupport })]).concat(ABOUT.history.map(function (item) {
          return el('p', { text: item });
        })).concat([el('p', {}, [el('a', { href: ABOUT.historyHref, text: ABOUT.historyLabel })])])),
      ])]),
      el('section', { className: 'cep-about-award', id: 'reconocimiento' }, [wrap([
        el('img', { className: 'cep-about-award-photo', src: ABOUT.recognitionPhoto, alt: ABOUT.recognitionPhotoAlt, loading: 'lazy', decoding: 'async' }),
        el('div', {}, [
          el('p', { className: 'cep-about-kicker', text: ABOUT.recognitionKicker }),
          el('h2', { text: ABOUT.recognitionTitle }),
          el('div', { className: 'cep-about-copy' }, ABOUT.recognitionParagraphs.map(function (item) {
            return el('p', { text: item });
          })),
          el('img', { className: 'cep-about-award-seal', src: ABOUT.recognitionImage, alt: ABOUT.recognitionAlt, loading: 'lazy', decoding: 'async' }),
        ]),
      ], 'cep-about-award-grid')]),
      el('section', { className: 'cep-about-soft' }, [wrap([
        el('div', {}, [el('h2', { text: ABOUT.visionTitle }), list(ABOUT.vision)]),
        el('div', { className: 'cep-about-copy' }, [el('h2', { text: ABOUT.missionTitle }), el('p', { text: ABOUT.mission })]),
      ], 'cep-about-split')]),
      el('section', {}, [wrap([
        el('h2', { text: ABOUT.valuesTitle }),
        el('div', { className: 'cep-about-values' }, ABOUT.values.map(function (item) {
          return el('article', {}, [el('h3', { text: item.title }), el('p', { text: item.text })]);
        })),
      ])]),
      el('section', { className: 'cep-about-soft' }, [wrap([
        el('h2', { text: ABOUT.methodTitle }),
        el('p', { text: ABOUT.methodLead }),
        list(ABOUT.method),
        el('p', { className: 'cep-about-quote', text: ABOUT.aristotle }),
      ], 'cep-about-copy')]),
      el('section', {}, [wrap([
        el('h2', { text: ABOUT.ngoTitle }),
        el('p', { text: ABOUT.ngoText }),
      ], 'cep-about-copy')]),
      el('section', { className: 'cep-about-soft' }, [wrap([
        el('h2', { text: ABOUT.quoteTitle }),
        el('div', { className: 'cep-about-quotes' }, ABOUT.quotes.map(function (item) {
          return el('article', {}, [
            el('p', { text: '«' + item.text + '»' }),
            el('span', { text: item.name + ' · ' + item.course }),
          ]);
        })),
      ])]),
      el('section', {}, [wrap([
        el('h2', { text: ABOUT.campusesTitle }),
        el('p', { className: 'cep-about-lead', text: ABOUT.campusesLead }),
        el('div', { className: 'cep-about-campuses' }, ABOUT.campuses.map(function (item) {
          return el('a', { href: item.href }, [
            el('img', { src: item.image, alt: item.name, loading: 'lazy', decoding: 'async' }),
            el('div', {}, [
              el('h3', { text: item.name }),
              el('p', { text: item.text }),
              el('span', { text: 'Ver sede' }),
            ]),
          ]);
        })),
      ])]),
      el('section', { className: 'cep-about-cta' }, [wrap([
        el('h2', { text: ABOUT.ctaTitle }),
        el('p', { text: ABOUT.ctaText }),
        el('a', { href: ABOUT.ctaHref, text: ABOUT.ctaLabel }),
      ])]),
    ]);
  }
  function onAbout() {
    return /quienes-somos/i.test(location.pathname) || /qui[eé]nes somos/i.test(document.title || '');
  }
  function heroOk(main) {
    var root = main.querySelector('[data-cep-about="1"]');
    var h1 = root && root.querySelector('h1');
    var hero = root && root.querySelector('.cep-about-hero');
    if (!h1 || (h1.textContent || '').trim() !== ABOUT.heroTitle) return false;
    if (!hero || (hero.textContent || '').indexOf(ABOUT.heroLead) === -1) return false;
    var heroText = hero.textContent || '';
    if (heroText.indexOf('nace con una visión') !== -1) return false;
    if (heroText.indexOf(ABOUT.heroTitle) !== heroText.lastIndexOf(ABOUT.heroTitle)) return false;
    return true;
  }
  function stale(main) {
    if (!main || !onAbout()) return false;
    return !heroOk(main);
  }
  function apply() {
    if (!onAbout()) {
      var stray = document.querySelector('[data-cep-about-css="1"]');
      if (stray) stray.remove();
      return;
    }
    var main = document.querySelector('main');
    if (!main || !stale(main)) return;
    ensureCss();
    while (main.firstChild) main.removeChild(main.firstChild);
    main.appendChild(build());
  }
  var timer = 0;
  function schedule() {
    if (timer) return;
    timer = setTimeout(function () { timer = 0; apply(); }, 80);
  }
  function start() {
    apply();
    var main = document.querySelector('main');
    var obs = main ? new MutationObserver(schedule) : null;
    if (obs && main) obs.observe(main, { childList: true, subtree: true });
    [400, 1200].forEach(function (ms) { setTimeout(apply, ms); });
    setTimeout(function () { if (obs) obs.disconnect(); apply(); }, 2000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
</script>`
  if (html.includes('</body>')) return html.replace('</body>', `${script}</body>`)
  if (html.includes('</head>')) return html.replace('</head>', `${script}</head>`)
  return html + script
}

export function rewriteAboutPage(html: string): string {
  if (html.includes('<script data-cep-about-lock="1">')) return html
  if (!isAboutHtml(html)) return html
  return injectLock(injectCss(replaceMain(html, aboutMarkup())))
}
