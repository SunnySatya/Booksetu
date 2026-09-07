import { Router } from 'express'
import PushSubscription from '../models/PushSubscription.js'
import { authRequired } from '../middleware/auth.js'
import { saveSubscription, getVapidPublicKey } from '../services/pushService.js'

const router = Router()

router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: getVapidPublicKey() })
})

router.post('/subscribe', authRequired, async (req, res) => {
  try {
    const sub = req.body?.subscription
    if (!sub || !sub.endpoint) {
      return res.status(400).json({ message: 'Subscription required' })
    }
    await saveSubscription(req.user.email, sub)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to save push subscription' })
  }
})

router.post('/unsubscribe', authRequired, async (req, res) => {
  try {
    const { endpoint } = req.body || {}
    if (endpoint) {
      await PushSubscription.deleteOne({ endpoint })
    }
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to remove push subscription' })
  }
})

export default router
