import { menuImageCredits } from '../../lib/menu-images'
import Link from 'next/link'

export const metadata = { title: 'Food photo credits | FOODLUXE' }

export default function PhotoCreditsPage() {
  return (
    <main className='lux-page mx-auto min-h-screen max-w-4xl bg-stone-950 px-6 py-12 text-amber-50'>
      <Link className='text-amber-400 underline' href='/'>← Back to menu</Link>
      <h1 className='mt-6 font-serif text-4xl text-amber-400'>Food photo credits</h1>
      <p className='mt-3 max-w-2xl text-amber-100/75'>
        Thanks to the photographers who shared their work. Each source link opens the original
        file page, where the photographer and that image’s license are listed. Images are shown
        cropped to fit the menu cards; the originals remain on their source sites.
      </p>
      <ul className='mt-8 space-y-3'>
        {menuImageCredits.map(({ dish, source }) => (
            <li key={dish} className='lux-surface p-4'>
            <span className='font-medium'>{dish}</span>
            <span className='text-amber-100/70'> — photo: </span>
            <a className='text-amber-400 underline' href={source} target='_blank' rel='noreferrer'>
              photographer and license details
            </a>
          </li>
        ))}
      </ul>
      <p className='mt-8 text-sm text-amber-100/60'>
        The Wikimedia Commons photos have individual licenses; please check each linked file page
        before reusing an image elsewhere. The FOODLUXE site design and code are separate from
        those photo licenses.
      </p>
    </main>
  )
}
