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
    themeMode: 'light' | 'dark' | 'system'
    borderRadius: 'none' | 'small' | 'medium' | 'large' | 'full'
    portalLayout: 'sidebar' | 'topbar'
    loginLayout: 'centered' | 'split'
    loginBackgroundUrl: string | null
    loginTitle: string | null
    loginSubtitle: string | null
    customCss?: string | null
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
    themeMode: 'dark',
    borderRadius: 'medium',
    portalLayout: 'sidebar',
    loginLayout: 'centered',
    loginBackgroundUrl: null,
    loginTitle: null,
    loginSubtitle: null,
    customCss: null,
  },
}

export async function resolveTenant(host: string): Promise<TenantBranding> {
  try {
    const res = await fetch(`${process.env.API_URL}/api/v1/tenant/resolve`, {
      headers: { 'X-Agency-Domain': host },
      cache: 'no-store',
    })

    if (!res.ok) return DEFAULT_BRANDING
    return res.json()
  } catch {
    return DEFAULT_BRANDING
  }
}

const RADIUS_MAP: Record<string, string> = {
  none: '0px',
  small: '4px',
  medium: '8px',
  large: '16px',
  full: '9999px',
}

/**
 * Calcula luminância relativa de uma cor hex (WCAG 2.1).
 * Retorna '#ffffff' (branco) ou '#000000' (preto) para máximo contraste.
 */
function getContrastColor(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16) / 255
  const g = parseInt(clean.substring(2, 4), 16) / 255
  const b = parseInt(clean.substring(4, 6), 16) / 255

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)

  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)

  return luminance > 0.179 ? '#000000' : '#ffffff'
}

/**
 * Gera uma string CSS para injetar em uma <style> tag em :root.
 * Sobrescreve os tokens padrão do @theme com os valores do tenant.
 */
export function brandingToCssString(branding: TenantBranding['branding']): string {
  const primaryFg = getContrastColor(branding.primaryColor)
  const secondaryFg = getContrastColor(branding.secondaryColor)
  const accentFg = getContrastColor(branding.accentColor)
  const baseRadius = RADIUS_MAP[branding.borderRadius] ?? '8px'

  return `:root {
  --color-primary: ${branding.primaryColor};
  --color-primary-foreground: ${primaryFg};
  --color-secondary: ${branding.secondaryColor};
  --color-secondary-foreground: ${secondaryFg};
  --color-accent: ${branding.accentColor};
  --color-accent-foreground: ${accentFg};
  --font-family: ${branding.fontFamily};
  --radius-sm: calc(${baseRadius} - 2px);
  --radius-md: ${baseRadius};
  --radius-lg: calc(${baseRadius} + 4px);
  --radius-xl: calc(${baseRadius} + 8px);
  --radius-full: 9999px;
  --shadow-glow: 0 0 20px -4px ${branding.primaryColor};
}`
}
