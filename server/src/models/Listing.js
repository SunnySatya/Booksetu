import mongoose from 'mongoose'

const listingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    category: { type: String, default: '', index: true },
    listingType: {
      type: String,
      enum: ['single', 'bundle', 'rent', 'exchange'],
      default: 'single',
      index: true,
    },
    medium: String,
    subject: String,
    bookClass: String,
    condition: String,
    originalPrice: { type: Number, min: 0 },
    price: { type: Number, default: 0, min: 0 },
    sellDiscount: Number,
    rentFeePercent: Number,
    rentDays: Number,
    description: { type: String, default: '' },
    location: { type: String, default: '', index: true },
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    contact: {
      phone: { type: String, default: '' },
      whatsapp: { type: String, default: '' },
    },
    sellerName: { type: String, default: '' },
    sellerEmail: { type: String, default: '', index: true },
    images: { type: [String], default: [] },
  },
  { timestamps: true },
)

listingSchema.index({ createdAt: -1 })
listingSchema.index({ price: 1 })
listingSchema.index({ lat: 1, lng: 1 })

const map = (l) => ({ ...l.toObject(), id: String(l._id) })
listingSchema.statics.mapOut = (l) => map(l)

export default mongoose.model('Listing', listingSchema)
