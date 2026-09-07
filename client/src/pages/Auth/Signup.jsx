import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { UserPlus, Mail, Lock, User, MapPin, ShieldCheck, Loader2, Eye, EyeOff } from 'lucide-react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { validateName, validateEmail, validatePassword, validateConfirm, passwordStrength } from '../../utils/validation'
import { sendOtp, verifyOtp } from '../../utils/otp'
import OtpInput from '../../components/OtpInput'

const locMessage = (err) => {
  if (err === 'insecure-context')
    return 'Location needs a secure (HTTPS) connection — please open this site over https or the app.'
  if (err === 'timeout')
    return 'Could not pinpoint you in time. Turn on GPS/WiFi and retry, or enter your city manually below.'
  if (err === 'unavailable')
    return 'Your location is unavailable. Turn on location/GPS on your phone and retry, or enter your city manually below.'
  if (err === 'denied' || err === null)
    return 'Location permission was blocked. Please allow location in your browser/phone settings, or enter your city manually below.'
  return ''
}

const Signup = () => {
  const [step, setStep] = useState('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState({})
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [showLocPopup, setShowLocPopup] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState('')
  const [manualCity, setManualCity] = useState('')
  const [manualMode, setManualMode] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const { register, requestLocation, locationError, setManualLocation } = useAuth()
  const navigate = useNavigate()
  const routeState = useLocation().state

  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setInterval(() => setResendTimer((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [resendTimer])

  const strength = passwordStrength(password)

  const handleSignup = async (e) => {
    e.preventDefault()
    const errs = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
      confirm: validateConfirm(password, confirm),
    }
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    setSendingOtp(true)
    setOtpError('')
    try {
      await sendOtp(email, 'registration')
      setOtp('')
      setResendTimer(30)
      setStep('otp')
    } catch (err) {
      setErrors({ email: err.message })
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
      await verifyOtp(email, otp, 'registration')
      setStep('form')
      setShowLocPopup(true)
    } catch (err) {
      setOtpError(err.message)
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendTimer > 0) return
    setSendingOtp(true)
    setOtpError('')
    try {
      await sendOtp(email, 'registration')
      setOtp('')
      setResendTimer(30)
    } catch (err) {
      setOtpError(err.message)
    } finally {
      setSendingOtp(false)
    }
  }

  const proceedWithLocation = async () => {
    setLocating(true)
    setLocError('')
    const loc = await requestLocation()
    if (!loc) {
      setLocating(false)
      setLocError(locMessage(locationError))
      return
    }
    try {
      await register({ name, email, password })
    } catch (err) {
      setLocating(false)
      setLocError(err.message || 'Failed to create account')
      return
    }
    navigate(routeState?.from || '/', { state: routeState })
  }

  const proceedManually = async () => {
    const city = manualCity.trim()
    if (!city) {
      setLocError('Please enter your city / area to continue')
      return
    }
    setManualLocation(city)
    try {
      await register({ name, email, password })
    } catch (err) {
      setLocError(err.message || 'Failed to create account')
      return
    }
    navigate(routeState?.from || '/', { state: routeState })
  }

  return (
    <section className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {step === 'form' ? (
                <UserPlus className="w-8 h-8 text-emerald-600" />
              ) : (
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
              )}
            </div>
            {step === 'form' ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
                <p className="text-gray-500 mt-1">Join the BookSetu community</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900">Verify Email</h2>
                <p className="text-gray-500 mt-1">
                  We sent a 6-digit code to <span className="font-semibold text-gray-700">{email}</span>
                </p>
              </>
            )}
          </div>

          {step === 'form' && (
            <form onSubmit={handleSignup} noValidate className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="John Doe"
                  />
                </div>
                {errors.name && <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>}
              </div>

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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
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
                {password && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex gap-1 flex-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full ${i < strength.score ? strength.color : 'bg-gray-200'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">{strength.label}</span>
                  </div>
                )}
                {errors.password && <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={`w-full pl-10 pr-11 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${errors.confirm ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="Re-enter your password"
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirm && <p className="mt-1.5 text-sm text-red-600">{errors.confirm}</p>}
              </div>

              <button
                type="submit"
                disabled={sendingOtp}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sendingOtp ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <div className="space-y-5">
              <OtpInput value={otp} onChange={setOtp} disabled={verifyingOtp} />

              {otpError && (
                <p className="text-sm text-center text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{otpError}</p>
              )}

              <button
                onClick={handleVerifyOtp}
                disabled={verifyingOtp}
                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {verifyingOtp ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Continue'
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
                <button onClick={() => setStep('form')} className="text-gray-400 hover:text-gray-600 transition-colors">
                  ← Back to signup
                </button>
              </p>
            </div>
          )}

          {step === 'form' && (
            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-600 font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          )}
        </div>
      </div>

      {showLocPopup && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <MapPin className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Enable Location</h3>
            <p className="text-sm text-gray-500 mb-6">
              Enable location to register — we'll show nearby sellers based on your address.
            </p>
            {locError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">{locError}</p>
            )}
            {locating ? (
              <button disabled className="w-full bg-emerald-300 text-white py-3.5 rounded-xl font-bold cursor-not-allowed flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Detecting location...
              </button>
            ) : manualMode ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={manualCity}
                  onChange={(e) => setManualCity(e.target.value)}
                  placeholder="Your city / area (e.g. Indore)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <button onClick={proceedManually} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors">
                  Continue
                </button>
                <button
                  onClick={() => { setManualMode(false); setLocError(''); proceedWithLocation(); }}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Try Location Again
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button onClick={proceedWithLocation} className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors">
                  Allow & Continue
                </button>
                <button onClick={() => setManualMode(true)} className="w-full text-sm text-gray-500 hover:text-emerald-600 transition-colors">
                  Can't enable location? Enter your city instead
                </button>
              </div>
            )}
            {!locating && !manualMode && (
              <button onClick={() => setShowLocPopup(false)} className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default Signup
