import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trax — Relatórios de Marketing White-Label para Agências',
  description:
    'Plataforma SaaS de relatórios de marketing white-label. Conecte Meta Ads, Google Ads e muito mais. Impressione seus clientes com dashboards profissionais.',
  openGraph: {
    title: 'Trax — Relatórios de Marketing White-Label para Agências',
    description:
      'Plataforma SaaS de relatórios de marketing white-label. Conecte Meta Ads, Google Ads e muito mais.',
    type: 'website',
    locale: 'pt_BR',
  },
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
