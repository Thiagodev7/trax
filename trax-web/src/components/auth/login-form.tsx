'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react'
import { toast } from 'sonner'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

interface LoginFormProps {
  domain: string
}

export function LoginForm({ domain }: LoginFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'
  const sessionExpired = searchParams.get('expired') === '1'
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (sessionExpired) {
      toast.info('Sua sessão expirou. Faça login novamente.')
    }
  }, [sessionExpired])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const isLoading = isPending || isSubmitting

  async function onSubmit(data: FormData) {
    startTransition(async () => {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        domain,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Credenciais inválidas. Verifique email e senha.')
        return
      }

      toast.success('Login realizado com sucesso!')
      router.push(callbackUrl)
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Email */}
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="text-sm font-medium text-[var(--color-foreground-muted)]"
        >
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            {...register('email')}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-all
              bg-[var(--color-surface-2)] border border-[var(--color-border)]
              text-[var(--color-foreground)] placeholder-[var(--color-muted)]
              focus:outline-none focus:border-[var(--color-primary)]
              focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-20
              hover:border-[var(--color-muted)] disabled:opacity-50"
            disabled={isLoading}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-red-400">{errors.email.message}</p>
        )}
      </div>

      {/* Senha */}
      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="text-sm font-medium text-[var(--color-foreground-muted)]"
        >
          Senha
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            {...register('password')}
            className="w-full pl-10 pr-10 py-2.5 rounded-lg text-sm transition-all
              bg-[var(--color-surface-2)] border border-[var(--color-border)]
              text-[var(--color-foreground)] placeholder-[var(--color-muted)]
              focus:outline-none focus:border-[var(--color-primary)]
              focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-20
              hover:border-[var(--color-muted)] disabled:opacity-50"
            disabled={isLoading}
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
        {errors.password && (
          <p className="text-xs text-red-400">{errors.password.message}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg
          font-semibold text-sm text-white transition-all duration-200
          gradient-primary hover:opacity-90 active:scale-[0.98]
          disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100
          focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2
          focus:ring-offset-[var(--color-surface)] shadow-lg glow-primary"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Entrando...
          </>
        ) : (
          <>
            <LogIn className="w-4 h-4" />
            Entrar
          </>
        )}
      </button>
    </form>
  )
}
