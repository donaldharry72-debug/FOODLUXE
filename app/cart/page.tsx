'use client'

import Link from 'next/link'
import { useCart } from './cart-provider'

const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })

export default function CartPage() {
  const { items, itemCount, subtotal, ready, removeItem, setQuantity } = useCart()

  return (
    <main className='min-h-screen bg-stone-950 px-5 py-8 text-amber-50 sm:px-8 md:px-12'>
      <header className='mb-10 flex items-center justify-between gap-4'>
        <div>
          <Link href='/' className='font-serif text-3xl text-amber-400'>FOODLUXE</Link>
          <p className='mt-1 text-sm text-amber-100/65'>Your shopping cart</p>
        </div>
        <Link href='/' className='text-sm text-amber-200 hover:text-amber-100'>Continue shopping</Link>
      </header>

      <h1 className='mb-2 font-serif text-3xl text-amber-100'>Your cart</h1>
      {!ready ? (
        <p className='mt-8 text-amber-100/65'>Loading your cart…</p>
      ) : items.length === 0 ? (
        <section className='mt-8 rounded-2xl border border-amber-100/15 bg-white/[0.03] p-8 text-center'>
          <p className='text-lg'>Your cart is empty.</p>
          <Link href='/' className='mt-5 inline-block rounded-lg bg-amber-400 px-5 py-3 font-semibold text-stone-950 hover:bg-amber-300'>
            Browse the menu
          </Link>
        </section>
      ) : (
        <div className='mt-8 grid gap-8 lg:grid-cols-[1fr_340px]'>
          <section aria-label='Items in your cart' className='space-y-4'>
            <p className='mb-4 text-sm text-amber-100/60'>{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
            {items.map((item) => (
              <article key={item.id} className='flex flex-col gap-4 rounded-2xl border border-amber-100/15 bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <h2 className='font-semibold'>{item.name}</h2>
                  <p className='mt-1 text-sm text-amber-100/60'>{naira.format(item.price_naira)} each</p>
                </div>
                <div className='flex items-center justify-between gap-5 sm:justify-end'>
                  <div className='flex items-center gap-3 rounded-lg border border-amber-100/15 px-2 py-1'>
                    <button
                      type='button'
                      aria-label={'Decrease quantity of ' + item.name}
                      onClick={() => setQuantity(item.id, item.quantity - 1)}
                      className='px-2 py-1 text-lg text-amber-200 hover:text-amber-100'
                    >
                      −
                    </button>
                    <span className='min-w-5 text-center'>{item.quantity}</span>
                    <button
                      type='button'
                      aria-label={'Increase quantity of ' + item.name}
                      onClick={() => setQuantity(item.id, item.quantity + 1)}
                      className='px-2 py-1 text-lg text-amber-200 hover:text-amber-100'
                    >
                      +
                    </button>
                  </div>
                  <p className='min-w-24 text-right font-semibold text-amber-300'>
                    {naira.format(item.price_naira * item.quantity)}
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => removeItem(item.id)}
                  className='self-start text-sm text-amber-100/55 underline underline-offset-4 hover:text-amber-100 sm:self-center'
                >
                  Remove
                </button>
              </article>
            ))}
          </section>

          <aside className='h-fit rounded-2xl border border-amber-300/25 bg-white/[0.03] p-6'>
            <h2 className='font-serif text-xl text-amber-200'>Order summary</h2>
            <div className='mt-5 flex justify-between gap-4 text-sm'>
              <span className='text-amber-100/65'>Items ({itemCount})</span>
              <span>{naira.format(subtotal)}</span>
            </div>
            <Link href='/checkout' className='mt-6 block rounded-lg bg-amber-400 px-4 py-3 text-center font-semibold text-stone-950 hover:bg-amber-300'>
              Continue to checkout
            </Link>
            <p className='mt-3 text-xs leading-5 text-amber-100/50'>
              Delivery fee is added at checkout.
            </p>
            <div className='my-5 border-t border-amber-100/15' />
            <div className='flex justify-between gap-4 font-semibold'>
              <span>Subtotal</span>
              <span className='text-amber-300'>{naira.format(subtotal)}</span>
            </div>
          </aside>
        </div>
      )}
    </main>
  )
}
