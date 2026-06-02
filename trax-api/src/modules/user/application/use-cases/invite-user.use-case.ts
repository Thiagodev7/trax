import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditAction, AuditEntityType, UserRole } from '@prisma/client';
import { InviteUserDto } from '../../presentation/dto/invite-user.dto';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';
import { EmailService } from '@modules/email/application/services/email.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class InviteUserUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly emailService: EmailService,
  ) {}

  async execute(agencyId: string, dto: InviteUserDto) {
    // Verificar se email já existe na agência
    const existing = await this.prisma.user.findUnique({
      where: { agencyId_email: { agencyId, email: dto.email } },
    });
    if (existing) {
      throw new ConflictException('Este email já está cadastrado nesta agência.');
    }

    // CLIENT_VIEWER precisa de pelo menos um cliente
    if (dto.role === UserRole.CLIENT_VIEWER && (!dto.clientIds || dto.clientIds.length === 0)) {
      throw new BadRequestException('CLIENT_VIEWER precisa ter ao menos um cliente associado.');
    }

    // Verificar limite de usuários do plano
    const agency = await this.prisma.agency.findUnique({
      where: { id: agencyId },
      select: { maxUsers: true, plan: true, name: true, slug: true },
    });
    if (!agency) throw new BadRequestException('Agência não encontrada.');

    const userCount = await this.prisma.user.count({ where: { agencyId, isActive: true } });
    if (userCount >= agency.maxUsers) {
      throw new BadRequestException(
        `Limite de ${agency.maxUsers} usuário(s) atingido para o plano ${agency.plan}. Faça upgrade para convidar mais membros.`,
      );
    }

    // Senha temporária (o usuário deverá alterar no primeiro acesso)
    const tempPassword = Math.random().toString(36).slice(-10);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const user = await this.prisma.user.create({
      data: {
        agencyId,
        email: dto.email,
        name: dto.name,
        role: dto.role,
        passwordHash,
        isActive: true,
      },
    });

    // Vincular clientes ao CLIENT_VIEWER
    if (dto.role === UserRole.CLIENT_VIEWER && dto.clientIds?.length) {
      await this.prisma.userClient.createMany({
        data: dto.clientIds.map((clientId) => ({
          userId: user.id,
          clientId,
          agencyId,
        })),
        skipDuplicates: true,
      });
    }

    await this.auditLog.record({
      agencyId,
      action: AuditAction.INVITE,
      entityType: AuditEntityType.USER,
      entityId: user.id,
      entityName: user.name,
      description: `Usuário "${user.name}" convidado (${user.role})`,
      metadata: { email: user.email, role: user.role },
    });

    // Envia credenciais por e-mail de forma assíncrona
    this.emailService.sendUserInvite(
      dto.email,
      dto.name,
      agency.name,
      agency.slug,
      tempPassword,
    );

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tempPassword, // também retornado para o admin copiar diretamente na UI
    };
  }
}
