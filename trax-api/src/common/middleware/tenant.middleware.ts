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
} from '@common/config/domains';
import { PrismaService } from '@/prisma/prisma.service';
import { tenantStorage } from '@common/context/tenant.context';

// Cache em memória: domínio → { agencyId, agencySlug, expiresAt }
// Em produção, substituir por Redis (ioredis) para escalar horizontalmente.
interface CachedTenant {
  agencyId: string;
  agencySlug: string;
  expiresAt: number;
}

const tenantCache = new Map<string, CachedTenant>();
const CACHE_TTL_MS = Number(process.env.TENANT_CACHE_TTL ?? 300) * 1000;

// Rotas que não precisam de resolução de tenant (health check, etc.)
const PUBLIC_PATHS_SKIP_TENANT = [
  '/api/health',
  '/api/docs',
  '/api/v1/onboarding',
  '/api/v1/super-admin',
  '/api/v1/integrations/google-ads/callback',
];

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Pula resolução em rotas públicas de infra
    if (PUBLIC_PATHS_SKIP_TENANT.some((p) => req.path.startsWith(p))) {
      return next();
    }

    const hostname = this.extractHostname(req);

    if (isAdminHost(hostname)) {
      return next();
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

    // Injeta o contexto do tenant via AsyncLocalStorage
    // Qualquer código downstream pode chamar getAgencyId() sem receber o req
    tenantStorage.run(
      { agencyId: tenant.agencyId, agencySlug: tenant.agencySlug },
      () => next(),
    );
  }

  private extractHostname(req: Request): string {
    // Suporte ao header X-Agency-Domain (enviado pelo Flutter web/Next.js)
    const xDomain = req.headers['x-agency-domain'] as string | undefined;
    if (xDomain) return xDomain.split(':')[0].toLowerCase().trim();

    // Fallback: Host header padrão (sem porta)
    const host = req.hostname || req.headers.host || '';
    return host.split(':')[0].toLowerCase().trim();
  }

  private async resolveTenant(
    hostname: string,
  ): Promise<CachedTenant | null> {
    // 1. Verifica cache
    const cached = tenantCache.get(hostname);
    if (cached && cached.expiresAt > Date.now()) {
      return cached;
    }

    let slug = extractSlugFromHost(hostname);

    if (!slug) {
      slug = getDevLocalhostFallbackSlug(hostname);
    }

    // 3. Busca no banco por customDomain ou slug
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
      this.logger.debug(`Domínio não mapeado a nenhuma agência: ${hostname}`);
      return null;
    }

    // 4. Popula cache
    const entry: CachedTenant = {
      agencyId: agency.id,
      agencySlug: agency.slug,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
    tenantCache.set(hostname, entry);

    return entry;
  }
}

/** Limpa o cache de um domínio específico (usar ao atualizar customDomain da Agency) */
export function invalidateTenantCache(hostname: string): void {
  tenantCache.delete(hostname);
}

/** Limpa todo o cache (usar em testes) */
export function clearTenantCache(): void {
  tenantCache.clear();
}
