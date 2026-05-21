import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { decryptCredentials } from '../crypto.helper';
import { MetaAdsService } from '../services/meta-ads.service';
import { InstagramService } from '../services/instagram.service';
import { FacebookPageService } from '../services/facebook-page.service';
import { NectarCrmService } from '../services/nectar-crm.service';

@Injectable()
export class TestIntegrationUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metaAds: MetaAdsService,
    private readonly instagram: InstagramService,
    private readonly fbPage: FacebookPageService,
    private readonly nectar: NectarCrmService,
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
        case 'INSTAGRAM':
          result = await this.instagram.testConnection(creds as any);
          break;
        case 'FACEBOOK_PAGE':
          result = await this.fbPage.testConnection(creds as any);
          break;
        case 'NECTAR_CRM':
          result = await this.nectar.testConnection(creds as any);
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
      return { valid: false, error: err.message };
    }

    await this.prisma.integration.update({
      where: { id: integrationId },
      data: { status: result.valid ? 'ACTIVE' : 'ERROR' },
    });

    return result;
  }
}
