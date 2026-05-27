import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Admin — Trax',
    template: '%s | Admin Trax',
  },
  description: 'Painel administrativo da plataforma Trax',
  robots: 'noindex, nofollow',
}

export default function AdminPanelRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#08080e] text-white">
      {children}
    </div>
  )
}
