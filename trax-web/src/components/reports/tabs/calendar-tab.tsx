'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, AlertCircle, RefreshCw, Heart, MessageCircle } from 'lucide-react'
import { useApiClient } from '@/lib/api-client-browser'

interface Post {
  id: string | null
  date: string
  platform: 'instagram' | 'facebook'
  caption: unknown
  thumbnailUrl: unknown
  permalink: unknown
  likeCount: unknown
  commentsCount: unknown
  mediaType: string
}

interface CalendarData {
  posts: Post[]
}

interface Props {
  reportId: string
  periodStart?: string
  periodEnd?: string
}

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-pink-500/20 border-pink-500/40 text-pink-400',
  facebook: 'bg-blue-500/20 border-blue-500/40 text-blue-400',
}

export function CalendarTab({ reportId, periodStart, periodEnd }: Props) {
  const api = useApiClient()
  const [data, setData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const now = new Date()
  const [viewYear, setViewYear] = useState(periodEnd ? new Date(periodEnd).getFullYear() : now.getFullYear())
  const [viewMonth, setViewMonth] = useState(periodEnd ? new Date(periodEnd).getMonth() : now.getMonth())
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (periodStart) params.set('startDate', periodStart)
      if (periodEnd) params.set('endDate', periodEnd)
      const result = await api.get<CalendarData>(`/reports/${reportId}/metrics/calendar?${params}`)
      setData(result)
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar calendário')
    } finally {
      setLoading(false)
    }
  }, [reportId, periodStart, periodEnd])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return <div className="card p-10 border-[var(--color-border)] animate-pulse h-96" />
  }

  if (error || !data) {
    return (
      <div className="card p-10 border-[var(--color-border)] text-center">
        <AlertCircle className="w-10 h-10 text-[var(--color-muted)] mx-auto mb-3" />
        <p className="font-medium text-[var(--color-foreground)]">Erro ao carregar calendário</p>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{error}</p>
        <button onClick={fetchData} className="mt-3 text-sm text-[var(--color-primary)] hover:underline inline-flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Tentar novamente
        </button>
      </div>
    )
  }

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1)
  const lastDay = new Date(viewYear, viewMonth + 1, 0)
  const startPad = firstDay.getDay()
  const totalCells = Math.ceil((startPad + lastDay.getDate()) / 7) * 7

  // Group posts by date
  const postsByDate: Record<string, Post[]> = {}
  for (const post of data.posts) {
    const d = post.date.slice(0, 10)
    if (!postsByDate[d]) postsByDate[d] = []
    postsByDate[d].push(post)
  }

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startPad + 1
    if (dayNum < 1 || dayNum > lastDay.getDate()) return null
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
    return { dayNum, dateStr, posts: postsByDate[dateStr] ?? [] }
  })

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(v => v - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(v => v + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const totalPosts = data.posts.filter((p) => {
    const d = new Date(p.date)
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth
  }).length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-[var(--color-muted-foreground)]" />
          </button>
          <h3 className="text-base font-bold text-[var(--color-foreground)] min-w-[160px] text-center">
            {MONTHS[viewMonth]} {viewYear}
          </h3>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-[var(--color-muted-foreground)]" />
          </button>
        </div>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {totalPosts} post{totalPosts !== 1 ? 's' : ''} este mês
        </p>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} className="h-24 rounded-lg" />
          const isToday = cell.dateStr === new Date().toISOString().split('T')[0]
          return (
            <div
              key={cell.dateStr}
              className={`h-24 rounded-lg border p-1.5 flex flex-col gap-0.5 overflow-hidden ${
                isToday
                  ? 'border-[var(--color-primary)]/60 bg-[var(--color-primary)]/5'
                  : 'border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-border)]'
              }`}
            >
              <span className={`text-xs font-medium mb-0.5 ${isToday ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted-foreground)]'}`}>
                {cell.dayNum}
              </span>
              {cell.posts.slice(0, 3).map((post, pi) => (
                <button
                  key={pi}
                  onClick={() => setSelectedPost(post)}
                  className={`text-left w-full px-1 py-0.5 rounded text-xs border truncate transition-opacity hover:opacity-80 ${PLATFORM_COLORS[post.platform]}`}
                >
                  {post.platform === 'instagram' ? '📸' : '📘'} {String(post.caption ?? '').slice(0, 10)}…
                </button>
              ))}
              {cell.posts.length > 3 && (
                <span className="text-xs text-[var(--color-muted-foreground)] pl-1">+{cell.posts.length - 3}</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Post detail modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl max-w-sm w-full p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedPost.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={String(selectedPost.thumbnailUrl)} alt="" className="w-full aspect-square object-cover rounded-lg mb-4" />
            ) : null}
            <p className="text-xs text-[var(--color-muted-foreground)] mb-1">{selectedPost.date} · {selectedPost.platform}</p>
            {selectedPost.caption != null && (
              <p className="text-sm text-[var(--color-foreground)] mb-3">{String(selectedPost.caption)}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-[var(--color-muted-foreground)]">
              <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {String(selectedPost.likeCount ?? 0)}</span>
              <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {String(selectedPost.commentsCount ?? 0)}</span>
              {selectedPost.permalink != null && (
                <a href={String(selectedPost.permalink)} target="_blank" rel="noreferrer" className="ml-auto text-[var(--color-primary)] hover:underline text-xs">
                  Ver post →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
