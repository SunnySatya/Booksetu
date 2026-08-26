const windows = new Map()

export function rateLimit({ windowMs = 60000, max = 5, message = 'Too many requests' } = {}) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.route?.path || req.path}`
    const now = Date.now()

    if (!windows.has(key)) {
      windows.set(key, [])
    }

    const timestamps = windows.get(key).filter((t) => now - t < windowMs)
    windows.set(key, timestamps)

    if (timestamps.length >= max) {
      const retryAfter = Math.ceil((timestamps[0] + windowMs - now) / 1000)
      res.setHeader('Retry-After', retryAfter)
      return res.status(429).json({ message })
    }

    timestamps.push(now)
    next()
  }
}

setInterval(() => {
  const now = Date.now()
  for (const [key, timestamps] of windows) {
    const active = timestamps.filter((t) => now - t < 120000)
    if (active.length === 0) {
      windows.delete(key)
    } else {
      windows.set(key, active)
    }
  }
}, 60000)
