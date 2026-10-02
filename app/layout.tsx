import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'FOODLUXE',
  description: 'Where luxury meets affordability.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang='en' className='h-full antialiased'>
      <body className='min-h-full flex flex-col'><Providers>{children}</Providers></body>
    </html>
  )
}
