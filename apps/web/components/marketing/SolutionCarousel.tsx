'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { verticals } from '@/lib/marketing-content'
import { useMarketingText } from '@/components/i18n/use-marketing-text'
import { useLocale } from '@/components/i18n/locale-provider'
import { localizedHref } from '@/lib/i18n/routing'
import { getLocalizedVertical } from '@/lib/vertical-i18n'

const repeatedVerticals = [...verticals, ...verticals, ...verticals]

export function SolutionCarousel() {
  const locale = useLocale()
  const t = useMarketingText()
  const trackRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<number | null>(null)
  const pausedRef = useRef(false)
  const manualTargetRef = useRef<number | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const loopMetrics = () => {
    const track = trackRef.current
    const first = track?.children.item(0) as HTMLElement | null
    const secondSet = track?.children.item(verticals.length) as HTMLElement | null
    if (!track || !first || !secondSet) return null
    return { track, start: secondSet.offsetLeft, width: secondSet.offsetLeft - first.offsetLeft }
  }

  const normalisePosition = () => {
    const metrics = loopMetrics()
    if (!metrics) return
    const { track, start, width } = metrics
    if (track.scrollLeft < start - width * 0.5) track.scrollLeft += width
    if (track.scrollLeft > start + width * 1.5) track.scrollLeft -= width

    const card = track.children.item(verticals.length) as HTMLElement | null
    const nextCard = track.children.item(verticals.length + 1) as HTMLElement | null
    const step = nextCard && card ? nextCard.offsetLeft - card.offsetLeft : width / verticals.length
    const relative = (((track.scrollLeft - start) % width) + width) % width
    const nextIndex = Math.round(relative / step) % verticals.length
    if (manualTargetRef.current === null) {
      setActiveIndex((current) => (current === nextIndex ? current : nextIndex))
    }
  }

  useEffect(() => {
    const metrics = loopMetrics()
    if (!metrics) return
    metrics.track.scrollLeft = metrics.start

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    let previous = performance.now()
    const advance = (now: number) => {
      const track = trackRef.current
      if (track && !pausedRef.current) {
        track.scrollLeft += Math.min(now - previous, 40) * 0.006
        normalisePosition()
      }
      previous = now
      frameRef.current = requestAnimationFrame(advance)
    }
    frameRef.current = requestAnimationFrame(advance)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [])

  const moveTo = (index: number) => {
    const metrics = loopMetrics()
    if (!metrics) return
    const current = metrics.track.children.item(verticals.length) as HTMLElement | null
    const target = metrics.track.children.item(verticals.length + index) as HTMLElement | null
    if (!current || !target) return
    manualTargetRef.current = index
    metrics.track.scrollTo({
      left: metrics.start + target.offsetLeft - current.offsetLeft,
      behavior: 'smooth',
    })
    setActiveIndex(index)
    window.setTimeout(() => {
      manualTargetRef.current = null
      normalisePosition()
    }, 800)
  }

  const moveBy = (direction: -1 | 1) => {
    moveTo((activeIndex + direction + verticals.length) % verticals.length)
  }

  return (
    <div
      className="mt-12"
      role="region"
      aria-roledescription="carousel"
      aria-label={t('Academy models')}
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      onFocus={() => (pausedRef.current = true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) pausedRef.current = false
      }}
      onPointerDown={() => (pausedRef.current = true)}
      onPointerUp={() => (pausedRef.current = false)}
    >
      <div
        ref={trackRef}
        className="solution-carousel-track flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4"
        onScroll={normalisePosition}
      >
        {repeatedVerticals.map((vertical, index) => {
          const canonical = index >= verticals.length && index < verticals.length * 2
          const localizedVertical = getLocalizedVertical(vertical.slug, locale)
          if (!localizedVertical) return null
          return (
            <article
              key={`${vertical.slug}-${index}`}
              aria-hidden={!canonical}
              className="group w-[82vw] max-w-[390px] shrink-0 snap-start rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_50px_rgba(7,22,51,.06)]"
            >
              <div className="media-reveal relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-200">
                <Image
                  src={vertical.image}
                  alt={canonical ? localizedVertical.imageAlt : ''}
                  fill
                  loading={canonical ? 'eager' : 'lazy'}
                  sizes="(max-width: 640px) 82vw, 390px"
                  className="object-cover"
                />
              </div>
              <div className="px-3 pb-3 pt-5">
                <h3 className="text-2xl font-semibold tracking-tight">{localizedVertical.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {localizedVertical.description}
                </p>
                <Link
                  href={localizedHref(`/solutions/${vertical.slug}`, locale)}
                  tabIndex={canonical ? 0 : -1}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-700"
                >
                  {t('Explore solution')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </article>
          )
        })}
      </div>

      <div className="mt-5 flex items-center justify-between gap-5">
        <div
          className="flex items-center gap-2"
          aria-label={`${t('Academy model')} ${activeIndex + 1} ${t('of')} ${verticals.length}`}
        >
          {verticals.map((vertical, index) => (
            <button
              key={vertical.slug}
              type="button"
              aria-label={`${t('Show')} ${getLocalizedVertical(vertical.slug, locale)?.title ?? vertical.title}`}
              aria-current={activeIndex === index ? 'true' : undefined}
              onClick={() => moveTo(index)}
              className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${activeIndex === index ? 'w-8 bg-blue-600' : 'w-3 bg-slate-300 hover:bg-slate-400'}`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => moveBy(-1)}
            className="carousel-control"
            aria-label={t('Previous academy model')}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => moveBy(1)}
            className="carousel-control"
            aria-label={t('Next academy model')}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
