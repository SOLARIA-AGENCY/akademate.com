'use client'

import { useState } from 'react'
import { Apple, CalendarDays, Check, Clock3, Globe2, Mail, MapPin, ShieldCheck, Star, UsersRound } from 'lucide-react'

const tickets = [
  { id: 'full', title: 'Full workshop', detail: 'Two days · materials included', price: '€249' },
  { id: 'deposit', title: 'Reserve with deposit', detail: 'Secure your place today', price: '€60' },
] as const

const attendees = ['AM', 'LC', 'JS', 'NR', 'MK'] as const

export function CourseRegistrationPreview() {
  const [ticket, setTicket] = useState<(typeof tickets)[number]['id']>('full')
  const selected = tickets.find((option) => option.id === ticket) ?? tickets[0]

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_28px_90px_rgba(7,22,51,.12)]">
      <div className="grid lg:grid-cols-[1.15fr_.85fr]">
        <div className="bg-[#071633] p-6 text-white sm:p-9">
          <div className="flex items-center justify-between gap-4">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-blue-100">Example public course page</span>
            <span className="text-xs font-semibold text-blue-200">academy.akademate.com</span>
          </div>
          <h3 className="mt-10 max-w-xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Creative Leadership Weekend</h3>
          <p className="mt-4 max-w-xl leading-7 text-blue-100/75">A focused two-day workshop with live practice, expert feedback and a ready-to-use toolkit.</p>

          <div className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
            <Info icon={CalendarDays} title="12–13 September" text="Saturday and Sunday" />
            <Info icon={Clock3} title="10:00–17:00" text="Two live sessions" />
            <Info icon={MapPin} title="Central campus" text="Studio 2 · Hybrid access" />
            <Info icon={UsersRound} title="8 places left" text="Small-group experience" />
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-5 border-t border-white/15 pt-7">
            <div className="flex -space-x-2" aria-label="Example attendee list">
              {attendees.map((attendee, index) => <span key={attendee} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#071633] bg-blue-100 text-[10px] font-bold text-blue-800" style={{ zIndex: attendees.length - index }}>{attendee}</span>)}
            </div>
            <div><div className="flex items-center gap-1 text-amber-300" aria-label="Rated 4.9 out of 5">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-4 w-4 fill-current" aria-hidden="true" />)}</div><p className="mt-1 text-xs text-blue-100/65">4.9 from previous participants</p></div>
          </div>
        </div>

        <form className="p-6 sm:p-9" onSubmit={(event) => event.preventDefault()}>
          <p className="text-sm font-semibold text-blue-700">Registration</p>
          <h4 className="mt-2 text-2xl font-semibold tracking-tight">Choose how to join</h4>
          <fieldset className="mt-6 grid gap-3">
            <legend className="sr-only">Ticket option</legend>
            {tickets.map((option) => (
              <label key={option.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${ticket === option.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}>
                <input type="radio" name="ticket" value={option.id} checked={ticket === option.id} onChange={() => setTicket(option.id)} className="mt-1 accent-blue-700" />
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{option.title}</span><span className="mt-1 block text-xs text-slate-500">{option.detail}</span></span>
                <span className="text-sm font-semibold">{option.price}</span>
              </label>
            ))}
          </fieldset>

          <div className="my-6 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" />Continue with<span className="h-px flex-1 bg-slate-200" /></div>
          <div className="grid grid-cols-3 gap-2">
            <SocialButton label="Email" icon={Mail} />
            <SocialButton label="Google" icon={Globe2} />
            <SocialButton label="Apple" icon={Apple} />
          </div>

          <label htmlFor="preview-email" className="mt-6 grid gap-2 text-sm font-semibold"><span>Email address</span><input id="preview-email" type="email" placeholder="you@example.com" className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 font-normal outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>

          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-5"><span className="text-sm text-slate-500">Due today</span><span className="text-xl font-semibold">{selected.price}</span></div>
          <button type="submit" className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#071633] px-5 text-sm font-semibold text-white hover:bg-blue-800 active:scale-[.99]"><Check className="h-4 w-4" aria-hidden="true" />Continue to payment</button>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />Secure registration with consent controls</p>
        </form>
      </div>
    </div>
  )
}

function Info({ icon: Icon, title, text }: { icon: typeof CalendarDays; title: string; text: string }) {
  return <div className="flex items-start gap-3"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" strokeWidth={1.8} aria-hidden="true" /><div><p className="font-semibold">{title}</p><p className="mt-1 text-xs text-blue-100/60">{text}</p></div></div>
}

function SocialButton({ label, icon: Icon }: { label: string; icon: typeof Mail }) {
  return <button type="button" aria-label={`Continue with ${label}`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"><Icon className="h-4 w-4" aria-hidden="true" /><span className="sr-only">{label}</span></button>
}
