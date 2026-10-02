import { NextResponse } from 'next/server'
import { recordVerifiedPayment, verifyPaystackTransaction } from '../../../../lib/paystack/payments'

function checkoutRedirect(request: Request, paymentState: string) {
  const destination = new URL('/checkout', request.url)
  destination.searchParams.set('payment', paymentState)
  return NextResponse.redirect(destination)
}

export async function GET(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const reference = new URL(request.url).searchParams.get('reference')

  if (!secret || !siteUrl) return checkoutRedirect(request, 'setup')
  if (!reference || !/^[a-zA-Z0-9=.-]{6,100}$/.test(reference)) {
    return checkoutRedirect(request, 'unverified')
  }

  try {
    const transaction = await verifyPaystackTransaction(reference, secret)
    if (transaction.reference !== reference || transaction.status !== 'success') {
      return checkoutRedirect(request, 'not-complete')
    }

    const result = await recordVerifiedPayment(transaction)
    if (result.kind === 'paid') {
      const destination = new URL('/payment/confirmation', siteUrl)
      destination.searchParams.set('order', String(result.orderNumber))
      return NextResponse.redirect(destination)
    }

    console.error('[paystack callback] Transaction did not match a FOODLUXE order:', result.kind)
    return checkoutRedirect(request, 'unverified')
  } catch (error) {
    console.error('[paystack callback] Could not verify payment:', error)
    return checkoutRedirect(request, 'verification-error')
  }
}
