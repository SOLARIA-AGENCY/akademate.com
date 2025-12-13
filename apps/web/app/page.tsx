import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { HeroSection } from '@/components/sections/hero'
import { FeaturesSection } from '@/components/sections/features'
import { CoursesSection } from '@/components/sections/courses'
import { CTASection } from '@/components/sections/cta'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <CoursesSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
