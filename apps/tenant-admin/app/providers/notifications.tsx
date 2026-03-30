'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'

interface Notification {
  id: number
  type: string
  title: string
  body?: string
  link?: string
  read: boolean
  createdAt: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (ids: number[]) => void
  markAllRead: () => void
  requestPermission: () => void
  permissionGranted: boolean
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  markAllRead: () => {},
  requestPermission: () => {},
  permissionGranted: false,
})

export function useNotifications() {
  return useContext(NotificationContext)
}

// Notification sound — short professional ding
function playNotificationSound() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880 // A5
    osc.type = 'sine'
    gain.gain.value = 0.3
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
    // Second tone
    setTimeout(() => {
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.frequency.value = 1320 // E6
      osc2.type = 'sine'
      gain2.gain.value = 0.2
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc2.start(ctx.currentTime)
      osc2.stop(ctx.currentTime + 0.4)
    }, 150)
  } catch { /* audio not available */ }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [toasts, setToasts] = useState<Notification[]>([])
  const seenIds = useRef(new Set<number>())

  // Check browser notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted')
    }
  }, [])

  const requestPermission = useCallback(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission().then((perm) => {
        setPermissionGranted(perm === 'granted')
      })
    }
  }, [])

  // Load initial notifications
  useEffect(() => {
    fetch('/api/notifications').then(r => r.json()).then(data => {
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
      // Mark all existing as seen
      for (const n of (data.notifications || [])) seenIds.current.add(n.id)
    }).catch(() => {})
  }, [])

  // SSE Connection
  useEffect(() => {
    let eventSource: EventSource | null = null
    let reconnectTimer: ReturnType<typeof setTimeout>

    function connect() {
      eventSource = new EventSource('/api/notifications/stream')

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'connected') return

          // New notification
          const notif: Notification = {
            id: data.id,
            type: data.type,
            title: data.title,
            body: data.body,
            link: data.link,
            read: false,
            createdAt: data.createdAt,
          }

          // Skip if already seen
          if (seenIds.current.has(notif.id)) return
          seenIds.current.add(notif.id)

          // Update state
          setNotifications(prev => [notif, ...prev])
          setUnreadCount(prev => prev + 1)

          // Play sound
          playNotificationSound()

          // Browser notification
          if (permissionGranted && typeof window !== 'undefined' && 'Notification' in window) {
            const browserNotif = new window.Notification(notif.title, {
              body: notif.body || '',
              icon: '/logos/cep-formacion-logo.png',
              tag: `notif-${notif.id}`,
            })
            browserNotif.onclick = () => {
              window.focus()
              if (notif.link) window.location.href = notif.link
            }
          }

          // Toast
          setToasts(prev => [...prev, notif])
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== notif.id))
          }, 8000)
        } catch { /* malformed event */ }
      }

      eventSource.onerror = () => {
        eventSource?.close()
        // Reconnect after 5 seconds
        reconnectTimer = setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      eventSource?.close()
      clearTimeout(reconnectTimer)
    }
  }, [permissionGranted])

  const markAsRead = useCallback((ids: number[]) => {
    fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    }).catch(() => {})
    setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - ids.length))
  }, [])

  const markAllRead = useCallback(() => {
    fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    }).catch(() => {})
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllRead, requestPermission, permissionGranted }}>
      {children}

      {/* Toast notifications */}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9998, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 380 }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            onClick={() => {
              markAsRead([toast.id])
              setToasts(prev => prev.filter(t => t.id !== toast.id))
              if (toast.link) window.location.href = toast.link
            }}
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: '14px 18px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              borderLeft: '4px solid #cc0000',
              cursor: 'pointer',
              animation: 'slideInRight 0.3s ease-out',
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 600, color: '#111', margin: '0 0 4px' }}>{toast.title}</p>
            {toast.body && <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{toast.body}</p>}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </NotificationContext.Provider>
  )
}
