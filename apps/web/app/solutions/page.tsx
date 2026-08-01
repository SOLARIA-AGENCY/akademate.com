import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { solutionDetails, verticals } from '@/lib/marketing-content'

export const metadata: Metadata = {
  title: 'Who Akademate is for',
  description:
    'Explore how Akademate adapts to professional training, languages, wellness, sport, camps, performing arts, online education and multi-site groups.',
  alternates: { canonical: '/solutions' },
}

export default function SolutionsPage() {
  return (
    <div className="marketing-page min-h-screen bg-[#f7f9fc] text-[#071633]">
      <Header />
      <main id="content">
        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <p className="section-kicker">Built around your academy</p>
            <h1 className="mt-5 max-w-5xl text-5xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-7xl">
              Built around your academy model.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
              Start with familiar workflows. Connect everything around them.
            </p>
          </div>
        </section>
        <section className="px-4 pb-24 sm:px-6 lg:px-8 lg:pb-32">
          <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-2">
            {verticals.map((vertical, index) => {
              const detail = solutionDetails[vertical.slug]
              return (
                <Link
                  key={vertical.slug}
                  href={`/solutions/${vertical.slug}`}
                  className={`group overflow-hidden rounded-2xl bg-white shadow-sm ${index % 3 === 0 ? 'md:col-span-2 md:grid md:grid-cols-2' : ''}`}
                >
                  <div className="relative min-h-[300px] overflow-hidden">
                    <Image
                      src={vertical.image}
                      alt={vertical.imageAlt}
                      fill
                      sizes={
                        index % 3 === 0
                          ? '(max-width: 768px) 100vw, 50vw'
                          : '(max-width: 768px) 100vw, 50vw'
                      }
                      className="object-cover transition duration-700 group-hover:scale-[1.025]"
                    />
                  </div>
                  <div className="p-7 sm:p-9">
                    <h2 className="text-3xl font-semibold tracking-tight">{vertical.title}</h2>
                    <p className="mt-4 text-lg leading-7 text-slate-600">{detail.headline}</p>
                    <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                      {detail.outcomes.slice(0, 4).map((item) => (
                        <li key={item} className="flex gap-2 text-sm text-slate-600">
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-blue-700"
                            aria-hidden="true"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <span className="mt-8 inline-flex items-center gap-2 font-semibold text-blue-700">
                      Explore this solution{' '}
                      <ArrowRight
                        className="h-4 w-4 transition group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
