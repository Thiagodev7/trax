'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <html lang="pt-BR">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-bg)] p-4 text-center">
          <div className="bg-[var(--color-surface)] p-8 rounded-xl border border-[var(--color-border)] shadow-xl max-w-md w-full">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-foreground)] mb-2">
              Algo deu errado!
            </h2>
            <p className="text-[var(--color-muted-foreground)] mb-8">
              Um erro inesperado ocorreu. Nossa equipe já foi notificada.
            </p>
            <div className="space-y-3">
              <Button onClick={() => reset()} className="w-full">
                Tentar novamente
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                Recarregar página
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
