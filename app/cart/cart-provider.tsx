'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

export type CartProduct = {
  id: string
  name: string
  price_naira: number
}

export type CartItem = CartProduct & {
  quantity: number
}

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  ready: boolean
  addItem: (product: CartProduct) => void
  removeItem: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
}

const STORAGE_KEY = 'foodluxe-cart'
const CartContext = createContext<CartContextValue | null>(null)

function readStoredCart(): CartItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return []

    const parsed: unknown = JSON.parse(saved)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((item): item is CartItem => {
      if (!item || typeof item !== 'object') return false

      const candidate = item as Partial<CartItem>
      return (
        typeof candidate.id === 'string' &&
        typeof candidate.name === 'string' &&
        typeof candidate.price_naira === 'number' &&
        Number.isFinite(candidate.price_naira) &&
        candidate.price_naira > 0 &&
        Number.isInteger(candidate.quantity) &&
        candidate.quantity! > 0
      )
    })
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setItems(readStoredCart())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Keep the in-memory cart usable if browser storage is unavailable.
    }
  }, [items, ready])

  function addItem(product: CartProduct) {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }

      return [...current, { ...product, quantity: 1 }]
    })
  }

  function removeItem(productId: string) {
    setItems((current) => current.filter((item) => item.id !== productId))
  }

  function setQuantity(productId: string, quantity: number) {
    if (quantity < 1) {
      removeItem(productId)
      return
    }

    setItems((current) =>
      current.map((item) => (item.id === productId ? { ...item, quantity } : item))
    )
  }

  function clearCart() {
    setItems([])
  }

  const value: CartContextValue = {
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total + item.price_naira * item.quantity, 0),
    ready,
    addItem,
    removeItem,
    setQuantity,
    clearCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used inside the FOODLUXE CartProvider')
  }

  return context
}
