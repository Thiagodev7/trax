'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { useApiClient } from '@/lib/api-client-browser'
import { toast } from 'sonner'
import { CheckCircle2 } from 'lucide-react'
import type { Integration } from './integration-list'

interface Props {
  companyId: string
  onIntegrationAdded: (integration: Integration) => void
}

export function RdStationOAuthHandler({ companyId, onIntegrationAdded }: Props) {
  const searchParams = useSearchParams()
  const api = useApiClient()

  const [open, setOpen] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const oauth = searchParams.get('rd_oauth')
    const pid = searchParams.get('pendingId')
    if (oauth === 'pending' && pid) {
      setPendingId(pid)
      setOpen(true)
      window.history.replaceState({}, '', window.location.pathname)
    } else if (oauth === 'error') {
      toast.error(searchParams.get('message') || 'Erro na conexão RD Station')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [searchParams])

  async function handleFinalize() {
    if (!pendingId) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ pendingId })
      if (displayName) params.set('displayName', displayName)
      const integration = await api.post<Integration>(
        `/companies/${companyId}/integrations/rd-station/finalize?${params.toString()}`,
        {},
      )
      toast.success('RD Station conectado com sucesso!')
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
            Confirmar conexão RD Station
          </Dialog.Title>
          <Dialog.Description className="text-sm text-[var(--color-muted-foreground)] mb-5">
            Autorização concedida! Confirme um nome para esta integração.
          </Dialog.Description>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-sm text-emerald-300">Conta RD Station autorizada com sucesso.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5 uppercase tracking-wide">
                Nome de exibição (opcional)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="RD Station — Conta Principal"
                className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleFinalize}
              className="w-full py-2.5 text-sm font-medium bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Salvando…' : <><CheckCircle2 className="w-4 h-4" /> Confirmar e Salvar</>}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
