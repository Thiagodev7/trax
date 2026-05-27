import { NextRequest, NextResponse } from 'next/server'

const ROOT_DOMAINS = ['traxsolucoes.com.br', 'traxsolucoes.com']
const ALWAYS_ALLOWED = ['admin', 'api', 'www']

/**
 * Endpoint de verificação chamado pelo Caddy antes de emitir certificados via on-demand TLS.
 * Caddy envia: GET /api/tls-verify?domain=slug.traxsolucoes.com.br
 * Retorna 200 se o domínio é válido, 403 caso contrário.
 */
export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get('domain') ?? ''

  // Valida que é um subdomínio dos nossos domínios raiz
  const rootDomain = ROOT_DOMAINS.find((root) => domain.endsWith(`.${root}`))
  if (!rootDomain) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const subdomain = domain.slice(0, domain.length - rootDomain.length - 1)

  // Subdomínios sem ponto (nível único) e válidos
  if (!subdomain || subdomain.includes('.')) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Subdomínios fixos sempre permitidos
  if (ALWAYS_ALLOWED.includes(subdomain)) {
    return new NextResponse('OK', { status: 200 })
  }

  // Para slugs de agências: valida via API se o slug existe
  try {
    const apiUrl = process.env.API_URL ?? 'http://api:3000'
    const res = await fetch(`${apiUrl}/api/v1/onboarding/check-slug?slug=${encodeURIComponent(subdomain)}`, {
      cache: 'no-store',
    })

    // check-slug retorna { available: true } se o slug NÃO existe
    // Precisamos do oposto: slug que JÁ existe = agência válida = emitir cert
    if (res.ok) {
      const data = await res.json()
      if (data.available === false) {
        // Slug está em uso = agência existe = emitir certificado
        return new NextResponse('OK', { status: 200 })
      }
    }
  } catch {
    // Em caso de falha na API, nega por segurança
  }

  return new NextResponse('Forbidden', { status: 403 })
}
