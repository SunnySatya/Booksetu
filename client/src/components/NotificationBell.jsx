import React, { useEffect, useRef, useState } from 'react'
import { Bell, Tag, Check, Megaphone, Info, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import useNotifications from '../hooks/useNotifications'
import { getLastRead, markAllRead } from '../utils/notificationStore'

const KIND_ICON = {
  offer: <Tag className="w-4 h-4 text-amber-600" />,
  deal: <Check className="w-4 h-4 text-emerald-600" />,
  admin: <Megaphone className="w-4 h-4 text-purple-600" />,
  info: <Info className="w-4 h-4 text-blue-600" />,
}
const KIND_BG = {
  offer: 'bg-amber-50',
  deal: 'bg-emerald-50',
  admin: 'bg-purple-50',
  info: 'bg-blue-50',
}

const timeAgo = (at) => {
  const s = Math.floor((Date.now() - at) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function NotificationBell() {
  const { user } = useAuth()
  const items = useNotifications(user?.email || null)
  const [open, setOpen] = useState(false)
  const [lastRead, setLastRead] = useState(getLastRead())
  const ref = useRef(null)

  const unread = items.filter((n) => n.at > lastRead).length

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  const handleOpen = () => {
    setOpen((v) => {
      const next = !v
      if (next) {
        markAllRead()
        setLastRead(getLastRead())
      }
      return next
    })
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        aria-label={`Notifications${unread ? ` — ${unread} unread` : ''}`}
        className={`relative p-2 rounded-lg transition-colors ${
          open ? 'text-emerald-600 bg-emerald-50' : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
        }`}
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[88] bg-black/40 backdrop-blur-sm sm:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="fixed left-0 right-0 top-0 bottom-0 z-[89] flex flex-col bg-white sm:absolute sm:left-auto sm:top-full sm:mt-2 sm:w-80 sm:max-h-[70vh] sm:rounded-2xl sm:shadow-2xl sm:ring-1 sm:ring-black/10 sm:z-[90] sm:animate-toast-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <p className="font-bold text-sm text-gray-900">Notifications</p>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      markAllRead()
                      setLastRead(getLastRead())
                    }}
                    className="text-xs font-semibold text-emerald-600 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close notifications"
                  className="sm:hidden p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {items.length === 0 ? (
                <div className="py-10 text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-400">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {items.map((n) => (
                    <div key={n.id} className={`flex gap-3 px-4 py-3 ${n.at > lastRead ? 'bg-emerald-50/40' : ''}`}>
                      <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${KIND_BG[n.kind] || KIND_BG.info}`}>
                        {KIND_ICON[n.kind] || KIND_ICON.info}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 leading-snug">{n.title}</p>
                        {n.body && <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>}
                        <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationBell
