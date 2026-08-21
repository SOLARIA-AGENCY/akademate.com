import type { Metadata } from 'next'
import { getTenantWebsite } from '@/app/lib/website/server'
import { findPageBySlug } from '@/app/lib/website/editor'
import { getCatalogPageBySlug } from '@/app/(app)/(dashboard)/contenido/paginas/page-catalog'
import { AcademyLoginForm } from './_components/AcademyLoginForm'
import { sectionEditorCopy } from '@/app/lib/website-page-persist'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const website = await getTenantWebsite()
  const page = findPageBySlug(website, 'acceso')
  return {
    title: page?.seo?.title || 'Acceso al campus',
    description: page?.seo?.description || 'Entra al campus virtual con tu cuenta de alumno.',
    keywords: website.seo?.keywords?.length ? website.seo.keywords : undefined,
  }
}

function copyFor(sectionId: string, fallbackTitle: string, fallbackBody: string) {
  return { title: fallbackTitle, body: fallbackBody, sectionId }
}

export default async function AccesoPage() {
  const website = await getTenantWebsite()
  const stored = findPageBySlug(website, 'acceso')
  const catalog = getCatalogPageBySlug('acceso')
  const sections = stored?.sections ?? []

  const hero = sections.find((section) => section.id === 'hero' || section.kind === 'ctaBanner')
  const form = sections.find((section) => section.id === 'loginForm')
  const recover = sections.find((section) => section.id === 'recover')
  const help = sections.find((section) => section.id === 'help')

  const heroCopy = copyFor('hero', stored?.title || catalog?.title || 'Acceso al campus', hero ? sectionEditorCopy(hero) : 'Entra con el correo y la contraseña de alumno para continuar tus cursos.')
  const formCopy = form ? sectionEditorCopy(form) : 'Usa las credenciales que te envió el centro.'
  const recoverCopy = recover ? sectionEditorCopy(recover) : 'Si olvidaste la contraseña, recupera el acceso desde el enlace del formulario.'
  const helpCopy = help ? sectionEditorCopy(help) : 'Sin cuenta todavía: contacta con orientación. Este acceso es solo para alumnos.'

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Campus virtual</p>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">{heroCopy.title}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{heroCopy.body || formCopy}</p>
        <p className="text-sm leading-6 text-muted-foreground">{recoverCopy}</p>
        <p className="text-sm leading-6 text-muted-foreground">{helpCopy}</p>
      </div>
      <div className="rounded-xl border border-border/80 bg-muted/70 p-4 shadow-none">
        <p className="text-xs font-semibold text-neutral-950">Entrar</p>
        <div className="mt-3">
          <AcademyLoginForm recoverHref="/campus/recuperar" helpHref="/contacto" />
        </div>
      </div>
    </div>
  )
}
