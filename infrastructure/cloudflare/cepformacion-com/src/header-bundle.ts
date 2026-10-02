const DESKTOP_APROEM =
  ',(0,a.jsx)("a",{href:"/aproem",className:"text-sm font-medium text-gray-600 brand-hover transition-colors",children:"APROEM"})'
const MOBILE_APROEM =
  ',(0,a.jsx)("a",{href:"/aproem",className:"rounded-xl px-3 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50",onClick:()=>y(!1),children:"APROEM"})'
const DESKTOP_CAMPUS_VIRTUAL =
  ',(0,a.jsx)("a",{href:u.Qq,target:"_self",className:"text-sm font-medium text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors hover:bg-gray-50",children:"Campus Virtual"})'
const MOBILE_CAMPUS_VIRTUAL =
  ',(0,a.jsx)("a",{href:u.Qq,target:"_self",className:"rounded-xl px-3 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50",onClick:()=>y(!1),children:"Campus Virtual"})'
const DESKTOP_CONTACTO =
  'href:"/p/contacto",className:"text-sm font-medium brand-btn px-3 py-1.5 rounded-lg transition-colors",style:{backgroundColor:t,color:"#fff"},children:"Contacto"'
const DESKTOP_CAMPUS =
  'href:"/campus",className:"text-sm font-medium brand-btn px-3 py-1.5 rounded-lg transition-colors",style:{backgroundColor:t,color:"#fff"},children:"Ver campus"'
const MOBILE_CONTACTO =
  'href:"/p/contacto",className:"inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-black text-white transition hover:opacity-90",style:{backgroundColor:t},onClick:()=>y(!1),children:"Contacto"'
const MOBILE_CAMPUS =
  'href:"/campus",className:"inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-black text-white transition hover:opacity-90",style:{backgroundColor:t},onClick:()=>y(!1),children:"Ver campus"'
const BOLSA_BUTTON =
  '(0,a.jsx)("a",{href:"/empleo",className:"text-sm font-medium text-gray-600 brand-hover transition-colors",children:"Bolsa de trabajo"})'

export function isHeaderBundle(source: string): boolean {
  return source.includes('PublicHeaderClient') && source.includes('children:"APROEM"')
}

/** Make the React header render the live menu, so hydration does not repaint it. */
export function rewriteHeaderBundle(source: string): string {
  if (!isHeaderBundle(source)) return source
  let next = source
    .split('{label:"Cursos para ocupados"').join('{label:"Cursos para trabajadores/as ocupados/as"')
    .split('{label:"Cursos para desempleados"').join('{label:"Cursos para trabajadores/as desempleados/as"')
  next = next.split('children:"Acceso campus"').join('children:"Ver campus"')
  if (next.includes('children:"Ver campus"') && !next.includes('children:"Contacto"')) return next
  next = next.split(DESKTOP_APROEM).join('')
  next = next.split(MOBILE_APROEM).join('')
  next = next.split(DESKTOP_CAMPUS_VIRTUAL).join('')
  next = next.split(MOBILE_CAMPUS_VIRTUAL).join('')
  next = next.replace(/\{label:"Bolsa de empleo",href:"\/empleo"\}/g, '')
  next = next.replace(/\{label:"Bolsa de trabajo",href:"\/empleo"\}/g, '')
  next = next.split(`,${BOLSA_BUTTON}`).join('').split(`${BOLSA_BUTTON},`).join('')
  const desktopButton = `(0,a.jsx)("a",{${DESKTOP_CONTACTO}})`
  const campusButton = `(0,a.jsx)("a",{${DESKTOP_CAMPUS}})`
  if (next.includes(desktopButton)) {
    next = next.replace(desktopButton, campusButton)
  }
  next = next.split(MOBILE_CONTACTO).join(MOBILE_CAMPUS)
  return next
}

export function rewriteHeaderScriptSrc(html: string): string {
  return html.replace(
    /\/_next\/static\/chunks\/app\/\(public\)\/layout-[a-z0-9]+\.js(?:\?cep-nav=1)?(?!\?cep-nav=2)/g,
    (src) => `${src.replace(/\?cep-nav=1$/, '')}?cep-nav=2`,
  )
}
