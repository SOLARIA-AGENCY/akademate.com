import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { PublicPageHero } from '../../../_components/PublicPageHero'
import { CEP_PUBLIC_HERO_ASSETS } from '../../../_components/public-hero-assets'
import {
  findSyntheticAgency,
  isPublicPlacementEmail,
  SYNTHETIC_PLACEMENT_AGENCIES,
} from '@/src/domain/placement-agency'

export function generateStaticParams() {
  return SYNTHETIC_PLACEMENT_AGENCIES.map((agency) => ({ slug: agency.slug }))
}

export default async function PlacementAgencyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const agency = findSyntheticAgency(slug)
  if (!agency) notFound()

  return (
    <div className="bg-white text-slate-950">
      <PublicPageHero
        eyebrow={agency.campusLabel}
        title={agency.title}
        description={`${agency.hoursLabel} · Autorización ${agency.authorizationCode}`}
        imageSrc={CEP_PUBLIC_HERO_ASSETS.agencia}
        imageAlt={`Agencia de colocación ${agency.campusLabel}`}
      />
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        {isPublicPlacementEmail(agency.email) ? (
          <p className="text-lg">
            Contacto:{' '}
            <a className="font-semibold underline" href={`mailto:${agency.email}`}>
              {agency.email}
            </a>
          </p>
        ) : null}
        <ul className="space-y-4">
          {agency.legalBlocks.map((block) => (
            <li key={block.slice(0, 24)} className="rounded-2xl border border-slate-200 p-5 text-sm leading-7">
              {block}
            </li>
          ))}
        </ul>
        <Link
          href="/p/agencia-colocacion"
          className="mt-10 inline-flex items-center gap-2 text-sm font-black text-[#f2014b]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Todas las sedes
        </Link>
      </section>
    </div>
  )
}
