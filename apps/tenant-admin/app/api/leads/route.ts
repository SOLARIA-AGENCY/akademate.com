import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@payload-config'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface LeadsWhere {
  status?: { equals: string }
  or?: Array<Record<string, { like: string }>>
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const limit = Math.min(parseInt(searchParams.get('limit') ?? '25', 10), 200)
    const page = Math.max(parseInt(searchParams.get('page') ?? '1', 10), 1)
    const sort = searchParams.get('sort') ?? '-createdAt'
    const status = searchParams.get('status')
    const search = searchParams.get('q')?.trim()

    const where: LeadsWhere = {}

    if (status) {
      where.status = { equals: status }
    }

    if (search) {
      where.or = [
        { first_name: { like: search } },
        { last_name: { like: search } },
        { email: { like: search } },
        { phone: { like: search } },
      ]
    }

    const payload = await getPayloadHMR({ config: configPromise })
    const leads = await payload.find({
      collection: 'leads',
      where: Object.keys(where).length > 0 ? (where as unknown as Record<string, unknown>) : undefined,
      limit,
      page,
      sort,
      depth: 1,
    })

    return NextResponse.json(leads)
  } catch (error) {
    console.error('[API][Leads] Failed to fetch leads:', error)

    // Degrade gracefully to avoid breaking dashboard pages in partially migrated envs.
    return NextResponse.json({
      docs: [],
      totalDocs: 0,
      limit: 25,
      page: 1,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
      warning: 'Leads no disponibles temporalmente.',
    })
  }
}

// POST /api/leads — Create a new lead from public forms
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.email) {
      return NextResponse.json(
        { error: 'Email es obligatorio' },
        { status: 400 }
      )
    }

    const payload = await getPayloadHMR({ config: configPromise })

    // Parse name into first/last
    const fullName = body.first_name || body.name || ''
    const nameParts = fullName.trim().split(/\s+/)
    const firstName = nameParts[0] || body.email.split('@')[0]
    const lastName = nameParts.slice(1).join(' ') || '-'

    // Normalize phone to Spanish format: +34 XXX XXX XXX
    let phone = (body.phone || '').replace(/\s+/g, '').replace(/^0+/, '')
    if (phone && !phone.startsWith('+34')) phone = phone.startsWith('34') ? `+${phone}` : `+34${phone}`
    // Format with spaces: +34 XXX XXX XXX
    if (phone.startsWith('+34') && phone.length >= 12) {
      const digits = phone.replace('+34', '')
      phone = `+34 ${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6,9)}`
    }
    if (!phone || phone.length < 10) phone = '+34 000 000 000'

    // Build lead data — ONLY include fields that exist in the Leads collection
    const leadData: Record<string, unknown> = {
      email: body.email,
      first_name: firstName,
      last_name: lastName,
      phone,
      gdpr_consent: body.gdpr_consent ?? true,
      consent_timestamp: body.consent_timestamp || new Date().toISOString(),
      privacy_policy_accepted: true,
      status: 'new',
      lead_score: 0,
      utm_source: body.utm_source || undefined,
      utm_medium: body.utm_medium || undefined,
      utm_campaign: body.utm_campaign || undefined,
      priority: ['low','medium','high','urgent'].includes(body.priority) ? body.priority : (body.lead_type === 'inscripcion' ? 'high' : 'medium'),
      tenant: 1,
    }

    // Remove undefined/null values to avoid Payload validation errors
    Object.keys(leadData).forEach(key => {
      if (leadData[key] === undefined || leadData[key] === null) delete leadData[key]
    })

    const created = await payload.create({
      collection: 'leads',
      data: leadData as any,
    })

    // Store extra tracking data directly in DB (fields that Payload collection doesn't know about)
    try {
      const { db } = payload
      const extraFields: Record<string, string | null> = {}
      if (body.source_form) extraFields.source_form = body.source_form
      if (body.source_page) extraFields.source_page = body.source_page
      if (body.lead_type) extraFields.lead_type = body.lead_type
      if (body.message) extraFields.message = String(body.message)
      if (body.notes) extraFields.callback_notes = body.notes
      if (body.campaign_code) extraFields.campaign_code = body.campaign_code

      if (Object.keys(extraFields).length > 0) {
        const sets = Object.entries(extraFields).map(([k, v]) => `${k} = '${(v || '').replace(/'/g, "''")}'`).join(', ')
        await (db as any).execute({ raw: `UPDATE leads SET ${sets} WHERE id = ${created.id}` }).catch(() => {})
      }
    } catch { /* extra fields are optional */ }

    // Send confirmation email to the lead (non-blocking, via Brevo)
    try {
      const leadType = body.lead_type || 'informacion'
      const heroImages: Record<string, string> = {
        inscripcion: 'https://i.imgur.com/3URhTS6.png',   // Creemos en ti
        informacion: 'https://i.imgur.com/1ueas0V.png',   // El momento es ahora
        contacto: 'https://i.imgur.com/6MUQn8h.png',      // Poder de la actitud
      }
      const titles: Record<string, string> = {
        inscripcion: 'Tu preinscripcion ha sido recibida',
        informacion: 'Hemos recibido tu solicitud',
        contacto: 'Gracias por contactarnos',
      }
      const heroImage = heroImages[leadType] || heroImages.informacion
      const title = titles[leadType] || titles.informacion
      const courseName = body.notes?.replace('Preinscripcion: ', '').replace('Interes: ', '') || ''

      const emailHtml = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
<table width="100%" style="background:#f4f4f5;"><tr><td align="center" style="padding:40px 20px;">
<table width="600" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
<tr><td style="background:#cc0000;padding:28px;text-align:center;">
<table cellspacing="0" cellpadding="0" border="0" align="center"><tr><td align="center">
<table cellspacing="0" cellpadding="0" border="0"><tr>
<td width="80" height="80" align="center" valign="middle" style="background:#ffffff;border-radius:50%;width:80px;height:80px;">
<img src="https://i.imgur.com/32LbMla.png" alt="CEP" width="56" height="56" style="display:block;margin:0 auto;">
</td></tr></table></td></tr></table>
<p style="color:#fff;font-size:20px;font-weight:700;margin:14px 0 0;letter-spacing:1px;">CEP FORMACION</p>
</td></tr>
<tr><td style="padding:0;"><img src="${heroImage}" alt="CEP Formacion" width="600" style="display:block;width:100%;height:auto;"></td></tr>
<tr><td style="padding:32px;">
<h1 style="font-size:22px;color:#111;margin:0 0 16px;">${title}</h1>
<p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 20px;">
Hola <strong>${firstName}</strong>, gracias por tu interes en <strong>CEP Formacion</strong>${courseName ? ` y en <strong>${courseName}</strong>` : ''}.
</p>
<p style="font-size:15px;color:#374151;line-height:1.6;margin:0 0 20px;">
Nuestro equipo revisara tu solicitud y te contactara en las proximas <strong>24-48 horas</strong> para darte toda la informacion que necesitas.
</p>
<table width="100%" style="background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;margin:0 0 20px;">
<tr><td style="padding:16px;">
<p style="font-size:14px;color:#166534;margin:0;font-weight:600;">Mientras tanto, puedes:</p>
<ul style="font-size:14px;color:#166534;margin:8px 0 0;padding-left:20px;">
<li>Visitar nuestra web para mas informacion</li>
<li>Llamarnos al 922 219 257</li>
<li>Escribirnos por WhatsApp</li>
</ul>
</td></tr></table>
<table width="100%">
<tr><td align="center" style="padding-bottom:10px;">
<a href="https://wa.me/34622416020?text=Hola%2C%20me%20gustaria%20recibir%20informacion%20sobre%20los%20cursos" style="display:inline-block;background:#25D366;color:#fff;font-size:15px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">Contactar por WhatsApp</a>
</td></tr>
<tr><td align="center">
<a href="https://cursostenerife.es" style="display:inline-block;background:#cc0000;color:#fff;font-size:15px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">Ver oferta formativa</a>
</td></tr></table>
</td></tr>
<tr><td style="padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
<p style="font-size:12px;color:#9ca3af;margin:0;">CEP FORMACION — Centro de Estudios Profesionales</p>
<p style="font-size:11px;color:#d1d5db;margin:4px 0 0;">Este email fue enviado automaticamente.</p>
</td></tr>
</table></td></tr></table></body></html>`

      // Send via Brevo SMTP (non-blocking)
      fetch(`${process.env.NEXT_PUBLIC_TENANT_URL || 'https://cepformacion.akademate.com'}/api/email/send-welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: firstName, email: body.email, password: '', role: '' }),
      }).catch(() => {})

      // Direct SMTP send for the custom lead confirmation (more reliable)
      const nodemailer = require('nodemailer')
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
        tls: { rejectUnauthorized: false },
      })
      transport.sendMail({
        from: process.env.SMTP_FROM || 'CEP Formacion <noreply@cepcomunicacion.com>',
        to: body.email,
        subject: `CEP Formacion — ${title}`,
        html: emailHtml,
        replyTo: 'info@cepcomunicacion.com',
      }).catch((err: Error) => console.error('[leads] Email failed:', err.message))
    } catch { /* email is best-effort, don't block lead creation */ }

    return NextResponse.json(
      { success: true, id: created.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('[API][Leads] POST error:', error)
    return NextResponse.json(
      { error: 'No se pudo crear el lead' },
      { status: 500 }
    )
  }
}
