import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { ProductMoments } from '@/components/marketing/ProductMoments'
import { solutionDetails, verticals } from '@/lib/marketing-content'

export function generateStaticParams() { return verticals.map(({ slug }) => ({ slug })) }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const vertical = verticals.find((item) => item.slug === slug); if (!vertical) return {}; const detail = solutionDetails[vertical.slug]; return { title: `${vertical.title} software`, description: detail.promise, alternates: { canonical: `/solutions/${slug}` } } }

export default async function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const vertical = verticals.find((item) => item.slug === slug)
  if (!vertical) notFound()
  const detail = solutionDetails[vertical.slug]
  const initial = vertical.slug === 'wellness' || vertical.slug === 'sports' || vertical.slug === 'seasonal' ? 'reservations' : vertical.slug === 'online-cohorts' ? 'campus' : vertical.slug === 'networks' ? 'insight' : 'programmes'
  return <div className="min-h-screen bg-[#f7f9fc] text-[#071633]"><Header /><main id="content"><section className="relative flex min-h-[calc(100dvh-73px)] items-end overflow-hidden bg-[#071633] text-white"><Image src={vertical.image} alt={vertical.imageAlt} fill priority sizes="100vw" className="object-cover" /><div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,15,39,.95),rgba(3,15,39,.72)_45%,rgba(3,15,39,.12))]" /><div className="relative mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8 lg:pb-20"><p className="text-sm font-semibold text-blue-200">Akademate for {vertical.title}</p><h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-7xl">{detail.headline}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">{detail.promise}</p><Link href="/contacto?asunto=demo" className="button-primary-light mt-8">See it for your academy <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div></section><section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28"><div className="mx-auto max-w-7xl"><h2 className="max-w-3xl text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">A smoother journey for your team and every participant.</h2><div className="mt-12 grid gap-5 md:grid-cols-2">{detail.outcomes.map((outcome) => <div key={outcome} className="flex gap-4 rounded-2xl bg-white p-6 shadow-sm"><CheckCircle2 className="h-6 w-6 shrink-0 text-blue-700" aria-hidden="true" /><p className="text-lg font-semibold">{outcome}</p></div>)}</div></div></section><section className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28"><div className="mx-auto max-w-7xl"><h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">See the workflow come together.</h2><div className="mt-12"><ProductMoments initial={initial} /></div><div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{detail.workflow.map((step, index) => <div key={step} className="border-t-2 border-blue-600 pt-5"><span className="text-xs text-blue-700">0{index + 1}</span><h3 className="mt-4 text-xl font-semibold">{step}</h3><p className="mt-2 text-sm leading-6 text-slate-600">Powered by {detail.modules[index]}.</p></div>)}</div></div></section><section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28"><div className="mx-auto max-w-5xl rounded-2xl bg-[#071633] p-8 text-center text-white sm:p-14"><h2 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Build the experience your academy deserves.</h2><p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-blue-100/70">We will map Akademate around your programmes, people, locations and growth goals.</p><Link href="/contacto?asunto=demo" className="button-primary-light mt-8">Book your walkthrough <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div></section></main><Footer /></div>
}
