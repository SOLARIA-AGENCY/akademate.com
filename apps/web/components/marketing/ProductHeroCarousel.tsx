'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { CheckCircle2, Globe2, GraduationCap, LayoutDashboard } from 'lucide-react'
import { useLocale } from '@/components/i18n/locale-provider'
import { getHomeExperienceContent } from '@/lib/home-experience-i18n'

const icons = [LayoutDashboard, Globe2, GraduationCap] as const

export function ProductHeroCarousel() {
  const locale = useLocale()
  const { productHero } = getHomeExperienceContent(locale)
  const slides = productHero.slides
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return
    const timer = window.setInterval(
      () => setActiveIndex((current) => (current + 1) % slides.length),
      6500
    )
    return () => window.clearInterval(timer)
  }, [])

  const active = slides[activeIndex]
  if (!active) return null
  const ActiveIcon = icons[activeIndex] ?? LayoutDashboard

  return (
    <div
      className="product-hero-visual"
      aria-roledescription={productHero.carouselRoleDescription}
      aria-label={productHero.carouselLabel}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[#071633] shadow-[0_34px_100px_rgba(2,12,34,.45)]">
        {slides.map((slide, index) => (
          <Image
            key={slide.id}
            src={slide.image}
            alt={slide.alt}
            fill
            priority={index === 0}
            sizes="(max-width: 1024px) 100vw, 58vw"
            className={`object-cover transition duration-700 ease-out motion-reduce:transition-none ${index === activeIndex ? 'scale-100 opacity-100' : 'pointer-events-none scale-[1.015] opacity-0'}`}
          />
        ))}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#031027]/95 via-[#031027]/45 to-transparent px-5 pb-5 pt-20 text-white sm:px-7 sm:pb-7">
          <div className="flex max-w-xl items-start gap-3">
            <ActiveIcon
              className="mt-1 h-5 w-5 shrink-0 text-blue-300"
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold">{active.title}</p>
              <p className="mt-1 text-sm leading-6 text-blue-100/75">{active.text}</p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="mt-4 grid gap-2 sm:grid-cols-3"
        role="tablist"
        aria-label={productHero.tabsLabel}
      >
        {slides.map((slide, index) => {
          const Icon = icons[index] ?? LayoutDashboard
          const selected = index === activeIndex
          return (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveIndex(index)}
              className={`flex min-h-12 items-center justify-between rounded-xl border px-4 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${selected ? 'border-blue-400 bg-white text-[#071633]' : 'border-white/15 bg-white/[.06] text-blue-100/70 hover:bg-white/10 hover:text-white'}`}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" aria-hidden="true" />
                {slide.label}
              </span>
              {selected ? (
                <CheckCircle2 className="h-4 w-4 text-blue-500" aria-hidden="true" />
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
