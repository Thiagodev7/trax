'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Globe, Mail, Plug, FileBarChart2, Settings2,
  ExternalLink, Plus, RefreshCw, AlertCircle, CheckCircle2,
  Clock, Activity, Pencil, Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'overview' | 'integrations' | 'reports'

const PROVIDER_LABELS: Record<string, string> = {
  META_ADS: 'Meta Ads',
  GOOGLE_ADS: 'Google Ads',
  GOOGLE_ANALYTICS: 'Google Analytics',
  TIKTOK_ADS: 'TikTok Ads',
  LINKEDIN_ADS: 'LinkedIn Ads',
  INSTAGRAM: 'Instagram',
  FACEBOOK_PAGE: 'Facebook',
  NECTAR_CRM: 'Nectar CRM',
  CUSTOM: 'Personalizado',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  ACTIVE: { label: 'Ativo', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  INACTIVE: { label: 'Inativo', color: 'text-zinc-400', bg: 'bg-zinc-500/10', icon: Clock },
  ERROR: { label: 'Erro', color: 'text-red-400', bg: 'bg-red-500/10', icon: AlertCircle },
  PENDING_AUTH: { label: 'Pendente', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Clock },
}

const REPORT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT: { label: 'Rascunho', color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
  PUBLISHED: { label: 'Publicado', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ARCHIVED: { label: 'Arquivado', color: 'text-amber-400', bg: 'bg-amber-500/10' },
}

interface Props {
  client: any
  integrations: any[]
  reports: any[]
}

export function ClientDetailView({ client, integrations, reports }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const tabs: { id: Tab; label: string; icon: typeof Plug; count?: number }[] = [
    { id: 'overview', label: 'Visão Geral', icon: Activity },
    { id: 'integrations', label: 'Integrações', icon: Plug, count: integrations.length },
    { id: 'reports', label: 'Relatórios', icon: FileBarChart2, count: reports.length },
  ]

  const activeIntegrations = integrations.filter(i => i.status === 'ACTIVE').length
  const errorIntegrations = integrations.filter(i => i.status === 'ERROR').length
  const publishedReports = reports.filter(r => r.status === 'PUBLISHED').length

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Link href="/clients" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Todos os clientes
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4">
            {client.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={client.logoUrl} alt={client.name} className="w-16 h-16 rounded-2xl object-cover border border-[var(--color-border)] shadow-lg" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {client.name[0]}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{client.name}</h1>
                <span className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-full',
                  client.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400',
                )}>
                  {client.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-[var(--color-muted-foreground)]">
                {client.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {client.email}
                  </span>
                )}
                {client.website && (
                  <a href={client.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors">
                    <Globe className="w-3.5 h-3.5" />
                    {client.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="sm:ml-auto flex gap-2">
            <Link href={`/clients/${client.id}/integrations`} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--color-foreground)] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-surface)] transition-colors">
              <Plug className="w-4 h-4" /> Integrações
            </Link>
            <Link href={`/clients/${client.id}/edit`} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-xl hover:opacity-90 transition-all glow-primary">
              <Pencil className="w-4 h-4" /> Editar
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[var(--color-border)]">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative',
                  isActive
                    ? 'text-[var(--color-primary)]'
                    : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full font-medium',
                    isActive ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' : 'bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)]',
                  )}>
                    {tab.count}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="clientTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]"
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {/* ─── Overview ─────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Integrações', value: integrations.length, sub: `${activeIntegrations} ativas`, icon: Plug, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                  { label: 'Com erro', value: errorIntegrations, sub: errorIntegrations > 0 ? 'Requer atenção' : 'Tudo OK', icon: AlertCircle, color: errorIntegrations > 0 ? 'text-red-400' : 'text-emerald-400', bg: errorIntegrations > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10' },
                  { label: 'Relatórios', value: reports.length, sub: `${publishedReports} publicados`, icon: FileBarChart2, color: 'text-sky-400', bg: 'bg-sky-500/10' },
                  { label: 'Cliente desde', value: new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(new Date(client.createdAt)), sub: 'Data de cadastro', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                ].map(({ label, value, sub, icon: Icon, color, bg }) => (
                  <div key={label} className="card p-4 border border-[var(--color-border)]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', bg)}>
                        <Icon className={cn('w-4 h-4', color)} />
                      </div>
                      <span className="text-xs font-medium text-[var(--color-muted-foreground)]">{label}</span>
                    </div>
                    <p className="text-2xl font-bold text-[var(--color-foreground)]">{value}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Recent Reports */}
              {reports.length > 0 && (
                <div className="card border border-[var(--color-border)] overflow-hidden">
                  <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
                    <h3 className="font-semibold text-[var(--color-foreground)]">Relatórios Recentes</h3>
                    <Link href={`/reports?clientId=${client.id}`} className="text-xs text-[var(--color-primary)] hover:underline">Ver todos</Link>
                  </div>
                  <div className="divide-y divide-[var(--color-border)]">
                    {reports.slice(0, 5).map((r) => {
                      const st = REPORT_STATUS[r.status] || REPORT_STATUS.DRAFT
                      return (
                        <div key={r.id} className="flex items-center justify-between px-5 py-3 hover:bg-[var(--color-surface-2)] transition-colors">
                          <div>
                            <p className="text-sm font-medium text-[var(--color-foreground)]">{r.title}</p>
                            <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                              {r.periodStart && r.periodEnd
                                ? `${new Intl.DateTimeFormat('pt-BR').format(new Date(r.periodStart))} – ${new Intl.DateTimeFormat('pt-BR').format(new Date(r.periodEnd))}`
                                : new Intl.DateTimeFormat('pt-BR').format(new Date(r.createdAt))}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={cn('text-xs font-medium px-2 py-1 rounded-full', st.bg, st.color)}>
                              {st.label}
                            </span>
                            <Link href={`/reports/${r.id}`} className="p-1.5 rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors">
                              <Eye className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Integrations ─────────────────────────────────── */}
          {activeTab === 'integrations' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Link
                  href={`/clients/${client.id}/integrations`}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-xl hover:opacity-90 transition-all"
                >
                  <Plus className="w-4 h-4" /> Adicionar Integração
                </Link>
              </div>

              {integrations.length === 0 ? (
                <div className="card border border-[var(--color-border)] py-16 text-center">
                  <Plug className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-4 opacity-40" />
                  <p className="font-medium text-[var(--color-foreground)]">Nenhuma integração configurada</p>
                  <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Conecte plataformas de anúncios para puxar métricas automaticamente.</p>
                  <Link href={`/clients/${client.id}/integrations`} className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-xl hover:opacity-90">
                    <Plus className="w-4 h-4" /> Adicionar primeira integração
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {integrations.map((integration) => {
                    const st = STATUS_CONFIG[integration.status] || STATUS_CONFIG.INACTIVE
                    const StatusIcon = st.icon
                    return (
                      <div key={integration.id} className="card p-5 border border-[var(--color-border)] flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center">
                            <Plug className="w-5 h-5 text-[var(--color-primary)]" />
                          </div>
                          <div>
                            <p className="font-medium text-[var(--color-foreground)]">
                              {integration.displayName || PROVIDER_LABELS[integration.provider] || integration.provider}
                            </p>
                            <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                              {PROVIDER_LABELS[integration.provider] || integration.provider}
                            </p>
                            {integration.lastSyncAt && (
                              <p className="text-xs text-[var(--color-muted)] mt-1 flex items-center gap-1">
                                <RefreshCw className="w-3 h-3" />
                                Última sync: {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(integration.lastSyncAt))}
                              </p>
                            )}
                            {integration.lastErrorMsg && (
                              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {integration.lastErrorMsg.slice(0, 60)}…
                              </p>
                            )}
                          </div>
                        </div>
                        <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full shrink-0', st.bg, st.color)}>
                          <StatusIcon className="w-3 h-3" />
                          {st.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── Reports ──────────────────────────────────────── */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Link
                  href={`/reports/new?clientId=${client.id}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-xl hover:opacity-90 transition-all"
                >
                  <Plus className="w-4 h-4" /> Novo Relatório
                </Link>
              </div>

              {reports.length === 0 ? (
                <div className="card border border-[var(--color-border)] py-16 text-center">
                  <FileBarChart2 className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-4 opacity-40" />
                  <p className="font-medium text-[var(--color-foreground)]">Nenhum relatório ainda</p>
                  <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Crie o primeiro relatório para compartilhar com {client.name}.</p>
                </div>
              ) : (
                <div className="card border border-[var(--color-border)] overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[var(--color-border)]">
                        {['Título', 'Período', 'Status', ''].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((r) => {
                        const st = REPORT_STATUS[r.status] || REPORT_STATUS.DRAFT
                        return (
                          <tr key={r.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors">
                            <td className="px-5 py-3">
                              <Link href={`/reports/${r.id}`} className="text-sm font-medium text-[var(--color-foreground)] hover:text-[var(--color-primary)] transition-colors">
                                {r.title}
                              </Link>
                            </td>
                            <td className="px-5 py-3 text-xs text-[var(--color-muted-foreground)]">
                              {r.periodStart && r.periodEnd
                                ? `${new Intl.DateTimeFormat('pt-BR').format(new Date(r.periodStart))} → ${new Intl.DateTimeFormat('pt-BR').format(new Date(r.periodEnd))}`
                                : '—'}
                            </td>
                            <td className="px-5 py-3">
                              <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', st.bg, st.color)}>
                                {st.label}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2 justify-end">
                                <Link href={`/reports/${r.id}`} className="p-1.5 rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors">
                                  <Eye className="w-4 h-4" />
                                </Link>
                                {r.shareToken && (
                                  <a href={`/share/${r.shareToken}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors">
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
