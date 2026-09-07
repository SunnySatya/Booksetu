import React, { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { getNotifications, NOTIF_EVENT, getSeenIds, markSeenId } from '../utils/notificationStore'
import { setupPushNotifications } from '../utils/push'

// Renders no UI itself — it listens for new notifications (polling + socket)
// and surfaces them as in-app toasts + phone push popups.
export default function NotificationToaster() {
  const { user } = useAuth()
  const email = user?.email || ''
  const toast = useToast()
  const shownRef = useRef(getSeenIds())
  const pushDoneRef = useRef(false)

  // Enable push once a logged-in user is present (and permission allows).
  useEffect(() => {
    if (!email || pushDoneRef.current) return
    pushDoneRef.current = true
    setupPushNotifications().catch(() => {})
  }, [email])

  useEffect(() => {
    if (!email) return
    let alive = true
    const refresh = async () => {
      try {
        const all = await getNotifications()
        // Only notifications meant for this user (public or theirs).
        const mine = all.filter((n) => !n.to || n.to === email)
        for (const n of mine) {
          if (shownRef.current.has(n.id)) continue
          shownRef.current.add(n.id)
          markSeenId(n.id)
          const title = n.title || 'BookSetu'
          const body = n.body || ''
          // In-app toast (works reliably on mobile).
          toast(body ? `${title} — ${body}` : title, 'info', 5000)
          // Phone OS notification fallback when tab is hidden.
          if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
            new Notification('BookSetu', { body: body ? `${title}: ${body}` : title, icon: '/favicon.ico' })
          }
        }
      } catch {}
    }
    refresh()
    window.addEventListener(NOTIF_EVENT, refresh)
    const t = setInterval(refresh, 4000)
    return () => {
      alive = false
      window.removeEventListener(NOTIF_EVENT, refresh)
      clearInterval(t)
    }
  }, [email, toast])

  return null
}
