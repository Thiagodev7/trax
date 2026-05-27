/**
 * Base URL pública da API (sem /api/v1).
 * No browser usa same-origin (/api/v1 via rewrite do Next.js).
 * Em SSR/server usa API_URL ou NEXT_PUBLIC_API_URL.
 */
export function getPublicApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  const serverUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'
  return serverUrl.replace(/\/api\/?$/, '')
}

export function getPublicApiV1Base(): string {
  return `${getPublicApiBaseUrl()}/api/v1`
}
