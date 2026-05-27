'use client'

import { useEffect, useState } from 'react'
import { Loader2, Bell } from 'lucide-react'
import { toast } from 'sonner'
import { useApiClient } from '@/lib/api-client-browser'
import { cn } from '@/lib/utils'

interface NotificationPreferences {
  notifyReportPublished: boolean
  notifyIntegrationErrors: boolean
  notifyNewClient: boolean
  notifyWeeklySummary: boolean
}

interface MeResponse {
  notifications: NotificationPreferences
}

const PREFERENCE_ITEMS: {
  key: keyof NotificationPreferences
  title: string
  desc: string
}[] = [
  {
    key: 'notifyReportPublished',
    title: 'Relatórios publicados',
    desc: 'Receba um e-mail quando um relatório for finalizado e publicado.',
  },
  {
    key: 'notifyIntegrationErrors',
    title: 'Erros de integração',
    desc: 'Seja alertado quando uma integração com Meta, Google ou outra plataforma falhar.',
  },
  {
    key: 'notifyNewClient',
    title: 'Novo cliente',
    desc: 'Notifique quando um novo cliente for adicionado à agência.',
  },
  {
    key: 'notifyWeeklySummary',
    title: 'Resumo semanal',
    desc: 'Receba um resumo semanal com o desempenho geral da agência.',
  },
]

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out border-2 border-transparent disabled:opacity-50',
        checked ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-surface-2)]',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
          checked ? 'translate-x-4' : 'translate-x-0',
        )}
      />
    </button>
  )
}

export function NotificationsForm() {
  const api = useApiClient()
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api
      .get<MeResponse>('/auth/me')
      .then((me) => setPrefs(me.notifications))
      .catch(() => toast.error('Não foi possível carregar preferências de notificação'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function updatePref(key: keyof NotificationPreferences, value: boolean) {
    setPrefs((current) => (current ? { ...current, [key]: value } : current))
  }

  async function handleSave() {
    if (!prefs) return

    setSaving(true)
    try {
      const updated = await api.patch<NotificationPreferences>('/auth/me/notifications', prefs)
      setPrefs(updated)
      toast.success('Preferências salvas com sucesso')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao salvar preferências')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="card p-12 text-center border-[var(--color-border)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)] mx-auto mb-3" />
        <p className="text-sm text-[var(--color-muted-foreground)]">Carregando preferências...</p>
      </div>
    )
  }

  if (!prefs) {
    return (
      <div className="card p-12 text-center border-[var(--color-border)]">
        <p className="text-[var(--color-muted-foreground)]">Não foi possível carregar as preferências.</p>
      </div>
    )
  }

  return (
    <div className="card p-6 border-[var(--color-border)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-[var(--color-foreground)]">Preferências de notificação</h3>
          <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
            Escolha quais alertas você deseja receber por e-mail.
          </p>
        </div>
      </div>

      <div className="space-y-6 max-w-2xl">
        {PREFERENCE_ITEMS.map((item) => (
          <div key={item.key} className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[var(--color-foreground)]">{item.title}</p>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{item.desc}</p>
            </div>
            <Toggle
              checked={prefs[item.key]}
              onChange={(value) => updatePref(item.key, value)}
              disabled={saving}
            />
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:opacity-90 transition-all disabled:opacity-60"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Salvando...' : 'Salvar preferências'}
        </button>
      </div>
    </div>
  )
}
