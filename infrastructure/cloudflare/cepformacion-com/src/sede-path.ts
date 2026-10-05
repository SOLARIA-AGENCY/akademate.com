/** Public sede URLs sit one level up: /sedes/:slug, never /p/sedes/:slug. */
export function liftSedeRequestPath(pathname: string): string | null {
  if (pathname === '/p/sedes' || pathname.startsWith('/p/sedes/')) {
    return pathname.replace(/^\/p\/sedes/, '/sedes')
  }
  return null
}

export function liftSedePaths(html: string): string {
  return html.replace(
    /(\b(?:href|content)=["'][^"']*?|https:\/\/cepformacion\.com|"url"\s*:\s*"|\\"href\\":\\"|\\"url\\":\\")\/p\/sedes\b/g,
    '$1/sedes',
  )
}
