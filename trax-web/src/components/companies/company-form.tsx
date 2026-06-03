'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Building2, Mail, Globe, ArrowLeft, Save, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useApiClient } from '@/lib/api-client-browser'

const optionalUrl = (message: string) =>
  z
    .string()
    .trim()
    .refine((v) => !v || z.string().url().safeParse(v).success, { message })

const schema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  website: optionalUrl('URL inválida. Inclua https://'),
  logoUrl: optionalUrl('URL inválida. Inclua https://'),
})

type FormData = z.infer<typeof schema>

interface CompanyFormProps {
  initialData?: {
    id?: string
    name?: string
    email?: string
    website?: string
    logoUrl?: string
  }
  mode?: 'create' | 'edit'
}

export function CompanyForm({ initialData, mode = 'create' }: CompanyFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const api = useApiClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      website: initialData?.website || '',
      logoUrl: initialData?.logoUrl || '',
    },
  })

  const isLoading = isPending || isSubmitting
  const isEditing = mode === 'edit' && initialData?.id

  async function onSubmit(data: FormData) {
    try {
      if (isEditing) {
        await api.patch(`/companies/${initialData!.id}`, {
          name: data.name,
          email: data.email,
          website: data.website || null,
          logoUrl: data.logoUrl || null,
        })
        toast.success('Empresa atualizada com sucesso!')
      } else {
        await api.post('/companies', {
          name: data.name,
          email: data.email,
          ...(data.website ? { website: data.website } : {}),
          ...(data.logoUrl ? { logoUrl: data.logoUrl } : {}),
        })
        toast.success('Empresa cadastrada com sucesso!')
      }

      startTransition(() => {
        router.push('/companies')
        router.refresh()
      })
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar empresa')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/companies"
          className="p-2 -ml-2 rounded-lg text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-foreground)] tracking-tight">
            {isEditing ? 'Editar Empresa' : 'Nova Empresa'}
          </h2>
          <p className="text-[var(--color-muted-foreground)] mt-1">
            {isEditing
              ? 'Atualize as informações da empresa.'
              : 'Cadastre uma nova empresa para sua agência.'}
          </p>
        </div>
      </div>

      <div className="card p-6 border-[var(--color-border)]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Nome */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium text-[var(--color-foreground)]">
              Nome da Empresa *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
              <input
                id="name"
                {...register('name')}
                placeholder="Ex: TechStore E-commerce"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-20 transition-all disabled:opacity-50"
                disabled={isLoading}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-red-400 font-medium">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-[var(--color-foreground)]">
              E-mail de Contato *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
              <input
                id="email"
                type="email"
                {...register('email')}
                placeholder="contato@techstore.com.br"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-20 transition-all disabled:opacity-50"
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-400 font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Website e Logo — grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="website" className="text-sm font-medium text-[var(--color-foreground)]">
                Website (Opcional)
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
                <input
                  id="website"
                  {...register('website')}
                  placeholder="https://techstore.com.br"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-20 transition-all disabled:opacity-50"
                  disabled={isLoading}
                />
              </div>
              {errors.website && (
                <p className="text-xs text-red-400 font-medium">{errors.website.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="logoUrl" className="text-sm font-medium text-[var(--color-foreground)]">
                URL do Logo (Opcional)
              </label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
                <input
                  id="logoUrl"
                  {...register('logoUrl')}
                  placeholder="https://cdn.exemplo.com/logo.png"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-foreground)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-opacity-20 transition-all disabled:opacity-50"
                  disabled={isLoading}
                />
              </div>
              {errors.logoUrl && (
                <p className="text-xs text-red-400 font-medium">{errors.logoUrl.message}</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--color-border)] flex justify-end gap-3">
            <Link
              href="/companies"
              className="px-4 py-2 text-sm font-medium text-[var(--color-foreground)] bg-[var(--color-surface-2)] hover:bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-[var(--color-primary)] rounded-lg hover:opacity-90 transition-all disabled:opacity-60 shadow-sm glow-primary"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditing ? 'Atualizar Empresa' : 'Salvar Empresa'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
