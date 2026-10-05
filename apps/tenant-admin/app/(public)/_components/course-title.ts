/** Keep in sync with infrastructure/cloudflare/cepformacion-com/src/home-courses.ts */
export function displayCourseTitle(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return trimmed
  const lower = trimmed.toLocaleLowerCase('es')
  const sentence = lower.charAt(0).toLocaleUpperCase('es') + lower.slice(1)
  return sentence.replace(/\b(i{1,3}|iv|vi{0,3}|ix|xi{0,3}|xl)\b/gi, (match) => match.toLocaleUpperCase('es'))
}
