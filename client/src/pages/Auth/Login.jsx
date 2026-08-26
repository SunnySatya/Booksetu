import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { LogIn, Mail, Lock, MapPin, Eye, EyeOff } from 'lucide-react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { validateEmail, validatePassword } from '../../utils/validation'
import { useToast } from '../../components/Toast'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [errors, setErrors] = useState({})
  const [showLocPopup, setShowLocPopup] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState('')
  const { login, requestLocation } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const routeState = useLocation().state

  const handleLogin = async (e) => {
    e.preventDefault()
    const errs = {
      email: validateEmail(email),
      password: password ? '' : 'Password is required',
    }
    setErrors(errs)
    if (Object.values(errs).some(Boolean)) return

    try {
      const u = await login({ email, password })
      if (u?.isAdmin) {
        navigate('/admin')
        return
      }
      setLocError('')
      setShowLocPopup(true)
    } catch (err) {
      toast(err.message || 'Login failed', 'error')
    }
  }

  const proceedWithLocation = async () => {
    setLocating(true)
    setLocError('')
    const loc = await requestLocation()
    if (!loc) {
      setLocating(false)
      setLocError('Location is required — this is how we show nearby books.')
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
              <LogIn className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-500 mt-1">Sign in to your BookSetu account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
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
                    placeholder="Enter your password"
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>}
              </div>

              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-sm text-emerald-600 font-semibold hover:underline">
                  Forgot Password?
                </Link>
              </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
            >
              Sign In
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-emerald-600 font-semibold hover:underline">
              Sign Up
            </Link>
          </p>
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
              Enable location to log in — we show sellers and books near you.
            </p>
            {locError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">{locError}</p>
            )}
            {locating ? (
              <button disabled className="w-full bg-emerald-300 text-white py-3.5 rounded-xl font-bold cursor-not-allowed">
                Detecting location...
              </button>
            ) : (
              <button onClick={proceedWithLocation} className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors">
                Allow & Continue
              </button>
            )}
            {!locating && (
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

export default Login
