import 'dotenv/config'
import fs from 'fs'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from '../src/models/User.js'
import Listing from '../src/models/Listing.js'
import Notification from '../src/models/Notification.js'
import PushSubscription from '../src/models/PushSubscription.js'
import { signToken } from '../src/middleware/auth.js'

const uri = process.env.QA_MONGO_URI
if (!uri) {
  console.error('QA_MONGO_URI not set')
  process.exit(1)
}

const makeUser = async (tag, { isAdmin = false, city = '' } = {}) => {
  const email = `qa-test-${tag}@test.booksetu`
  const name = `QA ${tag}`
  const passwordHash = await bcrypt.hash('pass1234', 10)
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { name, passwordHash, isAdmin, city } },
    { upsert: true, new: true },
  )
  return { id: String(user._id), email, token: signToken(user) }
}

export async function seed() {
  await mongoose.connect(uri, { connectTimeoutMS: 15000 })

  const tag = { $regex: '^qa-test-' }
  await User.deleteMany({ email: tag })
  await Listing.deleteMany({ sellerEmail: tag })
  await Notification.deleteMany({ to: tag })
  await PushSubscription.deleteMany({ email: tag })

  const sellerA = await makeUser('sellerA', { city: 'delhi' })
  const sellerB = await makeUser('sellerB', { city: 'delhi' })
  const buyer = await makeUser('buyer')
  const admin = await makeUser('admin', { isAdmin: true })

  const coords = {
    delhi: { lat: 28.6139, lng: 77.209 },
    mumbai: { lat: 19.076, lng: 72.8777 },
  }
  const mkListing = async (title, sellerEmail, sellerName, city) => {
    const l = await Listing.create({
      title,
      sellerEmail,
      sellerName,
      location: city,
      lat: coords[city].lat,
      lng: coords[city].lng,
      category: 'Novel',
      listingType: 'single',
      price: 299,
    })
    return { id: String(l._id), title, sellerEmail, city }
  }

  const delhi = await mkListing('QA Book Near User', sellerA.email, 'QA SellerA', 'delhi')
  const mumbai = await mkListing('QA Book Far Away', sellerB.email, 'QA SellerB', 'mumbai')

  const out = {
    users: { sellerA, sellerB, buyer, admin },
    listings: { delhi, mumbai },
  }
  fs.writeFileSync(new URL('./qa-context.json', import.meta.url), JSON.stringify(out, null, 2))
  console.log('[qa] seeded:', JSON.stringify(out.users.admin.email))
  await mongoose.disconnect()
}

export async function teardown() {
  await mongoose.connect(uri, { connectTimeoutMS: 15000 })
  const tag = { $regex: '^qa-test-' }
  await User.deleteMany({ email: tag })
  await Listing.deleteMany({ sellerEmail: tag })
  await Notification.deleteMany({ to: tag })
  await PushSubscription.deleteMany({ email: tag })
  await mongoose.disconnect()
}
