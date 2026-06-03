'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, MoreHorizontal, ExternalLink, Activity, Pencil, Trash2, Eye, Plug, Users } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { formatNumber } from '@/lib/utils'
import { useApiClient } from '@/lib/api-client-browser'
import { toast } from 'sonner'

interface Company {
  id: string
  name: string
  email?: string
  website?: string
  logoUrl?: string
  isActive: boolean
  _count?: {
    reports: number
  }
}

interface CompanyTableProps {
  initialCompanies?: Company[]
}

function DeactivateDialog({
  company,
  onConfirm,
  isLoading,
}: {
  company: Company
  onConfirm: () => void
  isLoading: boolean
}) {
  return (
    <AlertDialog.Portal>
      <AlertDialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-fade-in" />
      <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 shadow-2xl data-[state=open]:animate-fade-in">
        <AlertDialog.Title className="text-lg font-bold text-[var(--color-foreground)] mb-2">
          Desativar {company.name}?
        </AlertDialog.Title>
        <AlertDialog.Description className="text-sm text-[var(--color-muted-foreground)] mb-6">
          A empresa será desativada e não aparecerá em novas operações. Você pode reativá-lo depois.
        </AlertDialog.Description>
        <div className="flex justify-end gap-3">
          <AlertDialog.Cancel className="px-4 py-2 text-sm font-medium text-[var(--color-foreground)] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface)] transition-colors">
            Cancelar
          </AlertDialog.Cancel>
          <AlertDialog.Action
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60"
          >
            Desativar
          </AlertDialog.Action>
        </div>
      </AlertDialog.Content>
    </AlertDialog.Portal>
  )
}

export function CompanyTable({ initialCompanies = [] }: CompanyTableProps) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies)
  const [search, setSearch] = useState('')
  const [companyToDeactivate, setCompanyToDeactivate] = useState<Company | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const api = useApiClient()

  const filtered = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()),
  )

  async function handleDeactivate(company: Company) {
    try {
      await api.delete(`/companies/${company.id}`)
      setCompanies((prev) => prev.map((c) => (c.id === company.id ? { ...c, isActive: false } : c)))
      toast.success(`${company.name} foi desativada.`)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao desativar empresa')
    } finally {
      setCompanyToDeactivate(null)
    }
  }

  return (
    <AlertDialog.Root open={!!companyToDeactivate} onOpenChange={(open) => !open && setCompanyToDeactivate(null)}>
      <div className="card overflow-hidden border-[var(--color-border)]">
        {/* Table Header / Toolbar */}
        <div className="p-4 border-b border-[var(--color-border)] flex flex-col sm:flex-row gap-4 items-center justify-between bg-[var(--color-surface)]">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar empresas..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
          <Link
            href="/companies/new"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:opacity-90 transition-all shadow-sm glow-primary"
          >
            <Plus className="w-4 h-4" />
            Nova Empresa
          </Link>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[var(--color-muted-foreground)] uppercase bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              <tr>
                <th className="px-6 py-4 font-medium">Empresa</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Relatórios</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    {search ? (
                      <div className="flex flex-col items-center gap-3 animate-fade-in">
                        <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center">
                          <Search className="w-6 h-6 text-[var(--color-muted)]" />
                        </div>
                        <p className="font-medium text-[var(--color-foreground)]">Nenhum resultado para "{search}"</p>
                        <p className="text-sm text-[var(--color-muted-foreground)]">Tente uma busca diferente</p>
                        <button
                          onClick={() => setSearch('')}
                          className="mt-1 text-[var(--color-primary)] text-sm font-medium hover:underline"
                        >
                          Limpar busca
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-6 py-4 max-w-lg mx-auto animate-fade-in">
                        {/* Icon */}
                        <div className="relative">
                          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-secondary)]/20 border border-[var(--color-primary)]/20 flex items-center justify-center">
                            <Users className="w-9 h-9 text-[var(--color-primary)]" />
                          </div>
                          <div className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-[var(--color-primary)] rounded-full flex items-center justify-center shadow-lg">
                            <Plus className="w-4 h-4 text-white" />
                          </div>
                        </div>

                        <div className="space-y-1.5 text-center">
                          <p className="text-lg font-bold text-[var(--color-foreground)]">Adicione sua primeira empresa</p>
                          <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed max-w-sm mx-auto">
                            Cada empresa terá seus próprios relatórios e integrações de mídia. Comece cadastrando um agora.
                          </p>
                        </div>

                        {/* Mini journey cards */}
                        <div className="grid grid-cols-3 gap-3 w-full">
                          {[
                            { step: '01', icon: Users, title: 'Cadastre a empresa', color: 'text-indigo-500 bg-indigo-500/10' },
                            { step: '02', icon: Plug, title: 'Conecte integrações', color: 'text-violet-500 bg-violet-500/10' },
                            { step: '03', icon: Activity, title: 'Publique relatórios', color: 'text-emerald-500 bg-emerald-500/10' },
                          ].map((item) => {
                            const Icon = item.icon
                            return (
                              <div key={item.step} className="flex flex-col items-center gap-2 p-3 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-center">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <p className="text-xs font-medium text-[var(--color-foreground)] leading-tight">{item.title}</p>
                              </div>
                            )
                          })}
                        </div>

                        <Link
                          href="/companies/new"
                          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[var(--color-primary)] rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[var(--color-primary)]/25 glow-primary"
                        >
                          <Plus className="w-4 h-4" />
                          Cadastrar Primeira Empresa
                        </Link>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((company) => (
                  <tr
                    key={company.id}
                    className="hover:bg-[var(--color-surface-2)] transition-colors group"
                  >
                    {/* Nome e Logo */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {company.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={company.logoUrl}
                            alt={company.name}
                            className="w-10 h-10 rounded-lg object-cover border border-[var(--color-border)]"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary)] font-bold text-lg shrink-0">
                            {company.name[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors">
                            {company.name}
                          </div>
                          <div className="text-[var(--color-muted-foreground)] text-xs mt-0.5 flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            {company.website || company.email || 'Sem website'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          company.isActive
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            company.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                          }`}
                        />
                        {company.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>

                    {/* Relatórios */}
                    <td className="px-6 py-4">
                      <Link
                        href={`/reports?companyId=${company.id}`}
                        className="flex items-center gap-2 text-[var(--color-foreground)] hover:text-[var(--color-primary)] transition-colors"
                      >
                        <Activity className="w-4 h-4 text-[var(--color-muted)]" />
                        {formatNumber(company._count?.reports || 0)} relatório{(company._count?.reports || 0) !== 1 ? 's' : ''}
                      </Link>
                    </td>

                    {/* Ações */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Botão de Ver Relatórios */}
                        <Link
                          href={`/reports?companyId=${company.id}`}
                          className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-2)] rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          title="Ver relatórios"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {/* Integrações */}
                        <Link
                          href={`/companies/${company.id}/integrations`}
                          className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-2)] rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          title="Integrações"
                        >
                          <Plug className="w-4 h-4" />
                        </Link>

                        {/* Botão de Editar */}
                        <Link
                          href={`/companies/${company.id}/edit`}
                          className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-2)] rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          title="Editar empresa"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>

                        {/* Dropdown de mais opções */}
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
                              className="z-50 min-w-[180px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl p-1 animate-fade-in"
                            >
                              <DropdownMenu.Item asChild>
                                <Link
                                  href={`/companies/${company.id}/edit`}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] rounded-md outline-none cursor-pointer"
                                >
                                  <Pencil className="w-4 h-4" />
                                  Editar Empresa
                                </Link>
                              </DropdownMenu.Item>
                              <DropdownMenu.Item asChild>
                                <Link
                                  href={`/companies/${company.id}/integrations`}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] rounded-md outline-none cursor-pointer"
                                >
                                  <Plug className="w-4 h-4" />
                                  Integrações
                                </Link>
                              </DropdownMenu.Item>
                              <DropdownMenu.Item asChild>
                                <Link
                                  href={`/reports?companyId=${company.id}`}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] rounded-md outline-none cursor-pointer"
                                >
                                  <Activity className="w-4 h-4" />
                                  Ver Relatórios
                                </Link>
                              </DropdownMenu.Item>
                              <DropdownMenu.Separator className="h-px bg-[var(--color-border)] my-1" />
                              <DropdownMenu.Item
                                className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 hover:text-red-300 rounded-md outline-none cursor-pointer transition-colors"
                                onClick={() => setCompanyToDeactivate(company)}
                                disabled={!company.isActive}
                              >
                                <Trash2 className="w-4 h-4" />
                                {company.isActive ? 'Desativar' : 'Já inativo'}
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

        {/* Footer com contagem */}
        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-muted-foreground)]">
            {search ? `${filtered.length} de ${companies.length} empresas` : `${companies.length} empresa${companies.length !== 1 ? 's' : ''} no total`}
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      {companyToDeactivate && (
        <DeactivateDialog
          company={companyToDeactivate}
          onConfirm={() => handleDeactivate(companyToDeactivate)}
          isLoading={isPending}
        />
      )}
    </AlertDialog.Root>
  )
}
