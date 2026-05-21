import { headers } from 'next/headers'
import { resolveTenant } from '@/lib/tenant'
import { LoginForm } from '@/components/auth/login-form'

export default async function LoginPage() {
  const host = (await headers()).get('host') ?? ''
  const tenant = await resolveTenant(host)

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--color-bg)]">
      {/* Background animado com gradiente */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'var(--color-primary)' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl"
          style={{ background: 'var(--color-accent)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-5 blur-3xl"
          style={{ background: 'var(--color-secondary)' }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      {/* Card de login */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <div className="glass-strong rounded-2xl p-8 shadow-2xl animate-fade-in">
          {/* Logo e nome da agência */}
          <div className="text-center mb-8">
            {tenant.branding.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tenant.branding.logoUrl}
                alt={tenant.name}
                className="h-12 mx-auto mb-4 object-contain"
              />
            ) : (
              <div
                className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center text-white font-bold text-xl gradient-primary"
              >
                {tenant.name[0]}
              </div>
            )}
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
              {tenant.name}
            </h1>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
              Acesse sua conta para continuar
            </p>
          </div>

          <LoginForm domain={host} />
        </div>

        <p className="text-center text-xs text-[var(--color-muted)] mt-6">
          Powered by{' '}
          <span className="font-semibold gradient-text">Trax</span>
        </p>
      </div>
    </main>
  )
}
