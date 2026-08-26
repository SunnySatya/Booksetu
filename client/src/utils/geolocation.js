export const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      const err = new Error('unsupported')
      return reject(err)
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error('denied')),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  })

export const reverseGeocode = async (lat, lng, zoom = 16) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=${zoom}&addressdetails=1`
    )
    const data = await res.json()
    const a = data.address || {}
    return (
      [
        a.suburb || a.neighbourhood || a.road,
        a.city || a.town || a.village,
        a.state,
      ]
        .filter(Boolean)
        .join(', ') || null
    )
  } catch {
    return null
  }
}

export const getFullLocation = async (zoom = 16) => {
  const { lat, lng } = await getCurrentPosition()
  const address =
    (await reverseGeocode(lat, lng, zoom)) ||
    `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  return { lat, lng, address }
}

export const haversineKm = (a, b) => {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}
