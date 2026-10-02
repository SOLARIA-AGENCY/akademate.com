const LINK_ROUTES: Record<string, string> = {
  'trabaja-con-nosotros': '/colabora/trabaja-con-nosotros',
  'practicas-en-cep': '/colabora/practicas',
  'imparte-formacion': '/colabora/imparte-formacion',
  'proyecto-colaborativo': '/colabora/empresas',
  'formacion-empresas': '/colabora/formacion-para-empresas',
}

type Oficio = {
  slug: string
  intent: string
  title: string
  image: string
  alt: string
  lead: string
  paragraphs: string[]
  detailLabel: string
  detailPlaceholder: string
  priority: 'high' | 'medium'
}

const OFICIOS: Oficio[] = [
  {
    slug: 'trabaja-con-nosotros',
    intent: 'trabaja-con-nosotros',
    title: 'Trabaja con nosotros',
    image: '/website/cep/colabora/trabaja-con-nosotros.png',
    alt: 'Equipo de CEP Formación en una mesa de trabajo',
    lead: 'En CEP Formación creemos que las personas son el motor de nuestro proyecto. Si compartes nuestra pasión por la educación, la innovación y el desarrollo de las personas, nos encantará conocerte.',
    paragraphs: [
      'Buscamos profesionales comprometidos, con vocación, iniciativa y ganas de seguir creciendo para puestos docentes y áreas de administración, coordinación, orientación, formación, marketing y gestión.',
      'Valoramos especialmente la implicación, la calidad humana, el trabajo en equipo y el deseo de contribuir a transformar vidas a través de la formación. Si quieres formar parte de una organización con más de 28 años formando profesionales, envíanos tu currículum y cuéntanos qué puedes aportar.',
    ],
    detailLabel: 'Puesto o área profesional',
    detailPlaceholder: 'Docencia, coordinación, administración, marketing...',
    priority: 'medium',
  },
  {
    slug: 'practicas',
    intent: 'practicas-en-cep',
    title: 'Haz prácticas con nosotros',
    image: '/website/cep/colabora/practicas-en-cep.png',
    alt: 'Estudiante en prácticas en un aula de CEP Formación',
    lead: '¿Estás estudiando un ciclo formativo, un grado universitario o una especialización y necesitas realizar tus prácticas?',
    paragraphs: [
      'En CEP Formación abrimos nuestras puertas a estudiantes que quieran aprender en un entorno dinámico, profesional y comprometido con la excelencia. Podrás conocer el funcionamiento de un centro de formación referente, participar en proyectos reales y adquirir experiencia junto a un equipo que te acompañará durante todo el proceso.',
      'Si buscas un lugar donde crecer profesionalmente y desarrollar tus competencias, envíanos tu solicitud. Estudiaremos la posibilidad de incorporarte a nuestro programa de prácticas.',
    ],
    detailLabel: 'Estudios y periodo de prácticas',
    detailPlaceholder: 'Ciclo, grado o especialización y fechas aproximadas',
    priority: 'medium',
  },
  {
    slug: 'imparte-formacion',
    intent: 'imparte-formacion',
    title: 'Imparte formación con nosotros',
    image: '/website/cep/colabora/imparte-formacion.png',
    alt: 'Docente impartiendo una clase en CEP Formación',
    lead: 'En CEP Formación buscamos profesionales apasionados por compartir su conocimiento y contribuir al desarrollo de nuevas generaciones de profesionales.',
    paragraphs: [
      'Colaboramos con expertos de diferentes ámbitos para impartir formación privada, certificados profesionales, formación para empresas, acciones subvencionadas y programas especializados.',
      'Valoramos el dominio técnico, la capacidad de comunicación, la cercanía con el alumnado, la innovación metodológica y el compromiso con la calidad. Si deseas incorporarte a nuestra bolsa de docentes, cuéntanos cuál es tu especialidad.',
    ],
    detailLabel: 'Especialidad y experiencia',
    detailPlaceholder: 'Área técnica, experiencia profesional o docente',
    priority: 'medium',
  },
  {
    slug: 'empresas',
    intent: 'proyecto-colaborativo',
    title: 'Empresas y proyectos',
    image: '/website/cep/colabora/proyecto-colaborativo.png',
    alt: 'Reunión de un proyecto colaborativo con CEP Formación',
    lead: 'En CEP Formación creemos en las alianzas que generan impacto. Si eres profesional, empresa, institución, asociación o entidad y tienes una idea o iniciativa que pueda aportar valor a la sociedad, queremos escucharte.',
    paragraphs: [
      'Estamos abiertos a desarrollar proyectos conjuntos relacionados con formación, innovación, empleo, orientación profesional, responsabilidad social, bienestar, educación emocional, digitalización y cualquier iniciativa que contribuya al crecimiento de las personas y las organizaciones.',
      'Las grandes ideas nacen cuando diferentes talentos trabajan juntos. Cuéntanos tu propuesta y exploremos nuevas oportunidades de colaboración.',
    ],
    detailLabel: 'Entidad o proyecto',
    detailPlaceholder: 'Organización, iniciativa y ámbito de colaboración',
    priority: 'medium',
  },
  {
    slug: 'formacion-para-empresas',
    intent: 'formacion-empresas',
    title: 'Formación para empresas',
    image: '/website/cep/colabora/formacion-empresas.png',
    alt: 'Sesión de formación para un equipo de empresa',
    lead: 'Cada empresa es única y sus necesidades formativas también. En CEP Formación diseñamos programas a medida para ayudar a las organizaciones a desarrollar el talento de sus equipos, mejorar la productividad y afrontar nuevos retos.',
    paragraphs: [
      'Ofrecemos formación presencial, online y mixta, adaptándonos a objetivos, horarios y características de cada organización. Podemos ayudarte con habilidades directivas, competencias digitales, inteligencia artificial, atención al cliente, idiomas, bienestar laboral, prevención y liderazgo.',
      'Nuestro equipo estudiará tu proyecto y elaborará una propuesta personalizada. Invertir en formación es invertir en el futuro de tu empresa.',
    ],
    detailLabel: 'Necesidad formativa',
    detailPlaceholder: 'Equipo, modalidad, objetivos y fechas aproximadas',
    priority: 'high',
  },
]

const BY_SLUG = new Map(OFICIOS.map((oficio) => [oficio.slug, oficio]))

export function colaboraPageId(pathname: string): string | null {
  const path = pathname.split('?')[0].replace(/\/+$/, '') || '/'
  const match = path.match(/^\/colabora\/([a-z0-9-]+)$/)
  if (!match || !BY_SLUG.has(match[1])) return null
  return match[1]
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function pageHtml(oficio: Oficio): string {
  const paragraphs = oficio.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')
  return `<article data-cep-colabora-page="${oficio.slug}">
<section class="cep-colabora-hero">
<img src="${oficio.image}" alt="${escapeHtml(oficio.alt)}">
<div class="cep-colabora-hero-copy">
<p class="cep-colabora-kicker">Colabora</p>
<h1>${escapeHtml(oficio.title)}</h1>
<p>${escapeHtml(oficio.lead)}</p>
</div>
</section>
<div class="cep-colabora-body">
<section class="cep-colabora-intro">
<h2>Quiénes somos</h2>
<p>CEP Formación es un centro de estudios de Tenerife, de origen familiar, con más de 28 años formando profesionales. El proyecto viene de una familia dedicada a la enseñanza durante siete generaciones. Trabajamos en tres sedes: CEP Santa Cruz, CEP Norte y CEP Sur.</p>
<h2>Qué hacemos</h2>
<p>Impartimos ciclos formativos, cursos privados y formación para empresas, en aula, online y mixto. Acompañamos al alumnado hasta el empleo, con prácticas en empresas y una bolsa de trabajo.</p>
<p>Si quieres sumar como profesional, estudiante, docente o entidad, cuéntanoslo en esta página. La solicitud llega al equipo de esta vía.</p>
</section>
${paragraphs}
<div class="cep-colabora-panel" id="solicitud">
<h2>Cuéntanos cómo quieres participar</h2>
<p class="cep-colabora-panel-lead">Respondemos por el email o el teléfono que indiques. Para documentación sensible, el equipo te dirá un canal seguro después de leer la solicitud.</p>
<form data-cep-colabora-form="1" method="post" action="/api/leads">
<input type="hidden" name="intent" value="${oficio.intent}">
<input type="hidden" name="priority" value="${oficio.priority}">
<div class="cep-colabora-grid">
<label>Nombre y apellidos<input name="nombre" autocomplete="name" required placeholder="Tu nombre completo"></label>
<label>Email<input name="email" type="email" autocomplete="email" required placeholder="nombre@dominio.com"></label>
</div>
<div class="cep-colabora-grid">
<label>Teléfono<input name="telefono" type="tel" autocomplete="tel" placeholder="+34 600 000 000"></label>
<label>Empresa o entidad <span>si aplica</span><input name="organizacion" autocomplete="organization" placeholder="Nombre de la organización"></label>
</div>
<label>${escapeHtml(oficio.detailLabel)}<input name="detalle" placeholder="${escapeHtml(oficio.detailPlaceholder)}"></label>
<label>Cuéntanos un poco más <span>opcional</span><textarea name="mensaje" rows="5" placeholder="Información que nos ayude a valorar tu solicitud"></textarea></label>
<label class="cep-colabora-consent"><input name="consentimiento" type="checkbox" value="1" required><span>Acepto la <a href="/legal/privacidad">política de privacidad</a> y el tratamiento de mis datos para gestionar esta solicitud.</span></label>
<button type="submit">Enviar solicitud</button>
<p data-cep-colabora-note="" role="status"></p>
</form>
</div>
</div>
</article>`
}

const PAGE_CSS = `<style data-cep-colabora-css="1">
.cep-colabora-hero{position:relative;min-height:clamp(420px,46vw,560px);overflow:hidden;background:#020617;color:#fff}
.cep-colabora-hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:70% center}
.cep-colabora-hero-copy{position:relative;z-index:1;max-width:46rem;margin:0 auto;padding:clamp(4.5rem,8vw,7.5rem) 1.25rem 3rem;background:linear-gradient(90deg,rgba(2,6,23,.92),rgba(2,6,23,.62) 62%,transparent)}
.cep-colabora-kicker{margin:0 0 .75rem;font-size:.8rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#fecdd3}
.cep-colabora-hero h1{margin:0;max-width:16ch;font-size:2.6rem;line-height:1.05;font-weight:750}
.cep-colabora-hero-copy p:last-child{max-width:38rem;margin:1rem 0 0;font-size:1.05rem;line-height:1.6}
.cep-colabora-body{max-width:46rem;margin:0 auto;padding:2.5rem 1.25rem 4rem}
.cep-colabora-intro h2{margin:1.75rem 0 .6rem;font-size:1.45rem;line-height:1.2;font-weight:700;color:#0f172a}
.cep-colabora-intro h2:first-child{margin-top:0}
.cep-colabora-intro p,.cep-colabora-body>p{margin:0 0 1rem;font-size:1.05rem;line-height:1.7;color:#334155}
.cep-colabora-panel{margin-top:2rem;padding:1.5rem 1.35rem 1.35rem;background:#fff7fa;border-left:3px solid #f2014b}
.cep-colabora-panel h2{margin:0;font-size:1.55rem;line-height:1.2;font-weight:700;color:#0f172a}
.cep-colabora-panel-lead{margin:.7rem 0 0;color:#475569;line-height:1.6}
.cep-colabora-body form{display:grid;gap:1rem;margin-top:1.25rem}
.cep-colabora-grid{display:grid;gap:1rem}
.cep-colabora-body label{display:grid;gap:.4rem;font-size:.92rem;font-weight:700;color:#0f172a}
.cep-colabora-body label span{font-weight:500;color:#94a3b8}
.cep-colabora-body input,.cep-colabora-body textarea{width:100%;border:1px solid #e2e8f0;border-radius:.85rem;padding:.85rem .95rem;font:inherit;font-weight:500;background:#fff;color:#0f172a}
.cep-colabora-body input:focus,.cep-colabora-body textarea:focus{outline:none;border-color:#f2014b;box-shadow:0 0 0 4px rgba(242,1,75,.12)}
.cep-colabora-consent{grid-template-columns:auto 1fr;align-items:start;font-weight:600;color:#475569}
.cep-colabora-consent input{width:1.05rem;height:1.05rem;margin-top:.2rem;accent-color:#f2014b}
.cep-colabora-consent a{color:#f2014b}
.cep-colabora-body button{justify-self:start;border:0;border-radius:999px;background:#f2014b;color:#fff;padding:.9rem 1.45rem;font:inherit;font-weight:700;cursor:pointer}
.cep-colabora-body button:hover{background:#d0013f}
[data-cep-colabora-note]{min-height:1.4rem;font-weight:650;color:#0f172a}
@media (min-width:700px){.cep-colabora-grid{grid-template-columns:1fr 1fr}}
@media (max-width:1023px){
.cep-colabora-hero{display:flex;flex-direction:column;min-height:0}
.cep-colabora-hero img{position:relative;inset:auto;width:100%;height:auto;aspect-ratio:3/2;object-fit:cover;object-position:72% center}
.cep-colabora-hero-copy{max-width:none;margin:0;padding:1.35rem 1.25rem 1.7rem;background:#0f172a}
.cep-colabora-hero h1{font-size:clamp(1.85rem,6vw,2.4rem)}
}
</style>`

const FORM_SCRIPT = `<script data-cep-colabora-form-script="1">
(function () {
  var form = document.querySelector('form[data-cep-colabora-form]');
  if (!form || form.getAttribute('data-cep-colabora-bound') === '1') return;
  form.setAttribute('data-cep-colabora-bound', '1');
  var note = document.querySelector('[data-cep-colabora-note]');
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var data = new FormData(form);
    var name = String(data.get('nombre') || '').trim();
    var email = String(data.get('email') || '').trim();
    var consent = form.querySelector('input[name="consentimiento"]');
    if (!name || !email) { if (note) note.textContent = 'Indica tu nombre y un email de contacto.'; return; }
    if (!consent || !consent.checked) { if (note) note.textContent = 'Debes aceptar la política de privacidad para enviar la solicitud.'; return; }
    var intent = String(data.get('intent') || '');
    var priority = String(data.get('priority') || 'medium');
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: name,
        email: email,
        phone: String(data.get('telefono') || '') || undefined,
        message: String(data.get('mensaje') || '') || undefined,
        source_form: 'colabora',
        source_page: location.href,
        lead_type: 'contacto',
        lead_intent: intent,
        priority: priority,
        gdpr_consent: true,
        consent_timestamp: new Date().toISOString(),
        lead_metadata: {
          organization: String(data.get('organizacion') || '') || undefined,
          detail: String(data.get('detalle') || '') || undefined
        }
      })
    }).then(function (response) {
      if (!response.ok) throw new Error('lead_request_failed');
      form.hidden = true;
      if (note) note.textContent = 'Solicitud recibida. Revisaremos tu mensaje y te responderemos por el canal que nos has indicado.';
    }).catch(function () {
      if (note) note.textContent = 'No hemos podido enviar la solicitud. Inténtalo de nuevo o contacta con nuestro equipo.';
    });
  });
})();
</script>`

function remapColaboraHref(href: string): string {
  const hashless = href.replace(/#solicitud$/, '')
  const match = hashless.match(/^(.*\/colabora)\?tipo=([a-z0-9-]+)(?:&.*)?$/)
  if (!match) return hashless
  return LINK_ROUTES[match[2]] || match[1] + '?tipo=' + match[2]
}

function rewriteAnchors(html: string): string {
  return html.replace(/href="([^"]*colabora[^"]*)"/g, (full, href: string) => {
    if (href.startsWith('#')) return full
    const next = remapColaboraHref(href)
    return next === href ? full : `href="${next}"`
  })
}

function replaceMain(html: string, body: string): string {
  const match = html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)
  const article = `${PAGE_CSS}${body}${FORM_SCRIPT}`
  if (!match) {
    if (html.includes('</body>')) return html.replace('</body>', `<main data-cep-colabora-rendered="1">${article}</main></body>`)
    return `${html}<main data-cep-colabora-rendered="1">${article}</main>`
  }
  return html.replace(match[0], `<main data-cep-colabora-rendered="1">${article}</main>`)
}

function stripNextFlight(html: string): string {
  return html
    .replace(/<script\b([^>]*)>[\s\S]*?<\/script>/gi, (full, attrs: string) => {
      if (/data-cep-/i.test(attrs)) return full
      if (/__next|\/_next\//i.test(full)) return ''
      return full
    })
    .replace(/<link\b[^>]*rel="(?:module)?preload"[^>]*\/_next\/[^>]*>/gi, '')
}

function injectColaboraLock(html: string): string {
  const script = `<script data-cep-colabora-lock="1">
(function () {
  if (window.__cepColaboraLock) return;
  window.__cepColaboraLock = 1;
  var routes = ${JSON.stringify(LINK_ROUTES)};
  function remap(href) {
    var clean = String(href || '').replace(/#solicitud$/, '');
    var match = clean.match(/^(.*\\/colabora)\\?tipo=([a-z0-9-]+)/);
    if (!match) return clean;
    return routes[match[2]] || (match[1] + '?tipo=' + match[2]);
  }
  function stripArrivalHash() {
    try {
      var path = String(location.pathname || '');
      if (path.indexOf('colabora') === -1) return;
      if (String(location.hash || '') !== '#solicitud') return;
      history.replaceState(null, '', path + String(location.search || ''));
      window.scrollTo(0, 0);
    } catch (e) {}
  }
  function apply() {
    if (!document.body) return;
    document.querySelectorAll('a[href*="colabora"]').forEach(function (link) {
      var href = String(link.getAttribute('href') || '');
      if (!href || href.charAt(0) === '#') return;
      var next = remap(href);
      if (next !== href) link.setAttribute('href', next);
    });
  }
  var timer = 0;
  function schedule() {
    if (timer) return;
    timer = setTimeout(function () { timer = 0; apply(); }, 80);
  }
  function start() {
    stripArrivalHash();
    apply();
    var obs = new MutationObserver(schedule);
    obs.observe(document.body, { childList: true, subtree: true });
    [400, 1200, 3000].forEach(function (ms) { setTimeout(apply, ms); });
    setTimeout(function () { obs.disconnect(); apply(); }, 6000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
</script>`
  if (html.includes('</body>')) return html.replace('</body>', `${script}</body>`)
  if (html.includes('</head>')) return html.replace('</head>', `${script}</head>`)
  return html + script
}

export function rewriteColaboraLinks(html: string, pathname = ''): string {
  if (html.includes('data-cep-colabora-lock="1"')) return html
  let next = rewriteAnchors(html)
  const slug = colaboraPageId(pathname)
  if (slug) {
    const oficio = BY_SLUG.get(slug)
    if (oficio && !next.includes('data-cep-colabora-rendered="1"')) {
      next = replaceMain(next, pageHtml(oficio))
      next = stripNextFlight(next)
      const title = `${oficio.title} | CEP Formación`
      if (/<title>[^<]*<\/title>/i.test(next)) next = next.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`)
    }
  }
  return injectColaboraLock(next)
}
