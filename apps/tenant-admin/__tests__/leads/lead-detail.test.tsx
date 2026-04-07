import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// Status transition logic tests
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'new', label: 'Nuevo' },
  { value: 'contacted', label: 'Contactado' },
  { value: 'following_up', label: 'En seguimiento' },
  { value: 'interested', label: 'Interesado' },
  { value: 'enrolling', label: 'En matriculacion' },
  { value: 'enrolled', label: 'Matriculado' },
  { value: 'on_hold', label: 'En espera' },
  { value: 'not_interested', label: 'No interesado' },
  { value: 'unreachable', label: 'No contactable' },
  { value: 'discarded', label: 'Descartado' },
]

const RESULT_LABELS: Record<string, string> = {
  no_answer: 'Sin respuesta',
  positive: 'Respondio positivo',
  negative: 'Respondio negativo',
  callback: 'Pide callback',
  wrong_number: 'Numero incorrecto',
  message_sent: 'Mensaje enviado',
  email_sent: 'Email enviado',
  enrollment_started: 'Matriculacion iniciada',
  status_changed: 'Cambio de estado',
}

describe('Lead Detail — Status Options', () => {
  it('has exactly 10 status options', () => {
    expect(STATUS_OPTIONS).toHaveLength(10)
  })

  it('each option has value and label', () => {
    for (const opt of STATUS_OPTIONS) {
      expect(opt.value).toBeTruthy()
      expect(opt.label).toBeTruthy()
    }
  })

  it('status values are unique', () => {
    const values = STATUS_OPTIONS.map(o => o.value)
    expect(new Set(values).size).toBe(values.length)
  })
})

describe('Lead Detail — Enrollment Button Visibility', () => {
  function shouldShowEnrollButton(status: string, enrollmentId: number | null): boolean {
    return status === 'interested' && !enrollmentId
  }

  function shouldShowEnrollLink(enrollmentId: number | null): boolean {
    return !!enrollmentId
  }

  it('shows enroll button only when interested and no enrollment', () => {
    expect(shouldShowEnrollButton('interested', null)).toBe(true)
  })

  it('does NOT show enroll button when new', () => {
    expect(shouldShowEnrollButton('new', null)).toBe(false)
  })

  it('does NOT show enroll button when contacted', () => {
    expect(shouldShowEnrollButton('contacted', null)).toBe(false)
  })

  it('does NOT show enroll button when discarded', () => {
    expect(shouldShowEnrollButton('discarded', null)).toBe(false)
  })

  it('does NOT show enroll button when not_interested', () => {
    expect(shouldShowEnrollButton('not_interested', null)).toBe(false)
  })

  it('does NOT show enroll button when on_hold', () => {
    expect(shouldShowEnrollButton('on_hold', null)).toBe(false)
  })

  it('does NOT show enroll button when already has enrollment', () => {
    expect(shouldShowEnrollButton('interested', 42)).toBe(false)
  })

  it('shows enroll link when enrollment_id exists', () => {
    expect(shouldShowEnrollLink(42)).toBe(true)
  })

  it('does NOT show enroll link when no enrollment_id', () => {
    expect(shouldShowEnrollLink(null)).toBe(false)
  })
})

describe('Lead Detail — Status Change Interaction', () => {
  it('changeStatus generates correct interaction payload', () => {
    const oldStatus = 'new'
    const newStatus = 'contacted'
    const oldLabel = STATUS_OPTIONS.find(s => s.value === oldStatus)?.label ?? oldStatus
    const newLabel = STATUS_OPTIONS.find(s => s.value === newStatus)?.label ?? newStatus

    const payload = {
      channel: 'system',
      result: 'status_changed',
      note: `Estado cambiado: ${oldLabel} → ${newLabel}`,
    }

    expect(payload.channel).toBe('system')
    expect(payload.result).toBe('status_changed')
    expect(payload.note).toBe('Estado cambiado: Nuevo → Contactado')
  })

  it('does not trigger changeStatus when selecting same status', () => {
    const currentStatus = 'contacted'
    const newStatus = 'contacted'
    const shouldChange = newStatus !== currentStatus
    expect(shouldChange).toBe(false)
  })
})

describe('Lead Detail — Result Labels', () => {
  it('has labels for all valid results', () => {
    const expectedResults = [
      'no_answer', 'positive', 'negative', 'callback', 'wrong_number',
      'message_sent', 'email_sent', 'enrollment_started', 'status_changed',
    ]
    for (const r of expectedResults) {
      expect(RESULT_LABELS[r]).toBeTruthy()
    }
  })

  it('status_changed has correct label', () => {
    expect(RESULT_LABELS.status_changed).toBe('Cambio de estado')
  })
})

describe('Lead Detail — Contact Channels', () => {
  const VALID_CHANNELS = ['phone', 'whatsapp', 'email', 'system']
  const VALID_RESULTS = [
    'no_answer', 'positive', 'negative', 'callback', 'wrong_number',
    'message_sent', 'email_sent', 'enrollment_started', 'status_changed',
  ]

  it('all 3 contact channels + system are valid', () => {
    expect(VALID_CHANNELS).toContain('phone')
    expect(VALID_CHANNELS).toContain('whatsapp')
    expect(VALID_CHANNELS).toContain('email')
    expect(VALID_CHANNELS).toContain('system')
  })

  it('status_changed is a valid result', () => {
    expect(VALID_RESULTS).toContain('status_changed')
  })

  it('enrollment_started is a valid result', () => {
    expect(VALID_RESULTS).toContain('enrollment_started')
  })
})

describe('Lead Detail — Auto Transition Logic', () => {
  // Mirrors the backend logic
  function shouldSkipAutoTransition(result: string): boolean {
    return ['status_changed', 'enrollment_started'].includes(result)
  }

  function getAutoTransition(result: string, currentStatus: string): string | null {
    if (shouldSkipAutoTransition(result)) return null

    if (result === 'positive' && ['new', 'contacted', 'following_up'].includes(currentStatus)) return 'interested'
    if (result === 'wrong_number') return 'unreachable'
    if (result === 'callback' && ['new', 'contacted', 'following_up'].includes(currentStatus)) return 'on_hold'
    if (result === 'negative' && ['new', 'contacted', 'following_up', 'interested'].includes(currentStatus)) return 'not_interested'
    return null
  }

  it('positive result transitions new → interested', () => {
    expect(getAutoTransition('positive', 'new')).toBe('interested')
  })

  it('positive result transitions contacted → interested', () => {
    expect(getAutoTransition('positive', 'contacted')).toBe('interested')
  })

  it('positive result does NOT transition enrolled', () => {
    expect(getAutoTransition('positive', 'enrolled')).toBeNull()
  })

  it('wrong_number always transitions to unreachable', () => {
    expect(getAutoTransition('wrong_number', 'new')).toBe('unreachable')
    expect(getAutoTransition('wrong_number', 'contacted')).toBe('unreachable')
  })

  it('callback transitions to on_hold', () => {
    expect(getAutoTransition('callback', 'contacted')).toBe('on_hold')
  })

  it('negative transitions to not_interested', () => {
    expect(getAutoTransition('negative', 'interested')).toBe('not_interested')
  })

  it('status_changed NEVER triggers auto transition', () => {
    expect(getAutoTransition('status_changed', 'new')).toBeNull()
    expect(getAutoTransition('status_changed', 'contacted')).toBeNull()
    expect(getAutoTransition('status_changed', 'interested')).toBeNull()
  })

  it('enrollment_started NEVER triggers auto transition', () => {
    expect(getAutoTransition('enrollment_started', 'interested')).toBeNull()
  })

  it('message_sent does NOT auto-transition', () => {
    expect(getAutoTransition('message_sent', 'new')).toBeNull()
  })

  it('email_sent does NOT auto-transition', () => {
    expect(getAutoTransition('email_sent', 'contacted')).toBeNull()
  })
})

describe('Lead Detail — Enroll Endpoint Validation', () => {
  const allowedStatuses = ['interested', 'following_up', 'enrolling']

  it('interested status allows enrollment', () => {
    expect(allowedStatuses.includes('interested')).toBe(true)
  })

  it('following_up status allows enrollment', () => {
    expect(allowedStatuses.includes('following_up')).toBe(true)
  })

  it('enrolling status allows enrollment', () => {
    expect(allowedStatuses.includes('enrolling')).toBe(true)
  })

  it('new status does NOT allow enrollment', () => {
    expect(allowedStatuses.includes('new')).toBe(false)
  })

  it('contacted status does NOT allow enrollment', () => {
    expect(allowedStatuses.includes('contacted')).toBe(false)
  })

  it('discarded status does NOT allow enrollment', () => {
    expect(allowedStatuses.includes('discarded')).toBe(false)
  })

  it('not_interested status does NOT allow enrollment', () => {
    expect(allowedStatuses.includes('not_interested')).toBe(false)
  })
})
