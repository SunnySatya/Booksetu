import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from './models/User.js'
import Listing from './models/Listing.js'
import Notification from './models/Notification.js'
import AppContent from './models/AppContent.js'

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/booksetu'

try {
  await mongoose.connect(uri)
  console.log('[seed] connected to', uri)

  const email = 'admin@booksetu.com'
  let admin = await User.findOne({ email })
  if (!admin) {
    admin = await User.create({
      name: 'BookSetu Admin',
      email,
      passwordHash: await bcrypt.hash('admin123', 10),
      isAdmin: true,
    })
    console.log('[seed] admin created →', email, '/ admin123')
  } else {
    console.log('[seed] admin already exists →', email)
  }

  const demoEmail = 'demo@booksetu.com'
  let demo = await User.findOne({ email: demoEmail })
  if (!demo) {
    demo = await User.create({
      name: 'Demo User',
      email: demoEmail,
      passwordHash: await bcrypt.hash('demo123', 10),
      phone: '9876543210',
      city: 'Indore',
    })
    console.log('[seed] demo user created →', demoEmail, '/ demo123')
  } else {
    console.log('[seed] demo user already exists →', demoEmail)
  }

  const count = await Listing.countDocuments()
  if (count === 0) {
    const samples = [
      {
        title: 'NCERT Physics Class 12',
        category: 'Textbooks',
        listingType: 'single',
        condition: 'Good',
        originalPrice: 300,
        price: 120,
        location: 'Indore',
        sellerEmail: admin.email,
        sellerName: 'BookSetu Admin',
        description: 'Clean pages, no highlights.',
      },
      {
        title: 'Atomic Habits',
        category: 'Motivational',
        listingType: 'rent',
        condition: 'Like New',
        originalPrice: 450,
        price: 68,
        rentFeePercent: 15,
        rentDays: 40,
        location: 'Bhopal',
        sellerEmail: admin.email,
        sellerName: 'BookSetu Admin',
      },
      {
        title: 'Harry Potter Complete Set',
        category: 'Novels',
        listingType: 'bundle',
        condition: 'Good',
        originalPrice: 3500,
        price: 1200,
        location: 'Indore',
        sellerEmail: demo.email,
        sellerName: 'Demo User',
        description: 'All 7 volumes, minor wear on spines.',
      },
      {
        title: 'CBSE Maths Class 10',
        category: 'Textbooks',
        listingType: 'single',
        condition: 'New',
        originalPrice: 250,
        price: 150,
        location: 'Delhi',
        sellerEmail: admin.email,
        sellerName: 'BookSetu Admin',
      },
    ]
    await Listing.insertMany(samples)
    console.log(`[seed] ${samples.length} sample listings created`)
  } else {
    console.log(`[seed] listings already exist (${count})`)
  }

  const notifCount = await Notification.countDocuments()
  if (notifCount === 0) {
    await Notification.create({
      title: 'Welcome to BookSetu!',
      body: 'Buy and sell second-hand books easily.',
      kind: 'info',
    })
    console.log('[seed] welcome notification created')
  }

  const contentCount = await AppContent.countDocuments()
  if (contentCount === 0) {
    await AppContent.create({ key: 'main', heroImages: [], quotes: [] })
    console.log('[seed] app content document created')
  }

  await mongoose.disconnect()
  console.log('[seed] done')
} catch (err) {
  console.error('[seed] failed:', err.message)
  await mongoose.disconnect()
  process.exit(1)
}
