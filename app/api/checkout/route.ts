import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../lib/supabase/admin'
import { createClient } from '../../../lib/supabase/server'

type CheckoutBody = {
  items?: unknown
  customerName?: unknown
  phone?: unknown
  deliveryAddress?: unknown
  deliveryNotes?: unknown
  zoneId?: unknown
}

type RequestedItem = {
  id: string
  quantity: number
}

type PaystackInitializeResponse = {
  status?: boolean
  message?: string
  data?: {
    authorization_url?: string
    reference?: string
  }
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function textValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function parseRequestedItems(value: unknown): RequestedItem[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 28) return null

  const quantities = new Map<string, number>()

  for (const entry of value) {
    if (!entry || typeof entry !== 'object') return null

    const item = entry as { id?: unknown; quantity?: unknown }
    if (
      typeof item.id !== 'string' ||
      !uuidPattern.test(item.id) ||
      typeof item.quantity !== 'number' ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 20
    ) {
      return null
    }

    const nextQuantity = (quantities.get(item.id) ?? 0) + item.quantity
    if (nextQuantity > 20) return null
    quantities.set(item.id, nextQuantity)
  }

  return [...quantities].map(([id, quantity]) => ({ id, quantity }))
}

async function removeIncompleteOrder(
  admin: ReturnType<typeof createAdminClient>,
  orderId: string
) {
  const { error } = await admin.from('orders').delete().eq('id', orderId)
  if (error) console.error('[checkout] Could not remove incomplete order:', error.message)
}

export async function POST(request: Request) {
  const userClient = await createClient()
  const { data: authData, error: authError } = await userClient.auth.getUser()

  if (authError || !authData.user || !authData.user.email) {
    return NextResponse.json({ error: 'Please sign in before checking out.' }, { status: 401 })
  }

  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseSecretKey && !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Checkout needs a server key. Ask the site owner to finish the setup.' },
      { status: 503 }
    )
  }

  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!paystackSecretKey || !siteUrl) {
    return NextResponse.json(
      { error: 'Paystack setup is incomplete. Add the test secret key and site URL, then restart the app.' },
      { status: 503 }
    )
  }

  if (process.env.NODE_ENV !== 'production' && !paystackSecretKey.startsWith('sk_test_')) {
    return NextResponse.json({ error: 'Use your Paystack test secret key while running the local site.' }, { status: 503 })
  }

  let callbackUrl: string
  try {
    const configuredSite = new URL(siteUrl)
    if (configuredSite.protocol !== 'https:' && configuredSite.hostname !== 'localhost') {
      return NextResponse.json({ error: 'The FOODLUXE site URL must use HTTPS.' }, { status: 503 })
    }
    callbackUrl = new URL('/api/paystack/callback', configuredSite).toString()
  } catch {
    return NextResponse.json({ error: 'The FOODLUXE site URL is invalid.' }, { status: 503 })
  }

  let parsedBody: unknown
  try {
    parsedBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'The checkout details could not be read.' }, { status: 400 })
  }

  if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
    return NextResponse.json({ error: 'The checkout details are invalid.' }, { status: 400 })
  }

  const body = parsedBody as CheckoutBody

  const items = parseRequestedItems(body.items)
  const customerName = textValue(body.customerName)
  const phone = textValue(body.phone)
  const deliveryAddress = textValue(body.deliveryAddress)
  const deliveryNotes = textValue(body.deliveryNotes)
  const zoneId = textValue(body.zoneId)

  if (!items) {
    return NextResponse.json({ error: 'Your cart is empty or contains invalid items.' }, { status: 400 })
  }

  if (customerName.length < 2 || customerName.length > 100) {
    return NextResponse.json({ error: 'Enter your full name.' }, { status: 400 })
  }

  const phoneDigits = phone.replace(/\D/g, '')
  if (phoneDigits.length < 7 || phoneDigits.length > 15 || phone.length > 25 || !/^[0-9+(). -]+$/.test(phone)) {
    return NextResponse.json({ error: 'Enter a valid phone number.' }, { status: 400 })
  }

  if (deliveryAddress.length < 5 || deliveryAddress.length > 500) {
    return NextResponse.json({ error: 'Enter your delivery address.' }, { status: 400 })
  }

  if (deliveryNotes.length > 500) {
    return NextResponse.json({ error: 'Delivery notes must be 500 characters or less.' }, { status: 400 })
  }

  if (!uuidPattern.test(zoneId)) {
    return NextResponse.json({ error: 'Choose one of the available delivery areas.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const itemIds = items.map((item) => item.id)

  const [{ data: menuItems, error: menuError }, { data: zone, error: zoneError }] =
    await Promise.all([
      admin
        .from('menu_items')
        .select('id, name, price_naira')
        .in('id', itemIds)
        .eq('is_available', true),
      admin
        .from('delivery_zones')
        .select('id, name, fee_naira')
        .eq('id', zoneId)
        .eq('is_active', true)
        .maybeSingle(),
    ])

  if (menuError || zoneError) {
    console.error('[checkout] Could not read menu or delivery zone:', menuError?.message, zoneError?.message)
    return NextResponse.json({ error: 'We could not load the latest menu or delivery fees. Please try again.' }, { status: 500 })
  }

  if (!zone) {
    return NextResponse.json({ error: 'That delivery area is unavailable. Please choose another.' }, { status: 400 })
  }

  if (!menuItems || menuItems.length !== items.length) {
    return NextResponse.json({ error: 'One or more meals are no longer available. Please refresh your cart.' }, { status: 400 })
  }

  const menuById = new Map(menuItems.map((item) => [item.id, item]))
  const orderItems = items.map((requested) => {
    const menuItem = menuById.get(requested.id)!
    return {
      menu_item_id: menuItem.id,
      item_name: menuItem.name,
      quantity: requested.quantity,
      unit_price_naira: menuItem.price_naira,
    }
  })

  const subtotalNaira = orderItems.reduce(
    (sum, item) => sum + item.unit_price_naira * item.quantity,
    0
  )
  const deliveryFeeNaira = zone.fee_naira
  const totalNaira = subtotalNaira + deliveryFeeNaira

  if (
    !Number.isSafeInteger(subtotalNaira) ||
    subtotalNaira <= 0 ||
    !Number.isSafeInteger(deliveryFeeNaira) ||
    deliveryFeeNaira < 0 ||
    !Number.isSafeInteger(totalNaira) ||
    totalNaira > Math.floor(Number.MAX_SAFE_INTEGER / 100)
  ) {
    return NextResponse.json({ error: 'The order total is invalid. Please contact FOODLUXE.' }, { status: 500 })
  }

  const paymentReference = 'FLX-' + randomUUID()
  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({
      user_id: authData.user.id,
      customer_name: customerName,
      customer_email: authData.user.email,
      phone,
      delivery_address: deliveryAddress,
      shipping_type: 'local_rider',
      delivery_notes: deliveryNotes || null,
      zone_id: zone.id,
      subtotal_naira: subtotalNaira,
      delivery_fee_naira: deliveryFeeNaira,
      total_naira: totalNaira,
      status: 'pending_payment',
      payment_status: 'unpaid',
      payment_reference: paymentReference,
    })
    .select('id, order_number')
    .single()

  if (orderError || !order) {
    console.error('[checkout] Could not create order:', orderError?.message)
    return NextResponse.json({ error: 'We could not create your order. Please try again.' }, { status: 500 })
  }

  const { error: itemsError } = await admin.from('order_items').insert(
    orderItems.map((item) => ({ ...item, order_id: order.id }))
  )

  if (itemsError) {
    console.error('[checkout] Could not create order items:', itemsError.message)
    await removeIncompleteOrder(admin, order.id)
    return NextResponse.json({ error: 'We could not save the meals in your order. Please try again.' }, { status: 500 })
  }

  const { error: historyError } = await admin.from('order_status_history').insert({
    order_id: order.id,
    status: 'pending_payment',
    note: 'Order created; awaiting Paystack payment.',
  })

  if (historyError) {
    console.error('[checkout] Could not create order history:', historyError.message)
    await removeIncompleteOrder(admin, order.id)
    return NextResponse.json({ error: 'We could not finish saving your order. Please try again.' }, { status: 500 })
  }

  let paymentResponse: Response
  try {
    paymentResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + paystackSecretKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: authData.user.email,
        amount: totalNaira * 100,
        currency: 'NGN',
        reference: paymentReference,
        callback_url: callbackUrl,
        metadata: {
          order_id: order.id,
          order_number: String(order.order_number),
        },
      }),
      cache: 'no-store',
    })
  } catch (error) {
    console.error('[checkout] Could not reach Paystack:', error)
    return NextResponse.json({ error: 'We could not connect to Paystack. Your order remains unpaid; please try again or contact FOODLUXE before placing the order again.' }, { status: 502 })
  }

  const paymentResult = (await paymentResponse.json().catch(() => null)) as PaystackInitializeResponse | null
  const authorizationUrl = paymentResult?.data?.authorization_url
  if (!paymentResponse.ok || !paymentResult?.status || !authorizationUrl || paymentResult.data?.reference !== paymentReference) {
    console.error('[checkout] Paystack did not initialize payment:', paymentResult?.message ?? paymentResponse.statusText)
    return NextResponse.json({ error: 'Paystack could not start payment. Your order remains unpaid; check the test key and contact FOODLUXE before placing the order again.' }, { status: 502 })
  }

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.order_number,
    authorizationUrl,
    subtotalNaira,
    deliveryFeeNaira,
    totalNaira,
  })
}
