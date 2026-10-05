// No llamar desde rewritePublicHtml. Quitar estas copias pinta
// "No se pudo cargar esta página" en el home. El origen ya las emite iguales.
const SCRIPT_TAG = /<script\b[^>]*>[\s\S]*?<\/script>/gi

function scriptBody(script: string): string {
  return script.replace(/^<script\b[^>]*>/i, '').replace(/<\/script>$/i, '')
}

export function dedupeIdenticalNextFlight(html: string): string {
  const seen = new Set<string>()
  return html.replace(SCRIPT_TAG, (script) => {
    const body = scriptBody(script)
    if (!body.includes('self.__next_f')) return script
    if (seen.has(body)) return ''
    seen.add(body)
    return script
  })
}
