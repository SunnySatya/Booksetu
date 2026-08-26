import { useEffect, useState } from 'react'
import { getMessages, CHAT_EVENT } from '../utils/chatStore'

export default function useChat(convId) {
  const [messages, setMessages] = useState([])

  useEffect(() => {
    let alive = true
    const refresh = async () => {
      try {
        const msgs = await getMessages(convId)
        if (alive) setMessages(msgs)
      } catch {}
    }
    refresh()

    window.addEventListener(CHAT_EVENT, refresh)
    const t = setInterval(refresh, 4000)
    return () => {
      alive = false
      window.removeEventListener(CHAT_EVENT, refresh)
      clearInterval(t)
    }
  }, [convId])

  return messages
}
