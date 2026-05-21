import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
        domain: { label: 'Domain', type: 'text' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const domain = (credentials.domain as string) || 'agenciademo.trax.app'

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

          // Busca o perfil completo do usuário
          const meRes = await fetch(`${process.env.API_URL}/api/v1/auth/me`, {
            headers: {
              Authorization: `Bearer ${data.accessToken}`,
              'X-Agency-Domain': domain,
            },
          })

          if (!meRes.ok) return null
          const me = await meRes.json()

          return {
            id: me.id,
            email: me.email,
            name: me.name,
            role: me.role,
            agencyId: me.agencyId,
            agency: me.agency,
            clients: me.clients,
            accessToken: data.accessToken,
          }
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = (user as any).role
        token.agencyId = (user as any).agencyId
        token.agency = (user as any).agency
        token.clients = (user as any).clients
        token.accessToken = (user as any).accessToken
      }
      return token
    },
    session({ session, token }) {
      const u = session.user as any
      u.id = token.id as string
      u.role = token.role as string
      u.agencyId = token.agencyId as string
      u.agency = token.agency as any
      u.clients = token.clients as any
      ;(session as any).accessToken = token.accessToken
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: { strategy: 'jwt' },
})
