import { Injectable } from '@nestjs/common';
import { AuditAction, AuditEntityType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateAgencyBrandingDto } from '../../presentation/dto/update-agency-branding.dto';
import { invalidateTenantCache } from '@common/middleware/tenant.middleware';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';

@Injectable()
export class UpdateAgencyBrandingUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(agencyId: string, dto: UpdateAgencyBrandingDto) {
    const updated = await this.prisma.agency.update({
      where: { id: agencyId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.faviconUrl !== undefined && { faviconUrl: dto.faviconUrl }),
        ...(dto.primaryColor && { primaryColor: dto.primaryColor }),
        ...(dto.secondaryColor && { secondaryColor: dto.secondaryColor }),
        ...(dto.accentColor && { accentColor: dto.accentColor }),
        ...(dto.fontFamily && { fontFamily: dto.fontFamily }),
        ...(dto.customDomain !== undefined && { customDomain: dto.customDomain }),
        ...(dto.themeMode && { themeMode: dto.themeMode }),
        ...(dto.borderRadius && { borderRadius: dto.borderRadius }),
        ...(dto.portalLayout && { portalLayout: dto.portalLayout }),
        ...(dto.loginLayout && { loginLayout: dto.loginLayout }),
        ...(dto.loginBackgroundUrl !== undefined && { loginBackgroundUrl: dto.loginBackgroundUrl }),
        ...(dto.loginTitle !== undefined && { loginTitle: dto.loginTitle }),
        ...(dto.loginSubtitle !== undefined && { loginSubtitle: dto.loginSubtitle }),
        ...(dto.customCss !== undefined && { customCss: dto.customCss }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        customDomain: true,
        logoUrl: true,
        faviconUrl: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        fontFamily: true,
        themeMode: true,
        borderRadius: true,
        portalLayout: true,
        loginLayout: true,
        loginBackgroundUrl: true,
        loginTitle: true,
        loginSubtitle: true,
        customCss: true,
      },
    });

    // Invalida cache de tenant para o domínio antigo e o novo
    if (dto.customDomain) {
      invalidateTenantCache(dto.customDomain);
    }

    await this.auditLog.record({
      agencyId,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.AGENCY,
      entityId: updated.id,
      entityName: updated.name,
      description: `Branding da agência "${updated.name}" atualizado`,
      metadata: { fields: Object.keys(dto) },
    });

    return updated;
  }
}
