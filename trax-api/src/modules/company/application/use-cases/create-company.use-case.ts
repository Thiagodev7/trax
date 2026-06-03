import { Injectable } from '@nestjs/common';
import { AuditAction, AuditEntityType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateCompanyDto } from '../../presentation/dto/create-company.dto';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';

@Injectable()
export class CreateCompanyUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(agencyId: string, dto: CreateCompanyDto) {
    const company = await this.prisma.company.create({
      data: {
        agencyId,
        name: dto.name,
        email: dto.email,
        website: dto.website,
        logoUrl: dto.logoUrl,
      },
      select: {
        id: true,
        agencyId: true,
        name: true,
        email: true,
        website: true,
        logoUrl: true,
        isActive: true,
        createdAt: true,
      },
    });

    await this.auditLog.record({
      agencyId,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.COMPANY,
      entityId: company.id,
      entityName: company.name,
      description: `Empresa "${company.name}" criada`,
    });

    return company;
  }
}
