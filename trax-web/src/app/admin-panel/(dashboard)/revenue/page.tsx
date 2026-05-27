import { CreditCard, Construction } from 'lucide-react'
import { adminGetStats } from '@/lib/admin-api'

export default async function RevenuePage() {
  const stats = await adminGetStats()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Receita</h1>
        <p className="text-sm text-white/40 mt-1">Faturamento e assinaturas da plataforma</p>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-5">
          <Construction className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Integração Stripe em breve</h2>
        <p className="text-sm text-white/40 max-w-md mx-auto">
          O painel de receita com MRR, faturas e métricas financeiras será disponibilizado após a integração completa com Stripe.
        </p>
      </div>

      {stats && (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-white/40" />
            Dados disponíveis hoje
          </h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-white/30 mb-1">Agências com Stripe Customer ID</dt>
              <dd className="text-2xl font-black text-white">{stats.agenciesWithStripeCustomer}</dd>
            </div>
            <div>
              <dt className="text-xs text-white/30 mb-1">Total de agências</dt>
              <dd className="text-2xl font-black text-white">{stats.totalAgencies}</dd>
            </div>
          </dl>
          <p className="text-xs text-white/25 mt-4">
            Apenas contagens reais do banco de dados — sem valores monetários estimados.
          </p>
        </div>
      )}
    </div>
  )
}
