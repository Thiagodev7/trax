'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { useApiClient } from '@/lib/api-client-browser'
import { toast } from 'sonner'
import type { Integration } from './integration-list'

interface Props {
  companyId: string
  onIntegrationAdded: (integration: Integration) => void
}

export function GoogleAdsOAuthHandler({ companyId, onIntegrationAdded }: Props) {
  const searchParams = useSearchParams()
  const api = useApiClient()
  const [open, setOpen] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [customers, setCustomers] = useState<Array<{ id: string; formatted: string }>>([])
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const oauth = searchParams.get('google_oauth')
    const pid = searchParams.get('pendingId')
    if (oauth === 'pending' && pid) {
      setPendingId(pid)
      setOpen(true)
      loadCustomers(pid)
      window.history.replaceState({}, '', window.location.pathname)
    } else if (oauth === 'error') {
      toast.error(searchParams.get('message') || 'Erro na conexão Google')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [searchParams])

  async function loadCustomers(pid: string) {
    setLoading(true)
    try {
      const list = await api.get<Array<{ id: string; formatted: string }>>(
        `/companies/${companyId}/integrations/google-ads/customers?pendingId=${pid}`,
      )
      setCustomers(list)
      if (list.length === 1) setSelectedCustomer(list[0].id)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao listar contas Google Ads')
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  async function handleFinalize() {
    if (!pendingId || !selectedCustomer) return
    setLoading(true)
    try {
      const integration = await api.post<Integration>(
        `/companies/${companyId}/integrations/google-ads/finalize`,
        {
          pendingId,
          customerId: selectedCustomer,
          displayName: displayName || undefined,
        },
      )
      toast.success('Google Ads conectado com sucesso!')
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
          <Dialog.Title className="text-lg font-bold text-[var(--color-foreground)] mb-2">
            Selecionar conta Google Ads
          </Dialog.Title>
          <Dialog.Description className="text-sm text-[var(--color-muted-foreground)] mb-4">
            Escolha a conta de anúncios que deseja vincular a este cliente.
          </Dialog.Description>

          {loading && customers.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">Carregando contas…</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5 uppercase">
                  Customer ID
                </label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg"
                >
                  <option value="">Selecione…</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.formatted} ({c.id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5 uppercase">
                  Nome (opcional)
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Google Ads — Conta Principal"
                  className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg"
                />
              </div>
              <button
                type="button"
                disabled={loading || !selectedCustomer}
                onClick={handleFinalize}
                className="w-full py-2 text-sm font-medium bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg disabled:opacity-50"
              >
                {loading ? 'Salvando…' : 'Conectar conta'}
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
