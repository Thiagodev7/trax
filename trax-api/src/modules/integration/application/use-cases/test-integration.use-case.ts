import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction, AuditEntityType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { decryptCredentials } from '../crypto.helper';
import { MetaAdsService } from '../services/meta-ads.service';
import { GoogleAdsService } from '../services/google-ads.service';
import { InstagramService } from '../services/instagram.service';
import { FacebookPageService } from '../services/facebook-page.service';
import { NectarCrmService } from '../services/nectar-crm.service';
import { RdStationService } from '../services/rd-station.service';
import { AuditLogService } from '@modules/audit-log/application/services/audit-log.service';

@Injectable()
export class TestIntegrationUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metaAds: MetaAdsService,
    private readonly googleAds: GoogleAdsService,
    private readonly instagram: InstagramService,
    private readonly fbPage: FacebookPageService,
    private readonly nectar: NectarCrmService,
    private readonly rdStation: RdStationService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(agencyId: string, integrationId: string): Promise<{ valid: boolean; name?: string; error?: string }> {
    const integration = await this.prisma.integration.findFirst({
      where: { id: integrationId, agencyId },
    });
    if (!integration) throw new NotFoundException('Integração não encontrada.');

    let result: { valid: boolean; name?: string };
    try {
      const creds = decryptCredentials(integration.credentialsEnc);

      switch (integration.provider) {
        case 'META_ADS':
          result = await this.metaAds.testConnection(creds as any);
          break;
        case 'GOOGLE_ADS':
          result = await this.googleAds.testConnection(creds as any);
          break;
        case 'INSTAGRAM':
          result = await this.instagram.testConnection(creds as any);
          break;
        case 'FACEBOOK_PAGE':
          result = await this.fbPage.testConnection(creds as any);
          break;
        case 'NECTAR_CRM':
          result = await this.nectar.testConnection(creds as any);
          break;
        case 'RD_STATION':
          result = await this.rdStation.testConnection(creds as any);
          break;
        default:
          result = { valid: false };
      }
    } catch (err: any) {
      result = { valid: false };
      await this.prisma.integration.update({
        where: { id: integrationId },
        data: { status: 'ERROR', lastErrorMsg: err.message },
      });
      await this.auditLog.record({
        agencyId,
        action: AuditAction.TEST,
        entityType: AuditEntityType.INTEGRATION,
        entityId: integration.id,
        entityName: integration.displayName ?? integration.provider,
        description: `Teste de conexão falhou: ${integration.provider}`,
        metadata: { error: err.message },
      });
      return { valid: false, error: err.message };
    }

    await this.prisma.integration.update({
      where: { id: integrationId },
      data: { status: result.valid ? 'ACTIVE' : 'ERROR' },
    });

    await this.auditLog.record({
      agencyId,
      action: AuditAction.TEST,
      entityType: AuditEntityType.INTEGRATION,
      entityId: integration.id,
      entityName: integration.displayName ?? integration.provider,
      description: result.valid
        ? `Teste de conexão OK: ${integration.provider}`
        : `Teste de conexão falhou: ${integration.provider}`,
      metadata: { valid: result.valid },
    });

    return result;
  }
}
