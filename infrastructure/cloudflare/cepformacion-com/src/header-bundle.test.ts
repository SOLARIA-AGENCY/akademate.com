import { describe, expect, it } from 'vitest'
import { rewriteHeaderBundle, rewriteHeaderScriptSrc } from './header-bundle'

const bundle = `PublicHeaderClient:()=>h;let m=[{label:"Cursos privados",href:"/p/cursos?tipo=privados"}],p=[{label:"Bolsa de empleo",href:"/empleo"}];,(0,a.jsx)("a",{href:"/aproem",className:"text-sm font-medium text-gray-600 brand-hover transition-colors",children:"APROEM"}),(0,a.jsx)("a",{href:u.Qq,target:"_self",className:"text-sm font-medium text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors hover:bg-gray-50",children:"Campus Virtual"}),(0,a.jsx)("a",{href:"/p/contacto",className:"text-sm font-medium brand-btn px-3 py-1.5 rounded-lg transition-colors",style:{backgroundColor:t,color:"#fff"},children:"Contacto"}),(0,a.jsx)("a",{href:"/aproem",className:"rounded-xl px-3 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50",onClick:()=>y(!1),children:"APROEM"}),(0,a.jsx)("a",{href:u.Qq,target:"_self",className:"rounded-xl px-3 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50",onClick:()=>y(!1),children:"Campus Virtual"}),(0,a.jsx)("a",{href:"/p/contacto",className:"inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-black text-white transition hover:opacity-90",style:{backgroundColor:t},onClick:()=>y(!1),children:"Contacto"})`

describe('rewriteHeaderBundle', () => {
  it('renders the current menu from the React header', () => {
    const next = rewriteHeaderBundle(bundle)
    expect(next).not.toContain('APROEM')
    expect(next).not.toContain('Campus Virtual')
    expect(next).not.toContain('Bolsa de empleo')
    expect(next).not.toContain('Bolsa de trabajo')
    expect(next).not.toContain('href:"/empleo"')
    expect(next).toContain('href:"/campus"')
    expect(next).toContain('children:"Ver campus"')
    expect(next).not.toContain('children:"Contacto"')
    expect(rewriteHeaderBundle(next)).toBe(next)
  })

  it('busts the layout chunk url once', () => {
    const html = '<script src="/_next/static/chunks/app/(public)/layout-abc.js"></script>'
    const once = rewriteHeaderScriptSrc(html)
    expect(once).toContain('layout-abc.js?cep-nav=2')
    expect(rewriteHeaderScriptSrc(once)).toBe(once)
  })
})
