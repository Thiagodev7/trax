'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useAdminApi } from '@/hooks/use-admin-api'
import { AdminUser, ROLE_LABELS } from '@/lib/admin-api'
import Link from 'next/link'

export function UsersTable({ users }: { users: AdminUser[] }) {
  const api = useAdminApi()
  const router = useRouter()
  const [updating, setUpdating] = useState<string | null>(null)

  async function toggleActive(user: AdminUser) {
    setUpdating(user.id)
    try {
      await api.patch(`/users/${user.id}`, { isActive: !user.isActive })
      toast.success(`Usuário ${user.isActive ? 'desativado' : 'ativado'}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao atualizar')
    } finally {
      setUpdating(null)
    }
  }

  if (users.length === 0) {
    return <p className="text-sm text-white/30 text-center py-16">Nenhum usuário encontrado</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06] bg-white/[0.02]">
            {['Usuário', 'Agência', 'Role', 'Status', 'Último login', 'Ações'].map((h) => (
              <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-white/[0.02]">
              <td className="px-6 py-4">
                <p className="font-semibold text-white">{user.name}</p>
                <p className="text-xs text-white/30">{user.email}</p>
              </td>
              <td className="px-6 py-4">
                <Link href={`/admin-panel/agencies/${user.agency.id}`} className="text-indigo-400 hover:text-indigo-300 text-sm">
                  {user.agency.name}
                </Link>
              </td>
              <td className="px-6 py-4 text-white/60">{ROLE_LABELS[user.role] ?? user.role}</td>
              <td className="px-6 py-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${user.isActive ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
                  {user.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="px-6 py-4 text-white/30 text-xs">
                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('pt-BR') : '—'}
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => toggleActive(user)}
                  disabled={updating === user.id}
                  className="text-xs font-medium text-white/50 hover:text-white disabled:opacity-50"
                >
                  {updating === user.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : user.isActive ? (
                    'Desativar'
                  ) : (
                    'Ativar'
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
