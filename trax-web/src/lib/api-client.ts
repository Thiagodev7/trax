import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

const API_URL = process.env.API_URL!

/**
 * Faz uma chamada autenticada à API NestJS.
 * Usa o accessToken da sessão do Auth.js.
 * Para uso em Server Components e Server Actions.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit & { domain?: string } = {},
): Promise<T> {
  const session = await auth()
  const { domain, ...fetchOptions } = options

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  }

  if ((session as any)?.accessToken) {
    ;(headers as Record<string, string>)['Authorization'] =
      `Bearer ${(session as any).accessToken}`
  }

  if (domain) {
    ;(headers as Record<string, string>)['X-Agency-Domain'] = domain
  }

  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...fetchOptions,
    headers,
  })

  if (!res.ok) {
    if (res.status === 401) {
      redirect('/logout')
    }
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(error.message || `API Error: ${res.status}`)
  }

  if (res.status === 204) return undefined as T
  return res.json()
}
