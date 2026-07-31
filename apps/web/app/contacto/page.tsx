import type { Metadata } from 'next'
import Image from 'next/image'
import { Suspense } from 'react'
import { Mail, Route, UsersRound } from 'lucide-react'
import { ContactForm } from '@/components/forms/contact-form'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'

export const metadata: Metadata = { title: 'Contact', description: 'Book an Akademate demo or discuss your academy operating model.', alternates: { canonical: '/contacto' } }

export default function ContactPage() {
  return <div className="min-h-screen bg-white text-[#071633]"><Header /><main id="content"><section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24"><div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:gap-20"><div><div className="relative aspect-[4/3] overflow-hidden rounded-[2rem]"><Image src="/images/marketing/contact-consultation.jpg" alt="Academy owner planning a tailored Akademate walkthrough" fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /></div><p className="section-kicker mt-10">Let&apos;s build your next chapter</p><h1 className="mt-5 text-5xl font-semibold tracking-[-0.055em] sm:text-6xl">See what your academy can become.</h1><p className="mt-6 text-lg leading-8 text-slate-600">Tell us where you want to grow. We&apos;ll shape a focused walkthrough around your programmes, people and biggest opportunities.</p><div className="mt-10 space-y-6 border-y py-8"><ContactPoint icon={Route} title="Start with your goals" text="More enrolments, smoother delivery, stronger retention or a connected multi-site operation." /><ContactPoint icon={UsersRound} title="Bring the people who matter" text="Invite leaders from operations, education, finance, technology or growth." /><ContactPoint icon={Mail} title="Prefer email?" text="Write to hola@akademate.com" href="mailto:hola@akademate.com" /></div></div><section className="self-start rounded-[2rem] bg-slate-50 p-6 sm:p-10 lg:sticky lg:top-28"><h2 className="text-3xl font-semibold tracking-tight">Book your Akademate walkthrough</h2><p className="mt-3 text-sm leading-6 text-slate-600">Share a little context and we&apos;ll make the conversation immediately useful.</p><Suspense fallback={<p className="mt-8 text-sm text-slate-500">Loading form…</p>}><ContactForm /></Suspense></section></div></section></main><Footer /></div>
}

function ContactPoint({ icon: Icon, title, text, href }: { icon: typeof Mail; title: string; text: string; href?: string }) { return <div className="flex gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Icon className="h-5 w-5" aria-hidden="true" /></div><div><h2 className="font-semibold">{title}</h2>{href ? <a href={href} className="mt-1 inline-block text-sm text-blue-700 hover:underline">{text}</a> : <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>}</div></div> }
