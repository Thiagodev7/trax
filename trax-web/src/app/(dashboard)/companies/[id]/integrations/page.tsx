import { apiRequest } from '@/lib/api-client'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plug } from 'lucide-react'
import { IntegrationList } from '@/components/integrations/integration-list'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return { title: 'Integrações | Trax' }
}

export default async function ClientIntegrationsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const host = (await headers()).get('host') ?? ''

  let client: any = null
  let integrations: any[] = []

  try {
    client = await apiRequest<any>(`/companies/${id}`, { domain: host })
  } catch {
    notFound()
  }

  try {
    integrations = await apiRequest<any[]>(`/companies/${id}/integrations`, { domain: host })
  } catch {
    integrations = []
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href={`/companies`}
          className="p-2 -ml-2 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] transition-colors shrink-0 mt-0.5"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {client.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={client.logoUrl} alt={client.name} className="w-8 h-8 rounded-lg border border-[var(--color-border)]" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)] font-bold text-sm">
                {client.name[0]}
              </div>
            )}
            <span className="text-sm text-[var(--color-muted-foreground)]">{client.name}</span>
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-foreground)] tracking-tight flex items-center gap-2">
            <Plug className="w-6 h-6 text-[var(--color-primary)]" />
            Integrações
          </h2>
          <p className="text-[var(--color-muted-foreground)] mt-1 text-sm">
            Gerencie as conexões com plataformas de marketing para sincronizar dados automaticamente.
          </p>
        </div>
        <Link
          href={`/companies/${id}/meta-config`}
          className="text-sm px-3 py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] inline-flex items-center gap-2 self-start"
        >
          Configurar Meta Ads
        </Link>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[
          { title: 'Meta Ads', desc: 'Campanhas, conjuntos, criativos, leads e gastos diários', icon: '📊' },
          { title: 'Google Ads', desc: 'Gastos, conversões, CPC, impression share e quality score', icon: '🎯' },
          { title: 'Instagram / Facebook', desc: 'Seguidores, alcance, engajamento e histórico de posts', icon: '📸' },
          { title: 'Nectar CRM', desc: 'Pipeline, vendas fechadas, receita e histórico mensal', icon: '🌿' },
          {
            title: 'RD Station',
            desc: 'Leads por segmentação, enrich lifecycle (lotes), conversões diárias e CPL',
            icon: '🚀',
          },
        ].map((item) => (
          <div key={item.title} className="card p-4 border-[var(--color-border)] flex items-start gap-3">
            <span className="text-2xl">{item.icon}</span>
            <div>
              <p className="text-sm font-semibold text-[var(--color-foreground)]">{item.title}</p>
              <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <IntegrationList companyId={id} initialIntegrations={integrations} />
    </div>
  )
}
