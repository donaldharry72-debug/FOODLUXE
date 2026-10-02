import 'server-only'

import { createAdminClient } from '../supabase/admin'

type EmailOrder = {
  id: string
  order_number: number | string
  customer_name: string
  customer_email: string
  delivery_address: string
  delivery_notes: string | null
  subtotal_naira: number
  delivery_fee_naira: number
  total_naira: number
  payment_status: string
  status: string
  confirmation_email_status: 'pending' | 'sending' | 'sent' | 'skipped'
  confirmation_email_claimed_at: string | null
}

type EmailOrderItem = {
  item_name: string
  quantity: number
  unit_price_naira: number
}

export type OrderConfirmationEmailResult = 'sent' | 'already_sent' | 'in_progress'

const CLAIM_TIMEOUT_MS = 5 * 60 * 1000

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }

    return entities[character]
  })
}

function formatNaira(amount: number) {
  return '₦' + amount.toLocaleString('en-NG')
}

function getMailgunConfig() {
  const apiKey = process.env.MAILGUN_API_KEY
  const domain = process.env.MAILGUN_DOMAIN
  const from = process.env.MAILGUN_FROM
  const region = process.env.MAILGUN_REGION?.toLowerCase()

  if (!apiKey || !domain || !from || !region) {
    throw new Error('Mailgun configuration is incomplete.')
  }

  if (region !== 'us' && region !== 'eu') {
    throw new Error('MAILGUN_REGION must be either us or eu.')
  }

  if (!/^[a-z0-9.-]+$/i.test(domain)) {
    throw new Error('MAILGUN_DOMAIN is invalid.')
  }

  return {
    apiKey,
    domain,
    from,
    apiBaseUrl: region === 'eu' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net',
  }
}

async function claimEmail(admin: ReturnType<typeof createAdminClient>, order: EmailOrder) {
  const now = new Date().toISOString()
  const claim = {
    confirmation_email_status: 'sending' as const,
    confirmation_email_claimed_at: now,
  }

  if (order.confirmation_email_status === 'pending') {
    const { data, error } = await admin
      .from('orders')
      .update(claim)
      .eq('id', order.id)
      .eq('confirmation_email_status', 'pending')
      .select('id')
      .maybeSingle()

    if (error) throw new Error('Could not claim order confirmation email.')
    if (data) return now
  }

  if (order.confirmation_email_status === 'sending' && order.confirmation_email_claimed_at) {
    const claimedAt = new Date(order.confirmation_email_claimed_at)
    const expiredBefore = new Date(Date.now() - CLAIM_TIMEOUT_MS)

    if (claimedAt < expiredBefore) {
      const { data, error } = await admin
        .from('orders')
        .update(claim)
        .eq('id', order.id)
        .eq('confirmation_email_status', 'sending')
        .eq('confirmation_email_claimed_at', order.confirmation_email_claimed_at)
        .select('id')
        .maybeSingle()

      if (error) throw new Error('Could not reclaim order confirmation email.')
      if (data) return now
    }
  }

  const { data: latestOrder, error: latestError } = await admin
    .from('orders')
    .select('confirmation_email_status')
    .eq('id', order.id)
    .maybeSingle()

  if (latestError) throw new Error('Could not check order confirmation email status.')
  if (latestOrder?.confirmation_email_status === 'sent' || latestOrder?.confirmation_email_status === 'skipped') {
    return null
  }

  return 'in_progress'
}

export async function sendOrderConfirmationEmail(orderId: string): Promise<OrderConfirmationEmailResult> {
  const mailgun = getMailgunConfig()
  const admin = createAdminClient()

  const { data: order, error: orderError } = await admin
    .from('orders')
    .select(
      'id, order_number, customer_name, customer_email, delivery_address, delivery_notes, subtotal_naira, delivery_fee_naira, total_naira, payment_status, status, confirmation_email_status, confirmation_email_claimed_at'
    )
    .eq('id', orderId)
    .maybeSingle()

  if (orderError || !order) throw new Error('Could not load the paid FOODLUXE order for email.')
  const emailOrder = order as EmailOrder

  if (emailOrder.payment_status !== 'paid' || emailOrder.status !== 'confirmed') {
    throw new Error('Order confirmation email requires a verified, paid order.')
  }

  if (emailOrder.confirmation_email_status === 'sent' || emailOrder.confirmation_email_status === 'skipped') {
    return 'already_sent'
  }

  const claimedAt = await claimEmail(admin, emailOrder)
  if (!claimedAt) return 'already_sent'
  if (claimedAt === 'in_progress') return 'in_progress'

  try {
    const { data: items, error: itemsError } = await admin
      .from('order_items')
      .select('item_name, quantity, unit_price_naira')
      .eq('order_id', emailOrder.id)
      .order('id')

    if (itemsError || !items?.length) throw new Error('Could not load order items for confirmation email.')

    const itemRows = (items as EmailOrderItem[]).map((item) => {
      const name = escapeHtml(item.item_name)
      const quantity = item.quantity.toLocaleString('en-NG')
      const lineTotal = formatNaira(item.unit_price_naira * item.quantity)
      return `<tr><td style="padding:12px 8px;border-bottom:1px solid #e9dfc9">${name}</td><td style="padding:12px 8px;border-bottom:1px solid #e9dfc9;text-align:center">${quantity}</td><td style="padding:12px 8px;border-bottom:1px solid #e9dfc9;text-align:right">${lineTotal}</td></tr>`
    })

    const itemText = (items as EmailOrderItem[])
      .map((item) => `${item.quantity} × ${item.item_name} — ${formatNaira(item.unit_price_naira * item.quantity)}`)
      .join('\n')
    const orderNumber = String(emailOrder.order_number)
    const name = escapeHtml(emailOrder.customer_name)
    const address = escapeHtml(emailOrder.delivery_address)
    const notes = emailOrder.delivery_notes ? escapeHtml(emailOrder.delivery_notes) : ''
    const subject = `FOODLUXE order #${orderNumber} confirmed`
    const text = [
      `Hello ${emailOrder.customer_name},`,
      '',
      `Your payment has been verified and order #${orderNumber} is confirmed.`,
      '',
      'Your meals:',
      itemText,
      '',
      `Subtotal: ${formatNaira(emailOrder.subtotal_naira)}`,
      `Delivery: ${formatNaira(emailOrder.delivery_fee_naira)}`,
      `Total paid: ${formatNaira(emailOrder.total_naira)}`,
      '',
      `Delivery address: ${emailOrder.delivery_address}`,
      ...(emailOrder.delivery_notes ? [`Delivery notes: ${emailOrder.delivery_notes}`] : []),
      '',
      'Thank you for choosing FOODLUXE — where luxury meets affordability.',
    ].join('\n')
    const html = `<!doctype html><html><body style="margin:0;background:#f7f4ed;color:#1c1917;font-family:Arial,sans-serif"><div style="max-width:620px;margin:24px auto;padding:32px;background:#fff;border:1px solid #eadfc7;border-radius:16px"><p style="margin:0;color:#9a6a16;font-size:13px;letter-spacing:3px">FOODLUXE</p><h1 style="margin:14px 0 8px;color:#211b10;font-family:Georgia,serif">Your order is confirmed</h1><p>Hello ${name}, your payment has been verified and order <strong>#${escapeHtml(orderNumber)}</strong> is confirmed.</p><table style="width:100%;border-collapse:collapse;margin:24px 0"><thead><tr><th style="padding:10px 8px;text-align:left;border-bottom:2px solid #d4a63b">Meal</th><th style="padding:10px 8px;border-bottom:2px solid #d4a63b">Qty</th><th style="padding:10px 8px;text-align:right;border-bottom:2px solid #d4a63b">Amount</th></tr></thead><tbody>${itemRows.join('')}</tbody></table><div style="margin-left:auto;max-width:280px"><p>Subtotal: <strong>${formatNaira(emailOrder.subtotal_naira)}</strong></p><p>Delivery: <strong>${formatNaira(emailOrder.delivery_fee_naira)}</strong></p><p style="padding-top:12px;border-top:1px solid #e9dfc9;font-size:18px">Total paid: <strong style="color:#9a6a16">${formatNaira(emailOrder.total_naira)}</strong></p></div><h2 style="margin:26px 0 8px;font-size:16px">Delivery address</h2><p>${address}</p>${notes ? `<p><strong>Delivery notes:</strong> ${notes}</p>` : ''}<p style="margin-top:28px;color:#746b5c">Thank you for choosing FOODLUXE — where luxury meets affordability.</p></div></body></html>`

    const form = new FormData()
    form.set('from', mailgun.from)
    form.set('to', emailOrder.customer_email)
    form.set('subject', subject)
    form.set('text', text)
    form.set('html', html)

    const response = await fetch(
      `${mailgun.apiBaseUrl}/v3/${encodeURIComponent(mailgun.domain)}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from('api:' + mailgun.apiKey).toString('base64'),
        },
        body: form,
        cache: 'no-store',
        signal: AbortSignal.timeout(15_000),
      }
    )

    if (!response.ok) throw new Error(`Mailgun rejected the confirmation email (${response.status}).`)

    const sentAt = new Date().toISOString()
    const { data: markedSent, error: markSentError } = await admin
      .from('orders')
      .update({
        confirmation_email_status: 'sent',
        confirmation_email_claimed_at: null,
        confirmation_email_sent_at: sentAt,
      })
      .eq('id', emailOrder.id)
      .eq('confirmation_email_status', 'sending')
      .eq('confirmation_email_claimed_at', claimedAt)
      .select('id')
      .maybeSingle()

    if (markSentError || !markedSent) throw new Error('Mailgun accepted the email, but its delivery status could not be saved.')

    return 'sent'
  } catch (error) {
    const { error: releaseError } = await admin
      .from('orders')
      .update({
        confirmation_email_status: 'pending',
        confirmation_email_claimed_at: null,
      })
      .eq('id', emailOrder.id)
      .eq('confirmation_email_status', 'sending')
      .eq('confirmation_email_claimed_at', claimedAt)

    if (releaseError) console.error('[mailgun] Could not release order confirmation email claim.')
    throw error
  }
}
