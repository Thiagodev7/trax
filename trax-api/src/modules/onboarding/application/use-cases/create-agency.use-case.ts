import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { AuditAction, AuditActorType, AuditEntityType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateAgencyDto } from '../../presentation/dto/create-agency.dto';
import { EmailService } from '../../../email/application/services/email.service';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';
import * as bcrypt from 'bcryptjs';

/** Normaliza telefone BR para armazenamento (+55 + 10 ou 11 dígitos) */
function normalizeBrazilPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  const local = digits.startsWith('55') && digits.length >= 12
    ? digits.slice(2)
    : digits
  if (local.length < 10 || local.length > 11) {
    throw new BadRequestException('Telefone inválido')
  }
  return `+55${local}`
}

export const RESERVED_SLUGS = [
  'www', 'api', 'admin', 'app', 'static', 'assets',
  'mail', 'smtp', 'ftp', 'cdn', 'media', 'trax',
] as const;

@Injectable()
export class CreateAgencyUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(dto: CreateAgencyDto) {
    const slug = dto.slug.toLowerCase();

    if (RESERVED_SLUGS.includes(slug as (typeof RESERVED_SLUGS)[number])) {
      throw new BadRequestException('Slug reservado ou inválido');
    }

    const existingSlug = await this.prisma.agency.findUnique({ where: { slug } });
    if (existingSlug) {
      throw new ConflictException('Este slug já está em uso');
    }

    // Trial ending in 14 days
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const passwordHash = await bcrypt.hash(dto.adminPassword, 10);
    const phone = normalizeBrazilPhone(dto.adminPhone);

    const result = await this.prisma.transaction(async (tx) => {
      // Create Agency
      const agency = await tx.agency.create({
        data: {
          name: dto.agencyName,
          slug,
          plan: 'TRIAL',
          trialEndsAt,
          maxCompanies: 2,
          maxUsers: 1,
          primaryColor: dto.primaryColor ?? '#6366F1',
          themeMode: dto.themeMode ?? 'dark',
        },
      });

      // Create Admin User
      const user = await tx.user.create({
        data: {
          agencyId: agency.id,
          name: dto.adminName,
          email: dto.adminEmail,
          phone,
          passwordHash,
          role: 'AGENCY_ADMIN',
          isActive: true,
        },
      });

      return { agency, user };
    });

    // Send welcome email asynchronously
    this.emailService.sendWelcomeEmail(dto.adminEmail, dto.agencyName, dto.adminName, slug);

    await this.auditLog.record({
      agencyId: result.agency.id,
      actorType: AuditActorType.SYSTEM,
      action: AuditAction.CREATE,
      entityType: AuditEntityType.AGENCY,
      entityId: result.agency.id,
      entityName: result.agency.name,
      description: `Agência "${result.agency.name}" criada via onboarding`,
      metadata: { slug, adminEmail: dto.adminEmail },
    });

    return {
      success: true,
      agency: {
        id: result.agency.id,
        name: result.agency.name,
        slug: result.agency.slug,
        primaryColor: result.agency.primaryColor,
      },
      message: 'Agência e administrador criados com sucesso',
    };
  }
}
