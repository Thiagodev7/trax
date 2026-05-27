'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Shield, KeyRound } from 'lucide-react'
import { useAdminApi } from '@/hooks/use-admin-api'
import { SuperAdminProfile } from '@/lib/admin-api'

export default function SettingsPage() {
  const api = useAdminApi()
  const [profile, setProfile] = useState<SuperAdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    api
      .get<SuperAdminProfile>('/me')
      .then(setProfile)
      .catch(() => toast.error('Falha ao carregar perfil'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }
    setSaving(true)
    try {
      await api.patch('/me/password', { currentPassword, newPassword })
      toast.success('Senha atualizada com sucesso')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao alterar senha')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-white/30" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Configurações</h1>
        <p className="text-sm text-white/40 mt-1">Perfil e segurança do super-admin</p>
      </div>

      {profile && (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-sm font-bold text-white">Perfil</h2>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-white/30 mb-1">Nome</dt>
              <dd className="font-medium text-white">{profile.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-white/30 mb-1">E-mail</dt>
              <dd className="font-medium text-white">{profile.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-white/30 mb-1">Último login</dt>
              <dd className="font-medium text-white/70">
                {profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString('pt-BR') : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-white/30 mb-1">Conta criada em</dt>
              <dd className="font-medium text-white/70">
                {new Date(profile.createdAt).toLocaleDateString('pt-BR')}
              </dd>
            </div>
          </dl>
        </div>
      )}

      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-indigo-400" />
          </div>
          <h2 className="text-sm font-bold text-white">Alterar senha</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
              Senha atual
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
              Nova senha
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
              Confirmar nova senha
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl text-sm"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Salvando...' : 'Atualizar senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
