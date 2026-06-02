'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, UserPlus, Shield, Eye, Building2,
  MoreVertical, Trash2, Power, UserCog,
  Check, Copy, X, Loader2, AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useApiClient } from '@/lib/api-client-browser'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import type { ApiUser, ApiUserRole, AgencyPlanInfo } from '@/types/api'

type UserRole = ApiUserRole

interface Client {
  id: string
  name: string
}

interface UsersTableProps {
  users: ApiUser[]
  clients: Client[]
  plan: AgencyPlanInfo | null
}

const ROLE_CONFIG: Record<UserRole, { label: string; icon: typeof Shield; color: string; bg: string }> = {
  AGENCY_ADMIN: { label: 'Admin', icon: Shield, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  AGENCY_VIEWER: { label: 'Visualizador', icon: Eye, color: 'text-sky-400', bg: 'bg-sky-500/10' },
  CLIENT_VIEWER: { label: 'Cliente', icon: Building2, color: 'text-amber-400', bg: 'bg-amber-500/10' },
}

const inviteSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('Email inválido'),
  role: z.enum(['AGENCY_ADMIN', 'AGENCY_VIEWER', 'CLIENT_VIEWER']),
  clientIds: z.array(z.string()).optional(),
})
type InviteForm = z.infer<typeof inviteSchema>

function RoleBadge({ role }: { role: UserRole }) {
  const cfg = ROLE_CONFIG[role]
  const Icon = cfg.icon
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', cfg.bg, cfg.color)}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

function UserAvatar({ user }: { user: ApiUser }) {
  if (user.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-[var(--color-border)]" />
  }
  const initials = user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['bg-violet-500', 'bg-sky-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500']
  const colorIdx = user.name.charCodeAt(0) % colors.length
  return (
    <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ring-2 ring-[var(--color-border)]', colors[colorIdx])}>
      {initials}
    </div>
  )
}

function InviteModal({ clients, onClose }: { clients: Client[]; onClose: () => void }) {
  const api = useApiClient()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [tempCredentials, setTempCredentials] = useState<{ email: string; password: string } | null>(null)
  const [selectedClients, setSelectedClients] = useState<string[]>([])

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'AGENCY_VIEWER' },
  })

  const role = watch('role')
  const isLoading = isSubmitting || isPending

  async function onSubmit(data: InviteForm) {
    try {
      const result = await api.post('/users/invite', {
        ...data,
        clientIds: role === 'CLIENT_VIEWER' ? selectedClients : undefined,
      }) as { email: string; tempPassword: string }
      setTempCredentials({ email: result.email, password: result.tempPassword })
      startTransition(() => router.refresh())
    } catch (err: any) {
      toast.error(err.message || 'Erro ao convidar usuário')
    }
  }

  if (tempCredentials) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 mx-auto">
          <Check className="w-7 h-7 text-emerald-400" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-[var(--color-foreground)]">Usuário criado!</h3>
          <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Compartilhe as credenciais abaixo com o novo membro.</p>
        </div>
        <div className="bg-[var(--color-surface-2)] rounded-xl p-4 space-y-3 border border-[var(--color-border)]">
          {[
            { label: 'Email', value: tempCredentials.email },
            { label: 'Senha Temporária', value: tempCredentials.password },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-[var(--color-muted)] mb-1">{label}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono text-[var(--color-foreground)] bg-[var(--color-surface)] px-3 py-1.5 rounded-lg border border-[var(--color-border)]">
                  {value}
                </code>
                <button
                  onClick={() => { navigator.clipboard.writeText(value); toast.success(`${label} copiado!`) }}
                  className="p-1.5 rounded-lg hover:bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--color-muted)] text-center">
          ⚠️ Oriente o usuário a alterar a senha no primeiro acesso.
        </p>
        <button onClick={onClose} className="w-full py-2.5 bg-[var(--color-primary)] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity">
          Fechar
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Role Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-foreground)]">Função</label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(ROLE_CONFIG) as UserRole[]).map((r) => {
            const cfg = ROLE_CONFIG[r]
            const Icon = cfg.icon
            return (
              <label key={r} className="cursor-pointer">
                <input type="radio" value={r} {...register('role')} className="sr-only peer" />
                <div className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] transition-all',
                  'peer-checked:border-[var(--color-primary)] peer-checked:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/40',
                )}>
                  <Icon className={cn('w-4 h-4', cfg.color)} />
                  <span className="text-xs font-medium text-[var(--color-foreground)]">{cfg.label}</span>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[var(--color-foreground)]">Nome completo</label>
        <input
          {...register('name')}
          placeholder="João Silva"
          className="w-full px-4 py-2.5 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
        />
        {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[var(--color-foreground)]">Email</label>
        <input
          {...register('email')}
          type="email"
          placeholder="joao@agencia.com"
          className="w-full px-4 py-2.5 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
        />
        {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
      </div>

      {/* Clients for CLIENT_VIEWER */}
      {role === 'CLIENT_VIEWER' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <label className="text-sm font-medium text-[var(--color-foreground)]">
            Clientes visíveis <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
            {clients.map((c) => (
              <label key={c.id} className="cursor-pointer flex items-center gap-2 p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-primary)]/40 transition-colors">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-[var(--color-primary)]"
                  checked={selectedClients.includes(c.id)}
                  onChange={(e) => setSelectedClients(prev =>
                    e.target.checked ? [...prev, c.id] : prev.filter(id => id !== c.id)
                  )}
                />
                <span className="text-sm text-[var(--color-foreground)] truncate">{c.name}</span>
              </label>
            ))}
          </div>
          {selectedClients.length === 0 && (
            <p className="text-xs text-amber-400">Selecione ao menos um cliente.</p>
          )}
        </motion.div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 bg-[var(--color-primary)] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        {isLoading ? 'Criando...' : 'Criar Usuário'}
      </button>
    </form>
  )
}

// ─── Edit Role Modal ──────────────────────────────────────────────────────────
function EditRoleModal({
  user,
  clients,
  onClose,
}: {
  user: ApiUser
  clients: Client[]
  onClose: () => void
}) {
  const api = useApiClient()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedClients, setSelectedClients] = useState<string[]>(
    user.userClients.map(uc => uc.client.id),
  )

  const schema = z.object({
    role: z.enum(['AGENCY_ADMIN', 'AGENCY_VIEWER', 'CLIENT_VIEWER']),
  })
  type FormData = z.infer<typeof schema>

  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: { role: user.role },
  })

  const role = watch('role')
  const isLoading = isSubmitting || isPending

  async function onSubmit(data: FormData) {
    try {
      await api.patch(`/users/${user.id}`, {
        role: data.role,
        clientIds: data.role === 'CLIENT_VIEWER' ? selectedClients : undefined,
      })
      toast.success('Cargo atualizado.')
      startTransition(() => router.refresh())
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar cargo.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-foreground)]">Nova função</label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(ROLE_CONFIG) as UserRole[]).map((r) => {
            const cfg = ROLE_CONFIG[r]
            const Icon = cfg.icon
            return (
              <label key={r} className="cursor-pointer">
                <input type="radio" value={r} {...register('role')} className="sr-only peer" />
                <div className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] transition-all',
                  'peer-checked:border-[var(--color-primary)] peer-checked:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/40',
                )}>
                  <Icon className={cn('w-4 h-4', cfg.color)} />
                  <span className="text-xs font-medium text-[var(--color-foreground)]">{cfg.label}</span>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {role === 'CLIENT_VIEWER' && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <label className="text-sm font-medium text-[var(--color-foreground)]">
            Clientes visíveis <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
            {clients.map((c) => (
              <label key={c.id} className="cursor-pointer flex items-center gap-2 p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-primary)]/40 transition-colors">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-[var(--color-primary)]"
                  checked={selectedClients.includes(c.id)}
                  onChange={(e) => setSelectedClients(prev =>
                    e.target.checked ? [...prev, c.id] : prev.filter(id => id !== c.id)
                  )}
                />
                <span className="text-sm text-[var(--color-foreground)] truncate">{c.name}</span>
              </label>
            ))}
          </div>
        </motion.div>
      )}

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm rounded-xl bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-border)] transition-colors">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2.5 bg-[var(--color-primary)] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Salvar
        </button>
      </div>
    </form>
  )
}

export function UsersTable({ users: initialUsers, clients, plan }: UsersTableProps) {
  const api = useApiClient()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editRoleUser, setEditRoleUser] = useState<ApiUser | null>(null)

  const atLimit = plan ? initialUsers.filter(u => u.isActive).length >= plan.maxUsers : false

  async function toggleActive(user: ApiUser) {
    try {
      await api.patch(`/users/${user.id}`, { isActive: !user.isActive })
      toast.success(user.isActive ? 'Usuário desativado.' : 'Usuário ativado.')
      startTransition(() => router.refresh())
    } catch {
      toast.error('Erro ao atualizar usuário.')
    }
  }

  async function handleDelete(user: ApiUser) {
    if (!confirm(`Tem certeza que deseja remover ${user.name}?`)) return
    try {
      await api.delete(`/users/${user.id}`)
      toast.success('Usuário removido.')
      startTransition(() => router.refresh())
    } catch {
      toast.error('Erro ao remover usuário.')
    }
  }

  return (
    <>
      {/* Plan limit banner */}
      {plan && atLimit && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 mb-2"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-300">
            <span className="font-semibold">Limite atingido.</span> Seu plano <strong>{plan.plan}</strong> permite {plan.maxUsers} usuário(s) ativo(s).{' '}
            <a href="/settings/plan" className="underline hover:text-amber-200 transition-colors">Fazer upgrade</a> para convidar mais membros.
          </p>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-foreground)] tracking-tight">Equipe</h2>
          <p className="text-[var(--color-muted-foreground)] mt-0.5 text-sm">
            {initialUsers.filter(u => u.isActive).length}
            {plan ? `/${plan.maxUsers}` : ''} {initialUsers.filter(u => u.isActive).length === 1 ? 'membro ativo' : 'membros ativos'}
          </p>
        </div>
        <Dialog.Root open={inviteOpen} onOpenChange={setInviteOpen}>
          <Dialog.Trigger asChild>
            <button
              disabled={atLimit}
              title={atLimit ? `Limite de ${plan?.maxUsers} usuários atingido` : undefined}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-primary)] text-white text-sm font-medium rounded-xl hover:opacity-90 transition-all shadow-lg glow-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <UserPlus className="w-4 h-4" />
              Convidar Usuário
            </button>
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl z-50 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <Dialog.Title className="text-lg font-semibold text-[var(--color-foreground)]">
                    Convidar Usuário
                  </Dialog.Title>
                  <Dialog.Description className="text-sm text-[var(--color-muted-foreground)]">
                    Crie um acesso para sua equipe ou clientes.
                  </Dialog.Description>
                </div>
                <Dialog.Close className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors">
                  <X className="w-4 h-4" />
                </Dialog.Close>
              </div>
              <InviteModal clients={clients} onClose={() => setInviteOpen(false)} />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* Edit Role Dialog */}
      <Dialog.Root open={!!editRoleUser} onOpenChange={(open) => { if (!open) setEditRoleUser(null) }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl z-50 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Dialog.Title className="text-lg font-semibold text-[var(--color-foreground)]">
                  Alterar Cargo
                </Dialog.Title>
                <Dialog.Description className="text-sm text-[var(--color-muted-foreground)]">
                  {editRoleUser?.name}
                </Dialog.Description>
              </div>
              <Dialog.Close className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors">
                <X className="w-4 h-4" />
              </Dialog.Close>
            </div>
            {editRoleUser && (
              <EditRoleModal user={editRoleUser} clients={clients} onClose={() => setEditRoleUser(null)} />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {(Object.keys(ROLE_CONFIG) as UserRole[]).map((role) => {
          const cfg = ROLE_CONFIG[role]
          const Icon = cfg.icon
          const count = initialUsers.filter(u => u.role === role).length
          return (
            <div key={role} className="card p-4 flex items-center gap-3 border border-[var(--color-border)]">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', cfg.bg)}>
                <Icon className={cn('w-4 h-4', cfg.color)} />
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--color-foreground)]">{count}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">{cfg.label}{count !== 1 ? 'es' : ''}</p>
              </div>
            </div>
          )
        })}
        <div className="card p-4 flex items-center gap-3 border border-[var(--color-border)]">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/10">
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-[var(--color-foreground)]">{initialUsers.filter(u => u.isActive).length}</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">Ativos</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border border-[var(--color-border)] overflow-hidden">
        {initialUsers.length === 0 ? (
          <div className="py-20 text-center">
            <Users className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-4 opacity-40" />
            <p className="text-[var(--color-foreground)] font-medium">Nenhum membro ainda</p>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Convide sua equipe para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  {['Usuário', 'Função', 'Clientes', 'Status', 'Último acesso', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {initialUsers.map((user, i) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={cn(
                        'border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-2)]/50',
                        !user.isActive && 'opacity-50',
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={user} />
                          <div>
                            <p className="text-sm font-medium text-[var(--color-foreground)]">{user.name}</p>
                            <p className="text-xs text-[var(--color-muted-foreground)]">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-4 py-3">
                        {user.userClients.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.userClients.slice(0, 2).map(uc => (
                              <span key={uc.client.id} className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)] border border-[var(--color-border)]">
                                {uc.client.name}
                              </span>
                            ))}
                            {user.userClients.length > 2 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)]">
                                +{user.userClients.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--color-muted)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full',
                          user.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400',
                        )}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', user.isActive ? 'bg-emerald-400' : 'bg-zinc-400')} />
                          {user.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-muted-foreground)]">
                        {user.lastLoginAt
                          ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(user.lastLoginAt))
                          : 'Nunca'}
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Portal>
                            <DropdownMenu.Content
                              className="min-w-[160px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl p-1 z-50"
                              align="end"
                            >
                              <DropdownMenu.Item
                                onClick={() => setEditRoleUser(user)}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground)] rounded-lg hover:bg-[var(--color-surface-2)] cursor-pointer outline-none"
                              >
                                <UserCog className="w-3.5 h-3.5" />
                                Alterar cargo
                              </DropdownMenu.Item>
                              <DropdownMenu.Item
                                onClick={() => toggleActive(user)}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground)] rounded-lg hover:bg-[var(--color-surface-2)] cursor-pointer outline-none"
                              >
                                <Power className="w-3.5 h-3.5" />
                                {user.isActive ? 'Desativar' : 'Ativar'}
                              </DropdownMenu.Item>
                              <DropdownMenu.Separator className="my-1 border-t border-[var(--color-border)]" />
                              <DropdownMenu.Item
                                onClick={() => handleDelete(user)}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 rounded-lg hover:bg-red-500/10 cursor-pointer outline-none"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remover
                              </DropdownMenu.Item>
                            </DropdownMenu.Content>
                          </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
