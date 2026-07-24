'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'

export type OpenConvocationCard = {
  id: string
  href: string
  title: string
  imageUrl: string | null
  badge: { label: string; bgColor: string; textColor: string } | null
  enrollmentLabel: string
  startDateLabel: string
  campusLabel: string
  scheduleLabel: string
  priceLabel: string
  areaColor: string
}

export function OpenConvocationsCarouselClient({
  cards,
  brandColor,
}: {
  cards: OpenConvocationCard[]
  brandColor: string
}) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(cards.length > 1)

  const updateNavigation = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    setCanGoBack(track.scrollLeft > 4)
    setCanGoForward(track.scrollLeft + track.clientWidth < track.scrollWidth - 4)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    updateNavigation()
    const observer = new ResizeObserver(updateNavigation)
    observer.observe(track)
    track.addEventListener('scroll', updateNavigation, { passive: true })
    return () => {
      observer.disconnect()
      track.removeEventListener('scroll', updateNavigation)
    }
  }, [cards.length, updateNavigation])

  const move = useCallback((direction: -1 | 1) => {
    const track = trackRef.current
    if (!track) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    track.scrollBy({
      left: direction * track.clientWidth,
      behavior: reducedMotion ? 'auto' : 'smooth',
    })
  }, [])

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      move(-1)
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      move(1)
    }
  }

  if (cards.length === 0) return null

  return (
    <div className="mt-10">
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-white/70">
          {cards.length}{' '}
          {cards.length === 1 ? 'convocatoria disponible' : 'convocatorias disponibles'}
        </p>
        <div className="flex gap-2" aria-label="Controles del carrusel">
          <button
            type="button"
            onClick={() => move(-1)}
            disabled={!canGoBack}
            aria-label="Ver convocatorias anteriores"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            disabled={!canGoForward}
            aria-label="Ver más convocatorias"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        role="region"
        aria-label="Convocatorias abiertas"
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-950 [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((card) => (
          <Link
            key={card.id}
            href={card.href}
            className="group flex min-w-0 shrink-0 basis-full snap-start flex-col overflow-hidden rounded-3xl border bg-white transition hover:-translate-y-1 hover:shadow-2xl md:basis-[calc((100%_-_1.5rem)/2)] xl:basis-[calc((100%_-_3rem)/3)]"
            style={{ borderColor: card.areaColor }}
          >
            <div className="relative h-44 shrink-0 overflow-hidden">
              {card.imageUrl ? (
                <img
                  src={card.imageUrl}
                  alt={card.title}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="h-full w-full" style={{ backgroundColor: brandColor }} />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              {card.badge ? (
                <span
                  className="absolute right-4 top-4 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] shadow-lg"
                  style={{ backgroundColor: card.badge.bgColor, color: card.badge.textColor }}
                >
                  {card.badge.label}
                </span>
              ) : null}
              <div className="absolute bottom-4 left-4 right-4">
                <span className="mb-2 inline-flex rounded-full bg-green-600 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white">
                  {card.enrollmentLabel}
                </span>
                <h3 className="line-clamp-2 min-h-[2.75rem] text-lg font-black leading-tight text-white">
                  {card.title}
                </h3>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-5 text-slate-950">
              <dl className="grid gap-2 text-sm text-slate-700">
                <div className="flex gap-2">
                  <dt className="font-semibold text-slate-950">Inicio:</dt>
                  <dd>{card.startDateLabel}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-semibold text-slate-950">Sede:</dt>
                  <dd className="line-clamp-1">{card.campusLabel}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-semibold text-slate-950">Horario:</dt>
                  <dd className="line-clamp-1">{card.scheduleLabel}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-semibold text-slate-950">Precio:</dt>
                  <dd>{card.priceLabel}</dd>
                </div>
              </dl>
              <span className="mt-5 inline-flex w-fit rounded-full bg-[#f2014b] px-4 py-2 text-sm font-black text-white transition group-hover:bg-[#d0013f]">
                Ver convocatoria
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
