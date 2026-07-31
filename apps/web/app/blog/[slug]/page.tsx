import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { blogPosts, getBlogPost } from '@/lib/blog-posts'

export function generateStaticParams() { return blogPosts.map((post) => ({ slug: post.slug })) }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const post = getBlogPost(slug); if (!post) return {}; return { title: post.title, description: post.excerpt, alternates: { canonical: `/blog/${post.slug}` }, openGraph: { title: post.title, description: post.excerpt, images: [{ url: post.image }] } } }

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) notFound()
  return <div className="min-h-screen bg-white text-[#071633]"><Header /><main id="content"><article><header className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24"><div className="mx-auto max-w-4xl"><Link href="/blog" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-700"><ArrowLeft className="h-4 w-4" aria-hidden="true" />All stories</Link><div className="mt-8 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700"><span>{post.category}</span><span>·</span><time dateTime={post.date}>{post.displayDate}</time><span>·</span><span>{post.readingTime}</span></div><h1 className="mt-5 text-5xl font-semibold tracking-[-0.055em] sm:text-7xl">{post.title}</h1><p className="mt-7 max-w-3xl text-xl leading-9 text-slate-600">{post.excerpt}</p></div></header><div className="relative mx-auto aspect-[16/8] max-w-[1500px] overflow-hidden sm:rounded-[2rem]"><Image src={post.image} alt={post.imageAlt} fill priority sizes="100vw" className="object-cover" /></div><div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24"><p className="text-xl leading-9 text-slate-700">{post.introduction}</p>{post.sections.map((section) => <section key={section.title} className="mt-14"><h2 className="text-3xl font-semibold tracking-[-0.035em]">{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-5 text-lg leading-8 text-slate-600">{paragraph}</p>)}{section.points ? <ul className="mt-7 space-y-3 border-l-2 border-blue-600 pl-6">{section.points.map((point) => <li key={point} className="font-medium text-slate-800">{point}</li>)}</ul> : null}</section>)}<div className="mt-16 rounded-[2rem] bg-[#071633] p-8 text-white sm:p-10"><h2 className="text-3xl font-semibold tracking-tight">Ready to turn the idea into momentum?</h2><p className="mt-4 leading-7 text-blue-100/70">See how Akademate can create a smoother journey for your team and every person your academy serves.</p><Link href="/contacto?asunto=demo" className="button-primary-light mt-7">See Akademate in action <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div></div></article></main><Footer /></div>
}
