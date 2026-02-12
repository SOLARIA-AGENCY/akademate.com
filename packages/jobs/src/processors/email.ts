import type { TenantJob } from '../index'
import type { TenantJobHandler } from '../workers'

export type EmailPayload = {
  to: string
  subject: string
  html?: string
  text?: string
}

/**
 * Processes outbound email jobs.
 *
 * TODO: Integrate actual SMTP transport (e.g. nodemailer) once
 * the mailer service configuration is available.
 */
export const processEmail: TenantJobHandler<EmailPayload> = async (
  job: TenantJob<EmailPayload>,
  _rawJob
) => {
  const { to, subject, html, text } = job.payload

  if (!to || !subject) {
    throw new Error('Email job missing required fields: to, subject')
  }

  if (!html && !text) {
    throw new Error('Email job must include at least one of: html, text')
  }

  // TODO: Replace with actual SMTP send via nodemailer or similar
  console.log(
    `[email] tenant=${job.tenantId} to=${to} subject="${subject}" ` +
      `format=${html ? 'html' : 'text'} traceId=${job.traceId ?? 'none'}`
  )
}
