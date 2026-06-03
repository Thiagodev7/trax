/**
 * Base URL pública da API (sem /api/v1).
 *
 * No browser: prefere NEXT_PUBLIC_API_URL quando definida — evita o rewrite do
 * Next.js, que derruba conexões longas (ex.: sync RD Station com enrich).
 * Sem NEXT_PUBLIC_API_URL, usa same-origin (/api/v1 via rewrite).
 *
 * Em SSR/server: API_URL ou NEXT_PUBLIC_API_URL.
 */
function normalizeApiHost(url: string): string {
  return url.replace(/\/api\/?$/, '').replace(/\/$/, '')
}

/** Dev local: web :3001 → API :3000 direto (rewrite do Next derruba sync longo). */
function getBrowserDirectApiBase(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (fromEnv) {
    return normalizeApiHost(fromEnv)
  }

  if (typeof window === 'undefined') return null

  const { hostname, port } = window.location
  const isLocalPortal =
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === '127.0.0.1'

  if (!isLocalPortal) return null

  // Next dev (trax-web) costuma rodar na 3001; API na 3000
  if (port === '3001' || (port === '' && hostname !== 'localhost')) {
    const apiPort = process.env.NEXT_PUBLIC_TRAX_API_PORT ?? '3000'
    return `http://127.0.0.1:${apiPort}`
  }

  return null
}

export function getPublicApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const direct = getBrowserDirectApiBase()
    if (direct) return direct
    return window.location.origin
  }

  const serverUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'
  return normalizeApiHost(serverUrl)
}

export function getPublicApiV1Base(): string {
  return `${getPublicApiBaseUrl()}/api/v1`
}
