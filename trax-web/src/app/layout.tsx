import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'sonner'
import { resolveTenant, brandingToCssString } from '@/lib/tenant'
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
      icon: tenant.branding.faviconUrl?.trim() || '/favicon.ico',
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

  const themeMode = tenant.branding.themeMode || 'dark'

  let htmlClasses = inter.variable
  if (themeMode === 'dark') htmlClasses += ' dark'

  // Script inline para detecção de tema do sistema antes de qualquer render
  const themeScript = `(function(){if('${themeMode}'==='system'){if(window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('dark');}}})();`

  return (
    <html lang="pt-BR" className={htmlClasses} suppressHydrationWarning>
      <head>
        {/* Injeta os tokens do tenant em :root antes do render para evitar FOUC */}
        <style dangerouslySetInnerHTML={{ __html: brandingToCssString(tenant.branding) }} />
        {/* CSS customizado do tenant (campo customCss da agência) */}
        {tenant.branding.customCss && (
          <style dangerouslySetInnerHTML={{ __html: tenant.branding.customCss }} />
        )}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {tenant.branding.fontFamily && tenant.branding.fontFamily !== 'Inter' && (
          <link
            rel="stylesheet"
            href={`https://fonts.googleapis.com/css2?family=${tenant.branding.fontFamily.replace(/\s+/g, '+')}:wght@400;500;600;700&display=swap`}
          />
        )}
      </head>
      <body>
        <SessionProvider refetchInterval={4 * 60} refetchOnWindowFocus>
          <QueryProvider>
            {children}
            <Toaster
              position="top-right"
              theme={themeMode === 'light' ? 'light' : 'dark'}
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
