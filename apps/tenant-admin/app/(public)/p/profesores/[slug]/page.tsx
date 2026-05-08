import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

function resolveImageUrl(image: any): string | null {
  if (!image) return null
  if (typeof image === 'object' && image.url) return image.url
  if (typeof image === 'object' && image.filename) return `/media/${image.filename}`
  return null
}

function staffName(staff: any): string {
  return staff.full_name || [staff.first_name, staff.last_name].filter(Boolean).join(' ').trim() || 'Docente CEP'
}

async function getProfessor(slug: string) {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'staff',
    where: {
      and: [
        { id: { equals: slug } },
        { staff_type: { equals: 'profesor' } },
        { is_active: { equals: true } },
      ],
    } as any,
    limit: 1,
    depth: 2,
  })

  return result.docs[0] as any
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const professor = await getProfessor(slug)
  if (!professor) return { title: 'Docente no encontrado' }
  return {
    title: `${staffName(professor)} | Profesorado CEP Formacion`,
    description: professor.bio || `Ficha docente de ${staffName(professor)} en CEP Formacion.`,
  }
}

export default async function ProfesorPublicPage({ params }: Props) {
  const { slug } = await params
  const professor = await getProfessor(slug)
  if (!professor) notFound()

  const name = staffName(professor)
  const photoUrl = resolveImageUrl(professor.photo)
  const certifications = Array.isArray(professor.certifications) ? professor.certifications : []
  const campuses = Array.isArray(professor.assigned_campuses)
    ? professor.assigned_campuses.filter((campus: any) => typeof campus === 'object')
    : []
  const specialties = Array.isArray(professor.specialties) ? professor.specialties : []

  return (
    <main className="min-h-screen bg-white">
      <section className="bg-slate-950 px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[260px_1fr] md:items-center">
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="h-64 w-64 rounded-3xl object-cover shadow-2xl" />
          ) : (
            <div className="flex h-64 w-64 items-center justify-center rounded-3xl bg-white/10 text-6xl font-black">
              {name[0]}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-200">Profesorado CEP</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">{name}</h1>
            {professor.position ? <p className="mt-4 text-xl text-white/80">{professor.position}</p> : null}
            {professor.bio ? <p className="mt-6 max-w-3xl text-lg leading-8 text-white/75">{professor.bio}</p> : null}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.3fr_0.8fr] lg:px-8">
        <div className="space-y-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">Titulaciones y certificaciones</h2>
            {certifications.length > 0 ? (
              <div className="mt-5 grid gap-3">
                {certifications.map((cert: any, index: number) => (
                  <div key={cert.id || index} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-950">{cert.title}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {[cert.institution, cert.year].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-slate-600">Titulaciones pendientes de publicar.</p>
            )}
          </div>

          {specialties.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-950">Especialidades</h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {specialties.map((specialty: string) => (
                  <span key={specialty} className="rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-bold text-slate-950">Sedes vinculadas</h2>
            <div className="mt-4 space-y-3">
              {campuses.length > 0 ? campuses.map((campus: any) => (
                <Link
                  key={campus.id}
                  href={`/p/sedes/${campus.slug || campus.id}`}
                  className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-red-200 hover:shadow-sm"
                >
                  <p className="font-semibold text-slate-950">{campus.name}</p>
                  {campus.city ? <p className="mt-1 text-sm text-slate-500">{campus.city}</p> : null}
                </Link>
              )) : (
                <p className="text-sm text-slate-500">Sedes pendientes de publicar.</p>
              )}
            </div>
          </div>
        </aside>
      </section>
    </main>
  )
}
