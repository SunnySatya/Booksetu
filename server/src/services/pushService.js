import webpush from 'web-push'
import PushSubscription from '../models/PushSubscription.js'

let configured = false

function ensureConfigured() {
  if (configured) return true
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subj = process.env.VAPID_SUBJECT || 'mailto:sunnysatya4@gmail.com'
  if (!pub || !priv) return false
  webpush.setVapidDetails(subj, pub, priv)
  configured = true
  return true
}

export async function notifyUser(email, payload) {
  if (!email || !ensureConfigured()) return
  const subs = await PushSubscription.find({ email: String(email).toLowerCase() })
  if (!subs.length) return
  const data = JSON.stringify({
    title: payload.title || 'BookSetu',
    body: payload.body || '',
    url: payload.url || '/',
    icon: payload.icon || '/favicon.ico',
  })
  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        data,
      ),
    ),
  )
  // Remove subscriptions that are no longer valid (410 Gone / 404).
  await Promise.all(
    results.map(async (r, i) => {
      if (r.status === 'rejected') {
        const status = r.reason?.statusCode
        if (status === 410 || status === 404) {
          try {
            await PushSubscription.deleteOne({ _id: subs[i]._id })
          } catch {}
        }
      }
    }),
  )
}

export async function saveSubscription(email, subscription) {
  if (!email || !subscription?.endpoint) return null
  await PushSubscription.findOneAndUpdate(
    { endpoint: subscription.endpoint },
    {
      $set: {
        email: String(email).toLowerCase(),
        p256dh: subscription.keys?.p256dh || '',
        auth: subscription.keys?.auth || '',
      },
    },
    { upsert: true, new: true },
  )
  return { ok: true }
}

export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || ''
}
