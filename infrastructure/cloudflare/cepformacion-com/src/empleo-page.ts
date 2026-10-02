import { EMPLEO_OFFICE_ALT, EMPLEO_OFFICE_IMAGE } from './empleo-image'

const MARKER = 'data-cep-empleo-page="1"'

function empleoMarkup(): string {
  return `<article ${MARKER} class="bg-white text-slate-950">
  <section class="bg-slate-950 text-white">
    <div class="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
      <div>
        <h1 class="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">Agencia de colocación y bolsa de trabajo</h1>
        <p class="mt-6 max-w-2xl text-lg leading-8 text-white/80">CEP Formación conecta orientación laboral, formación y oportunidades profesionales a través de su agencia de colocación autorizada, número 0500000212.</p>
        <p class="mt-4 max-w-2xl text-base leading-7 text-white/70">El portal público de empleo todavía no está activo. Hasta entonces, el equipo atiende las consultas de orientación de forma directa.</p>
      </div>
      <img src="${EMPLEO_OFFICE_IMAGE}" alt="${EMPLEO_OFFICE_ALT}" class="h-full max-h-[28rem] w-full rounded-3xl object-cover">
    </div>
  </section>
  <section class="bg-white">
    <div class="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
      <article>
        <h2 class="text-3xl font-semibold text-slate-950">Para candidatos</h2>
        <p class="mt-4 text-base leading-8 text-slate-600">El servicio permite registrar el perfil profesional para participar en procesos de selección, recibir orientación y mejorar las posibilidades de inserción laboral.</p>
        <ul class="mt-6 grid gap-3 text-sm font-semibold leading-7 text-slate-700">
          <li>Registro del perfil profesional y datos de contacto.</li>
          <li>Alta de formación, experiencia y ocupaciones de interés.</li>
          <li>Valoración de candidaturas para ofertas compatibles.</li>
          <li>Orientación para mejorar empleabilidad, CV y entrevista.</li>
        </ul>
      </article>
      <article>
        <h2 class="text-3xl font-semibold text-slate-950">Para empresas</h2>
        <p class="mt-4 text-base leading-8 text-slate-600">Las empresas pueden publicar ofertas y solicitar perfiles profesionales para cubrir vacantes con candidatos inscritos en la agencia.</p>
        <ul class="mt-6 grid gap-3 text-sm font-semibold leading-7 text-slate-700">
          <li>Publicación de ofertas de empleo en el portal de la agencia.</li>
          <li>Preselección de candidatos inscritos según el perfil solicitado.</li>
          <li>Coordinación con empresas para entrevistas y seguimiento del proceso.</li>
        </ul>
      </article>
    </div>
  </section>
  <section class="bg-slate-950 text-white">
    <div class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <h2 class="text-3xl font-semibold">Contacto de la agencia</h2>
      <p class="mt-4 max-w-2xl text-sm leading-7 text-white/70">Para gestiones de la agencia de colocación, contacta con el equipo responsable. El alta en el portal sigue en preparación.</p>
      <dl class="mt-8 grid gap-6 sm:grid-cols-3">
        <div>
          <dt class="text-sm text-white/60">Sede</dt>
          <dd class="mt-2 text-sm font-semibold">Plaza José Antonio Barrios Olivero s/n, 38005 Santa Cruz de Tenerife</dd>
        </div>
        <div>
          <dt class="text-sm text-white/60">Teléfono</dt>
          <dd class="mt-2 text-sm font-semibold">922 219 257</dd>
        </div>
        <div>
          <dt class="text-sm text-white/60">Correo</dt>
          <dd class="mt-2 text-sm font-semibold"><a href="mailto:carmen.diaz@cursostenerife.es" class="underline">carmen.diaz@cursostenerife.es</a></dd>
        </div>
      </dl>
      <p class="mt-8 text-sm text-white/70">ACATEN 2020 S.L. Agencia autorizada 0500000212.</p>
    </div>
  </section>
  <section class="bg-white">
    <div class="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:px-8">
      <div>
        <h2 class="text-2xl font-semibold text-slate-950">Formación antes de buscar empleo</h2>
        <p class="mt-2 text-sm leading-7 text-slate-600">Revisa convocatorias abiertas y cursos vinculados a sectores con demanda profesional.</p>
      </div>
      <a href="/convocatorias" class="inline-flex min-h-12 items-center justify-center rounded-full bg-[#f2014b] px-6 text-sm font-semibold text-white">Ver convocatorias abiertas</a>
    </div>
  </section>
</article>`
}

function replaceMain(html: string, inner: string): string {
  if (/<main\b/i.test(html)) return html.replace(/<main([^>]*)>[\s\S]*<\/main>/i, `<main$1>${inner}</main>`)
  if (/<footer\b/i.test(html)) return html.replace(/<footer\b/i, `<main>${inner}</main><footer`)
  return `${html}<main>${inner}</main>`
}

function injectLock(html: string): string {
  if (html.includes('data-cep-empleo-lock="1"')) return html
  const script = `<script data-cep-empleo-lock="1">
(function () {
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function list(items, className) {
    var ul = el('ul', className);
    items.forEach(function (item) { ul.appendChild(el('li', '', item)); });
    return ul;
  }
  function build() {
    var article = el('article', 'bg-white text-slate-950');
    article.setAttribute('data-cep-empleo-page', '1');
    var hero = el('section', 'bg-slate-950 text-white');
    var heroGrid = el('div', 'mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8');
    var copy = el('div');
    copy.appendChild(el('h1', 'max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl', 'Agencia de colocación y bolsa de trabajo'));
    copy.appendChild(el('p', 'mt-6 max-w-2xl text-lg leading-8 text-white/80', 'CEP Formación conecta orientación laboral, formación y oportunidades profesionales a través de su agencia de colocación autorizada, número 0500000212.'));
    copy.appendChild(el('p', 'mt-4 max-w-2xl text-base leading-7 text-white/70', 'El portal público de empleo todavía no está activo. Hasta entonces, el equipo atiende las consultas de orientación de forma directa.'));
    var photo = el('img', 'h-full max-h-[28rem] w-full rounded-3xl object-cover');
    photo.setAttribute('src', ${JSON.stringify(EMPLEO_OFFICE_IMAGE)});
    photo.setAttribute('alt', ${JSON.stringify(EMPLEO_OFFICE_ALT)});
    heroGrid.appendChild(copy);
    heroGrid.appendChild(photo);
    hero.appendChild(heroGrid);
    var split = el('section', 'bg-white');
    var splitGrid = el('div', 'mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8');
    var candidates = el('article');
    candidates.appendChild(el('h2', 'text-3xl font-semibold text-slate-950', 'Para candidatos'));
    candidates.appendChild(el('p', 'mt-4 text-base leading-8 text-slate-600', 'El servicio permite registrar el perfil profesional para participar en procesos de selección, recibir orientación y mejorar las posibilidades de inserción laboral.'));
    candidates.appendChild(list([
      'Registro del perfil profesional y datos de contacto.',
      'Alta de formación, experiencia y ocupaciones de interés.',
      'Valoración de candidaturas para ofertas compatibles.',
      'Orientación para mejorar empleabilidad, CV y entrevista.'
    ], 'mt-6 grid gap-3 text-sm font-semibold leading-7 text-slate-700'));
    var companies = el('article');
    companies.appendChild(el('h2', 'text-3xl font-semibold text-slate-950', 'Para empresas'));
    companies.appendChild(el('p', 'mt-4 text-base leading-8 text-slate-600', 'Las empresas pueden publicar ofertas y solicitar perfiles profesionales para cubrir vacantes con candidatos inscritos en la agencia.'));
    companies.appendChild(list([
      'Publicación de ofertas de empleo en el portal de la agencia.',
      'Preselección de candidatos inscritos según el perfil solicitado.',
      'Coordinación con empresas para entrevistas y seguimiento del proceso.'
    ], 'mt-6 grid gap-3 text-sm font-semibold leading-7 text-slate-700'));
    splitGrid.appendChild(candidates);
    splitGrid.appendChild(companies);
    split.appendChild(splitGrid);
    var contact = el('section', 'bg-slate-950 text-white');
    var contactWrap = el('div', 'mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8');
    contactWrap.appendChild(el('h2', 'text-3xl font-semibold', 'Contacto de la agencia'));
    contactWrap.appendChild(el('p', 'mt-4 max-w-2xl text-sm leading-7 text-white/70', 'Para gestiones de la agencia de colocación, contacta con el equipo responsable. El alta en el portal sigue en preparación.'));
    var facts = el('dl', 'mt-8 grid gap-6 sm:grid-cols-3');
    [['Sede', 'Plaza José Antonio Barrios Olivero s/n, 38005 Santa Cruz de Tenerife'], ['Teléfono', '922 219 257']].forEach(function (pair) {
      var block = el('div');
      block.appendChild(el('dt', 'text-sm text-white/60', pair[0]));
      block.appendChild(el('dd', 'mt-2 text-sm font-semibold', pair[1]));
      facts.appendChild(block);
    });
    var mail = el('div');
    mail.appendChild(el('dt', 'text-sm text-white/60', 'Correo'));
    var mailValue = el('dd', 'mt-2 text-sm font-semibold');
    var mailLink = el('a', 'underline', 'carmen.diaz@cursostenerife.es');
    mailLink.setAttribute('href', 'mailto:carmen.diaz@cursostenerife.es');
    mailValue.appendChild(mailLink);
    mail.appendChild(mailValue);
    facts.appendChild(mail);
    contactWrap.appendChild(facts);
    contactWrap.appendChild(el('p', 'mt-8 text-sm text-white/70', 'ACATEN 2020 S.L. Agencia autorizada 0500000212.'));
    contact.appendChild(contactWrap);
    var close = el('section', 'bg-white');
    var closeWrap = el('div', 'mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:px-8');
    var closeCopy = el('div');
    closeCopy.appendChild(el('h2', 'text-2xl font-semibold text-slate-950', 'Formación antes de buscar empleo'));
    closeCopy.appendChild(el('p', 'mt-2 text-sm leading-7 text-slate-600', 'Revisa convocatorias abiertas y cursos vinculados a sectores con demanda profesional.'));
    var cta = el('a', 'inline-flex min-h-12 items-center justify-center rounded-full bg-[#f2014b] px-6 text-sm font-semibold text-white', 'Ver convocatorias abiertas');
    cta.setAttribute('href', '/convocatorias');
    closeWrap.appendChild(closeCopy);
    closeWrap.appendChild(cta);
    close.appendChild(closeWrap);
    article.appendChild(hero);
    article.appendChild(split);
    article.appendChild(contact);
    article.appendChild(close);
    return article;
  }
  function apply() {
    var main = document.querySelector('main');
    if (!main || main.querySelector('[data-cep-empleo-page]')) return;
    main.replaceChildren(build());
  }
  function start() {
    apply();
    var obs = new MutationObserver(function () { apply(); });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    [400, 1200, 3000].forEach(function (ms) { setTimeout(apply, ms); });
    setTimeout(function () { obs.disconnect(); apply(); }, 8000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
</script>`
  if (html.includes('</body>')) return html.replace('</body>', `${script}</body>`)
  return html + script
}

export function isEmpleoPath(pathname: string): boolean {
  const path = pathname.split('?')[0].replace(/\/+$/, '') || '/'
  return path === '/empleo' || path === '/p/empleo' || path === '/agencia-colocacion' || path === '/p/agencia-colocacion'
}

export function rewriteEmpleoPage(html: string, pathname = ''): string {
  if (!isEmpleoPath(pathname)) return html
  if (html.includes(MARKER) && html.includes('data-cep-empleo-lock="1"')) return html
  return injectLock(replaceMain(html, empleoMarkup()))
}
