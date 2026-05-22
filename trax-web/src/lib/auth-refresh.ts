/**
 * Renova o access token da API usando o refresh token armazenado na sessão JWT.
 */
export async function refreshAccessToken(token: Record<string, unknown>) {
  const refreshToken = token.refreshToken as string | undefined
  const agencyDomain = (token.agencyDomain as string) || 'localhost'

  if (!refreshToken) {
    return { ...token, error: 'RefreshTokenError' as const }
  }

  try {
    const res = await fetch(`${process.env.API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Agency-Domain': agencyDomain,
      },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    })

    if (!res.ok) {
      return { ...token, error: 'RefreshTokenError' as const }
    }

    const data = (await res.json()) as { accessToken: string; expiresIn: number }

    return {
      ...token,
      accessToken: data.accessToken,
      accessTokenExpires: Date.now() + data.expiresIn * 1000,
      error: undefined,
    }
  } catch {
    return { ...token, error: 'RefreshTokenError' as const }
  }
}

/** Renova se faltar menos de 1 minuto para expirar */
export function shouldRefreshAccessToken(token: Record<string, unknown>): boolean {
  if (token.error === 'RefreshTokenError') return false
  if (!token.refreshToken) return false
  const expiresAt = token.accessTokenExpires as number | undefined
  if (!expiresAt) return true
  return Date.now() >= expiresAt - 60_000
}
