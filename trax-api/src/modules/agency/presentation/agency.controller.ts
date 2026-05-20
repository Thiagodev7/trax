import { Controller, Get, Patch, Body, Version } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentTenant } from '@common/decorators/current-tenant.decorator';
import { GetAgencyBrandingUseCase } from '../application/use-cases/get-agency-branding.use-case';
import { UpdateAgencyBrandingUseCase } from '../application/use-cases/update-agency-branding.use-case';
import { UpdateAgencyBrandingDto } from './dto/update-agency-branding.dto';

@ApiBearerAuth()
@ApiTags('Agency')
@Controller('agency')
export class AgencyController {
  constructor(
    private readonly getAgencyBranding: GetAgencyBrandingUseCase,
    private readonly updateAgencyBranding: UpdateAgencyBrandingUseCase,
  ) {}

  @Get('branding')
  @Version('1')
  @ApiOperation({ summary: 'Retorna configurações de white-label da agência atual' })
  async getBranding(@CurrentTenant('agencyId') agencyId: string) {
    return this.getAgencyBranding.execute(agencyId);
  }

  @Patch('branding')
  @Version('1')
  @Roles(UserRole.AGENCY_ADMIN)
  @ApiOperation({ summary: 'Atualiza identidade visual da agência (somente AGENCY_ADMIN)' })
  async updateBranding(
    @CurrentTenant('agencyId') agencyId: string,
    @Body() dto: UpdateAgencyBrandingDto,
  ) {
    return this.updateAgencyBranding.execute(agencyId, dto);
  }
}
