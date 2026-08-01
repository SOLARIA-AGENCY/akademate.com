import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CalendarDays, Newspaper } from 'lucide-react'
import type { BlogPost } from '@/lib/blog-posts'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'

export function EditorialIndex({
  kind,
  posts,
}: {
  kind: 'insight' | 'news'
  posts: readonly BlogPost[]
}) {
  return kind === 'news' ? <NewsIndex posts={posts} /> : <InsightIndex posts={posts} />
}

function InsightIndex({ posts }: { posts: readonly BlogPost[] }) {
  const [featured, ...remaining] = posts
  return (
    <div className="marketing-page min-h-screen bg-white text-[#071633]">
      <Header />
      <main id="content">
        <section className="paper-texture px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <p className="section-kicker">Akademate insights</p>
            <h1 className="mt-5 max-w-5xl text-5xl font-semibold tracking-[-0.055em] sm:text-7xl">
              Ideas for better academy operations.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
              Practical guides for growing, teaching and operating with clarity.
            </p>
          </div>
        </section>

        {featured ? (
          <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
            <article className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-slate-200 bg-[#f7f9fc]">
              <Link
                href={`/blog/${featured.slug}`}
                className="group grid lg:grid-cols-[1.15fr_.85fr] lg:items-stretch"
              >
                <div className="relative min-h-[360px] overflow-hidden">
                  <Image
                    src={featured.image}
                    alt={featured.imageAlt}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    className="object-cover transition duration-700 group-hover:scale-[1.025]"
                  />
                </div>
                <div className="flex flex-col justify-center p-8 sm:p-12">
                  <EditorialMeta post={featured} />
                  <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] group-hover:text-blue-700 sm:text-5xl">
                    {featured.title}
                  </h2>
                  <p className="mt-5 text-lg leading-8 text-slate-600">{featured.excerpt}</p>
                  <span className="mt-8 inline-flex items-center gap-2 font-semibold text-blue-700">
                    Read the guide <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </article>
          </section>
        ) : null}

        <section className="border-t border-slate-200 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-2">
              {remaining.map((post) => (
                <article
                  key={post.slug}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  <Link href={`/blog/${post.slug}`} className="group block p-3">
                    <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
                      <Image
                        src={post.image}
                        alt={post.imageAlt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover transition duration-700 group-hover:scale-[1.025]"
                      />
                    </div>
                    <div className="p-5 sm:p-7">
                      <EditorialMeta post={post} />
                      <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] group-hover:text-blue-700">
                        {post.title}
                      </h2>
                      <p className="mt-4 leading-7 text-slate-600">{post.excerpt}</p>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

function NewsIndex({ posts }: { posts: readonly BlogPost[] }) {
  return (
    <div className="marketing-page min-h-screen bg-[#f4f7fb] text-[#071633]">
      <Header />
      <main id="content">
        <section className="product-texture bg-[#06142f] px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <Newspaper className="h-10 w-10 text-blue-300" strokeWidth={1.6} aria-hidden="true" />
            <p className="mt-8 text-sm font-semibold text-blue-300">Akademate newsroom</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-[-0.055em] sm:text-7xl">
              Product news and company updates.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-blue-100/70">
              New capabilities, operating profiles and platform direction.
            </p>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl space-y-8">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(7,22,51,.06)]"
              >
                <Link
                  href={`/news/${post.slug}`}
                  className="group grid lg:grid-cols-[.42fr_.58fr] lg:items-stretch"
                >
                  <div className="relative min-h-[300px] overflow-hidden">
                    <Image
                      src={post.image}
                      alt={post.imageAlt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 42vw"
                      className="object-cover transition duration-700 group-hover:scale-[1.025]"
                    />
                  </div>
                  <div className="flex flex-col justify-center p-8 sm:p-12">
                    <div className="flex items-center gap-3 text-xs font-semibold text-blue-700">
                      <CalendarDays className="h-4 w-4" aria-hidden="true" />
                      <time dateTime={post.date}>{post.displayDate}</time>
                      <span>·</span>
                      <span>{post.readingTime}</span>
                    </div>
                    <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] group-hover:text-blue-700">
                      {post.title}
                    </h2>
                    <p className="mt-5 text-lg leading-8 text-slate-600">{post.excerpt}</p>
                    <span className="mt-8 inline-flex items-center gap-2 font-semibold text-blue-700">
                      Read the update <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

function EditorialMeta({ post }: { post: BlogPost }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-blue-700">
      <span>{post.category}</span>
      <span>·</span>
      <time dateTime={post.date}>{post.displayDate}</time>
      <span>·</span>
      <span>{post.readingTime}</span>
    </div>
  )
}
