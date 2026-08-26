import { Router } from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import { authRequired, signToken } from '../middleware/auth.js'
import { isEmailVerified, consumeOtp } from '../services/otpService.js'
import { rateLimit } from '../middleware/rateLimit.js'

const router = Router()

const loginLimiter = rateLimit({ windowMs: 60000, max: 10, message: 'Too many login attempts. Try again later.' })
const registerLimiter = rateLimit({ windowMs: 60000, max: 5, message: 'Too many register attempts. Try again later.' })
const resetLimiter = rateLimit({ windowMs: 60000, max: 5, message: 'Too many reset attempts. Try again later.' })

router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body || {}
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' })

    const verified = await isEmailVerified(email, 'registration')
    if (!verified)
      return res.status(400).json({ message: 'Verify your email first' })

    const exists = await User.findOne({ email: email.toLowerCase() })
    if (exists) return res.status(409).json({ message: 'Email already registered' })
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({ name: name || '', email, passwordHash })
    await consumeOtp(email.toLowerCase(), 'registration')
    res.status(201).json({ token: signToken(user), user: user.safe() })
  } catch (e) {
    res.status(500).json({ message: e.message || 'Registration failed' })
  }
})

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {}
    const user = await User.findOne({ email: (email || '').toLowerCase() })
    if (!user || !user.passwordHash)
      return res.status(401).json({ message: 'Invalid email or password' })
    const ok = await bcrypt.compare(password || '', user.passwordHash)
    if (!ok) return res.status(401).json({ message: 'Invalid email or password' })
    res.json({ token: signToken(user), user: user.safe() })
  } catch (e) {
    res.status(500).json({ message: e.message || 'Login failed' })
  }
})

router.get('/me', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub)
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user.safe())
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to load profile' })
  }
})

router.patch('/me', authRequired, async (req, res) => {
  try {
    const { name, phone, city } = req.body || {}
    const user = await User.findByIdAndUpdate(
      req.user.sub,
      { $set: { name: name?.trim() || '', phone: phone?.replace(/\D/g, '') || '', city: city?.trim() || '' } },
      { new: true },
    )
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user.safe())
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to update profile' })
  }
})

router.post('/reset-password', resetLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' })

    const verified = await isEmailVerified(email, 'password-reset')
    if (!verified)
      return res.status(400).json({ message: 'Verify your email first' })

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) return res.status(404).json({ message: 'User not found' })

    user.passwordHash = await bcrypt.hash(password, 10)
    await user.save()
    await consumeOtp(email.toLowerCase(), 'password-reset')

    res.json({ message: 'Password updated successfully' })
  } catch (e) {
    res.status(500).json({ message: e.message || 'Password reset failed' })
  }
})

export default router
