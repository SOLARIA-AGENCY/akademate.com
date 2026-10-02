const PLACEHOLDER = 'Profesional asignado a esta convocatoria.'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function extractProfessorPosition(html: string): string | null {
  const match = html.match(/<p class="mt-4 text-xl text-white\/80">([^<]+)<\/p>/)
  const title = match?.[1]?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim()
  return title || null
}

export async function fillInstructorTitles(
  html: string,
  loadPosition: (href: string) => Promise<string | null>,
): Promise<string> {
  if (!html.includes(PLACEHOLDER)) return html
  const hrefs = [...html.matchAll(/href="(\/p\/profesores\/[^"]+)"/g)].map((match) => match[1])
  const positions = new Map<string, string>()
  await Promise.all([...new Set(hrefs)].map(async (href) => {
    const title = (await loadPosition(href))?.trim()
    if (title) positions.set(href, title)
  }))
  const parts = html.split(PLACEHOLDER)
  let out = parts[0] || ''
  for (let index = 1; index < parts.length; index += 1) {
    const href = [...out.matchAll(/href="(\/p\/profesores\/[^"]+)"/g)].at(-1)?.[1]
    const title = href ? positions.get(href) : ''
    out += `${title ? escapeHtml(title) : PLACEHOLDER}${parts[index]}`
  }
  return out
}
