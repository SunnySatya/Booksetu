import React, { useState, useEffect } from 'react'
import { KeyRound, Mail, ShieldCheck, Lock, Loader2, Eye, EyeOff } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { validateEmail, validatePassword, validateConfirm } from '../../utils/validation'
import { sendOtp, verifyOtp } from '../../utils/otp'
import { api } from '../../api'
import OtpInput from '../../components/OtpInput'

const ForgotPassword = () => {
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [devCode, setDevCode] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setInterval(() => setResendTimer((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [resendTimer])

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    const err = validateEmail(email)
    setErrors({ email: err })
    if (err) return

    setSendingOtp(true)
    setOtpError('')
    try {
      const res = await sendOtp(email, 'password-reset')
      setDevCode(res.devMode ? res.code : '')
      setOtp('')
      setResendTimer(30)
      setStep('otp')
    } catch (err) {
      setErrors({ email: err.message })
    } finally {
      setSendingOtp(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendTimer > 0) return
    setSendingOtp(true)
    setOtpError('')
    try {
      const res = await sendOtp(email, 'password-reset')
      setDevCode(res.devMode ? res.code : '')
      setOtp('')
      setResendTimer(30)
    } catch (err) {
      setOtpError(err.message)
    } finally {
      setSendingOtp(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      setOtpError('Please enter the complete 6-digit code')
      return
    }
    setVerifyingOtp(true)
    setOtpError('')
    try {
      await verifyOtp(email, otp, 'password-reset')
      setOtpError('')
      setStep('reset')
    } catch (err) {
      setOtpError(err.message)
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handleResetSubmit = async (e) => {
    e.preventDefault()
    const errs = {
      password: validatePassword(password),
      confirm: validateConfirm(password, confirm),
    }
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    setResetting(true)
    try {
      await api.post('/auth/reset-password', { email, password })
      setSuccess(true)
    } catch (err) {
      setErrors({ password: err.message })
    } finally {
      setResetting(false)
    }
  }

  const stepMeta = {
    email: { icon: <KeyRound className="w-8 h-8 text-emerald-600" />, title: 'Forgot Password', sub: "Enter your email and we'll send you a reset code" },
    otp: { icon: <ShieldCheck className="w-8 h-8 text-emerald-600" />, title: 'Verify Code', sub: <>We sent a 6-digit code to <span className="font-semibold text-gray-700">{email}</span></> },
    reset: { icon: <Lock className="w-8 h-8 text-emerald-600" />, title: 'Reset Password', sub: 'Create a new password for your account' },
    done: { icon: <ShieldCheck className="w-8 h-8 text-emerald-600" />, title: 'Password Reset', sub: 'Your password has been updated successfully' },
  }
  const meta = success ? stepMeta.done : stepMeta[step]

  return (
    <section className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {meta.icon}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{meta.title}</h2>
            <p className="text-gray-500 mt-1">{meta.sub}</p>
          </div>

          {!success && step === 'email' && (
            <form onSubmit={handleEmailSubmit} noValidate className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="you@email.com"
                  />
                </div>
                {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
              </div>

              <button type="submit" disabled={sendingOtp} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {sendingOtp ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  'Send Reset Code'
                )}
              </button>
            </form>
          )}

          {!success && step === 'otp' && (
            <div className="space-y-5">
              <OtpInput value={otp} onChange={setOtp} disabled={verifyingOtp} />

              {devCode && (
                <p className="text-xs text-center text-gray-400">
                  Dev mode — your OTP is <span className="font-mono font-bold text-emerald-600">{devCode}</span>
                </p>
              )}

              {otpError && (
                <p className="text-sm text-center text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{otpError}</p>
              )}

              <button onClick={handleVerifyOtp} disabled={verifyingOtp} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {verifyingOtp ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </button>

              <div className="text-center text-sm">
                {resendTimer > 0 ? (
                  <span className="text-gray-400">Resend code in {resendTimer}s</span>
                ) : (
                  <button onClick={handleResendOtp} disabled={sendingOtp} className="text-emerald-600 font-semibold hover:underline disabled:opacity-50">
                    {sendingOtp ? 'Sending...' : "Didn't receive the code? Resend"}
                  </button>
                )}
              </div>

              <p className="text-center text-sm">
                <button onClick={() => setStep('email')} className="text-gray-400 hover:text-gray-600 transition-colors">
                  ← Use a different email
                </button>
              </p>
            </div>
          )}

          {!success && step === 'reset' && (
            <form onSubmit={handleResetSubmit} noValidate className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-10 pr-11 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="Min 8 chars, 1 uppercase & 1 number"
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={`w-full pl-10 pr-11 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.confirm ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="Re-enter your new password"
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirm && <p className="mt-1.5 text-sm text-red-600">{errors.confirm}</p>}
              </div>

              <button type="submit" disabled={resetting} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {resetting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}

          {success && (
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
            >
              Back to Sign In
            </button>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Remembered your password?{' '}
            <Link to="/login" className="text-emerald-600 font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default ForgotPassword
