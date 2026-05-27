'use client'

import { useEffect, useState } from 'react'
import { Loader2, CreditCard, Info } from 'lucide-react'
import { useApiClient } from '@/lib/api-client-browser'
import { toast } from 'sonner'

interface AgencyPlanData {
  plan: string
  planLabel: string
  maxClients: number
  maxUsers: number
  trialEndsAt: string | null
  billingConfigured: boolean
  usage: {
    clients: number
    users: number
    integrations: number
  }
}

function formatLimit(current: number, max: number) {
  return `${current} / ${max}`
}

export function PlanSection() {
  const api = useApiClient()
  const [data, setData] = useState<AgencyPlanData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<AgencyPlanData>('/agency/plan')
      .then(setData)
      .catch(() => toast.error('Não foi possível carregar informações do plano'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="card p-12 text-center border-[var(--color-border)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)] mx-auto mb-3" />
        <p className="text-sm text-[var(--color-muted-foreground)]">Carregando plano...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="card p-12 text-center border-[var(--color-border)]">
        <p className="text-[var(--color-muted-foreground)]">Não foi possível carregar o plano da agência.</p>
      </div>
    )
  }

  const trialEnds = data.trialEndsAt ? new Date(data.trialEndsAt).toLocaleDateString('pt-BR') : null

  return (
    <div className="space-y-6">
      <div className="card p-6 border-[var(--color-border)] bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-primary)]/5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[var(--color-foreground)]">
              Plano {data.planLabel}
            </h3>
            {data.plan === 'TRIAL' && trialEnds && (
              <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                Período de trial encerra em <strong>{trialEnds}</strong>.
              </p>
            )}
            {!data.billingConfigured && (
              <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
                Cobrança automática ainda não configurada para esta agência.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[var(--color-border)]">
          <div>
            <p className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider font-semibold">
              Clientes ativos
            </p>
            <p className="text-2xl font-bold text-[var(--color-foreground)] mt-1">
              {formatLimit(data.usage.clients, data.maxClients)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider font-semibold">
              Integrações
            </p>
            <p className="text-2xl font-bold text-[var(--color-foreground)] mt-1">
              {data.usage.integrations}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider font-semibold">
              Membros da equipe
            </p>
            <p className="text-2xl font-bold text-[var(--color-foreground)] mt-1">
              {formatLimit(data.usage.users, data.maxUsers)}
            </p>
          </div>
        </div>
      </div>

      <div className="card p-5 border-[var(--color-border)] flex gap-3">
        <Info className="w-5 h-5 text-[var(--color-muted-foreground)] shrink-0 mt-0.5" />
        <div className="text-sm text-[var(--color-muted-foreground)]">
          <p>
            Para alterar o plano ou limites da agência, entre em contato com o suporte Trax.
            Histórico de faturas e pagamentos online estarão disponíveis quando a integração com
            cobrança for ativada.
          </p>
        </div>
      </div>
    </div>
  )
}
