import { Router } from 'express'
import Message from '../models/Message.js'
import Listing from '../models/Listing.js'
import { authRequired, adminRequired } from '../middleware/auth.js'

const router = Router()

router.get('/conversations', authRequired, async (_req, res) => {
  try {
    const msgs = await Message.find().sort({ at: 1 }).limit(2000)
    const map = new Map()
    for (const m of msgs) {
      const existing = map.get(m.conversationId)
      map.set(m.conversationId, {
        conversationId: m.conversationId,
        title: m.bookTitle,
        seller: m.seller,
        sellerEmail: m.sellerEmail || existing?.sellerEmail || '',
        count: (existing?.count || 0) + 1,
        last: Message.mapOut(m),
      })
    }

    const conversations = [...map.values()].sort((a, b) => b.last.at - a.last.at)

    // Backfill sellerEmail from Listing model for old conversations
    const missing = conversations.filter((c) => !c.sellerEmail)
    if (missing.length > 0) {
      await Promise.all(
        missing.map(async (conv) => {
          try {
            const listing = await Listing.findOne({
              title: conv.title,
              sellerName: conv.seller,
            }).select('sellerEmail')
            if (listing?.sellerEmail) {
              conv.sellerEmail = listing.sellerEmail
              // Also update existing messages in this conversation
              await Message.updateMany(
                { conversationId: conv.conversationId, sellerEmail: '' },
                { $set: { sellerEmail: listing.sellerEmail } },
              )
            }
          } catch {}
        }),
      )
    }

    res.json(conversations)
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to load conversations' })
  }
})

router.get('/messages', authRequired, async (req, res) => {
  try {
    const { conversationId } = req.query
    if (!conversationId) return res.status(400).json({ message: 'conversationId required' })
    const msgs = await Message.find({ conversationId }).sort({ at: 1 }).limit(500)
    res.json(msgs.map(Message.mapOut))
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to load messages' })
  }
})

router.post('/messages', authRequired, async (req, res) => {
  try {
    const { conversationId, bookTitle, seller, sellerEmail, senderEmail, from, type, text, price } = req.body || {}
    if (!conversationId || !from)
      return res.status(400).json({ message: 'conversationId/from required' })
    if (type === 'offer' && !(Number(price) > 0))
      return res.status(400).json({ message: 'Enter a valid offer price' })
    const msg = await Message.create({
      conversationId,
      bookTitle: bookTitle || '',
      seller: seller || '',
      sellerEmail: sellerEmail || '',
      senderEmail: senderEmail || req.user?.email || '',
      from,
      type: type === 'offer' ? 'offer' : 'text',
      text: text || '',
      price: type === 'offer' ? Number(price) : undefined,
      status: type === 'offer' ? 'pending' : null,
    })
    req.app.get('io')?.emit('chat:update')
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
    const msg = await Message.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    )
    if (!msg) return res.status(404).json({ message: 'Message not found' })
    req.app.get('io')?.emit('chat:update')
    res.json(Message.mapOut(msg))
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to update status' })
  }
})

router.delete('/conversation', authRequired, async (req, res) => {
  try {
    const { key } = req.query
    if (!key) return res.status(400).json({ message: 'key required' })
    await Message.deleteMany({ conversationId: key })
    req.app.get('io')?.emit('chat:update')
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to delete conversation' })
  }
})

router.delete('/conversations/all', adminRequired, async (_req, res) => {
  try {
    await Message.deleteMany({})
    _req.app.get('io')?.emit('chat:update')
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to delete conversations' })
  }
})

export default router
