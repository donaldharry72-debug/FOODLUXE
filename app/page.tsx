import { supabase } from '../lib/client'
export const dynamic = 'force-dynamic'

export default async function Home() {
  const { data: items, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_available', true)
    .order('category')

  if (error) return <p className="p-8 text-red-500">Could not load menu: {error.message}</p>

  const categories = [...new Set((items ?? []).map((i) => i.category))]

  return (
    <main className="min-h-screen bg-stone-950 p-6 text-amber-50 md:p-12">
      <h1 className="font-serif text-4xl text-amber-400">FOODLUXE</h1>
      <p className="mb-10 text-amber-100/70">Where luxury meets affordability</p>
      {categories.map((cat) => (
        <section key={cat} className="mb-10">
          <h2 className="mb-4 font-serif text-2xl">{cat}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items!.filter((i) => i.category === cat).map((item) => (
              <div key={item.id} className="rounded-xl border border-amber-400/30 p-4">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm text-amber-100/70">{item.description}</p>
                <p className="mt-2 text-amber-400">₦{item.price_naira.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}