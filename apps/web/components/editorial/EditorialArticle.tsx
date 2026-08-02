import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, UserRound } from 'lucide-react'
import type { BlogPost } from '@/lib/blog-posts'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import {
  getEditorialArticleSchema,
  getEditorialUi,
  getLocalizedEditorialPath,
} from '@/lib/editorial-i18n'
import { localizedHref, type Locale } from '@/lib/i18n/routing'

export function EditorialArticle({
  post,
  related,
  locale,
}: {
  post: BlogPost
  related: readonly BlogPost[]
  locale: Locale
}) {
  const isNews = post.kind === 'news'
  const indexHref = localizedHref(isNews ? '/news' : '/blog', locale)
  const content = getEditorialUi(locale).article
  const schema = getEditorialArticleSchema(post, locale)

  return (
    <div className="min-h-screen bg-white text-[#071633]">
      <Header />
      <main id="content">
        <article>
          <header
            className={
              isNews
                ? 'product-texture bg-[#06142f] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-24'
                : 'paper-texture px-4 py-16 sm:px-6 lg:px-8 lg:py-24'
            }
          >
            <div className="mx-auto max-w-4xl">
              <Link
                href={indexHref}
                className={`inline-flex min-h-11 items-center gap-2 text-sm font-semibold ${isNews ? 'text-blue-300' : 'text-blue-700'}`}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {isNews ? content.allNews : content.allInsights}
              </Link>
              <p
                className={`mt-8 text-sm font-semibold ${isNews ? 'text-blue-300' : 'text-blue-700'}`}
              >
                {isNews ? content.productUpdate : post.category}
              </p>
              <h1 className="mt-5 text-5xl font-semibold tracking-[-0.055em] sm:text-7xl">
                {post.title}
              </h1>
              <p
                className={`mt-7 max-w-3xl text-xl leading-9 ${isNews ? 'text-blue-100/70' : 'text-slate-600'}`}
              >
                {post.excerpt}
              </p>
              <div
                className={`mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm ${isNews ? 'text-blue-100/70' : 'text-slate-500'}`}
              >
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  <time dateTime={post.date}>{post.displayDate}</time>
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-4 w-4" aria-hidden="true" />
                  {post.readingTime}
                </span>
                <span className="inline-flex items-center gap-2">
                  <UserRound className="h-4 w-4" aria-hidden="true" />
                  {post.author}
                </span>
              </div>
            </div>
          </header>

          <div
            className={`relative mx-auto aspect-[16/8] max-w-[1500px] overflow-hidden ${isNews ? '' : 'sm:rounded-2xl'}`}
          >
            <Image
              src={post.image}
              alt={post.imageAlt}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </div>

          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[180px_1fr] lg:py-24">
            <aside className="hidden lg:block">
              <div className="sticky top-28 border-l border-blue-200 pl-5">
                <p className="text-xs font-semibold text-blue-700">
                  {isNews ? content.inThisUpdate : content.inThisGuide}
                </p>
                <ol className="mt-5 space-y-3 text-sm leading-5 text-slate-500">
                  {post.sections.map((section, index) => (
                    <li key={section.title}>
                      <a href={`#section-${index + 1}`} className="hover:text-blue-700">
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            </aside>

            <div className="max-w-3xl">
              <p data-copy-flow="long" className="text-xl leading-9 text-slate-700">
                {post.introduction}
              </p>
              {post.sections.map((section, index) => (
                <section
                  key={section.title}
                  id={`section-${index + 1}`}
                  className="scroll-mt-28 pt-14"
                >
                  <p className="text-xs font-semibold text-blue-700">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                    {section.title}
                  </h2>
                  {section.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      data-copy-flow="long"
                      className="mt-5 text-lg leading-8 text-slate-600"
                    >
                      {paragraph}
                    </p>
                  ))}
                  {section.points ? (
                    <ul className="mt-7 space-y-3 border-l-2 border-blue-600 bg-blue-50/60 py-5 pl-6 pr-5">
                      {section.points.map((point) => (
                        <li key={point} className="font-medium text-slate-800">
                          {point}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}

              <div className="mt-16 rounded-2xl border border-blue-200 bg-[#eff5ff] p-8 sm:p-10">
                <h2 className="text-3xl font-semibold tracking-tight">{content.ctaTitle}</h2>
                <p data-copy-flow="long" className="mt-4 leading-7 text-slate-600">
                  {content.ctaDescription}
                </p>
                <Link
                  href={localizedHref('/contacto?asunto=demo', locale)}
                  className="button-primary-dark mt-7"
                >
                  {content.ctaLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </article>

        {related.length ? (
          <section className="border-t border-slate-200 bg-[#f7f9fc] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="mx-auto max-w-6xl">
              <h2 className="text-3xl font-semibold">{content.relatedTitle}</h2>
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                {related.slice(0, 2).map((item) => (
                  <Link
                    key={item.slug}
                    href={getLocalizedEditorialPath(item, locale)}
                    className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-blue-300"
                  >
                    <p className="text-sm font-semibold text-blue-700">{item.category}</p>
                    <h3 className="mt-3 text-2xl font-semibold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{item.excerpt}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </div>
  )
}
