'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Plus, ChevronDown } from 'lucide-react'
import { useApiClient } from '@/lib/api-client-browser'
import { toast } from 'sonner'
import type { Integration, IntegrationProvider } from './integration-list'

const PROVIDERS: Array<{ value: IntegrationProvider; label: string; icon: string; fields: FieldDef[] }> = [
  {
    value: 'META_ADS',
    label: 'Meta Ads',
    icon: '📊',
    fields: [
      { key: 'accessToken', label: 'Access Token', placeholder: 'EAAx...', type: 'password' },
      { key: 'adAccountId', label: 'Ad Account ID', placeholder: 'act_1088579197977036', type: 'text' },
    ],
  },
  {
    value: 'INSTAGRAM',
    label: 'Instagram',
    icon: '📸',
    fields: [
      { key: 'accessToken', label: 'Access Token', placeholder: 'EAAx...', type: 'password' },
      { key: 'igUserId', label: 'Instagram Business Account ID', placeholder: '17841400...', type: 'text' },
    ],
  },
  {
    value: 'FACEBOOK_PAGE',
    label: 'Facebook Page',
    icon: '📘',
    fields: [
      { key: 'accessToken', label: 'Page Access Token', placeholder: 'EAAx...', type: 'password' },
      { key: 'pageId', label: 'Page ID', placeholder: '102345678...', type: 'text' },
    ],
  },
  {
    value: 'NECTAR_CRM',
    label: 'Nectar CRM',
    icon: '🌿',
    fields: [
      { key: 'apiToken', label: 'API Token', placeholder: 'seu-token-nectar', type: 'password' },
      { key: 'baseUrl', label: 'Base URL (opcional)', placeholder: 'https://app.nectarcrm.com.br', type: 'text' },
    ],
  },
  {
    value: 'GOOGLE_ADS',
    label: 'Google Ads',
    icon: '🎯',
    fields: [
      { key: 'refreshToken', label: 'Refresh Token', placeholder: '1//...', type: 'password' },
      { key: 'customerId', label: 'Customer ID', placeholder: '123-456-7890', type: 'text' },
      { key: 'developerToken', label: 'Developer Token', placeholder: '...', type: 'password' },
    ],
  },
]

interface FieldDef {
  key: string
  label: string
  placeholder: string
  type: 'text' | 'password'
}

interface Props {
  clientId: string
  onAdded: (integration: Integration) => void
}

export function AddIntegrationDialog({ clientId, onAdded }: Props) {
  const [open, setOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<typeof PROVIDERS[0] | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [externalAccount, setExternalAccount] = useState('')
  const [fields, setFields] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const api = useApiClient()

  function handleProviderSelect(p: typeof PROVIDERS[0]) {
    setSelectedProvider(p)
    setFields({})
    setDisplayName('')
    setExternalAccount('')
  }

  function handleReset() {
    setSelectedProvider(null)
    setFields({})
    setDisplayName('')
    setExternalAccount('')
    setOpen(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProvider) return
    setLoading(true)
    try {
      const credentials: Record<string, string> = {}
      for (const f of selectedProvider.fields) {
        if (fields[f.key]) credentials[f.key] = fields[f.key]
      }
      const integration = await api.post<Integration>(`/clients/${clientId}/integrations`, {
        provider: selectedProvider.value,
        displayName: displayName || undefined,
        credentials,
        externalAccount: externalAccount || undefined,
      })
      toast.success(`Integração "${selectedProvider.label}" adicionada!`)
      onAdded(integration)
      handleReset()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar integração')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[var(--color-primary)] text-[var(--color-primary-foreground)] rounded-lg hover:opacity-90 transition-all shadow-sm">
          <Plus className="w-4 h-4" />
          Adicionar Integração
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl data-[state=open]:animate-fade-in max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-lg font-bold text-[var(--color-foreground)]">
                {selectedProvider ? `Configurar ${selectedProvider.label}` : 'Adicionar Integração'}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-1.5 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </Dialog.Close>
            </div>

            {!selectedProvider ? (
              <div className="grid grid-cols-2 gap-3">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => handleProviderSelect(p)}
                    className="flex items-center gap-3 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-primary)]/60 hover:bg-[var(--color-surface)] transition-all text-left"
                  >
                    <span className="text-2xl">{p.icon}</span>
                    <span className="text-sm font-medium text-[var(--color-foreground)]">{p.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <button
                  type="button"
                  onClick={() => setSelectedProvider(null)}
                  className="text-xs text-[var(--color-primary)] hover:underline mb-2 inline-flex items-center gap-1"
                >
                  ← Voltar
                </button>

                <div>
                  <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5 uppercase tracking-wide">
                    Nome de exibição (opcional)
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={`Ex: ${selectedProvider.label} — Conta Principal`}
                    className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                  />
                </div>

                {selectedProvider.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5 uppercase tracking-wide">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      value={fields[field.key] ?? ''}
                      onChange={(e) => setFields((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      autoComplete="off"
                      className="w-full px-3 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors font-mono"
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5 uppercase tracking-wide">
                    ID da Conta / Recurso Externo (opcional)
                  </label>
                  <input
                    type="text"
                    value={externalAccount}
                    onChange={(e) => setExternalAccount(e.target.value)}
                    placeholder="ex: act_1088579197977036"
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
                    {loading ? 'Salvando…' : 'Salvar Integração'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
