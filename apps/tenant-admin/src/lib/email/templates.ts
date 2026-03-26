/**
 * Email Templates — Akademate
 *
 * HTML email templates with corporate branding.
 * All templates receive branding config (logo, colors, academy name)
 * to support multi-tenant white-label emails.
 */

interface BrandingConfig {
  academyName: string
  logoUrl: string
  primaryColor: string
  siteUrl: string
}

const DEFAULT_BRANDING: BrandingConfig = {
  academyName: 'CEP FORMACION',
  logoUrl: 'https://cepformacion.akademate.com/logos/cep-formacion-logo.png',
  primaryColor: '#cc0000',
  siteUrl: 'https://cepformacion.akademate.com',
}

// ---------------------------------------------------------------------------
// Base layout wrapper
// ---------------------------------------------------------------------------

function baseLayout(content: string, branding: BrandingConfig = DEFAULT_BRANDING): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${branding.academyName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header with Logo -->
          <tr>
            <td style="background-color:${branding.primaryColor};padding:28px 32px;text-align:center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                <tr>
                  <td style="text-align:center;">
                    <img src="${branding.logoUrl}" alt="${branding.academyName}" width="64" height="64" style="display:block;margin:0 auto;border-radius:50%;background:#fff;padding:8px;box-shadow:0 2px 8px rgba(0,0,0,0.15);">
                  </td>
                </tr>
                <tr>
                  <td style="text-align:center;padding-top:12px;">
                    <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:1px;">${branding.academyName}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="font-size:12px;color:#9ca3af;margin:0;">
                ${branding.academyName} &mdash; Panel de Administracion
              </p>
              <p style="font-size:11px;color:#d1d5db;margin:4px 0 0;">
                Este email fue enviado automaticamente. No responda a este mensaje.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Welcome / New User
// ---------------------------------------------------------------------------

export function welcomeUserEmail(params: {
  name: string
  email: string
  password: string
  role: string
  loginUrl: string
  branding?: BrandingConfig
}): { subject: string; html: string } {
  const b = params.branding || DEFAULT_BRANDING
  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    gestor: 'Gestor',
    marketing: 'Marketing',
    asesor: 'Asesor',
    lectura: 'Lectura',
  }

  const content = `
    <h1 style="font-size:22px;color:#111827;margin:0 0 16px;">Bienvenido/a, ${params.name}</h1>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 20px;">
      Se ha creado tu cuenta de acceso al panel de administracion de <strong>${b.academyName}</strong>.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin:0 0 24px;">
      <tr>
        <td style="padding:20px;">
          <p style="font-size:13px;color:#6b7280;margin:0 0 4px;">Email de acceso</p>
          <p style="font-size:15px;color:#111827;font-weight:600;margin:0 0 12px;">${params.email}</p>
          <p style="font-size:13px;color:#6b7280;margin:0 0 4px;">Contrasena temporal</p>
          <p style="font-size:15px;color:#111827;font-weight:600;margin:0 0 12px;font-family:monospace;background:#fff3cd;padding:4px 8px;border-radius:4px;display:inline-block;">${params.password}</p>
          <p style="font-size:13px;color:#6b7280;margin:0 0 4px;">Rol asignado</p>
          <p style="font-size:15px;color:#111827;font-weight:600;margin:0;">${roleLabels[params.role] || params.role}</p>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td align="center">
          <a href="${params.loginUrl}" style="display:inline-block;background-color:${b.primaryColor};color:#ffffff;font-size:15px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">
            Acceder al Panel
          </a>
        </td>
      </tr>
    </table>

    <p style="font-size:13px;color:#ef4444;line-height:1.5;margin:20px 0 0;padding:12px;background:#fef2f2;border-radius:6px;border:1px solid #fecaca;">
      <strong>Importante:</strong> Esta contrasena es temporal. Te recomendamos cambiarla en tu primer acceso desde Configuracion &gt; Mi Perfil.
    </p>
  `

  return {
    subject: `${b.academyName} — Tu cuenta de acceso ha sido creada`,
    html: baseLayout(content, b),
  }
}

// ---------------------------------------------------------------------------
// Password Reset
// ---------------------------------------------------------------------------

export function passwordResetEmail(params: {
  name: string
  resetUrl: string
  branding?: BrandingConfig
}): { subject: string; html: string } {
  const b = params.branding || DEFAULT_BRANDING

  const content = `
    <h1 style="font-size:22px;color:#111827;margin:0 0 16px;">Restablecer contrasena</h1>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 20px;">
      Hola ${params.name}, hemos recibido una solicitud para restablecer tu contrasena en <strong>${b.academyName}</strong>.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td align="center" style="padding:8px 0 24px;">
          <a href="${params.resetUrl}" style="display:inline-block;background-color:${b.primaryColor};color:#ffffff;font-size:15px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">
            Restablecer contrasena
          </a>
        </td>
      </tr>
    </table>

    <p style="font-size:13px;color:#6b7280;line-height:1.5;">
      Si no solicitaste este cambio, ignora este email. El enlace expira en 1 hora.
    </p>
  `

  return {
    subject: `${b.academyName} — Restablecer contrasena`,
    html: baseLayout(content, b),
  }
}

// ---------------------------------------------------------------------------
// Lead Confirmation (to prospective student)
// ---------------------------------------------------------------------------

export function leadConfirmationEmail(params: {
  name: string
  courseName?: string
  branding?: BrandingConfig
}): { subject: string; html: string } {
  const b = params.branding || DEFAULT_BRANDING

  const content = `
    <h1 style="font-size:22px;color:#111827;margin:0 0 16px;">Hemos recibido tu solicitud</h1>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 20px;">
      Hola ${params.name}, gracias por tu interes en <strong>${b.academyName}</strong>${params.courseName ? ` y en el curso <strong>${params.courseName}</strong>` : ''}.
    </p>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 20px;">
      Nuestro equipo revisara tu solicitud y te contactara en las proximas <strong>24-48 horas</strong> para darte toda la informacion que necesitas.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;margin:0 0 20px;">
      <tr>
        <td style="padding:16px;">
          <p style="font-size:14px;color:#166534;margin:0;font-weight:600;">Mientras tanto, puedes:</p>
          <ul style="font-size:14px;color:#166534;margin:8px 0 0;padding-left:20px;">
            <li>Visitar nuestra web para mas informacion</li>
            <li>Seguirnos en redes sociales</li>
            <li>Preparar la documentacion necesaria</li>
          </ul>
        </td>
      </tr>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
      <tr>
        <td align="center">
          <a href="${b.siteUrl}" style="display:inline-block;background-color:${b.primaryColor};color:#ffffff;font-size:15px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">
            Visitar nuestra web
          </a>
        </td>
      </tr>
    </table>
  `

  return {
    subject: `${b.academyName} — Hemos recibido tu solicitud`,
    html: baseLayout(content, b),
  }
}

// ---------------------------------------------------------------------------
// Enrollment Confirmation
// ---------------------------------------------------------------------------

export function enrollmentConfirmationEmail(params: {
  name: string
  courseName: string
  startDate: string
  campus: string
  branding?: BrandingConfig
}): { subject: string; html: string } {
  const b = params.branding || DEFAULT_BRANDING

  const content = `
    <h1 style="font-size:22px;color:#111827;margin:0 0 16px;">Matricula confirmada</h1>
    <p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 20px;">
      Hola ${params.name}, tu matricula ha sido confirmada en <strong>${b.academyName}</strong>.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;margin:0 0 24px;">
      <tr>
        <td style="padding:20px;">
          <p style="font-size:13px;color:#6b7280;margin:0 0 4px;">Curso / Ciclo</p>
          <p style="font-size:15px;color:#111827;font-weight:600;margin:0 0 12px;">${params.courseName}</p>
          <p style="font-size:13px;color:#6b7280;margin:0 0 4px;">Fecha de inicio</p>
          <p style="font-size:15px;color:#111827;font-weight:600;margin:0 0 12px;">${params.startDate}</p>
          <p style="font-size:13px;color:#6b7280;margin:0 0 4px;">Sede</p>
          <p style="font-size:15px;color:#111827;font-weight:600;margin:0;">${params.campus}</p>
        </td>
      </tr>
    </table>

    <p style="font-size:14px;color:#374151;line-height:1.6;">
      Recibiras mas informacion conforme se acerque la fecha de inicio. Si tienes dudas, contacta con secretaria.
    </p>
  `

  return {
    subject: `${b.academyName} — Matricula confirmada: ${params.courseName}`,
    html: baseLayout(content, b),
  }
}

// ---------------------------------------------------------------------------
// Generic Notification
// ---------------------------------------------------------------------------

export function notificationEmail(params: {
  title: string
  body: string
  ctaText?: string
  ctaUrl?: string
  branding?: BrandingConfig
}): { subject: string; html: string } {
  const b = params.branding || DEFAULT_BRANDING

  const cta = params.ctaText && params.ctaUrl
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td align="center" style="padding:20px 0 0;">
            <a href="${params.ctaUrl}" style="display:inline-block;background-color:${b.primaryColor};color:#ffffff;font-size:15px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">
              ${params.ctaText}
            </a>
          </td>
        </tr>
      </table>`
    : ''

  const content = `
    <h1 style="font-size:22px;color:#111827;margin:0 0 16px;">${params.title}</h1>
    <div style="font-size:15px;color:#374151;line-height:1.6;">
      ${params.body}
    </div>
    ${cta}
  `

  return {
    subject: `${b.academyName} — ${params.title}`,
    html: baseLayout(content, b),
  }
}

export { DEFAULT_BRANDING }
export type { BrandingConfig }
