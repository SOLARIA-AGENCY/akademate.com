'use client'

import * as React from 'react'
import { Mail, Phone } from 'lucide-react'

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

    return () => {
      window.removeEventListener('scroll', onScroll)
      media.removeEventListener('change', updateMotionPreference)
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  const transitionClass = reduceMotion
    ? ''
    : 'transition-transform duration-300 ease-out'

  const supportEmail = isCepTenant ? 'info@cepformacion.com' : 'hola@akademate.com'

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
            <a href="/quienes-somos" className="text-sm font-medium text-gray-600 brand-hover transition-colors">
              Quiénes somos
            </a>
            <a href="/p/ciclos" className="text-sm font-medium text-gray-600 brand-hover transition-colors">
              Ciclos FP
            </a>
            <a
              href="/p/cursos?tipo=privados"
              className="text-sm font-medium text-gray-600 brand-hover transition-colors"
            >
              Privados
            </a>
            <a
              href="/p/cursos?tipo=desempleados"
              className="text-sm font-medium text-gray-600 brand-hover transition-colors"
            >
              Desempleados
            </a>
            <a
              href="/p/cursos?tipo=ocupados"
              className="text-sm font-medium text-gray-600 brand-hover transition-colors"
            >
              Ocupados
            </a>
            <a
              href="/p/cursos?tipo=teleformacion"
              className="text-sm font-medium text-gray-600 brand-hover transition-colors"
            >
              Teleformación
            </a>
            <a href="/#nuevas-formaciones" className="text-sm font-medium text-gray-600 brand-hover transition-colors">
              Nuevas formaciones
            </a>
            <a href="/p/convocatorias" className="text-sm font-medium text-gray-600 brand-hover transition-colors">
              Convocatorias
            </a>
            <a
              href="/p/contacto"
              className="text-sm font-medium brand-btn px-3 py-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: brandColor, color: '#fff' }}
            >
              Contacto
            </a>
          </nav>
          <button className="lg:hidden p-2 text-gray-600" aria-label="Menu">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
