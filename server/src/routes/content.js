import { Router } from 'express'
import AppContent from '../models/AppContent.js'
import { authRequired, adminRequired } from '../middleware/auth.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const doc = await AppContent.getMain()
    const catImgs = {}
    if (doc.categoryImages && doc.categoryImages.size) {
      doc.categoryImages.forEach((val, key) => {
        catImgs[key] = val
      })
    }
    res.json({
      heroImages: doc.heroImages || [],
      categoryImages: catImgs,
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
    if (req.body?.categoryImages && typeof req.body.categoryImages === 'object') {
      const catMap = new Map()
      for (const [cat, imgs] of Object.entries(req.body.categoryImages)) {
        if (Array.isArray(imgs) && imgs.length > 0) {
          catMap.set(cat, imgs.slice(0, 4))
        }
      }
      doc.categoryImages = catMap
    }
    if (Array.isArray(req.body?.quotes)) {
      doc.quotes = req.body.quotes
        .filter((q) => q?.text?.trim())
        .slice(0, 20)
        .map((q) => ({ text: String(q.text).trim(), author: String(q.author || '').trim() }))
    }
    await doc.save()
    req.app.get('io')?.emit('content:update')
    const catImgs = {}
    if (doc.categoryImages && doc.categoryImages.size) {
      doc.categoryImages.forEach((val, key) => {
        catImgs[key] = val
      })
    }
    res.json({ heroImages: doc.heroImages, categoryImages: catImgs, quotes: doc.quotes })
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to save content' })
  }
})

export default router
