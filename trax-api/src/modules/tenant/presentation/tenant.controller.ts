import { Controller, Get, Version } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '@common/decorators/roles.decorator';
import { CurrentTenant } from '@common/decorators/current-tenant.decorator';
import { TenantContext } from '@common/context/tenant.context';
import { PrismaService } from '@/prisma/prisma.service';

@ApiTags('Tenant')
@Controller('tenant')
export class TenantController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Endpoint público consumido pelo Flutter Web na inicialização.
   * Retorna a identidade visual da agência com base no domínio da request.
   */
  @Public()
  @Get('resolve')
  @Version('1')
  @ApiOperation({ summary: 'Resolve identidade do tenant pelo domínio atual' })
  @ApiResponse({ status: 200, description: 'Dados do white-label da agência' })
  @ApiResponse({ status: 401, description: 'Domínio não mapeado a nenhuma agência' })
  async resolve(@CurrentTenant() tenant: TenantContext) {
    const agency = await this.prisma.agency.findUniqueOrThrow({
      where: { id: tenant.agencyId },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        faviconUrl: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        fontFamily: true,
        themeMode: true,
        borderRadius: true,
        portalLayout: true,
        loginLayout: true,
        loginBackgroundUrl: true,
        loginTitle: true,
        loginSubtitle: true,
        customCss: true,
      },
    });

    return {
      agencyId: agency.id,
      name: agency.name,
      slug: agency.slug,
      branding: {
        logoUrl: agency.logoUrl,
        faviconUrl: agency.faviconUrl,
        primaryColor: agency.primaryColor,
        secondaryColor: agency.secondaryColor,
        accentColor: agency.accentColor,
        fontFamily: agency.fontFamily,
        themeMode: agency.themeMode,
        borderRadius: agency.borderRadius,
        portalLayout: agency.portalLayout,
        loginLayout: agency.loginLayout,
        loginBackgroundUrl: agency.loginBackgroundUrl,
        loginTitle: agency.loginTitle,
        loginSubtitle: agency.loginSubtitle,
        customCss: agency.customCss,
      },
    };
  }
}
