'use client'

import { useCallback, useMemo } from 'react'
import { getPublicApiV1Base } from '@/lib/api-base-url'

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

/** API client for public share pages — no auth, only tenant domain header. */
export function useSharedApiClient() {
  const request = useCallback(async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
    const { method = 'GET', body, headers: extraHeaders = {} } = options

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...extraHeaders,
    }
    if (typeof window !== 'undefined') {
      headers['X-Agency-Domain'] = window.location.hostname
    }

    const res = await fetch(`${getPublicApiV1Base()}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(error.message || `API Error: ${res.status}`)
    }

    if (res.status === 204) return undefined as T
    return res.json() as Promise<T>
  }, [])

  return useMemo(
    () => ({
      get: <T>(path: string, headers?: Record<string, string>) => request<T>(path, { method: 'GET', headers }),
      post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body }),
      patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body }),
      put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body }),
      delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
    }),
    [request],
  )
}
