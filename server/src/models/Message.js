import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, index: true },
  bookTitle: { type: String, default: '' },
  seller: { type: String, default: '' },
  sellerEmail: { type: String, default: '' },
  senderEmail: { type: String, default: '' },
  from: { type: String, enum: ['buyer', 'seller'], required: true },
  type: { type: String, enum: ['text', 'offer'], default: 'text' },
  text: { type: String, default: '' },
  price: Number,
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: null,
  },
  at: { type: Date, default: Date.now },
})

messageSchema.index({ conversationId: 1, at: 1 })

const map = (m) => {
  const out = m.toObject()
  return {
    id: String(m._id),
    conversationId: m.conversationId,
    from: m.from,
    sellerEmail: m.sellerEmail || '',
    senderEmail: m.senderEmail || '',
    type: m.type,
    text: m.text,
    price: m.price,
    status: m.status ?? null,
    at: new Date(m.at).getTime(),
  }
}
messageSchema.statics.mapOut = (m) => map(m)

export default mongoose.model('Message', messageSchema)
