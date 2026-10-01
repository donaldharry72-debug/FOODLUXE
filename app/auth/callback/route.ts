import { NextRequest, NextResponse } from 'next/server'
import { getSafeNextPath } from '../../../lib/auth-redirect'
import { createClient } from '../../../lib/supabase/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const nextPath = getSafeNextPath(request.nextUrl.searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(nextPath, request.nextUrl.origin))
    }
  }

  const loginUrl = new URL('/login', request.nextUrl.origin)
  loginUrl.searchParams.set('error', 'Could not confirm your sign-in. Please try again.')
  return NextResponse.redirect(loginUrl)
}
