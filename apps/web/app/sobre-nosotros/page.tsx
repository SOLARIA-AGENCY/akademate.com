import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Compass, Layers3, Sparkles } from 'lucide-react'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { legalCompany } from '@/lib/legal-config'

export const metadata: Metadata = { title: 'Company', description: 'Akademate is building the AI-assisted operating system for modern academies.', alternates: { canonical: '/sobre-nosotros' } }

const principles = [
  { icon: Compass, title: 'Operate with context', text: 'Connect the decisions, people and learner journeys behind the academy.' },
  { icon: Layers3, title: 'One system, clear responsibility', text: 'Bring teams together while keeping roles and organisational boundaries meaningful.' },
  { icon: Sparkles, title: 'Use AI where work happens', text: 'Assist people inside real workflows, with human judgement at the centre.' },
] as const

export default function AboutPage() { return <div className="min-h-screen bg-white text-[#071633]"><Header /><main id="content"><section className="grid min-h-[70svh] items-stretch lg:grid-cols-2"><div className="flex items-center px-4 py-20 sm:px-8 lg:px-[max(2rem,calc((100vw-80rem)/2))]"><div className="max-w-xl"><p className="section-kicker">About Akademate</p><h1 className="mt-5 text-5xl font-semibold tracking-[-0.055em] sm:text-7xl">Academies deserve an operating system built around their work.</h1><p className="mt-7 text-lg leading-8 text-slate-600">Akademate is a product of {legalCompany.name}, created to connect the commercial, academic and learning operations that modern education teams run every day.</p><Link href="/contacto?asunto=demo" className="button-primary-dark mt-9">Meet Akademate <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div></div><div className="relative min-h-[480px]"><Image src="/images/marketing/akademate-in-person-academy.jpg" alt="Adult learners and teacher working together in a modern academy" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /></div></section><section className="bg-[#071633] px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28"><div className="mx-auto max-w-7xl"><p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-200">Our point of view</p><h2 className="mt-5 max-w-4xl text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">Technology should make an academy feel more human, not more fragmented.</h2><div className="mt-14 grid border-y border-white/15 md:grid-cols-3">{principles.map(({ icon: Icon, title, text }) => <article key={title} className="border-b border-white/15 py-8 md:border-b-0 md:border-r md:px-8 first:md:pl-0 last:md:border-r-0"><Icon className="h-7 w-7 text-blue-300" aria-hidden="true" /><h3 className="mt-8 text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-blue-100/65">{text}</p></article>)}</div></div></section></main><Footer /></div> }
