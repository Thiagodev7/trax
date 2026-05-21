'use client'

import { Construction } from 'lucide-react'

export function GoogleAdsTab() {
  return (
    <div className="card p-16 border-[var(--color-border)] border-dashed text-center">
      <Construction className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-4" />
      <h3 className="text-lg font-bold text-[var(--color-foreground)] mb-2">Google Ads — Em Breve</h3>
      <p className="text-sm text-[var(--color-muted-foreground)] max-w-sm mx-auto">
        A integração com Google Ads estará disponível em breve.
        Configure suas credenciais para ser notificado quando estiver pronto.
      </p>
    </div>
  )
}
