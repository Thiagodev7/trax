import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    error?: 'RefreshTokenError'
    user: {
      id: string
      email?: string | null
      name?: string | null
      image?: string | null
      avatarUrl?: string | null
      role?: string
      agencyId?: string
      agency?: unknown
      clients?: unknown
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: string
    agencyId?: string
    agency?: unknown
    clients?: unknown
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
    agencyDomain?: string
    error?: 'RefreshTokenError'
  }
}
