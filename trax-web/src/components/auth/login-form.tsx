'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Mail, Lock, Eye, EyeOff, LogIn, Sparkles, ShieldCheck, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { getPublicApiV1Base } from '@/lib/api-base-url'

type Step = 'credentials' | 'totp'

interface LoginFormProps {
  domain: string
}

export function LoginForm({ domain }: LoginFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl')?.trim() || '/'
  const sessionExpired = searchParams.get('expired') === '1'
  const isWelcome = searchParams.get('welcome') === '1'

  const [step, setStep] = useState<Step>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [mfaChallengeToken, setMfaChallengeToken] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (sessionExpired) toast.info('Sua sessão expirou. Faça login novamente.')
  }, [sessionExpired])

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setIsLoading(true)

    try {
      const res = await fetch(`${getPublicApiV1Base()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agency-Domain': domain,
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error('Credenciais inválidas. Verifique email e senha.')
        return
      }

      if (data.requiresMfa) {
        setMfaChallengeToken(data.mfaChallengeToken)
        setStep('totp')
        return
      }

      // Login normal — usa provider credentials-preauth para criar sessão NextAuth
      await completeSignIn(data.accessToken, data.refreshToken, data.expiresIn)
    } catch {
      toast.error('Erro ao conectar com o servidor.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleTotpSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (totpCode.length !== 6) return
    setIsLoading(true)

    try {
      const res = await fetch(`${getPublicApiV1Base()}/auth/totp/verify-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agency-Domain': domain,
        },
        body: JSON.stringify({ mfaChallengeToken, code: totpCode }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.message ?? 'Código inválido. Tente novamente.')
        setTotpCode('')
        return
      }

      const data = await res.json()
      await completeSignIn(data.accessToken, data.refreshToken, data.expiresIn)
    } catch {
      toast.error('Erro ao verificar código 2FA.')
    } finally {
      setIsLoading(false)
    }
  }

  async function completeSignIn(accessToken: string, refreshToken: string, expiresIn: number) {
    const result = await signIn('credentials-preauth', {
      accessToken,
      refreshToken,
      expiresIn: String(expiresIn),
      domain,
      redirect: false,
    })

    if (result?.error) {
      toast.error('Erro ao criar sessão. Tente novamente.')
      return
    }

    toast.success('Login realizado com sucesso!')
    router.push(callbackUrl)
    router.refresh()
  }

  const inputClass =
    'w-full py-2.5 rounded-lg text-sm transition-all bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-20 hover:border-[var(--color-muted)] disabled:opacity-50'

  return (
    <div className="space-y-5">
      {/* Welcome banner */}
      {isWelcome && step === 'credentials' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 flex items-start gap-3"
        >
          <Sparkles className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-300">Agência criada com sucesso!</p>
            <p className="text-xs text-emerald-400/70 mt-0.5">
              Faça login para acessar o seu painel e começar a configurar sua plataforma.
            </p>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {step === 'credentials' ? (
          <motion.form
            key="credentials"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleCredentialsSubmit}
            className="space-y-5"
          >
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--color-foreground-muted)]">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="seu@email.com"
                  disabled={isLoading}
                  className={`${inputClass} pl-10 pr-4`}
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--color-foreground-muted)]">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  className={`${inputClass} pl-10 pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm text-white transition-all duration-200 gradient-primary hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg glow-primary"
            >
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Entrando...</> : <><LogIn className="w-4 h-4" />Entrar</>}
            </button>
          </motion.form>
        ) : (
          <motion.form
            key="totp"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleTotpSubmit}
            className="space-y-5"
          >
            {/* 2FA header */}
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-[var(--color-primary)]" />
              </div>
              <div className="text-center">
                <p className="font-bold text-[var(--color-foreground)]">Verificação em dois fatores</p>
                <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                  Digite o código de 6 dígitos do seu aplicativo autenticador.
                </p>
              </div>
            </div>

            {/* TOTP input */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--color-foreground-muted)]">Código 2FA</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                autoFocus
                disabled={isLoading}
                className={`${inputClass} px-4 text-center text-2xl tracking-[0.5em] font-mono`}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || totpCode.length !== 6}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm text-white transition-all duration-200 gradient-primary hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg glow-primary"
            >
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Verificando...</> : <><ShieldCheck className="w-4 h-4" />Verificar</>}
            </button>

            <button
              type="button"
              onClick={() => { setStep('credentials'); setTotpCode('') }}
              className="w-full flex items-center justify-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para o login
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
