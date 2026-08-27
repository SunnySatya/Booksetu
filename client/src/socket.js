import { io } from 'socket.io-client'
import { getToken } from './api'

let socket = null

export function initSocket() {
  if (socket) return socket

  const isProd = import.meta.env.PROD
  let base
  if (isProd) {
    base = window.location.origin
  } else {
    base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')
  }

  socket = io(base, { auth: { token: getToken() } })

  socket.on('chat:update', () =>
    window.dispatchEvent(new CustomEvent('bs_chat_update')),
  )
  socket.on('notification:new', () =>
    window.dispatchEvent(new CustomEvent('bs_notif_update')),
  )
  socket.on('content:update', () =>
    window.dispatchEvent(new CustomEvent('bs_content_update')),
  )
  return socket
}
