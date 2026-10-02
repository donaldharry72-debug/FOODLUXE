'use client'

import type { ReactNode } from 'react'
import { CartProvider } from './cart/cart-provider'
import FloatingCart from './cart/floating-cart'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      {children}
      <FloatingCart />
    </CartProvider>
  )
}
