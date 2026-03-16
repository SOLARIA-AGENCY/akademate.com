'use client'

/**
 * AdminHeader — Banner fijo en el panel Payload CMS
 * Identifica visualmente el entorno como "PAYLOAD ADMIN · AKADEMATE"
 */
export default function AdminHeader() {
  return (
    <div
      style={{
        background: 'linear-gradient(90deg, #0066CC, #1A56D6)',
        color: 'white',
        textAlign: 'center',
        fontSize: '0.7rem',
        fontWeight: 700,
        letterSpacing: '0.12em',
        padding: '4px 0',
        textTransform: 'uppercase',
        position: 'sticky',
        top: 0,
        zIndex: 9999,
        width: '100%',
      }}
    >
      PAYLOAD ADMIN · AKADEMATE
    </div>
  )
}
