import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminUserId } from '@/lib/admin-users'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/api/notifications/dispatch(.*)',
  '/pricing',
  '/privacy',
  '/terms',
])

const isAppRoute = createRouteMatcher(['/app(.*)'])
const isAdminRoute = createRouteMatcher(['/app/admin(.*)', '/api/admin(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  const { pathname } = req.nextUrl

  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  if (isAdminRoute(req)) {
    if (!userId) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('redirect_url', req.url)
      return NextResponse.redirect(signInUrl)
    }

    if (!isAdminUserId(userId)) {
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/', req.url))
    }

    return NextResponse.next()
  }

  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
  }

  if (isAppRoute(req)) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: user } = await supabase
        .from('users')
        .select('subscription_status')
        .eq('clerk_id', userId)
        .single()

      const validStatuses = ['active', 'trialing']
      if (!user || !validStatuses.includes(user.subscription_status)) {
        return NextResponse.redirect(new URL('/subscribe', req.url))
      }
    } catch {
      // Let traffic through if the subscription lookup fails unexpectedly.
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
