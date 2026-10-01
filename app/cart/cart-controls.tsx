'use client'

import { useState } from 'react'
import type { CartProduct } from './cart-provider'
import { useCart } from './cart-provider'

export function AddToCartButton({ product }: { product: CartProduct }) {
  const { addItem, ready } = useCart()
  const [added, setAdded] = useState(false)

  function handleAdd() {
    addItem(product)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1200)
  }

  return (
    <button
      type='button'
      onClick={handleAdd}
      disabled={!ready}
      className='mt-4 w-full rounded-lg bg-amber-400 px-4 py-2.5 font-semibold text-stone-950 transition hover:bg-amber-300 disabled:cursor-wait disabled:opacity-60'
    >
      {added ? 'Added to cart ✓' : 'Add to cart'}
    </button>
  )
}

export function CartLink() {
  const { itemCount, ready } = useCart()

  return (
    <a
      href='/cart'
      className='rounded-full border border-amber-300/40 px-4 py-2 text-sm text-amber-100 transition hover:bg-amber-300/10'
    >
      Cart{ready && itemCount > 0 ? ' (' + itemCount + ')' : ''}
    </a>
  )
}
