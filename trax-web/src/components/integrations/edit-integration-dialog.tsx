'use client'

import { useEffect, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useApiClient } from '@/lib/api-client-browser'
import { toast } from 'sonner'
import type { Integration } from './integration-list'

interface Props {
  integration: Integration
  onUpdated: (integration: Integration) => void
  onClose: () => void
}

export function EditIntegrationDialog({ integration, onUpdated, onClose }: Props) {
  const [displayName, setDisplayName] = useState(integration.displayName ?? '')
  const [accessToken, setAccessToken] = useState('')
  const [loading, setLoading] = useState(false)
  const api = useApiClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload: Record<string, unknown> = {}
      if (displayName !== (integration.displayName ?? '')) {
        payload.displayName = displayName
      }
      if (accessToken) {
        payload.credentials = { accessToken }
      }
      if (!Object.keys(payload).length) {
        toast.info('Nenhuma alteração detectada.')
        setLoading(false)
        return
      }
      const updated = await api.patch<Integration>(`/integrations/${integration.id}`, payload)
      toast.success('Integração atualizada!')
      onUpdated(updated)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-lg font-bold text-[var(--color-foreground)]">
              Editar Integração
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5 uppercase tracking-wide">
                Nome de Exibição
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5 uppercase tracking-wide">
                Novo Access Token (deixe em branco para manter)
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="EAAx..."
                autoComplete="off"
                className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors font-mono"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="flex-1 px-4 py-2 text-sm font-medium text-[var(--color-foreground)] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface)] transition-colors"
                >
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-medium bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg hover:opacity-90 transition-all disabled:opacity-60"
              >
                {loading ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
