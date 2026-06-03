'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import * as Dialog from '@radix-ui/react-dialog'
import { useApiClient } from '@/lib/api-client-browser'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, Megaphone, Globe } from 'lucide-react'
import type { Integration } from './integration-list'

interface MetaAdAccount {
  id: string
  name: string
  currency: string
}

interface MetaPage {
  id: string
  name: string
  instagramAccountId: string | null
}

type Step = 'choose' | 'ads' | 'pages' | 'done'

type MetaProviderIntent = 'META_ADS' | 'INSTAGRAM' | 'FACEBOOK_PAGE'

interface Props {
  companyId: string
  onIntegrationAdded: (integration: Integration) => void
}

function parseProviderIntent(
  fromUrl: string | null,
): MetaProviderIntent | null {
  if (fromUrl === 'META_ADS' || fromUrl === 'INSTAGRAM' || fromUrl === 'FACEBOOK_PAGE') {
    return fromUrl
  }
  if (typeof window === 'undefined') return null
  const stored = sessionStorage.getItem('meta_oauth_provider')
  if (stored === 'META_ADS' || stored === 'INSTAGRAM' || stored === 'FACEBOOK_PAGE') {
    return stored
  }
  return null
}

export function MetaOAuthHandler({ companyId, onIntegrationAdded }: Props) {
  const searchParams = useSearchParams()
  const api = useApiClient()
  const { status: sessionStatus } = useSession()

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('choose')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [providerIntent, setProviderIntent] = useState<MetaProviderIntent | null>(null)
  const [pageSaveAs, setPageSaveAs] = useState<'INSTAGRAM' | 'FACEBOOK_PAGE' | null>(null)
  const [adAccounts, setAdAccounts] = useState<MetaAdAccount[]>([])
  const [pages, setPages] = useState<MetaPage[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedAdAccount, setSelectedAdAccount] = useState<string | null>(null)
  const [selectedPage, setSelectedPage] = useState<string | null>(null)
  const oauthHandledRef = useRef(false)

  const loadAdAccounts = useCallback(
    async (pid: string) => {
      setLoading(true)
      try {
        const list = await api.get<MetaAdAccount[]>(
          `/companies/${companyId}/integrations/meta/ad-accounts?pendingId=${pid}`,
        )
        setAdAccounts(list)
        setStep('ads')
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Erro ao carregar contas de anúncio')
        setOpen(false)
      } finally {
        setLoading(false)
      }
    },
    [api, companyId],
  )

  const loadPages = useCallback(
    async (pid: string) => {
      setLoading(true)
      try {
        const list = await api.get<MetaPage[]>(
          `/companies/${companyId}/integrations/meta/pages?pendingId=${pid}`,
        )
        setPages(list)
        setStep('pages')
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Erro ao carregar páginas')
        setOpen(false)
      } finally {
        setLoading(false)
      }
    },
    [api, companyId],
  )

  useEffect(() => {
    const oauthStatus = searchParams.get('meta_oauth')
    const pid = searchParams.get('pendingId')
    if (oauthStatus === 'error') {
      toast.error(searchParams.get('message') || 'Erro na conexão Meta')
      window.history.replaceState({}, '', window.location.pathname)
      return
    }
    if (oauthStatus !== 'pending' || !pid || oauthHandledRef.current) return
    oauthHandledRef.current = true

    const intent = parseProviderIntent(searchParams.get('provider'))
    setPendingId(pid)
    setProviderIntent(intent)
    setOpen(true)
    sessionStorage.removeItem('meta_oauth_provider')

    if (intent === 'META_ADS') {
      setStep('ads')
    } else if (intent === 'INSTAGRAM') {
      setStep('pages')
      setPageSaveAs('INSTAGRAM')
    } else if (intent === 'FACEBOOK_PAGE') {
      setStep('pages')
      setPageSaveAs('FACEBOOK_PAGE')
    } else {
      setStep('choose')
    }

    toast.success('Meta conectado! Selecione a conta ou página.')
    window.history.replaceState({}, '', window.location.pathname)
  }, [searchParams])

  useEffect(() => {
    if (!open || !pendingId || sessionStatus !== 'authenticated') return
    if (step === 'ads' && adAccounts.length === 0 && !loading) {
      void loadAdAccounts(pendingId)
    }
    if (step === 'pages' && pages.length === 0 && !loading) {
      void loadPages(pendingId)
    }
  }, [
    open,
    pendingId,
    sessionStatus,
    step,
    adAccounts.length,
    pages.length,
    loading,
    loadAdAccounts,
    loadPages,
  ])

  const handleChooseAds = () => {
    setStep('ads')
    if (pendingId && sessionStatus === 'authenticated') void loadAdAccounts(pendingId)
  }

  const handleChoosePages = (saveAs: 'INSTAGRAM' | 'FACEBOOK_PAGE') => {
    setPageSaveAs(saveAs)
    setStep('pages')
    if (pendingId && sessionStatus === 'authenticated') void loadPages(pendingId)
  }

  const handleSaveAdAccount = async () => {
    if (!pendingId || !selectedAdAccount) return
    setSaving(true)
    try {
      const integration = await api.post<Integration>(
        `/companies/${companyId}/integrations/meta/finalize`,
        {
          pendingId,
          adAccountId: selectedAdAccount,
          targetProvider: 'META_ADS',
        },
      )
      toast.success('Meta Ads conectado com sucesso!')
      onIntegrationAdded(integration)
      setStep('done')
      setTimeout(() => setOpen(false), 1500)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar integração')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePage = async (provider: 'FACEBOOK_PAGE' | 'INSTAGRAM') => {
    if (!pendingId || !selectedPage) return
    const page = pages.find((p) => p.id === selectedPage)
    if (!page) return
    if (provider === 'INSTAGRAM' && !page.instagramAccountId) {
      toast.error('Esta página não tem conta Instagram Business vinculada.')
      return
    }
    setSaving(true)
    try {
      const integration = await api.post<Integration>(
        `/companies/${companyId}/integrations/meta/finalize`,
        {
          pendingId,
          pageId: page.id,
          targetProvider: provider,
        },
      )
      toast.success(
        provider === 'INSTAGRAM' ? 'Instagram conectado!' : 'Facebook Page conectado!',
      )
      onIntegrationAdded(integration)
      setStep('done')
      setTimeout(() => setOpen(false), 1500)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar integração')
    } finally {
      setSaving(false)
    }
  }

  const sessionLoading = open && pendingId && sessionStatus !== 'authenticated'

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-[100]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-lg font-bold text-[var(--color-foreground)] mb-1">
            {step === 'done' ? 'Conectado!' : 'Configurar Meta'}
          </Dialog.Title>
          <Dialog.Description className="text-sm text-[var(--color-muted-foreground)] mb-5">
            {step === 'choose' && 'Escolha o que deseja conectar com sua conta Meta.'}
            {step === 'ads' && 'Selecione a conta de anúncios (Meta Ads).'}
            {step === 'pages' && 'Selecione a página do Facebook.'}
            {step === 'done' && 'Integração salva com sucesso.'}
          </Dialog.Description>

          {sessionLoading && (
            <div className="flex items-center justify-center py-8 gap-2 text-[var(--color-muted-foreground)]">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Preparando sessão…</span>
            </div>
          )}

          {!sessionLoading && step === 'choose' && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleChooseAds}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors text-left"
              >
                <Megaphone className="h-5 w-5 text-[var(--color-primary)] shrink-0" />
                <div>
                  <p className="font-medium text-[var(--color-foreground)]">Meta Ads</p>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    Métricas de campanhas e gastos
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleChoosePages('FACEBOOK_PAGE')}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors text-left"
              >
                <Globe className="h-5 w-5 text-blue-500 shrink-0" />
                <div>
                  <p className="font-medium text-[var(--color-foreground)]">Facebook Page</p>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    Métricas orgânicas da página
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleChoosePages('INSTAGRAM')}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors text-left"
              >
                <span className="text-xl shrink-0" aria-hidden>
                  📷
                </span>
                <div>
                  <p className="font-medium text-[var(--color-foreground)]">Instagram Business</p>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    Métricas orgânicas do Instagram
                  </p>
                </div>
              </button>
            </div>
          )}

          {!sessionLoading && step === 'ads' && (
            <div className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--color-muted-foreground)]" />
                </div>
              ) : adAccounts.length === 0 ? (
                <p className="text-sm text-[var(--color-muted-foreground)] text-center py-4">
                  Nenhuma conta de anúncio encontrada.
                </p>
              ) : (
                adAccounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setSelectedAdAccount(acc.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${
                      selectedAdAccount === acc.id
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                        : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-[var(--color-foreground)]">{acc.name}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        {acc.id} · {acc.currency}
                      </p>
                    </div>
                  </button>
                ))
              )}
              <button
                type="button"
                onClick={handleSaveAdAccount}
                disabled={!selectedAdAccount || saving}
                className="w-full py-2 text-sm font-medium bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg disabled:opacity-50"
              >
                {saving ? 'Salvando…' : 'Conectar conta'}
              </button>
            </div>
          )}

          {!sessionLoading && step === 'pages' && (
            <div className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--color-muted-foreground)]" />
                </div>
              ) : pages.length === 0 ? (
                <p className="text-sm text-[var(--color-muted-foreground)] text-center py-4">
                  Nenhuma página encontrada. Verifique permissões no app Meta.
                </p>
              ) : (
                pages.map((page) => (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => setSelectedPage(page.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${
                      selectedPage === page.id
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                        : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-[var(--color-foreground)]">{page.name}</p>
                      {page.instagramAccountId && (
                        <p className="text-xs text-[var(--color-muted-foreground)]">
                          Instagram vinculado
                        </p>
                      )}
                    </div>
                  </button>
                ))
              )}
              {selectedPage && (
                <div className="flex gap-2">
                  {(pageSaveAs === 'FACEBOOK_PAGE' || providerIntent === 'FACEBOOK_PAGE') && (
                    <button
                      type="button"
                      onClick={() => handleSavePage('FACEBOOK_PAGE')}
                      disabled={saving}
                      className="flex-1 py-2 text-sm font-medium border border-[var(--color-border)] rounded-lg disabled:opacity-50"
                    >
                      {saving ? 'Salvando…' : 'Facebook Page'}
                    </button>
                  )}
                  {(pageSaveAs === 'INSTAGRAM' || providerIntent === 'INSTAGRAM') &&
                    pages.find((p) => p.id === selectedPage)?.instagramAccountId && (
                      <button
                        type="button"
                        onClick={() => handleSavePage('INSTAGRAM')}
                        disabled={saving}
                        className="flex-1 py-2 text-sm font-medium bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg disabled:opacity-50"
                      >
                        {saving ? 'Salvando…' : 'Instagram'}
                      </button>
                    )}
                  {!pageSaveAs && !providerIntent && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSavePage('FACEBOOK_PAGE')}
                        disabled={saving}
                        className="flex-1 py-2 text-sm border border-[var(--color-border)] rounded-lg disabled:opacity-50"
                      >
                        Facebook Page
                      </button>
                      {pages.find((p) => p.id === selectedPage)?.instagramAccountId && (
                        <button
                          type="button"
                          onClick={() => handleSavePage('INSTAGRAM')}
                          disabled={saving}
                          className="flex-1 py-2 text-sm bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg disabled:opacity-50"
                        >
                          Instagram
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center py-6 gap-2">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-[var(--color-foreground)] font-medium">Integração configurada!</p>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
