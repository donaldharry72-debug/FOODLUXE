import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { createAdminClient } from '../supabase/admin'

type PaystackEnvelope<T> = {
  status: boolean
  message?: string
  data?: T
}

export type VerifiedPaystackTransaction = {
  status: string
  reference: string
  amount: number
  currency: string
}

type PaymentResult =
  | { kind: 'paid'; orderId: string; orderNumber: number | string }
  | { kind: 'not_paid' }
  | { kind: 'not_found' }
  | { kind: 'amount_mismatch' }

export function hasValidPaystackSignature(rawBody: string, signature: string, secret: string) {
  if (!/^[a-f0-9]{128}$/i.test(signature)) return false

  const expected = createHmac('sha512', secret).update(rawBody).digest()
  const received = Buffer.from(signature, 'hex')
  return received.length === expected.length && timingSafeEqual(received, expected)
}

export async function verifyPaystackTransaction(reference: string, secret: string) {
  const response = await fetch(
    'https://api.paystack.co/transaction/verify/' + encodeURIComponent(reference),
    {
      headers: { Authorization: 'Bearer ' + secret },
      cache: 'no-store',
    }
  )

  const result = (await response.json().catch(() => null)) as PaystackEnvelope<VerifiedPaystackTransaction> | null
  if (!response.ok || !result?.status || !result.data) {
    throw new Error('Paystack could not verify the transaction.')
  }

  return result.data
}

export async function recordVerifiedPayment(transaction: VerifiedPaystackTransaction): Promise<PaymentResult> {
  if (
    transaction.status !== 'success' ||
    !Number.isSafeInteger(transaction.amount) ||
    transaction.currency !== 'NGN'
  ) {
    return { kind: 'not_paid' }
  }

  const admin = createAdminClient()
  const { data: order, error } = await admin
    .from('orders')
    .select('id, order_number, total_naira, status, payment_status')
    .eq('payment_reference', transaction.reference)
    .maybeSingle()

  if (error) throw new Error('Could not look up the FOODLUXE order: ' + error.message)
  if (!order) return { kind: 'not_found' }

  if (transaction.amount !== order.total_naira * 100) {
    return { kind: 'amount_mismatch' }
  }

  if (order.payment_status !== 'paid') {
    const { data: updatedOrder, error: updateError } = await admin
      .from('orders')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        paid_at: new Date().toISOString(),
      })
      .eq('id', order.id)
      .eq('payment_status', 'unpaid')
      .eq('status', 'pending_payment')
      .select('id')
      .maybeSingle()

    if (updateError) throw new Error('Could not mark the FOODLUXE order paid: ' + updateError.message)

    if (!updatedOrder) {
      const { data: latestOrder, error: latestError } = await admin
        .from('orders')
        .select('payment_status, status')
        .eq('id', order.id)
        .maybeSingle()

      if (latestError) throw new Error('Could not recheck the FOODLUXE order: ' + latestError.message)
      if (latestOrder?.payment_status !== 'paid') return { kind: 'not_paid' }
    }
  }

  const { data: history, error: historyLookupError } = await admin
    .from('order_status_history')
    .select('id')
    .eq('order_id', order.id)
    .eq('status', 'confirmed')
    .limit(1)

  if (historyLookupError) throw new Error('Could not check order history: ' + historyLookupError.message)

  if (!history?.length) {
    const { error: historyError } = await admin.from('order_status_history').insert({
      order_id: order.id,
      status: 'confirmed',
      note: 'Payment verified by Paystack.',
    })

    if (historyError) throw new Error('Could not add payment to order history: ' + historyError.message)
  }

  return { kind: 'paid', orderId: order.id, orderNumber: order.order_number }
}
