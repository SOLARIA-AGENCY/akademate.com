export const EMPLEO_OFFICE_IMAGE = '/website/cep/empleo/bolsa-empleo-oficina.jpg'
export const UNKNOWN_EMPLEO_PORTRAIT = '/media/admin-1.jpg'
export const EMPLEO_OFFICE_ALT = 'Oficina de la bolsa de empleo de CEP Formación'

export function isEmpleoAssetPath(pathname: string): boolean {
  return pathname === EMPLEO_OFFICE_IMAGE
}
