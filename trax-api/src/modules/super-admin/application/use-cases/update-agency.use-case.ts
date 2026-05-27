import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { AuditAction, AuditActorType, AuditEntityType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateAgencyDto } from '../../presentation/dto/update-agency.dto';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';

const RESERVED_SLUGS = ['www', 'api', 'admin', 'app', 'static', 'assets', 'trax', 'landing'];

@Injectable()
export class UpdateAgencyUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(agencyId: string, dto: UpdateAgencyDto) {
    const agency = await this.prisma.agency.findUnique({ where: { id: agencyId } });
    if (!agency) throw new NotFoundException('Agência não encontrada');

    if (dto.slug !== undefined) {
      const slug = dto.slug.toLowerCase();
      if (RESERVED_SLUGS.includes(slug)) {
        throw new BadRequestException('Slug reservado ou inválido');
      }
      const existing = await this.prisma.agency.findFirst({
        where: { slug, NOT: { id: agencyId } },
      });
      if (existing) throw new ConflictException('Este slug já está em uso');
    }

    if (dto.customDomain !== undefined && dto.customDomain) {
      const existingDomain = await this.prisma.agency.findFirst({
        where: { customDomain: dto.customDomain, NOT: { id: agencyId } },
      });
      if (existingDomain) throw new ConflictException('Este domínio customizado já está em uso');
    }

    const updated = await this.prisma.agency.update({
      where: { id: agencyId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.slug !== undefined && { slug: dto.slug.toLowerCase() }),
        ...(dto.customDomain !== undefined && { customDomain: dto.customDomain || null }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl || null }),
        ...(dto.primaryColor !== undefined && { primaryColor: dto.primaryColor }),
        ...(dto.secondaryColor !== undefined && { secondaryColor: dto.secondaryColor }),
        ...(dto.plan !== undefined && { plan: dto.plan }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.maxClients !== undefined && { maxClients: dto.maxClients }),
        ...(dto.maxUsers !== undefined && { maxUsers: dto.maxUsers }),
        ...(dto.trialEndsAt !== undefined && {
          trialEndsAt: dto.trialEndsAt ? new Date(dto.trialEndsAt) : null,
        }),
      },
    });

    await this.auditLog.record({
      agencyId,
      actorType: AuditActorType.SUPER_ADMIN,
      action: AuditAction.UPDATE,
      entityType: AuditEntityType.AGENCY,
      entityId: updated.id,
      entityName: updated.name,
      description: `Agência "${updated.name}" atualizada pelo super-admin`,
      metadata: { fields: Object.keys(dto) },
    });

    return updated;
  }
}
