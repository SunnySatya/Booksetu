import { useCallback, useState } from 'react'
import { getFullLocation } from '../utils/geolocation'

const useGeolocation = () => {
  const [status, setStatus] = useState('idle')
  const [value, setValue] = useState(null)

  const request = useCallback(async () => {
    setStatus('loading')
    try {
      const loc = await getFullLocation()
      setValue(loc)
      setStatus('granted')
      return loc
    } catch (e) {
      setStatus(e.message === 'unsupported' ? 'unsupported' : 'denied')
      return null
    }
  }, [])

  return { status, value, request }
}

export default useGeolocation
