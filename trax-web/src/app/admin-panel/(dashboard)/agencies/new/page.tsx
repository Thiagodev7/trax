import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CreateAgencyForm } from '@/components/admin/create-agency-form'

export default function NewAgencyPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/admin-panel/agencies"
        className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para agências
      </Link>

      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Nova Agência</h1>
        <p className="text-sm text-white/40 mt-1">
          Provisionar uma nova agência com administrador inicial
        </p>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
        <CreateAgencyForm />
      </div>
    </div>
  )
}
