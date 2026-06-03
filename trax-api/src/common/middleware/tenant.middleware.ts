import {
  Injectable,
  NestMiddleware,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import {
  extractSlugFromHost,
  getDevLocalhostFallbackSlug,
  isAdminHost,
  isReservedHost,
} from '@common/config/domains';
import { PrismaService } from '@/prisma/prisma.service';
import { tenantStorage } from '@common/context/tenant.context';
import { RedisService } from '@/redis/redis.service';

interface CachedTenant {
  agencyId: string;
  agencySlug: string;
}

// Fallback em memória para quando Redis está indisponível
const memoryFallback = new Map<string, CachedTenant & { expiresAt: number }>();
const CACHE_TTL_SECONDS = Number(process.env.TENANT_CACHE_TTL ?? 300);

/** OAuth callbacks hit API host (localhost:3000) without tenant subdomain — agencyId comes from signed state */
const PUBLIC_PATHS_SKIP_TENANT = [
  '/api/health',
  '/api/docs',
  '/api/v1/onboarding',
  '/api/v1/super-admin',
  '/api/v1/integrations/google-ads/callback',
  '/api/v1/integrations/meta/callback',
  '/api/v1/integrations/rd-station/callback',
];

const REDIS_PREFIX = 'tenant:';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (PUBLIC_PATHS_SKIP_TENANT.some((p) => req.path.startsWith(p))) {
      return next();
    }

    const hostname = this.extractHostname(req);

    if (isAdminHost(hostname)) {
      return next();
    }

    if (req.path.includes('/tenant/resolve') && isReservedHost(hostname)) {
      res.status(404).json({ message: `Tenant não encontrado para o domínio: ${hostname}` });
      return;
    }

    const tenant = await this.resolveTenant(hostname);

    if (!tenant) {
      if (req.path.includes('/tenant/resolve')) {
        res.status(404).json({ message: `Tenant não encontrado para o domínio: ${hostname}` });
        return;
      }
      throw new UnauthorizedException(
        `Tenant não encontrado para o domínio: ${hostname}`,
      );
    }

    tenantStorage.run(
      { agencyId: tenant.agencyId, agencySlug: tenant.agencySlug },
      () => next(),
    );
  }

  private extractHostname(req: Request): string {
    const xDomain = req.headers['x-agency-domain'] as string | undefined;
    if (xDomain) return xDomain.split(':')[0].toLowerCase().trim();
    const host = req.hostname || req.headers.host || '';
    return host.split(':')[0].toLowerCase().trim();
  }

  private async resolveTenant(hostname: string): Promise<CachedTenant | null> {
    // 1. Tenta Redis
    if (this.redis.isConnected) {
      const cached = await this.redis.get(`${REDIS_PREFIX}${hostname}`);
      if (cached) {
        return JSON.parse(cached) as CachedTenant;
      }
    } else {
      // 2. Fallback em memória
      const entry = memoryFallback.get(hostname);
      if (entry && entry.expiresAt > Date.now()) {
        return { agencyId: entry.agencyId, agencySlug: entry.agencySlug };
      }
    }

    // 3. Busca no banco
    let slug = extractSlugFromHost(hostname);
    if (!slug) slug = getDevLocalhostFallbackSlug(hostname);

    const agency = await this.prisma.agency.findFirst({
      where: {
        isActive: true,
        OR: [
          { customDomain: hostname },
          ...(slug ? [{ slug }] : []),
        ],
      },
      select: { id: true, slug: true },
    });

    if (!agency) {
      if (!isReservedHost(hostname)) {
        this.logger.debug(`Domínio não mapeado a nenhuma agência: ${hostname}`);
      }
      return null;
    }

    const entry: CachedTenant = { agencyId: agency.id, agencySlug: agency.slug };

    // 4. Popula cache (Redis ou memória)
    if (this.redis.isConnected) {
      await this.redis.set(`${REDIS_PREFIX}${hostname}`, JSON.stringify(entry), CACHE_TTL_SECONDS);
    } else {
      memoryFallback.set(hostname, { ...entry, expiresAt: Date.now() + CACHE_TTL_SECONDS * 1000 });
    }

    return entry;
  }
}

/** Invalida o cache de um domínio específico (usar ao atualizar customDomain da Agency) */
export function invalidateTenantCache(hostname: string, redis?: RedisService): void {
  memoryFallback.delete(hostname);
  redis?.del(`${REDIS_PREFIX}${hostname}`);
}

/** Limpa todo o cache (usar em testes) */
export function clearTenantCache(redis?: RedisService): void {
  memoryFallback.clear();
  redis?.delPattern(`${REDIS_PREFIX}*`);
}
