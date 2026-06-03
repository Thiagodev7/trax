'use client'

import { useCallback, useEffect, useState } from 'react'
import { CalendarClock, Loader2, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useApiClient } from '@/lib/api-client-browser'
import { ImageUpload } from '@/components/ui/image-upload'

interface ScheduledPost {
  id: string
  platform: 'INSTAGRAM' | 'FACEBOOK'
  caption: string | null
  mediaUrl: string
  scheduledAt: string
  status: 'PENDING' | 'PUBLISHED' | 'FAILED' | 'CANCELLED'
}

interface Props {
  companyId: string
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  PUBLISHED: 'Publicado',
  FAILED: 'Falhou',
  CANCELLED: 'Cancelado',
}

export function SchedulePostsPanel({ companyId }: Props) {
  const api = useApiClient()
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [platform, setPlatform] = useState<'instagram' | 'facebook'>('instagram')
  const [caption, setCaption] = useState('')
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [scheduledAt, setScheduledAt] = useState('')

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get<ScheduledPost[]>(`/companies/${companyId}/scheduled-posts`)
      setPosts(data)
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [api, companyId])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!mediaUrl) {
      toast.error('Envie uma imagem antes de agendar.')
      return
    }
    if (!scheduledAt) {
      toast.error('Informe data e hora do agendamento.')
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/companies/${companyId}/scheduled-posts`, {
        platform,
        caption: caption.trim() || undefined,
        mediaUrl,
        scheduledAt: new Date(scheduledAt).toISOString(),
      })
      toast.success('Post agendado!')
      setShowForm(false)
      setCaption('')
      setMediaUrl(null)
      setScheduledAt('')
      fetchPosts()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao agendar post')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancel(id: string) {
    try {
      await api.delete(`/companies/${companyId}/scheduled-posts/${id}`)
      toast.success('Agendamento cancelado')
      fetchPosts()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cancelar')
    }
  }

  const pending = posts.filter((p) => p.status === 'PENDING')

  return (
    <div className="card p-4 border-[var(--color-border)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <CalendarClock className="w-4 h-4" /> Agendar posts
        </h3>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="text-xs px-2 py-1 rounded border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] inline-flex items-center gap-1"
        >
          {showForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {showForm ? 'Fechar' : 'Novo'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="space-y-3 mb-4 pb-4 border-b border-[var(--color-border)]">
          <div className="flex gap-2">
            {(['instagram', 'facebook'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(p)}
                className={`flex-1 text-xs py-1.5 rounded border ${
                  platform === p
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'border-[var(--color-border)]'
                }`}
              >
                {p === 'instagram' ? '📸 Instagram' : '📘 Facebook'}
              </button>
            ))}
          </div>
          <ImageUpload
            value={mediaUrl}
            onChange={setMediaUrl}
            onRemove={() => setMediaUrl(null)}
            label="Imagem do post"
            description="PNG ou JPG, até 5MB"
          />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Legenda (opcional)"
            rows={3}
            className="w-full text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 resize-none"
          />
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 text-sm font-medium rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Agendar publicação
          </button>
        </form>
      )}

      {loading ? (
        <div className="h-16 animate-pulse bg-[var(--color-surface-2)] rounded-lg" />
      ) : pending.length === 0 ? (
        <p className="text-xs text-[var(--color-muted-foreground)]">Nenhum post pendente.</p>
      ) : (
        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {pending.map((post) => (
            <li key={post.id} className="flex items-start gap-2 text-xs border border-[var(--color-border)] rounded-lg p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.mediaUrl} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {post.platform === 'INSTAGRAM' ? 'Instagram' : 'Facebook'} · {STATUS_LABELS[post.status]}
                </p>
                <p className="text-[var(--color-muted-foreground)]">
                  {new Date(post.scheduledAt).toLocaleString('pt-BR')}
                </p>
                {post.caption && <p className="truncate mt-0.5">{post.caption}</p>}
              </div>
              <button
                type="button"
                onClick={() => handleCancel(post.id)}
                className="p-1 text-red-400 hover:bg-red-500/10 rounded shrink-0"
                title="Cancelar"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
