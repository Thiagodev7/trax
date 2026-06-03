'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Trash2, Loader2, AlertTriangle, X } from 'lucide-react'
import { useAdminApi } from '@/hooks/use-admin-api'
import { DeletePreview } from '@/lib/admin-api'

export function DeleteAgencyDialog({
  agencyId,
  agencyName,
}: {
  agencyId: string
  agencyName: string
}) {
  const api = useAdminApi()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<DeletePreview | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoadingPreview(true)
    api
      .get<DeletePreview>(`/agencies/${agencyId}/delete-preview`)
      .then(setPreview)
      .catch(() => toast.error('Falha ao carregar preview'))
      .finally(() => setLoadingPreview(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, agencyId])

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.delete(`/agencies/${agencyId}`)
      toast.success(`Agência "${agencyName}" removida permanentemente`)
      router.push('/admin-panel/agencies')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao remover')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 font-semibold px-5 py-2.5 rounded-xl text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
      >
        <Trash2 className="w-4 h-4" />
        Remover agência
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-[#12121f] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Excluir agência</h3>
                  <p className="text-sm text-white/40">{agencyName}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/60">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingPreview ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-white/30" />
              </div>
            ) : preview ? (
              <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4 mb-5">
                <p className="text-sm text-red-300 mb-3">Esta ação é irreversível. Serão removidos:</p>
                <ul className="space-y-1.5 text-sm text-white/60">
                  <li>{preview.counts.users} usuário(s)</li>
                  <li>{preview.counts.companies} empresa(s)</li>
                  <li>{preview.counts.reports} relatório(s)</li>
                  <li>{preview.counts.integrations} integração(ões)</li>
                </ul>
              </div>
            ) : null}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || loadingPreview}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white rounded-xl"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Confirmar exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
