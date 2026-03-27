'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function ContactoPage() {
  const searchParams = useSearchParams()
  const utmSource = searchParams.get('utm_source') || ''
  const utmMedium = searchParams.get('utm_medium') || ''
  const utmCampaign = searchParams.get('utm_campaign') || ''

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    course_interest: '',
    gdpr: false,
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  // Track page view
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Contact')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) {
      setError('Nombre y email son obligatorios')
      return
    }
    if (!form.gdpr) {
      setError('Debes aceptar la politica de privacidad')
      return
    }

    setSending(true)
    setError('')

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          message: form.message || undefined,
          source_form: 'contacto',
          source_page: '/p/contacto',
          lead_type: 'informacion',
          utm_source: utmSource || 'organic',
          utm_medium: utmMedium || 'web',
          utm_campaign: utmCampaign || undefined,
          gdpr_consent: true,
          consent_timestamp: new Date().toISOString(),
          priority: 'medium',
          notes: form.course_interest ? `Interes: ${form.course_interest}` : undefined,
        }),
      })

      if (res.ok || res.status === 201) {
        setSent(true)
        // Track conversion
        if (typeof window !== 'undefined') {
          if ((window as any).fbq) (window as any).fbq('track', 'Lead', { content_name: 'Contacto' })
          if ((window as any).gtag) (window as any).gtag('event', 'generate_lead', { event_category: 'contact' })
        }
      } else {
        setError('No se pudo enviar el formulario. Intentalo de nuevo.')
      }
    } catch {
      setError('Error de conexion. Intentalo de nuevo.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ maxWidth: 500, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#22c55e', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h1 style={{ fontSize: 28, color: '#111', margin: '0 0 12px' }}>Solicitud recibida</h1>
          <p style={{ fontSize: 16, color: '#6b7280', lineHeight: 1.6, margin: '0 0 24px' }}>
            Gracias por contactar con CEP Formacion. Nuestro equipo revisara tu solicitud y te contactara en las proximas <strong>24-48 horas</strong>.
          </p>
          <a href="/" style={{ display: 'inline-block', background: '#cc0000', color: '#fff', padding: '12px 32px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>
            Volver al inicio
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '80vh', padding: '40px 20px', fontFamily: 'Arial, sans-serif', background: '#f4f4f5' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, color: '#111', margin: '0 0 8px', fontWeight: 700 }}>Contacta con nosotros</h1>
          <p style={{ fontSize: 16, color: '#6b7280', margin: 0 }}>Resolvemos todas tus dudas sobre nuestra oferta formativa</p>
        </div>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' as const }}>

          {/* Formulario */}
          <div style={{ flex: '1 1 340px', background: '#fff', borderRadius: 12, padding: 32, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: 20, color: '#111', margin: '0 0 20px' }}>Solicitar informacion</h2>

            <form onSubmit={handleSubmit}>
              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Nombre completo *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Tu nombre y apellidos"
                  required
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, boxSizing: 'border-box' as const }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="tu@email.com"
                  required
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, boxSizing: 'border-box' as const }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Telefono</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+34 600 000 000"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, boxSizing: 'border-box' as const }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Area de interes</label>
                <select
                  value={form.course_interest}
                  onChange={(e) => setForm({ ...form, course_interest: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, boxSizing: 'border-box' as const, background: '#fff' }}
                >
                  <option value="">Selecciona un area...</option>
                  <option value="sanitaria">Area Sanitaria</option>
                  <option value="veterinaria">Area Veterinaria</option>
                  <option value="bienestar">Area Bienestar</option>
                  <option value="ciclos_medio">Ciclos Grado Medio</option>
                  <option value="ciclos_superior">Ciclos Grado Superior</option>
                  <option value="otro">Otro / No estoy seguro</option>
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Mensaje</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Cuentanos en que podemos ayudarte..."
                  rows={4}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, boxSizing: 'border-box' as const, resize: 'vertical' as const }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.gdpr}
                    onChange={(e) => setForm({ ...form, gdpr: e.target.checked })}
                    style={{ marginTop: 3 }}
                  />
                  <span style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
                    Acepto la <a href="/p/legal/privacidad" style={{ color: '#cc0000' }}>politica de privacidad</a> y consiento el tratamiento de mis datos para recibir informacion sobre la oferta formativa de CEP Formacion.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={sending}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: sending ? '#999' : '#cc0000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: sending ? 'not-allowed' : 'pointer',
                }}
              >
                {sending ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            </form>
          </div>

          {/* Info lateral */}
          <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column' as const, gap: 16 }}>

            <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: 16, color: '#111', margin: '0 0 16px', fontWeight: 600 }}>Datos de contacto</h3>
              <div style={{ fontSize: 14, color: '#374151', lineHeight: 2 }}>
                <p style={{ margin: 0 }}><strong>Sede Santa Cruz</strong></p>
                <p style={{ margin: 0, color: '#6b7280' }}>Tel: <a href="tel:+34922219257" style={{ color: '#cc0000', textDecoration: 'none' }}>922 219 257</a></p>
                <p style={{ margin: '12px 0 0' }}><strong>Sede Norte (La Laguna)</strong></p>
                <p style={{ margin: 0, color: '#6b7280' }}>Tel: <a href="tel:+34922219257" style={{ color: '#cc0000', textDecoration: 'none' }}>922 219 257</a></p>
                <p style={{ margin: '12px 0 0' }}><strong>Email</strong></p>
                <p style={{ margin: 0, color: '#6b7280' }}><a href="mailto:info@cursostenerife.es" style={{ color: '#cc0000', textDecoration: 'none' }}>info@cursostenerife.es</a></p>
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: 16, color: '#111', margin: '0 0 12px', fontWeight: 600 }}>Horario de atencion</h3>
              <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.8 }}>
                <p style={{ margin: 0 }}>Lunes a Viernes: 08:00 — 20:00</p>
                <p style={{ margin: 0 }}>Sabados: 09:00 — 14:00</p>
              </div>
            </div>

            <div style={{ background: '#cc0000', borderRadius: 12, padding: 24, color: '#fff' }}>
              <h3 style={{ fontSize: 16, margin: '0 0 8px', fontWeight: 600 }}>Centro Homologado</h3>
              <p style={{ fontSize: 13, margin: 0, opacity: 0.9, lineHeight: 1.5 }}>
                Centro homologado por el Ministerio de Educacion y Formacion Profesional. Codigo MEC 38017275.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
