const APROEM_SKIP = `<script data-cep-aproem-skip>(function(){function place(){var main=document.querySelector("main");if(main&&!document.getElementById("contenido"))main.id="contenido";if(document.querySelector(".cep-skip"))return;var a=document.createElement("a");a.className="cep-skip";a.href="#contenido";a.textContent="Saltar al contenido";document.body.insertBefore(a,document.body.firstChild)}function later(){setTimeout(place,0);setTimeout(place,1200)}if(document.readyState==="complete")later();else window.addEventListener("load",later)})();</script>`

const APROEM_CSS = `<style data-cep-aproem-a11y="1">
:root{--brand:#d0013f!important;--brand-dark:#b00136!important}
.brand-text,.brand-hover:hover,[class*="text-[var(--brand)]"]{color:#d0013f!important}
[class*="bg-[var(--brand-light)]"][class*="text-[var(--brand)]"]{color:#b00136!important}
.brand-btn,.brand-bg,[class*="bg-[var(--brand)]"]{background-color:#d0013f!important;color:#fff!important}
.brand-btn:hover{background-color:#b00136!important;color:#fff!important}
[style*="background-color:#f2014b"],[style*="background:#f2014b"],[style*="background-color: rgb(242, 1, 75)"],[style*="background-color:rgb(242, 1, 75)"]{background-color:#d0013f!important}
a.brand-btn,button.brand-btn{color:#fff!important}
.bg-\\[\\#f2014b\\],[class*="bg-[#f2014b]"]{background-color:#d0013f!important;color:#fff!important}
.text-\\[\\#f2014b\\],[class*="text-[#f2014b]"]{color:#d0013f!important}
[class*="border-white/20"]{border-color:rgb(255 255 255/.92)!important}
input[aria-label="Buscar"]{border-color:#334155!important}
[class*="z-[10000]"] button{border-color:#334155!important;color:#0f1729!important;background:#fff!important}
[class*="z-[10000]"] button:last-child{background:#d0013f!important;color:#fff!important;border-color:#d0013f!important}
a:focus-visible,button:focus-visible,input:focus-visible,summary:focus-visible{outline:3px solid #150702!important;outline-offset:2px!important;box-shadow:0 0 0 5px #fff!important}
.cep-skip{position:fixed;left:.5rem;top:.5rem;z-index:80;padding:.55rem .9rem;background:#150702;color:#fff;font-size:.95rem;font-weight:650;text-decoration:none;transform:translateY(-150%)}
.cep-skip:focus{transform:none}
section.relative.overflow-hidden.bg-\\[var\\(--brand-light\\)\\]{background:#fff!important}
section.relative.overflow-hidden.bg-\\[var\\(--brand-light\\)\\]>.absolute.inset-x-0{display:none!important}
section.relative.overflow-hidden.bg-\\[var\\(--brand-light\\)\\]>.absolute.opacity-55{opacity:1!important;top:0!important;bottom:auto!important;height:18rem!important}
section.relative.overflow-hidden.bg-\\[var\\(--brand-light\\)\\]>.absolute.opacity-55 img{opacity:1!important;object-position:center center}
section.relative.overflow-hidden.bg-\\[var\\(--brand-light\\)\\]>.absolute.bg-gradient-to-r{top:0!important;bottom:auto!important;height:18rem!important;background-image:linear-gradient(to right,rgb(2 6 23/.78),rgb(2 6 23/.34) 38%,rgb(2 6 23/.08) 68%,transparent 84%)!important}
section.relative.overflow-hidden.bg-\\[var\\(--brand-light\\)\\]>.relative{position:relative;z-index:1;display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:0!important;width:100%!important;max-width:80rem!important;min-width:0!important;box-sizing:border-box!important;padding-top:0!important;padding-bottom:3.5rem!important}
section.relative.overflow-hidden .bg-white\\/72{display:contents!important}
section.relative.overflow-hidden .bg-white\\/72>p:first-child{order:1;background:transparent!important;box-shadow:none!important;padding:3.1rem 0 0!important;margin:0!important;border-radius:0!important;color:#fff!important;font-size:.875rem;font-weight:600;letter-spacing:0;text-transform:none}
section.relative.overflow-hidden .bg-white\\/72 h1{order:2;color:#fff!important;font-size:2.6rem;font-weight:600;letter-spacing:-.03em;line-height:1.05;margin:.4rem 0 0!important;text-shadow:0 1px 16px rgb(2 6 23/.55)}
section.relative.overflow-hidden .bg-white\\/72>p.mt-4.max-w-2xl{order:3;color:#fff!important;font-size:1.05rem;font-weight:450;line-height:1.45;margin:.65rem 0 0!important;text-shadow:0 1px 12px rgb(2 6 23/.45)}
section.relative.overflow-hidden .bg-white\\/72>div{order:4;display:flex!important;flex-direction:row!important;flex-wrap:wrap;gap:.75rem;margin:1.15rem 0 0!important}
section.relative.overflow-hidden .bg-white\\/72>div>a{border-radius:.5rem!important;box-shadow:none!important;min-height:2.5rem;padding:.55rem 1rem!important;font-size:.9rem!important;font-weight:600!important}
section.relative.overflow-hidden .bg-white\\/72>div>a:first-child{background:#d0013f!important;color:#fff!important;border:0!important}
section.relative.overflow-hidden .bg-white\\/72>div>a:last-child{background:#fff!important;color:#150702!important;border:1px solid #150702!important}
section.relative.overflow-hidden .bg-white\\/72>div>a:last-child:hover{background:#fff!important;color:#150702!important}
section.relative.overflow-hidden .bg-white\\/72>p.mt-6{order:6;color:#1e293b!important;text-shadow:none!important;margin:7.5rem 0 0!important;max-width:calc(100vw - 2.5rem)!important;font-size:1.05rem;font-weight:700!important;line-height:1.65}
section.relative.overflow-hidden .bg-white\\/72>p.text-sm{order:7;color:#475569!important;text-shadow:none!important;margin:.8rem 0 0!important}
section.relative.overflow-hidden .rounded-\\[2rem\\].border{order:8;position:relative;z-index:2;background:#fff!important;margin-top:2.25rem!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important}
@media (min-width:768px){
section.relative.overflow-hidden.bg-\\[var\\(--brand-light\\)\\]>.absolute.opacity-55,
section.relative.overflow-hidden.bg-\\[var\\(--brand-light\\)\\]>.absolute.bg-gradient-to-r{height:22rem!important}
section.relative.overflow-hidden .bg-white\\/72>p:first-child{padding-top:5.35rem!important}
section.relative.overflow-hidden .bg-white\\/72 h1{font-size:3.15rem}
section.relative.overflow-hidden .bg-white\\/72>p.mt-6{margin-top:10rem!important;max-width:40rem!important}
section.relative.overflow-hidden .rounded-\\[2rem\\].border{max-width:42rem!important}
}
</style>`

const OLD_HERO = '/website/cep/aproem/aproem-hero.jpg'
const NEW_HERO = '/website/cep/hero/aproem-hero-v2.png'
const HERO_ALT = 'Asesoría de una beca APROEM en un aula de Tenerife'

/** Swap the still life for the 1280×720 photo. The element tree stays so hydration matches. */
export function installAproemPhotoHero(html: string): string {
  if (!html.includes(OLD_HERO)) return html
  return html
    .split(`${OLD_HERO}" alt=""`).join(`${NEW_HERO}" alt="${HERO_ALT}"`)
    .split(`${OLD_HERO}\\",\\"alt\\":\\"\\"`).join(`${NEW_HERO}\\",\\"alt\\":\\"${HERO_ALT}\\"`)
    .split(OLD_HERO).join(NEW_HERO)
}

export function isAproemPublicPath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/'
  return path === '/aproem' || path === '/p/aproem'
}

export function applyAproemAccessibility(html: string, pathname: string): string {
  if (!isAproemPublicPath(pathname)) return html
  let next = html
  if (!next.includes('data-cep-aproem-a11y="1"')) {
    const block = `${APROEM_CSS}${APROEM_SKIP}`
    if (next.includes('</body>')) next = next.replace('</body>', `${block}</body>`)
    else if (next.includes('</head>')) next = next.replace('</head>', `${block}</head>`)
  }
  if (!next.includes('class="cep-skip"')) {
    next = next.replace(/<body\b[^>]*>/i, (open) => `${open}<a class="cep-skip" href="#contenido">Saltar al contenido</a>`)
  }
  if (!next.includes('id="contenido"')) {
    next = next.replace(/<main\b/i, '<main id="contenido"')
  }
  return next
}
