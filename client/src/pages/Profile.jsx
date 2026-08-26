import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useShop } from '../context/ShopContext'
import { useToast } from '../components/Toast'
import { getListingsBySeller } from '../utils/listingStore'
import { getAllConversations } from '../utils/chatStore'
import {
  User, Mail, Calendar, BookOpen, TrendingUp, Settings,
  LogOut, Phone, MapPin, Check, MessageCircle, ShoppingCart, ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import ContactModal from '../components/ContactModal'

const CHAT_PREFIX = 'bs_chat_'

const previewOf = (last) => {
  if (!last) return 'No messages yet'
  if (last.type === 'offer') return `Price offer: ₹${last.price}${last.status && last.status !== 'pending' ? ` (${last.status})` : ''}`
  return last.text
}

const timeOf = (at) =>
  at ? new Date(at).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''

const inputCls =
  'w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-sm'

const Profile = () => {
  const { user, logout, updateUser } = useAuth()
  const { cart } = useShop()
  const toast = useToast()

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || '',
  })
  const [saving, setSaving] = useState(false)
  const [chats, setChats] = useState([])
  const [activeListings, setActiveListings] = useState(0)
  const [chatBook, setChatBook] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    let alive = true
    getListingsBySeller(user?.email)
      .then((l) => alive && setActiveListings(l.length))
      .catch(() => {})
    getAllConversations()
      .then((c) => alive && setChats(c))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [user?.email])

  const joined = user?.joinedAt
    ? new Date(user.joinedAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'August 2026'

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSave = (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast('Name cannot be empty', 'error')
      return
    }
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, ''))) {
      toast('Enter a valid 10-digit phone number', 'error')
      return
    }
    setSaving(true)
    updateUser({
      name: form.name.trim(),
      phone: form.phone.replace(/\D/g, ''),
      city: form.city.trim(),
    })
    setTimeout(() => {
      setSaving(false)
      toast('Profile updated')
    }, 300)
  }

  const closeChat = () => {
    setChatBook(null)
    getAllConversations()
      .then(setChats)
      .catch(() => {})
  }

  const scrollTo = (id) => () =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500">Manage your account, chats and purchases</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 self-start">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-extrabold text-emerald-700">
                  {(user?.name || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 break-words">{user?.name || 'BookSetu User'}</h3>
              <p className="text-gray-500 text-sm break-words">{user?.email || 'user@example.com'}</p>
            </div>

            <div className="space-y-3">
              {user?.phone && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{user.phone}</span>
                </div>
              )}
              {user?.city && (
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{user.city}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="w-4 h-4" />
                <span className="text-sm truncate">{user?.email || 'user@example.com'}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Member since {joined}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
              {(activeListings > 0 || chats.length > 0 || cart.length > 0) && (
                <Link to="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 text-sm py-1.5 transition-colors">
                  <BookOpen className="w-4 h-4" /> Dashboard
                </Link>
              )}
              {chats.length > 0 && (
                <button onClick={scrollTo('chats')} className="w-full flex items-center gap-2 text-gray-600 hover:text-emerald-600 text-sm py-1.5 transition-colors">
                  <MessageCircle className="w-4 h-4" /> My Chats
                </button>
              )}
              {cart.length > 0 && (
                <button onClick={scrollTo('buy-books')} className="w-full flex items-center gap-2 text-gray-600 hover:text-emerald-600 text-sm py-1.5 transition-colors">
                  <ShoppingCart className="w-4 h-4" /> Buy Books
                </button>
              )}
              <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-2 text-gray-600 hover:text-emerald-600 text-sm py-1.5 transition-colors">
                <Settings className="w-4 h-4" /> Settings
              </button>
              <button onClick={logout} className="w-full flex items-center gap-2 text-red-600 hover:text-red-700 text-sm py-1.5 transition-colors">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {chats.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100" id="chats">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-bold text-gray-900">My Chats</h3>
                </div>
                <span className="text-xs text-gray-400">Live sync across tabs</span>
              </div>
              <p className="text-xs text-gray-400 mb-4">Continue price discussions with sellers here</p>

              {chats.length === 0 ? (
                <p className="text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-6 text-center">
                  No chats yet — tap "Contact" on any book to start
                </p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {chats.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setChatBook({ title: c.title, seller: c.seller })}
                      className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-emerald-50 rounded-xl transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <span className="font-bold text-emerald-700 text-sm">
                          {(c.seller || 'S').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{c.title}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          <span className="font-medium text-emerald-700">{c.seller}</span> • {previewOf(c.last)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[11px] text-gray-400">{timeOf(c.last?.at)}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{c.count ?? c.msgCount} msgs</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            )}

            {cart.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-gray-100" id="buy-books">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-bold text-gray-900">Buy Books</h3>
                </div>
                <Link to="/cart" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline">
                  Open Cart <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <p className="text-xs text-gray-400 mb-4">Books you want to buy are here</p>

              {cart.length === 0 ? (
                <p className="text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-6 text-center">
                  Cart is empty — browse books and add to cart
                </p>
              ) : (
                <div className="space-y-2">
                  {cart.slice(0, 4).map((b, i) => (
                    <div key={`${b.title}-${i}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-11 h-14 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
                        {b.images && b.images[0] ? (
                          <img src={b.images[0]} alt={b.title} className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-emerald-300" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{b.title}</p>
                        <p className="text-xs text-gray-500 truncate">by {b.seller}</p>
                      </div>
                      <span className="font-extrabold text-emerald-600 text-sm shrink-0">{b.price}</span>
                    </div>
                  ))}
                  {cart.length > 4 && (
                    <p className="text-xs text-gray-400 text-center pt-1">
                      +{cart.length - 4} more books — <Link to="/cart" className="text-emerald-600 font-semibold hover:underline">view cart</Link>
                    </p>
                  )}
                </div>
              )}
            </div>
            )}

            {showSettings && (
            <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 border border-gray-100" id="settings">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-bold text-gray-900">Personal Info</h3>
                </div>
                <button type="button" onClick={() => setShowSettings(false)} className="text-xs text-gray-400 hover:text-gray-600">Close</button>
              </div>
              <p className="text-xs text-gray-400 mb-5">These details appear on your listings</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input type="text" value={form.name} onChange={setField('name')} placeholder="Your name" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input type="tel" value={form.phone} onChange={setField('phone')} placeholder="98765 43210" className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">City / Area</label>
                  <input type="text" value={form.city} onChange={setField('city')} placeholder="jaise Indore, Bhopal" className={inputCls} />
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <span className="text-xs text-gray-400 hidden sm:block">Email is fixed for login</span>
              </div>
            </form>
            )}
          </div>
        </div>
      </div>

      {chatBook && (
        <ContactModal book={chatBook} onClose={closeChat} />
      )}
    </section>
  )
}

export default Profile
