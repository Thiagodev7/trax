export const ADMIN_SUBDOMAINS = ['admin'] as const

const PRODUCTION_ROOT_DOMAINS = ['traxsolucoes.com.br', 'traxsolucoes.com']

export function getBaseDomain(): string {
  return (
    process.env.NEXT_PUBLIC_TRAX_BASE_DOMAIN ??
    process.env.TRAX_BASE_DOMAIN ??
    'traxsolucoes.com.br'
  )
}

export function getRootDomains(): string[] {
  const base = getBaseDomain()
  const roots = new Set<string>([base, ...PRODUCTION_ROOT_DOMAINS])

  if (base === 'localhost') {
    roots.add('localhost')
    roots.add('127.0.0.1')
  }

  return Array.from(roots)
}

export function getWebPort(): string | null {
  const port = process.env.TRAX_WEB_PORT ?? process.env.PORT
  if (port) return port
  if (process.env.NODE_ENV !== 'production') return '3001'
  return null
}

export function extractSubdomain(hostname: string): string | null {
  for (const root of getRootDomains()) {
    if (hostname === root) return null
    if (hostname.endsWith(`.${root}`)) {
      return hostname.slice(0, hostname.length - root.length - 1)
    }
  }
  return null
}

export function isRootDomain(hostname: string): boolean {
  return getRootDomains().includes(hostname)
}

export function isAdminHost(hostname: string): boolean {
  const subdomain = extractSubdomain(hostname)
  return subdomain !== null && ADMIN_SUBDOMAINS.includes(subdomain as (typeof ADMIN_SUBDOMAINS)[number])
}

export function isClientHost(hostname: string): boolean {
  const subdomain = extractSubdomain(hostname)
  return subdomain !== null && !ADMIN_SUBDOMAINS.includes(subdomain as (typeof ADMIN_SUBDOMAINS)[number])
}

export function buildAdminPanelAbsoluteUrl(
  pathname: string,
  options?: { proto?: string; port?: string | null },
): string {
  const base = getBaseDomain()
  const adminHost = `admin.${base}`
  const proto = options?.proto ?? (base === 'localhost' ? 'http' : 'https')
  const port = options?.port ?? (base === 'localhost' ? getWebPort() : null)
  const portSuffix = port ? `:${port}` : ''
  return `${proto}://${adminHost}${portSuffix}${pathname}`
}

export function buildTenantAbsoluteUrl(
  slug: string,
  options?: { proto?: string; port?: string | null; path?: string },
): string {
  const base = getBaseDomain()
  const proto = options?.proto ?? (base === 'localhost' ? 'http' : 'https')
  const port = options?.port ?? (base === 'localhost' ? getWebPort() : null)
  const portSuffix = port ? `:${port}` : ''
  const path = options?.path ?? ''
  return `${proto}://${slug}.${base}${portSuffix}${path}`
}

export function tenantHostname(slug: string): string {
  return `${slug}.${getBaseDomain()}`
}

export function tenantDisplayUrl(slug: string): string {
  return buildTenantAbsoluteUrl(slug)
}
