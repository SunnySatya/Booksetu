import { Router } from 'express'
import User from '../models/User.js'
import { createOtp, verifyOtp, consumeOtp } from '../services/otpService.js'
import { sendOtpEmail } from '../services/emailService.js'
import { rateLimit } from '../middleware/rateLimit.js'

const router = Router()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const sendLimiter = rateLimit({ windowMs: 60000, max: 3, message: 'Too many code requests. Try again later.' })
const verifyLimiter = rateLimit({ windowMs: 300000, max: 10, message: 'Too many attempts. Try again later.' })

router.post('/send', sendLimiter, async (req, res) => {
  try {
    const { email, purpose = 'registration' } = req.body || {}

    if (!email || !EMAIL_RE.test(email.trim()))
      return res.status(400).json({ message: 'Valid email is required' })

    if (!['registration', 'password-reset'].includes(purpose))
      return res.status(400).json({ message: 'Invalid purpose' })

    const normalizedEmail = email.trim().toLowerCase()

    if (purpose === 'registration') {
      const exists = await User.findOne({ email: normalizedEmail })
      if (exists) return res.status(409).json({ message: 'Email already registered' })
    }

    if (purpose === 'password-reset') {
      const exists = await User.findOne({ email: normalizedEmail })
      if (!exists) return res.status(404).json({ message: 'No account found with this email' })
    }

    const { code } = await createOtp(normalizedEmail, purpose)
    await sendOtpEmail(normalizedEmail, code, purpose)

    res.json({ message: 'Code sent successfully' })
  } catch (err) {
    const status = err.status || 500
    res.status(status).json({ message: err.message || 'Failed to send code' })
  }
})

router.post('/verify', verifyLimiter, async (req, res) => {
  try {
    const { email, code, purpose = 'registration' } = req.body || {}

    if (!email || !code)
      return res.status(400).json({ message: 'Email and code are required' })

    if (!['registration', 'password-reset'].includes(purpose))
      return res.status(400).json({ message: 'Invalid purpose' })

    await verifyOtp(email.trim().toLowerCase(), code.trim(), purpose)

    res.json({ message: 'Verified successfully' })
  } catch (err) {
    const status = err.status || 500
    res.status(status).json({ message: err.message || 'Verification failed' })
  }
})

export default router
