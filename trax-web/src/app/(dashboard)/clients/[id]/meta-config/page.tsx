import { apiRequest } from '@/lib/api-client'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Settings } from 'lucide-react'
import { MetaConfigForm } from '@/components/clients/meta-config-form'
import type { MetaConfigShape } from '@/lib/meta-heuristics'

export const metadata = { title: 'Configuração Meta Ads | Trax' }

export default async function MetaConfigPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const host = (await headers()).get('host') ?? ''

  let client: any = null
  let config: MetaConfigShape | null = null

  try {
    client = await apiRequest<any>(`/clients/${id}`, { domain: host })
  } catch {
    notFound()
  }

  try {
    config = await apiRequest<MetaConfigShape>(`/clients/${id}/meta-config`, { domain: host })
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start gap-4">
        <Link
          href={`/clients/${id}/integrations`}
          className="p-2 -ml-2 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] transition-colors shrink-0 mt-0.5"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <p className="text-sm text-[var(--color-muted-foreground)] mb-1">{client.name}</p>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-[var(--color-primary)]" />
            Configuração Meta Ads
          </h2>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1 max-w-2xl">
            Defina produtos, estados, distribuição de verba e thresholds usados na tela Meta Ads.
            Use &ldquo;Template Tron&rdquo; para carregar os valores padrão do tron-dashboard.
          </p>
        </div>
      </div>

      {config && <MetaConfigForm clientId={id} initialConfig={config} />}
    </div>
  )
}
