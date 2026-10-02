import { NextResponse } from 'next/server'
import {
  hasValidPaystackSignature,
  recordVerifiedPayment,
  verifyPaystackTransaction,
} from '../../../../lib/paystack/payments'
import { sendOrderConfirmationEmail } from '../../../../lib/mailgun/order-confirmation'

type PaystackWebhookEvent = {
  event?: unknown
  data?: {
    reference?: unknown
  }
}

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) {
    console.error('[paystack webhook] PAYSTACK_SECRET_KEY is not configured.')
    return NextResponse.json({ error: 'Webhook is not configured.' }, { status: 503 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get('x-paystack-signature') ?? ''
  if (!hasValidPaystackSignature(rawBody, signature, secret)) {
    return new Response('Invalid signature', { status: 401 })
  }

  let event: PaystackWebhookEvent
  try {
    event = JSON.parse(rawBody) as PaystackWebhookEvent
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  if (event.event !== 'charge.success') {
    return new Response('Event received', { status: 200 })
  }

  const reference = event.data?.reference
  if (typeof reference !== 'string' || !/^[a-zA-Z0-9=.-]{6,100}$/.test(reference)) {
    return new Response('Invalid transaction reference', { status: 400 })
  }

  try {
    const transaction = await verifyPaystackTransaction(reference, secret)
    if (transaction.reference !== reference || transaction.status !== 'success') {
      return new Response('Transaction not successful', { status: 200 })
    }

    const result = await recordVerifiedPayment(transaction)
    if (result.kind === 'not_found' || result.kind === 'amount_mismatch') {
      console.error('[paystack webhook] Verified payment did not match an order:', result.kind)
    }

    if (result.kind === 'paid') {
      const emailResult = await sendOrderConfirmationEmail(result.orderId)
      if (emailResult === 'in_progress') {
        return new Response('Order confirmation email is still processing', { status: 503 })
      }
    }

    return new Response('Event received', { status: 200 })
  } catch {
    console.error('[paystack webhook] Could not finish payment or confirmation email processing.')
    return new Response('Could not process payment event', { status: 500 })
  }
}
