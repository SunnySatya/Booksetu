import { api } from '../api'

export const NOTIF_EVENT = 'bs_notif_update'

const KEY = 'bs_notifications_read'

const dispatchUpdate = () =>
  window.dispatchEvent(new CustomEvent(NOTIF_EVENT))

export const getNotifications = async () => {
  const data = await api.get('/notifications')
  return data.map((n) => ({ ...n, id: n.id ?? n._id }))
}

export const addNotification = async (n) => {
  const created = await api.post('/notifications', n)
  dispatchUpdate()
  return created
}

export const deleteNotification = async (id) => {
  await api.del(`/notifications/${id}`)
  dispatchUpdate()
}

export const clearNotifications = async () => {
  await api.del('/notifications/all')
  dispatchUpdate()
}

export const getLastRead = () => Number(localStorage.getItem(KEY) || 0)

export const markAllRead = () => {
  localStorage.setItem(KEY, String(Date.now()))
  dispatchUpdate()
}
