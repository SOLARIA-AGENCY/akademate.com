type StaffOperation = 'load' | 'save' | 'delete'

const GENERIC_STAFF_ERRORS: Record<StaffOperation, string> = {
  load: 'No se pudo cargar el personal. Inténtalo de nuevo o contacta con soporte.',
  save: 'No se pudo guardar la ficha de personal. Inténtalo de nuevo o contacta con soporte.',
  delete: 'No se pudo completar la baja del personal. Inténtalo de nuevo o contacta con soporte.',
}

export function formatStaffApiError(error: unknown, operation: StaffOperation = 'save'): string {
  if (!(error instanceof Error)) return GENERIC_STAFF_ERRORS[operation]

  const normalizedMessage = error.message.toLowerCase()
  if (
    normalizedMessage.includes('email') &&
    (normalizedMessage.includes('unique') ||
      normalizedMessage.includes('duplicate') ||
      normalizedMessage.includes('duplicat') ||
      normalizedMessage.includes('already exists') ||
      normalizedMessage.includes('ya existe'))
  ) {
    return 'Ya existe una ficha de personal con este email.'
  }

  if (
    (normalizedMessage.includes('nif') || normalizedMessage.includes('dni')) &&
    (normalizedMessage.includes('unique') ||
      normalizedMessage.includes('duplicate') ||
      normalizedMessage.includes('duplicat') ||
      normalizedMessage.includes('already exists') ||
      normalizedMessage.includes('ya existe'))
  ) {
    return 'Ya existe una ficha de personal con este DNI/NIF.'
  }

  if (normalizedMessage.includes('field is invalid: email')) return 'El email no tiene un formato válido.'
  if (normalizedMessage.includes('field is invalid: nif')) return 'El DNI/NIF no tiene un formato válido.'

  return GENERIC_STAFF_ERRORS[operation]
}
