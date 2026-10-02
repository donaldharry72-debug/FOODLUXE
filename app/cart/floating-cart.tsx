'use client'

import Link from 'next/link'
import { useCart } from './cart-provider'

export default function FloatingCart() {
  const { itemCount, ready } = useCart()

  return (
    <Link
      id='foodluxe-floating-cart'
      href='/cart'
      aria-label={ready ? 'Shopping basket, ' + itemCount + ' ' + (itemCount === 1 ? 'item' : 'items') : 'Shopping basket'}
      className='floating-cart'
    >
      <svg aria-hidden='true' viewBox='0 0 24 24' fill='none' className='floating-cart-icon'>
        <path d='M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 8H6' stroke='currentColor' strokeWidth='1.7' strokeLinecap='round' strokeLinejoin='round' />
        <circle cx='10' cy='20' r='1.25' fill='currentColor' />
        <circle cx='18' cy='20' r='1.25' fill='currentColor' />
      </svg>
      <span>Basket</span>
      <span className='floating-cart-count' aria-live='polite'>{ready ? itemCount : '…'}</span>
    </Link>
  )
}
