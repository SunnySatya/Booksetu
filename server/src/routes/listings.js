import { Router } from 'express'
import Listing from '../models/Listing.js'
import User from '../models/User.js'
import Notification from '../models/Notification.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()

function haversineKm(a, b) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

const norm = (s = '') =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim()

async function notifyNearbyUsers(app, listing) {
  try {
    const area = norm(listing.location)
    if (!area) return
    const users = await User.find({ city: { $ne: '' } }).select('email city name').lean()
    const matched = users.filter((u) => norm(u.city) === area)
    if (matched.length === 0) return
    const priceLabel =
      listing.listingType === 'exchange'
        ? 'Free'
        : listing.listingType === 'rent'
          ? `₹${listing.price ?? 0}/rent`
          : `₹${listing.price ?? 0}`
    await Notification.insertMany(
      matched.map((u) => ({
        title: 'New book in your area!',
        body: `"${listing.title}" is now available in ${listing.location} for ${priceLabel}.`,
        kind: 'info',
        to: u.email,
      })),
    )
    app?.get('io')?.emit('notification:new')
  } catch {}
}

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 300, 500)
    const skip = Math.max(Number(req.query.skip) || 0, 0)
    const userLat = Number(req.query.lat)
    const userLng = Number(req.query.lng)
    const hasCoords = Number.isFinite(userLat) && Number.isFinite(userLng)

    const listings = await Listing.find().sort({ createdAt: -1 }).skip(skip).limit(limit)
    const total = await Listing.countDocuments()

    const mapped = listings.map((l) => {
      const obj = Listing.mapOut(l)
      if (hasCoords && Number.isFinite(l.lat) && Number.isFinite(l.lng)) {
        obj.distance = haversineKm({ lat: userLat, lng: userLng }, { lat: l.lat, lng: l.lng })
      } else {
        obj.distance = null
      }
      return obj
    })

    if (hasCoords) {
      mapped.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0
        if (a.distance === null) return 1
        if (b.distance === null) return -1
        return a.distance - b.distance
      })
    }

    res.json({ listings: mapped, total })
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to load listings' })
  }
})

router.get('/mine', authRequired, async (req, res) => {
  try {
    const listings = await Listing.find({ sellerEmail: req.user.email }).sort({
      createdAt: -1,
    })
    res.json(listings.map(Listing.mapOut))
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to load your listings' })
  }
})

router.post('/', authRequired, async (req, res) => {
  try {
    const body = req.body || {}
    if (!body.title) return res.status(400).json({ message: 'Title is required' })
    const listing = await Listing.create({
      ...body,
      sellerEmail: req.user.email,
      sellerName: body.sellerName || req.user.name || 'BookSetu Seller',
      images: Array.isArray(body.images) ? body.images.slice(0, 4) : [],
      lat: body.lat != null ? Number(body.lat) : null,
      lng: body.lng != null ? Number(body.lng) : null,
    })
    notifyNearbyUsers(req.app, listing)
    res.status(201).json(Listing.mapOut(listing))
  } catch (e) {
    res.status(400).json({ message: e.message || 'Failed to save listing' })
  }
})

router.patch('/:id', authRequired, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
    if (!listing) return res.status(404).json({ message: 'Listing not found' })
    const isOwner =
      listing.sellerEmail && listing.sellerEmail === req.user.email
    if (!isOwner && !req.user.isAdmin)
      return res.status(403).json({ message: 'Permission denied' })
    const allowed = [
      'title', 'price', 'originalPrice', 'description', 'category',
      'condition', 'location', 'listingType', 'medium', 'subject',
      'bookClass', 'sellDiscount', 'rentFeePercent', 'rentDays', 'contact',
    ]
    for (const k of allowed) {
      if (req.body?.[k] !== undefined) listing[k] = req.body[k]
    }
    if (req.body?.images !== undefined && Array.isArray(req.body.images)) {
      listing.images = req.body.images.slice(0, 4)
    }
    if (req.body?.lat !== undefined) listing.lat = Number(req.body.lat) || null
    if (req.body?.lng !== undefined) listing.lng = Number(req.body.lng) || null
    await listing.save()
    res.json(Listing.mapOut(listing))
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to update listing' })
  }
})

router.delete('/:id', authRequired, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
    if (!listing) return res.json({ ok: true })
    if (!(req.user.isAdmin || listing.sellerEmail === req.user.email))
      return res.status(403).json({ message: 'Permission denied' })
    await listing.deleteOne()
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to delete listing' })
  }
})

export default router
