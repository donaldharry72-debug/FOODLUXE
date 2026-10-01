'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createClient } from '../lib/supabase/client'

const supabase = createClient()

export function AuthStatus() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null)
    router.refresh()
  }

  if (!user) {
    return (
      <a href='/login' className='rounded-full border border-amber-300/40 px-4 py-2 text-sm text-amber-100 transition hover:bg-amber-300/10'>
        Sign in
      </a>
    )
  }

  return (
    <div className='flex items-center gap-3 text-sm'>
      <span className='hidden text-amber-100/80 sm:inline'>{user.email}</span>
      <button onClick={handleSignOut} className='rounded-full border border-amber-300/40 px-4 py-2 text-amber-100 transition hover:bg-amber-300/10'>
        Sign out
      </button>
    </div>
  )
}
