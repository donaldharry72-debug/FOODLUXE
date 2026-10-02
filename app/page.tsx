import { AuthStatus } from './auth-status'
import { AddToCartButton, CartLink } from './cart/cart-controls'
import { createClient } from '../lib/supabase/server'
import Image from 'next/image'
import { menuImageByName } from '../lib/menu-images'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createClient()
  const { data: items, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_available', true)
    .order('category')

  if (error) return <main className='lux-page min-h-screen p-8 text-red-200'>Could not load menu: {error.message}</main>

  const categories = [...new Set((items ?? []).map((item) => item.category))]
  const naira = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' })

  return (
    <main className='lux-page menu-page min-h-screen bg-stone-950 p-5 text-amber-50 sm:p-7 md:p-12'>
      <header className='site-header mb-12 flex items-start justify-between gap-4'>
        <div>
          <h1 className='m-0'>
            <Image src='/foodluxe-logo.png' alt='FOODLUXE' width={480} height={274} loading='eager' className='brand-logo-image' />
          </h1>
          <p className='mt-1 text-amber-100/70'>Where luxury meets affordability</p>
        </div>
        <div className='flex items-center gap-2 sm:gap-3'><CartLink /><AuthStatus /></div>
      </header>
      {categories.map((category) => (
        <section key={category} className='menu-section mb-10'>
          <h2 className='mb-4 font-serif text-2xl'>{category}</h2>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {items!.filter((item) => item.category === category).map((item) => (
              <article key={item.id} className='menu-card group'>
                <div className='menu-photo'>
                  <Image
                    src={menuImageByName[item.name] || item.image_url || menuImageByName['Smoky Party Jollof Royale']}
                    alt={item.name}
                    fill
                    unoptimized
                    sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                    className='object-cover'
                  />
                </div>
                <div className='menu-card-content'>
                  <h3 className='font-semibold'>{item.name}</h3>
                  <p className='text-sm text-amber-100/70'>{item.description}</p>
                  <p className='mt-2 text-amber-400'>{naira.format(item.price_naira)}</p>
                  <AddToCartButton product={{ id: item.id, name: item.name, price_naira: item.price_naira }} />
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
      <footer className='border-t border-amber-400/20 pt-6 text-sm text-amber-100/60'>
        <a className='photo-credit-link underline' href='/photo-credits'>Food photo credits</a>
      </footer>
    </main>
  )
}
