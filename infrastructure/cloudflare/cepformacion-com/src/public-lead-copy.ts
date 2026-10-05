const LEAD_SENTENCE = / ?El lead quedar(?:á|\\+u00e1) registrado para seguimiento comercial\.?/gi
const LEAD_FORM = /Formulario conectado con el flujo actual de leads\./g
const LEAD_HISTORY = /en el historial del lead/gi

export function stripPublicLeadCopy(html: string): string {
  return html.replace(LEAD_SENTENCE, '').replace(LEAD_FORM, 'Déjanos tus datos y un asesor de CEP te orientará.').replace(LEAD_HISTORY, 'en el historial')
}
