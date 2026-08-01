import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { blogPosts } from '@/lib/blog-posts'

export const metadata: Metadata = {
  title: 'Stories and product news',
  description: 'Playbooks, ideas and Akademate product news for ambitious learning businesses.',
  alternates: { canonical: '/blog' },
}

export default function BlogPage() {
  return (
    <div className="marketing-page min-h-screen bg-white text-[#071633]">
      <Header />
      <main id="content">
        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <p className="section-kicker">Stories, playbooks and news</p>
            <h1 className="mt-5 max-w-5xl text-5xl font-semibold tracking-[-0.055em] sm:text-7xl">
              Ideas for ambitious academies.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
              Practical ideas for a stronger academy experience.
            </p>
          </div>
        </section>
        <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
          <div className="mx-auto grid max-w-7xl gap-x-8 gap-y-14 lg:grid-cols-2">
            {blogPosts.map((post, index) => (
              <article key={post.slug} className={index === 0 ? 'lg:col-span-2' : ''}>
                <Link
                  href={`/blog/${post.slug}`}
                  className={
                    index === 0
                      ? 'group grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-center'
                      : 'group block'
                  }
                >
                  <div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
                    <Image
                      src={post.image}
                      alt={post.imageAlt}
                      fill
                      sizes={
                        index === 0
                          ? '(max-width: 1024px) 100vw, 60vw'
                          : '(max-width: 1024px) 100vw, 50vw'
                      }
                      className="object-cover transition duration-700 group-hover:scale-[1.025]"
                    />
                  </div>
                  <div>
                    <div className="mt-6 flex items-center gap-3 text-xs font-semibold text-blue-700 lg:mt-0">
                      <span>{post.category}</span>
                      <span>·</span>
                      <time dateTime={post.date}>{post.displayDate}</time>
                      <span>·</span>
                      <span>{post.readingTime}</span>
                    </div>
                    <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] group-hover:text-blue-700 sm:text-4xl">
                      {post.title}
                    </h2>
                    <p className="mt-4 max-w-2xl leading-7 text-slate-600">{post.excerpt}</p>
                    <span className="mt-6 inline-flex items-center gap-2 font-semibold text-blue-700">
                      Read the story <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
