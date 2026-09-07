import { api } from '../api'

const SW_PATH = '/sw.js'

const urlBase64ToUint8Array = (base64) => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const base64Ok = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64Ok)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export const isPushSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

export const getPushPermission = () => {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function setupPushNotifications() {
  if (!isPushSupported()) return null
  try {
    // Ask for permission first (must be from a user action ideally).
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
    const reg = await navigator.serviceWorker.register(SW_PATH)
    await navigator.serviceWorker.ready

    if (Notification.permission !== 'granted') return null

    let subscription = await reg.pushManager.getSubscription()
    if (!subscription) {
      const { publicKey } = await api.get('/push/vapid-public-key')
      if (!publicKey) return null
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
    }
    // Send to server (only if not already saved for this endpoint on login).
    await api.post('/push/subscribe', {
      subscription: {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
          auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')))),
        },
      },
    })
    return subscription
  } catch {
    return null
  }
}
