import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_USER_ID = 'user_3Bk4ej2PiqeNmdL7Y9obghgEAXt'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/pricing',
  '/privacy',
  '/terms',
])

const isAppRoute = createRouteMatcher(['/app(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  const { pathname } = req.nextUrl

  // Block /admin at the edge — redirect non-admins immediately
  if (pathname.startsWith('/admin')) {
    if (userId !== ADMIN_USER_ID) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

  // Public routes — always allow
  if (isPublicRoute(req)) return NextResponse.next()

  // Not logged in → sign-in
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
  }

  // Logged in + hitting /app/* → check subscription
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
      // Supabase check failed — let through rather than locking everyone out
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
}