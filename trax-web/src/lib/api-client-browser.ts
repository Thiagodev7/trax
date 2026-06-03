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
import { useCallback, useMemo } from 'react'
import { getPublicApiV1Base } from '@/lib/api-base-url'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  /** Timeout da requisição (ex.: sync RD pode levar vários minutos) */
  timeoutMs?: number
}

export function useApiClient() {
  const { data: session, update } = useSession()
  const accessToken = session?.accessToken

  const request = useCallback(
    async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
      const { method = 'GET', body, headers: extraHeaders = {}, timeoutMs } = options

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
      const fetchInit: RequestInit = {
        method,
        headers: buildHeaders(token),
        body: body !== undefined ? JSON.stringify(body) : undefined,
        ...(timeoutMs ? { signal: AbortSignal.timeout(timeoutMs) } : {}),
      }
      let res = await fetch(`${getPublicApiV1Base()}${path}`, fetchInit)

      if (res.status === 401 && update) {
        const updated = await update()
        const newToken = updated?.accessToken
        if (newToken && newToken !== token) {
          token = newToken
          res = await fetch(`${getPublicApiV1Base()}${path}`, {
            ...fetchInit,
            headers: buildHeaders(token),
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

  return useMemo(
    () => ({
      get: <T>(path: string, headers?: Record<string, string>) =>
        request<T>(path, { method: 'GET', headers }),
      post: <T>(path: string, body: unknown, options?: { timeoutMs?: number }) =>
        request<T>(path, { method: 'POST', body, ...options }),
      patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body }),
      put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body }),
      delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
    }),
    [request],
  )
}
