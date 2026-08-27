const BREVO_API = 'https://api.brevo.com/v3/smtp/email'

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
  const apiKey = process.env.BREVO_API_KEY
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'sunnysatya4@gmail.com'
  const senderName = process.env.BREVO_SENDER_NAME || 'BookSetu'

  if (!apiKey) {
    throw new Error('Email service not configured. Please contact support.')
  }

  const label = purpose === 'password-reset' ? 'Password Reset' : 'Email Verification'
  const subject = `BookSetu — Your ${label} Code`

  console.log(`[email] Sending OTP to ${email} via Brevo...`)

  const res = await fetch(BREVO_API, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: [{ email }],
      subject,
      htmlContent: otpEmailHtml(code, purpose),
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    console.error('[email] Brevo error:', res.status, JSON.stringify(data))
    throw new Error(data.message || 'Failed to send email')
  }

  console.log(`[email] OTP sent to ${email}, id: ${data.messageId}`)
  return { sent: true }
}
