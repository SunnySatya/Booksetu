import React, { useEffect, useState, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'

// Code-split each page so only the visited route's JS is fetched (faster first paint).
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Auth/Login'))
const Signup = lazy(() => import('./pages/Auth/Signup'))
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Listing = lazy(() => import('./pages/Listing'))
const Profile = lazy(() => import('./pages/Profile'))
const Cart = lazy(() => import('./pages/Cart'))
const Wishlist = lazy(() => import('./pages/Wishlist'))
const Admin = lazy(() => import('./pages/Admin'))
const NotFound = lazy(() => import('./pages/NotFound'))
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import { ShopProvider, useShop } from './context/ShopContext'
import ProtectedRoute from './components/ProtectedRoute'
import NotificationBell from './components/NotificationBell'
import SeoManager from './components/SeoManager'
import { initSocket } from './socket'
import { BookOpen, Menu, X, Heart, ShoppingCart } from 'lucide-react'

const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
  </div>
)

function Navbar() {
  const { isLoggedIn, user } = useAuth()
  const { cartCount, wishlistCount } = useShop()
  const [mobileOpen, setMobileOpen] = useState(false)

  const badgeCls = 'absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center'

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-emerald-600">
          <BookOpen className="w-6 h-6" />
          BookSetu
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-gray-600 hover:text-emerald-600 transition-colors font-medium">Home</Link>
          <Link to="/listing" className="text-gray-600 hover:text-emerald-600 transition-colors font-medium">Sell Book</Link>
          {isLoggedIn ? (
            <>
              <Link to="/profile" className="text-gray-600 hover:text-emerald-600 transition-colors font-medium">Profile</Link>
              {user?.isAdmin && <Link to="/admin" className="text-purple-600 hover:text-purple-700 font-semibold">Admin</Link>}
            </>
          ) : (
            <Link to="/login" className="text-gray-600 hover:text-emerald-600 transition-colors font-medium">Login</Link>
          )}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link to="/wishlist" className="relative p-2 rounded-lg text-gray-600 hover:text-red-500 hover:bg-red-50 transition-colors" aria-label="Wishlist">
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && <span className={badgeCls}>{wishlistCount}</span>}
            </Link>
            <Link to="/cart" className="relative p-2 rounded-lg text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" aria-label="Cart">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && <span className={badgeCls}>{cartCount}</span>}
            </Link>
          </div>
          {!isLoggedIn && (
            <Link to="/signup" className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium">
              Sign Up
            </Link>
          )}
        </div>

        <div className="md:hidden flex items-center gap-1">
          <NotificationBell />
          <Link to="/wishlist" className="relative p-2 rounded-lg text-gray-600 hover:text-red-500 transition-colors" aria-label="Wishlist">
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && <span className={badgeCls}>{wishlistCount}</span>}
          </Link>
          <Link to="/cart" className="relative p-2 rounded-lg text-gray-600 hover:text-emerald-600 transition-colors" aria-label="Cart">
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && <span className={badgeCls}>{cartCount}</span>}
          </Link>
          <button
            className="p-2 -mr-2 text-gray-700 hover:text-emerald-600"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-white px-5 py-4 space-y-1">
          <Link to="/" className="block py-2.5 text-gray-700 hover:text-emerald-600 font-medium" onClick={() => setMobileOpen(false)}>Home</Link>
          <Link to="/listing" className="block py-2.5 text-gray-700 hover:text-emerald-600 font-medium" onClick={() => setMobileOpen(false)}>Sell Book</Link>
          <Link to="/wishlist" className="flex items-center justify-between py-2.5 text-gray-700 hover:text-emerald-600 font-medium" onClick={() => setMobileOpen(false)}>
            Wishlist
            {wishlistCount > 0 && <span className="text-xs font-bold bg-red-50 text-red-500 px-2 py-0.5 rounded-full">{wishlistCount}</span>}
          </Link>
          <Link to="/cart" className="flex items-center justify-between py-2.5 text-gray-700 hover:text-emerald-600 font-medium" onClick={() => setMobileOpen(false)}>
            Cart
            {cartCount > 0 && <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">{cartCount}</span>}
          </Link>
          {isLoggedIn ? (
            <>
              <Link to="/profile" className="block py-2.5 text-gray-700 hover:text-emerald-600 font-medium" onClick={() => setMobileOpen(false)}>Profile</Link>
              {user?.isAdmin && (
                <Link to="/admin" className="block py-2.5 text-purple-600 font-semibold" onClick={() => setMobileOpen(false)}>Admin Dashboard</Link>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className="block py-2.5 text-gray-700 hover:text-emerald-600 font-medium" onClick={() => setMobileOpen(false)}>Login</Link>
              <Link to="/signup" className="block mt-2 text-center bg-emerald-600 text-white px-4 py-3 rounded-xl font-semibold" onClick={() => setMobileOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

export default function App() {
  useEffect(() => {
    initSocket()
  }, [])

  return (
    <AuthProvider>
      <ToastProvider>
        <ShopProvider>
          <Router>
          <div className="min-h-screen bg-gray-50 text-gray-900">
            <SeoManager />
            <Navbar />
            <main>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/listing" element={<ProtectedRoute><Listing /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </Router>
        </ShopProvider>
      </ToastProvider>
    </AuthProvider>
  )
}