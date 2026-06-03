import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AgencyPlan, AuditAction, AuditActorType, AuditEntityType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@/prisma/prisma.service';
import { EmailService } from '@modules/email/application/services/email.service';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';
import { CreateAgencyBySuperAdminDto } from '../../presentation/dto/create-agency.dto';

const RESERVED_SLUGS = ['www', 'api', 'admin', 'app', 'static', 'assets', 'trax', 'landing'];

const PLAN_DEFAULTS: Record<AgencyPlan, { maxCompanies: number; maxUsers: number }> = {
  TRIAL: { maxCompanies: 2, maxUsers: 1 },
  STARTER: { maxCompanies: 5, maxUsers: 3 },
  PRO: { maxCompanies: 15, maxUsers: 10 },
  AGENCY: { maxCompanies: 50, maxUsers: 25 },
  ENTERPRISE: { maxCompanies: 999, maxUsers: 100 },
};

@Injectable()
export class CreateAgencyBySuperAdminUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(dto: CreateAgencyBySuperAdminDto) {
    const slug = dto.slug.toLowerCase();

    if (RESERVED_SLUGS.includes(slug)) {
      throw new BadRequestException('Slug reservado ou inválido');
    }

    const existingSlug = await this.prisma.agency.findUnique({ where: { slug } });
    if (existingSlug) {
      throw new ConflictException('Este slug já está em uso');
    }

    const plan = dto.plan ?? AgencyPlan.TRIAL;
    const defaults = PLAN_DEFAULTS[plan];
    const maxCompanies = dto.maxCompanies ?? defaults.maxCompanies;
    const maxUsers = dto.maxUsers ?? defaults.maxUsers;
    const isActive = dto.isActive ?? true;

    let trialEndsAt: Date | null = null;
    if (dto.trialEndsAt) {
      trialEndsAt = new Date(dto.trialEndsAt);
    } else if (plan === AgencyPlan.TRIAL) {
      trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);
    }

    const passwordHash = await bcrypt.hash(dto.adminPassword, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const agency = await tx.agency.create({
        data: {
          name: dto.name,
          slug,
          plan,
          trialEndsAt,
          maxCompanies,
          maxUsers,
          isActive,
        },
      });

      const user = await tx.user.create({
        data: {
          agencyId: agency.id,
          name: dto.adminName,
          email: dto.adminEmail,
          passwordHash,
          role: 'AGENCY_ADMIN',
          isActive: true,
        },
      });

      return { agency, user };
    });

    this.emailService.sendWelcomeEmail(dto.adminEmail, dto.name, dto.adminName, slug);

    await this.auditLog.record({
      agencyId: result.agency.id,
      actorType: AuditActorType.SUPER_ADMIN,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.AGENCY,
      entityId: result.agency.id,
      entityName: result.agency.name,
      description: `Agência "${result.agency.name}" provisionada pelo super-admin`,
      metadata: { slug, plan, adminEmail: dto.adminEmail },
    });

    const baseDomain =
      this.configService.get<string>('TRAX_BASE_DOMAIN') ?? 'traxsolucoes.com.br';

    return {
      agency: result.agency,
      admin: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      tenantUrl: `https://${slug}.${baseDomain}`,
    };
  }
}
