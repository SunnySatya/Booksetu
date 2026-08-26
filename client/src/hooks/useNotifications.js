import { useEffect, useState } from 'react'
import { getNotifications, NOTIF_EVENT } from '../utils/notificationStore'

export default function useNotifications(userEmail) {
  const [items, setItems] = useState([])

  useEffect(() => {
    let alive = true
    const refresh = async () => {
      try {
        const all = await getNotifications()
        const visible = userEmail
          ? all.filter((n) => !n.to || n.to === userEmail)
          : all.filter((n) => !n.to)
        if (alive) setItems(visible)
      } catch {}
    }
    refresh()

    window.addEventListener(NOTIF_EVENT, refresh)
    const t = setInterval(refresh, 5000)
    return () => {
      alive = false
      window.removeEventListener(NOTIF_EVENT, refresh)
      clearInterval(t)
    }
  }, [userEmail])

  return items
}
