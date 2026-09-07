const isSecureContext = () =>
  typeof window !== 'undefined' &&
  (window.isSecureContext ||
    ['https:', 'wss:'].includes(window.location?.protocol))

const oneShot = (opts) =>
  new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, opts)
  })

const errorCode = (err) => {
  // GeolocationPositionError: 1=denied, 2=unavailable, 3=timeout
  if (err && typeof err.code === 'number') return err.code
  return null
}

export const getCurrentPosition = async () => {
  if (!navigator.geolocation) {
    throw new Error('unsupported')
  }
  if (!isSecureContext()) {
    throw new Error('insecure-context')
  }
  // 1) Try high accuracy (GPS) — preferred, but can be slow on phones.
  try {
    const pos = await oneShot({
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 60000,
    })
    return { lat: pos.coords.latitude, lng: pos.coords.longitude }
  } catch (err) {
    // 2) Fall back to network/WiFi accuracy — resolves quickly in cities
    //    even when the phone's GPS fix takes too long.
    try {
      const pos = await oneShot({
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 300000,
      })
      return { lat: pos.coords.latitude, lng: pos.coords.longitude }
    } catch (err2) {
      const code = errorCode(err2)
      if (code === 3) throw new Error('timeout')
      if (code === 2) throw new Error('unavailable')
      throw new Error('denied')
    }
  }
}

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