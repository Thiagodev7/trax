import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateAgencyDto } from '../../presentation/dto/create-agency.dto';
import { EmailService } from '../../../email/application/services/email.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class CreateAgencyUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async execute(dto: CreateAgencyDto) {
    const slug = dto.slug.toLowerCase();
    
    // Validate slug
    const reservedSlugs = ['www', 'api', 'admin', 'app', 'static', 'assets', 'trax'];
    if (reservedSlugs.includes(slug)) {
      throw new BadRequestException('Slug reservado ou inválido');
    }

    const existingSlug = await this.prisma.agency.findUnique({ where: { slug } });
    if (existingSlug) {
      throw new ConflictException('Este slug já está em uso');
    }

    const existingEmail = await this.prisma.user.findFirst({ where: { email: dto.adminEmail } });
    if (existingEmail) {
      throw new ConflictException('Este e-mail já está sendo usado por outro usuário');
    }

    // Trial ending in 14 days
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const passwordHash = await bcrypt.hash(dto.adminPassword, 10);

    const result = await this.prisma.transaction(async (tx) => {
      // Create Agency
      const agency = await tx.agency.create({
        data: {
          name: dto.agencyName,
          slug,
          plan: 'TRIAL',
          trialEndsAt,
          maxClients: 2,
          maxUsers: 1,
        },
      });

      // Create Admin User
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

    // Send welcome email asynchronously
    this.emailService.sendWelcomeEmail(dto.adminEmail, dto.agencyName, dto.adminName);

    return {
      success: true,
      agency: {
        id: result.agency.id,
        name: result.agency.name,
        slug: result.agency.slug,
      },
      message: 'Agência e administrador criados com sucesso',
    };
  }
}
