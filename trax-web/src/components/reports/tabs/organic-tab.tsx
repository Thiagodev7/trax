'use client'

import { useEffect, useState, useCallback } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Users, Eye, Heart, Image as ImageIcon, AlertCircle, RefreshCw } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useApiClient } from '@/lib/api-client-browser'
import { useSharedApiClient } from '@/lib/shared-api-client'
import { reportMetricsPath } from '@/lib/report-metrics-path'

interface OrganicMetrics {
  instagram: PlatformData
  facebook: PlatformData
}

interface PlatformData {
  profile: Profile | null
  insights: Insight[]
  posts: Post[]
  kpis?: Record<string, number> | null
  insightsAuto?: string[]
}

interface Profile {
  name?: string
  username?: string
  followersCount?: number
  mediaCount?: number
  profilePictureUrl?: string
  fanCount?: number
  category?: string
}

interface Insight {
  date: string
  reach?: number
  impressions?: number
  profile_views?: number
  follower_count?: number
  page_impressions?: number
  page_reach?: number
  page_engaged_users?: number
}

interface Post {
  id?: string
  caption?: string
  mediaType?: string
  thumbnailUrl?: string
  date?: string
  likeCount?: number
  commentsCount?: number
  permalink?: string
}

interface Props {
  reportId: string
  periodStart?: string
  periodEnd?: string
  selectedDate?: string | null
  shareToken?: string
}

function ProfileCard({ profile, platform }: { profile: Profile; platform: 'instagram' | 'facebook' }) {
  const followers = platform === 'instagram' ? profile.followersCount : profile.fanCount
  const name = platform === 'instagram' ? `@${profile.username || profile.name}` : profile.name
  return (
    <div className="card p-5 border-[var(--color-border)] flex items-center gap-4">
      {profile.profilePictureUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.profilePictureUrl} alt={name} className="w-14 h-14 rounded-full border-2 border-[var(--color-border)]" />
      ) : (
        <div className="w-14 h-14 rounded-full bg-[var(--color-surface-2)] border-2 border-[var(--color-border)] flex items-center justify-center text-2xl">
          {platform === 'instagram' ? '📸' : '📘'}
        </div>
      )}
      <div>
        <p className="font-bold text-[var(--color-foreground)]">{name}</p>
        <p className="text-sm text-[var(--color-muted-foreground)]">{new Intl.NumberFormat('pt-BR').format(followers ?? 0)} seguidores</p>
        {platform === 'instagram' && profile.mediaCount !== undefined && (
          <p className="text-xs text-[var(--color-muted-foreground)]">{profile.mediaCount} posts</p>
        )}
      </div>
    </div>
  )
}

function PostCard({ post }: { post: Post }) {
  return (
    <div className="rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-primary)]/40 transition-colors">
      {post.thumbnailUrl && post.permalink?.trim() ? (
        <a href={post.permalink.trim()} target="_blank" rel="noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.thumbnailUrl} alt="" className="w-full aspect-square object-cover" />
        </a>
      ) : (
        <div className="w-full aspect-square flex items-center justify-center bg-[var(--color-surface)]">
          <ImageIcon className="w-8 h-8 text-[var(--color-muted)]" />
        </div>
      )}
      <div className="p-3">
        {post.caption && (
          <p className="text-xs text-[var(--color-foreground)] line-clamp-2 mb-2">{post.caption}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-[var(--color-muted-foreground)]">
          <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {post.likeCount ?? 0}</span>
          <span>💬 {post.commentsCount ?? 0}</span>
          {post.date && <span className="ml-auto">{post.date}</span>}
        </div>
      </div>
    </div>
  )
}

export function OrganicTab({ reportId, periodStart, periodEnd, selectedDate, shareToken }: Props) {
  const { status: sessionStatus } = useSession()
  const authApi = useApiClient()
  const sharedApi = useSharedApiClient()
  const api = shareToken ? sharedApi : authApi
  const [metrics, setMetrics] = useState<OrganicMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activePlatform, setActivePlatform] = useState<'instagram' | 'facebook'>('instagram')
  const [page, setPage] = useState(0)
  const perPage = 5

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (selectedDate) {
        params.set('selectedDate', selectedDate)
        params.set('startDate', selectedDate)
        params.set('endDate', selectedDate)
      } else {
        if (periodStart) params.set('startDate', periodStart)
        if (periodEnd) params.set('endDate', periodEnd)
      }
      const data = await api.get<OrganicMetrics>(`${reportMetricsPath(reportId, 'organic', shareToken)}?${params}`)
      setMetrics(data)
      // Auto-select available platform
      if (data.facebook.profile && !data.instagram.profile) setActivePlatform('facebook')
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar métricas')
    } finally {
      setLoading(false)
    }
  }, [api, reportId, shareToken, periodStart, periodEnd, selectedDate])

  useEffect(() => {
    if (shareToken) {
      fetchData()
      return
    }
    if (sessionStatus === 'loading') return
    if (sessionStatus === 'unauthenticated') {
      setLoading(false)
      setError('Sessão expirada. Faça login novamente.')
      return
    }
    fetchData()
  }, [fetchData, shareToken, sessionStatus])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 animate-pulse h-32 border-[var(--color-border)]">
            <div className="h-4 bg-[var(--color-surface-2)] rounded w-24 mb-3" />
            <div className="h-8 bg-[var(--color-surface-2)] rounded w-40" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-10 border-[var(--color-border)] text-center">
        <AlertCircle className="w-10 h-10 text-[var(--color-muted)] mx-auto mb-3" />
        <p className="font-medium text-[var(--color-foreground)]">Erro ao carregar</p>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{error}</p>
        <button onClick={fetchData} className="mt-3 text-sm text-[var(--color-primary)] hover:underline inline-flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Tentar novamente
        </button>
      </div>
    )
  }

  const platform = metrics?.[activePlatform]
  const hasIG = !!metrics?.instagram.profile
  const hasFB = !!metrics?.facebook.profile

  if (!hasIG && !hasFB) {
    const periodHint =
      periodStart && periodEnd ? ` Período do relatório: ${periodStart} → ${periodEnd}.` : ''
    return (
      <div className="card p-10 border-[var(--color-border)] border-dashed text-center">
        <p className="font-medium text-[var(--color-foreground)]">Nenhum dado orgânico no período</p>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1 max-w-md mx-auto">
          Conecte e sincronize <strong>Instagram</strong> ou <strong>Facebook Page</strong> nas integrações do cliente.{periodHint}
        </p>
        <button onClick={fetchData} className="mt-4 text-sm text-[var(--color-primary)] hover:underline inline-flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Tentar novamente
        </button>
      </div>
    )
  }

  const chartData = (platform?.insights ?? []).map((ins) => ({
    date: ins.date,
    alcance: ins.reach ?? ins.page_reach ?? 0,
    impressoes: ins.impressions ?? ins.page_impressions ?? 0,
  }))

  const engagementChart = (platform?.posts ?? []).map((p) => ({
    date: p.date?.slice(5) ?? '',
    curtidas: p.likeCount ?? 0,
    comentarios: p.commentsCount ?? 0,
  }))

  const kpis = platform?.kpis
  const pagedPosts = (platform?.posts ?? []).slice(page * perPage, (page + 1) * perPage)
  const totalPages = Math.ceil((platform?.posts?.length ?? 0) / perPage)

  return (
    <div className="space-y-6">
      {selectedDate && (
        <p className="text-xs text-[var(--color-primary)]">Filtrando dia: {selectedDate}</p>
      )}
      {/* Platform sub-tabs */}
      <div className="flex gap-2">
        {hasIG && (
          <button
            onClick={() => setActivePlatform('instagram')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
              activePlatform === 'instagram'
                ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/50'
            }`}
          >
            📸 Instagram
          </button>
        )}
        {hasFB && (
          <button
            onClick={() => setActivePlatform('facebook')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
              activePlatform === 'facebook'
                ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/50'
            }`}
          >
            📘 Facebook
          </button>
        )}
        <span className="ml-auto text-xs text-[var(--color-muted-foreground)] self-center">TikTok, LinkedIn, YouTube — em breve</span>
      </div>

      {/* Profile */}
      {platform?.profile && (
        <ProfileCard profile={platform.profile} platform={activePlatform} />
      )}

      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {activePlatform === 'instagram' ? (
            <>
              <div className="card p-4 border-[var(--color-border)]"><p className="text-xs text-[var(--color-muted-foreground)]">Seguidores</p><p className="text-xl font-bold">{kpis.followers ?? 0}{(kpis.followerGain ?? 0) > 0 && <span className="text-xs text-emerald-500 ml-1">+{kpis.followerGain}</span>}</p></div>
              <div className="card p-4 border-[var(--color-border)]"><p className="text-xs text-[var(--color-muted-foreground)]">Posts no período</p><p className="text-xl font-bold">{kpis.postsCount ?? 0}</p></div>
              <div className="card p-4 border-[var(--color-border)]"><p className="text-xs text-[var(--color-muted-foreground)]">Curtidas</p><p className="text-xl font-bold">{kpis.totalLikes ?? 0}</p></div>
              <div className="card p-4 border-[var(--color-border)]"><p className="text-xs text-[var(--color-muted-foreground)]">Comentários</p><p className="text-xl font-bold">{kpis.totalComments ?? 0}</p></div>
            </>
          ) : (
            <>
              <div className="card p-4 border-[var(--color-border)]"><p className="text-xs text-[var(--color-muted-foreground)]">Fãs</p><p className="text-xl font-bold">{kpis.fans ?? 0}</p></div>
              <div className="card p-4 border-[var(--color-border)]"><p className="text-xs text-[var(--color-muted-foreground)]">Posts</p><p className="text-xl font-bold">{kpis.postsCount ?? 0}</p></div>
              <div className="card p-4 border-[var(--color-border)]"><p className="text-xs text-[var(--color-muted-foreground)]">Engajamento</p><p className="text-xl font-bold">{(kpis.engagementRate ?? 0).toFixed(1)}%</p></div>
              <div className="card p-4 border-[var(--color-border)]"><p className="text-xs text-[var(--color-muted-foreground)]">Compartilhamentos</p><p className="text-xl font-bold">{kpis.totalShares ?? 0}</p></div>
            </>
          )}
        </div>
      )}

      {(platform?.insightsAuto?.length ?? 0) > 0 && (
        <div className="card p-4 border-[var(--color-border)]">
          <h3 className="text-sm font-semibold mb-2">Insights</h3>
          <ul className="text-sm text-[var(--color-muted-foreground)] space-y-1">
            {platform!.insightsAuto!.map((t, i) => <li key={i}>• {t}</li>)}
          </ul>
        </div>
      )}

      {/* Insights chart */}
      {chartData.length > 0 && (
        <div className="card p-6 border-[var(--color-border)]">
          <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-4">Alcance & Impressões</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="impGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fill: 'var(--color-muted-foreground)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
              <Legend />
              <Area type="monotone" dataKey="alcance" stroke="var(--color-primary)" fill="url(#reachGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="impressoes" stroke="var(--color-secondary)" fill="url(#impGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {engagementChart.length > 0 && (
        <div className="card p-6 border-[var(--color-border)]">
          <h3 className="text-sm font-semibold mb-4">Engajamento por post</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={engagementChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="curtidas" stroke="#E1306C" fill="#E1306C" fillOpacity={0.15} />
              <Area type="monotone" dataKey="comentarios" stroke="#6366F1" fill="#6366F1" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {(platform?.posts?.length ?? 0) > 0 && (
        <div className="card overflow-hidden border-[var(--color-border)]">
          <div className="p-4 border-b border-[var(--color-border)]"><h3 className="text-sm font-semibold">Posts</h3></div>
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface-2)] text-xs uppercase text-[var(--color-muted-foreground)]">
              <tr><th className="px-4 py-2 text-left">Conteúdo</th><th className="px-4 py-2 text-right">Curtidas</th><th className="px-4 py-2 text-right">Coment.</th><th className="px-4 py-2 text-right">Data</th></tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {pagedPosts.map((post, i) => (
                <tr key={post.id ?? i}>
                  <td className="px-4 py-2 max-w-xs truncate">{post.caption ?? '—'}</td>
                  <td className="px-4 py-2 text-right">{post.likeCount ?? 0}</td>
                  <td className="px-4 py-2 text-right">{post.commentsCount ?? 0}</td>
                  <td className="px-4 py-2 text-right text-xs">{post.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 p-3">
              <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 text-xs border rounded disabled:opacity-40">Anterior</button>
              <span className="text-xs self-center">{page + 1}/{totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 text-xs border rounded disabled:opacity-40">Próxima</button>
            </div>
          )}
        </div>
      )}

      {(platform?.posts?.length ?? 0) > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-foreground)] mb-4">Galeria</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {platform!.posts.slice(0, 12).map((post, i) => (
              <PostCard key={post.id ?? i} post={post} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
