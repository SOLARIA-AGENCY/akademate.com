import Link from 'next/link'
import { ArrowUpRight, Quote, Star } from 'lucide-react'

const reviews = [
  { name: 'Olga Mercedes', quote: 'The service is excellent.' },
  { name: 'Isabel Clemente', quote: 'I recommend it 100%.' },
  { name: 'Mr. Avocato', quote: 'The best academy on the island.' },
] as const

export function CustomerVoices() {
  return (
    <section
      aria-labelledby="customer-voices-title"
      className="bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold text-blue-700">
            Public reviews, part of the experience
          </p>
          <h2
            id="customer-voices-title"
            className="mt-5 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl"
          >
            Let every academy voice be heard.
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Bring verified learner feedback into every course journey.
          </p>
        </div>

        <div className="mt-10 grid overflow-hidden rounded-2xl border border-slate-200 lg:grid-cols-3">
          {reviews.map((review, index) => (
            <article
              key={review.name}
              className={`relative min-h-[280px] p-7 sm:p-9 ${index < reviews.length - 1 ? 'border-b border-slate-200 lg:border-b-0 lg:border-r' : ''}`}
            >
              <Quote className="h-7 w-7 text-blue-200" aria-hidden="true" />
              <div className="mt-10 flex gap-1 text-amber-400" aria-label="Five star public review">
                {Array.from({ length: 5 }).map((_, star) => (
                  <Star key={star} className="h-4 w-4 fill-current" aria-hidden="true" />
                ))}
              </div>
              <blockquote className="mt-6 text-2xl font-semibold leading-9 tracking-tight">
                “{review.quote}”
              </blockquote>
              <p className="mt-7 text-sm font-semibold">{review.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                Public learner review presented by CEP Formación
              </p>
            </article>
          ))}
        </div>

        <div className="mt-7 flex flex-col gap-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>These learner reviews are published on CEP Formación&apos;s public academy website.</p>
          <Link
            href="https://cepformacion.akademate.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 font-semibold text-blue-700 hover:text-blue-900"
          >
            View public academy experience <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
