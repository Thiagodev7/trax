'use client'

import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Palette, Globe, Image as ImageIcon, Save, LayoutTemplate, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { useApiClient } from '@/lib/api-client-browser'
import { useRouter } from 'next/navigation'
import * as Tabs from '@radix-ui/react-tabs'
import { ImageUpload } from '@/components/ui/image-upload'

const schema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  customDomain: z.string().optional(),
  logoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  faviconUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida'),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida'),
  fontFamily: z.string().optional(),
  
  // Advanced White-label
  themeMode: z.string().optional(),
  borderRadius: z.string().optional(),
  portalLayout: z.string().optional(),
  loginLayout: z.string().optional(),
  loginBackgroundUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  loginTitle: z.string().optional(),
  loginSubtitle: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const FONT_OPTIONS = ['Inter', 'Roboto', 'Poppins', 'Outfit', 'Nunito', 'DM Sans']

export function BrandingForm({ initialData }: { initialData: any }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const api = useApiClient()
  const [previewMode, setPreviewMode] = useState<'dashboard' | 'login'>('dashboard')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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
      themeMode: initialData?.themeMode || 'dark',
      borderRadius: initialData?.borderRadius || 'medium',
      portalLayout: initialData?.portalLayout || 'sidebar',
      loginLayout: initialData?.loginLayout || 'centered',
      loginBackgroundUrl: initialData?.loginBackgroundUrl || '',
      loginTitle: initialData?.loginTitle || '',
      loginSubtitle: initialData?.loginSubtitle || '',
    },
  })

  const isLoading = isPending || isSubmitting

  const primaryColor = watch('primaryColor')
  const secondaryColor = watch('secondaryColor')
  const accentColor = watch('accentColor')
  const logoUrl = watch('logoUrl')
  const agencyName = watch('name')
  const fontFamily = watch('fontFamily')
  const themeMode = watch('themeMode')
  const borderRadius = watch('borderRadius')
  
  const loginBackgroundUrl = watch('loginBackgroundUrl')

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

  useEffect(() => {
    if (fontFamily) {
      document.documentElement.style.setProperty('--font-family', fontFamily)
      
      const linkId = `google-font-${fontFamily.replace(/\s+/g, '-')}`
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link')
        link.id = linkId
        link.rel = 'stylesheet'
        link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@400;500;600;700&display=swap`
        document.head.appendChild(link)
      }
    }
  }, [fontFamily])

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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Tabs.Root defaultValue="identidade">
              <Tabs.List className="flex border-b border-[var(--color-border)] mb-6 overflow-x-auto no-scrollbar">
                <Tabs.Trigger
                  value="identidade"
                  className="px-4 py-2.5 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)] data-[state=active]:text-[var(--color-primary)] data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-primary)] transition-colors flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  Identidade Visual
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="aparencia"
                  className="px-4 py-2.5 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)] data-[state=active]:text-[var(--color-primary)] data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-primary)] transition-colors flex items-center gap-2"
                >
                  <LayoutTemplate className="w-4 h-4" />
                  Aparência e Estilo
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="login"
                  className="px-4 py-2.5 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)] data-[state=active]:text-[var(--color-primary)] data-[state=active]:border-b-2 data-[state=active]:border-[var(--color-primary)] transition-colors flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Tela de Login
                </Tabs.Trigger>
              </Tabs.List>

              {/* Aba: Identidade Visual */}
              <Tabs.Content value="identidade" className="space-y-8 outline-none">
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
                    <ImageUpload
                      label="Logo da Agência"
                      description="Arraste o logo aqui (recomendado: 256x64 transparente)"
                      value={watch('logoUrl') || null}
                      onChange={(url) => setValue('logoUrl', url, { shouldValidate: true })}
                      onRemove={() => setValue('logoUrl', '')}
                    />
                    <ImageUpload
                      label="Favicon"
                      description="Arraste o ícone da aba do navegador (recomendado: 64x64)"
                      value={watch('faviconUrl') || null}
                      onChange={(url) => setValue('faviconUrl', url, { shouldValidate: true })}
                      onRemove={() => setValue('faviconUrl', '')}
                    />
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

                <div className="pt-6 border-t border-[var(--color-border)]">
                  <h3 className="text-lg font-medium text-[var(--color-foreground)] mb-4 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-[var(--color-primary)]" />
                    Cores Principais
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
                              value={watch(field) || '#000000'}
                              onChange={(e) => setValue(field, e.target.value, { shouldValidate: true })}
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
              </Tabs.Content>

              {/* Aba: Aparência e Estilo */}
              <Tabs.Content value="aparencia" className="space-y-8 outline-none">
                <div className="space-y-6">
                  {/* Tema */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--color-foreground)]">Tema da Plataforma</label>
                    <div className="flex gap-4">
                      {['dark', 'light', 'system'].map((theme) => (
                        <label key={theme} className="cursor-pointer flex-1">
                          <input type="radio" value={theme} {...register('themeMode')} className="sr-only peer" />
                          <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-center transition-all peer-checked:border-[var(--color-primary)] peer-checked:ring-1 peer-checked:ring-[var(--color-primary)]">
                            <span className="text-sm font-medium text-[var(--color-foreground)] capitalize">{theme}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Arredondamento */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--color-foreground)]">Raio da Borda (Border Radius)</label>
                    <div className="flex gap-4">
                      {[
                        { val: 'none', label: 'Quadrado', rad: '0px' },
                        { val: 'small', label: 'Pequeno', rad: '4px' },
                        { val: 'medium', label: 'Médio', rad: '8px' },
                        { val: 'large', label: 'Grande', rad: '16px' },
                        { val: 'full', label: 'Pílula', rad: '9999px' },
                      ].map((r) => (
                        <label key={r.val} className="cursor-pointer flex-1">
                          <input type="radio" value={r.val} {...register('borderRadius')} className="sr-only peer" />
                          <div
                            className="p-3 border border-[var(--color-border)] bg-[var(--color-surface-2)] text-center transition-all peer-checked:border-[var(--color-primary)] peer-checked:bg-[var(--color-primary)]/10"
                            style={{ borderRadius: r.rad }}
                          >
                            <span className="text-xs font-medium text-[var(--color-foreground)]">{r.label}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Layout do Portal */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--color-foreground)]">Layout de Navegação</label>
                    <div className="flex gap-4">
                      <label className="cursor-pointer flex-1">
                        <input type="radio" value="sidebar" {...register('portalLayout')} className="sr-only peer" />
                        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-center transition-all peer-checked:border-[var(--color-primary)] peer-checked:ring-1 peer-checked:ring-[var(--color-primary)]">
                          <div className="w-16 h-12 mx-auto border border-white/20 rounded flex overflow-hidden mb-2">
                            <div className="w-4 h-full bg-[var(--color-primary)]" />
                            <div className="flex-1 bg-white/5" />
                          </div>
                          <span className="text-sm font-medium text-[var(--color-foreground)]">Menu Lateral</span>
                        </div>
                      </label>

                      <label className="cursor-pointer flex-1">
                        <input type="radio" value="topbar" {...register('portalLayout')} className="sr-only peer" />
                        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-center transition-all peer-checked:border-[var(--color-primary)] peer-checked:ring-1 peer-checked:ring-[var(--color-primary)]">
                          <div className="w-16 h-12 mx-auto border border-white/20 rounded flex flex-col overflow-hidden mb-2">
                            <div className="w-full h-3 bg-[var(--color-primary)]" />
                            <div className="flex-1 bg-white/5" />
                          </div>
                          <span className="text-sm font-medium text-[var(--color-foreground)]">Menu Superior</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </Tabs.Content>

              {/* Aba: Tela de Login */}
              <Tabs.Content value="login" className="space-y-8 outline-none">
                <div className="space-y-6">
                  {/* Layout do Login */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--color-foreground)]">Layout da Tela de Login</label>
                    <div className="flex gap-4">
                      <label className="cursor-pointer flex-1">
                        <input type="radio" value="centered" {...register('loginLayout')} className="sr-only peer" />
                        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-center transition-all peer-checked:border-[var(--color-primary)] peer-checked:ring-1 peer-checked:ring-[var(--color-primary)]">
                          <span className="text-sm font-medium text-[var(--color-foreground)]">Centralizado</span>
                        </div>
                      </label>
                      <label className="cursor-pointer flex-1">
                        <input type="radio" value="split" {...register('loginLayout')} className="sr-only peer" />
                        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] text-center transition-all peer-checked:border-[var(--color-primary)] peer-checked:ring-1 peer-checked:ring-[var(--color-primary)]">
                          <span className="text-sm font-medium text-[var(--color-foreground)]">Meia Tela (Split)</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Fundo do Login */}
                  <ImageUpload
                    label="Imagem de Fundo (Login)"
                    description="Recomendado para Layout Split-screen (alta resolução)"
                    value={watch('loginBackgroundUrl') || null}
                    onChange={(url) => setValue('loginBackgroundUrl', url, { shouldValidate: true })}
                    onRemove={() => setValue('loginBackgroundUrl', '')}
                  />

                  {/* Textos */}
                  <div className="space-y-4 pt-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-[var(--color-foreground)]">Título de Boas-Vindas</label>
                      <input
                        {...register('loginTitle')}
                        placeholder="Ex: Bem-vindo ao Portal"
                        className="w-full px-4 py-2.5 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-[var(--color-foreground)]">Subtítulo (Mensagem)</label>
                      <input
                        {...register('loginSubtitle')}
                        placeholder="Ex: Entre para ver os resultados da sua campanha"
                        className="w-full px-4 py-2.5 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
                      />
                    </div>
                  </div>
                </div>
              </Tabs.Content>

            </Tabs.Root>

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

      {/* Live Preview Panel */}
      <div className="lg:col-span-1">
        <div className="sticky top-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-[var(--color-muted-foreground)] uppercase tracking-widest">
              Preview
            </p>
            <div className="flex bg-[var(--color-surface-2)] p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setPreviewMode('dashboard')}
                className={`text-[10px] font-medium px-2 py-1 rounded transition-colors ${previewMode === 'dashboard' ? 'bg-[var(--color-surface)] shadow text-[var(--color-foreground)]' : 'text-[var(--color-muted)]'}`}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('login')}
                className={`text-[10px] font-medium px-2 py-1 rounded transition-colors ${previewMode === 'login' ? 'bg-[var(--color-surface)] shadow text-[var(--color-foreground)]' : 'text-[var(--color-muted)]'}`}
              >
                Login
              </button>
            </div>
          </div>

          <div 
            className="card border-[var(--color-border)] overflow-hidden shadow-2xl transition-all"
            style={{ 
              borderRadius: borderRadius === 'full' ? '24px' : borderRadius === 'large' ? '16px' : borderRadius === 'small' ? '4px' : borderRadius === 'none' ? '0px' : '8px'
            }}
          >
            {/* Barra superior comum */}
            <div className="h-1.5 w-full" style={{ background: primaryColor }} />

            {previewMode === 'dashboard' ? (
              <>
                {/* Layout dinâmico: Dashboard */}
                <div className="flex h-48">
                  {watch('portalLayout') === 'sidebar' && (
                    <div className="w-10 border-r border-[var(--color-border)] flex flex-col items-center py-3 gap-3">
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
                  )}

                  <div className="flex-1 flex flex-col">
                    {watch('portalLayout') === 'topbar' && (
                      <div className="h-8 border-b border-[var(--color-border)] flex items-center px-2 gap-2">
                        {logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logoUrl} alt="logo" className="h-4 object-contain rounded" />
                        ) : (
                          <div
                            className="w-4 h-4 rounded text-white text-[8px] font-bold flex items-center justify-center"
                            style={{ background: primaryColor }}
                          >
                            {agencyName?.[0] || 'T'}
                          </div>
                        )}
                        <div className="w-6 h-1 rounded-full" style={{ background: primaryColor }} />
                        <div className="w-6 h-1 rounded-full bg-[var(--color-border)]" />
                      </div>
                    )}
                    
                    <div className="flex-1 p-3 bg-[var(--color-bg)]">
                      <div className="grid grid-cols-2 gap-1.5 mb-2">
                        {[...Array(2)].map((_, i) => (
                          <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] p-2"
                            style={{ borderRadius: borderRadius === 'full' ? '12px' : borderRadius === 'large' ? '8px' : borderRadius === 'small' ? '2px' : borderRadius === 'none' ? '0px' : '4px' }}
                          >
                            <div className="h-1.5 w-8 bg-[var(--color-border)] rounded mb-1.5" />
                            <div className="h-3 w-10 rounded" style={{ background: primaryColor, opacity: 0.8 }} />
                          </div>
                        ))}
                      </div>
                      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-2 flex-1 flex flex-col"
                        style={{ borderRadius: borderRadius === 'full' ? '12px' : borderRadius === 'large' ? '8px' : borderRadius === 'small' ? '2px' : borderRadius === 'none' ? '0px' : '4px' }}
                      >
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
                </div>

                <div className="p-3 bg-[var(--color-surface)] border-t border-[var(--color-border)]">
                  <button
                    type="button"
                    className="w-full py-1.5 text-white text-xs font-medium"
                    style={{ 
                      background: primaryColor,
                      borderRadius: borderRadius === 'full' ? '99px' : borderRadius === 'large' ? '12px' : borderRadius === 'small' ? '4px' : borderRadius === 'none' ? '0px' : '8px'
                    }}
                  >
                    Botão Primário
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Layout dinâmico: Login */}
                <div className="flex h-56 bg-[var(--color-bg)] relative overflow-hidden">
                  {watch('loginLayout') === 'split' ? (
                    <>
                      {/* Left Side: Form */}
                      <div className="w-1/2 h-full flex flex-col items-center justify-center p-3 bg-[var(--color-surface)] border-r border-[var(--color-border)] z-10 shadow-lg">
                        {logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logoUrl} alt="logo" className="h-5 mb-2 object-contain" />
                        ) : (
                          <div
                            className="w-5 h-5 rounded text-white text-[10px] font-bold flex items-center justify-center mb-2"
                            style={{ background: primaryColor }}
                          >
                            {agencyName?.[0] || 'T'}
                          </div>
                        )}
                        <div className="w-20 h-2 bg-[var(--color-border)] rounded mb-1" />
                        <div className="w-16 h-1.5 bg-[var(--color-surface-2)] rounded mb-4" />
                        
                        <div className="w-full space-y-1.5 mb-2">
                          <div className="w-full h-5 border border-[var(--color-border)] rounded" style={{ borderRadius: borderRadius === 'full' ? '12px' : borderRadius === 'large' ? '8px' : borderRadius === 'small' ? '2px' : borderRadius === 'none' ? '0px' : '4px' }} />
                          <div className="w-full h-5 border border-[var(--color-border)] rounded" style={{ borderRadius: borderRadius === 'full' ? '12px' : borderRadius === 'large' ? '8px' : borderRadius === 'small' ? '2px' : borderRadius === 'none' ? '0px' : '4px' }} />
                        </div>
                        
                        <button
                          type="button"
                          className="w-full py-1.5 mt-auto text-white text-[9px] font-medium"
                          style={{ 
                            background: primaryColor,
                            borderRadius: borderRadius === 'full' ? '99px' : borderRadius === 'large' ? '12px' : borderRadius === 'small' ? '4px' : borderRadius === 'none' ? '0px' : '8px'
                          }}
                        >
                          Entrar
                        </button>
                      </div>

                      {/* Right Side: Image */}
                      <div className="w-1/2 h-full relative bg-[var(--color-surface-2)]">
                        {loginBackgroundUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={loginBackgroundUrl} alt="bg" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full opacity-20" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }} />
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Centered Form */}
                      {loginBackgroundUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={loginBackgroundUrl} alt="bg" className="absolute inset-0 w-full h-full object-cover opacity-30 blur-[2px]" />
                      ) : (
                        <div className="absolute inset-0 opacity-10" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }} />
                      )}
                      
                      <div className="relative z-10 m-auto w-3/4 max-w-[180px] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xl p-3 flex flex-col items-center"
                        style={{ borderRadius: borderRadius === 'full' ? '16px' : borderRadius === 'large' ? '12px' : borderRadius === 'small' ? '4px' : borderRadius === 'none' ? '0px' : '8px' }}
                      >
                        {logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={logoUrl} alt="logo" className="h-5 mb-2 object-contain" />
                        ) : (
                          <div
                            className="w-5 h-5 rounded text-white text-[10px] font-bold flex items-center justify-center mb-2"
                            style={{ background: primaryColor }}
                          >
                            {agencyName?.[0] || 'T'}
                          </div>
                        )}
                        <div className="w-20 h-2 bg-[var(--color-border)] rounded mb-1" />
                        <div className="w-16 h-1.5 bg-[var(--color-surface-2)] rounded mb-4" />
                        
                        <div className="w-full space-y-1.5 mb-3">
                          <div className="w-full h-5 border border-[var(--color-border)]" style={{ borderRadius: borderRadius === 'full' ? '12px' : borderRadius === 'large' ? '8px' : borderRadius === 'small' ? '2px' : borderRadius === 'none' ? '0px' : '4px' }} />
                          <div className="w-full h-5 border border-[var(--color-border)]" style={{ borderRadius: borderRadius === 'full' ? '12px' : borderRadius === 'large' ? '8px' : borderRadius === 'small' ? '2px' : borderRadius === 'none' ? '0px' : '4px' }} />
                        </div>
                        
                        <button
                          type="button"
                          className="w-full py-1.5 text-white text-[9px] font-medium"
                          style={{ 
                            background: primaryColor,
                            borderRadius: borderRadius === 'full' ? '99px' : borderRadius === 'large' ? '12px' : borderRadius === 'small' ? '4px' : borderRadius === 'none' ? '0px' : '8px'
                          }}
                        >
                          Entrar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

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
