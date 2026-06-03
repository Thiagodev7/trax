'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard Error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-semibold text-[var(--color-foreground)] mb-2">
        Não foi possível carregar esta seção
      </h2>
      <p className="text-[var(--color-muted-foreground)] mb-8 max-w-md">
        {error.message || 'Ocorreu um problema ao buscar os dados. Tente novamente.'}
      </p>
      <Button onClick={() => reset()}>
        Tentar Novamente
      </Button>
    </div>
  )
}
