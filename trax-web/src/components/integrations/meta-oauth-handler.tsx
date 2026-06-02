'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { useApiClient } from '@/lib/api-client-browser'
import { toast } from 'sonner'
import { CheckCircle2, ChevronRight } from 'lucide-react'
import type { Integration } from './integration-list'

interface Props {
  clientId: string
  onIntegrationAdded: (integration: Integration) => void
}

interface AdAccount {
  id: string
  name: string
  currency: string
}

interface PageEntry {
  id: string
  name: string
  instagramAccountId: string | null
}

type Step = 'choose' | 'ads' | 'instagram_page' | 'facebook_page'

export function MetaOAuthHandler({ clientId, onIntegrationAdded }: Props) {
  const searchParams = useSearchParams()
  const api = useApiClient()

  const [open, setOpen] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('choose')
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([])
  const [pages, setPages] = useState<PageEntry[]>([])
  const [selectedAdAccount, setSelectedAdAccount] = useState('')
  const [selectedPage, setSelectedPage] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const oauth = searchParams.get('meta_oauth')
    const pid = searchParams.get('pendingId')
    if (oauth === 'pending' && pid) {
      setPendingId(pid)
      setOpen(true)
      setStep('choose')
      window.history.replaceState({}, '', window.location.pathname)
    } else if (oauth === 'error') {
      toast.error(searchParams.get('message') || 'Erro na conexão Meta')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [searchParams])

  async function loadAdAccounts(pid: string) {
    setLoading(true)
    try {
      const list = await api.get<AdAccount[]>(
        `/clients/${clientId}/integrations/meta/ad-accounts?pendingId=${pid}`,
      )
      setAdAccounts(list)
      if (list.length === 1) setSelectedAdAccount(list[0].id)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao listar Ad Accounts')
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  async function loadPages(pid: string) {
    setLoading(true)
    try {
      const list = await api.get<PageEntry[]>(
        `/clients/${clientId}/integrations/meta/pages?pendingId=${pid}`,
      )
      setPages(list)
      if (list.length === 1) setSelectedPage(list[0].id)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao listar páginas')
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  function handleChooseStep(s: Step) {
    setStep(s)
    setDisplayName('')
    if (!pendingId) return
    if (s === 'ads') loadAdAccounts(pendingId)
    if (s === 'instagram_page' || s === 'facebook_page') loadPages(pendingId)
  }

  async function handleFinalize(targetProvider: 'META_ADS' | 'INSTAGRAM' | 'FACEBOOK_PAGE') {
    if (!pendingId) return
    setLoading(true)
    try {
      const body: Record<string, string> = {
        pendingId,
        targetProvider,
        ...(displayName ? { displayName } : {}),
      }
      if (targetProvider === 'META_ADS') {
        if (!selectedAdAccount) { toast.error('Selecione uma conta de anúncios'); return }
        body.adAccountId = selectedAdAccount
      } else {
        if (!selectedPage) { toast.error('Selecione uma página'); return }
        body.pageId = selectedPage
      }

      const integration = await api.post<Integration>(
        `/clients/${clientId}/integrations/meta/finalize`,
        body,
      )
      const labels: Record<string, string> = {
        META_ADS: 'Meta Ads',
        INSTAGRAM: 'Instagram',
        FACEBOOK_PAGE: 'Facebook Page',
      }
      toast.success(`${labels[targetProvider]} conectado com sucesso!`)
      onIntegrationAdded(integration)
      setOpen(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao finalizar conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 shadow-2xl">
          <Dialog.Title className="text-lg font-bold text-[var(--color-foreground)] mb-1">
            Configurar integração Meta
          </Dialog.Title>
          <Dialog.Description className="text-sm text-[var(--color-muted-foreground)] mb-5">
            Escolha o que deseja conectar com este token Meta.
          </Dialog.Description>

          {step === 'choose' && (
            <div className="space-y-3">
              {[
                { s: 'ads' as Step, icon: '📊', label: 'Meta Ads', desc: 'Dados de campanhas e performance de anúncios' },
                { s: 'instagram_page' as Step, icon: '📸', label: 'Instagram Business', desc: 'Métricas orgânicas e posts do Instagram' },
                { s: 'facebook_page' as Step, icon: '📘', label: 'Facebook Page', desc: 'Insights e posts da página do Facebook' },
              ].map(({ s, icon, label, desc }) => (
                <button
                  key={s}
                  onClick={() => handleChooseStep(s)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-primary)]/60 hover:bg-[var(--color-surface)] transition-all text-left group"
                >
                  <span className="text-2xl">{icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-[var(--color-foreground)]">{label}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--color-muted)] group-hover:text-[var(--color-primary)] transition-colors" />
                </button>
              ))}
            </div>
          )}

          {step === 'ads' && (
            <div className="space-y-4">
              <button onClick={() => setStep('choose')} className="text-xs text-[var(--color-primary)] hover:underline">
                ← Voltar
              </button>
              {loading && adAccounts.length === 0 ? (
                <p className="text-sm text-[var(--color-muted-foreground)]">Carregando contas…</p>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5 uppercase tracking-wide">
                      Ad Account
                    </label>
                    <select
                      value={selectedAdAccount}
                      onChange={(e) => setSelectedAdAccount(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
                    >
                      <option value="">Selecione…</option>
                      {adAccounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.id}) — {a.currency}
                        </option>
                      ))}
                    </select>
                  </div>
                  <NameField value={displayName} onChange={setDisplayName} placeholder="Meta Ads — Conta Principal" />
                  <button
                    type="button"
                    disabled={loading || !selectedAdAccount}
                    onClick={() => handleFinalize('META_ADS')}
                    className="w-full py-2.5 text-sm font-medium bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? 'Salvando…' : <><CheckCircle2 className="w-4 h-4" /> Conectar Meta Ads</>}
                  </button>
                </>
              )}
            </div>
          )}

          {(step === 'instagram_page' || step === 'facebook_page') && (
            <div className="space-y-4">
              <button onClick={() => setStep('choose')} className="text-xs text-[var(--color-primary)] hover:underline">
                ← Voltar
              </button>
              {loading && pages.length === 0 ? (
                <p className="text-sm text-[var(--color-muted-foreground)]">Carregando páginas…</p>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5 uppercase tracking-wide">
                      Página do Facebook
                    </label>
                    {pages.length === 0 ? (
                      <p className="text-xs text-amber-400 bg-amber-400/10 rounded-lg p-3">
                        Nenhuma página encontrada. Certifique-se de autorizar o acesso às páginas.
                      </p>
                    ) : (
                      <select
                        value={selectedPage}
                        onChange={(e) => setSelectedPage(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)]"
                      >
                        <option value="">Selecione…</option>
                        {pages
                          .filter((p) => step === 'facebook_page' || p.instagramAccountId)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                              {step === 'instagram_page' && p.instagramAccountId
                                ? ` (IG: ${p.instagramAccountId})`
                                : ''}
                            </option>
                          ))}
                      </select>
                    )}
                  </div>
                  {step === 'instagram_page' && selectedPage && (
                    <p className="text-xs text-[var(--color-muted-foreground)] bg-[var(--color-surface-2)] rounded p-2">
                      O Instagram Business Account vinculado a esta página será conectado.
                    </p>
                  )}
                  <NameField
                    value={displayName}
                    onChange={setDisplayName}
                    placeholder={step === 'instagram_page' ? 'Instagram — @conta' : 'Facebook Page — Nome da Página'}
                  />
                  <button
                    type="button"
                    disabled={loading || !selectedPage}
                    onClick={() => handleFinalize(step === 'instagram_page' ? 'INSTAGRAM' : 'FACEBOOK_PAGE')}
                    className="w-full py-2.5 text-sm font-medium bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? 'Salvando…' : (
                      <><CheckCircle2 className="w-4 h-4" /> {step === 'instagram_page' ? 'Conectar Instagram' : 'Conectar Facebook Page'}</>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function NameField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5 uppercase tracking-wide">
        Nome de exibição (opcional)
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
      />
    </div>
  )
}
