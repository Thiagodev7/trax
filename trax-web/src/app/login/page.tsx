import { headers } from 'next/headers'
import { resolveTenant } from '@/lib/tenant'
import { LoginForm } from '@/components/auth/login-form'

export default async function LoginPage() {
  const host = (await headers()).get('host') ?? ''
  const tenant = await resolveTenant(host)
  
  const branding = tenant.branding
  const isSplit = branding.loginLayout === 'split'
  const title = branding.loginTitle || tenant.name
  const subtitle = branding.loginSubtitle || 'Acesse sua conta para continuar'
  const bgImage = branding.loginBackgroundUrl

  // Common Form Content
  const formContent = (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        {branding.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={branding.logoUrl}
            alt={tenant.name}
            className="h-12 mx-auto mb-4 object-contain"
          />
        ) : (
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center text-white font-bold text-xl gradient-primary">
            {tenant.name[0]}
          </div>
        )}
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          {title}
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          {subtitle}
        </p>
      </div>

      <LoginForm domain={host} />

      <p className="text-center text-xs text-[var(--color-muted)] mt-8">
        Powered by <span className="font-semibold gradient-text">Trax</span>
      </p>
    </div>
  )

  if (isSplit) {
    return (
      <main className="min-h-screen flex bg-[var(--color-bg)]">
        {/* Left Side: Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[var(--color-surface)] relative z-10 shadow-2xl">
          {formContent}
        </div>

        {/* Right Side: Image/Branding */}
        <div className="hidden lg:block lg:w-1/2 relative bg-[var(--color-surface-2)] overflow-hidden">
          {bgImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bgImage}
              alt="Login Background"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 gradient-primary opacity-20" />
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)]/80 to-transparent" />
          
          {/* Abstract blobs if no image */}
          {!bgImage && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div
                className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full opacity-30 blur-3xl"
                style={{ background: 'var(--color-primary)' }}
              />
              <div
                className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full opacity-30 blur-3xl"
                style={{ background: 'var(--color-accent)' }}
              />
            </div>
          )}
        </div>
      </main>
    )
  }

  // Centered Layout
  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--color-bg)]">
      {/* Background Image or Animated Blobs */}
      {bgImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bgImage}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm"
          />
          <div className="absolute inset-0 bg-[var(--color-bg)]/60 backdrop-blur-sm" />
        </>
      ) : (
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
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />
        </div>
      )}

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <div className="glass-strong rounded-[var(--radius-xl)] p-8 shadow-2xl animate-fade-in border-[var(--color-border)]">
          {formContent}
        </div>
      </div>
    </main>
  )
}
