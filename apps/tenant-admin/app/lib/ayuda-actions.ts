export type AyudaPinnedActionId = 'chat' | 'videos' | 'pdf'

export const AYUDA_PINNED_ACTIONS: Array<{
  id: AyudaPinnedActionId
  title: string
  target: string
}> = [
  { id: 'chat', title: 'Chat con Asistente IA', target: '#ayuda-chat' },
  { id: 'videos', title: 'Video Tutoriales', target: '#ayuda-videos' },
  { id: 'pdf', title: 'Documentación PDF', target: '#ayuda-documentos' },
]

export function buildAyudaManual(input: {
  sections: Array<{ title: string; guides: Array<{ title: string; description: string }> }>
  faqs: Array<{ question: string; answer: string }>
}): string {
  const lines = ['# Manual de Ayuda — CEP Formación', '']
  for (const section of input.sections) {
    lines.push(`## ${section.title}`, '')
    for (const guide of section.guides) {
      lines.push(`### ${guide.title}`, guide.description, '')
    }
  }
  lines.push('## Preguntas frecuentes', '')
  for (const faq of input.faqs) {
    lines.push(`### ${faq.question}`, faq.answer, '')
  }
  return lines.join('\n')
}

export function matchAyudaAnswer(
  query: string,
  corpus: Array<{ title: string; body: string }>,
): { title: string; body: string } | null {
  const needle = query.trim().toLowerCase()
  if (!needle) return null
  return (
    corpus.find((item) => item.title.toLowerCase().includes(needle) || item.body.toLowerCase().includes(needle)) ??
    null
  )
}
