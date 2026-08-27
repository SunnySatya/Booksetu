import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { setSEO, ROUTE_META } from '../utils/seo'

// Sets per-route <title>/<meta> as the user navigates in the SPA.
export default function SeoManager() {
  const { pathname } = useLocation()

  useEffect(() => {
    const meta = ROUTE_META[pathname]
    setSEO(meta || { title: undefined, description: undefined })
  }, [pathname])

  return null
}
