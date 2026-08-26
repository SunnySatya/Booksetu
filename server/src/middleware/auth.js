import jwt from 'jsonwebtoken'

const SECRET = () => {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET environment variable is required')
  return s
}

export const signToken = (user) =>
  jwt.sign(
    { sub: String(user._id), email: user.email, isAdmin: !!user.isAdmin },
    SECRET(),
    { expiresIn: '30d' },
  )

export const authRequired = (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Login required' })
  try {
    req.user = jwt.verify(token, SECRET())
    next()
  } catch {
    return res.status(401).json({ message: 'Session expired — please log in again' })
  }
}

export const attachUser = (req, _res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (token) {
    try {
      req.user = jwt.verify(token, SECRET())
    } catch {}
  }
  next()
}

export const adminRequired = (req, res, next) => {
  if (!req.user?.isAdmin) return res.status(403).json({ message: 'Admin access required' })
  next()
}

export const verifySocketToken = (token) => {
  try {
    return jwt.verify(token || '', SECRET())
  } catch {
    return null
  }
}
