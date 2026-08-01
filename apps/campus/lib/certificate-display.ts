export interface CertificateDisplayData {
  certificate_number: string
  course_run: { id: string; title: string } | string | null
  pdf_url?: string
  pdf_file?: { url: string } | null
}

export function certificateTitle(certificate: CertificateDisplayData): string {
  if (certificate.course_run && typeof certificate.course_run === 'object') {
    return certificate.course_run.title
  }
  return certificate.certificate_number
}

export function certificateDownloadUrl(certificate: CertificateDisplayData): string | null {
  const rawCandidate =
    certificate.pdf_url ??
    (certificate.pdf_file && typeof certificate.pdf_file === 'object'
      ? certificate.pdf_file.url
      : null)
  const candidate = rawCandidate?.trim()
  if (!candidate) return null
  if (candidate.startsWith('/') && !candidate.startsWith('//')) return candidate

  try {
    const url = new URL(candidate)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}
