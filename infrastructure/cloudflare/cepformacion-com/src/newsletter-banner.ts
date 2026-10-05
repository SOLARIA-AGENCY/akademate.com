const NEWSLETTER_PATH = /^\/(?:p\/)?(?:cursos|convocatorias|sedes|quienes-somos|colabora)(?:\/|$)/

export function showsNewsletterBanner(pathname: string): boolean {
  const withoutHash = pathname.split('#')[0] ?? pathname
  const withoutQuery = withoutHash.split('?')[0] ?? withoutHash
  const path = withoutQuery.replace(/\/+$/, '') || '/'
  if (path === '/' || path === '/p') return true
  return NEWSLETTER_PATH.test(path)
}

const NEWSLETTER_HTML = `<section data-cep-newsletter="1" class="cep-news" aria-label="Boletín">
<style>
.cep-news{position:relative;isolation:isolate;min-height:32rem;overflow:hidden;color:#fff;background:#150702}
.cep-news-photo{position:absolute;inset:0;z-index:0;width:100%;height:100%;object-fit:cover;object-position:72% center}
.cep-news-veil{position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,rgba(21,7,2,.94) 0%,rgba(21,7,2,.78) 38%,rgba(21,7,2,.28) 68%,rgba(21,7,2,.18) 100%)}
.cep-news-inner{position:relative;z-index:2;width:min(100% - 3rem,70rem);min-height:32rem;margin:0 auto;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(16rem,22rem);gap:2.5rem;align-items:center}
.cep-news h2{margin:0 0 .7rem;font-size:clamp(2rem,4vw,3.25rem);line-height:1.05;font-weight:700;color:#fff}
.cep-news-kicker{margin:0 0 .8rem;font-size:.95rem;font-weight:700;color:#f2014b}
.cep-news-copy{margin:0;max-width:34rem;font-size:1.05rem;line-height:1.5;color:#f3f1f0}
.cep-news form{display:flex;flex-direction:column;align-items:flex-start;gap:.75rem;margin:0;padding:1.25rem;background:#fff;color:#150702;border-radius:1.25rem}
.cep-news input[type=email]{width:100%;box-sizing:border-box;background:#f3f1f0;color:#150702;border:0;border-radius:999px;padding:.8rem 1rem;font:inherit}
.cep-news button{width:auto;background:#f2014b;color:#fff;border:0;border-radius:999px;padding:.75rem 1.2rem;font:inherit;font-weight:700;cursor:pointer}
.cep-news button:disabled{opacity:.7;cursor:wait}
.cep-news-consent{display:flex;gap:.45rem;align-items:flex-start;font-size:.8rem;line-height:1.35;color:#3f3a38}
.cep-news-consent a{color:#9d1238}
.cep-news-note{min-height:1.1rem;margin:0;font-size:.8rem;color:#150702}
section.bg-slate-950.text-white:has([class*="0.9fr_1.1fr"]){position:relative;isolation:isolate;background:#150702}
section.bg-slate-950.text-white:has([class*="0.9fr_1.1fr"])::before{content:"";position:absolute;inset:0;z-index:0;background:url("/website/cep/newsletter/recepcion-vacia.jpg") 70% center/cover no-repeat}
section.bg-slate-950.text-white:has([class*="0.9fr_1.1fr"])::after{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,rgba(21,7,2,.9) 0%,rgba(21,7,2,.55) 42%,rgba(21,7,2,.28) 100%)}
section.bg-slate-950.text-white:has([class*="0.9fr_1.1fr"]) > *{position:relative;z-index:2}
@media (max-width:800px){
  .cep-news,.cep-news-inner{min-height:0}
  .cep-news-inner{grid-template-columns:1fr;padding:2.5rem 0}
  .cep-news-veil{background:linear-gradient(180deg,rgba(21,7,2,.88),rgba(21,7,2,.62))}
  .cep-news-photo{object-position:center 20%}
  section.bg-slate-950.text-white:has([class*="0.9fr_1.1fr"])::after{background:linear-gradient(180deg,rgba(21,7,2,.9),rgba(21,7,2,.68))}
}
</style>
<img class="cep-news-photo" src="/website/cep/newsletter/tenerife.jpg" alt="">
<div class="cep-news-veil"></div>
<div class="cep-news-inner">
<div>
<p class="cep-news-kicker">Boletín CEP</p>
<h2>Suscríbete y recibe la oferta del mes</h2>
<p class="cep-news-copy">Cursos, fechas de inicio y matrícula abierta en Tenerife. Un correo al mes.</p>
</div>
<form>
<label class="sr-only" for="cep-news-email">Email</label>
<input id="cep-news-email" type="email" name="email" required autocomplete="email" placeholder="Tu email">
<button type="submit">Quiero suscribirme</button>
<label class="cep-news-consent"><input type="checkbox" name="consent" required> Acepto recibir el newsletter y he leído la <a href="/legal/privacidad">política de privacidad</a>.</label>
<p class="cep-news-note" data-cep-news-note role="status"></p>
</form>
</div>
</section>
<script data-cep-newsletter-keep="1">
(function(){
  var source=document.querySelector('[data-cep-newsletter="1"]');
  var template=source?source.cloneNode(true):null;
  function bind(root){
    var form=root.querySelector('form');
    if(!form||form.getAttribute('data-cep-bound')) return;
    form.setAttribute('data-cep-bound','1');
    form.addEventListener('submit',function(event){
    event.preventDefault();
    var email=form.querySelector('input[type=email]');
    var consent=form.querySelector('input[type=checkbox]');
    var note=form.querySelector('[data-cep-news-note]');
    var button=form.querySelector('button');
    if(!email||!consent||!note||!button||!email.value.trim()||!consent.checked){
      note.textContent='Escribe el email y acepta el envío.';
      return;
    }
    button.disabled=true;
    note.textContent='Guardando…';
    fetch('/api/leads',{
      method:'POST',
      headers:{'content-type':'application/json','accept':'application/json'},
      body:JSON.stringify({
        email:email.value.trim(),
        gdpr_consent:true,
        privacy_policy_accepted:true,
        marketing_consent:true,
        consent_timestamp:new Date().toISOString(),
        source_form:'newsletter',
        lead_type:'newsletter',
        source_page:location.pathname,
        path:location.pathname,
        utm_source:'cepformacion',
        utm_medium:'newsletter',
        notes:'Suscripción al newsletter'
      })
    }).then(function(res){
      return res.json().catch(function(){return {};}).then(function(data){return {ok:res.ok,data:data};});
    }).then(function(result){
      if(!result.ok) throw new Error('fail');
      note.textContent=result.data&&result.data.already?'Este email ya está en la lista.':'Listo. Te escribimos cuando salga el newsletter.';
      email.value='';
      consent.checked=false;
    }).catch(function(){
      note.textContent='No se pudo guardar. Inténtalo de nuevo.';
    }).finally(function(){button.disabled=false;});
    });
  }
  var anchorCache=null;
  function leadNode(){
    if(anchorCache&&anchorCache.isConnected) return anchorCache;
    var heads=document.querySelectorAll('h2');
    for(var i=0;i<heads.length;i++){
      if((heads[i].textContent||'').replace(/\\s+/g,' ').trim()!=='Solicita información') continue;
      var node=heads[i];
      while(node.parentElement){
        if(node.tagName==='SECTION' && (node.className||'').indexOf('bg-slate-950')>=0){ anchorCache=node; return node; }
        node=node.parentElement;
      }
    }
    return null;
  }
  function sedesNode(){
    var heads=document.querySelectorAll('h2');
    for(var i=0;i<heads.length;i++){
      if((heads[i].textContent||'').replace(/\\s+/g,' ').trim()!=='Nuestras sedes') continue;
      var node=heads[i];
      while(node.parentElement){
        if(node.tagName==='SECTION') return node;
        node=node.parentElement;
      }
    }
    return null;
  }
  function isHome(){
    var path=location.pathname.replace(/\\/+$/,'')||'/';
    return path==='/'||path==='/p';
  }
  function placeAfterSedes(live){
    var sedes=sedesNode();
    if(!sedes||!sedes.parentNode||sedes.nextElementSibling===live) return;
    sedes.parentNode.insertBefore(live, sedes.nextSibling);
  }
  function mount(anchor, before){
    if(!anchor||!anchor.parentNode||!template) return;
    var fresh=template.cloneNode(true);
    var form=fresh.querySelector('form');
    if(form) form.removeAttribute('data-cep-bound');
    if(before) anchor.parentNode.insertBefore(fresh, anchor);
    else anchor.parentNode.insertBefore(fresh, anchor.nextSibling);
    bind(fresh);
  }
  function ensure(){
    var home=isHome();
    var live=document.querySelector('[data-cep-newsletter="1"]');
    if(live){
      if(home) placeAfterSedes(live);
      bind(live);
      return;
    }
    if(home){
      var sedes=sedesNode();
      if(sedes){ mount(sedes, false); return; }
    }
    mount(leadNode()||document.querySelector('footer'), true);
  }
  function arm(){
    if(!document.body) return;
    ensure();
    var until=0;
    function tick(){
      var live=document.querySelector('[data-cep-newsletter="1"]');
      var sedes=isHome()?sedesNode():null;
      if(!live||(sedes&&sedes.nextElementSibling!==live)) ensure();
      if(!until&&document.readyState==='complete') until=Date.now()+5000;
      if(!until||Date.now()<until) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if(document.body) arm();
  else document.addEventListener('DOMContentLoaded', arm);
})();
</script>`

export function isNewsletterAssetPath(pathname: string): boolean {
  return pathname === '/website/cep/newsletter/tenerife.jpg' || pathname === '/website/cep/newsletter/recepcion-vacia.jpg'
}

function sectionEnd(html: string, start: number): number {
  const re = /<\/?section\b[^>]*>/gi
  re.lastIndex = start
  let depth = 0
  let match: RegExpExecArray | null
  while ((match = re.exec(html))) {
    if (match[0].startsWith('</')) {
      depth -= 1
      if (depth === 0) return match.index + match[0].length
    } else {
      depth += 1
    }
  }
  return -1
}

export function injectNewsletterBanner(html: string, pathname: string): string {
  if (!showsNewsletterBanner(pathname)) return html
  if (html.includes('data-cep-newsletter="1"')) return html
  const path = (pathname.split('?')[0] ?? pathname).replace(/\/+$/, '') || '/'
  if (path === '/' || path === '/p') {
    const heading = html.search(/<(h1|h2)[^>]*>\s*Nuestras sedes\s*<\/\1>/i)
    const section = heading >= 0 ? html.lastIndexOf('<section', heading) : -1
    const end = section >= 0 ? sectionEnd(html, section) : -1
    if (end >= 0) return `${html.slice(0, end)}${NEWSLETTER_HTML}${html.slice(end)}`
  }
  const footer = html.search(/<footer\b/i)
  if (footer < 0) return html
  return `${html.slice(0, footer)}${NEWSLETTER_HTML}${html.slice(footer)}`
}
