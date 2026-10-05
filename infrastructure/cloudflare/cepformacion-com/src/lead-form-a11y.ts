const LEAD_CSS = `<style data-cep-lead-a11y="1">form p.text-gray-400,form p[class*="text-gray-400"]{color:#6b7280!important}</style>`

const FIELDS: Array<[string, string, string]> = [
  ['Nombre completo *', 'name', 'Nombre completo'],
  ['Email *', 'email', 'Correo electrónico'],
  ['Telefono *', 'tel', 'Teléfono'],
]

export function rewriteLeadFormScript(source: string): string {
  let next = source
  for (const [placeholder, complete, label] of FIELDS) {
    const from = `placeholder:"${placeholder}"`
    const to = `placeholder:"${placeholder}",autoComplete:"${complete}","aria-label":"${label}"`
    if (next.includes(from) && !next.includes(to)) next = next.split(from).join(to)
  }
  return next
}

const NAMED_FIELDS: Array<[string, string, string]> = [
  ['Nombre', 'nombre', 'name'],
  ['Teléfono', 'telefono', 'tel'],
  ['Email', 'email', 'email'],
  ['Cuéntanos qué formación te interesa', 'mensaje', 'off'],
]

function nameLeadFields(html: string): string {
  let next = html
  for (const [placeholder, name, complete] of NAMED_FIELDS) {
    const id = `cep-${name}`
    const visible = `placeholder="${placeholder}"`
    if (next.includes(visible) && !next.includes(`placeholder="${placeholder}" id=`)) {
      next = next.split(visible).join(`${visible} id="${id}" name="${name}" autocomplete="${complete}"`)
    }
    const flight = `\\"placeholder\\":\\"${placeholder}\\"`
    if (next.includes(flight) && !next.includes(`\\"id\\":\\"${id}\\"`)) {
      next = next.split(flight).join(`${flight},\\"id\\":\\"${id}\\",\\"name\\":\\"${name}\\",\\"autoComplete\\":\\"${complete}\\"`)
    }
  }
  return next
}

export function rewriteLeadFormHtml(html: string): string {
  const named = nameLeadFields(html)
  if (!named.includes('placeholder="Nombre completo *"') && !named.includes('placeholder="Email *"')) return named
  let next = named
  for (const [placeholder, complete, label] of FIELDS) {
    const from = `placeholder="${placeholder}"`
    const to = `placeholder="${placeholder}" autocomplete="${complete}" aria-label="${label}"`
    if (next.includes(from) && !next.includes(`placeholder="${placeholder}" autocomplete=`)) {
      next = next.split(from).join(to)
    }
  }
  if (!next.includes('data-cep-lead-a11y="1"') && next.includes('</head>')) {
    next = next.replace('</head>', `${LEAD_CSS}</head>`)
  }
  if (next.includes('placeholder="Nombre completo *"') && !next.includes('?cep=lead1')) {
    next = next.replace(/(\/_next\/static\/chunks\/[^"?]+\.js)"/g, '$1?cep=lead1"')
  }
  return next
}
