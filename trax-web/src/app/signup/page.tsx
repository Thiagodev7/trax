'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Globe, User, Lock, Mail, ArrowRight, ArrowLeft,
  Check, Loader2, Palette, CheckCircle2, Sparkles, Eye, EyeOff,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'traxsolucoes.com.br'

// ─── Schemas per step ────────────────────────────────────────────────────────
const step1Schema = z.object({
  agencyName: z.string().min(3, 'Mínimo 3 caracteres'),
  slug: z.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(30, 'Máximo 30 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Apenas letras minúsculas, números e hífens'),
})

const step2Schema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida'),
})

const step3Schema = z.object({
  adminName: z.string().min(3, 'Mínimo 3 caracteres'),
  adminEmail: z.string().email('Email inválido'),
  adminPassword: z.string().min(8, 'Mínimo 8 caracteres'),
})

type Step1 = z.infer<typeof step1Schema>
type Step2 = z.infer<typeof step2Schema>
type Step3 = z.infer<typeof step3Schema>

// ─── Color presets ────────────────────────────────────────────────────────────
const COLOR_PRESETS = [
  { name: 'Índigo', primary: '#6366F1' },
  { name: 'Violeta', primary: '#8B5CF6' },
  { name: 'Azul', primary: '#3B82F6' },
  { name: 'Ciano', primary: '#06B6D4' },
  { name: 'Esmeralda', primary: '#10B981' },
  { name: 'Rosa', primary: '#EC4899' },
  { name: 'Laranja', primary: '#F59E0B' },
  { name: 'Vermelho', primary: '#EF4444' },
]

// ─── Step indicators ──────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Agência', icon: Building2 },
  { label: 'Identidade', icon: Palette },
  { label: 'Sua conta', icon: User },
  { label: 'Confirmar', icon: CheckCircle2 },
]

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {STEPS.map((step, i) => {
        const done = i < current
        const active = i === current
        const Icon = step.icon
        return (
          <div key={i} className="flex items-center gap-2">
            <div className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300',
              done ? 'bg-emerald-500/20 text-emerald-400' :
              active ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' :
              'bg-white/5 text-white/30',
            )}>
              {done ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
              <span className={cn('hidden sm:block', !active && !done && 'opacity-60')}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('w-6 h-px transition-colors', done ? 'bg-emerald-500/50' : 'bg-white/10')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1: Agency Info ──────────────────────────────────────────────────────
function Step1Form({ onNext, initial }: { onNext: (d: Step1) => void; initial?: Partial<Step1> }) {
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [slugTimeout, setSlugTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<Step1>({
    resolver: zodResolver(step1Schema),
    defaultValues: initial,
  })

  const slug = watch('slug')

  const checkSlug = useCallback(async (value: string) => {
    if (!value || value.length < 3) { setSlugStatus('idle'); return }
    setSlugStatus('checking')
    try {
      const res = await fetch(`${API_URL}/api/v1/onboarding/check-slug?slug=${value}`)
      const data = await res.json()
      setSlugStatus(data.available ? 'available' : 'taken')
    } catch {
      setSlugStatus('idle')
    }
  }, [])

  useEffect(() => {
    if (slugTimeout) clearTimeout(slugTimeout)
    const t = setTimeout(() => checkSlug(slug), 600)
    setSlugTimeout(t)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-white/80">Nome da Agência</label>
        <div className="relative">
          <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            {...register('agencyName')}
            placeholder="Minha Agência Digital"
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/30 transition-all"
          />
        </div>
        {errors.agencyName && <p className="text-xs text-red-400">{errors.agencyName.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-white/80">Seu subdomínio</label>
        <div className="relative">
          <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            {...register('slug')}
            placeholder="minha-agencia"
            className={cn(
              'w-full pl-10 pr-10 py-3 rounded-xl text-sm bg-white/5 border text-white placeholder-white/25 focus:outline-none focus:ring-1 transition-all',
              slugStatus === 'available' ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/30' :
              slugStatus === 'taken' ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' :
              'border-white/10 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/30',
            )}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {slugStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-white/40" />}
            {slugStatus === 'available' && <Check className="w-4 h-4 text-emerald-400" />}
            {slugStatus === 'taken' && <span className="text-red-400 text-xs">✗</span>}
          </div>
        </div>
        {slug && (
          <p className="text-xs text-white/40">
            Seu portal: <span className="text-[var(--color-primary)] font-medium">{slug}.{BASE_DOMAIN}</span>
          </p>
        )}
        {slugStatus === 'taken' && <p className="text-xs text-red-400">Este slug já está em uso.</p>}
        {errors.slug && <p className="text-xs text-red-400">{errors.slug.message}</p>}
      </div>

      <button
        type="submit"
        disabled={slugStatus === 'taken' || slugStatus === 'checking'}
        className="w-full py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:opacity-90 disabled:opacity-50 transition-all"
        style={{ boxShadow: '0 0 24px var(--color-primary)40' }}
      >
        Próximo <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  )
}

// ─── Step 2: Branding ─────────────────────────────────────────────────────────
function Step2Form({ onNext, onBack, initial }: { onNext: (d: Step2) => void; onBack: () => void; initial?: Partial<Step2> }) {
  const { handleSubmit, setValue, watch } = useForm<Step2>({
    resolver: zodResolver(step2Schema),
    defaultValues: { primaryColor: initial?.primaryColor || '#6366F1' },
  })

  const primaryColor = watch('primaryColor')

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-3">
        <label className="text-sm font-medium text-white/80">Cor principal da sua agência</label>
        <div className="grid grid-cols-4 gap-2.5">
          {COLOR_PRESETS.map((p) => (
            <button
              key={p.primary}
              type="button"
              onClick={() => setValue('primaryColor', p.primary)}
              className={cn(
                'group relative h-12 rounded-xl transition-all duration-200',
                primaryColor === p.primary ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0F172A] scale-105' : 'hover:scale-105',
              )}
              style={{ background: p.primary }}
            >
              {primaryColor === p.primary && (
                <Check className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow" />
              )}
              <span className="sr-only">{p.name}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 pt-2">
          <div className="w-10 h-10 rounded-lg border-2 border-white/20" style={{ background: primaryColor }} />
          <div className="flex-1">
            <label className="text-xs text-white/40">Cor personalizada (HEX)</label>
            <input
              value={primaryColor}
              onChange={(e) => setValue('primaryColor', e.target.value)}
              className="w-full mt-0.5 px-3 py-1.5 rounded-lg text-sm bg-white/5 border border-white/10 text-white font-mono focus:outline-none focus:border-[var(--color-primary)] transition-all"
              placeholder="#6366F1"
              maxLength={7}
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div
        className="rounded-xl overflow-hidden border border-white/10 bg-[#0F172A]"
        style={{ '--color-primary': primaryColor } as any}
      >
        <div className="h-1 w-full" style={{ background: primaryColor }} />
        <div className="flex h-24 p-3 gap-3">
          <div className="w-12 flex flex-col items-center gap-2 border-r border-white/10 pr-3">
            <div className="w-6 h-6 rounded" style={{ background: primaryColor }} />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-5 h-1 rounded-full" style={{ background: i === 0 ? primaryColor : '#ffffff20' }} />
            ))}
          </div>
          <div className="flex-1 grid grid-cols-2 gap-1.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/5 rounded-lg p-2">
                <div className="h-1 w-8 bg-white/20 rounded mb-1.5" />
                <div className="h-3 w-6 rounded" style={{ background: `${primaryColor}99` }} />
              </div>
            ))}
          </div>
        </div>
        <div className="px-3 pb-3 text-center">
          <span className="text-[10px] text-white/30">Preview do seu dashboard</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="flex-1 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <button type="submit" className="flex-1 py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:opacity-90 transition-all" style={{ background: primaryColor }}>
          Próximo <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  )
}

// ─── Step 3: Admin account ────────────────────────────────────────────────────
function Step3Form({ onNext, onBack, initial }: { onNext: (d: Step3) => void; onBack: () => void; initial?: Partial<Step3> }) {
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<Step3>({
    resolver: zodResolver(step3Schema),
    defaultValues: initial,
  })

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-white/80">Seu nome</label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input {...register('adminName')} placeholder="João Silva"
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/30 transition-all" />
        </div>
        {errors.adminName && <p className="text-xs text-red-400">{errors.adminName.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-white/80">Seu email</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input {...register('adminEmail')} type="email" placeholder="joao@agencia.com.br"
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/30 transition-all" />
        </div>
        {errors.adminEmail && <p className="text-xs text-red-400">{errors.adminEmail.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-white/80">Sua senha</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input {...register('adminPassword')} type={showPassword ? 'text' : 'password'} placeholder="••••••••"
            className="w-full pl-10 pr-10 py-3 rounded-xl text-sm bg-white/5 border border-white/10 text-white placeholder-white/25 focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/30 transition-all" />
          <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.adminPassword && <p className="text-xs text-red-400">{errors.adminPassword.message}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onBack} className="flex-1 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <button type="submit" className="flex-1 py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:opacity-90 transition-all" style={{ boxShadow: '0 0 24px var(--color-primary)40' }}>
          Próximo <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  )
}

// ─── Step 4: Confirm ──────────────────────────────────────────────────────────
function Step4Confirm({
  data, onBack, onSubmit, isSubmitting,
}: {
  data: { step1: Step1; step2: Step2; step3: Step3 }
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
}) {
  const items = [
    { label: 'Nome da agência', value: data.step1.agencyName },
    { label: 'Subdomínio', value: `${data.step1.slug}.${BASE_DOMAIN}` },
    { label: 'Administrador', value: data.step3.adminName },
    { label: 'Email', value: data.step3.adminEmail },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden divide-y divide-white/5">
        {items.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-white/40">{label}</span>
            <span className="text-sm font-medium text-white">{value}</span>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-white/40">Cor principal</span>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded" style={{ background: data.step2.primaryColor }} />
            <span className="text-sm font-mono font-medium text-white">{data.step2.primaryColor}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} disabled={isSubmitting} className="flex-1 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-1 py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 transition-all"
          style={{ boxShadow: '0 0 24px #10b98140' }}
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {isSubmitting ? 'Criando sua agência...' : 'Criar minha agência!'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────
export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<{
    step1?: Step1; step2?: Step2; step3?: Step3
  }>({})

  const STEP_TITLES = [
    { title: 'Crie sua agência no Trax', sub: '14 dias grátis • Sem cartão de crédito' },
    { title: 'Personalize sua identidade', sub: 'Escolha as cores da sua plataforma' },
    { title: 'Crie seu acesso de admin', sub: 'Você será o administrador da conta' },
    { title: 'Tudo certo!', sub: 'Confira os dados antes de criar' },
  ]

  async function handleFinalSubmit() {
    if (!formData.step1 || !formData.step2 || !formData.step3) return
    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_URL}/api/v1/onboarding/agency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyName: formData.step1.agencyName,
          slug: formData.step1.slug,
          primaryColor: formData.step2.primaryColor,
          adminName: formData.step3.adminName,
          adminEmail: formData.step3.adminEmail,
          adminPassword: formData.step3.adminPassword,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Erro ao criar agência')

      toast.success('Agência criada! Redirecionando...')
      setTimeout(() => router.push('/login'), 1500)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
  }
  const [direction, setDirection] = useState(1)
  const goNext = () => { setDirection(1); setStep(s => s + 1) }
  const goBack = () => { setDirection(-1); setStep(s => s - 1) }

  const currentTitle = STEP_TITLES[step]

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0A0F1E]">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl bg-[#6366F1]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-15 blur-3xl bg-[#F59E0B]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl bg-white" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-xl bg-[#6366F1] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-xl tracking-tight">Trax</span>
        </div>

        {/* Step indicators */}
        <StepIndicator current={step} />

        {/* Card */}
        <div className="bg-white/[0.04] backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="p-8">
            {/* Title */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`title-${step}`}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="mb-7"
              >
                <h1 className="text-2xl font-bold text-white">{currentTitle.title}</h1>
                <p className="text-sm text-white/40 mt-1">{currentTitle.sub}</p>
              </motion.div>
            </AnimatePresence>

            {/* Form content */}
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={`step-${step}`}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                {step === 0 && (
                  <Step1Form
                    initial={formData.step1}
                    onNext={(d) => { setFormData(f => ({ ...f, step1: d })); goNext() }}
                  />
                )}
                {step === 1 && (
                  <Step2Form
                    initial={formData.step2}
                    onBack={goBack}
                    onNext={(d) => { setFormData(f => ({ ...f, step2: d })); goNext() }}
                  />
                )}
                {step === 2 && (
                  <Step3Form
                    initial={formData.step3}
                    onBack={goBack}
                    onNext={(d) => { setFormData(f => ({ ...f, step3: d })); goNext() }}
                  />
                )}
                {step === 3 && formData.step1 && formData.step2 && formData.step3 && (
                  <Step4Confirm
                    data={{ step1: formData.step1, step2: formData.step2, step3: formData.step3 }}
                    onBack={goBack}
                    onSubmit={handleFinalSubmit}
                    isSubmitting={isSubmitting}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center text-sm text-white/25 mt-6">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-white/50 hover:text-white transition-colors underline underline-offset-2">
            Faça login
          </Link>
        </p>
      </div>
    </main>
  )
}
