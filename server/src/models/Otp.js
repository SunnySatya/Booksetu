import mongoose from 'mongoose'

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['registration', 'password-reset'],
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
)

otpSchema.index({ email: 1, purpose: 1, createdAt: -1 })

otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 })

export default mongoose.model('Otp', otpSchema)
