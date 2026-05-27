import { NextRequest, NextResponse } from 'next/server'
import { getRootDomains } from '@/lib/domains'

const ALWAYS_ALLOWED = ['admin', 'api', 'www']

/**
 * Endpoint de verificação chamado pelo Caddy antes de emitir certificados via on-demand TLS.
 * Caddy envia: GET /api/tls-verify?domain=slug.traxsolucoes.com.br
 * Retorna 200 se o domínio é válido, 403 caso contrário.
 */
export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get('domain') ?? ''
  const rootDomains = getRootDomains().filter((root) => root !== 'localhost' && root !== '127.0.0.1')

  const rootDomain = rootDomains.find((root) => domain.endsWith(`.${root}`))
  if (!rootDomain) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const subdomain = domain.slice(0, domain.length - rootDomain.length - 1)

  if (!subdomain || subdomain.includes('.')) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  if (ALWAYS_ALLOWED.includes(subdomain)) {
    return new NextResponse('OK', { status: 200 })
  }

  try {
    const apiUrl = process.env.API_URL ?? 'http://api:3000'
    const res = await fetch(`${apiUrl}/api/v1/onboarding/check-slug?slug=${encodeURIComponent(subdomain)}`, {
      cache: 'no-store',
    })

    if (res.ok) {
      const data = await res.json()
      if (data.available === false) {
        return new NextResponse('OK', { status: 200 })
      }
    }
  } catch {
    // Em caso de falha na API, nega por segurança
  }

  return new NextResponse('Forbidden', { status: 403 })
}
