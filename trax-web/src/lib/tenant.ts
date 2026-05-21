/**
 * Resolve a identidade visual do tenant a partir do hostname.
 * Chama GET /api/v1/tenant/resolve com cache ISR de 5 minutos.
 */
export interface TenantBranding {
  agencyId: string
  name: string
  slug: string
  branding: {
    logoUrl: string | null
    faviconUrl: string | null
    primaryColor: string
    secondaryColor: string
    accentColor: string
    fontFamily: string
  }
}

const DEFAULT_BRANDING: TenantBranding = {
  agencyId: '',
  name: 'Trax',
  slug: 'trax',
  branding: {
    logoUrl: null,
    faviconUrl: null,
    primaryColor: '#6366F1',
    secondaryColor: '#818CF8',
    accentColor: '#F59E0B',
    fontFamily: 'Inter',
  },
}

export async function resolveTenant(host: string): Promise<TenantBranding> {
  try {
    const res = await fetch(`${process.env.API_URL}/api/v1/tenant/resolve`, {
      headers: { 'X-Agency-Domain': host },
      next: { revalidate: 300 }, // ISR: revalida a cada 5 minutos
    })

    if (!res.ok) return DEFAULT_BRANDING
    return res.json()
  } catch {
    return DEFAULT_BRANDING
  }
}

/**
 * Gera CSS variables a partir do branding do tenant.
 * Injetado no layout como style inline no elemento root.
 */
export function brandingToCssVars(branding: TenantBranding['branding']) {
  return {
    '--color-primary': branding.primaryColor,
    '--color-secondary': branding.secondaryColor,
    '--color-accent': branding.accentColor,
    '--font-family': branding.fontFamily,
  } as React.CSSProperties
}
