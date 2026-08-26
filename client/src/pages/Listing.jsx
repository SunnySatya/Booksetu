import React, { useState } from 'react'
import { MapPin, Plus, Tag, LocateFixed, Phone, MessageCircle, Repeat, Camera, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useGeolocation from '../hooks/useGeolocation'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { addListing } from '../utils/listingStore'
import { addNotification } from '../utils/notificationStore'
import { fileToResizedDataUrl } from '../utils/imageResize'

const CATEGORIES = ['Textbooks', 'Competitive', 'Stories', 'Novels', 'Motivational']

const SELL_DISCOUNTS = {
  New: 50,
  'Good & Highlighted': 50,
  Good: 60,
  Fair: 70,
  'Cover Damage': 80,
  Coverless: 90,
}

const RENT_FEES = {
  New: 20,
  'Good & Highlighted': 20,
  Good: 17,
  Fair: 14,
}
const RENT_DAYS = 40

const SELL_CONDITIONS = Object.keys(SELL_DISCOUNTS)
const RENT_CONDITIONS = Object.keys(RENT_FEES)

const CLASSES = ['Class 1-5', 'Class 6-8', 'Class 9-10', 'Class 11-12', 'College', 'General']
const SUBJECTS = ['Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'Social Science', 'History', 'Geography', 'Computer', 'Other']
const MEDIUMS = ['Hindi', 'English']
const TYPES = [
  { id: 'single', icon: '📖', label: 'Single Book', sub: 'Sell one book' },
  { id: 'bundle', icon: '📦', label: 'Bundle', sub: 'Sell multiple books' },
  { id: 'rent', icon: '🔄', label: 'Rent Your Book', sub: 'Give on rent & earn' },
  { id: 'exchange', icon: '🤝', label: 'Exchange', sub: 'Free direct contact' },
]

export default function Listing() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const { status: locStatus, request } = useGeolocation()

  const [category, setCategory] = useState('')
  const [type, setType] = useState('single')
  const [title, setTitle] = useState('')
  const [medium, setMedium] = useState('')
  const [subject, setSubject] = useState('')
  const [bookClass, setBookClass] = useState('')
  const [condition, setCondition] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [bundleCount, setBundleCount] = useState(1)
  const [phone, setPhone] = useState('')
  const [whatsappSame, setWhatsappSame] = useState(true)
  const [whatsapp, setWhatsapp] = useState('')
  const [images, setImages] = useState([])
  const [photoBusy, setPhotoBusy] = useState(false)
  const [coords, setCoords] = useState(null)

  const isSell = type === 'single' || type === 'bundle'
  const isRent = type === 'rent'
  const isExchange = type === 'exchange'

  const condList = isRent ? RENT_CONDITIONS : SELL_CONDITIONS
  const sellDiscount = SELL_DISCOUNTS[condition]
  const rentFee = RENT_FEES[condition]
  const op = Number(originalPrice) > 0 ? Number(originalPrice) : null
  const sellFinalPrice = isSell && op && sellDiscount != null ? Math.round(op * (1 - sellDiscount / 100)) : null
  const rentAmount = isRent && op && rentFee != null ? Math.round((op * rentFee) / 100) : null

  const changeType = (t) => {
    setType(t)
    const allowed = t === 'rent' ? RENT_CONDITIONS : SELL_CONDITIONS
    if (t === 'exchange' || !allowed.includes(condition)) setCondition('')
  }

  const detectLocation = async () => {
    const loc = await request()
    if (loc) {
      setLocation(loc.address)
      setCoords({ lat: loc.lat, lng: loc.lng })
    }
  }

  const handleImages = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    const slots = 4 - images.length
    if (slots <= 0) {
      toast('Max 4 photos allowed', 'error')
      return
    }
    setPhotoBusy(true)
    const resized = []
    for (const f of files.slice(0, slots)) {
      try {
        resized.push(await fileToResizedDataUrl(f))
      } catch {
        toast('Failed to read one photo — try again', 'error')
      }
    }
    setImages((prev) => [...prev, ...resized])
    setPhotoBusy(false)
  }

  const removeImage = (idx) => setImages((prev) => prev.filter((_, i) => i !== idx))

  const isValidPhone = (val) => /^[6-9]\d{9}$/.test(val.replace(/\D/g, ''))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!location.trim()) {
      toast('Location is required — buyers won\'t be able to find you', 'error')
      return
    }
    if (!isValidPhone(phone)) {
      toast('Enter a valid 10-digit phone number', 'error')
      return
    }
    if (!isExchange && !condition) {
      toast('Select a condition', 'error')
      return
    }
    const wa = whatsappSame ? phone : whatsapp
    if (!whatsappSame && !isValidPhone(wa)) {
      toast('WhatsApp number must be a valid 10-digit number', 'error')
      return
    }
    if (!isExchange && !op) {
      toast('Enter original price', 'error')
      return
    }

    const listing = {
      listingType: type,
      title,
      category,
      medium: medium || null,
      subject: subject || null,
      bookClass: bookClass || null,
      condition: condition || null,
      originalPrice: op,
      price: isSell ? sellFinalPrice : isRent ? rentAmount : 0,
      description,
      location,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      contact: { phone: phone.replace(/\D/g, ''), whatsapp: wa.replace(/\D/g, '') },
      sellerName: user?.name || '',
      sellerEmail: user?.email || '',
      images,
    }
    if (isSell) listing.sellDiscount = sellDiscount
    if (isRent) {
      listing.rentFeePercent = rentFee
      listing.rentDays = RENT_DAYS
    }

    try {
      await addListing(listing)
    } catch (err) {
      toast(err.message || 'Failed to save listing — try again later', 'error')
      return
    }
    toast(`${title} listed successfully!`)
    addNotification({
      kind: 'info',
      to: user?.email || null,
      title: `"${title}" is now live`,
      body: `Your listing is visible to buyers at ${location || 'the platform'}`,
    }).catch(() => {})
    navigate('/')
  }

  const typeBtnClass = (id) =>
    `p-4 rounded-xl border-2 text-center transition-all cursor-pointer ${
      type === id ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-gray-200 hover:border-gray-300'
    }`

  const selectCls =
    'w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white'
  const inputCls =
    'w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent'

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">List Your Book</h1>
      <p className="text-gray-500 mb-8">Fill in the details to list your book</p>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-600" /> Select Category *
          </h2>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              setSubject('')
              setBookClass('')
            }}
            className={selectCls}
          >
            <option value="">Choose a category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {category && (
          <>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4">Listing Type *</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TYPES.map((t) => (
                  <button key={t.id} type="button" onClick={() => changeType(t.id)} className={typeBtnClass(t.id)}>
                    <div className="text-2xl mb-1">{t.icon}</div>
                    <p className="font-semibold text-sm">{t.label}</p>
                    <p className="text-xs text-gray-500">{t.sub}</p>
                  </button>
                ))}
              </div>
              {isExchange && (
                <div className="mt-4 flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <Repeat className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-green-800">
                    Exchange listing — buyers aapka contact <b>bina kisi payment ke</b> dekh payenge.
                  </p>
                </div>
              )}
            </div>

            {type === 'bundle' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold mb-4">Bundle Details</h2>
                <div className="space-y-3">
                  {Array.from({ length: bundleCount }).map((_, i) => (
                    <input key={i} type="text" placeholder={`Book ${i + 1} title`} onChange={(e) => {}} className={inputCls} />
                  ))}
                  <button type="button" onClick={() => setBundleCount(bundleCount + 1)} className="flex items-center gap-1 text-emerald-600 font-medium text-sm hover:underline">
                    <Plus className="w-4 h-4" /> Add another book
                  </button>
                </div>
              </div>
            )}

            {!isExchange && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold mb-4">Book Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. NCERT Mathematics Class 12" className={inputCls} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Book Medium *</label>
                    <select value={medium} onChange={(e) => setMedium(e.target.value)} className={selectCls}>
                      <option value="">Select medium</option>
                      {MEDIUMS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {category === 'Textbooks' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                        <select value={subject} onChange={(e) => setSubject(e.target.value)} className={selectCls}>
                          <option value="">Select subject</option>
                          {SUBJECTS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                        <select value={bookClass} onChange={(e) => setBookClass(e.target.value)} className={selectCls}>
                          <option value="">Select class</option>
                          {CLASSES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Condition * <span className="text-xs text-gray-400">(ascending order)</span>
                      </label>
                      <select value={condition} onChange={(e) => setCondition(e.target.value)} className={selectCls}>
                        <option value="">Select condition</option>
                        {condList.map((name) =>
                          isRent ? (
                            <option key={name} value={name}>{name} — pay {RENT_FEES[name]}% / {RENT_DAYS} days</option>
                          ) : (
                            <option key={name} value={name}>{name} — {SELL_DISCOUNTS[name]}% off</option>
                          )
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (₹) *</label>
                      <input type="number" min="1" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="MRP of the book" className={inputCls} />
                    </div>
                  </div>

                  {isSell && sellDiscount != null && op && (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold text-emerald-800">{sellDiscount}% OFF (based on condition)</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Original ₹{op} → Buyer pays <span className="font-bold text-emerald-700">₹{sellFinalPrice}</span>
                        </p>
                      </div>
                      <span className="text-2xl font-extrabold text-emerald-600">{sellDiscount}% off</span>
                    </div>
                  )}

                  {isRent && rentFee != null && op && (
                    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold text-blue-800">Rent: {rentFee}% of original price</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Renter pays <span className="font-bold text-blue-700">₹{rentAmount}</span> for {RENT_DAYS} days
                        </p>
                      </div>
                      <span className="text-xl font-extrabold text-blue-600">₹{rentAmount}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe the book condition, pages, edition..." className={`${inputCls} resize-none`} />
                  </div>
                </div>
              </div>
            )}

            {isExchange && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold mb-4">Book Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. NCERT Mathematics Class 12" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What book do you want to exchange for..." className={`${inputCls} resize-none`} />
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-1">Book Photos</h2>
              <p className="text-xs text-gray-400 mb-4">
                Upload 3-4 clear photos — front cover, back cover, and pages. Buyers trust listings with photos.
              </p>
              {photoBusy && (
                <p className="text-xs text-emerald-600 mb-3 animate-pulse">Processing photos...</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((src, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden border border-gray-200">
                    <img src={src} alt={`Photo ${i + 1}`} className="w-full aspect-square object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      aria-label={`Remove photo ${i + 1}`}
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {images.length < 4 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/40 flex flex-col items-center justify-center gap-1 cursor-pointer text-gray-400 hover:text-emerald-600 transition-colors">
                    <Camera className="w-6 h-6" />
                    <span className="text-xs font-medium">{images.length === 0 ? 'Add Photos' : 'Add More'}</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
                  </label>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-600" /> Contact Details *
              </h2>
              <p className="text-xs text-gray-400 mb-4">
                Buyer buy/exchange details shown here {isExchange ? '(instant, no payment)' : '(after payment unlock)'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={whatsappSame ? phone : whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    disabled={whatsappSame}
                    placeholder={whatsappSame ? 'Same as phone number' : 'WhatsApp number'}
                    className={`${inputCls} ${whatsappSame ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 mt-3 cursor-pointer select-none">
                <input type="checkbox" checked={whatsappSame} onChange={(e) => setWhatsappSame(e.target.checked)} className="w-4 h-4 accent-emerald-600" />
                <span className="text-sm text-gray-600">WhatsApp is same as phone number</span>
              </label>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4">Location *</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Your city or area" className={`${inputCls} pl-10`} />
                </div>
                <button
                  type="button"
                  onClick={detectLocation}
                  className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold border transition-all whitespace-nowrap ${
                    locStatus === 'granted'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  <LocateFixed className={`w-5 h-5 ${locStatus === 'loading' ? 'animate-pulse' : ''}`} />
                  {locStatus === 'granted' ? 'Location Set' : locStatus === 'loading' ? 'Detecting...' : locStatus === 'denied' ? 'Denied — Retry' : locStatus === 'unsupported' ? 'Not Supported' : 'Detect My Location'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Nearby books will be shown first to buyers</p>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="flex-1 bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors">
                List Book
              </button>
              <button type="button" onClick={() => navigate('/')} className="px-6 py-3.5 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </>
        )}

        {!category && (
          <p className="text-center text-sm text-gray-400 py-6">Select a category first — the full form will appear after</p>
        )}
      </form>
    </div>
  )
}
