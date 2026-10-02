import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/server'
import { CheckoutForm } from './checkout-form'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ payment?: string }> }) {
  const supabase = await createClient()
  const { data, error: authError } = await supabase.auth.getUser()

  if (authError || !data.user) {
    redirect('/login?next=%2Fcheckout')
  }

  const { data: zones, error: zonesError } = await supabase
    .from('delivery_zones')
    .select('id, name, fee_naira, estimated_minutes')
    .eq('is_active', true)
    .order('name')

  const query = await searchParams
  const paymentNotice = ['not-complete', 'verification-error', 'unverified'].includes(query.payment ?? '') ? query.payment : query.payment === 'setup' ? 'setup' : undefined

  const metadataName = data.user.user_metadata?.full_name
  const initialName = typeof metadataName === 'string' ? metadataName : ''

  return (
    <main className='lux-page min-h-screen bg-stone-950 px-5 py-8 text-amber-50 sm:px-8 md:px-12'>
      <header className='site-header compact-header mb-10'>
        <Link href='/' aria-label='FOODLUXE home'>
          <Image src='/foodluxe-logo.png' alt='FOODLUXE' width={400} height={229} className='brand-logo-image' />
        </Link>
        <p className='mt-1 text-sm text-amber-100/65'>Review your order and delivery details</p>
      </header>
      <CheckoutForm
        zones={zones ?? []}
        initialName={initialName}
        email={data.user.email ?? ''}
        zonesUnavailable={Boolean(zonesError)}
        paymentNotice={paymentNotice}
      />
    </main>
  )
}
