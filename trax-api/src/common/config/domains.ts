const PRODUCTION_BASE_DOMAIN = 'traxsolucoes.com.br'
const PRODUCTION_ROOT_DOMAINS = ['traxsolucoes.com.br', 'traxsolucoes.com']
const RESERVED_SUBDOMAINS = ['admin', 'api', 'www'] as const

export function getBaseDomain(): string {
  return process.env.TRAX_BASE_DOMAIN ?? PRODUCTION_BASE_DOMAIN
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

export function isRootDomain(hostname: string): boolean {
  return getRootDomains().includes(hostname)
}

export function isReservedHost(hostname: string): boolean {
  if (isRootDomain(hostname)) return true
  if (isAdminHost(hostname)) return true
  const slug = extractSlugFromHost(hostname)
  if (slug && RESERVED_SUBDOMAINS.includes(slug as (typeof RESERVED_SUBDOMAINS)[number])) {
    return true
  }
  return hostname === 'api'
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function extractSlugFromHost(hostname: string): string | undefined {
  const baseDomain = getBaseDomain()
  const slugMatch = hostname.match(
    new RegExp(`^([^.]+)\\.${escapeRegex(baseDomain)}$`),
  )
  return slugMatch?.[1]
}

export function isAdminHost(hostname: string): boolean {
  return extractSlugFromHost(hostname) === 'admin'
}

/** Fallback de dev quando a API é chamada via localhost puro. */
export function getDevLocalhostFallbackSlug(hostname: string): string | undefined {
  if (process.env.NODE_ENV === 'production') return undefined
  if (getBaseDomain() !== 'localhost') return undefined
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') return undefined
  return 'agenciademo'
}
