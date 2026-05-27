import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ROOT_DOMAINS = ['traxsolucoes.com.br', 'traxsolucoes.com']
const ADMIN_SUBDOMAINS = ['admin']

/** URL absoluta preservando o host real da requisição (subdomínio da agência, admin, etc.) */
function buildRequestUrl(req: NextRequest, pathname: string, query?: Record<string, string>) {
  const host =
    req.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ??
    req.headers.get('host')?.replace(/:\d+$/, '') ??
    req.nextUrl.host
  const proto = req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', '')
  const url = new URL(`${proto}://${host}${pathname}`)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value)
    }
  }
  return url
}

function buildAdminPanelUrl(req: NextRequest, pathname: string) {
  const { hostname } = getHostInfo(req)
  const adminHost = hostname.endsWith('.com.br') ? 'admin.traxsolucoes.com.br' : 'admin.traxsolucoes.com'
  const proto = req.headers.get('x-forwarded-proto') ?? 'https'
  return new URL(`${proto}://${adminHost}${pathname}`)
}

function buildAdminUrl(req: NextRequest, pathname: string) {
  return buildRequestUrl(req, pathname)
}

function getHostInfo(req: NextRequest) {
  const host = req.headers.get('host') ?? ''
  // Strip port for local dev
  const hostname = host.replace(/:\d+$/, '')

  const isRootDomain = ROOT_DOMAINS.includes(hostname)

  const subdomain = (() => {
    for (const root of ROOT_DOMAINS) {
      if (hostname.endsWith(`.${root}`)) {
        return hostname.slice(0, hostname.length - root.length - 1)
      }
    }
    return null
  })()

  const isAdminDomain = subdomain !== null && ADMIN_SUBDOMAINS.includes(subdomain)
  const isClientDomain = subdomain !== null && !ADMIN_SUBDOMAINS.includes(subdomain)
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'

  return { hostname, isRootDomain, isAdminDomain, isClientDomain, isLocalhost, subdomain }
}

export default auth((req) => {
  const { isRootDomain, isAdminDomain, isClientDomain, isLocalhost } = getHostInfo(req)
  const sessionError = (req.auth as { error?: string } | null)?.error
  const isLoggedIn = !!req.auth && sessionError !== 'RefreshTokenError'
  const isSuperAdmin = (req.auth?.user as any)?.isSuperAdmin === true
  const pathname = req.nextUrl.pathname

  const isApiRoute = pathname.startsWith('/api/')
  const isStaticAsset = pathname.startsWith('/_next/') || pathname.startsWith('/public/')

  if (isStaticAsset || isApiRoute) return NextResponse.next()

  // ── Landing page: domínio raiz (traxsolucoes.com.br / traxsolucoes.com) ──
  if (isRootDomain) {
    // Guard: já estamos em /landing/* internamente
    if (pathname.startsWith('/landing')) return NextResponse.next()
    // Rewrite internamente para /landing/* sem mudar a URL do browser
    const rewriteUrl = new URL(`/landing${pathname === '/' ? '' : pathname}`, req.url)
    return NextResponse.rewrite(rewriteUrl)
  }

  // ── Admin panel: admin.traxsolucoes.com(.br) ──
  if (isAdminDomain) {
    const isAdminLoginPage =
      pathname === '/admin-panel/login' || pathname === '/login'

    if (isAdminLoginPage) {
      if (pathname === '/login') {
        return NextResponse.redirect(buildAdminUrl(req, '/admin-panel/login'))
      }
      return NextResponse.next()
    }

    // Protege todas as rotas do admin: exige ser super-admin
    if (!isLoggedIn || !isSuperAdmin) {
      return NextResponse.redirect(buildAdminUrl(req, '/admin-panel/login'))
    }

    // Super-admin logado em / → dashboard admin
    if (pathname === '/') {
      return NextResponse.redirect(buildAdminUrl(req, '/admin-panel'))
    }

    // Demais rotas já usam prefixo /admin-panel no filesystem
    if (!pathname.startsWith('/admin-panel')) {
      return NextResponse.redirect(buildAdminUrl(req, `/admin-panel${pathname}`))
    }

    return NextResponse.next()
  }

  // ── Dashboard de cliente/agência: {slug}.traxsolucoes.com(.br) ──
  // Também serve localhost para desenvolvimento local
  if (isClientDomain || isLocalhost) {
    const isLoginPage = pathname === '/login'
    const isSignupPage = pathname === '/signup'
    const isSharePage = pathname.startsWith('/share/')

    if (isSharePage || isSignupPage) return NextResponse.next()

    // Bloqueia super-admin de acessar o dashboard de agência
    if (isLoggedIn && isSuperAdmin && !isLoginPage) {
      return NextResponse.redirect(buildAdminPanelUrl(req, '/admin-panel'))
    }

    if (!isLoggedIn && !isLoginPage) {
      return NextResponse.redirect(
        buildRequestUrl(req, '/login', { callbackUrl: pathname }),
      )
    }

    if (isLoggedIn && isLoginPage) {
      return NextResponse.redirect(buildRequestUrl(req, '/'))
    }

    return NextResponse.next()
  }

  // Fallback: deixa passar (ex: domínio customizado de agência)
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
