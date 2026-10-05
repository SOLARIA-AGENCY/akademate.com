'use client'

import * as React from 'react'
import { ChevronDown, Mail, Phone } from 'lucide-react'

type PublicHeaderClientProps = {
  brandColor: string
  tenantName: string
  logoUrl: string
  phone1: string
  phone2: string
  isCepTenant: boolean
}

const SCROLL_DELTA_THRESHOLD = 12
const TOP_VISIBLE_THRESHOLD = 24

const COURSE_MENU_ITEMS = [
  { label: 'Cursos privados', href: '/p/cursos?tipo=privados' },
  { label: 'Cursos para ocupados', href: '/p/cursos?tipo=ocupados' },
  { label: 'Cursos para desempleados', href: '/p/cursos?tipo=desempleados' },
  { label: 'Teleformación', href: '/p/cursos?tipo=teleformacion' },
]

const COLABORA_MENU_ITEMS = [
  { label: 'Bolsa de trabajo', href: '/empleo' },
  { label: 'Trabaja con nosotros', href: '/colabora?tipo=trabaja-con-nosotros' },
  { label: 'Haz prácticas con nosotros', href: '/colabora?tipo=practicas-en-cep' },
  { label: 'Imparte formación', href: '/colabora?tipo=imparte-formacion' },
  { label: 'Empresas y proyectos', href: '/colabora?tipo=proyecto-colaborativo' },
  { label: 'Formación para empresas', href: '/colabora?tipo=formacion-empresas' },
]

type NavItem = {
  label: string
  href: string
  children?: Array<{ label: string; href: string }>
  cta?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Cursos', href: '/p/cursos', children: COURSE_MENU_ITEMS },
  { label: 'Ciclos', href: '/p/ciclos' },
  { label: 'Convocatorias', href: '/convocatorias' },
  { label: 'Quiénes somos', href: '/quienes-somos' },
  { label: 'Colabora', href: '/colabora', children: COLABORA_MENU_ITEMS },
  { label: 'Bolsa de trabajo', href: '/empleo' },
  { label: 'Campus', href: '/campus', cta: true },
]

export function PublicHeaderClient({
  brandColor,
  tenantName,
  logoUrl,
  phone1,
  phone2,
  isCepTenant,
}: PublicHeaderClientProps) {
  const [isVisible, setIsVisible] = React.useState(true)
  const [reduceMotion, setReduceMotion] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [openSection, setOpenSection] = React.useState<string | null>(null)
  const lastScrollYRef = React.useRef(0)
  const rafRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPreference = () => setReduceMotion(media.matches)
    updateMotionPreference()
    media.addEventListener('change', updateMotionPreference)

    lastScrollYRef.current = window.scrollY

    const onScroll = () => {
      if (rafRef.current !== null) return

      rafRef.current = window.requestAnimationFrame(() => {
        const currentY = window.scrollY
        const delta = currentY - lastScrollYRef.current

        if (mobileOpen || currentY < TOP_VISIBLE_THRESHOLD) {
          setIsVisible(true)
        } else if (delta > SCROLL_DELTA_THRESHOLD) {
          setIsVisible(false)
        } else if (delta < -SCROLL_DELTA_THRESHOLD) {
          setIsVisible(true)
        }

        lastScrollYRef.current = currentY
        rafRef.current = null
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      media.removeEventListener('change', updateMotionPreference)
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
      }
    }
  }, [mobileOpen])

  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const transitionClass = reduceMotion
    ? ''
    : 'transition-transform duration-300 ease-out'

  const supportEmail = isCepTenant ? 'info@cepformacion.com' : 'hello@akademate.com'

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur ${transitionClass} ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="hidden md:block text-white" style={{ backgroundColor: brandColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-8 items-center justify-end gap-5 text-xs font-medium">
            {phone1 && (
              <a
                href={`tel:${phone1.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity"
              >
                <Phone className="h-3 w-3" />
                {phone1}
              </a>
            )}
            {phone2 && (
              <a
                href={`tel:${phone2.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity"
              >
                <Phone className="h-3 w-3" />
                {phone2}
              </a>
            )}
            <a href="/p/contacto" className="inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity">
              <Mail className="h-3 w-3" />
              {supportEmail}
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 sm:h-14">
          <a href="/" className="flex items-center">
            <img src={logoUrl} alt={tenantName} className="h-8 w-auto sm:h-9 object-contain" />
          </a>
          <nav className="hidden lg:flex items-center gap-3">
            {NAV_ITEMS.map((item) =>
              item.children ? (
                <div key={item.label} className="group relative">
                  <a
                    href={item.href}
                    className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 brand-hover transition-colors"
                  >
                    {item.label}
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </a>
                  <div className="invisible absolute left-0 top-full z-50 w-64 translate-y-2 rounded-2xl border border-slate-200 bg-white p-2 opacity-0 shadow-xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                    {item.children.map((child) => (
                      <a
                        key={child.href}
                        href={child.href}
                        className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className={
                    item.cta
                      ? 'text-sm font-medium brand-btn px-3 py-1.5 rounded-lg transition-colors'
                      : 'text-sm font-medium text-gray-600 brand-hover transition-colors'
                  }
                  style={item.cta ? { backgroundColor: brandColor, color: '#fff' } : undefined}
                >
                  {item.label}
                </a>
              ),
            )}
          </nav>
          <button
            type="button"
            className="lg:hidden p-2 text-gray-600"
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-controls="public-mobile-menu"
            aria-expanded={mobileOpen}
            onClick={() => {
              setMobileOpen((current) => !current)
              setOpenSection(null)
            }}
          >
            {mobileOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
      {mobileOpen ? (
        <div
          id="public-mobile-menu"
          className="lg:hidden overflow-y-auto overscroll-contain bg-white"
          style={{ maxHeight: 'calc(100dvh - 3rem)', WebkitOverflowScrolling: 'touch' }}
        >
          <nav className="flex flex-col px-4 pb-8 pt-2" aria-label="Menú móvil">
            {NAV_ITEMS.map((item) =>
              item.children ? (
                <div key={item.label} className="border-b border-[#eadadd]">
                  <button
                    type="button"
                    className="flex min-h-12 w-full items-center justify-between py-3 text-left text-base font-semibold text-[#3E091A]"
                    aria-expanded={openSection === item.label}
                    onClick={() => setOpenSection((current) => (current === item.label ? null : item.label))}
                  >
                    {item.label}
                    <ChevronDown
                      className={`h-4 w-4 transition ${openSection === item.label ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                  {openSection === item.label ? (
                    <div className="flex flex-col gap-1 pb-3 pl-2">
                      {item.children.map((child) => (
                        <a
                          key={child.href}
                          href={child.href}
                          className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700"
                          onClick={() => setMobileOpen(false)}
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className={
                    item.cta
                      ? 'mt-4 inline-flex min-h-12 items-center justify-center rounded-xl text-base font-semibold text-white'
                      : 'flex min-h-12 items-center border-b border-[#eadadd] py-3 text-base font-semibold text-[#3E091A]'
                  }
                  style={item.cta ? { backgroundColor: brandColor } : undefined}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </a>
              ),
            )}
          </nav>
        </div>
      ) : null}
    </header>
  )
}
