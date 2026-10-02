'use client'

import { useState } from 'react'
import type { MouseEvent } from 'react'
import type { CartProduct } from './cart-provider'
import { useCart } from './cart-provider'

export function AddToCartButton({ product }: { product: CartProduct }) {
  const { addItem, ready } = useCart()
  const [added, setAdded] = useState(false)

  function animateDishIntoCart(button: HTMLButtonElement) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const source = button.closest('.menu-card')?.querySelector('img')
    const target = document.getElementById('foodluxe-floating-cart')
    if (!source || !target || typeof source.animate !== 'function') return

    const from = source.getBoundingClientRect()
    const to = target.getBoundingClientRect()
    const flyer = source.cloneNode(true) as HTMLImageElement
    const size = Math.min(from.width, from.height, 112)
    const startX = from.left + (from.width - size) / 2
    const startY = from.top + (from.height - size) / 2
    const endX = to.left + to.width / 2 - size / 2
    const endY = to.top + to.height / 2 - size / 2

    Object.assign(flyer.style, {
      position: 'fixed',
      left: startX + 'px',
      top: startY + 'px',
      width: size + 'px',
      height: size + 'px',
      objectFit: 'cover',
      borderRadius: '18px',
      zIndex: '100',
      pointerEvents: 'none',
      boxShadow: '0 12px 36px rgba(0, 0, 0, .5)',
      willChange: 'transform, opacity',
    })
    flyer.setAttribute('aria-hidden', 'true')
    document.body.appendChild(flyer)

    const animation = flyer.animate(
      [
        { transform: 'translate3d(0, 0, 0) scale(1)', opacity: 1, borderRadius: '18px' },
        {
          transform: 'translate3d(' + (endX - startX) + 'px, ' + (endY - startY) + 'px, 0) scale(.12)',
          opacity: 0.25,
          borderRadius: '50%',
        },
      ],
      { duration: 680, easing: 'cubic-bezier(.55, 0, .9, .35)', fill: 'forwards' }
    )
    animation.onfinish = () => flyer.remove()

    target.classList.remove('cart-arrival')
    void target.offsetWidth
    target.classList.add('cart-arrival')
    window.setTimeout(() => target.classList.remove('cart-arrival'), 500)
  }

  function handleAdd(event: MouseEvent<HTMLButtonElement>) {
    animateDishIntoCart(event.currentTarget)
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
