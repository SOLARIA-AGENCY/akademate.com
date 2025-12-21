/**
 * @fileoverview Base Email Template
 * Common layout and styling for all email templates
 */

export interface BaseLayoutOptions {
  title: string;
  preheader?: string;
  content: string;
  tenantName: string;
  tenantLogo?: string;
  supportEmail: string;
  unsubscribeUrl?: string;
  year: number;
}

/**
 * Base email layout with responsive design
 */
export function baseLayout(options: BaseLayoutOptions): string {
  const {
    title,
    preheader = '',
    content,
    tenantName,
    tenantLogo,
    supportEmail,
    unsubscribeUrl,
    year,
  } = options;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }

    /* Base */
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background-color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    /* Container */
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    /* Header */
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      padding: 32px 24px;
      text-align: center;
    }

    .header img {
      max-height: 48px;
      width: auto;
    }

    .header h1 {
      color: #ffffff;
      font-size: 20px;
      font-weight: 600;
      margin: 16px 0 0 0;
    }

    /* Content */
    .content {
      padding: 32px 24px;
      color: #27272a;
      font-size: 16px;
      line-height: 1.6;
    }

    .content h2 {
      color: #18181b;
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 16px 0;
    }

    .content p {
      margin: 0 0 16px 0;
    }

    /* Button */
    .button {
      display: inline-block;
      padding: 14px 28px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      border-radius: 8px;
      margin: 16px 0;
    }

    .button:hover {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    }

    .button-secondary {
      background: #e4e4e7;
      color: #27272a !important;
    }

    /* Info Box */
    .info-box {
      background-color: #f4f4f5;
      border-left: 4px solid #6366f1;
      padding: 16px;
      margin: 24px 0;
      border-radius: 0 8px 8px 0;
    }

    .info-box.warning {
      background-color: #fef3c7;
      border-left-color: #f59e0b;
    }

    .info-box.success {
      background-color: #d1fae5;
      border-left-color: #10b981;
    }

    .info-box.error {
      background-color: #fee2e2;
      border-left-color: #ef4444;
    }

    /* Footer */
    .footer {
      background-color: #f4f4f5;
      padding: 24px;
      text-align: center;
      font-size: 14px;
      color: #71717a;
    }

    .footer a {
      color: #6366f1;
      text-decoration: none;
    }

    .footer p {
      margin: 8px 0;
    }

    /* Divider */
    .divider {
      border: none;
      border-top: 1px solid #e4e4e7;
      margin: 24px 0;
    }

    /* Responsive */
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        border-radius: 0 !important;
      }

      .content {
        padding: 24px 16px !important;
      }

      .header {
        padding: 24px 16px !important;
      }

      .button {
        display: block !important;
        text-align: center !important;
      }
    }
  </style>
</head>
<body>
  <!-- Preheader text (hidden) -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${preheader}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <!-- Main wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <!-- Container -->
        <table class="container" width="600" cellpadding="0" cellspacing="0" role="presentation">
          <!-- Header -->
          <tr>
            <td class="header">
              ${tenantLogo ? `<img src="${tenantLogo}" alt="${tenantName}" />` : ''}
              <h1>${tenantName}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="content">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer">
              <p>&copy; ${year} ${tenantName}. Todos los derechos reservados.</p>
              <p>
                <a href="mailto:${supportEmail}">Contactar soporte</a>
                ${unsubscribeUrl ? ` | <a href="${unsubscribeUrl}">Cancelar suscripci&oacute;n</a>` : ''}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Format date in Spanish
 */
export function formatDate(date: Date, includeTime = false): string {
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(includeTime && {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
  return new Intl.DateTimeFormat('es-ES', options).format(date);
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
  }).format(amount);
}
