import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { PublicCardCta } from './PublicCardCta'
import { PublicInfoRows } from './PublicInfo'

export function AreaPublicCard({
  title,
  href,
  imageUrl,
}: {
  title: string
  href: string
  imageUrl: string
}) {
  return (
    <Link href={href} aria-label={`Ver cursos de ${title}`} className="group block h-full">
      <Card className="h-full overflow-hidden border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
        <div className="relative h-56 overflow-hidden">
          <img src={imageUrl} alt={title} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-transparent" />
        </div>
        <CardContent className="flex min-h-[9.5rem] flex-col p-6">
          <h3 className="line-clamp-2 min-h-[3.5rem] text-xl font-black uppercase leading-tight text-slate-950">
            {title.replace(/^Área\s+/i, '')}
          </h3>
          <PublicCardCta className="mt-auto min-h-11 w-fit min-w-[11rem]">Ver formaciones</PublicCardCta>
        </CardContent>
      </Card>
    </Link>
  )
}

export function CampusPublicCard({
  name,
  href,
  imageUrl,
  city,
  address,
  phone,
  schedule,
}: {
  name: string
  href: string
  imageUrl?: string | null
  city?: string | null
  address?: string | null
  phone?: string | null
  schedule?: string | null
}) {
  return (
    <Link href={href} className="group block h-full">
      <Card className="h-full overflow-hidden border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
        <div className="relative h-72 overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={name} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="h-full w-full bg-slate-200" />
          )}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/55 to-transparent" />
        </div>
        <CardContent className="space-y-4 p-7">
          <div>
            <h3 className="text-2xl font-black text-slate-950">{name}</h3>
            <p className="mt-2 text-base leading-7 text-slate-600">{city || 'Tenerife'}</p>
          </div>
          <PublicInfoRows
            className="border-t border-slate-100 bg-slate-50/70"
            items={[
              { label: 'Dirección', value: address || 'Consultar dirección' },
              ...(phone ? [{ label: 'Teléfono', value: phone }] : []),
              { label: 'Horario', value: schedule || 'Consultar horario' },
            ]}
          />
          <span className="inline-flex items-center justify-center rounded-full bg-[#f2014b] px-5 py-2.5 text-sm font-black text-white shadow-sm transition group-hover:bg-[#d0013f]">
            Visitar sede
            <ArrowRight className="ml-2 h-4 w-4" />
          </span>
        </CardContent>
      </Card>
    </Link>
  )
}
