import mongoose from 'mongoose'

const appContentSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'main' },
  heroImages: { type: [String], default: [] },
  categoryImages: { type: Map, of: [String], default: {} },
  quotes: [
    {
      _id: false,
      text: { type: String, default: '' },
      author: { type: String, default: '' },
    },
  ],
  trendingBooks: [
    {
      _id: false,
      title: { type: String, default: '' },
      price: { type: String, default: '' },
      views: { type: String, default: '' },
      tag: { type: String, default: '' },
      rank: { type: Number, default: 0 },
    },
  ],
  mustReadBooks: [
    {
      _id: false,
      title: { type: String, default: '' },
      author: { type: String, default: '' },
      note: { type: String, default: '' },
      rating: { type: String, default: '' },
      price: { type: String, default: '' },
    },
  ],
})

appContentSchema.statics.getMain = async function () {
  let doc = await this.findOne({ key: 'main' })
  if (!doc) doc = await this.create({ key: 'main', heroImages: [], quotes: [] })
  return doc
}

export default mongoose.model('AppContent', appContentSchema)
