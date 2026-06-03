import { Injectable } from '@nestjs/common';
import { AuditAction, AuditEntityType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateCompanyDto } from '../../presentation/dto/update-company.dto';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';

@Injectable()
export class UpdateCompanyUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(agencyId: string, companyId: string, dto: UpdateCompanyDto) {
    await this.prisma.company.findFirstOrThrow({
      where: { id: companyId, agencyId },
      select: { id: true },
    });

    const company = await this.prisma.company.update({
      where: { id: companyId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...('website' in dto && { website: dto.website ?? null }),
        ...('logoUrl' in dto && { logoUrl: dto.logoUrl ?? null }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        website: true,
        logoUrl: true,
        isActive: true,
        updatedAt: true,
      },
    });

    await this.auditLog.record({
      agencyId,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.COMPANY,
      entityId: company.id,
      entityName: company.name,
      description: `Empresa "${company.name}" atualizada`,
      metadata: { fields: Object.keys(dto) },
    });

    return company;
  }
}
