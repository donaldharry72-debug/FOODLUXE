'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '../cart/cart-provider'

type DeliveryZone = {
  id: string
  name: string
  fee_naira: number
  estimated_minutes: number
}

type CheckoutFormProps = {
  zones: DeliveryZone[]
  initialName: string
  email: string
  zonesUnavailable: boolean
}

type CreatedOrder = {
  orderNumber: number | string
  subtotalNaira: number
  deliveryFeeNaira: number
  totalNaira: number
}

const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })

export function CheckoutForm({
  zones,
  initialName,
  email,
  zonesUnavailable,
}: CheckoutFormProps) {
  const router = useRouter()
  const { items, subtotal, ready, clearCart } = useCart()
  const [busy, setBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setErrorMessage('')

    try {
      const formData = new FormData(event.currentTarget)
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(({ id, quantity }) => ({ id, quantity })),
          customerName: formData.get('customerName'),
          phone: formData.get('phone'),
          deliveryAddress: formData.get('deliveryAddress'),
          deliveryNotes: formData.get('deliveryNotes'),
          zoneId: formData.get('zoneId'),
        }),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        setErrorMessage(result.error ?? 'We could not create your order. Please try again.')
        return
      }

      setCreatedOrder(result as CreatedOrder)
      clearCart()
      router.refresh()
    } catch {
      setErrorMessage('We could not reach the Foodluxe server. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  if (!ready) {
    return <p className='text-amber-100/65'>Loading your cart…</p>
  }

  if (createdOrder) {
    return (
      <section className='mx-auto max-w-xl rounded-2xl border border-amber-300/25 bg-white/[0.03] p-7 sm:p-9'>
        <p className='text-sm font-semibold uppercase tracking-widest text-emerald-300'>Order saved</p>
        <h1 className='mt-3 font-serif text-3xl text-amber-100'>Thank you for your order</h1>
        <p className='mt-4 text-amber-100/70'>
          Order #{createdOrder.orderNumber} has been saved as awaiting payment.
          Payment will be added in the next build step.
        </p>
        <dl className='mt-6 space-y-3 border-t border-amber-100/15 pt-5'>
          <div className='flex justify-between gap-4'><dt>Meals</dt><dd>{naira.format(createdOrder.subtotalNaira)}</dd></div>
          <div className='flex justify-between gap-4'><dt>Delivery</dt><dd>{naira.format(createdOrder.deliveryFeeNaira)}</dd></div>
          <div className='flex justify-between gap-4 border-t border-amber-100/15 pt-3 font-semibold'><dt>Total</dt><dd className='text-amber-300'>{naira.format(createdOrder.totalNaira)}</dd></div>
        </dl>
        <Link href='/' className='mt-7 inline-block rounded-lg bg-amber-400 px-5 py-3 font-semibold text-stone-950 hover:bg-amber-300'>
          Return to menu
        </Link>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className='rounded-2xl border border-amber-100/15 bg-white/[0.03] p-7'>
        <h1 className='font-serif text-2xl text-amber-100'>Your cart is empty</h1>
        <p className='mt-2 text-amber-100/65'>Add a meal before you start checkout.</p>
        <Link href='/' className='mt-5 inline-block rounded-lg bg-amber-400 px-5 py-3 font-semibold text-stone-950 hover:bg-amber-300'>
          Browse the menu
        </Link>
      </section>
    )
  }

  const inputClass =
    'mt-2 w-full rounded-lg border border-amber-100/20 bg-stone-900 px-4 py-3 text-amber-50 outline-none transition focus:border-amber-400'

  return (
    <div className='mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_340px]'>
      <section>
        <h1 className='font-serif text-3xl text-amber-100'>Delivery details</h1>
        <p className='mt-2 text-sm text-amber-100/60'>Signed in as {email}</p>

        {zonesUnavailable && (
          <p role='alert' className='mt-5 rounded-lg bg-red-950/70 p-4 text-sm text-red-200'>
            We could not load delivery areas. Please refresh the page or contact FOODLUXE.
          </p>
        )}
        {!zonesUnavailable && zones.length === 0 && (
          <p role='alert' className='mt-5 rounded-lg bg-red-950/70 p-4 text-sm text-red-200'>
            No delivery areas are available yet. Please contact FOODLUXE.
          </p>
        )}

        <form onSubmit={handleSubmit} className='mt-6 space-y-5 rounded-2xl border border-amber-100/15 bg-white/[0.03] p-5 sm:p-7'>
          <label className='block text-sm text-amber-100/80'>
            Full name
            <input name='customerName' type='text' autoComplete='name' minLength={2} maxLength={100} defaultValue={initialName} required className={inputClass} />
          </label>
          <label className='block text-sm text-amber-100/80'>
            Phone number
            <input name='phone' type='tel' autoComplete='tel' minLength={7} maxLength={25} placeholder='+234 800 000 0000' required className={inputClass} />
          </label>
          <label className='block text-sm text-amber-100/80'>
            Delivery address
            <textarea name='deliveryAddress' autoComplete='street-address' minLength={5} maxLength={500} rows={3} placeholder='House number, street, and any helpful directions' required className={inputClass} />
          </label>
          <label className='block text-sm text-amber-100/80'>
            Delivery area
            <select name='zoneId' required defaultValue='' disabled={zonesUnavailable || zones.length === 0} className={inputClass}>
              <option value='' disabled>Choose your delivery area</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name} — {naira.format(zone.fee_naira)} delivery, about {zone.estimated_minutes} minutes
                </option>
              ))}
            </select>
          </label>
          <label className='block text-sm text-amber-100/80'>
            Delivery notes <span className='text-amber-100/45'>(optional)</span>
            <textarea name='deliveryNotes' maxLength={500} rows={2} placeholder='Gate code or other delivery instructions' className={inputClass} />
          </label>

          {errorMessage && <p role='alert' className='rounded-lg bg-red-950/70 p-3 text-sm text-red-200'>{errorMessage}</p>}

          <button
            type='submit'
            disabled={busy || zonesUnavailable || zones.length === 0}
            className='w-full rounded-lg bg-amber-400 px-5 py-3 font-semibold text-stone-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60'
          >
            {busy ? 'Saving your order…' : 'Create order'}
          </button>
        </form>
      </section>

      <aside className='h-fit rounded-2xl border border-amber-300/25 bg-white/[0.03] p-6'>
        <h2 className='font-serif text-xl text-amber-200'>Order summary</h2>
        <ul className='mt-5 space-y-3'>
          {items.map((item) => (
            <li key={item.id} className='flex justify-between gap-4 text-sm'>
              <span className='text-amber-100/70'>{item.quantity} × {item.name}</span>
              <span>{naira.format(item.price_naira * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className='my-5 border-t border-amber-100/15' />
        <div className='flex justify-between gap-4 font-semibold'>
          <span>Meal subtotal</span>
          <span className='text-amber-300'>{naira.format(subtotal)}</span>
        </div>
        <p className='mt-3 text-xs leading-5 text-amber-100/50'>
          Current menu prices and the selected delivery fee are checked again on the server before the order is saved.
        </p>
      </aside>
    </div>
  )
}
