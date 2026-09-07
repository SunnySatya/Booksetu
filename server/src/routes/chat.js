import { Router } from 'express'
import Message from '../models/Message.js'
import Notification from '../models/Notification.js'
import { authRequired, adminRequired } from '../middleware/auth.js'

const router = Router()

const emitToParticipants = (app, emails) => {
  const io = app.get('io')
  if (!io) return
  const rooms = emails.filter(Boolean).map((e) => `user:${String(e).toLowerCase()}`)
  io.to(rooms).emit('chat:update')
}

const notifyUser = async (app, email, data) => {
  if (!email) return
  try {
    await Notification.create({ kind: data.kind || 'info', title: data.title, body: data.body || '', to: email })
    const io = app?.get('io')
    if (io) io.to(`user:${String(email).toLowerCase()}`).emit('notification:new')
  } catch {}
}

const escapeRegExp = (str) =>
  String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const isParticipant = async (conversationId, email) => {
  const e = String(email || '').toLowerCase()
  if (!e) return false
  const count = await Message.countDocuments({
    conversationId,
    $or: [
      { sellerEmail: { $regex: `^${escapeRegExp(e)}$`, $options: 'i' } },
      { senderEmail: { $regex: `^${escapeRegExp(e)}$`, $options: 'i' } },
    ],
  })
  return count > 0
}

router.get('/conversations', authRequired, async (req, res) => {
  try {
    const email = String(req.user?.email || '').toLowerCase()
    const msgs = await Message.find({
      $or: [
        { sellerEmail: { $regex: `^${escapeRegExp(email)}$`, $options: 'i' } },
        { senderEmail: { $regex: `^${escapeRegExp(email)}$`, $options: 'i' } },
      ],
    })
      .sort({ at: 1 })
      .limit(2000)
    const map = new Map()
    for (const m of msgs) {
      const existing = map.get(m.conversationId)
      map.set(m.conversationId, {
        conversationId: m.conversationId,
        title: m.bookTitle,
        seller: m.seller,
        sellerEmail: m.sellerEmail || existing?.sellerEmail || '',
        buyerEmail: existing?.buyerEmail || m.senderEmail || '',
        count: (existing?.count || 0) + 1,
        last: Message.mapOut(m),
      })
    }

    const conversations = [...map.values()].sort((a, b) => b.last.at - a.last.at)
    res.json(conversations)
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to load conversations' })
  }
})

router.get('/messages', authRequired, async (req, res) => {
  try {
    const { conversationId } = req.query
    if (!conversationId) return res.status(400).json({ message: 'conversationId required' })
    if (!(await isParticipant(conversationId, req.user.email))) {
      return res.status(403).json({ message: 'You are not part of this conversation' })
    }
    const msgs = await Message.find({ conversationId }).sort({ at: 1 }).limit(500)
    res.json(msgs.map(Message.mapOut))
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to load messages' })
  }
})

router.post('/messages', authRequired, async (req, res) => {
  try {
    const {
      conversationId,
      bookTitle,
      seller,
      sellerEmail,
      from,
      type,
      text,
      price,
    } = req.body || {}
    if (!conversationId || !from)
      return res.status(400).json({ message: 'conversationId/from required' })
    if (type === 'offer' && !(Number(price) > 0))
      return res.status(400).json({ message: 'Enter a valid offer price' })

    const senderEmail = String(req.user?.email || '')

    // A conversation is only visible between its two participants; the
    // authenticated user must be one of them (seller or buyer).
    const existing = await Message.findOne({ conversationId }).sort({ at: 1 }).lean()
    if (
      existing &&
      ![existing.sellerEmail, existing.senderEmail]
        .filter(Boolean)
        .some((e) => String(e).toLowerCase() === senderEmail.toLowerCase())
    ) {
      return res.status(403).json({ message: 'You are not part of this conversation' })
    }

    // Never trust the client for identity — senderEmail always comes from
    // the authenticated user.
    const effectiveSellerEmail = existing?.sellerEmail
      ? existing.sellerEmail
      : String(sellerEmail || '')

    const msg = await Message.create({
      conversationId,
      bookTitle: bookTitle || existing?.bookTitle || '',
      seller: seller || existing?.seller || '',
      sellerEmail: effectiveSellerEmail,
      senderEmail,
      from,
      type: type === 'offer' ? 'offer' : 'text',
      text: text || '',
      price: type === 'offer' ? Number(price) : undefined,
      status: type === 'offer' ? 'pending' : null,
    })
    emitToParticipants(req.app, [effectiveSellerEmail, senderEmail])
    if (msg.type === 'offer') {
      const buyerEmail = existing?.senderEmail || senderEmail
      const target = from === 'buyer' ? effectiveSellerEmail : buyerEmail
      await notifyUser(req.app, target, {
        kind: 'offer',
        title: `Price Offer: ₹${msg.price}`,
        body: `"${msg.bookTitle}" — ${from === 'buyer' ? 'a buyer made an offer' : 'the seller replied with an offer'}`,
      })
    }
    res.status(201).json(Message.mapOut(msg))
  } catch (e) {
    res.status(400).json({ message: e.message || 'Failed to save message' })
  }
})

router.patch('/messages/:id/status', authRequired, async (req, res) => {
  try {
    const status = req.body?.status
    if (!['accepted', 'declined'].includes(status))
      return res.status(400).json({ message: 'Invalid status' })
    const msg = await Message.findById(req.params.id)
    if (!msg) return res.status(404).json({ message: 'Message not found' })
    if (!(await isParticipant(msg.conversationId, req.user.email))) {
      return res.status(403).json({ message: 'You are not part of this conversation' })
    }
    msg.status = status
    await msg.save()
    emitToParticipants(req.app, [msg.sellerEmail, msg.senderEmail])
    if (msg.type === 'offer') {
      await notifyUser(req.app, msg.senderEmail, {
        kind: status === 'accepted' ? 'deal' : 'info',
        title: status === 'accepted' ? `Deal Fix: ₹${msg.price}` : 'Offer Declined',
        body:
          status === 'accepted'
            ? `"${msg.bookTitle}" — offer accepted, plan pickup with the seller`
            : `"${msg.bookTitle}" — offer declined, continue negotiation`,
      })
    }
    res.json(Message.mapOut(msg))
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to update status' })
  }
})

router.delete('/conversation', authRequired, async (req, res) => {
  try {
    const { key } = req.query
    if (!key) return res.status(400).json({ message: 'key required' })
    const msg = await Message.findOne({ conversationId: key }).lean()
    if (msg && !(await isParticipant(key, req.user.email))) {
      return res.status(403).json({ message: 'You are not part of this conversation' })
    }
    await Message.deleteMany({ conversationId: key })
    if (msg) emitToParticipants(req.app, [msg.sellerEmail, msg.senderEmail])
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to delete conversation' })
  }
})

router.delete('/conversations/all', adminRequired, async (_req, res) => {
  try {
    await Message.deleteMany({})
    _req.app.get('io')?.to('site').emit('chat:update')
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to delete conversations' })
  }
})

export default router
