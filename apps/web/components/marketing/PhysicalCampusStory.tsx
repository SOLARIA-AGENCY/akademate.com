'use client'

import Image from 'next/image'
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CreditCard,
  MonitorCheck,
  QrCode,
  Radio,
} from 'lucide-react'
import Link from 'next/link'
import { useMarketingText } from '@/components/i18n/use-marketing-text'
import { useLocale } from '@/components/i18n/locale-provider'
import { localizedHref } from '@/lib/i18n/routing'

const stories = [
  {
    eyebrow: 'Attendance and access',
    title: 'Welcome every learner. Record every arrival.',
    text: 'Sync QR, NFC and RFID arrivals to learner records.',
    image: '/images/marketing/home-modules/attendance-access.jpg',
    imageAlt: 'Learners checking into an academy with QR and NFC access readers',
    items: [
      { icon: QrCode, label: 'QR check-in' },
      { icon: CreditCard, label: 'NFC and RFID cards' },
      { icon: BadgeCheck, label: 'Live attendance record' },
    ],
  },
  {
    eyebrow: 'Digital signage',
    title: 'Turn every academy screen into a live channel.',
    text: 'Schedule calendars, announcements and promotions by site.',
    image: '/images/marketing/home-modules/digital-signage.jpg',
    imageAlt: 'Digital signage screens showing academy schedules and announcements across a campus',
    items: [
      { icon: CalendarDays, label: 'Scheduled content' },
      { icon: MonitorCheck, label: 'Display status 24/7' },
      { icon: Radio, label: 'Multi-site publishing' },
    ],
  },
] as const

export function PhysicalCampusStory() {
  const locale = useLocale()
  const t = useMarketingText()
  return (
    <section
      data-testid="connected-campus-story"
      className="bg-[#071633] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold text-blue-200">{t('The connected physical campus')}</p>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
            {t('Connect every academy space.')}
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100/75">
            {t('Link arrivals, rooms, schedules and on-site communications to the academy day.')}
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {stories.map((story) => (
            <article
              key={story.title}
              className="overflow-hidden rounded-2xl border border-white/15 bg-white/[.06]"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={story.image}
                  alt={t(story.imageAlt)}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="p-6 sm:p-8">
                <p className="text-sm font-semibold text-blue-300">{t(story.eyebrow)}</p>
                <h3 className="mt-3 text-3xl font-semibold tracking-tight">{t(story.title)}</h3>
                <p className="mt-4 max-w-xl leading-7 text-blue-100/70">{t(story.text)}</p>
                <ul className="mt-7 grid gap-3 sm:grid-cols-3">
                  {story.items.map(({ icon: Icon, label }) => (
                    <li
                      key={label}
                      className="flex items-center gap-2 rounded-lg bg-white/[.07] px-3 py-3 text-sm font-semibold"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-blue-300" aria-hidden="true" /> {t(label)}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-6 max-w-3xl text-sm leading-6 text-blue-100/60">
          {t('Display players, access readers and sensors connect through validated provider adapters.')}
        </p>
        <Link
          href={localizedHref('/features', locale)}
          className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-blue-200 hover:text-white"
        >
          {t('Explore campus operations')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
