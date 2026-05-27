import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditAction, AuditEntityType, UserRole } from '@prisma/client';
import { InviteUserDto } from '../../presentation/dto/invite-user.dto';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class InviteUserUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
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

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tempPassword, // retornado apenas na criação para o admin compartilhar
    };
  }
}
