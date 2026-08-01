import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Laptop, Smartphone, Tablet } from 'lucide-react'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { AppDownloadShowcase } from '@/components/marketing/AppDownloadShowcase'

export const metadata: Metadata = {
  title: 'Download Akademate apps — Coming soon',
  description:
    'Preview the upcoming Akademate apps for Mac, iPhone and iPad. Native applications are coming soon.',
  alternates: { canonical: '/download' },
}

export default function DownloadPage() {
  return (
    <div className="marketing-page min-h-screen bg-[#f7f9fc] text-[#071633]">
      <Header />
      <main id="content">
        <section className="product-texture overflow-hidden bg-[#06142f] px-4 py-12 text-white sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[.9fr_1.1fr]">
            <div className="max-w-xl">
              <p className="text-sm font-semibold text-blue-200">Coming soon</p>
              <h1 className="mt-5 text-5xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl">
                Akademate on every screen.
              </h1>
              <p className="mt-6 text-lg leading-8 text-blue-100/75">
                Future native apps for academy teams, teachers and learners.
              </p>
              <div className="mt-8 flex flex-wrap gap-2 text-sm font-semibold text-blue-100/80">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2">
                  <Laptop className="h-4 w-4" aria-hidden="true" /> Mac
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2">
                  <Smartphone className="h-4 w-4" aria-hidden="true" /> iPhone
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2">
                  <Tablet className="h-4 w-4" aria-hidden="true" /> iPad
                </span>
              </div>
            </div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl shadow-[0_32px_100px_rgba(2,12,34,.45)]">
              <Image
                src="/images/download/akademate-apps-device-family-v1.jpg"
                alt="Future Akademate experiences presented across laptop, tablet and smartphone"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        <AppDownloadShowcase />

        <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
          <div className="product-texture mx-auto max-w-7xl rounded-2xl bg-[#071633] px-6 py-14 text-center text-white sm:px-12">
            <p className="text-sm font-semibold text-blue-200">Product roadmap</p>
            <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              Bring Akademate to your academy.
            </h2>
            <p className="mx-auto mt-5 max-w-xl leading-7 text-blue-100/70">
              Talk to us about web access today and native app priorities.
            </p>
            <Link href="/contacto?asunto=apps" className="button-primary-light mt-8">
              Discuss your workflow <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
