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
})

appContentSchema.statics.getMain = async function () {
  let doc = await this.findOne({ key: 'main' })
  if (!doc) doc = await this.create({ key: 'main', heroImages: [], quotes: [] })
  return doc
}

export default mongoose.model('AppContent', appContentSchema)
