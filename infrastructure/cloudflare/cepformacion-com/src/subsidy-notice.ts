import type { CatalogSnapshot } from './render'

const NOTICE = `<aside data-cep-subsidy-notice="1" style="margin:1rem 0 1.5rem;max-width:40rem;padding:.9rem 1rem;border:1px solid #e2e8f0;border-radius:12px;background:#fff;color:#0f172a">
<p style="margin:0;font-size:.95rem;line-height:1.5"><strong>Formación gratuita.</strong> La financia el Fondo Social Europeo y el Servicio Canario de Empleo. La gestiona APROEM. El detalle económico se solicita en la página de transparencia.</p>
<div style="display:flex;flex-wrap:wrap;align-items:center;gap:1rem;margin-top:.75rem">
<img src="/logos/cep-formacion-logo-rectangular.png" alt="CEP Formación" style="height:36px;width:auto;background:#fff"/>
<img src="/website/cep/certifications/fondo-social-europeo.jpeg" alt="Fondo Social Europeo" style="height:42px;width:auto"/>
<img src="/website/cep/certifications/servicio-canario-empleo.jpg" alt="Servicio Canario de Empleo" style="height:42px;width:auto"/>
</div>
<p style="margin:.6rem 0 0;font-size:.9rem"><a href="/legal/transparencia">Transparencia de la subvención</a></p>
</aside>`

function courseSlug(pathname: string): string | null {
  const path = pathname.replace(/\/+$/, '')
  const match = path.match(/^\/(?:p\/)?cursos\/([^/]+)$/)
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

export function rewriteSubsidyNotice(
  html: string,
  pathname: string,
  snapshot: CatalogSnapshot | null,
): string {
  if (html.includes('data-cep-subsidy-notice="1"')) return html
  const slug = courseSlug(pathname)
  if (!slug) return html
  const course = snapshot?.data.courses.find((item) => item.slug === slug)
  const kind = course?.studyType
  const marked = kind === 'desempleados' || kind === 'ocupados' || html.includes('Formación gratuita subvencionada')
  if (!marked) return html
  const badge = 'Formación gratuita subvencionada</div>'
  if (html.includes(badge)) return html.replace(badge, `${badge}${NOTICE}`)
  if (html.includes('<main')) return html.replace('<main', `${NOTICE}<main`)
  return `${NOTICE}${html}`
}
