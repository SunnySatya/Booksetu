import { Router } from 'express'
import Notification from '../models/Notification.js'
import { attachUser, adminRequired } from '../middleware/auth.js'

const router = Router()

router.get('/', attachUser, async (req, res) => {
  try {
    const email = req.user?.email
    const query = email ? { $or: [{ to: null }, { to: email }] } : { to: null }
    const items = await Notification.find(query).sort({ at: -1 }).limit(60)
    res.json(items.map(Notification.mapOut))
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to load notifications' })
  }
})

router.post('/', adminRequired, async (req, res) => {
  try {
    const { title, body, kind, to } = req.body || {}
    if (!title) return res.status(400).json({ message: 'Title is required' })
    const n = await Notification.create({
      title,
      body: body || '',
      kind: ['info', 'offer', 'deal', 'admin'].includes(kind) ? kind : 'info',
      to: to || null,
    })
    req.app.get('io')?.emit('notification:new')
    res.status(201).json(Notification.mapOut(n))
  } catch (e) {
    res.status(400).json({ message: e.message || 'Failed to save notification' })
  }
})

router.delete('/:id', adminRequired, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to delete notification' })
  }
})

router.delete('/all', adminRequired, async (_req, res) => {
  try {
    await Notification.deleteMany({})
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to delete notifications' })
  }
})

export default router
