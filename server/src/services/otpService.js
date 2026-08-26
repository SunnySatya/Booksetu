import crypto from 'crypto'
import Otp from '../models/Otp.js'

const OTP_LENGTH = 6
const OTP_TTL_MINUTES = 10
const MAX_ATTEMPTS = 5
const RESEND_COOLDOWN_SECONDS = 30

function generateCode() {
  const bytes = crypto.randomBytes(OTP_LENGTH)
  let code = ''
  for (let i = 0; i < OTP_LENGTH; i++) {
    code += bytes[i] % 10
  }
  return code
}

export async function createOtp(email, purpose) {
  const recentOtp = await Otp.findOne({
    email: email.toLowerCase(),
    purpose,
    verified: false,
  }).sort({ createdAt: -1 })

  if (recentOtp) {
    const elapsed = (Date.now() - recentOtp.createdAt.getTime()) / 1000
    if (elapsed < RESEND_COOLDOWN_SECONDS) {
      const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed)
      throw Object.assign(new Error(`Please wait ${wait}s before requesting a new code`), { status: 429 })
    }
  }

  await Otp.deleteMany({
    email: email.toLowerCase(),
    purpose,
    verified: false,
  })

  const code = generateCode()
  const otp = await Otp.create({
    email: email.toLowerCase(),
    code,
    purpose,
  })

  return { otpId: String(otp._id), code }
}

export async function verifyOtp(email, code, purpose) {
  const otp = await Otp.findOne({
    email: email.toLowerCase(),
    purpose,
    verified: false,
  }).sort({ createdAt: -1 })

  if (!otp) {
    throw Object.assign(new Error('No active code found. Please request a new one.'), { status: 400 })
  }

  const elapsed = (Date.now() - otp.createdAt.getTime()) / 1000
  if (elapsed > OTP_TTL_MINUTES * 60) {
    await otp.deleteOne()
    throw Object.assign(new Error('Code has expired. Please request a new one.'), { status: 400 })
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    await otp.deleteOne()
    throw Object.assign(new Error('Too many failed attempts. Please request a new code.'), { status: 429 })
  }

  if (otp.code !== code) {
    otp.attempts += 1
    await otp.save()
    throw Object.assign(new Error('Invalid code. Please try again.'), { status: 400 })
  }

  otp.verified = true
  await otp.save()

  return true
}

export async function isEmailVerified(email, purpose) {
  const otp = await Otp.findOne({
    email: email.toLowerCase(),
    purpose,
    verified: true,
  }).sort({ createdAt: -1 })

  if (!otp) return false

  const elapsed = (Date.now() - otp.createdAt.getTime()) / 1000
  if (elapsed > OTP_TTL_MINUTES * 60) return false

  return true
}

export async function consumeOtp(email, purpose) {
  await Otp.deleteMany({ email: email.toLowerCase(), purpose })
}
