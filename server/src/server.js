import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import http from 'http'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { Server } from 'socket.io'
import { connectDB } from './config/db.js'
import { verifySocketToken } from './middleware/auth.js'
import { rateLimit } from './middleware/rateLimit.js'
import authRoutes from './routes/auth.js'
import otpRoutes from './routes/otp.js'
import userRoutes from './routes/users.js'
import listingRoutes from './routes/listings.js'
import chatRoutes from './routes/chat.js'
import notificationRoutes from './routes/notifications.js'
import contentRoutes from './routes/content.js'
import cartRoutes from './routes/cart.js'
import wishlistRoutes from './routes/wishlist.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

const isProd = process.env.NODE_ENV === 'production'
const corsOrigin = isProd
  ? process.env.CORS_ORIGIN || process.env.RENDER_EXTERNAL_URL || '*'
  : process.env.CORS_ORIGIN || 'http://localhost:5173'
app.use(cors({ origin: corsOrigin, credentials: true }))
app.use(express.json({ limit: '12mb' }))
app.use(rateLimit({ windowMs: 60000, max: 200, message: 'Too many requests' }))

app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'BookSetu API' }))
app.use('/api/auth', authRoutes)
app.use('/api/otp', otpRoutes)
app.use('/api/users', userRoutes)
app.use('/api/listings', listingRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/content', contentRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/wishlist', wishlistRoutes)

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'API route not found' })
})

const clientDist = path.resolve(__dirname, '../../client/dist')
const hasDist = fs.existsSync(clientDist)
if (hasDist) {
  app.use(express.static(clientDist))
}
app.get('*', (_req, res) => {
  const indexPath = path.join(clientDist, 'index.html')
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(200).send('<h1>BookSetu is building... Please refresh in 1 minute.</h1>')
  }
})

app.use((err, _req, res, _next) => {
  console.error('[error]', err.stack || err.message)
  res.status(500).json({ message: 'Server error' })
})

const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: corsOrigin },
})
io.use((socket, next) => {
  const user = verifySocketToken(socket.handshake.auth?.token)
  if (!user) {
    return next(new Error('Authentication required'))
  }
  socket.data.user = user
  next()
})
io.on('connection', (socket) => {
  socket.join('site')
})

app.set('io', io)

const PORT = process.env.PORT || 5000

try {
  await connectDB()
  console.log('[server] client dist exists:', fs.existsSync(clientDist), clientDist)
  server.listen(PORT, () => {
    console.log(`[server] BookSetu API running on http://localhost:${PORT}`)
  })
} catch (err) {
  console.error('[fatal] DB connection failed:', err.message)
  process.exit(1)
}
