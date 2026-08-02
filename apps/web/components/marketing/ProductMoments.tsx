'use client'

import { useState } from 'react'
import { useMarketingText } from '@/components/i18n/use-marketing-text'
import {
  BarChart3,
  BookOpenCheck,
  CalendarCheck2,
  CheckCircle2,
  CreditCard,
  Mail,
  Megaphone,
  UsersRound,
} from 'lucide-react'

const moments = [
  {
    id: 'reservations',
    label: 'Reservations',
    icon: CalendarCheck2,
    title: 'Turn interest into a confirmed place.',
    text: 'Give every programme a booking, capacity and payment journey.',
    accent: '12 places left',
    fields: [
      {
        label: 'Programme',
        type: 'select',
        options: [
          'Summer Performance Camp',
          'Professional English B2',
          'Pilates Instructor Programme',
        ],
      },
      { label: 'Start date', type: 'date', value: '2026-09-14' },
      { label: 'Participant', type: 'text', value: 'Alex Morgan' },
      {
        label: 'Payment option',
        type: 'select',
        options: ['Reserve with a €90 deposit', 'Pay in full', 'Request an invoice'],
      },
    ],
    summary: ['Place held for 20 minutes', 'Welcome email ready', 'Guardian consent requested'],
  },
  {
    id: 'growth',
    label: 'Growth & CRM',
    icon: Megaphone,
    title: 'Know which campaigns fill your programmes.',
    text: 'Carry source, campaign and next action from the first click into the admissions pipeline.',
    accent: '18 qualified leads',
    fields: [
      {
        label: 'Lead source',
        type: 'select',
        options: ['Meta Ads · Autumn intake', 'Organic search', 'Referral partner'],
      },
      {
        label: 'Interest',
        type: 'select',
        options: ['Professional training', 'Seasonal programme', 'Membership'],
      },
      {
        label: 'Next action',
        type: 'select',
        options: ['Invite to book', 'Call today', 'Send application'],
      },
      { label: 'Owner', type: 'text', value: 'Admissions team' },
    ],
    summary: ['Campaign context attached', 'Follow-up due today', 'Conversion event prepared'],
  },
  {
    id: 'programmes',
    label: 'Programmes',
    icon: BookOpenCheck,
    title: 'Build the programme once. Run it everywhere.',
    text: 'Coordinate cohorts, sessions, rooms, teachers and capacity in one planning flow.',
    accent: 'Cohort ready',
    fields: [
      { label: 'Programme run', type: 'text', value: 'English B2 · Autumn 2026' },
      { label: 'Delivery', type: 'select', options: ['Hybrid', 'In person', 'Online'] },
      { label: 'Room or channel', type: 'text', value: 'Campus North · Room 3' },
      { label: 'Lead teacher', type: 'text', value: 'Maya Chen' },
    ],
    summary: ['24 learner capacity', '16 sessions scheduled', 'Teacher workspace created'],
  },
  {
    id: 'campus',
    label: 'Campus',
    icon: UsersRound,
    title: 'Keep learners and teachers in the flow.',
    text: 'Bring lessons, tasks, feedback, progress and course conversation into one shared experience.',
    accent: '82% on track',
    fields: [
      { label: 'Learning activity', type: 'text', value: 'Unit 4 · Customer conversations' },
      { label: 'Available from', type: 'date', value: '2026-09-22' },
      {
        label: 'Submission',
        type: 'select',
        options: ['File and written response', 'Quiz', 'Live assessment'],
      },
      { label: 'Feedback by', type: 'text', value: 'Friday · 17:00' },
    ],
    summary: ['18 submissions received', '4 learners need attention', 'Feedback queue assigned'],
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: CreditCard,
    title: 'Make paying as smooth as booking.',
    text: 'Offer deposits, instalments, memberships and recurring payments with the right receiving account.',
    accent: '€8,420 collected',
    fields: [
      {
        label: 'Payment model',
        type: 'select',
        options: ['3 monthly instalments', 'One-off payment', 'Recurring membership'],
      },
      { label: 'First payment', type: 'text', value: '€290.00' },
      { label: 'Provider', type: 'select', options: ['Stripe', 'PayPal', 'SEPA direct debit'] },
      { label: 'Invoice owner', type: 'text', value: 'North Campus' },
    ],
    summary: [
      'Receipt journey enabled',
      'Reconciliation reference set',
      'Payment reminder scheduled',
    ],
  },
  {
    id: 'insight',
    label: 'Insight',
    icon: BarChart3,
    title: 'See where growth is happening.',
    text: 'Connect demand, enrolment, attendance and revenue without rebuilding the story in spreadsheets.',
    accent: '74% booking conversion',
    fields: [
      {
        label: 'View',
        type: 'select',
        options: ['Executive overview', 'Admissions funnel', 'Programme performance'],
      },
      {
        label: 'Period',
        type: 'select',
        options: ['Last 30 days', 'Current term', 'Year to date'],
      },
      {
        label: 'Location',
        type: 'select',
        options: ['All locations', 'North Campus', 'Online academy'],
      },
      {
        label: 'Compare with',
        type: 'select',
        options: ['Previous period', 'Plan target', 'No comparison'],
      },
    ],
    summary: ['42 new reservations', '91% attendance', '3 cohorts near capacity'],
  },
] as const

export function ProductMoments({
  initial = 'reservations',
  compact = false,
}: {
  initial?: (typeof moments)[number]['id']
  compact?: boolean
}) {
  const t = useMarketingText()
  const [activeId, setActiveId] = useState(initial)
  const active = moments.find((moment) => moment.id === activeId) ?? moments[0]
  const Icon = active.icon

  return (
    <div
      className={`overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(7,22,51,.12)] ${compact ? '' : 'lg:grid lg:grid-cols-[.38fr_.62fr]'}`}
    >
      <div
        className={`border-b border-slate-200 bg-[#071633] p-4 text-white ${compact ? '' : 'lg:border-b-0 lg:border-r lg:p-6'}`}
      >
        <div
          role="tablist"
          aria-label={t('Akademate product examples')}
          className={`flex gap-2 overflow-x-auto ${compact ? '' : 'lg:grid'}`}
        >
          {moments.map((moment) => {
            const MomentIcon = moment.icon
            const selected = moment.id === active.id
            return (
              <button
                key={moment.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveId(moment.id)}
                className={`flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-4 text-left text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${selected ? 'bg-white text-[#071633]' : 'text-blue-100/70 hover:bg-white/10 hover:text-white'}`}
              >
                <MomentIcon className="h-4 w-4" aria-hidden="true" /> {t(moment.label)}
              </button>
            )
          })}
        </div>
      </div>

      <div role="tabpanel" className="p-5 sm:p-7 lg:p-9">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">
              {t(active.title)}
            </h3>
            <p className="mt-3 leading-7 text-slate-600">{t(active.text)}</p>
          </div>
          <span className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full bg-emerald-50 px-3 text-sm font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {t(active.accent)}
          </span>
        </div>

        <form
          className="mt-8 grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => event.preventDefault()}
        >
          {active.fields.map((field) => (
            <DemoField key={field.label} field={field} t={t} />
          ))}
        </form>

        <div className="mt-6 grid gap-3 border-t border-slate-200 pt-6 sm:grid-cols-3">
          {active.summary.map((item, index) => (
            <div key={item} className="flex items-start gap-2 text-sm leading-6 text-slate-600">
              {index === 1 ? (
                <Mail className="mt-1 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />
              )}
              <span>{t(item)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DemoField({
  field,
  t,
}: {
  field: (typeof moments)[number]['fields'][number]
  t: (source: string) => string
}) {
  const id = `demo-${field.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <label htmlFor={id} className="grid gap-2 text-sm font-semibold text-[#071633]">
      <span>{t(field.label)}</span>
      {field.type === 'select' ? (
        <select
          id={id}
          defaultValue={t(field.options[0] ?? '')}
          className="min-h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 font-normal text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          {field.options.map((option) => (
            <option key={option}>{t(option)}</option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={field.type}
          defaultValue={'value' in field ? t(field.value) : ''}
          className="min-h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 font-normal text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      )}
    </label>
  )
}
