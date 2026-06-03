'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Save, Loader2 } from 'lucide-react'
import { useAdminApi } from '@/hooks/use-admin-api'
import { AgencyDetail, PLAN_LABELS } from '@/lib/admin-api'

const PLANS = ['TRIAL', 'STARTER', 'PRO', 'AGENCY', 'ENTERPRISE'] as const

export function AgencyEditForm({ agency }: { agency: AgencyDetail }) {
  const api = useAdminApi()
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState(agency.name)
  const [slug, setSlug] = useState(agency.slug)
  const [customDomain, setCustomDomain] = useState(agency.customDomain ?? '')
  const [logoUrl, setLogoUrl] = useState(agency.logoUrl ?? '')
  const [primaryColor, setPrimaryColor] = useState(agency.primaryColor)
  const [secondaryColor, setSecondaryColor] = useState(agency.secondaryColor)
  const [plan, setPlan] = useState(agency.plan)
  const [isActive, setIsActive] = useState(agency.isActive)
  const [maxCompanies, setMaxCompanies] = useState(agency.maxCompanies)
  const [maxUsers, setMaxUsers] = useState(agency.maxUsers)
  const [trialEndsAt, setTrialEndsAt] = useState(
    agency.trialEndsAt ? agency.trialEndsAt.slice(0, 10) : '',
  )

  async function handleSave() {
    setSaving(true)
    try {
      await api.patch(`/agencies/${agency.id}`, {
        name,
        slug,
        customDomain: customDomain || null,
        logoUrl: logoUrl || null,
        primaryColor,
        secondaryColor,
        plan,
        isActive,
        maxCompanies,
        maxUsers,
        trialEndsAt: trialEndsAt || null,
      })
      toast.success('Agência atualizada')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Nome" value={name} onChange={setName} />
        <Field label="Slug" value={slug} onChange={(v) => setSlug(v.toLowerCase())} />
        <Field label="Domínio customizado" value={customDomain} onChange={setCustomDomain} placeholder="relatorios.agencia.com" />
        <Field label="URL do logo" value={logoUrl} onChange={setLogoUrl} placeholder="https://..." />
        <div>
          <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
            Cor primária
          </label>
          <div className="flex gap-2">
            <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-11 w-14 rounded-lg cursor-pointer bg-transparent" />
            <input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
            Cor secundária
          </label>
          <div className="flex gap-2">
            <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="h-11 w-14 rounded-lg cursor-pointer bg-transparent" />
            <input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Plano</label>
          <select value={plan} onChange={(e) => setPlan(e.target.value)} className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm text-white">
            {PLANS.map((p) => (
              <option key={p} value={p} className="bg-[#1a1a2e]">{PLAN_LABELS[p]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Trial até</label>
          <input type="date" value={trialEndsAt} onChange={(e) => setTrialEndsAt(e.target.value)} className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm text-white" />
        </div>
        <Field label="Limite de empresas" type="number" value={String(maxCompanies)} onChange={(v) => setMaxCompanies(Number(v))} />
        <Field label="Limite de usuários" type="number" value={String(maxUsers)} onChange={(v) => setMaxUsers(Number(v))} />
        <div>
          <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Status</label>
          <div className="flex items-center gap-3 bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3">
            <button type="button" onClick={() => setIsActive(!isActive)} className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${isActive ? 'bg-emerald-500' : 'bg-white/10'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${isActive ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
            <span className={`text-sm font-medium ${isActive ? 'text-emerald-400' : 'text-white/40'}`}>{isActive ? 'Ativa' : 'Inativa'}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-white/[0.06]">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl text-sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
      />
    </div>
  )
}
