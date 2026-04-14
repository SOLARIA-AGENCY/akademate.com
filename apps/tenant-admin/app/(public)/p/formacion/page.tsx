'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const AREAS = [
  {
    title: 'Sanidad',
    subtitle: 'Area Sanitaria',
    desc: 'Auxiliar de Enfermeria, Farmacia y Parafarmacia, Higiene Bucodental, Emergencias Sanitarias',
    color: '#cc0000',
    icon: '+',
  },
  {
    title: 'Veterinaria',
    subtitle: 'Area Veterinaria',
    desc: 'Auxiliar Clinico Veterinario, Ayudante Tecnico Veterinario (ATV), Peluqueria Canina',
    color: '#16a34a',
    icon: 'V',
  },
  {
    title: 'Bienestar',
    subtitle: 'Area Bienestar',
    desc: 'Quiromasaje, Nutricion y Dietetica, Estetica, Entrenador Personal',
    color: '#7c3aed',
    icon: 'B',
  },
  {
    title: 'Informatica',
    subtitle: 'Digitalizacion',
    desc: 'Ofimatica Avanzada, Herramientas Web 2.0, Microsoft Office, Competencias Digitales',
    color: '#2563eb',
    icon: 'D',
  },
  {
    title: 'Administracion',
    subtitle: 'Empresa y Gestion',
    desc: 'Gestion Administrativa, Contabilidad, Modelos de Negocio, Economia Circular',
    color: '#ea580c',
    icon: 'A',
  },
  {
    title: 'Idiomas',
    subtitle: 'Ingles y Frances',
    desc: 'Niveles A1, A2, B1 con enfoque profesional. Preparacion para entorno laboral',
    color: '#0891b2',
    icon: 'I',
  },
]

const STATS = [
  { value: '+25', label: 'Años de experiencia' },
  { value: '2', label: 'Sedes en Tenerife' },
  { value: '+50', label: 'Cursos disponibles' },
  { value: '98%', label: 'Inserción laboral' },
]

const WHY_CEP = [
  {
    title: 'Prácticas reales',
    text: 'Programas conectados con empresas y entorno profesional.',
  },
  {
    title: 'Oferta mixta',
    text: 'Ciclos oficiales, cursos privados y formación subvencionada.',
  },
  {
    title: 'Sedes activas',
    text: 'Presencia física en Tenerife con atención académica continua.',
  },
]

const TIPOS = [
  {
    title: 'Certificados de Profesionalidad',
    tag: 'OFICIAL',
    tagColor: '#cc0000',
    desc: 'Titulaciones oficiales del Gobierno de Canarias (SCE) y Ministerio de Trabajo. Reconocidas a nivel nacional.',
    items: [
      'Nivel 1 — Sin requisitos previos',
      'Nivel 2 — Graduado ESO o equivalente',
      'Nivel 3 — Bachillerato o Grado Medio',
    ],
  },
  {
    title: 'Cursos Subvencionados',
    tag: 'GRATUITO',
    tagColor: '#16a34a',
    desc: 'Formacion 100% gratuita para desempleados y trabajadores activos. Incluye tablet gratuita para alumnos en 2026.',
    items: [
      'Desempleados — Reinsercion laboral intensiva',
      'Trabajadores — Actualizacion profesional (upskilling)',
      'Tablet gratuita incluida para formacion digital',
    ],
  },
  {
    title: 'Formacion Privada',
    tag: 'ESPECIALIZADO',
    tagColor: '#7c3aed',
    desc: 'Cursos especializados con duracion flexible y enfoque 100% practico. Ideal para profesiones de alta demanda.',
    items: [
      'Duracion flexible adaptada al alumno',
      'Enfoque practico desde el primer dia',
      'Peluqueria Canina, ATV, y mas',
    ],
  },
]

// ---------------------------------------------------------------------------
// Lead Form Component
// ---------------------------------------------------------------------------

function LeadForm({ source, dark }: { source: string; dark?: boolean }) {
  const searchParams = useSearchParams()
  const [form, setForm] = useState({ name: '', email: '', phone: '', interest: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
      if (!form.name.trim() || !form.email.trim()) { setError('Nombre y email obligatorios'); return }
    setSending(true); setError('')

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.name, email: form.email, phone: form.phone || undefined,
          source_form: source, source_page: '/p/formacion', lead_type: 'informacion',
          utm_source: searchParams.get('utm_source') || 'organic',
          utm_medium: searchParams.get('utm_medium') || 'web',
          utm_campaign: searchParams.get('utm_campaign') || undefined,
          gdpr_consent: true, consent_timestamp: new Date().toISOString(), priority: 'high',
          notes: form.interest ? `Interes: ${form.interest}` : undefined,
        }),
      })
      if (res.ok || res.status === 201) {
        setSent(true)
        if (typeof window !== 'undefined') {
          if ((window as any).fbq) (window as any).fbq('track', 'Lead', { content_name: source })
          if ((window as any).gtag) (window as any).gtag('event', 'generate_lead', { event_category: source })
        }
      } else { setError('Error al enviar. Inténtalo de nuevo.') }
    } catch { setError('Error de conexión.') }
    finally { setSending(false) }
  }

  if (sent) return (
    <div style={{ textAlign: 'center', padding: '24px 0' }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#22c55e', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <p style={{ fontSize: 18, fontWeight: 700, color: dark ? '#fff' : '#111', margin: '0 0 8px' }}>Solicitud recibida</p>
      <p style={{ fontSize: 14, color: dark ? 'rgba(255,255,255,0.7)' : '#6b7280', margin: 0 }}>Te contactaremos en 24-48 horas</p>
    </div>
  )

  const inputStyle = {
    width: '100%', padding: '12px 14px', border: dark ? '1px solid rgba(255,255,255,0.2)' : '1px solid #d1d5db',
    borderRadius: 8, fontSize: 15, boxSizing: 'border-box' as const, background: dark ? 'rgba(255,255,255,0.1)' : '#fff',
    color: dark ? '#fff' : '#111',
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <p style={{ color: '#fca5a5', fontSize: 13, margin: '0 0 8px', background: 'rgba(220,38,38,0.1)', padding: '8px 12px', borderRadius: 6 }}>{error}</p>}
      <input type="text" placeholder="Tu nombre" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={{ ...inputStyle, marginBottom: 10 }} />
      <input type="email" placeholder="tu@email.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required style={{ ...inputStyle, marginBottom: 10 }} />
      <input type="tel" placeholder="+34 600 000 000" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={{ ...inputStyle, marginBottom: 10 }} />
      <select value={form.interest} onChange={e => setForm({...form, interest: e.target.value})} style={{ ...inputStyle, marginBottom: 14 }}>
        <option value="">Area de interes...</option>
        <option value="sanitaria">Sanidad</option>
        <option value="veterinaria">Veterinaria</option>
        <option value="bienestar">Bienestar</option>
        <option value="informatica">Informatica</option>
        <option value="administracion">Administracion</option>
        <option value="idiomas">Idiomas</option>
        <option value="ciclos">Ciclos FP (CFGM/CFGS)</option>
      </select>
      <button type="submit" disabled={sending} style={{ width: '100%', padding: 14, background: sending ? '#999' : '#cc0000', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer' }}>
        {sending ? 'Enviando...' : 'Solicitar información'}
      </button>
      <p style={{ fontSize: 10, color: dark ? 'rgba(255,255,255,0.4)' : '#9ca3af', margin: '8px 0 0', textAlign: 'center' }}>
        Al enviar aceptas nuestra <a href="/p/legal/privacidad" style={{ color: '#cc0000' }}>política de privacidad</a>
      </p>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Main Landing Page
// ---------------------------------------------------------------------------

export default function FormacionLandingPage() {
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'ViewContent', { content_name: 'Landing Formacion' })
    }
  }, [])

  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: '#111' }}>

      {/* ============ HERO ============ */}
      <section style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', color: '#fff', padding: '60px 20px 50px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap' as const, gap: 40, alignItems: 'center' }}>
          <div style={{ flex: '1 1 440px' }}>
            <div style={{ display: 'inline-block', background: '#cc0000', padding: '4px 12px', borderRadius: 4, fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 16, textTransform: 'uppercase' as const }}>
              Matrícula abierta 2026
            </div>
            <h1 style={{ fontSize: 42, fontWeight: 800, margin: '0 0 16px', lineHeight: 1.15 }}>
              Tu futuro profesional<br />
              <span style={{ color: '#cc0000' }}>comienza aquí</span>
            </h1>
            <p style={{ fontSize: 18, opacity: 0.85, margin: '0 0 12px', lineHeight: 1.6 }}>
              Formación profesional con prácticas reales en empresas de Tenerife. Centro homologado por el Ministerio de Educación desde 1998.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' as const, margin: '20px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, opacity: 0.8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                Prácticas en empresas
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, opacity: 0.8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                Cursos gratuitos disponibles
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, opacity: 0.8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                Tablet gratuita 2026
              </div>
            </div>
          </div>
          <div style={{ flex: '1 1 320px', background: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 28, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', textAlign: 'center' }}>Solicita información gratis</h3>
            <p style={{ fontSize: 13, opacity: 0.6, margin: '0 0 16px', textAlign: 'center' }}>Sin compromiso. Te llamamos en 24h.</p>
            <LeadForm source="hero-formacion" dark />
          </div>
        </div>
      </section>

      {/* ============ STATS BAR ============ */}
      <section style={{ background: '#cc0000', padding: '20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap' as const, justifyContent: 'space-around', gap: 16 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: 'center', color: '#fff', minWidth: 120 }}>
              <p style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: 13, opacity: 0.85, margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ POR QUÉ CEP ============ */}
      <section style={{ padding: '60px 20px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 8px' }}>¿Por qué CEP?</h2>
            <p style={{ fontSize: 16, color: '#6b7280', margin: 0 }}>
              Mismo tono de marca, estructura más mantenible.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {WHY_CEP.map((item) => (
              <article
                key={item.title}
                style={{
                  background: '#f9fafb',
                  borderRadius: 12,
                  padding: 24,
                  border: '1px solid #e5e7eb',
                  borderTop: '4px solid #cc0000',
                }}
              >
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 10px', color: '#111' }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ AREAS ============ */}
      <section style={{ padding: '60px 20px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 8px' }}>Areas de Especializacion</h2>
            <p style={{ fontSize: 16, color: '#6b7280', margin: 0 }}>Formacion tecnica con alta insercion laboral en Canarias</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {AREAS.map(area => (
              <div key={area.title} style={{ background: '#f9fafb', borderRadius: 12, padding: 24, border: '1px solid #e5e7eb', borderTop: `4px solid ${area.color}`, transition: 'box-shadow 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: area.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>
                    {area.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#111' }}>{area.title}</h3>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{area.subtitle}</p>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.5 }}>{area.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CATEGORIAS DE CURSOS ============ */}
      <section style={{ padding: '48px 20px', background: '#f4f4f5' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 24px', textAlign: 'center' }}>Explora por categoria</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {[
              { label: 'Cursos Privados', desc: 'Formacion especializada de pago', href: '/p/cursos?tipo=privados', color: '#cc0000' },
              { label: 'Cursos Desempleados', desc: 'Gratuitos para personas en desempleo', href: '/p/cursos?tipo=desempleados', color: '#2563eb' },
              { label: 'Cursos Ocupados', desc: 'Para trabajadores activos (FUNDAE)', href: '/p/cursos?tipo=ocupados', color: '#16a34a' },
              { label: 'Cursos Teleformacion', desc: '100% online con certificacion', href: '/p/cursos?tipo=teleformacion', color: '#ea580c' },
            ].map(cat => (
              <a key={cat.label} href={cat.href} style={{ display: 'block', background: '#fff', borderRadius: 12, padding: 20, textDecoration: 'none', color: '#111', borderLeft: `4px solid ${cat.color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'box-shadow 0.2s' }}>
                <p style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: cat.color }}>{cat.label}</p>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{cat.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TIPOS DE FORMACION ============ */}
      <section style={{ padding: '60px 20px', background: '#f4f4f5' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 8px' }}>Tipos de Formacion</h2>
            <p style={{ fontSize: 16, color: '#6b7280', margin: 0 }}>Elige la modalidad que mejor se adapte a tu situacion</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {TIPOS.map(tipo => (
              <div key={tipo.title} style={{ background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' as const }}>
                <div style={{ display: 'inline-block', background: tipo.tagColor, color: '#fff', padding: '3px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, marginBottom: 12, alignSelf: 'flex-start' }}>
                  {tipo.tag}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 10px', color: '#111' }}>{tipo.title}</h3>
                <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 16px', lineHeight: 1.5 }}>{tipo.desc}</p>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', flex: 1 }}>
                  {tipo.items.map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, color: '#374151', marginBottom: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: tipo.tagColor, marginTop: 6, flexShrink: 0 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ METODOLOGIA ============ */}
      <section style={{ padding: '60px 20px', background: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 8px' }}>Nuestra Metodologia</h2>
            <p style={{ fontSize: 16, color: '#6b7280', margin: 0 }}>Aprendizaje practico enfocado a resultados reales</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 24 }}>
            {[
              { num: '01', title: 'Practicas en empresas', desc: 'Todos los certificados oficiales incluyen practicas profesionales en empresas reales de Tenerife.' },
              { num: '02', title: 'Presencialidad estrategica', desc: 'Sedes fisicas en Santa Cruz y Norte con instalaciones equipadas para formacion tecnica.' },
              { num: '03', title: 'Becas y ayudas', desc: 'Gestionamos becas de transporte, alojamiento y conciliacion para que el coste no sea una barrera.' },
            ].map(m => (
              <div key={m.num} style={{ padding: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: '#cc0000', opacity: 0.2 }}>{m.num}</span>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '4px 0 8px', color: '#111' }}>{m.title}</h3>
                <p style={{ fontSize: 14, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SEDES ============ */}
      <section style={{ padding: '60px 20px', background: '#f4f4f5' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 32px', textAlign: 'center' }}>Nuestras Sedes</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {[
              { name: 'CEP Santa Cruz', location: 'Cerca del Estadio Heliodoro Rodriguez Lopez', city: 'Santa Cruz de Tenerife', phone: '922 219 257' },
              { name: 'CEP Norte', location: 'C.C. El Trompo', city: 'La Orotava, Tenerife', phone: '922 219 257' },
            ].map(sede => (
              <div key={sede.name} style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid #cc0000' }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: '#111' }}>{sede.name}</h3>
                <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 4px' }}>{sede.location}</p>
                <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 12px' }}>{sede.city}</p>
                <a href={`tel:+34${sede.phone.replace(/\s/g, '')}`} style={{ fontSize: 16, color: '#cc0000', fontWeight: 600, textDecoration: 'none' }}>{sede.phone}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding: '60px 20px', color: '#fff' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: '#cc0000', padding: '4px 14px', borderRadius: 4, fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 16 }}>PLAZAS LIMITADAS</div>
          <h2 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 12px' }}>El momento es ahora</h2>
          <p style={{ fontSize: 16, opacity: 0.85, margin: '0 0 28px', lineHeight: 1.6 }}>
            Solicita informacion sin compromiso y descubre cual es la formacion que mejor se adapta a tus objetivos profesionales.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 28, border: '1px solid rgba(255,255,255,0.1)' }}>
            <LeadForm source="cta-final-formacion" dark />
          </div>
        </div>
      </section>

      {/* ============ CERTIFICACION FOOTER ============ */}
      <section style={{ background: '#1a1a2e', padding: '24px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#cc0000', fontWeight: 700, margin: '0 0 4px', letterSpacing: 0.5 }}>CENTRO HOMOLOGADO OFICIALMENTE</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '0 0 4px' }}>Ministerio de Educacion y Formacion Profesional</p>
        <p style={{ fontSize: 11, color: '#cc0000', fontWeight: 600, margin: 0 }}>MEC 38017275</p>
      </section>

    </div>
  )
}
