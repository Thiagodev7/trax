'use client'

import { useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { getPublicApiBaseUrl } from '@/lib/api-base-url'
import { getAdminClientBaseUrl } from '@/lib/admin-api'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
}

export function useAdminApi() {
  const { data: session } = useSession()
  const token = (session as { accessToken?: string })?.accessToken
  const baseUrl = getAdminClientBaseUrl()

  const request = useCallback(
    async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
      const { method = 'GET', body } = options

      if (!token) {
        throw new Error('Sessão expirada. Faça login novamente.')
      }

      let res: Response
      try {
        res = await fetch(`${baseUrl}${path}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: body !== undefined ? JSON.stringify(body) : undefined,
        })
      } catch {
        throw new Error(
          `Não foi possível conectar à API (${getPublicApiBaseUrl()}). Verifique sua conexão.`,
        )
      }

      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }))
        throw new Error(
          Array.isArray(error.message)
            ? error.message.join(', ')
            : error.message || `Erro ${res.status}`,
        )
      }

      if (res.status === 204) return undefined as T
      return res.json()
    },
    [baseUrl, token],
  )

  return {
    get: <T,>(path: string) => request<T>(path),
    post: <T,>(path: string, body: unknown) => request<T>(path, { method: 'POST', body }),
    patch: <T,>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body }),
    delete: <T,>(path: string) => request<T>(path, { method: 'DELETE' }),
  }
}
