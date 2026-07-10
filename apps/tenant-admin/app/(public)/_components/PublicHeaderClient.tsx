'use client'

import * as React from 'react'
import { ChevronDown, Mail, Menu, Phone, X } from 'lucide-react'
import { Button } from '@payload-config/components/ui/button'

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

const COLLABORATION_MENU_ITEMS = [
  { label: 'Bolsa de empleo', href: '/empleo' },
  { label: 'Trabaja con nosotros', href: '/colabora?tipo=trabaja-con-nosotros#solicitud' },
  { label: 'Haz prácticas con nosotros', href: '/colabora?tipo=practicas-en-cep#solicitud' },
  { label: 'Imparte formación', href: '/colabora?tipo=imparte-formacion#solicitud' },
  { label: 'Empresas y proyectos', href: '/colabora?tipo=proyecto-colaborativo#solicitud' },
  { label: 'Formación para empresas', href: '/colabora?tipo=formacion-empresas#solicitud' },
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [reduceMotion, setReduceMotion] = React.useState(false)
  const lastScrollYRef = React.useRef(0)
  const rafRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const mobileMedia = window.matchMedia('(max-width: 1023px)')

    const ensureHeaderVisibleWhenNeeded = () => {
      if (window.scrollY < TOP_VISIBLE_THRESHOLD || mobileMedia.matches) {
        setIsVisible(true)
      }
    }

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPreference = () => setReduceMotion(media.matches)
    updateMotionPreference()
    media.addEventListener('change', updateMotionPreference)
    mobileMedia.addEventListener('change', ensureHeaderVisibleWhenNeeded)

    lastScrollYRef.current = window.scrollY
    ensureHeaderVisibleWhenNeeded()

    const onScroll = () => {
      if (rafRef.current !== null) return

      rafRef.current = window.requestAnimationFrame(() => {
        const currentY = window.scrollY
        const delta = currentY - lastScrollYRef.current

        if (currentY < TOP_VISIBLE_THRESHOLD) {
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
    window.addEventListener('resize', ensureHeaderVisibleWhenNeeded)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', ensureHeaderVisibleWhenNeeded)
      media.removeEventListener('change', updateMotionPreference)
      mobileMedia.removeEventListener('change', ensureHeaderVisibleWhenNeeded)
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const transitionClass = reduceMotion
    ? ''
    : 'transition-transform duration-300 ease-out'

  const supportEmail = isCepTenant ? 'info@cepformacion.com' : 'hola@akademate.com'

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur ${transitionClass} ${
        isVisible || isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'
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
            <div className="group relative">
              <a
                href="/p/cursos"
                className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 brand-hover transition-colors"
              >
                Cursos
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </a>
              <div className="invisible absolute left-0 top-full z-50 w-64 translate-y-2 rounded-2xl border border-slate-200 bg-white p-2 opacity-0 shadow-xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                {COURSE_MENU_ITEMS.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
            <a href="/p/ciclos" className="text-sm font-medium text-gray-600 brand-hover transition-colors">
              Ciclos
            </a>
            <a href="/convocatorias" className="text-sm font-medium text-gray-600 brand-hover transition-colors">
              Convocatorias
            </a>
            <a href="/#nuevas-formaciones" className="text-sm font-medium text-gray-600 brand-hover transition-colors">
              Nuevas formaciones
            </a>
            <a href="/quienes-somos" className="text-sm font-medium text-gray-600 brand-hover transition-colors">
              Quiénes somos
            </a>
            <a href="/aproem" className="text-sm font-medium text-gray-600 brand-hover transition-colors">
              APROEM
            </a>
            <div className="group relative">
              <a
                href="/colabora"
                className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 brand-hover transition-colors"
              >
                Colabora
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </a>
              <div className="invisible absolute right-0 top-full z-50 w-72 translate-y-2 rounded-2xl border border-slate-200 bg-white p-2 opacity-0 shadow-xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                {COLLABORATION_MENU_ITEMS.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
            <a href="/blog" className="text-sm font-medium text-gray-600 brand-hover transition-colors">
              Blog
            </a>
            <a
              href="/p/contacto"
              className="text-sm font-medium brand-btn px-3 py-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: brandColor, color: '#fff' }}
            >
              Contacto
            </a>
          </nav>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden text-gray-600"
            aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-controls="public-mobile-menu"
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((current) => !current)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
          </Button>
        </div>
      </div>
      {isMobileMenuOpen ? (
        <div id="public-mobile-menu" className="border-t border-slate-200 bg-white shadow-lg lg:hidden">
          <nav className="mx-auto max-w-7xl px-4 py-4 sm:px-6" aria-label="Navegación móvil">
            <div className="grid gap-2">
              <div className="rounded-2xl bg-slate-50 p-2">
                <a
                  href="/p/cursos"
                  className="block rounded-xl px-3 py-3 text-sm font-black text-slate-950 transition hover:bg-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Cursos
                </a>
                <div className="grid gap-1">
                  {COURSE_MENU_ITEMS.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-slate-950"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
              <a
                href="/p/ciclos"
                className="rounded-xl px-3 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Ciclos
              </a>
              <a
                href="/convocatorias"
                className="rounded-xl px-3 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Convocatorias
              </a>
              <a
                href="/#nuevas-formaciones"
                className="rounded-xl px-3 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Nuevas formaciones
              </a>
              <a
                href="/quienes-somos"
                className="rounded-xl px-3 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Quiénes somos
              </a>
              <a
                href="/aproem"
                className="rounded-xl px-3 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                APROEM
              </a>
              <div className="rounded-2xl bg-slate-50 p-2">
                <a
                  href="/colabora"
                  className="block rounded-xl px-3 py-3 text-sm font-black text-slate-950 transition hover:bg-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Colabora
                </a>
                <div className="grid gap-1">
                  {COLLABORATION_MENU_ITEMS.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-slate-950"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
              <a
                href="/blog"
                className="rounded-xl px-3 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Blog
              </a>
              <div className="grid gap-2 border-t border-slate-200 pt-3">
                {phone1 ? (
                  <a
                    href={`tel:${phone1.replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    {phone1}
                  </a>
                ) : null}
                {phone2 ? (
                  <a
                    href={`tel:${phone2.replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    {phone2}
                  </a>
                ) : null}
                <a
                  href="/p/contacto"
                  className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-black text-white transition hover:opacity-90"
                  style={{ backgroundColor: brandColor }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Contacto
                </a>
              </div>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
