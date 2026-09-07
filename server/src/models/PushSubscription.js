import mongoose from 'mongoose'

const pushSubscriptionSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    p256dh: { type: String, default: '' },
    auth: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true },
)

pushSubscriptionSchema.index({ email: 1, updatedAt: -1 })

export default mongoose.model('PushSubscription', pushSubscriptionSchema)
