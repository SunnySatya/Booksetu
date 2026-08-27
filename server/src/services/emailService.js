import { Resend } from 'resend'

let resend = null

const RESEND_FROM = 'BookSetu <onboarding@resend.dev>'

function getClient() {
  if (resend) return resend

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[email] RESEND_API_KEY is missing!')
    return null
  }

  console.log('[email] Resend client initialized')
  resend = new Resend(apiKey)
  return resend
}

function otpEmailHtml(code, purpose) {
  const label = purpose === 'password-reset' ? 'Password Reset' : 'Email Verification'
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif;">
      <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <div style="background:#059669;padding:24px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:20px;">BookSetu</h1>
        </div>
        <div style="padding:32px 24px;text-align:center;">
          <h2 style="color:#111827;margin:0 0 8px;">${label}</h2>
          <p style="color:#6b7280;margin:0 0 24px;">Use the code below to complete your ${label.toLowerCase()}.</p>
          <div style="background:#f3f4f6;border-radius:12px;padding:16px;margin:0 0 24px;">
            <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#059669;font-family:monospace;">${code}</span>
          </div>
          <p style="color:#9ca3af;font-size:13px;margin:0;">This code expires in 10 minutes. Do not share it with anyone.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function sendOtpEmail(email, code, purpose) {
  const client = getClient()

  const label = purpose === 'password-reset' ? 'Password Reset' : 'Email Verification'
  const subject = `BookSetu — Your ${label} Code`

  if (!client) {
    throw new Error('Email service not configured. Please contact support.')
  }

  console.log(`[email] Sending OTP to ${email} via Resend...`)

  const { data, error } = await client.emails.send({
    from: RESEND_FROM,
    to: email,
    subject,
    html: otpEmailHtml(code, purpose),
  })

  if (error) {
    console.error('[email] Resend error:', JSON.stringify(error))
    throw new Error(error.message || 'Failed to send email')
  }

  console.log(`[email] OTP sent successfully to ${email}, id: ${data?.id}`)
  return { sent: true }
}
