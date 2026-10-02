'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'
import { getSafeNextPath } from '../../lib/auth-redirect'

const supabase = createClient()

export function LoginForm({ initialError = '' }: { initialError?: string }) {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState(initialError)
  const [notice, setNotice] = useState('')

  function getNextPath() {
    return getSafeNextPath(new URLSearchParams(window.location.search).get('next'))
  }

  function getCallbackUrl() {
    const callback = new URL('/auth/callback', window.location.origin)
    callback.searchParams.set('next', getNextPath())
    return callback.toString()
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setErrorMessage('')
    setNotice('')

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    const fullName = String(formData.get('fullName') ?? '').trim()

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getCallbackUrl(),
          data: { full_name: fullName },
        },
      })

      setBusy(false)
      if (error) {
        setErrorMessage(error.message)
      } else if (data.session) {
        router.replace(getNextPath())
        router.refresh()
      } else {
        setNotice('Account created. Check your email to confirm your address, then sign in.')
      }
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)

    if (error) {
      setErrorMessage(error.message)
      return
    }

    router.replace(getNextPath())
    router.refresh()
  }

  async function handleGoogleSignIn() {
    setBusy(true)
    setErrorMessage('')
    setNotice('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: getCallbackUrl() },
    })

    if (error) {
      setBusy(false)
      setErrorMessage(error.message)
    }
  }

  const inputClass =
    'lux-input w-full rounded-lg border border-amber-100/20 bg-stone-900 px-4 py-3 text-amber-50 outline-none transition focus:border-amber-400'

  return (
    <section className='auth-card login-card w-full max-w-md rounded-2xl border border-amber-100/15 bg-stone-950/90 p-6 shadow-2xl shadow-black/30 sm:p-8'>
      <Link href='/' className='text-sm text-amber-200/80 hover:text-amber-100'>← Back to menu</Link>
      <h1 className='mt-6 font-serif text-3xl text-amber-300'>
        {isSignUp ? 'Create your account' : 'Welcome back'}
      </h1>
      <p className='mt-2 text-sm text-amber-50/65'>
        {isSignUp ? 'Join FOODLUXE for a taste of something special.' : 'Sign in to continue to FOODLUXE.'}
      </p>

      <button
        type='button'
        onClick={handleGoogleSignIn}
        disabled={busy}
        className='mt-6 w-full rounded-lg border border-amber-100/25 px-4 py-3 font-medium text-amber-50 transition hover:border-amber-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60'
      >
        Continue with Google
      </button>

      <div className='my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-amber-50/40'>
        <span className='h-px flex-1 bg-amber-100/15' />
        or use email
        <span className='h-px flex-1 bg-amber-100/15' />
      </div>

      <form onSubmit={handleEmailSubmit} className='space-y-4'>
        {isSignUp && (
          <label className='block space-y-2 text-sm text-amber-50/80'>
            <span>Your name</span>
            <input name='fullName' type='text' autoComplete='name' required className={inputClass} />
          </label>
        )}
        <label className='block space-y-2 text-sm text-amber-50/80'>
          <span>Email address</span>
          <input name='email' type='email' autoComplete='email' required className={inputClass} />
        </label>
        <label className='block space-y-2 text-sm text-amber-50/80'>
          <span>Password</span>
          <input
            name='password'
            type='password'
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            minLength={6}
            required
            className={inputClass}
          />
        </label>

        {errorMessage && <p role='alert' className='rounded-lg bg-red-950/70 p-3 text-sm text-red-200'>{errorMessage}</p>}
        {notice && <p role='status' className='rounded-lg bg-emerald-950/70 p-3 text-sm text-emerald-200'>{notice}</p>}

        <button
          type='submit'
          disabled={busy}
          className='w-full rounded-lg bg-amber-400 px-4 py-3 font-semibold text-stone-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60'
        >
          {busy ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in with email'}
        </button>
      </form>

      <p className='mt-6 text-center text-sm text-amber-50/65'>
        {isSignUp ? 'Already have an account?' : 'New to FOODLUXE?'}{' '}
        <button
          type='button'
          onClick={() => {
            setIsSignUp(!isSignUp)
            setErrorMessage('')
            setNotice('')
          }}
          className='font-medium text-amber-300 underline decoration-amber-300/40 underline-offset-4 hover:text-amber-200'
        >
          {isSignUp ? 'Sign in' : 'Create an account'}
        </button>
      </p>
    </section>
  )
}
