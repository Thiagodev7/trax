const PRODUCTION_BASE_DOMAIN = 'traxsolucoes.com.br'

export function getBaseDomain(): string {
  return process.env.TRAX_BASE_DOMAIN ?? PRODUCTION_BASE_DOMAIN
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
