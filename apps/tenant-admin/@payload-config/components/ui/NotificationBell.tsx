'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/app/providers/notifications'
import { Bell, Check, CheckCheck, Settings } from 'lucide-react'

const TYPE_ICONS: Record<string, { color: string; label: string }> = {
  new_lead: { color: '#cc0000', label: 'Nuevo lead' },
  lead_updated: { color: '#2563eb', label: 'Lead actualizado' },
  enrollment: { color: '#16a34a', label: 'Matricula' },
  system: { color: '#6b7280', label: 'Sistema' },
}

export function NotificationBell() {
  const router = useRouter()
  const { notifications, unreadCount, markAsRead, markAllRead, requestPermission, permissionGranted } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        style={{ position: 'relative', padding: 8, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer' }}
        title="Notificaciones"
      >
        <Bell style={{ width: 20, height: 20, color: unreadCount > 0 ? '#cc0000' : '#6b7280' }} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%',
            background: '#cc0000', color: '#fff', fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'pulse 2s infinite',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, width: 360, maxHeight: 480,
          background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          border: '1px solid #e5e7eb', overflow: 'hidden', zIndex: 100,
        }}>
          {/* Header */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>Notificaciones</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {!permissionGranted && (
                <button onClick={requestPermission} style={{ fontSize: 11, color: '#cc0000', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  Activar sonido
                </button>
              )}
              {unreadCount > 0 && (
                <button onClick={markAllRead} style={{ fontSize: 11, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CheckCheck style={{ width: 12, height: 12 }} />Marcar leidas
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center' }}>
                <Bell style={{ width: 32, height: 32, color: '#d1d5db', margin: '0 auto 8px' }} />
                <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Sin notificaciones</p>
              </div>
            ) : (
              notifications.slice(0, 20).map(n => {
                const typeCfg = TYPE_ICONS[n.type] || TYPE_ICONS.system
                const timeAgo = getTimeAgo(n.createdAt)
                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.read) markAsRead([n.id])
                      if (n.link) router.push(n.link)
                      setOpen(false)
                    }}
                    style={{
                      padding: '10px 16px', borderBottom: '1px solid #f3f4f6', cursor: 'pointer',
                      background: n.read ? '#fff' : '#fef2f2',
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.background = '#f9fafb' }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.background = n.read ? '#fff' : '#fef2f2' }}
                  >
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', background: n.read ? '#d1d5db' : typeCfg.color,
                      marginTop: 5, flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: n.read ? 400 : 600, color: '#111', margin: '0 0 2px', lineHeight: 1.3 }}>{n.title}</p>
                      {n.body && <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 2px', lineHeight: 1.3 }}>{n.body}</p>}
                      <span style={{ fontSize: 11, color: '#9ca3af' }}>{timeAgo}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{ padding: '8px 16px', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
              <button
                onClick={() => { router.push('/administracion/actividad'); setOpen(false) }}
                style={{ fontSize: 12, color: '#cc0000', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}

function getTimeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return 'Ahora'
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`
  return `Hace ${Math.floor(diff / 86400)}d`
}
