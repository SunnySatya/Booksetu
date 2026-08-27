import { api } from '../api'

const map = (l) => ({ ...l, id: l.id ?? l._id })

export const getAllListings = async (lat, lng) => {
  let path = '/listings'
  const params = []
  if (lat != null && lng != null) {
    params.push(`lat=${lat}`, `lng=${lng}`)
  }
  if (params.length) path += '?' + params.join('&')
  const data = await api.get(path)
  const arr = Array.isArray(data) ? data : (data.listings || [])
  return arr.map(map)
}

export const getListingsBySeller = async (email) => {
  if (!email) return []
  const all = await getAllListings()
  return all.filter((l) => l.sellerEmail === email)
}

export const addListing = async (listing) => {
  const created = await api.post('/listings', listing)
  return map(created)
}

export const updateListing = async (id, patch) => {
  const updated = await api.patch(`/listings/${id}`, patch)
  return map(updated)
}

export const deleteListing = async (id) => {
  await api.del(`/listings/${id}`)
}

// Admin: promote a listing to "featured" for N days (ranks it first on the market).
export const featureListing = async (id, days) => {
  const updated = await api.patch(`/listings/${id}/featured`, { days })
  return map(updated)
}

// Admin: demote a listing (remove featured status).
export const unfeatureListing = async (id) => {
  const updated = await api.del(`/listings/${id}/featured`)
  return map(updated)
}
