import { Router } from 'express'
import User from '../models/User.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()

router.get('/', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub).select('wishlist')
    res.json(user?.wishlist || [])
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to load wishlist' })
  }
})

router.put('/', authRequired, async (req, res) => {
  try {
    const { items } = req.body || {}
    if (!Array.isArray(items)) return res.status(400).json({ message: 'items array required' })
    const user = await User.findByIdAndUpdate(req.user.sub, { $set: { wishlist: items } }, { new: true }).select('wishlist')
    res.json(user?.wishlist || [])
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to save wishlist' })
  }
})

router.post('/', authRequired, async (req, res) => {
  try {
    const { item } = req.body || {}
    if (!item) return res.status(400).json({ message: 'item required' })
    const user = await User.findById(req.user.sub)
    if (!user) return res.status(404).json({ message: 'User not found' })
    const exists = user.wishlist.some((w) => w.title === item.title && w.seller === item.seller)
    if (exists) return res.status(409).json({ message: 'Already in wishlist' })
    user.wishlist.unshift(item)
    await user.save()
    res.json(user.wishlist)
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to add to wishlist' })
  }
})

router.delete('/', authRequired, async (req, res) => {
  try {
    const { title, seller } = req.body || {}
    const user = await User.findById(req.user.sub)
    if (!user) return res.status(404).json({ message: 'User not found' })
    user.wishlist = user.wishlist.filter((w) => !(w.title === title && w.seller === seller))
    await user.save()
    res.json(user.wishlist)
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to remove from wishlist' })
  }
})

export default router
