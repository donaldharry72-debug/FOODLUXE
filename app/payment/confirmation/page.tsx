import Image from 'next/image'
import Link from 'next/link'
import { ClearCartAfterPayment } from './clear-cart'

export default async function PaymentConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string | string[] }>
}) {
  const query = await searchParams
  const orderNumber = typeof query.order === 'string' && /^\d{1,20}$/.test(query.order)
    ? query.order
    : null

  return (
    <main className='lux-page min-h-screen px-5 py-8 text-amber-50 sm:px-8 md:px-12'>
      <ClearCartAfterPayment />
      <header className='site-header compact-header mb-10'>
        <Link href='/' aria-label='FOODLUXE home'>
          <Image src='/foodluxe-logo.png' alt='FOODLUXE' width={400} height={229} className='brand-logo-image' />
        </Link>
        <p className='mt-1 text-sm text-amber-100/65'>Payment update</p>
      </header>
      <section className='lux-surface mx-auto max-w-xl p-7 text-center sm:p-9'>
        <p className='text-sm font-semibold uppercase tracking-widest text-emerald-300'>Payment confirmed</p>
        <h1 className='mt-3 font-serif text-3xl text-amber-100'>Thank you for your order</h1>
        {orderNumber && <p className='mt-4 text-amber-100/70'>Your order number is <strong className='text-amber-200'>#{orderNumber}</strong>.</p>}
        <p className='mt-3 text-amber-100/65'>Your payment has been verified and your order is confirmed.</p>
        <Link href='/' className='mt-7 inline-block rounded-lg bg-amber-400 px-5 py-3 font-semibold text-stone-950 hover:bg-amber-300'>
          Return to menu
        </Link>
      </section>
    </main>
  )
}
