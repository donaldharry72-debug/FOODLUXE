import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'
import { CheckoutForm } from './checkout-form'

export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
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

  const metadataName = data.user.user_metadata?.full_name
  const initialName = typeof metadataName === 'string' ? metadataName : ''

  return (
    <main className='min-h-screen bg-stone-950 px-5 py-8 text-amber-50 sm:px-8 md:px-12'>
      <header className='mb-10'>
        <a href='/' className='font-serif text-3xl text-amber-400'>FOODLUXE</a>
        <p className='mt-1 text-sm text-amber-100/65'>Review your order and delivery details</p>
      </header>
      <CheckoutForm
        zones={zones ?? []}
        initialName={initialName}
        email={data.user.email ?? ''}
        zonesUnavailable={Boolean(zonesError)}
      />
    </main>
  )
}
