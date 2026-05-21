'use client'

import { useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Palette, Globe, Image as ImageIcon, Save, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useApiClient } from '@/lib/api-client-browser'
import { useRouter } from 'next/navigation'

const schema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  customDomain: z.string().optional(),
  logoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  faviconUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida'),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida'),
  fontFamily: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const FONT_OPTIONS = ['Inter', 'Roboto', 'Poppins', 'Outfit', 'Nunito', 'DM Sans']

export function BrandingForm({ initialData }: { initialData: any }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const api = useApiClient()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || '',
      customDomain: initialData?.customDomain || '',
      logoUrl: initialData?.logoUrl || '',
      faviconUrl: initialData?.faviconUrl || '',
      primaryColor: initialData?.primaryColor || '#6366F1',
      secondaryColor: initialData?.secondaryColor || '#818CF8',
      accentColor: initialData?.accentColor || '#F59E0B',
      fontFamily: initialData?.fontFamily || 'Inter',
    },
  })

  const isLoading = isPending || isSubmitting

  // Preview em tempo real: Assiste as cores e atualiza o CSS da página
  const primaryColor = watch('primaryColor')
  const secondaryColor = watch('secondaryColor')
  const accentColor = watch('accentColor')
  const logoUrl = watch('logoUrl')
  const agencyName = watch('name')

  useEffect(() => {
    if (primaryColor && /^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
      document.documentElement.style.setProperty('--color-primary', primaryColor)
    }
  }, [primaryColor])

  useEffect(() => {
    if (secondaryColor && /^#[0-9A-Fa-f]{6}$/.test(secondaryColor)) {
      document.documentElement.style.setProperty('--color-secondary', secondaryColor)
    }
  }, [secondaryColor])

  useEffect(() => {
    if (accentColor && /^#[0-9A-Fa-f]{6}$/.test(accentColor)) {
      document.documentElement.style.setProperty('--color-accent', accentColor)
    }
  }, [accentColor])

  async function onSubmit(data: FormData) {
    try {
      await api.patch('/agency/branding', data)
      toast.success('Configurações atualizadas com sucesso!')

      startTransition(() => {
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar configurações')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Formulário */}
      <div className="lg:col-span-2">
        <div className="card p-6 border-[var(--color-border)]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

            {/* Seção: Identidade */}
            <div>
              <h3 className="text-lg font-medium text-[var(--color-foreground)] mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[var(--color-primary)]" />
                Identidade Visual
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">Nome da Agência</label>
                  <input
                    {...register('name')}
                    className="w-full px-4 py-2.5 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-20 transition-all"
                  />
                  {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--color-foreground)]">URL do Logo</label>
                    <input
                      {...register('logoUrl')}
                      placeholder="https://cdn.agencia.com/logo.png"
                      className="w-full px-4 py-2.5 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
                    />
                    {errors.logoUrl && <p className="text-xs text-red-400">{errors.logoUrl.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--color-foreground)]">URL do Favicon</label>
                    <input
                      {...register('faviconUrl')}
                      placeholder="https://cdn.agencia.com/favicon.ico"
                      className="w-full px-4 py-2.5 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
                    />
                  </div>
                </div>

                {/* Font Family */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">Fonte da Agência</label>
                  <div className="flex flex-wrap gap-2">
                    {FONT_OPTIONS.map((font) => (
                      <label key={font} className="cursor-pointer">
                        <input
                          type="radio"
                          value={font}
                          {...register('fontFamily')}
                          className="sr-only peer"
                        />
                        <span
                          className="px-3 py-1.5 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)] transition-all peer-checked:border-[var(--color-primary)] peer-checked:bg-[var(--color-primary)]/10 peer-checked:text-[var(--color-primary)] hover:border-[var(--color-primary)]/50"
                          style={{ fontFamily: font }}
                        >
                          {font}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Seção: Cores */}
            <div className="pt-6 border-t border-[var(--color-border)]">
              <h3 className="text-lg font-medium text-[var(--color-foreground)] mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-[var(--color-primary)]" />
                Cores e Tema
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Cor Primária', field: 'primaryColor' as const },
                  { label: 'Cor Secundária', field: 'secondaryColor' as const },
                  { label: 'Cor de Destaque', field: 'accentColor' as const },
                ].map(({ label, field }) => (
                  <div key={field} className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-foreground)]">{label}</label>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="color"
                          {...register(field)}
                          className="w-10 h-10 p-1 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg cursor-pointer appearance-none"
                        />
                      </div>
                      <input
                        {...register(field)}
                        maxLength={7}
                        className="flex-1 px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] uppercase font-mono focus:outline-none focus:border-[var(--color-primary)] transition-all"
                      />
                    </div>
                    {errors[field] && <p className="text-xs text-red-400">{errors[field]?.message}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Seção: Domínio */}
            <div className="pt-6 border-t border-[var(--color-border)]">
              <h3 className="text-lg font-medium text-[var(--color-foreground)] mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-[var(--color-primary)]" />
                Domínio Personalizado
              </h3>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--color-foreground)]">Domínio (ex: portal.minhaagencia.com)</label>
                <input
                  {...register('customDomain')}
                  placeholder="Deixe em branco para usar o subdomínio padrão"
                  className="w-full px-4 py-2.5 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
                />
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Requer configuração de DNS (CNAME) apontando para nossos servidores.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-[var(--color-border)] flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:opacity-90 transition-all disabled:opacity-60 shadow-sm glow-primary"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isLoading ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Live Preview Panel — agora mostra logo e cores reais */}
      <div className="lg:col-span-1">
        <div className="sticky top-6">
          <p className="text-xs font-semibold text-[var(--color-muted-foreground)] mb-3 uppercase tracking-widest">
            Preview em Tempo Real
          </p>

          {/* Mini-UI Preview */}
          <div className="card border-[var(--color-border)] overflow-hidden shadow-2xl">
            {/* Barra superior */}
            <div className="h-1.5 w-full" style={{ background: primaryColor }} />

            {/* Sidebar mini */}
            <div className="flex h-48">
              <div className="w-10 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col items-center py-3 gap-3">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="logo" className="w-6 h-6 object-contain rounded" />
                ) : (
                  <div
                    className="w-6 h-6 rounded text-white text-[10px] font-bold flex items-center justify-center"
                    style={{ background: primaryColor }}
                  >
                    {agencyName?.[0] || 'T'}
                  </div>
                )}
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-5 h-1 rounded-full"
                    style={{ background: i === 0 ? primaryColor : 'var(--color-border)' }}
                  />
                ))}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 p-3 bg-[var(--color-bg)]">
                {/* KPI cards mini */}
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-2">
                      <div className="h-1.5 w-8 bg-[var(--color-border)] rounded mb-1.5" />
                      <div className="h-3 w-10 rounded" style={{ background: primaryColor, opacity: 0.8 }} />
                    </div>
                  ))}
                </div>
                {/* Chart area */}
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-2 flex-1">
                  <div className="h-1.5 w-12 bg-[var(--color-border)] rounded mb-2" />
                  <div className="flex items-end gap-1 h-10">
                    {[40, 60, 50, 80, 65, 90].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm opacity-80"
                        style={{ height: `${h}%`, background: i % 2 === 0 ? primaryColor : secondaryColor }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer com botão de ação */}
            <div className="p-3 bg-[var(--color-surface)] border-t border-[var(--color-border)]">
              <button
                type="button"
                className="w-full py-1.5 text-white text-xs font-medium rounded-lg"
                style={{ background: primaryColor }}
              >
                Botão Primário
              </button>
            </div>
          </div>

          {/* Color Swatches */}
          <div className="mt-3 flex gap-2">
            {[
              { label: 'Primária', color: primaryColor },
              { label: 'Secundária', color: secondaryColor },
              { label: 'Destaque', color: accentColor },
            ].map(({ label, color }) => (
              <div key={label} className="flex-1 text-center">
                <div
                  className="w-full h-6 rounded-md border border-white/10"
                  style={{ background: color }}
                />
                <p className="text-[10px] text-[var(--color-muted)] mt-1 truncate">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
