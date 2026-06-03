'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, MoreHorizontal, ExternalLink, FileText, Calendar, Eye, Pencil, Trash2,
  Share2, CheckCircle, Clock, Filter
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useApiClient } from '@/lib/api-client-browser'
import { toast } from 'sonner'

interface Report {
  id: string
  title: string
  status: 'DRAFT' | 'PUBLISHED'
  periodStart: string
  periodEnd: string
  publishedAt: string | null
  createdAt: string
  shareToken: string | null
  company: {
    id: string
    name: string
    logoUrl: string | null
  }
}

interface ReportTableProps {
  initialReports?: Report[]
}

function DeleteReportDialog({
  report,
  onConfirm,
}: {
  report: Report
  onConfirm: () => void
}) {
  return (
    <AlertDialog.Portal>
      <AlertDialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-fade-in" />
      <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 shadow-2xl data-[state=open]:animate-fade-in">
        <AlertDialog.Title className="text-lg font-bold text-[var(--color-foreground)] mb-2">
          Excluir "{report.title}"?
        </AlertDialog.Title>
        <AlertDialog.Description className="text-sm text-[var(--color-muted-foreground)] mb-6">
          Esta ação não pode ser desfeita. O relatório e todos os seus dados serão removidos permanentemente.
        </AlertDialog.Description>
        <div className="flex justify-end gap-3">
          <AlertDialog.Cancel className="px-4 py-2 text-sm font-medium text-[var(--color-foreground)] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface)] transition-colors">
            Cancelar
          </AlertDialog.Cancel>
          <AlertDialog.Action
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
          >
            Excluir Relatório
          </AlertDialog.Action>
        </div>
      </AlertDialog.Content>
    </AlertDialog.Portal>
  )
}

export function ReportTable({ initialReports = [] }: ReportTableProps) {
  const [reports, setReports] = useState<Report[]>(initialReports)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED'>('ALL')
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null)
  const router = useRouter()
  const api = useApiClient()

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      const matchSearch =
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.company.name.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [reports, search, statusFilter])

  async function handleDelete(report: Report) {
    try {
      await api.delete(`/reports/${report.id}`)
      setReports((prev) => prev.filter((r) => r.id !== report.id))
      toast.success('Relatório excluído com sucesso.')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir relatório')
    } finally {
      setReportToDelete(null)
    }
  }

  function handleCopyShareLink(token: string) {
    const url = `${window.location.origin}/share/${token}`
    navigator.clipboard.writeText(url)
    toast.success('Link copiado para a área de transferência!')
  }

  return (
    <AlertDialog.Root open={!!reportToDelete} onOpenChange={(open) => !open && setReportToDelete(null)}>
      <div className="card overflow-hidden border-[var(--color-border)]">
        {/* Toolbar */}
        <div className="p-4 border-b border-[var(--color-border)] flex flex-col sm:flex-row gap-4 items-center justify-between bg-[var(--color-surface)]">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:min-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar relatórios..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>
            
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--color-foreground)] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface)] transition-colors outline-none shrink-0">
                  <Filter className="w-4 h-4" />
                  {statusFilter === 'ALL' ? 'Todos os Status' : statusFilter === 'PUBLISHED' ? 'Publicados' : 'Rascunhos'}
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="start"
                  sideOffset={4}
                  className="z-50 min-w-[200px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl p-1 animate-fade-in"
                >
                  <DropdownMenu.Item
                    onClick={() => setStatusFilter('ALL')}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] rounded-md outline-none cursor-pointer"
                  >
                    Todos os Status
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onClick={() => setStatusFilter('PUBLISHED')}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] rounded-md outline-none cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Somente Publicados
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onClick={() => setStatusFilter('DRAFT')}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] rounded-md outline-none cursor-pointer"
                  >
                    <Clock className="w-4 h-4 text-amber-500" />
                    Somente Rascunhos
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>

          <Link
            href="/reports/new"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:opacity-90 transition-all shadow-sm glow-primary shrink-0"
          >
            <Plus className="w-4 h-4" />
            Novo Relatório
          </Link>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[var(--color-muted-foreground)] uppercase bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              <tr>
                <th className="px-6 py-4 font-medium">Relatório</th>
                <th className="px-6 py-4 font-medium">Empresa</th>
                <th className="px-6 py-4 font-medium">Período</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    {search || statusFilter !== 'ALL' ? (
                      <div className="flex flex-col items-center gap-3 animate-fade-in">
                        <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center">
                          <Search className="w-6 h-6 text-[var(--color-muted)]" />
                        </div>
                        <p className="font-medium text-[var(--color-foreground)]">Nenhum resultado encontrado</p>
                        <p className="text-sm text-[var(--color-muted-foreground)]">Tente ajustar seus filtros de busca</p>
                        <button
                          onClick={() => { setSearch(''); setStatusFilter('ALL') }}
                          className="mt-1 text-[var(--color-primary)] text-sm font-medium hover:underline"
                        >
                          Limpar filtros
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-6 py-4 max-w-lg mx-auto animate-fade-in">
                        {/* Icon */}
                        <div className="relative">
                          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/20 border border-[var(--color-primary)]/20 flex items-center justify-center">
                            <FileText className="w-9 h-9 text-[var(--color-primary)]" />
                          </div>
                          <div className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-[var(--color-accent)] rounded-full flex items-center justify-center shadow-lg">
                            <Plus className="w-4 h-4 text-white" />
                          </div>
                        </div>

                        <div className="space-y-1.5 text-center">
                          <p className="text-lg font-bold text-[var(--color-foreground)]">Crie seu primeiro relatório</p>
                          <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed max-w-sm mx-auto">
                            Monte relatórios profissionais com dados reais e compartilhe com suas empresas com um clique.
                          </p>
                        </div>

                        {/* Feature pills */}
                        <div className="flex flex-wrap gap-2 justify-center">
                          {['Dados de Meta Ads', 'Google Ads', 'Orgânico', 'CRM', 'Compartilhamento público'].map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-foreground-muted)] rounded-full"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                              {tag}
                            </span>
                          ))}
                        </div>

                        <Link
                          href="/reports/new"
                          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[var(--color-primary)] rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[var(--color-primary)]/25 glow-primary"
                        >
                          <Plus className="w-4 h-4" />
                          Criar Primeiro Relatório
                        </Link>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-[var(--color-surface-2)] transition-colors group"
                  >
                    {/* Título */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-muted-foreground)] shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <Link
                            href={`/reports/${report.id}`}
                            className="font-medium text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors hover:underline"
                          >
                            {report.title}
                          </Link>
                          <div className="text-[var(--color-muted-foreground)] text-xs mt-0.5">
                            Criado em {format(new Date(report.createdAt), "dd 'de' MMM, yyyy", { locale: ptBR })}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Empresa */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {report.company.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={report.company.logoUrl}
                            alt={report.company.name}
                            className="w-6 h-6 rounded border border-[var(--color-border)]"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary)] font-bold text-xs">
                            {report.company.name[0]}
                          </div>
                        )}
                        <Link
                          href={`/reports?companyId=${report.company.id}`}
                          className="text-[var(--color-foreground)] hover:text-[var(--color-primary)] transition-colors"
                        >
                          {report.company.name}
                        </Link>
                      </div>
                    </td>

                    {/* Período */}
                    <td className="px-6 py-4 text-[var(--color-foreground)]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[var(--color-muted-foreground)]" />
                        <span className="text-sm text-[var(--color-muted-foreground)]">
                          {format(new Date(report.periodStart), 'dd/MM/yy')} → {format(new Date(report.periodEnd), 'dd/MM/yy')}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          report.status === 'PUBLISHED'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}
                      >
                        {report.status === 'PUBLISHED' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {report.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Botão visualizar */}
                        <Link
                          href={`/reports/${report.id}`}
                          className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-2)] rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          title="Visualizar relatório"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {/* Botão share (se publicado) */}
                        {report.status === 'PUBLISHED' && report.shareToken && (
                          <button
                            onClick={() => handleCopyShareLink(report.shareToken!)}
                            className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-2)] rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            title="Copiar link público"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Dropdown */}
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger asChild>
                            <button className="p-2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] rounded-lg transition-colors outline-none">
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Portal>
                            <DropdownMenu.Content
                              align="end"
                              sideOffset={4}
                              className="z-50 min-w-[200px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl p-1 animate-fade-in"
                            >
                              <DropdownMenu.Item asChild>
                                <Link
                                  href={`/reports/${report.id}`}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] rounded-md outline-none cursor-pointer"
                                >
                                  <Eye className="w-4 h-4" />
                                  Visualizar Relatório
                                </Link>
                              </DropdownMenu.Item>
                              <DropdownMenu.Item asChild>
                                <Link
                                  href={`/reports/${report.id}/edit`}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] rounded-md outline-none cursor-pointer"
                                >
                                  <Pencil className="w-4 h-4" />
                                  Editar Layout
                                </Link>
                              </DropdownMenu.Item>
                              {report.status === 'PUBLISHED' && report.shareToken && (
                                <>
                                  <DropdownMenu.Item
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] rounded-md outline-none cursor-pointer"
                                    onClick={() => window.open(`/share/${report.shareToken}`, '_blank')}
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    Ver Página Pública
                                  </DropdownMenu.Item>
                                  <DropdownMenu.Item
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] rounded-md outline-none cursor-pointer"
                                    onClick={() => handleCopyShareLink(report.shareToken!)}
                                  >
                                    <Share2 className="w-4 h-4" />
                                    Copiar Link Público
                                  </DropdownMenu.Item>
                                </>
                              )}
                              <DropdownMenu.Separator className="h-px bg-[var(--color-border)] my-1" />
                              <DropdownMenu.Item
                                className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 hover:text-red-300 rounded-md outline-none cursor-pointer transition-colors"
                                onClick={() => setReportToDelete(report)}
                              >
                                <Trash2 className="w-4 h-4" />
                                Excluir Relatório
                              </DropdownMenu.Item>
                            </DropdownMenu.Content>
                          </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-muted-foreground)]">
            {search || statusFilter !== 'ALL'
              ? `${filtered.length} de ${reports.length} relatórios`
              : `${reports.length} relatório${reports.length !== 1 ? 's' : ''} no total`}
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      {reportToDelete && (
        <DeleteReportDialog
          report={reportToDelete}
          onConfirm={() => handleDelete(reportToDelete)}
        />
      )}
    </AlertDialog.Root>
  )
}
