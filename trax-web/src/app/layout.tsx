import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'
import { resolveTenant, brandingToCssVars } from '@/lib/tenant'
import { QueryProvider } from '@/components/providers/query-provider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get('host') ?? ''
  const tenant = await resolveTenant(host)

  return {
    title: {
      default: tenant.name,
      template: `%s | ${tenant.name}`,
    },
    description: `Portal de relatórios de marketing — ${tenant.name}`,
    icons: {
      icon: tenant.branding.faviconUrl ?? '/favicon.ico',
    },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const host = (await headers()).get('host') ?? ''
  const tenant = await resolveTenant(host)
  const cssVars = brandingToCssVars(tenant.branding)

  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <body style={cssVars}>
        <SessionProvider>
          <QueryProvider>
            {children}
            <Toaster
              position="top-right"
              theme="dark"
              richColors
              closeButton
              toastOptions={{
                style: {
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-foreground)',
                },
              }}
            />
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
