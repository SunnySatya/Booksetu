import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, default: '' },
  kind: { type: String, enum: ['info', 'offer', 'deal', 'admin'], default: 'info' },
  to: { type: String, default: null, index: true },
  at: { type: Date, default: Date.now },
})

notificationSchema.index({ createdAt: -1 })

const map = (n) => ({
  id: String(n._id),
  title: n.title,
  body: n.body,
  kind: n.kind,
  to: n.to,
  at: new Date(n.at).getTime(),
})
notificationSchema.statics.mapOut = (n) => map(n)

export default mongoose.model('Notification', notificationSchema)
