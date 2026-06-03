import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  locales: ['en', 'te', 'hi', 'ta'],
  defaultLocale: 'en',
  localePrefix: 'always',
  pathnames: {
    '/': '/',
    '/how-it-works': {
      en: '/how-it-works',
      te: '/edi-chesthundi',
      hi: '/yah-kaise-kaam-karta-hai',
      ta: '/idhu-yevadukatum'
    }
  }
})

export const config = {
  matcher: [
    '/',
    '/(en|te|hi|ta)/:path*',
    '/((?!_next|_vercel|.*\\..*).*)',
  ],
}
