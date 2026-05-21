import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthenticatedUser } from '@common/decorators/current-user.decorator';

interface DeleteReportInput {
  agencyId: string;
  reportId: string;
  user: AuthenticatedUser;
}

@Injectable()
export class DeleteReportUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ agencyId, reportId, user }: DeleteReportInput): Promise<void> {
    const report = await this.prisma.report.findFirst({
      where: { id: reportId, agencyId },
    });

    if (!report) throw new NotFoundException('Relatório não encontrado');

    // Apenas AGENCY_ADMIN pode excluir relatórios
    if (user.role !== UserRole.AGENCY_ADMIN) {
      throw new ForbiddenException('Apenas administradores podem excluir relatórios');
    }

    await this.prisma.report.delete({
      where: { id: reportId },
    });
  }
}
