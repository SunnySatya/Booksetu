import { Router } from 'express'
import AppContent from '../models/AppContent.js'
import { authRequired, adminRequired } from '../middleware/auth.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const doc = await AppContent.getMain()
    res.json({
      heroImages: doc.heroImages || [],
      quotes: doc.quotes || [],
    })
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to load content' })
  }
})

router.put('/', authRequired, adminRequired, async (req, res) => {
  try {
    const doc = await AppContent.getMain()
    if (Array.isArray(req.body?.heroImages)) {
      doc.heroImages = req.body.heroImages.slice(0, 8)
    }
    if (Array.isArray(req.body?.quotes)) {
      doc.quotes = req.body.quotes
        .filter((q) => q?.text?.trim())
        .slice(0, 20)
        .map((q) => ({ text: String(q.text).trim(), author: String(q.author || '').trim() }))
    }
    await doc.save()
    req.app.get('io')?.emit('content:update')
    res.json({ heroImages: doc.heroImages, quotes: doc.quotes })
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to save content' })
  }
})

export default router
