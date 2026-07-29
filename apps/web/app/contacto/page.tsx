import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Mail, Route, UsersRound } from 'lucide-react'
import { ContactForm } from '@/components/forms/contact-form'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'

export const metadata: Metadata = { title: 'Contact', description: 'Book an Akademate demo or discuss your academy operating model.', alternates: { canonical: '/contacto' } }

export default function ContactPage() {
  return <div className="min-h-screen bg-white text-[#071633]"><Header /><main id="content" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24"><div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.85fr_1.15fr] lg:gap-20"><section><p className="section-kicker">Start a conversation</p><h1 className="mt-5 text-5xl font-semibold tracking-[-0.055em] sm:text-6xl">Show us how your academy works.</h1><p className="mt-6 text-lg leading-8 text-slate-600">Tell us about your programmes, delivery model, teams and operational goals. We will shape a focused Akademate walkthrough around them.</p><div className="mt-10 space-y-6 border-y py-8"><ContactPoint icon={Route} title="Map the operation" text="Admissions, academic delivery, finance, learning and the handoffs between them." /><ContactPoint icon={UsersRound} title="Bring the right team" text="Invite the people responsible for operations, education, technology or growth." /><ContactPoint icon={Mail} title="Prefer email?" text="Write to hola@akademate.com" href="mailto:hola@akademate.com" /></div></section><section className="rounded-[2rem] bg-slate-50 p-6 sm:p-10"><h2 className="text-2xl font-semibold tracking-tight">Book a demo</h2><p className="mt-3 text-sm leading-6 text-slate-600">Share enough context for us to prepare a useful conversation.</p><Suspense fallback={<p className="mt-8 text-sm text-slate-500">Loading form…</p>}><ContactForm /></Suspense></section></div></main><Footer /></div>
}

function ContactPoint({ icon: Icon, title, text, href }: { icon: typeof Mail; title: string; text: string; href?: string }) { return <div className="flex gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Icon className="h-5 w-5" aria-hidden="true" /></div><div><h2 className="font-semibold">{title}</h2>{href ? <a href={href} className="mt-1 inline-block text-sm text-blue-700 hover:underline">{text}</a> : <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>}</div></div> }
