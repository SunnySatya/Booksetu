import { Router } from 'express'
import Notification from '../models/Notification.js'
import { attachUser, authRequired, adminRequired } from '../middleware/auth.js'
import { notifyUser } from '../services/pushService.js'

const router = Router()

const emitTo = (app, target) => {
  const io = app?.get('io')
  if (!io) return
  if (target) {
    io.to(`user:${String(target).toLowerCase()}`).emit('notification:new')
  } else {
    io.emit('notification:new')
  }
}

const broadcast = async (app, target, n) => {
  emitTo(app, target)
  try {
    await notifyUser(target || null, {
      title: n.title,
      body: n.body,
      url: (target ? '/profile' : '/'),
    })
  } catch {}
}

router.get('/', attachUser, async (req, res) => {
  try {
    const email = req.user?.email
    const query = email
      ? { $or: [{ to: null }, { to: { $regex: `^${String(email).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } }] }
      : { to: null }
    const items = await Notification.find(query).sort({ at: -1 }).limit(60)
    res.json(items.map(Notification.mapOut))
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to load notifications' })
  }
})

router.post('/', authRequired, async (req, res) => {
  try {
    const { title, body, kind, to } = req.body || {}
    if (!title) return res.status(400).json({ message: 'Title is required' })
    const safeKind = ['info', 'offer', 'deal', 'admin'].includes(kind) ? kind : 'info'

    // Non-admins may only create notifications targeted to themselves
    // (e.g. "your listing is live"). Everything else is admin-only.
    if (!req.user.isAdmin) {
      const own = String(req.user.email || '').toLowerCase()
      const target = to ? String(to).toLowerCase() : own
      if (target !== own) {
        return res.status(403).json({ message: 'Admin access required' })
      }
      const n = await Notification.create({
        title,
        body: body || '',
        kind: safeKind,
        to: own,
      })
      await broadcast(req.app, own, n)
      return res.status(201).json(Notification.mapOut(n))
    }

    const n = await Notification.create({
      title,
      body: body || '',
      kind: safeKind,
      to: to || null,
    })
    if (to) {
      await broadcast(req.app, to, n)
    } else {
      emitTo(req.app, null)
    }
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
