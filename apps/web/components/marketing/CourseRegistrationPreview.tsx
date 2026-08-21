'use client'

import Image from 'next/image'
import { useState } from 'react'
import {
  Apple,
  CalendarDays,
  Check,
  Clock3,
  Copy,
  ExternalLink,
  Globe2,
  Link2,
  Mail,
  MapPin,
  MoreHorizontal,
  Send,
  Share2,
  ShieldCheck,
  Star,
  UsersRound,
} from 'lucide-react'
import { usePreviewCopy } from '@/components/i18n/use-preview-copy'

const tickets = [
  { id: 'full', price: '€249' },
  { id: 'deposit', price: '€60' },
] as const

const attendees = [
  { name: 'Alex Morgan', image: '/images/avatars/course-attendee-01.jpg' },
  { name: 'Lina Chen', image: '/images/avatars/course-attendee-02.jpg' },
  { name: 'Javier Ruiz', image: '/images/avatars/course-attendee-03.jpg' },
  { name: 'Nora Kelly', image: '/images/avatars/course-attendee-04.jpg' },
] as const

const courseUrl = 'academy.akademate.com/creative-leadership'
const shareIcons = [Copy, Send, Mail, Link2] as const

export function CourseRegistrationPreview() {
  const [ticket, setTicket] = useState<(typeof tickets)[number]['id']>('full')
  const [shareOpen, setShareOpen] = useState(false)
  const copy = usePreviewCopy()
  const selected = tickets.find((option) => option.id === ticket) ?? tickets[0]

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_28px_90px_rgba(7,22,51,.12)]">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
        <div className="hidden gap-1.5 sm:flex">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
          <Globe2 className="h-3.5 w-3.5 shrink-0 text-blue-600" aria-hidden="true" />
          <span className="truncate">{courseUrl}</span>
        </div>
        <button
          type="button"
          aria-label={copy.course.copyCourseUrl}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-blue-700"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={copy.course.openCoursePage}
          className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-blue-700 sm:flex"
        >
          <ExternalLink className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={copy.course.shareCourse}
          aria-expanded={shareOpen}
          onClick={() => setShareOpen((value) => !value)}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#071633] text-white"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      <div className="relative grid lg:grid-cols-[1.15fr_.85fr]">
        <div className="bg-[#071633] text-white">
          <div className="relative aspect-[16/8] overflow-hidden">
            <Image
              src="/images/marketing/course-creative-leadership-v1.jpg"
              alt={copy.course.imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071633] via-[#071633]/15 to-transparent" />
            <span className="absolute left-5 top-5 rounded-full border border-white/20 bg-[#071633]/70 px-3 py-2 text-xs font-semibold backdrop-blur">
              {copy.course.exampleCoursePage}
            </span>
          </div>

          <div className="p-6 pt-2 sm:p-9 sm:pt-3">
            <h3 className="max-w-xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              {copy.course.title}
            </h3>
            <p className="mt-4 max-w-xl leading-7 text-blue-100/75">{copy.course.description}</p>

            <div className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
              <Info
                icon={CalendarDays}
                title={copy.course.dateTitle}
                text={copy.course.dateDescription}
              />
              <Info icon={Clock3} title="10:00–17:00" text={copy.course.timeDescription} />
              <Info
                icon={MapPin}
                title={copy.course.locationTitle}
                text={copy.course.locationDescription}
              />
              <Info
                icon={UsersRound}
                title={copy.course.availabilityTitle}
                text={copy.course.availabilityDescription}
              />
            </div>

            <div className="mt-9 grid gap-5 border-t border-white/15 pt-7 sm:grid-cols-[auto_1fr] sm:items-center">
              <div>
                <p className="mb-3 text-xs font-semibold text-blue-200">
                  {copy.course.confirmedAttendees}
                </p>
                <div className="flex -space-x-3" aria-label={copy.course.attendeesAria}>
                  {attendees.map((attendee, index) => (
                    <span
                      key={attendee.name}
                      title={attendee.name}
                      className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-[3px] border-[#071633] bg-blue-100 shadow-sm ring-1 ring-white/30 sm:h-14 sm:w-14"
                      style={{ zIndex: attendees.length - index }}
                    >
                      <Image
                        src={attendee.image}
                        alt={`${copy.course.attendeeAltPrefix} ${attendee.name}`}
                        fill
                        loading="eager"
                        sizes="(max-width: 639px) 48px, 56px"
                        className="object-cover object-[center_32%]"
                      />
                    </span>
                  ))}
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[3px] border-[#071633] bg-blue-100 text-xs font-bold text-blue-800 shadow-sm sm:h-14 sm:w-14">
                    +12
                  </span>
                </div>
              </div>
              <div>
                <div
                  className="flex items-center gap-1 text-amber-300"
                  aria-label={copy.course.ratingAria}
                >
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-current" aria-hidden="true" />
                  ))}
                </div>
                <p className="mt-2 text-xs text-blue-100/65">{copy.course.ratingSummary}</p>
              </div>
            </div>
          </div>
        </div>

        <form className="p-6 sm:p-9" onSubmit={(event) => event.preventDefault()}>
          <p className="text-sm font-semibold text-blue-700">{copy.course.registration}</p>
          <h4 className="mt-2 text-2xl font-semibold tracking-tight">{copy.course.joinPrompt}</h4>
          <fieldset className="mt-6 grid gap-3">
            <legend className="sr-only">{copy.course.ticketLegend}</legend>
            {tickets.map((option, index) => (
              <label
                key={option.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${ticket === option.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}
              >
                <input
                  type="radio"
                  name="ticket"
                  value={option.id}
                  checked={ticket === option.id}
                  onChange={() => setTicket(option.id)}
                  className="mt-1 accent-blue-700"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">
                    {copy.course.tickets[index]!.title}
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {copy.course.tickets[index]!.detail}
                  </span>
                </span>
                <span className="text-sm font-semibold">{option.price}</span>
              </label>
            ))}
          </fieldset>

          <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            {copy.course.continueWith}
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <SocialButton
              label={copy.course.providers[0]}
              icon={Mail}
              copy={copy.course.continueWithProvider}
            />
            <SocialButton
              label={copy.course.providers[1]}
              icon={Globe2}
              copy={copy.course.continueWithProvider}
            />
            <SocialButton
              label={copy.course.providers[2]}
              icon={Apple}
              copy={copy.course.continueWithProvider}
            />
          </div>
          <label htmlFor="preview-email" className="mt-6 grid gap-2 text-sm font-semibold">
            <span>{copy.course.emailAddress}</span>
            <input
              id="preview-email"
              type="email"
              placeholder={copy.course.emailPlaceholder}
              className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 font-normal outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-5">
            <span className="text-sm text-slate-500">{copy.course.dueToday}</span>
            <span className="text-xl font-semibold">{selected.price}</span>
          </div>
          <button
            type="submit"
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#071633] px-5 text-sm font-semibold text-white hover:bg-blue-800 active:scale-[.99]"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            {copy.course.continueToPayment}
          </button>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            {copy.course.secureRegistration}
          </p>
        </form>

        {shareOpen ? <ShareSheet copy={copy.course} onClose={() => setShareOpen(false)} /> : null}
      </div>
    </div>
  )
}

function ShareSheet({
  copy,
  onClose,
}: {
  copy: ReturnType<typeof usePreviewCopy>['course']
  onClose: () => void
}) {
  return (
    <div
      className="absolute inset-x-4 bottom-4 z-20 ml-auto max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:inset-x-auto sm:right-4"
      role="dialog"
      aria-label={copy.shareDialog}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{copy.shareTitle}</p>
          <p className="mt-1 text-xs text-slate-500">{copy.shareDescription}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={copy.closeShareOptions}
          className="h-9 w-9 rounded-full bg-slate-100"
        >
          <MoreHorizontal className="mx-auto h-4 w-4" />
        </button>
      </div>
      <div className="mt-5 grid grid-cols-4 gap-3 text-center text-[11px] font-semibold">
        {copy.shareActions.map((label, index) => {
          const Icon = shareIcons[index]!
          return (
            <button key={label} type="button" className="grid justify-items-center gap-2">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                <Icon className="h-4 w-4" />
              </span>
              {label}
            </button>
          )
        })}
      </div>
      <div className="mt-5 truncate rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
        https://{courseUrl}
      </div>
    </div>
  )
}

function Info({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof CalendarDays
  title: string
  text: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon
        className="mt-0.5 h-5 w-5 shrink-0 text-blue-300"
        strokeWidth={1.8}
        aria-hidden="true"
      />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-xs text-blue-100/60">{text}</p>
      </div>
    </div>
  )
}

function SocialButton({
  label,
  icon: Icon,
  copy,
}: {
  label: string
  icon: typeof Mail
  copy: string
}) {
  return (
    <button
      type="button"
      aria-label={`${copy} ${label}`}
      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </button>
  )
}
