'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, MoreHorizontal, ExternalLink, Activity, Pencil, Trash2, Eye, Plug } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { formatNumber } from '@/lib/utils'
import { useApiClient } from '@/lib/api-client-browser'
import { toast } from 'sonner'

interface Client {
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

interface ClientTableProps {
  initialClients?: Client[]
}

function DeactivateDialog({
  client,
  onConfirm,
  isLoading,
}: {
  client: Client
  onConfirm: () => void
  isLoading: boolean
}) {
  return (
    <AlertDialog.Portal>
      <AlertDialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-fade-in" />
      <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 shadow-2xl data-[state=open]:animate-fade-in">
        <AlertDialog.Title className="text-lg font-bold text-[var(--color-foreground)] mb-2">
          Desativar {client.name}?
        </AlertDialog.Title>
        <AlertDialog.Description className="text-sm text-[var(--color-muted-foreground)] mb-6">
          O cliente será desativado e não aparecerá em novas operações. Você pode reativá-lo depois.
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

export function ClientTable({ initialClients = [] }: ClientTableProps) {
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [search, setSearch] = useState('')
  const [clientToDeactivate, setClientToDeactivate] = useState<Client | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const api = useApiClient()

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()),
  )

  async function handleDeactivate(client: Client) {
    try {
      await api.delete(`/clients/${client.id}`)
      setClients((prev) => prev.map((c) => (c.id === client.id ? { ...c, isActive: false } : c)))
      toast.success(`${client.name} foi desativado.`)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao desativar cliente')
    } finally {
      setClientToDeactivate(null)
    }
  }

  return (
    <AlertDialog.Root open={!!clientToDeactivate} onOpenChange={(open) => !open && setClientToDeactivate(null)}>
      <div className="card overflow-hidden border-[var(--color-border)]">
        {/* Table Header / Toolbar */}
        <div className="p-4 border-b border-[var(--color-border)] flex flex-col sm:flex-row gap-4 items-center justify-between bg-[var(--color-surface)]">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar clientes..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            />
          </div>
          <Link
            href="/clients/new"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:opacity-90 transition-all shadow-sm glow-primary"
          >
            <Plus className="w-4 h-4" />
            Novo Cliente
          </Link>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[var(--color-muted-foreground)] uppercase bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              <tr>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Relatórios</th>
                <th className="px-6 py-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center">
                        <Eye className="w-6 h-6 text-[var(--color-muted)]" />
                      </div>
                      {search ? (
                        <>
                          <p className="font-medium text-[var(--color-foreground)]">Nenhum resultado para "{search}"</p>
                          <p className="text-sm text-[var(--color-muted-foreground)]">Tente outra busca</p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium text-[var(--color-foreground)]">Nenhum cliente ainda</p>
                          <p className="text-sm text-[var(--color-muted-foreground)]">Cadastre seu primeiro cliente para começar a gerar relatórios</p>
                          <Link
                            href="/clients/new"
                            className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:opacity-90 transition-all"
                          >
                            <Plus className="w-4 h-4" />
                            Cadastrar Primeiro Cliente
                          </Link>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-[var(--color-surface-2)] transition-colors group"
                  >
                    {/* Nome e Logo */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {client.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={client.logoUrl}
                            alt={client.name}
                            className="w-10 h-10 rounded-lg object-cover border border-[var(--color-border)]"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary)] font-bold text-lg shrink-0">
                            {client.name[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors">
                            {client.name}
                          </div>
                          <div className="text-[var(--color-muted-foreground)] text-xs mt-0.5 flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            {client.website || client.email || 'Sem website'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          client.isActive
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            client.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                          }`}
                        />
                        {client.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>

                    {/* Relatórios */}
                    <td className="px-6 py-4">
                      <Link
                        href={`/reports?clientId=${client.id}`}
                        className="flex items-center gap-2 text-[var(--color-foreground)] hover:text-[var(--color-primary)] transition-colors"
                      >
                        <Activity className="w-4 h-4 text-[var(--color-muted)]" />
                        {formatNumber(client._count?.reports || 0)} relatório{(client._count?.reports || 0) !== 1 ? 's' : ''}
                      </Link>
                    </td>

                    {/* Ações */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Botão de Ver Relatórios */}
                        <Link
                          href={`/reports?clientId=${client.id}`}
                          className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-2)] rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          title="Ver relatórios"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {/* Integrações */}
                        <Link
                          href={`/clients/${client.id}/integrations`}
                          className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-2)] rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          title="Integrações"
                        >
                          <Plug className="w-4 h-4" />
                        </Link>

                        {/* Botão de Editar */}
                        <Link
                          href={`/clients/${client.id}/edit`}
                          className="p-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-2)] rounded-md transition-colors opacity-0 group-hover:opacity-100"
                          title="Editar cliente"
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
                                  href={`/clients/${client.id}/edit`}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] rounded-md outline-none cursor-pointer"
                                >
                                  <Pencil className="w-4 h-4" />
                                  Editar Cliente
                                </Link>
                              </DropdownMenu.Item>
                              <DropdownMenu.Item asChild>
                                <Link
                                  href={`/clients/${client.id}/integrations`}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] rounded-md outline-none cursor-pointer"
                                >
                                  <Plug className="w-4 h-4" />
                                  Integrações
                                </Link>
                              </DropdownMenu.Item>
                              <DropdownMenu.Item asChild>
                                <Link
                                  href={`/reports?clientId=${client.id}`}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] rounded-md outline-none cursor-pointer"
                                >
                                  <Activity className="w-4 h-4" />
                                  Ver Relatórios
                                </Link>
                              </DropdownMenu.Item>
                              <DropdownMenu.Separator className="h-px bg-[var(--color-border)] my-1" />
                              <DropdownMenu.Item
                                className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 hover:text-red-300 rounded-md outline-none cursor-pointer transition-colors"
                                onClick={() => setClientToDeactivate(client)}
                                disabled={!client.isActive}
                              >
                                <Trash2 className="w-4 h-4" />
                                {client.isActive ? 'Desativar' : 'Já inativo'}
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
            {search ? `${filtered.length} de ${clients.length} clientes` : `${clients.length} cliente${clients.length !== 1 ? 's' : ''} no total`}
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      {clientToDeactivate && (
        <DeactivateDialog
          client={clientToDeactivate}
          onConfirm={() => handleDeactivate(clientToDeactivate)}
          isLoading={isPending}
        />
      )}
    </AlertDialog.Root>
  )
}
