'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Plus, CheckCircle2 } from 'lucide-react'
import { useAdminApi } from '@/hooks/use-admin-api'
import { PLAN_LABELS, tenantUrl } from '@/lib/admin-api'

const PLANS = ['TRIAL', 'STARTER', 'PRO', 'AGENCY', 'ENTERPRISE'] as const

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30)
}

export function CreateAgencyForm() {
  const router = useRouter()
  const api = useAdminApi()
  const [loading, setLoading] = useState(false)
  const [createdUrl, setCreatedUrl] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [plan, setPlan] = useState<string>('TRIAL')
  const [maxCompanies, setMaxCompanies] = useState('')
  const [maxUsers, setMaxUsers] = useState('')
  const [isActive, setIsActive] = useState(true)

  function handleNameChange(value: string) {
    setName(value)
    if (!slugManual) setSlug(slugify(value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await api.post<{
        tenantUrl: string
        agency: { id: string; name: string }
      }>('/agencies', {
        name,
        slug,
        adminName,
        adminEmail,
        adminPassword,
        plan,
        isActive,
        ...(maxCompanies ? { maxCompanies: Number(maxCompanies) } : {}),
        ...(maxUsers ? { maxUsers: Number(maxUsers) } : {}),
      })

      setCreatedUrl(result.tenantUrl)
      toast.success(`Agência "${result.agency.name}" criada com sucesso`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao criar agência')
    } finally {
      setLoading(false)
    }
  }

  if (createdUrl) {
    return (
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-white mb-2">Agência criada!</h2>
        <p className="text-sm text-white/50 mb-4">O portal da agência está disponível em:</p>
        <a
          href={createdUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 font-medium text-sm"
        >
          {createdUrl}
        </a>
        <div className="flex justify-center gap-3 mt-6">
          <button
            onClick={() => router.push('/admin-panel/agencies')}
            className="px-5 py-2.5 text-sm font-semibold text-white/70 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
          >
            Ver todas as agências
          </button>
          <button
            onClick={() => {
              setCreatedUrl(null)
              setName('')
              setSlug('')
              setAdminName('')
              setAdminEmail('')
              setAdminPassword('')
            }}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all"
          >
            Criar outra
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
            Nome da agência
          </label>
          <input
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
            Slug (subdomínio)
          </label>
          <div className="flex items-center gap-2">
            <input
              required
              value={slug}
              onChange={(e) => {
                setSlugManual(true)
                setSlug(e.target.value.toLowerCase())
              }}
              pattern="^[a-z0-9-]+$"
              className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          {slug && (
            <p className="text-xs text-white/30 mt-1.5">{tenantUrl(slug)}</p>
          )}
        </div>
      </div>

      <div className="border-t border-white/[0.06] pt-6">
        <h3 className="text-sm font-bold text-white mb-4">Administrador inicial</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
              Nome
            </label>
            <input
              required
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
              E-mail
            </label>
            <input
              required
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
              Senha inicial
            </label>
            <input
              required
              type="password"
              minLength={8}
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-white/[0.06] pt-6">
        <h3 className="text-sm font-bold text-white mb-4">Plano e limites</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
              Plano
            </label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            >
              {PLANS.map((p) => (
                <option key={p} value={p} className="bg-[#1a1a2e]">
                  {PLAN_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
              Max empresas (opcional)
            </label>
            <input
              type="number"
              min={0}
              value={maxCompanies}
              onChange={(e) => setMaxCompanies(e.target.value)}
              placeholder="Padrão do plano"
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
              Max usuários (opcional)
            </label>
            <input
              type="number"
              min={1}
              value={maxUsers}
              onChange={(e) => setMaxUsers(e.target.value)}
              placeholder="Padrão do plano"
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
              Status
            </label>
            <div className="flex items-center gap-3 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3">
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                  isActive ? 'bg-emerald-500' : 'bg-white/10'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                    isActive ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${isActive ? 'text-emerald-400' : 'text-white/40'}`}>
                {isActive ? 'Ativa' : 'Inativa'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-all text-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {loading ? 'Criando...' : 'Criar agência'}
        </button>
      </div>
    </form>
  )
}
