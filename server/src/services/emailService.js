import nodemailer from 'nodemailer'

let transporter = null

function getTransporter() {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT) || 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    console.warn('[email] SMTP not configured — emails will be logged to console only')
    return null
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  })

  return transporter
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
  const transport = getTransporter()

  const label = purpose === 'password-reset' ? 'Password Reset' : 'Email Verification'
  const subject = `BookSetu — Your ${label} Code`

  if (!transport) {
    console.log(`[email][DEV] ${subject} → ${email}`)
    console.log(`[email][DEV] Code: ${code}`)
    return { dev: true }
  }

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject,
      html: otpEmailHtml(code, purpose),
    })
    return { sent: true }
  } catch (err) {
    console.error('[email] Failed to send OTP email:', err.message)
    return { dev: true }
  }
}
