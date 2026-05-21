'use client'

import { Construction } from 'lucide-react'

export function LinkedInAdsTab() {
  return (
    <div className="card p-16 border-[var(--color-border)] border-dashed text-center">
      <Construction className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-4" />
      <h3 className="text-lg font-bold text-[var(--color-foreground)] mb-2">LinkedIn Ads — Em Breve</h3>
      <p className="text-sm text-[var(--color-muted-foreground)] max-w-sm mx-auto">
        A integração com LinkedIn Ads estará disponível em breve.
      </p>
    </div>
  )
}
