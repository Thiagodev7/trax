'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Globe, User, Lock, Mail, Phone, ArrowRight, ArrowLeft,
  Check, Loader2, Palette, CheckCircle2, Sparkles, Eye, EyeOff,
  PartyPopper, Sun, Moon,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getPublicApiV1Base } from '@/lib/api-base-url'
import { buildTenantAbsoluteUrl, getBaseDomain } from '@/lib/domains'
import {
  getSignupUi,
  type SignupThemeMode,
  type SignupUi,
} from '@/lib/signup-theme'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30)
    .replace(/-+$/, '')
}

const BASE_DOMAIN = getBaseDomain()

function formatBrazilPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function normalizeBrazilPhoneForApi(value: string): string {
  const digits = value.replace(/\D/g, '')
  const local = digits.startsWith('55') && digits.length >= 12 ? digits.slice(2) : digits
  return `+55${local}`
}

function formatPhoneForDisplay(e164: string): string {
  const digits = e164.replace(/\D/g, '')
  const local = digits.startsWith('55') ? digits.slice(2) : digits
  return formatBrazilPhone(local)
}

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
  themeMode: z.enum(['light', 'dark']),
})

const step3Schema = z
  .object({
    adminName: z.string().min(3, 'Mínimo 3 caracteres'),
    adminEmail: z.string().email('Email inválido'),
    adminPhone: z
      .string()
      .min(1, 'Informe seu telefone')
      .refine((v) => {
        const digits = v.replace(/\D/g, '')
        const local = digits.startsWith('55') && digits.length >= 12 ? digits.slice(2) : digits
        return local.length >= 10 && local.length <= 11
      }, 'Informe um telefone válido com DDD'),
    adminPassword: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string().min(8, 'Confirme sua senha'),
  })
  .refine((data) => data.adminPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
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

function SignupThemeToggle({
  themeMode,
  onChange,
  ui,
}: {
  themeMode: SignupThemeMode
  onChange: (mode: SignupThemeMode) => void
  ui: SignupUi
}) {
  return (
    <div className={cn('inline-flex p-1 rounded-xl', ui.themeToggleTrack)} role="group" aria-label="Tema do wizard">
      {(['light', 'dark'] as const).map((mode) => {
        const active = themeMode === mode
        const Icon = mode === 'light' ? Sun : Moon
        const label = mode === 'light' ? 'Claro' : 'Escuro'
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              active ? ui.themeToggleActive : ui.themeToggleInactive,
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        )
      })}
    </div>
  )
}

function StepIndicator({ current, ui }: { current: number; ui: SignupUi }) {
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
              ui.stepIdle,
            )}>
              {done ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
              <span className={cn('hidden sm:block', !active && !done && 'opacity-60')}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('w-6 h-px transition-colors', done ? 'bg-emerald-500/50' : ui.stepLine)} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1: Agency Info ──────────────────────────────────────────────────────
function Step1Form({ onNext, initial, ui }: { onNext: (d: Step1) => void; initial?: Partial<Step1>; ui: SignupUi }) {
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const slugManuallyEdited = useRef(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<Step1>({
    resolver: zodResolver(step1Schema),
    defaultValues: initial,
  })

  const agencyName = watch('agencyName')
  const slug = watch('slug')

  // Auto-generate slug from agency name (only when not manually edited)
  useEffect(() => {
    if (slugManuallyEdited.current || !agencyName) return
    const generated = slugify(agencyName)
    if (generated) setValue('slug', generated, { shouldValidate: true })
  }, [agencyName, setValue])

  const checkSlug = useCallback(async (value: string) => {
    if (!value || value.length < 3) { setSlugStatus('idle'); return }
    setSlugStatus('checking')
    try {
      const res = await fetch(`${getPublicApiV1Base()}/onboarding/check-slug?slug=${value}`)
      const data = await res.json()
      setSlugStatus(data.available ? 'available' : 'taken')
    } catch {
      setSlugStatus('idle')
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => checkSlug(slug), 600)
    return () => clearTimeout(t)
  }, [slug, checkSlug])

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-1.5">
        <label className={cn('text-sm font-medium', ui.label)}>Nome da Agência</label>
        <div className="relative">
          <Building2 className={cn('absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4', ui.icon)} />
          <input
            {...register('agencyName')}
            placeholder="Minha Agência Digital"
            className={cn('w-full pl-10 pr-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-1 transition-all', ui.input)}
          />
        </div>
        {errors.agencyName && <p className="text-xs text-red-400">{errors.agencyName.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className={cn('text-sm font-medium', ui.label)}>Seu subdomínio</label>
        <div className="relative">
          <Globe className={cn('absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4', ui.icon)} />
          <input
            {...register('slug')}
            onInput={() => { slugManuallyEdited.current = true }}
            placeholder="minha-agencia"
            className={cn(
              'w-full pl-10 pr-10 py-3 rounded-xl text-sm border focus:outline-none focus:ring-1 transition-all',
              ui.input,
              slugStatus === 'available' ? ui.inputSlugOk :
              slugStatus === 'taken' ? ui.inputSlugErr : '',
            )}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {slugStatus === 'checking' && <Loader2 className={cn('w-4 h-4 animate-spin', ui.muted)} />}
            {slugStatus === 'available' && <Check className="w-4 h-4 text-emerald-400" />}
            {slugStatus === 'taken' && <span className="text-red-400 text-xs">✗</span>}
          </div>
        </div>
        {slug && (
          <p className={cn('text-xs', ui.muted)}>
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
function Step2Form({
  onNext,
  onBack,
  initial,
  ui,
  themeMode,
  onThemeChange,
}: {
  onNext: (d: Step2) => void
  onBack: () => void
  initial?: Partial<Step2>
  ui: SignupUi
  themeMode: SignupThemeMode
  onThemeChange: (mode: SignupThemeMode) => void
}) {
  const { handleSubmit, setValue, watch } = useForm<Step2>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      primaryColor: initial?.primaryColor || '#6366F1',
      themeMode: initial?.themeMode || themeMode,
    },
  })

  const primaryColor = watch('primaryColor')
  const formTheme = watch('themeMode')

  useEffect(() => {
    setValue('themeMode', themeMode)
  }, [themeMode, setValue])

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-3">
        <label className={cn('text-sm font-medium', ui.label)}>Tema da plataforma</label>
        <div className="grid grid-cols-2 gap-2.5">
          {(['light', 'dark'] as const).map((mode) => {
            const active = formTheme === mode
            const Icon = mode === 'light' ? Sun : Moon
            return (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setValue('themeMode', mode)
                  onThemeChange(mode)
                }}
                className={cn(
                  'flex items-center justify-center gap-2 h-12 rounded-xl border text-sm font-medium transition-all',
                  active
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]'
                    : cn(ui.panel, ui.label, 'hover:border-[var(--color-primary)]/40'),
                )}
              >
                <Icon className="w-4 h-4" />
                {mode === 'light' ? 'Claro' : 'Escuro'}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        <label className={cn('text-sm font-medium', ui.label)}>Cor principal da sua agência</label>

        {/* Seletor nativo (gradiente + matiz) — acima dos presets */}
        <div className={cn('flex items-center gap-3 p-3 rounded-xl border', ui.colorPickerBox)}>
          <label
            htmlFor="signup-primary-color-picker"
            className={cn('relative shrink-0 cursor-pointer rounded-xl overflow-hidden ring-2 transition-all', ui.colorPickerRing)}
            title="Abrir seletor de cor"
          >
            <input
              id="signup-primary-color-picker"
              type="color"
              value={primaryColor}
              onChange={(e) => setValue('primaryColor', e.target.value.toUpperCase())}
              className="w-14 h-14 cursor-pointer border-0 bg-transparent appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-lg"
            />
          </label>
          <div className="flex-1 min-w-0">
            <p className={cn('text-xs font-medium', ui.label)}>Seletor de cor</p>
            <p className={cn('text-[11px] mt-0.5', ui.muted)}>Clique no quadrado e escolha qualquer tom</p>
            <input
              value={primaryColor}
              onChange={(e) => setValue('primaryColor', e.target.value.toUpperCase())}
              className={cn('w-full mt-2 px-3 py-1.5 rounded-lg text-sm border font-mono uppercase focus:outline-none transition-all', ui.input)}
              placeholder="#6366F1"
              maxLength={7}
            />
          </div>
        </div>

        <p className={cn('text-xs', ui.muted)}>Ou escolha uma sugestão:</p>
        <div className="grid grid-cols-4 gap-2.5">
          {COLOR_PRESETS.map((p) => (
            <button
              key={p.primary}
              type="button"
              onClick={() => setValue('primaryColor', p.primary)}
              className={cn(
                'group relative h-12 rounded-xl transition-all duration-200',
                primaryColor.toUpperCase() === p.primary.toUpperCase()
                  ? cn('ring-2 ring-white ring-offset-2 scale-105', ui.ringOffset)
                  : 'hover:scale-105',
              )}
              style={{ background: p.primary }}
            >
              {primaryColor.toUpperCase() === p.primary.toUpperCase() && (
                <Check className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow" />
              )}
              <span className="sr-only">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div
        className={cn('rounded-xl overflow-hidden border', ui.previewOuter)}
        style={{ '--color-primary': primaryColor } as React.CSSProperties}
      >
        <div className="h-1 w-full" style={{ background: primaryColor }} />
        <div className="flex h-24 p-3 gap-3">
          <div className={cn('w-12 flex flex-col items-center gap-2 border-r pr-3', ui.previewSidebar)}>
            <div className="w-6 h-6 rounded" style={{ background: primaryColor }} />
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={cn('w-5 h-1 rounded-full', i !== 0 && ui.previewMutedBar)}
                style={i === 0 ? { background: primaryColor } : undefined}
              />
            ))}
          </div>
          <div className="flex-1 grid grid-cols-2 gap-1.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={cn('rounded-lg p-2', ui.previewCard)}>
                <div className={cn('h-1 w-8 rounded mb-1.5', ui.previewMutedBar)} />
                <div className="h-3 w-6 rounded" style={{ background: `${primaryColor}99` }} />
              </div>
            ))}
          </div>
        </div>
        <div className="px-3 pb-3 text-center">
          <span className={cn('text-[10px]', ui.previewCaption)}>
            Preview do dashboard ({formTheme === 'light' ? 'tema claro' : 'tema escuro'})
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className={cn('flex-1 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2', ui.btnGhost)}>
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
function Step3Form({ onNext, onBack, initial, ui }: { onNext: (d: Step3) => void; onBack: () => void; initial?: Partial<Step3>; ui: SignupUi }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Step3>({
    resolver: zodResolver(step3Schema),
    defaultValues: initial,
  })

  const adminPhone = watch('adminPhone') ?? ''

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div className="space-y-1.5">
        <label className={cn('text-sm font-medium', ui.label)}>Seu nome</label>
        <div className="relative">
          <User className={cn('absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4', ui.icon)} />
          <input {...register('adminName')} placeholder="João Silva"
            className={cn('w-full pl-10 pr-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-1 transition-all', ui.input)} />
        </div>
        {errors.adminName && <p className="text-xs text-red-400">{errors.adminName.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className={cn('text-sm font-medium', ui.label)}>Seu email</label>
        <div className="relative">
          <Mail className={cn('absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4', ui.icon)} />
          <input {...register('adminEmail')} type="email" placeholder="joao@agencia.com.br"
            className={cn('w-full pl-10 pr-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-1 transition-all', ui.input)} />
        </div>
        {errors.adminEmail && <p className="text-xs text-red-400">{errors.adminEmail.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className={cn('text-sm font-medium', ui.label)}>WhatsApp / Telefone</label>
        <div className="relative">
          <Phone className={cn('absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4', ui.icon)} />
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="(11) 99999-9999"
            value={adminPhone}
            onChange={(e) => setValue('adminPhone', formatBrazilPhone(e.target.value), { shouldValidate: true })}
            className={cn('w-full pl-10 pr-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-1 transition-all', ui.input)}
          />
        </div>
        <p className={cn('text-[11px]', ui.muted)}>Usado para suporte e avisos importantes da sua conta</p>
        {errors.adminPhone && <p className="text-xs text-red-400">{errors.adminPhone.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className={cn('text-sm font-medium', ui.label)}>Sua senha</label>
        <div className="relative">
          <Lock className={cn('absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4', ui.icon)} />
          <input {...register('adminPassword')} type={showPassword ? 'text' : 'password'} placeholder="••••••••"
            className={cn('w-full pl-10 pr-10 py-3 rounded-xl text-sm border focus:outline-none focus:ring-1 transition-all', ui.input)} />
          <button type="button" onClick={() => setShowPassword(s => !s)} className={cn('absolute right-3 top-1/2 -translate-y-1/2 transition-colors', ui.icon, 'hover:opacity-80')}>
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.adminPassword && <p className="text-xs text-red-400">{errors.adminPassword.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className={cn('text-sm font-medium', ui.label)}>Confirmar senha</label>
        <div className="relative">
          <Lock className={cn('absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4', ui.icon)} />
          <input {...register('confirmPassword')} type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••"
            className={cn('w-full pl-10 pr-10 py-3 rounded-xl text-sm border focus:outline-none focus:ring-1 transition-all', ui.input)} />
          <button type="button" onClick={() => setShowConfirmPassword(s => !s)} className={cn('absolute right-3 top-1/2 -translate-y-1/2 transition-colors', ui.icon, 'hover:opacity-80')}>
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onBack} className={cn('flex-1 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2', ui.btnGhost)}>
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
  data, onBack, onSubmit, isSubmitting, ui,
}: {
  data: { step1: Step1; step2: Step2; step3: Step3 }
  onBack: () => void
  onSubmit: () => void
  isSubmitting: boolean
  ui: SignupUi
}) {
  const items = [
    { label: 'Nome da agência', value: data.step1.agencyName },
    { label: 'Subdomínio', value: `${data.step1.slug}.${BASE_DOMAIN}` },
    { label: 'Administrador', value: data.step3.adminName },
    { label: 'Email', value: data.step3.adminEmail },
    { label: 'Telefone', value: formatPhoneForDisplay(normalizeBrazilPhoneForApi(data.step3.adminPhone)) },
  ]

  return (
    <div className="space-y-6">
      <div className={cn('rounded-xl border overflow-hidden divide-y', ui.panel, ui.panelDivide)}>
        {items.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between px-4 py-3">
            <span className={cn('text-sm', ui.muted)}>{label}</span>
            <span className={cn('text-sm font-medium', ui.title)}>{value}</span>
          </div>
        ))}
        <div className="flex items-center justify-between px-4 py-3">
          <span className={cn('text-sm', ui.muted)}>Tema</span>
          <span className={cn('text-sm font-medium capitalize', ui.title)}>
            {data.step2.themeMode === 'light' ? 'Claro' : 'Escuro'}
          </span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className={cn('text-sm', ui.muted)}>Cor principal</span>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded" style={{ background: data.step2.primaryColor }} />
            <span className={cn('text-sm font-mono font-medium', ui.title)}>{data.step2.primaryColor}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} disabled={isSubmitting} className={cn('flex-1 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50', ui.btnGhost)}>
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

// ─── Success Screen ───────────────────────────────────────────────────────────
function SuccessScreen({ slug, primaryColor, ui }: { slug: string; primaryColor: string; ui: SignupUi }) {
  const [countdown, setCountdown] = useState(4)

  useEffect(() => {
    const redirectUrl = buildTenantAbsoluteUrl(slug, { path: '/login?welcome=1' })
    const interval = setInterval(() => {
      setCountdown((n) => {
        if (n <= 1) {
          clearInterval(interval)
          window.location.replace(redirectUrl)
          return 0
        }
        return n - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [slug])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center text-center py-4 space-y-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: `${primaryColor}25`, border: `2px solid ${primaryColor}60` }}
      >
        <PartyPopper className="w-9 h-9" style={{ color: primaryColor }} />
      </motion.div>

      <div>
        <h2 className={cn('text-2xl font-bold', ui.title)}>Agência criada!</h2>
        <p className={cn('text-sm mt-1.5', ui.subtitle)}>
          Seu portal <span className="font-medium" style={{ color: primaryColor }}>{slug}.{getBaseDomain()}</span> está pronto.
        </p>
      </div>

      <div className={cn('w-full rounded-xl border px-5 py-4 text-left space-y-2', ui.panel)}>
        <p className={cn('text-xs uppercase tracking-wide font-medium', ui.muted)}>Próximos passos</p>
        {[
          'Faça login com as suas credenciais',
          'Faça o upload da logomarca da agência',
          'Conecte o Meta Ads ou Google Ads',
        ].map((step, i) => (
          <div key={i} className={cn('flex items-center gap-2.5 text-sm', ui.label)}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: `${primaryColor}30`, color: primaryColor }}>
              {i + 1}
            </div>
            {step}
          </div>
        ))}
      </div>

      <div className={cn('flex items-center gap-2 text-sm', ui.muted)}>
        <Loader2 className="w-4 h-4 animate-spin" />
        Redirecionando para o login em {countdown}s...
      </div>
    </motion.div>
  )
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────
export default function SignupPage() {
  const [step, setStep] = useState(0)
  const [themeMode, setThemeMode] = useState<SignupThemeMode>('dark')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<{ slug: string; primaryColor: string } | null>(null)
  const [formData, setFormData] = useState<{
    step1?: Step1; step2?: Step2; step3?: Step3
  }>({})

  const ui = getSignupUi(themeMode)

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
      const response = await fetch(`${getPublicApiV1Base()}/onboarding/agency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyName: formData.step1.agencyName,
          slug: formData.step1.slug,
          primaryColor: formData.step2.primaryColor,
          themeMode: formData.step2.themeMode,
          adminName: formData.step3.adminName,
          adminEmail: formData.step3.adminEmail,
          adminPhone: normalizeBrazilPhoneForApi(formData.step3.adminPhone),
          adminPassword: formData.step3.adminPassword,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Erro ao criar agência')

      setSubmitted({
        slug: result.agency.slug,
        primaryColor: formData.step2.primaryColor,
      })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar agência')
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

  const primaryColor = formData.step2?.primaryColor ?? '#6366F1'

  return (
    <main className={cn('min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-300', ui.page)}>
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl transition-opacity duration-500"
          style={{ background: primaryColor, opacity: ui.orbOpacity }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full blur-3xl bg-[#F59E0B] transition-opacity duration-500"
          style={{ opacity: ui.orbAmberOpacity }}
        />
        <div className={cn('absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl bg-white transition-opacity duration-500', ui.orbWhiteClass)} />
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(${ui.gridPattern} 1px, transparent 1px), linear-gradient(90deg, ${ui.gridPattern} 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-8">
        {/* Logo + tema */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: primaryColor }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className={cn('font-bold text-xl tracking-tight', ui.logoText)}>Trax</span>
          </div>
          {!submitted && (
            <SignupThemeToggle themeMode={themeMode} onChange={setThemeMode} ui={ui} />
          )}
        </div>

        {/* Step indicators — hide when submitted */}
        {!submitted && <StepIndicator current={step} ui={ui} />}

        {/* Card */}
        <div className={cn('rounded-2xl border overflow-hidden transition-colors duration-300', ui.card)}>
          <div className="p-8">
            <AnimatePresence mode="wait" custom={direction}>
              {submitted ? (
                <SuccessScreen
                  key="success"
                  slug={submitted.slug}
                  primaryColor={submitted.primaryColor}
                  ui={ui}
                />
              ) : (
                <>
                  {/* Title */}
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
                    <h1 className={cn('text-2xl font-bold', ui.title)}>{currentTitle.title}</h1>
                    <p className={cn('text-sm mt-1', ui.subtitle)}>{currentTitle.sub}</p>
                  </motion.div>

                  {/* Form content */}
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
                        ui={ui}
                        initial={formData.step1}
                        onNext={(d) => { setFormData(f => ({ ...f, step1: d })); goNext() }}
                      />
                    )}
                    {step === 1 && (
                      <Step2Form
                        ui={ui}
                        themeMode={themeMode}
                        onThemeChange={setThemeMode}
                        initial={formData.step2}
                        onBack={goBack}
                        onNext={(d) => {
                          setThemeMode(d.themeMode)
                          setFormData(f => ({ ...f, step2: d }))
                          goNext()
                        }}
                      />
                    )}
                    {step === 2 && (
                      <Step3Form
                        ui={ui}
                        initial={formData.step3}
                        onBack={goBack}
                        onNext={(d) => { setFormData(f => ({ ...f, step3: d })); goNext() }}
                      />
                    )}
                    {step === 3 && formData.step1 && formData.step2 && formData.step3 && (
                      <Step4Confirm
                        ui={ui}
                        data={{ step1: formData.step1, step2: formData.step2, step3: formData.step3 }}
                        onBack={goBack}
                        onSubmit={handleFinalSubmit}
                        isSubmitting={isSubmitting}
                      />
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {!submitted && (
          <p className={cn('text-center text-sm mt-6', ui.faint)}>
            Já tem uma conta?{' '}
            <Link href="/login" className={cn('transition-colors underline underline-offset-2', ui.link)}>
              Faça login
            </Link>
          </p>
        )}
      </div>
    </main>
  )
}
