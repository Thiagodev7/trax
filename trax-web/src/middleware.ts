import { auth } from '@/lib/auth'
import {
  buildAdminPanelAbsoluteUrl,
  isAdminHost,
  isClientHost,
  isRootDomain,
} from '@/lib/domains'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/** URL absoluta preservando o host real da requisição (subdomínio da agência, admin, etc.) */
function buildRequestUrl(req: NextRequest, pathname: string, query?: Record<string, string>) {
  const host =
    req.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ??
    req.headers.get('host') ??
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
  const host = req.headers.get('host') ?? req.nextUrl.host
  const portMatch = host.match(/:(\d+)$/)
  const port = portMatch?.[1] ?? null
  const proto = req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', '')
  return new URL(buildAdminPanelAbsoluteUrl(pathname, { proto, port }))
}

function buildAdminUrl(req: NextRequest, pathname: string) {
  return buildRequestUrl(req, pathname)
}

function getHostInfo(req: NextRequest) {
  const host = req.headers.get('host') ?? ''
  const hostname = host.replace(/:\d+$/, '')

  const isRoot = isRootDomain(hostname)
  const isAdminDomain = isAdminHost(hostname)
  const isClientDomain = isClientHost(hostname)

  return {
    hostname,
    isRootDomain: isRoot,
    isAdminDomain,
    isClientDomain,
  }
}

export default auth((req) => {
  const { isRootDomain, isAdminDomain, isClientDomain } = getHostInfo(req)
  const sessionError = (req.auth as { error?: string } | null)?.error
  const isLoggedIn = !!req.auth && sessionError !== 'RefreshTokenError'
  const isSuperAdmin = (req.auth?.user as any)?.isSuperAdmin === true
  const pathname = req.nextUrl.pathname

  const isApiRoute = pathname.startsWith('/api/')
  const isStaticAsset = pathname.startsWith('/_next/') || pathname.startsWith('/public/')

  if (isStaticAsset || isApiRoute) return NextResponse.next()

  // ── Landing page: domínio raiz (traxsolucoes.com.br / localhost) ──
  if (isRootDomain) {
    if (pathname.startsWith('/landing')) return NextResponse.next()
    const rewriteUrl = new URL(`/landing${pathname === '/' ? '' : pathname}`, req.url)
    return NextResponse.rewrite(rewriteUrl)
  }

  // ── Admin panel: admin.{baseDomain} ──
  if (isAdminDomain) {
    const isAdminLoginPage =
      pathname === '/admin-panel/login' || pathname === '/login'

    if (isAdminLoginPage) {
      if (pathname === '/login') {
        return NextResponse.redirect(buildAdminUrl(req, '/admin-panel/login'))
      }
      return NextResponse.next()
    }

    if (!isLoggedIn || !isSuperAdmin) {
      return NextResponse.redirect(buildAdminUrl(req, '/admin-panel/login'))
    }

    if (pathname === '/') {
      return NextResponse.redirect(buildAdminUrl(req, '/admin-panel'))
    }

    if (!pathname.startsWith('/admin-panel')) {
      return NextResponse.redirect(buildAdminUrl(req, `/admin-panel${pathname}`))
    }

    return NextResponse.next()
  }

  // ── Dashboard de cliente/agência: {slug}.{baseDomain} ──
  if (isClientDomain) {
    const isLoginPage = pathname === '/login'
    const isSignupPage = pathname === '/signup'
    const isSharePage = pathname.startsWith('/share/')

    if (isSharePage || isSignupPage) return NextResponse.next()

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

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
