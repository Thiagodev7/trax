import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import { refreshAccessToken, shouldRefreshAccessToken } from '@/lib/auth-refresh'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    // ── Provider para agências/clientes (multi-tenant) ──
    Credentials({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
        domain: { label: 'Domain', type: 'text' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const domain = (credentials.domain as string) || 'localhost'

        try {
          const res = await fetch(`${process.env.API_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Agency-Domain': domain,
            },
            body: JSON.stringify({
              email: parsed.data.email,
              password: parsed.data.password,
            }),
          })

          if (!res.ok) return null

          const data = await res.json()

          const meRes = await fetch(`${process.env.API_URL}/api/v1/auth/me`, {
            headers: {
              Authorization: `Bearer ${data.accessToken}`,
              'X-Agency-Domain': domain,
            },
          })

          if (!meRes.ok) return null
          const me = await meRes.json()

          const expiresIn = (data.expiresIn as number) ?? 15 * 60

          return {
            id: me.id,
            email: me.email,
            name: me.name,
            role: me.role,
            agencyId: me.agencyId,
            agency: me.agency,
            clients: me.clients,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresIn,
            agencyDomain: domain,
            isSuperAdmin: false,
          }
        } catch {
          return null
        }
      },
    }),

    // ── Provider para o super-admin do SaaS ──
    Credentials({
      id: 'super-admin',
      name: 'super-admin',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        try {
          const res = await fetch(`${process.env.API_URL}/api/v1/super-admin/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: parsed.data.email,
              password: parsed.data.password,
            }),
          })

          if (!res.ok) return null
          const data = await res.json()

          return {
            id: data.id,
            email: data.email,
            name: data.name,
            role: 'SUPER_ADMIN',
            accessToken: data.accessToken,
            expiresIn: data.expiresIn ?? 15 * 60,
            isSuperAdmin: true,
          }
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    authorized() {
      // Roteamento e proteção por hostname ficam no middleware.ts
      return true
    },
    async jwt({ token, user }): Promise<any> {
      if (user) {
        const u = user as Record<string, unknown>
        const expiresIn = (u.expiresIn as number) ?? 15 * 60
        return {
          ...token,
          id: u.id as string,
          role: u.role,
          agencyId: u.agencyId,
          agency: u.agency,
          clients: u.clients,
          accessToken: u.accessToken,
          refreshToken: u.refreshToken,
          accessTokenExpires: Date.now() + expiresIn * 1000,
          agencyDomain: u.agencyDomain,
          isSuperAdmin: u.isSuperAdmin ?? false,
          error: undefined,
        }
      }

      // Super-admin: não usa refresh token (token de vida longa)
      if (token.isSuperAdmin) return token

      if (shouldRefreshAccessToken(token as Record<string, unknown>)) {
        return refreshAccessToken(token as Record<string, unknown>)
      }

      return token
    },
    session({ session, token }) {
      const u = session.user as any
      u.id = token.id as string
      u.role = token.role as string
      u.agencyId = token.agencyId as string
      u.agency = token.agency as unknown
      u.clients = token.clients as unknown
      u.isSuperAdmin = token.isSuperAdmin as boolean
      ;(session as { accessToken?: string; error?: string }).accessToken =
        token.accessToken as string
      if (token.error === 'RefreshTokenError') {
        ;(session as { error?: string }).error = 'RefreshTokenError'
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
})
