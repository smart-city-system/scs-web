import { customMiddleware } from './lib/auth'
import { createRouteMatcher } from './lib/utils'

const isProtectedRoute = createRouteMatcher(['/admin(.*)'])

export default customMiddleware(
  async (auth, req) => {
    if (isProtectedRoute(req)) {
      console.log('protected')
      return auth.protect()
    }
  },
  { signInUrl: '/sign-in' },
)

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
