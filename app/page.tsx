import { AuthStatus } from './auth-status'
import { AddToCartButton, CartLink } from './cart/cart-controls'
import { createClient } from '../lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createClient()
  const { data: items, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_available', true)
    .order('category')

  if (error) return <p className='p-8 text-red-500'>Could not load menu: {error.message}</p>

  const categories = [...new Set((items ?? []).map((item) => item.category))]
  const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })

  return (
    <main className='min-h-screen bg-stone-950 p-6 text-amber-50 md:p-12'>
      <header className='mb-10 flex items-start justify-between gap-4'>
        <div>
          <h1 className='font-serif text-4xl text-amber-400'>FOODLUXE</h1>
          <p className='mt-1 text-amber-100/70'>Where luxury meets affordability</p>
        </div>
        <div className='flex items-center gap-2 sm:gap-3'><CartLink /><AuthStatus /></div>
      </header>
      {categories.map((category) => (
        <section key={category} className='mb-10'>
          <h2 className='mb-4 font-serif text-2xl'>{category}</h2>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {items!.filter((item) => item.category === category).map((item) => (
              <article key={item.id} className='rounded-xl border border-amber-400/30 p-4'>
                <h3 className='font-semibold'>{item.name}</h3>
                <p className='text-sm text-amber-100/70'>{item.description}</p>
                <p className='mt-2 text-amber-400'>{naira.format(item.price_naira)}</p>
                <AddToCartButton product={{ id: item.id, name: item.name, price_naira: item.price_naira }} />
              </article>
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}
