import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useToast } from '../components/Toast'
import { useAuth } from './AuthContext'
import { api } from '../api'

const ShopContext = createContext(null)

const CART_KEY = 'bs_cart'
const WISHLIST_KEY = 'bs_wishlist'

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
  const [cart, setCart] = useState(() => readLocal(CART_KEY))
  const [wishlist, setWishlist] = useState(() => readLocal(WISHLIST_KEY))
  const syncedRef = useRef(false)

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist))
  }, [wishlist])

  // On login: fetch server data, merge with local, push merged back
  useEffect(() => {
    if (!isLoggedIn || syncedRef.current) return
    syncedRef.current = true
    ;(async () => {
      try {
        const [serverCart, serverWishlist] = await Promise.all([
          api.get('/cart'),
          api.get('/wishlist'),
        ])
        const localCart = readLocal(CART_KEY)
        const localWish = readLocal(WISHLIST_KEY)

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

        // Push merged data back to server
        await Promise.all([
          api.put('/cart', { items: finalCart }),
          api.put('/wishlist', { items: finalWish }),
        ])
      } catch {
        // Stay with localStorage data
      }
    })()
  }, [isLoggedIn])

  // Reset sync flag on logout
  useEffect(() => {
    if (!isLoggedIn) syncedRef.current = false
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
