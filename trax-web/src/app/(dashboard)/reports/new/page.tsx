'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import {
  ArrowLeft, FileText, Users, Calendar, Save, Loader2, Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { useApiClient } from '@/lib/api-client-browser'
import { useQuery } from '@tanstack/react-query'

const schema = z.object({
  title: z.string().min(4, 'Título deve ter pelo menos 4 caracteres'),
  clientId: z.string().min(1, 'Selecione um cliente'),
  periodStart: z.string().min(1, 'Data de início obrigatória'),
  periodEnd: z.string().min(1, 'Data de fim obrigatória'),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewReportPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const api = useApiClient()

  // Busca clientes dinamicamente para não depender de sessão desatualizada
  const { data: clientsData, isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await api.get<any>('/clients')
      return res?.data || res || []
    },
  })

  const clients: { id: string; name: string }[] = clientsData || []

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      clientId: '',
      periodStart: '',
      periodEnd: '',
      description: '',
    },
  })

  const isLoading = isPending || isSubmitting || isLoadingClients
  const selectedClientId = watch('clientId')
  const selectedClient = clients.find((c) => c.id === selectedClientId)

  async function onSubmit(data: FormData) {
    try {
      const report = await api.post<any>('/reports', {
        title: data.title,
        clientId: data.clientId,
        periodStart: new Date(data.periodStart).toISOString(),
        periodEnd: new Date(data.periodEnd).toISOString(),
        description: data.description || undefined,
      })
      toast.success('Relatório criado com sucesso!')
      startTransition(() => {
        router.push(`/reports/${report.id}`)
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar relatório')
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          href="/reports"
          className="p-2 -ml-2 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-foreground)] tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[var(--color-primary)]" />
            Novo Relatório
          </h2>
          <p className="text-[var(--color-muted-foreground)] mt-1">
            Configure o relatório e publique para compartilhar com seu cliente.
          </p>
        </div>
      </div>

      <div className="card p-6 border-[var(--color-border)]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Título */}
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-sm font-medium text-[var(--color-foreground)]">
              Título do Relatório *
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
              <input
                id="title"
                {...register('title')}
                placeholder="Ex: Relatório Google Ads — Maio 2026"
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-20 transition-all disabled:opacity-50"
              />
            </div>
            {errors.title && (
              <p className="text-xs text-red-400">{errors.title.message}</p>
            )}
          </div>

          {/* Cliente */}
          <div className="space-y-1.5">
            <label htmlFor="clientId" className="text-sm font-medium text-[var(--color-foreground)]">
              Cliente *
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
              <select
                id="clientId"
                {...register('clientId')}
                disabled={isLoading || clients.length === 0}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-20 transition-all disabled:opacity-50 appearance-none"
              >
                <option value="" disabled>Selecione um cliente...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            {clients.length === 0 && (
              <p className="text-xs text-amber-400">
                Nenhum cliente encontrado.{' '}
                <Link href="/clients/new" className="underline hover:text-amber-300">
                  Cadastre um cliente primeiro.
                </Link>
              </p>
            )}
            {errors.clientId && (
              <p className="text-xs text-red-400">{errors.clientId.message}</p>
            )}
          </div>

          {/* Período */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="periodStart" className="text-sm font-medium text-[var(--color-foreground)]">
                Data de Início *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
                <input
                  id="periodStart"
                  type="date"
                  {...register('periodStart')}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-20 transition-all disabled:opacity-50 [color-scheme:dark]"
                />
              </div>
              {errors.periodStart && (
                <p className="text-xs text-red-400">{errors.periodStart.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="periodEnd" className="text-sm font-medium text-[var(--color-foreground)]">
                Data de Fim *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
                <input
                  id="periodEnd"
                  type="date"
                  {...register('periodEnd')}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-20 transition-all disabled:opacity-50 [color-scheme:dark]"
                />
              </div>
              {errors.periodEnd && (
                <p className="text-xs text-red-400">{errors.periodEnd.message}</p>
              )}
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label htmlFor="description" className="text-sm font-medium text-[var(--color-foreground)]">
              Descrição (Opcional)
            </label>
            <textarea
              id="description"
              {...register('description')}
              placeholder="Breve descrição das campanhas e objetivos deste relatório..."
              rows={3}
              disabled={isLoading}
              className="w-full px-4 py-2.5 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-20 transition-all disabled:opacity-50 resize-none"
            />
          </div>

          {/* Preview do que será criado */}
          {selectedClient && (
            <div className="p-4 rounded-lg bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20">
              <p className="text-xs text-[var(--color-primary)] font-medium mb-1 uppercase tracking-wide">
                Resumo
              </p>
              <p className="text-sm text-[var(--color-foreground)]">
                Será criado um relatório em <strong>rascunho</strong> para o cliente{' '}
                <strong>{selectedClient.name}</strong>. Você poderá publicá-lo e compartilhar o link depois.
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-[var(--color-border)] flex justify-end gap-3">
            <Link
              href="/reports"
              className="px-4 py-2 text-sm font-medium text-[var(--color-foreground)] bg-[var(--color-surface-2)] hover:bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isLoading || clients.length === 0}
              className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:opacity-90 transition-all disabled:opacity-60 shadow-sm glow-primary"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Criar Relatório
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
