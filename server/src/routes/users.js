import { Router } from 'express'
import User from '../models/User.js'
import { authRequired, adminRequired } from '../middleware/auth.js'

const router = Router()

router.use(authRequired, adminRequired)

router.get('/', async (_req, res) => {
  try {
    const limit = Math.min(Number(_req.query.limit) || 500, 1000)
    const skip = Math.max(Number(_req.query.skip) || 0, 0)
    const users = await User.find().sort({ createdAt: -1 }).skip(skip).limit(limit)
    const total = await User.countDocuments()
    res.json({ users: users.map((u) => u.safe()), total })
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to load users' })
  }
})

router.patch('/:id/admin', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isAdmin: !!req.body?.isAdmin },
      { new: true },
    )
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user.safe())
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to update user' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to delete user' })
  }
})

export default router
