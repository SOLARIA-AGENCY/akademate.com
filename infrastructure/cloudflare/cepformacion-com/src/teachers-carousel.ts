export type TeacherCard = {
  name: string
  image: string
  course: string | null
}

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

function decode(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function isPlaceholderCourse(value: string): boolean {
  const text = value.replace(/\s+/g, ' ').trim()
  if (!text) return true
  return /^(docente|imparte|docente especializado|profesorado cep)$/i.test(text)
}

function tidyCourse(value: string): string | null {
  const text = value.replace(/\s+/g, ' ').trim()
  if (isPlaceholderCourse(text)) return null
  return text
    .replace(/^Instructor o Instructora de\s+/i, '')
    .replace(/\bEnfermeria\b/g, 'Enfermería')
}

function sectionBounds(html: string): { start: number; end: number } | null {
  const heading = html.search(/<h2[^>]*>\s*Equipo docente\s*<\/h2>/i)
  if (heading < 0) return null
  const start = html.lastIndexOf('<section', heading)
  const close = html.indexOf('</section>', heading)
  if (start < 0 || close < 0) return null
  return { start, end: close + '</section>'.length }
}

export function parseTeachers(html: string): TeacherCard[] {
  const bounds = sectionBounds(html)
  if (!bounds) return []
  const chunk = html.slice(bounds.start, bounds.end)
  const blocks = [...chunk.matchAll(/<(article|a)[^>]*>[\s\S]*?<\/\1>/gi)]
  const seen = new Set<string>()
  const teachers: TeacherCard[] = []
  for (const match of blocks) {
    const block = match[0]
    const src = block.match(/<img[^>]*\ssrc="([^"]+)"/i)?.[1] || ''
    const alt = decode(block.match(/<img[^>]*\salt="([^"]*)"/i)?.[1] || '')
    const name = decode(block.match(/<h3[^>]*>([^<]+)<\/h3>/i)?.[1] || alt).replace(/\s+/g, ' ').trim()
    if (!name || !src || seen.has(name)) continue
    const texts = [...block.matchAll(/<p[^>]*>([^<]+)<\/p>/gi)].map((item) => decode(item[1]).replace(/\s+/g, ' ').trim())
    const course = texts.map((text) => tidyCourse(text)).find((item): item is string => Boolean(item)) || null
    seen.add(name)
    teachers.push({ name, image: src, course })
  }
  return teachers
}

export function alreadyPolishedTeachers(html: string): boolean {
  return (
    html.includes('data-cep-teacher-ring="1"') &&
    html.includes('cep-teachers-loop') &&
    html.includes('data-cep-teachers-bleed="1"') &&
    html.includes('cep-teachers-fade-left') &&
    html.includes('cep-teachers-fade-right')
  )
}

function stripTeachersChrome(html: string): string {
  return html
    .replace(/<style\b[^>]*data-cep-teachers-css="1"[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script\b[^>]*data-cep-teachers-lock="1"[^>]*>[\s\S]*?<\/script>/gi, '')
}

const TEACHERS_CSS = `[data-cep-teachers="1"]{background:#fff;padding:4rem 0 3.25rem;overflow-x:hidden;font-family:Inter,system-ui,sans-serif}
[data-cep-teachers="1"] .cep-teachers-copy{max-width:72rem;margin:0 auto;padding:0 1rem}
@media (min-width:640px){[data-cep-teachers="1"] .cep-teachers-copy{padding:0 1.5rem}}
@media (min-width:1024px){[data-cep-teachers="1"] .cep-teachers-copy{padding:0 2rem}}
[data-cep-teachers="1"] h2{margin:0;color:#3E091A;font-size:clamp(1.65rem,3vw,2.15rem);font-weight:600;letter-spacing:0;line-height:1.15}
[data-cep-teachers="1"] .cep-teachers-bleed{position:relative;width:100%;margin-top:1.75rem;overflow:hidden}
[data-cep-teachers="1"] .cep-teachers-mask{overflow:hidden}
[data-cep-teachers="1"] .cep-teachers-loop{display:flex;width:max-content;gap:1.35rem;animation:cep-teacher-marquee 55s linear infinite}
[data-cep-teachers="1"] .cep-teachers-fade{position:absolute;top:0;bottom:0;width:6rem;z-index:2;pointer-events:none}
[data-cep-teachers="1"] .cep-teachers-fade-left{left:0;background:linear-gradient(90deg,#fff 0%,rgba(255,255,255,0) 100%)}
[data-cep-teachers="1"] .cep-teachers-fade-right{right:0;background:linear-gradient(270deg,#fff 0%,rgba(255,255,255,0) 100%)}
@media (max-width:639px){[data-cep-teachers="1"] .cep-teachers-fade{width:3.5rem}}
[data-cep-teachers="1"] .cep-teachers-card{flex:0 0 10.5rem;text-align:center}
[data-cep-teachers="1"] .cep-teachers-ring{display:inline-flex;padding:4px;border-radius:50%;background:#f2014b}
[data-cep-teachers="1"] .cep-teachers-ring img{display:block;width:8.25rem;height:8.25rem;border:3px solid #fff;border-radius:50%;object-fit:cover;object-position:50% 12%;background:#f6eef1}
[data-cep-teachers="1"] .cep-teachers-card h3{margin:.75rem 0 0;color:#3E091A;font-size:.9rem;font-weight:600;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
[data-cep-teachers="1"] .cep-teachers-role{margin:.2rem 0 0;color:#f2014b;font-size:.72rem;font-weight:700;line-height:1.2;white-space:nowrap}
[data-cep-teachers="1"] .cep-teachers-area{margin:.2rem 0 0;color:#64748b;font-size:.78rem;font-weight:600;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@keyframes cep-teacher-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@media (prefers-reduced-motion:reduce){[data-cep-teachers="1"] .cep-teachers-loop{animation:none;overflow-x:auto}}`

function teachersCss(): string {
  return `<style data-cep-teachers-css="1">${TEACHERS_CSS}</style>`
}

function injectCss(html: string): string {
  const tag = teachersCss()
  if (/<style\b[^>]*data-cep-teachers-css="1"/.test(html)) {
    return html.replace(/<style\b[^>]*data-cep-teachers-css="1"[^>]*>[\s\S]*?<\/style>/gi, tag)
  }
  if (html.includes('</head>')) return html.replace('</head>', `${tag}</head>`)
  return tag + html
}

function cardHtml(teacher: TeacherCard): string {
  const area = teacher.course
    ? `<p class="cep-teachers-area">${escapeHtml(teacher.course)}</p>`
    : `<p class="cep-teachers-area">Formación CEP</p>`
  return `<article class="cep-teachers-card"><span class="cep-teachers-ring" data-cep-teacher-ring="1"><img src="${escapeHtml(teacher.image)}" alt="${escapeHtml(teacher.name)}" loading="lazy" decoding="async"></span><h3 title="${escapeHtml(teacher.name)}">${escapeHtml(teacher.name)}</h3><p class="cep-teachers-role">Docente</p>${area}</article>`
}

function loopHtml(teachers: TeacherCard[]): string {
  const cards = teachers.map(cardHtml).join('')
  return `${cards}${cards}`
}

function renderSection(teachers: TeacherCard[]): string {
  return `<section data-cep-teachers="1" aria-label="Equipo docente">
  <div class="cep-teachers-copy">
    <h2>Equipo docente</h2>
  </div>
  <div class="cep-teachers-bleed" data-cep-teachers-bleed="1">
    <div class="cep-teachers-fade cep-teachers-fade-left" aria-hidden="true"></div>
    <div class="cep-teachers-fade cep-teachers-fade-right" aria-hidden="true"></div>
    <div class="cep-teachers-mask"><div class="cep-teachers-loop">${loopHtml(teachers)}</div></div>
  </div>
</section>`
}

function injectLock(html: string, teachers: TeacherCard[]): string {
  if (html.includes('data-cep-teachers-lock="1"')) return html
  const script = `<script data-cep-teachers-lock="1">
(function () {
  if (window.__cepTeachersLock) return;
  window.__cepTeachersLock = 1;
  var CSS = ${jsonForScript(TEACHERS_CSS)};
  var TEACHERS = ${jsonForScript(teachers)};
  function ensureCss() {
    var style = document.querySelector('[data-cep-teachers-css="1"]');
    if (!style) {
      style = document.createElement('style');
      style.setAttribute('data-cep-teachers-css', '1');
      document.head.appendChild(style);
    }
    if (style.textContent !== CSS) style.textContent = CSS;
  }
  function textOf(el) {
    return (el.textContent || '').replace(/\\s+/g, ' ').trim();
  }
  function findSection() {
    var headings = document.querySelectorAll('h2');
    for (var i = 0; i < headings.length; i += 1) {
      if (textOf(headings[i]) === 'Equipo docente') return headings[i].closest('section');
    }
    return document.querySelector('[data-cep-teachers="1"]');
  }
  function needsRebuild(section) {
    if (!section) return false;
    if (
      section.querySelector('[data-cep-teacher-ring="1"]') &&
      section.querySelector('.cep-teachers-loop') &&
      section.querySelector('[data-cep-teachers-bleed="1"]') &&
      section.querySelector('.cep-teachers-fade-left') &&
      section.querySelector('.cep-teachers-fade-right')
    ) return false;
    return true;
  }
  function card(teacher) {
    var article = document.createElement('article');
    article.className = 'cep-teachers-card';
    var ring = document.createElement('span');
    ring.className = 'cep-teachers-ring';
    ring.setAttribute('data-cep-teacher-ring', '1');
    var img = document.createElement('img');
    img.setAttribute('src', teacher.image);
    img.setAttribute('alt', teacher.name);
    img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');
    ring.appendChild(img);
    article.appendChild(ring);
    var name = document.createElement('h3');
    name.textContent = teacher.name;
    name.setAttribute('title', teacher.name);
    article.appendChild(name);
    var role = document.createElement('p');
    role.className = 'cep-teachers-role';
    role.textContent = 'Docente';
    article.appendChild(role);
    var area = document.createElement('p');
    area.className = 'cep-teachers-area';
    area.textContent = teacher.course || 'Formación CEP';
    article.appendChild(area);
    return article;
  }
  function apply() {
    ensureCss();
    var section = findSection();
    if (!section || !TEACHERS.length || !needsRebuild(section)) return;
    section.setAttribute('data-cep-teachers', '1');
    section.setAttribute('aria-label', 'Equipo docente');
    while (section.firstChild) section.removeChild(section.firstChild);
    var copy = document.createElement('div');
    copy.className = 'cep-teachers-copy';
    var title = document.createElement('h2');
    title.textContent = 'Equipo docente';
    copy.appendChild(title);
    var bleed = document.createElement('div');
    bleed.className = 'cep-teachers-bleed';
    bleed.setAttribute('data-cep-teachers-bleed', '1');
    var fadeLeft = document.createElement('div');
    fadeLeft.className = 'cep-teachers-fade cep-teachers-fade-left';
    fadeLeft.setAttribute('aria-hidden', 'true');
    var fadeRight = document.createElement('div');
    fadeRight.className = 'cep-teachers-fade cep-teachers-fade-right';
    fadeRight.setAttribute('aria-hidden', 'true');
    var mask = document.createElement('div');
    mask.className = 'cep-teachers-mask';
    var loop = document.createElement('div');
    loop.className = 'cep-teachers-loop';
    TEACHERS.forEach(function (teacher) { loop.appendChild(card(teacher)); });
    TEACHERS.forEach(function (teacher) { loop.appendChild(card(teacher)); });
    mask.appendChild(loop);
    bleed.appendChild(fadeLeft);
    bleed.appendChild(fadeRight);
    bleed.appendChild(mask);
    section.appendChild(copy);
    section.appendChild(bleed);
  }
  var timer = 0;
  function schedule() {
    if (timer) return;
    timer = setTimeout(function () { timer = 0; apply(); }, 80);
  }
  function start() {
    apply();
    var obs = new MutationObserver(schedule);
    obs.observe(document.documentElement, { childList: true, subtree: true });
    [400, 1200, 3000, 8000].forEach(function (ms) { setTimeout(apply, ms); });
    setTimeout(function () { obs.disconnect(); apply(); }, 12000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
</script>`
  if (html.includes('</body>')) return html.replace('</body>', `${script}</body>`)
  if (html.includes('</head>')) return html.replace('</head>', `${script}</head>`)
  return html + script
}

export function rewriteTeachersCarousel(html: string): string {
  if (alreadyPolishedTeachers(html) && html.includes('data-cep-teachers-lock="1"')) return html
  if (alreadyPolishedTeachers(html)) return injectLock(html, parseTeachers(html))
  const source = stripTeachersChrome(html)
  const teachers = parseTeachers(source)
  if (!teachers.length) return html
  const bounds = sectionBounds(source)
  if (!bounds) return html
  const next = injectCss(source.slice(0, bounds.start) + renderSection(teachers) + source.slice(bounds.end))
  return injectLock(next, teachers)
}
