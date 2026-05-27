/**
 * API Client para uso em Client Components (navegador).
 * Diferente do api-client.ts (Server-side), este lê o accessToken
 * via useSession() do next-auth.
 *
 * Uso:
 *   const apiClient = useApiClient()
 *   await apiClient.post('/clients', body)
 */
'use client'

import { useSession } from 'next-auth/react'
import { useCallback } from 'react'
import { getPublicApiV1Base } from '@/lib/api-base-url'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

export function useApiClient() {
  const { data: session, update } = useSession()
  const accessToken = session?.accessToken

  const request = useCallback(
    async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
      const { method = 'GET', body, headers: extraHeaders = {} } = options

      const buildHeaders = (token?: string): Record<string, string> => {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...extraHeaders,
        }
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
        if (typeof window !== 'undefined') {
          headers['X-Agency-Domain'] = window.location.hostname
        }
        return headers
      }

      let token = accessToken
      let res = await fetch(`${getPublicApiV1Base()}${path}`, {
        method,
        headers: buildHeaders(token),
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })

      if (res.status === 401 && update) {
        const updated = await update()
        const newToken = updated?.accessToken
        if (newToken && newToken !== token) {
          token = newToken
          res = await fetch(`${getPublicApiV1Base()}${path}`, {
            method,
            headers: buildHeaders(token),
            body: body !== undefined ? JSON.stringify(body) : undefined,
          })
        }
      }

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }))
        throw new Error(error.message || `API Error: ${res.status}`)
      }

      if (res.status === 204) return undefined as T
      return res.json() as Promise<T>
    },
    [accessToken, update],
  )

  return {
    get: <T>(path: string, headers?: Record<string, string>) =>
      request<T>(path, { method: 'GET', headers }),
    post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body }),
    patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body }),
    put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body }),
    delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  }
}
