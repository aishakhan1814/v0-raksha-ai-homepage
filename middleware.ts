import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  locales: ['en', 'te', 'hi', 'ta'],
  defaultLocale: 'en',
  localePrefix: 'always',
})

export const config = {
  matcher: [
    '/',
    '/(te|hi|ta)/:path*',
    '/((?!_next|_vercel|.*\\..*).*)',
  ],
}
