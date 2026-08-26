import React, { createContext, useContext, useEffect, useState } from 'react'
import { api, setToken } from '../api'
import { getFullLocation } from '../utils/geolocation'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [booting, setBooting] = useState(Boolean(localStorage.getItem('bs_token')))
  const [location, setLocation] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bs_user_location') || 'null')
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (!localStorage.getItem('bs_token')) return undefined
    api
      .get('/auth/me')
      .then((me) => {
        setUser(me)
        setIsLoggedIn(true)
      })
      .catch(() => setToken(null))
      .finally(() => setBooting(false))
    return undefined
  }, [])

  const requestLocation = async () => {
    try {
      const loc = await getFullLocation()
      localStorage.setItem('bs_user_location', JSON.stringify(loc))
      setLocation(loc)
      return loc
    } catch {
      return null
    }
  }

  const login = async ({ email, password }) => {
    const res = await api.post('/auth/login', { email, password })
    setToken(res.token)
    setUser(res.user)
    setIsLoggedIn(true)
    return res.user
  }

  const register = async ({ name, email, password }) => {
    const res = await api.post('/auth/register', { name, email, password })
    setToken(res.token)
    setUser(res.user)
    setIsLoggedIn(true)
    return res.user
  }

  const updateUser = async (patch) => {
    setUser((u) => ({ ...(u || {}), ...patch }))
    try {
      const me = await api.patch('/auth/me', patch)
      setUser(me)
      return me
    } catch (e) {
      if (e.status === 401) {
        setToken(null)
        setIsLoggedIn(false)
        setUser(null)
      }
      throw e
    }
  }

  const logout = () => {
    setToken(null)
    setIsLoggedIn(false)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, booting, user, location, login, register, logout, updateUser, requestLocation }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
