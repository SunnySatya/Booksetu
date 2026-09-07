import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useToast } from '../components/Toast'
import { useAuth } from './AuthContext'
import { api } from '../api'

const ShopContext = createContext(null)

const BASE_CART_KEY = 'bs_cart'
const BASE_WISHLIST_KEY = 'bs_wishlist'

const keyFor = (base, email) =>
  email ? `${base}_${String(email).toLowerCase()}` : base

const readLocal = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

const sameBook = (a, b) => a.title === b.title && a.seller === b.seller && (a.sellerEmail || '') === (b.sellerEmail || '')

export function ShopProvider({ children }) {
  const toast = useToast()
  const { user, isLoggedIn } = useAuth()
  const email = user?.email || ''
  const syncedRef = useRef({})

  // Each user gets their own localStorage keys so one account's cart /
  // wishlist never leaks into another user's view on a shared device.
  const cartKey = useMemo(() => keyFor(BASE_CART_KEY, email), [email])
  const wishlistKey = useMemo(() => keyFor(BASE_WISHLIST_KEY, email), [email])

  const [cart, setCart] = useState(() => readLocal(cartKey))
  const [wishlist, setWishlist] = useState(() => readLocal(wishlistKey))
  const [initializedEmail, setInitializedEmail] = useState(email)

  useEffect(() => {
    localStorage.setItem(cartKey, JSON.stringify(cart))
  }, [cart, cartKey])

  useEffect(() => {
    localStorage.setItem(wishlistKey, JSON.stringify(wishlist))
  }, [wishlist, wishlistKey])

  // Reset local state whenever the logged-in user changes so we never show
  // the previous account's items.
  useEffect(() => {
    if (email === initializedEmail) return
    setInitializedEmail(email)
    setCart(readLocal(keyFor(BASE_CART_KEY, email)))
    setWishlist(readLocal(keyFor(BASE_WISHLIST_KEY, email)))
    // Disable merge-on-switch: we should not carry one user's items into
    // another user's freshly-loaded state.
    syncedRef.current = {}
  }, [email, initializedEmail])

  // On login: fetch server data, merge with local (same user), push back.
  useEffect(() => {
    if (!isLoggedIn || !email || syncedRef.current[email]) return
    syncedRef.current[email] = true
    ;(async () => {
      try {
        const [serverCart, serverWishlist] = await Promise.all([
          api.get('/cart'),
          api.get('/wishlist'),
        ])
        const localCart = readLocal(keyFor(BASE_CART_KEY, email))
        const localWish = readLocal(keyFor(BASE_WISHLIST_KEY, email))

        const merge = (server, local) => {
          const merged = [...server]
          for (const item of local) {
            if (!merged.some((s) => sameBook(s, item))) {
              merged.push(item)
            }
          }
          return merged
        }

        const finalCart = merge(serverCart, localCart)
        const finalWish = merge(serverWishlist, localWish)

        setCart(finalCart)
        setWishlist(finalWish)

        await Promise.all([
          api.put('/cart', { items: finalCart }),
          api.put('/wishlist', { items: finalWish }),
        ])
      } catch {
        // Stay with localStorage data
      }
    })()
  }, [isLoggedIn, email])

  // Reset sync flag on logout
  useEffect(() => {
    if (!isLoggedIn) syncedRef.current = {}
  }, [isLoggedIn])

  const serverAdd = useCallback(async (endpoint, item) => {
    try {
      return await api.post(endpoint, { item })
    } catch {
      return null
    }
  }, [])

  const serverRemove = useCallback(async (endpoint, title, seller) => {
    try {
      return await api.del(endpoint, { title, seller })
    } catch {
      return null
    }
  }, [])

  const serverReplace = useCallback(async (endpoint, items) => {
    try {
      return await api.put(endpoint, { items })
    } catch {
      return null
    }
  }, [])

  const addToCart = useCallback(async (book) => {
    if (cart.some((b) => sameBook(b, book))) {
      toast('Already in cart', 'info')
      return
    }
    setCart((c) => [{ ...book }, ...c])
    toast(`"${book.title}" added to cart`)
    if (isLoggedIn) await serverAdd('/cart', book)
  }, [cart, isLoggedIn, serverAdd, toast])

  const removeFromCart = useCallback(async (book) => {
    setCart((c) => c.filter((b) => !sameBook(b, book)))
    toast(`"${book.title}" removed from cart`, 'info')
    if (isLoggedIn) await serverRemove('/cart', book.title, book.seller)
  }, [isLoggedIn, serverRemove, toast])

  const clearCart = useCallback(async () => {
    setCart([])
    if (isLoggedIn) await serverReplace('/cart', [])
  }, [isLoggedIn, serverReplace])

  const toggleWishlist = useCallback(async (book) => {
    if (wishlist.some((b) => sameBook(b, book))) {
      setWishlist((w) => w.filter((b) => !sameBook(b, book)))
      toast(`"${book.title}" removed from wishlist`, 'info')
      if (isLoggedIn) await serverRemove('/wishlist', book.title, book.seller)
    } else {
      setWishlist((w) => [{ ...book }, ...w])
      toast(`"${book.title}" saved to wishlist`)
      if (isLoggedIn) await serverAdd('/wishlist', book)
    }
  }, [wishlist, isLoggedIn, serverAdd, serverRemove, toast])

  const isInCart = useCallback((book) => cart.some((b) => sameBook(b, book)), [cart])
  const isWishlisted = useCallback((book) => wishlist.some((b) => sameBook(b, book)), [wishlist])

  return (
    <ShopContext.Provider
      value={{
        cart,
        wishlist,
        cartCount: cart.length,
        wishlistCount: wishlist.length,
        addToCart,
        removeFromCart,
        clearCart,
        toggleWishlist,
        isInCart,
        isWishlisted,
      }}
    >
      {children}
    </ShopContext.Provider>
  )
}

export function useShop() {
  return useContext(ShopContext)
}
