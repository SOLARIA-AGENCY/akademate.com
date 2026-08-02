'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useLocale } from '@/components/i18n/locale-provider'
import { getLegalContent } from '@/lib/legal-config'
import { localizedHref } from '@/lib/i18n/routing'

const marks = [
  {
    href: '/legal/privacidad',
    src: '/logos/gdpr-logo.png',
    alt: 'gdprAlt',
    label: 'privacy',
    width: 2000,
    height: 2000,
    className: 'h-14 w-14 brightness-0 invert',
  },
  {
    href: '/legal/ia',
    src: '/logos/eu-ai-act.png',
    alt: 'euAiActAlt',
    label: 'responsibleAi',
    width: 846,
    height: 215,
    className: 'h-11 w-auto max-w-[12rem] brightness-0 invert',
  },
] as const

export function ComplianceBadges() {
  const locale = useLocale()
  const legal = getLegalContent(locale)

  return (
    <div className="flex flex-col items-center gap-4 sm:items-end">
      <p className="text-sm font-semibold text-white">{legal.compliance.title}</p>
      <div
        className="flex flex-nowrap items-center gap-5"
        aria-label={legal.compliance.information}
      >
        {marks.map((mark) => (
          <Link
            key={mark.href}
            href={localizedHref(mark.href, locale)}
            aria-label={legal.compliance[mark.label]}
            className="inline-flex min-h-14 items-center rounded-xl border border-white/10 bg-white/[.06] px-4 opacity-80 transition hover:bg-white/10 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
          >
            <Image
              src={mark.src}
              alt={legal.compliance[mark.alt]}
              width={mark.width}
              height={mark.height}
              loading="eager"
              className={`${mark.className} object-contain`}
            />
          </Link>
        ))}
      </div>
      <p className="text-xs text-blue-100/45">{legal.compliance.detail}</p>
    </div>
  )
}
