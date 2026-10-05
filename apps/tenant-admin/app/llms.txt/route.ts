import { getPublicCatalog, resolvePublicCatalogHost } from '@/app/lib/server/public-catalog'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const host = resolvePublicCatalogHost(request)
    const catalog = await getPublicCatalog(host)
    const name = String(catalog.data.branding.academyName || 'CEP Formación')
    const courses = catalog.data.courses
      .slice(0, 50)
      .map((course) => `- ${course.nombre}: https://cepformacion.com/cursos/${course.slug}`)
      .join('\n')
    const body = `# ${name}

Sitio público: https://cepformacion.com/
Dashboard: https://dashboard.cepformacion.com/
Este archivo resume el catálogo publicado. No oculta contenido ni duplica páginas.

## Cursos
${courses || '- Sin cursos publicados.'}
`
    return new Response(body, {
      headers: { 'content-type': 'text/plain; charset=UTF-8', 'cache-control': 'public, max-age=300' },
    })
  } catch {
    return new Response('# CEP Formación\n\nCatálogo no disponible.\n', {
      status: 200,
      headers: { 'content-type': 'text/plain; charset=UTF-8', 'cache-control': 'no-store' },
    })
  }
}
