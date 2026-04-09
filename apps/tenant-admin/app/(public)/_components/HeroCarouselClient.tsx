'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { WebsiteSection } from '@/app/lib/website/types'

type HeroCarouselSection = Extract<WebsiteSection, { kind: 'heroCarousel' }>

export function HeroCarouselClient({
  section,
  brandColor,
}: {
  section: HeroCarouselSection
  brandColor: string
}) {
  const defaultSlides = useMemo(
    () => [
      { image: '/website/cep/hero/slideshow-1.jpg', alt: 'Creemos en el poder de la actitud' },
      { image: '/website/cep/hero/slideshow-2.jpg', alt: 'Creemos en ti' },
      { image: '/website/cep/hero/slideshow-3.jpg', alt: 'El momento es ahora' },
    ],
    []
  )
  const slides = useMemo(
    () => (section.slides?.length ? section.slides : defaultSlides),
    [defaultSlides, section.slides]
  )
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) return
    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => window.clearInterval(interval)
  }, [slides.length])

  const activeSlide = slides[activeIndex] || slides[0]

  return (
    <section className="relative overflow-hidden bg-[#140816] text-white">
      <div className="absolute inset-0">
        <img src={activeSlide.image} alt={activeSlide.alt} className="h-full w-full object-cover transition-opacity duration-700" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/35" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-3xl">
          {section.eyebrow ? (
            <span
              className="mb-6 inline-flex rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em]"
              style={{ backgroundColor: brandColor }}
            >
              {section.eyebrow}
            </span>
          ) : null}
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            {section.title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/80 sm:text-lg">{section.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            {section.primaryCta ? (
              <Link
                href={section.primaryCta.href}
                className="rounded-full px-6 py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: brandColor }}
              >
                {section.primaryCta.label}
              </Link>
            ) : null}
            {section.secondaryCta ? (
              <Link
                href={section.secondaryCta.href}
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm"
              >
                {section.secondaryCta.label}
              </Link>
            ) : null}
          </div>
          {slides.length > 1 ? (
            <div className="mt-8 flex items-center gap-2">
              {slides.map((slide, index) => (
                <button
                  key={`${slide.image}-${index}`}
                  type="button"
                  aria-label={`Ver slide ${index + 1}`}
                  className={`h-2.5 rounded-full transition-all ${index === activeIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/70'}`}
                  onClick={() => setActiveIndex(index)}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
