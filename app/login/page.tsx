import { LoginForm } from './login-form'

export const metadata = {
  title: 'Sign in | FOODLUXE',
  description: 'Sign in or create your FOODLUXE account.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main className='flex min-h-screen items-center justify-center bg-stone-950 px-4 py-12 text-amber-50'>
      <div className='pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-stone-950 to-stone-950' />
      <LoginForm initialError={error} />
    </main>
  )
}
