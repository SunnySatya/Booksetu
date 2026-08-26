import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Megaphone, Send, Trash2, ArrowLeft, BookOpen, Users as UsersIcon,
  MessageCircle, Bell, LayoutGrid, Pencil, ShieldCheck, AlertTriangle, X,
  Image as ImageIcon, Plus, RotateCcw,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import ContactModal from '../components/ContactModal'
import { fileToResizedDataUrl } from '../utils/imageResize'
import {
  DEFAULT_HERO_IMAGES,
  getCustomHeroImages,
  saveHeroImages,
  getCategoryImages,
  saveCategoryImages,
  getCustomQuotes,
  saveQuotes,
} from '../utils/contentStore'
import { quotes as defaultQuotes, categories as allCategories } from '../data/homeData'
import {
  getAllListings,
  updateListing,
  deleteListing,
} from '../utils/listingStore'
import { getUsers, deleteUserByEmailOrId, setAdminByUser } from '../utils/userStore'
import {
  getAllConversations,
  deleteConversationByKey,
  deleteAllConversations,
} from '../utils/chatStore'
import {
  getNotifications,
  addNotification,
  clearNotifications,
  deleteNotification,
} from '../utils/notificationStore'

const ADMIN_PASSWORD = 'admin123'

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'books', label: 'Books', icon: BookOpen },
  { id: 'users', label: 'Users', icon: UsersIcon },
  { id: 'chats', label: 'Chats', icon: MessageCircle },
  { id: 'notifs', label: 'Notifications', icon: Megaphone },
  { id: 'content', label: 'Slider & Quotes', icon: ImageIcon },
]

const timeAgo = (at) => {
  if (!at) return ''
  const m = Math.floor((Date.now() - at) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const StatCard = ({ icon: Icon, color, value, label }) => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100">
    <Icon className={`w-7 h-7 mb-3 ${color}`} />
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500">{label}</p>
  </div>
)

const AdminGate = ({ onSuccess }) => {
  const [pwd, setPwd] = useState('')
  const toast = useToast()
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-7 h-7 text-purple-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Admin Access</h2>
        <p className="text-xs text-gray-400 mt-1 mb-5">Demo password: admin123</p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (pwd === ADMIN_PASSWORD) onSuccess()
            else toast('Wrong password', 'error')
          }}
        >
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="Admin password"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-sm mb-3"
          />
          <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors">
            Enter Dashboard
          </button>
        </form>
      </div>
    </div>
  )
}

const Admin = () => {
  const { user, updateUser } = useAuth()
  const toast = useToast()

  const [authed, setAuthed] = useState(Boolean(user?.isAdmin))
  const [tab, setTab] = useState('overview')
  const [version, setVersion] = useState(0)
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [chatBook, setChatBook] = useState(null)
  const [notifForm, setNotifForm] = useState({ title: '', body: '', kind: 'admin' })
  const [heroImgs, setHeroImgs] = useState(null)
  const [catImgs, setCatImgs] = useState({})
  const [quoteList, setQuoteList] = useState([...defaultQuotes])
  const [newQuote, setNewQuote] = useState({ text: '', author: '' })
  const [photoBusy, setPhotoBusy] = useState(false)
  const [catPhotoBusy, setCatPhotoBusy] = useState(false)

  const refresh = () => setVersion((v) => v + 1)

  const [listings, setListings] = useState([])
  const [users, setUsersList] = useState([])
  const [chats, setChats] = useState([])
  const [notifs, setNotifs] = useState([])

  useEffect(() => {
    if (!authed) return undefined
    let alive = true
    ;(async () => {
      try {
        const [ls, us, cs, ns, hero, catImages, quotesStored] = await Promise.all([
          getAllListings(),
          getUsers(),
          getAllConversations(),
          getNotifications(),
          getCustomHeroImages(),
          getCategoryImages(),
          getCustomQuotes(),
        ])
        if (!alive) return
        setListings(ls)
        setUsersList(us)
        setChats(cs)
        setNotifs(ns)
        setHeroImgs(hero)
        setCatImgs(catImages || {})
        setQuoteList(quotesStored || [...defaultQuotes])
      } catch {}
    })()
    return () => {
      alive = false
    }
  }, [authed, version])

  let cartCount = 0
  try {
    cartCount = JSON.parse(localStorage.getItem('bs_cart') || '[]').length
  } catch {}

  const handleEditSave = async () => {
    if (!editForm.title?.trim()) {
      toast('Title cannot be empty', 'error')
      return
    }
    try {
      await updateListing(editing.id, {
        title: editForm.title.trim(),
        price: Number(editForm.price) || 0,
        originalPrice: Number(editForm.originalPrice) || null,
        description: editForm.description || '',
      })
      setEditing(null)
      refresh()
      toast('Listing updated')
    } catch (e) {
      toast(e.message || 'Update failed', 'error')
    }
  }

  const sendBroadcast = async (e) => {
    e.preventDefault()
    if (!notifForm.title.trim()) {
      toast('Enter a title', 'error')
      return
    }
    try {
      await addNotification({
        kind: notifForm.kind,
        title: notifForm.title.trim(),
        body: notifForm.body.trim(),
      })
      setNotifForm({ title: '', body: '', kind: 'admin' })
      refresh()
      toast('Notification sent to all users')
    } catch (err) {
      toast(err.message || 'Failed to send', 'error')
    }
  }

  const resetWebsite = async () => {
    if (!window.confirm('This will delete all listings, chats, and notifications. Continue?')) return
    const jobs = [deleteAllConversations(), clearNotifications()]
    for (const l of listings) await deleteListing(l.id).catch(() => {})
    await Promise.allSettled(jobs)
    refresh()
    toast('Website data reset', 'info')
  }

  const effectiveHero = heroImgs || DEFAULT_HERO_IMAGES

  const handleAddHeroPhotos = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    setPhotoBusy(true)
    const resized = []
    for (const f of files.slice(0, 8)) {
      try {
        resized.push(await fileToResizedDataUrl(f, 1000, 0.75))
      } catch {
        toast('Failed to read one image', 'error')
      }
    }
    const next = [...(heroImgs || []), ...resized].slice(0, 8)
    setHeroImgs(next.length ? next : null)
    saveHeroImages(next)
    setPhotoBusy(false)
    refresh()
    toast('Slider images updated')
  }

  const removeHeroImage = (idx) => {
    const base = heroImgs || []
    const next = base.filter((_, i) => i !== idx)
    setHeroImgs(next.length ? next : null)
    saveHeroImages(next)
    refresh()
    toast('Image removed', 'info')
  }

  const resetHeroImages = () => {
    setHeroImgs(null)
    saveHeroImages(null)
    refresh()
    toast('Default slider images restored', 'info')
  }

  const handleAddCatPhotos = async (catName, e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    setCatPhotoBusy(true)
    const resized = []
    for (const f of files.slice(0, 4)) {
      try {
        resized.push(await fileToResizedDataUrl(f, 800, 0.75))
      } catch {
        toast('Failed to read one image', 'error')
      }
    }
    const existing = catImgs[catName] || []
    const next = [...existing, ...resized].slice(0, 4)
    setCatImgs((prev) => ({ ...prev, [catName]: next }))
    await saveCategoryImages(catName, next)
    setCatPhotoBusy(false)
    toast(`${catName} images updated`)
  }

  const removeCatImage = async (catName, idx) => {
    const existing = catImgs[catName] || []
    const next = existing.filter((_, i) => i !== idx)
    const updated = { ...catImgs }
    if (next.length === 0) {
      delete updated[catName]
    } else {
      updated[catName] = next
    }
    setCatImgs(updated)
    await saveCategoryImages(catName, next)
    toast('Image removed', 'info')
  }

  const persistQuotes = (list) => {
    const clean = list.filter((q) => q.text.trim())
    setQuoteList(clean.length ? clean : [...defaultQuotes])
    saveQuotes(clean)
    refresh()
  }

  const updateQuote = (idx, field, value) => {
    const list = quoteList.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    setQuoteList(list)
  }

  const commitQuote = (list) => {
    const clean = list.filter((q) => q.text.trim())
    if (clean.length) saveQuotes(clean)
  }

  const addQuote = () => {
    if (!newQuote.text.trim()) {
      toast('Enter quote text', 'error')
      return
    }
    const list = [...quoteList.filter((q) => q.text.trim()), { text: newQuote.text.trim(), author: newQuote.author.trim() || 'Unknown' }]
    setQuoteList(list)
    saveQuotes(list)
    setNewQuote({ text: '', author: '' })
    refresh()
    toast('Quote added')
  }

  const deleteQuote = (idx) => {
    const list = quoteList.filter((_, i) => i !== idx)
    persistQuotes(list)
    toast('Quote deleted', 'info')
  }

  const resetQuotes = () => {
    setQuoteList([...defaultQuotes])
    saveQuotes(null)
    refresh()
    toast('Default quotes restored', 'info')
  }

  if (!authed) {
    return (
      <section className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
          <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:underline mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
          <AdminGate
            onSuccess={() => {
              updateUser({ isAdmin: true })
              setAuthed(true)
            }}
          />
        </div>
      </section>
    )
  }

  return (
    <section className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-1">
          <ShieldCheck className="w-7 h-7 text-purple-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
        <p className="text-gray-500 text-sm mb-6">Manage the entire website — books, users, chats and notifications</p>

        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                tab === t.id ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300'
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={BookOpen} color="text-emerald-600" value={listings.length} label="Total Listings" />
              <StatCard icon={UsersIcon} color="text-blue-600" value={users.length} label="Registered Users" />
              <StatCard icon={MessageCircle} color="text-orange-500" value={chats.length} label="Chat Threads" />
              <StatCard icon={Bell} color="text-purple-600" value={cartCount} label="Cart Items (this browser)" />
            </div>

            <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-red-700">Danger Zone</h3>
              </div>
              <p className="text-xs text-red-500/80 mb-4">All listings, chat history, and notifications will be permanently deleted.</p>
              <button type="button" onClick={resetWebsite} className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">
                <Trash2 className="w-4 h-4" /> Reset Website Data
              </button>
            </div>
          </div>
        )}

        {tab === 'books' && (
          <div className="space-y-3" key={version}>
            {listings.length === 0 && (
              <p className="text-sm text-gray-400 bg-white border border-gray-100 rounded-xl px-4 py-6 text-center">
                No listings yet
              </p>
            )}
            {listings.map((l) => (
              <div key={l.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                <div className="w-12 h-14 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
                  {l.images && l.images[0] ? (
                    <img src={l.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-5 h-5 text-emerald-300" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{l.title}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {l.sellerName || l.sellerEmail || 'Unknown'} • {l.category || '—'} • {l.listingType}
                    {l.condition ? ` • ${l.condition}` : ''}
                  </p>
                </div>
                <span className="font-extrabold text-emerald-600 text-sm shrink-0">{l.listingType === 'exchange' ? 'Free' : `₹${l.price ?? 0}`}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    aria-label="Edit listing"
                    onClick={() => {
                      setEditing(l)
                      setEditForm({
                        title: l.title,
                        price: l.price ?? '',
                        originalPrice: l.originalPrice ?? '',
                        description: l.description || '',
                      })
                    }}
                    className="w-8 h-8 rounded-lg hover:bg-blue-50 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete listing"
                    onClick={async () => {
                      if (!window.confirm(`Delete "${l.title}"?`)) return
                      try {
                        await deleteListing(l.id)
                        refresh()
                        toast('Listing deleted', 'info')
                      } catch (e) {
                        toast(e.message || 'Delete failed', 'error')
                      }
                    }}
                    className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'users' && (
          <div className="space-y-3" key={version}>
            {users.length === 0 && (
              <p className="text-sm text-gray-400 bg-white border border-gray-100 rounded-xl px-4 py-6 text-center">
                No registered users yet — they'll appear after login/signup
              </p>
            )}
            {users.map((u) => (
              <div key={u.email} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <span className="font-bold text-emerald-700 text-sm">{(u.name || u.email || 'U').charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {u.name || 'No name'}{' '}
                    {u.isAdmin && <span className="text-[10px] font-bold uppercase bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full ml-1">admin</span>}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{u.email}{u.phone ? ` • ${u.phone}` : ''}{u.city ? ` • ${u.city}` : ''}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await setAdminByUser(u.id, !u.isAdmin)
                        if (user?.email === u.email) updateUser({ isAdmin: !u.isAdmin })
                        refresh()
                        toast(u.isAdmin ? 'Admin removed' : 'Admin granted', 'info')
                      } catch (e) {
                        toast(e.message || 'Action failed', 'error')
                      }
                    }}
                    className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                      u.isAdmin ? 'bg-purple-50 text-purple-600 hover:bg-purple-100' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {u.isAdmin ? 'Remove Admin' : 'Make Admin'}
                  </button>
                  <button
                    type="button"
                    aria-label="Delete user"
                    onClick={async () => {
                      if (!window.confirm(`Delete ${u.email}?`)) return
                      try {
                        await deleteUserByEmailOrId(u.id)
                        if (user?.email === u.email) updateUser({ isAdmin: false })
                        refresh()
                        toast('User deleted', 'info')
                      } catch (e) {
                        toast(e.message || 'Delete failed', 'error')
                      }
                    }}
                    className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'chats' && (
          <div className="space-y-3">
            {chats.length > 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('Delete all chat history?')) {
                      try {
                        await deleteAllConversations()
                        refresh()
                        toast('All chats deleted', 'info')
                      } catch (e) {
                        toast(e.message || 'Delete failed', 'error')
                      }
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 bg-red-50 px-3 py-1.5 rounded-full transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear All Chats
                </button>
              </div>
            )}
            {chats.length === 0 && (
              <p className="text-sm text-gray-400 bg-white border border-gray-100 rounded-xl px-4 py-6 text-center">
                No chats yet
              </p>
            )}
            {chats.map((c) => (
              <div key={c.key} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <span className="font-bold text-emerald-700 text-sm">{(c.seller || 'S').charAt(0).toUpperCase()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{c.title}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {c.seller} • {c.count} msgs • last: {timeAgo(c.last?.at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setChatBook({ title: c.title, seller: c.seller })}
                  className="shrink-0 text-[11px] font-semibold text-emerald-600 hover:underline mr-1"
                >
                  View
                </button>
                <button
                  type="button"
                  aria-label="Delete conversation"
                  onClick={async () => {
                    if (!window.confirm('Delete this conversation?')) return
                    try {
                      await deleteConversationByKey(c.key)
                      refresh()
                      toast('Chat deleted', 'info')
                    } catch (e) {
                      toast(e.message || 'Delete failed', 'error')
                    }
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'notifs' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
            <div className="space-y-2">
              {notifs.length === 0 && (
                <p className="text-sm text-gray-400 bg-white border border-gray-100 rounded-xl px-4 py-6 text-center">
                  No notifications
                </p>
              )}
              {notifs.map((n) => (
                <div key={n.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{n.title}</p>
                      <span className={`shrink-0 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${n.kind === 'admin' ? 'bg-purple-50 text-purple-600' : n.kind === 'offer' ? 'bg-amber-50 text-amber-600' : n.kind === 'deal' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                        {n.kind}
                      </span>
                    </div>
                    {n.body && <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>}
                    <p className="text-[11px] text-gray-400 mt-1">{timeAgo(n.at)}</p>
                  </div>
                  <button
                    type="button"
                    aria-label="Delete notification"
                    onClick={async () => {
                      try {
                        await deleteNotification(n.id)
                        refresh()
                      } catch {}
                    }}
                    className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={sendBroadcast} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 lg:sticky lg:top-24">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-purple-600" /> New Broadcast
              </h3>
              <input
                type="text"
                value={notifForm.title}
                onChange={(e) => setNotifForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Title *"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
              />
              <textarea
                rows={3}
                value={notifForm.body}
                onChange={(e) => setNotifForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Message..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-white text-sm"
              />
              <select
                value={notifForm.kind}
                onChange={(e) => setNotifForm((f) => ({ ...f, kind: e.target.value }))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
              >
                <option value="admin">Broadcast</option>
                <option value="info">Info</option>
              </select>
              <button type="submit" className="w-full inline-flex items-center justify-center gap-2 bg-purple-600 text-white py-2.5 rounded-xl font-bold hover:bg-purple-700 transition-colors text-sm">
                <Send className="w-4 h-4" /> Send to Everyone
              </button>
            </form>
          </div>
        )}
      </div>

        {tab === 'content' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-bold text-gray-900">Hero Slider Images</h3>
                </div>
                {heroImgs && (
                  <button
                    type="button"
                    onClick={resetHeroImages}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:underline"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset to Default
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Max 8 images. These rotate in the hero slider (every 3 seconds).
                {!heroImgs && ' Default images are currently showing — uploading will replace them.'}
              </p>
              {photoBusy && (
                <p className="text-xs text-emerald-600 mb-3 animate-pulse">Processing photos...</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {effectiveHero.map((src, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden ring-1 ring-gray-200 group">
                    <img src={src} alt={`Slide ${i + 1}`} className="w-full aspect-square object-cover" />
                    {!heroImgs && (
                      <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">default</span>
                    )}
                    {heroImgs && (
                      <button
                        type="button"
                        onClick={() => removeHeroImage(i)}
                        aria-label={`Remove slide ${i + 1}`}
                        className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {(heroImgs || DEFAULT_HERO_IMAGES).length < 8 && heroImgs && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/40 flex flex-col items-center justify-center gap-1 cursor-pointer text-gray-400 hover:text-emerald-600 transition-colors">
                    <Plus className="w-6 h-6" />
                    <span className="text-xs font-medium">Add</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleAddHeroPhotos} />
                  </label>
                )}
              </div>
              {!heroImgs && (
                <button
                  type="button"
                  onClick={handleAddHeroPhotos}
                  disabled
                  className="hidden"
                ></button>
              )}
              <label className={`inline-flex items-center gap-2 mt-4 ${photoBusy ? 'pointer-events-none opacity-60' : 'cursor-pointer'} text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 rounded-xl transition-colors`}>
                <Plus className="w-4 h-4" /> Upload Images
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleAddHeroPhotos} />
              </label>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-1">
                <LayoutGrid className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-gray-900">Category Images</h3>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Upload up to 4 images per category. These show in the category slider on the home page.
              </p>
              {catPhotoBusy && (
                <p className="text-xs text-emerald-600 mb-3 animate-pulse">Processing photos...</p>
              )}
              <div className="space-y-5">
                {allCategories.map((cat) => {
                  const imgs = catImgs[cat.name] || []
                  return (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-gray-700">{cat.name}</h4>
                        <span className="text-xs text-gray-400">{imgs.length}/4 images</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {imgs.map((src, i) => (
                          <div key={i} className="relative rounded-xl overflow-hidden ring-1 ring-gray-200 group">
                            <img src={src} alt={`${cat.name} ${i + 1}`} className="w-full aspect-square object-cover" />
                            <button
                              type="button"
                              onClick={() => removeCatImage(cat.name, i)}
                              aria-label={`Remove ${cat.name} image ${i + 1}`}
                              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {imgs.length < 4 && (
                          <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/40 flex flex-col items-center justify-center gap-1 cursor-pointer text-gray-400 hover:text-emerald-600 transition-colors">
                            <Plus className="w-6 h-6" />
                            <span className="text-xs font-medium">Add</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => handleAddCatPhotos(cat.name, e)}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-bold text-gray-900">Quotes</h3>
                </div>
                <button
                  type="button"
                  onClick={resetQuotes}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:underline"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset to Default
                </button>
              </div>
              <p className="text-xs text-gray-400 mb-4">Rotating quotes in the hero section — edit, add, or delete them.</p>

              <div className="space-y-2">
                {quoteList.map((q, i) => (
                  <div key={i} className="flex items-start gap-2 bg-gray-50 rounded-xl p-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <input
                        type="text"
                        value={q.text}
                        onChange={(e) => updateQuote(i, 'text', e.target.value)}
                        onBlur={() => commitQuote(quoteList)}
                        placeholder="Quote text..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
                      />
                      <input
                        type="text"
                        value={q.author}
                        onChange={(e) => updateQuote(i, 'author', e.target.value)}
                        onBlur={() => commitQuote(quoteList)}
                        placeholder="Author..."
                        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-xs text-gray-600"
                      />
                    </div>
                    <button
                      type="button"
                      aria-label={`Delete quote ${i + 1}`}
                      onClick={() => deleteQuote(i)}
                      className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors shrink-0 mt-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <input
                  type="text"
                  value={newQuote.text}
                  onChange={(e) => setNewQuote((q) => ({ ...q, text: e.target.value }))}
                  placeholder="New quote text..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newQuote.author}
                    onChange={(e) => setNewQuote((q) => ({ ...q, author: e.target.value }))}
                    placeholder="Author"
                    className="flex-1 min-w-0 px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={addQuote}
                    className="shrink-0 inline-flex items-center gap-1.5 bg-emerald-600 text-white px-4 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {editing && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Edit Listing</h3>
              <button type="button" onClick={() => setEditing(null)} aria-label="Close" className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
                <input type="text" value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Price (₹)</label>
                  <input type="number" min="0" value={editForm.price} onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Original MRP (₹)</label>
                  <input type="number" min="0" value={editForm.originalPrice} onChange={(e) => setEditForm((f) => ({ ...f, originalPrice: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea rows={3} value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-white text-sm" />
              </div>
              <button type="button" onClick={handleEditSave} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors text-sm">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {chatBook && <ContactModal book={chatBook} onClose={() => setChatBook(null)} />}
    </section>
  )
}

export default Admin
