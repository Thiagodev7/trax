import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const sessionError = (req.auth as { error?: string } | null)?.error
  const isLoggedIn = !!req.auth && sessionError !== 'RefreshTokenError'
  const pathname = req.nextUrl.pathname

  const isLoginPage = pathname === '/login'
  const isSharePage = pathname.startsWith('/share/')
  const isApiRoute = pathname.startsWith('/api/')

  // Permite acesso público a páginas específicas
  if (isSharePage || isApiRoute) return NextResponse.next()

  // Redireciona usuário não autenticado para login
  if (!isLoggedIn && !isLoginPage) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Usuário já logado tentando acessar login
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
