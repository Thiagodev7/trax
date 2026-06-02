import { Injectable, BadRequestException } from '@nestjs/common';
import { AuditAction, AuditEntityType, ReportStatus, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '@/prisma/prisma.service';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';
import { EmailService } from '@modules/email/application/services/email.service';
import { ReportAiService } from '../services/report-ai.service';

@Injectable()
export class PublishReportUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly emailService: EmailService,
    private readonly reportAi: ReportAiService,
  ) {}

  async execute(agencyId: string, reportId: string) {
    const report = await this.prisma.report.findFirst({
      where: { id: reportId, agencyId },
      select: {
        id: true,
        title: true,
        status: true,
        periodStart: true,
        periodEnd: true,
        client: { select: { id: true, name: true } },
        agency: { select: { name: true, slug: true } },
        integrations: { select: { integrationId: true } },
      },
    });

    if (!report) {
      throw new BadRequestException('Relatório não encontrado');
    }

    if (report.status === ReportStatus.ARCHIVED) {
      throw new BadRequestException('Relatórios arquivados não podem ser publicados');
    }

    const shareToken = randomBytes(48).toString('base64url');

    const published = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.PUBLISHED,
        shareToken,
        publishedAt: new Date(),
      },
      select: {
        id: true,
        title: true,
        status: true,
        shareToken: true,
        publishedAt: true,
      },
    });

    await this.auditLog.record({
      agencyId,
      action: AuditAction.PUBLISH,
      entityType: AuditEntityType.REPORT,
      entityId: published.id,
      entityName: published.title,
      description: `Relatório "${published.title}" publicado`,
    });

    // Fire-and-forget: notificações de email e análise IA
    this.notifyUsers(agencyId, report.agency, report.client.name, published.title, published.shareToken!);
    this.generateAiAnalysis(reportId, report.title, report.client.name, report.periodStart, report.periodEnd, report.integrations.map(i => i.integrationId));

    return published;
  }

  private async notifyUsers(
    agencyId: string,
    agency: { name: string; slug: string },
    clientName: string,
    reportTitle: string,
    shareToken: string,
  ) {
    try {
      const users = await this.prisma.user.findMany({
        where: { agencyId, isActive: true, notifyReportPublished: true },
        select: { email: true, name: true },
      });
      const shareUrl = this.emailService.buildShareUrl(agency.slug, shareToken);
      for (const user of users) {
        this.emailService.sendReportPublished(user.email, user.name, agency.name, reportTitle, clientName, shareUrl);
      }
    } catch { /* falha não deve quebrar publicação */ }
  }

  private async generateAiAnalysis(
    reportId: string,
    reportTitle: string,
    clientName: string,
    periodStart: Date | null,
    periodEnd: Date | null,
    integrationIds: string[],
  ) {
    try {
      if (integrationIds.length === 0) return;

      const now = new Date();
      const from = periodStart ?? new Date(now.getFullYear(), now.getMonth(), 1);
      const to = periodEnd ?? now;

      const prevFrom = new Date(from);
      prevFrom.setMonth(prevFrom.getMonth() - 1);
      const prevTo = new Date(to);
      prevTo.setMonth(prevTo.getMonth() - 1);

      const [currMetrics, prevMetrics] = await Promise.all([
        this.prisma.dailyMetric.findMany({
          where: { integrationId: { in: integrationIds }, date: { gte: from, lte: to }, metricType: { in: ['campaign', 'summary'] } },
          select: { data: true },
        }),
        this.prisma.dailyMetric.findMany({
          where: { integrationId: { in: integrationIds }, date: { gte: prevFrom, lte: prevTo }, metricType: { in: ['campaign', 'summary'] } },
          select: { data: true },
        }),
      ]);

      const agg = (records: { data: unknown }[]) =>
        records.reduce(
          (acc, r) => {
            const d = r.data as Record<string, number>;
            return {
              spend: acc.spend + (d.spend ?? 0),
              leads: acc.leads + (d.leads ?? 0),
              impressions: acc.impressions + (d.impressions ?? 0),
              clicks: acc.clicks + (d.clicks ?? 0),
              ctrSum: acc.ctrSum + (d.ctr ?? 0),
              roasSum: acc.roasSum + (d.roas ?? 0),
              count: acc.count + 1,
            };
          },
          { spend: 0, leads: 0, impressions: 0, clicks: 0, ctrSum: 0, roasSum: 0, count: 0 },
        );

      const curr = agg(currMetrics);
      const prev = agg(prevMetrics);

      const period = `${from.toLocaleDateString('pt-BR')} – ${to.toLocaleDateString('pt-BR')}`;

      const aiResult = await this.reportAi.generateReportAnalysis({
        reportTitle,
        clientName,
        period,
        current: {
          spend: curr.spend,
          leads: curr.leads,
          impressions: curr.impressions,
          clicks: curr.clicks,
          ctr: curr.count > 0 ? curr.ctrSum / curr.count : undefined,
          roas: curr.count > 0 ? curr.roasSum / curr.count : undefined,
        },
        previous: prev.count > 0 ? {
          spend: prev.spend,
          leads: prev.leads,
          ctr: prev.ctrSum / prev.count,
          roas: prev.roasSum / prev.count,
        } : undefined,
      });

      const anomalies = this.reportAi.detectAnomalies({
        reportTitle,
        clientName,
        period,
        current: {
          spend: curr.spend,
          leads: curr.leads,
          ctr: curr.count > 0 ? curr.ctrSum / curr.count : undefined,
          roas: curr.count > 0 ? curr.roasSum / curr.count : undefined,
        },
        previous: prev.count > 0 ? { spend: prev.spend, leads: prev.leads, ctr: prev.ctrSum / prev.count, roas: prev.roasSum / prev.count } : undefined,
      });

      const insights = aiResult ? aiResult.insights : anomalies;

      await this.prisma.report.update({
        where: { id: reportId },
        data: {
          aiSummary: aiResult?.summary ?? null,
          aiInsights: insights.length > 0
            ? (insights as unknown as Prisma.InputJsonValue)
            : Prisma.DbNull,
          aiGeneratedAt: new Date(),
        },
      });
    } catch { /* análise de IA é opcional */ }
  }
}
