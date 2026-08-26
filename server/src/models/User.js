import mongoose from 'mongoose'

const cartItemSchema = new mongoose.Schema(
  { title: String, seller: String, price: [String, Number], originalPrice: [String, Number], images: [String], condition: String, distance: String, category: String, listingType: String, sellerEmail: String },
  { _id: false },
)

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, default: '' },
    phone: { type: String, default: '' },
    city: { type: String, default: '' },
    isAdmin: { type: Boolean, default: false, index: true },
    cart: { type: [cartItemSchema], default: [] },
    wishlist: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true },
)

userSchema.methods.safe = function () {
  const { _id, name, email, phone, city, isAdmin, createdAt } = this
  return { id: String(_id), name, email, phone, city, isAdmin, joinedAt: createdAt }
}

export default mongoose.model('User', userSchema)
