'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { UploadCloud, Trash2, Loader2, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getPublicApiBaseUrl, getPublicApiV1Base } from '@/lib/api-base-url'

interface ImageUploadProps {
  value: string | null
  onChange: (url: string) => void
  onRemove: () => void
  label?: string
  description?: string
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  label = 'Upload de imagem',
  description = 'Arraste uma imagem ou clique para selecionar',
  className,
}: ImageUploadProps) {
  const { data: session } = useSession() as any
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) handleUpload(file)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB.')
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const headers: Record<string, string> = {}
      
      if (session?.accessToken) {
        headers['Authorization'] = `Bearer ${session.accessToken}`
      }
      if (typeof window !== 'undefined') {
        headers['X-Agency-Domain'] = window.location.hostname
      }

      const res = await fetch(`${getPublicApiV1Base()}/upload`, {
        method: 'POST',
        headers,
        body: formData,
      })

      if (!res.ok) throw new Error('Falha no upload')
      
      const data = await res.json()
      const url = `${getPublicApiBaseUrl()}${data.url}`
      onChange(url)
      toast.success('Imagem enviada com sucesso!')
    } catch (err) {
      toast.error('Ocorreu um erro ao enviar a imagem.')
      console.error(err)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <span className="block text-sm font-medium text-[var(--color-foreground)]">{label}</span>
      
      {value ? (
        <div className="relative group rounded-xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface-2)] aspect-video flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-contain p-4"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={onRemove}
              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Remover
            </button>
          </div>
        </div>
      ) : (
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-xl cursor-pointer transition-all',
            isDragging
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
              : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]',
            isUploading && 'pointer-events-none opacity-60'
          )}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-[var(--color-muted-foreground)]">
            {isUploading ? (
              <Loader2 className="w-8 h-8 mb-4 animate-spin text-[var(--color-primary)]" />
            ) : (
              <UploadCloud className="w-8 h-8 mb-4 transition-transform group-hover:scale-110 group-hover:text-[var(--color-primary)]" />
            )}
            <p className="mb-2 text-sm">
              <span className="font-semibold text-[var(--color-foreground)]">Clique para upload</span> ou arraste
            </p>
            <p className="text-xs">{description}</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      )}
    </div>
  )
}
