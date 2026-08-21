import type { WebsiteTemplatePage } from './types'

const PRIVACY_BODY =
  'El centro trata datos de contacto e inscripción para atender solicitudes, formalizar matrícula y cumplir obligaciones legales. Puede ejercer acceso, rectificación, supresión, oposición, limitación y portabilidad ante el responsable publicado en esta página. Las cookies no esenciales solo se usan con consentimiento.'

const COOKIES_BODY =
  'Las cookies técnicas son necesarias para el servicio. La analítica y la publicidad de Google o Meta solo se listan y cargan si el centro las tiene activadas y usted las autoriza. Puede rechazar las no esenciales o cambiar preferencias en cualquier momento.'

export function legalTemplatePages(): WebsiteTemplatePage[] {
  return [
    {
      slug: 'privacidad',
      title: 'Privacidad',
      path: '/legal/privacidad',
      pageKind: 'legal',
      modules: [
        {
          kind: 'richText',
          defaultProps: {
            title: 'Política de privacidad',
            body: PRIVACY_BODY,
          },
        },
      ],
    },
    {
      slug: 'cookies',
      title: 'Cookies',
      path: '/legal/cookies',
      pageKind: 'legal',
      modules: [
        {
          kind: 'richText',
          defaultProps: {
            title: 'Cookies y consentimiento',
            body: COOKIES_BODY,
          },
        },
      ],
    },
  ]
}
