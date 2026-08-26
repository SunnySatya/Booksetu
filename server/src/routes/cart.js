import { Router } from 'express'
import User from '../models/User.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()

router.get('/', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub).select('cart')
    res.json(user?.cart || [])
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to load cart' })
  }
})

router.put('/', authRequired, async (req, res) => {
  try {
    const { items } = req.body || {}
    if (!Array.isArray(items)) return res.status(400).json({ message: 'items array required' })
    const user = await User.findByIdAndUpdate(req.user.sub, { $set: { cart: items } }, { new: true }).select('cart')
    res.json(user?.cart || [])
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to save cart' })
  }
})

router.post('/', authRequired, async (req, res) => {
  try {
    const { item } = req.body || {}
    if (!item) return res.status(400).json({ message: 'item required' })
    const user = await User.findById(req.user.sub)
    if (!user) return res.status(404).json({ message: 'User not found' })
    const exists = user.cart.some((c) => c.title === item.title && c.seller === item.seller)
    if (exists) return res.status(409).json({ message: 'Already in cart' })
    user.cart.unshift(item)
    await user.save()
    res.json(user.cart)
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to add to cart' })
  }
})

router.delete('/', authRequired, async (req, res) => {
  try {
    const { title, seller } = req.body || {}
    const user = await User.findById(req.user.sub)
    if (!user) return res.status(404).json({ message: 'User not found' })
    user.cart = user.cart.filter((c) => !(c.title === title && c.seller === seller))
    await user.save()
    res.json(user.cart)
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to remove from cart' })
  }
})

export default router
