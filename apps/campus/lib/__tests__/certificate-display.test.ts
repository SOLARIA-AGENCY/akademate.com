import { describe, expect, it } from 'vitest'

import { certificateDownloadUrl, certificateTitle } from '../certificate-display'

const baseCertificate = {
  certificate_number: 'CERT-2026-001',
  course_run: { id: 'run-1', title: 'Advanced coaching' },
  pdf_url: undefined,
  pdf_file: null,
}

describe('certificate display boundary', () => {
  it('uses the populated course title and falls back to the certificate number', () => {
    expect(certificateTitle(baseCertificate)).toBe('Advanced coaching')
    expect(certificateTitle({ ...baseCertificate, course_run: 'run-1' })).toBe('CERT-2026-001')
  })

  it('allows local and HTTP(S) certificate documents', () => {
    expect(certificateDownloadUrl({ ...baseCertificate, pdf_url: '/media/certificate.pdf' })).toBe(
      '/media/certificate.pdf'
    )
    expect(
      certificateDownloadUrl({
        ...baseCertificate,
        pdf_url: 'https://cdn.akademate.com/certificate.pdf',
      })
    ).toBe('https://cdn.akademate.com/certificate.pdf')
  })

  it('rejects executable, protocol-relative and malformed download targets', () => {
    for (const pdf_url of [
      'javascript:alert(1)',
      'data:text/html,unsafe',
      '//attacker.example/certificate.pdf',
      'not a URL',
    ]) {
      expect(certificateDownloadUrl({ ...baseCertificate, pdf_url })).toBeNull()
    }
  })
})
